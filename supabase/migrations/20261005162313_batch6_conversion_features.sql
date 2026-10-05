-- Batch 6: conversion features
-- Applied to production as Supabase migration 20261005162313 / batch6_conversion_features.

create table if not exists public.storefront_reviews (
  id uuid primary key,
  product_id text not null check (char_length(product_id) between 1 and 180),
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 3 and 1000),
  verified_purchase boolean not null default true check (verified_purchase = true),
  created_at timestamptz not null default now()
);

alter table public.storefront_reviews enable row level security;
revoke all on table public.storefront_reviews from public, anon, authenticated;
grant select on table public.storefront_reviews to anon, authenticated;

drop policy if exists "public can read verified storefront reviews" on public.storefront_reviews;
create policy "public can read verified storefront reviews"
on public.storefront_reviews for select
to anon, authenticated
using (verified_purchase = true);

create index if not exists storefront_reviews_product_created_idx
on public.storefront_reviews(product_id, created_at desc);

create or replace function mouneh.sync_storefront_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.storefront_reviews where id = old.id;
    return old;
  end if;

  insert into public.storefront_reviews(id, product_id, rating, body, verified_purchase, created_at)
  values (new.id, new.product_id, new.rating, new.body, true, new.created_at)
  on conflict (id) do update
  set product_id = excluded.product_id,
      rating = excluded.rating,
      body = excluded.body,
      verified_purchase = true,
      created_at = excluded.created_at;
  return new;
end;
$$;

revoke execute on function mouneh.sync_storefront_review() from public, anon, authenticated;

drop trigger if exists sync_storefront_review_after_write on mouneh.reviews;
create trigger sync_storefront_review_after_write
after insert or update or delete on mouneh.reviews
for each row execute function mouneh.sync_storefront_review();

insert into public.storefront_reviews(id, product_id, rating, body, verified_purchase, created_at)
select id, product_id, rating, body, true, created_at
from mouneh.reviews
on conflict (id) do update
set product_id = excluded.product_id,
    rating = excluded.rating,
    body = excluded.body,
    verified_purchase = true,
    created_at = excluded.created_at;

create table if not exists public.back_in_stock_requests (
  id uuid primary key default gen_random_uuid(),
  product_id text not null check (char_length(product_id) between 1 and 180),
  channel text not null check (channel in ('email','whatsapp')),
  contact_value text not null check (char_length(trim(contact_value)) between 5 and 254),
  locale text not null default 'en' check (locale in ('en','ar','fr')),
  status text not null default 'pending' check (status in ('pending','notified','cancelled')),
  source text not null default 'product_page' check (char_length(source) between 1 and 80),
  created_at timestamptz not null default now(),
  notified_at timestamptz null,
  constraint back_in_stock_contact_format check (
    (channel = 'email' and contact_value ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
    or
    (channel = 'whatsapp' and regexp_replace(contact_value, '\D', '', 'g') ~ '^[0-9]{7,20}$')
  )
);

alter table public.back_in_stock_requests enable row level security;
revoke all on table public.back_in_stock_requests from public, anon, authenticated;
grant insert on table public.back_in_stock_requests to anon, authenticated;
grant select, update, delete on table public.back_in_stock_requests to authenticated;

create unique index if not exists back_in_stock_pending_unique
on public.back_in_stock_requests(product_id, channel, lower(contact_value))
where status = 'pending';

create index if not exists back_in_stock_status_created_idx
on public.back_in_stock_requests(status, created_at desc);

drop policy if exists "site can create stock alert requests" on public.back_in_stock_requests;
create policy "site can create stock alert requests"
on public.back_in_stock_requests for insert
to anon, authenticated
with check (
  status = 'pending'
  and notified_at is null
  and locale in ('en','ar','fr')
  and source in ('product_page','product_modal')
  and created_at between now() - interval '5 minutes' and now() + interval '5 minutes'
);

drop policy if exists "admins can read stock alert requests" on public.back_in_stock_requests;
create policy "admins can read stock alert requests"
on public.back_in_stock_requests for select
to authenticated
using (exists (
  select 1 from public.admin_users a
  where a.user_id = (select auth.uid())
));

drop policy if exists "admins can update stock alert requests" on public.back_in_stock_requests;
create policy "admins can update stock alert requests"
on public.back_in_stock_requests for update
to authenticated
using (exists (
  select 1 from public.admin_users a
  where a.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.admin_users a
  where a.user_id = (select auth.uid())
));

drop policy if exists "admins can delete stock alert requests" on public.back_in_stock_requests;
create policy "admins can delete stock alert requests"
on public.back_in_stock_requests for delete
to authenticated
using (exists (
  select 1 from public.admin_users a
  where a.user_id = (select auth.uid())
));

insert into public.site_settings(key, value)
values (
  'commerce',
  jsonb_build_object(
    'payment_methods', jsonb_build_array(
      jsonb_build_object(
        'id','cash_on_delivery',
        'enabled',true,
        'label_en','Cash on Delivery',
        'label_ar','الدفع عند الاستلام',
        'label_fr','Paiement à la livraison'
      )
    ),
    'back_in_stock_enabled', true,
    'corporate_gifting_enabled', true,
    'scheduled_gift_delivery_enabled', true
  )
)
on conflict (key) do nothing;
