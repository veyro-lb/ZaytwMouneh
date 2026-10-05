-- Zayt w Mouneh — Wholesale & Business Orders
-- Dedicated B2B lead capture and lightweight CRM. Retail orders remain separate.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon,authenticated;

create table if not exists public.wholesale_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  business_name text not null check (char_length(trim(business_name)) between 2 and 180),
  contact_name text not null check (char_length(trim(contact_name)) between 2 and 160),
  business_type text not null check (business_type in ('restaurant','cafe','bakery','catering','grocery_store','minimarket','specialty_food_shop','hotel_hospitality','corporate_office','distributor','other')),
  custom_business_type text null check (custom_business_type is null or char_length(trim(custom_business_type)) <= 180),
  phone text not null check (regexp_replace(phone,'\\D','','g') ~ '^[0-9]{7,20}$'),
  email text null check (email is null or email = '' or email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'),
  location text not null check (char_length(trim(location)) between 2 and 220),
  website_or_instagram text null check (website_or_instagram is null or char_length(trim(website_or_instagram)) <= 300),
  purchase_frequency text not null default 'not_sure' check (purchase_frequency in ('one_time','weekly','biweekly','monthly','seasonal','not_sure')),
  approximate_volume text null check (approximate_volume is null or approximate_volume in ('not_sure','under_100','100_250','250_500','500_1000','1000_plus','prefer_not')),
  first_order_timing text not null default 'exploring' check (first_order_timing in ('asap','within_week','within_2_4_weeks','more_than_month','exploring')),
  priorities text[] not null default '{}'::text[],
  current_supplier_status text null check (current_supplier_status is null or current_supplier_status in ('yes','no','some','prefer_not')),
  supplier_switch_reason text null check (supplier_switch_reason is null or char_length(supplier_switch_reason) <= 1200),
  unlisted_products text null check (unlisted_products is null or char_length(unlisted_products) <= 1600),
  notes text null check (notes is null or char_length(notes) <= 2500),
  preferred_contact_method text not null check (preferred_contact_method in ('whatsapp','phone','email')),
  locale text not null default 'en' check (locale in ('en','ar','fr')),
  consent boolean not null default false check (consent = true),
  source text not null default 'wholesale_page' check (source = 'wholesale_page'),
  status text not null default 'new' check (status in ('new','contacted','needs_information','quote_preparing','quote_sent','negotiating','approved','converted','lost','archived')),
  assigned_owner uuid null references auth.users(id) on delete set null,
  internal_notes text null check (internal_notes is null or char_length(internal_notes) <= 5000),
  last_contacted_at timestamptz null,
  next_follow_up_at timestamptz null,
  converted_customer_id uuid null,
  constraint wholesale_other_business_type check (business_type <> 'other' or char_length(trim(coalesce(custom_business_type,''))) >= 2)
);

create table if not exists public.wholesale_lead_items (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.wholesale_leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  product_id text not null check (char_length(product_id) between 1 and 180),
  product_name_snapshot text not null check (char_length(trim(product_name_snapshot)) between 1 and 220),
  selected_variant text null check (selected_variant is null or char_length(selected_variant) <= 180),
  requested_quantity numeric(12,3) not null check (requested_quantity > 0 and requested_quantity <= 1000000),
  requested_unit text not null check (requested_unit in ('units','cases','kilograms','bottles','packs','other')),
  notes text null check (notes is null or char_length(notes) <= 600)
);

create index if not exists wholesale_leads_created_idx on public.wholesale_leads(created_at desc);
create index if not exists wholesale_leads_status_created_idx on public.wholesale_leads(status,created_at desc);
create index if not exists wholesale_leads_follow_up_idx on public.wholesale_leads(next_follow_up_at) where next_follow_up_at is not null and status not in ('converted','lost','archived');
create index if not exists wholesale_lead_items_lead_idx on public.wholesale_lead_items(lead_id);
create index if not exists wholesale_lead_items_product_idx on public.wholesale_lead_items(product_id);

alter table public.wholesale_leads enable row level security;
alter table public.wholesale_lead_items enable row level security;

revoke all on table public.wholesale_leads from public,anon,authenticated;
revoke all on table public.wholesale_lead_items from public,anon,authenticated;
grant select,update on table public.wholesale_leads to authenticated;
grant select on table public.wholesale_lead_items to authenticated;

drop policy if exists "admins can read wholesale leads" on public.wholesale_leads;
create policy "admins can read wholesale leads" on public.wholesale_leads for select to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));

drop policy if exists "admins can update wholesale leads" on public.wholesale_leads;
create policy "admins can update wholesale leads" on public.wholesale_leads for update to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));

drop policy if exists "admins can read wholesale lead items" on public.wholesale_lead_items;
create policy "admins can read wholesale lead items" on public.wholesale_lead_items for select to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));

create or replace function private.submit_wholesale_enquiry_core(p jsonb)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  lead_id uuid:=gen_random_uuid();
  item jsonb;
  item_count integer:=0;
  clean_priorities text[]:='{}'::text[];
  bt text:=coalesce(nullif(p->>'business_type',''),'other');
  cm text:=coalesce(nullif(p->>'preferred_contact_method',''),'whatsapp');
  loc text:=coalesce(nullif(p->>'locale',''),'en');
begin
  if p is null or jsonb_typeof(p)<>'object' then raise exception 'Invalid wholesale request'; end if;
  if bt not in ('restaurant','cafe','bakery','catering','grocery_store','minimarket','specialty_food_shop','hotel_hospitality','corporate_office','distributor','other') then raise exception 'Invalid business type'; end if;
  if cm not in ('whatsapp','phone','email') then raise exception 'Invalid contact method'; end if;
  if loc not in ('en','ar','fr') then raise exception 'Invalid locale'; end if;
  if coalesce((p->>'consent')::boolean,false) is not true then raise exception 'Consent required'; end if;

  if jsonb_typeof(coalesce(p->'priorities','[]'::jsonb))='array' then
    select coalesce(array_agg(left(v,80)),'{}'::text[]) into clean_priorities
    from jsonb_array_elements_text(coalesce(p->'priorities','[]'::jsonb)) x(v)
    where v in ('product_quality','consistent_supply','lebanese_origin','wholesale_pricing','bulk_packaging','delivery_reliability','product_variety','recurring_ordering','other');
  end if;

  insert into public.wholesale_leads(
    id,business_name,contact_name,business_type,custom_business_type,phone,email,location,website_or_instagram,
    purchase_frequency,approximate_volume,first_order_timing,priorities,current_supplier_status,supplier_switch_reason,
    unlisted_products,notes,preferred_contact_method,locale,consent,source,status
  ) values (
    lead_id,left(trim(coalesce(p->>'business_name','')),180),left(trim(coalesce(p->>'contact_name','')),160),bt,
    nullif(left(trim(coalesce(p->>'custom_business_type','')),180),''),
    left(trim(coalesce(p->>'phone','')),60),nullif(left(trim(coalesce(p->>'email','')),254),''),
    left(trim(coalesce(p->>'location','')),220),nullif(left(trim(coalesce(p->>'website_or_instagram','')),300),''),
    coalesce(nullif(p->>'purchase_frequency',''),'not_sure'),nullif(p->>'approximate_volume',''),
    coalesce(nullif(p->>'first_order_timing',''),'exploring'),clean_priorities,nullif(p->>'current_supplier_status',''),
    nullif(left(trim(coalesce(p->>'supplier_switch_reason','')),1200),''),
    nullif(left(trim(coalesce(p->>'unlisted_products','')),1600),''),
    nullif(left(trim(coalesce(p->>'notes','')),2500),''),cm,loc,true,'wholesale_page','new'
  );

  if jsonb_typeof(coalesce(p->'items','[]'::jsonb))='array' then
    for item in select value from jsonb_array_elements(coalesce(p->'items','[]'::jsonb))
    loop
      item_count:=item_count+1;
      if item_count>100 then raise exception 'Too many requested products'; end if;
      if coalesce(nullif(item->>'requested_unit',''),'units') not in ('units','cases','kilograms','bottles','packs','other') then raise exception 'Invalid requested unit'; end if;
      insert into public.wholesale_lead_items(lead_id,product_id,product_name_snapshot,selected_variant,requested_quantity,requested_unit,notes)
      values(
        lead_id,left(trim(coalesce(item->>'product_id','')),180),left(trim(coalesce(item->>'product_name_snapshot','')),220),
        nullif(left(trim(coalesce(item->>'selected_variant','')),180),''),
        (item->>'requested_quantity')::numeric,coalesce(nullif(item->>'requested_unit',''),'units'),
        nullif(left(trim(coalesce(item->>'notes','')),600),'')
      );
    end loop;
  end if;
  if item_count=0 and char_length(trim(coalesce(p->>'unlisted_products','')))=0 then raise exception 'Add at least one product or describe products not listed'; end if;
  return lead_id;
end $$;

revoke all on function private.submit_wholesale_enquiry_core(jsonb) from public;
grant execute on function private.submit_wholesale_enquiry_core(jsonb) to anon,authenticated;

create or replace function public.submit_wholesale_enquiry(p jsonb)
returns uuid language sql security invoker set search_path=''
as $$ select private.submit_wholesale_enquiry_core(p) $$;
revoke all on function public.submit_wholesale_enquiry(jsonb) from public;
grant execute on function public.submit_wholesale_enquiry(jsonb) to anon,authenticated;

alter table public.site_events drop constraint if exists site_events_event_name_check;
alter table public.site_events add constraint site_events_event_name_check check(event_name in (
 'page_view','product_view','add_to_cart','whatsapp_click','search','cart_opened','checkout_started','checkout_completed','order_delivered',
 'wholesale_page_view','wholesale_request_started','wholesale_product_added','wholesale_request_submitted','wholesale_request_failed'
));
drop policy if exists "site can insert analytics events" on public.site_events;
create policy "site can insert analytics events" on public.site_events for insert to anon,authenticated
with check (
 event_name=any(array['page_view','product_view','add_to_cart','whatsapp_click','search','cart_opened','checkout_started','checkout_completed','order_delivered','wholesale_page_view','wholesale_request_started','wholesale_product_added','wholesale_request_submitted','wholesale_request_failed'])
 and char_length(page_path)<=300 and coalesce(char_length(session_id),0)<=80 and coalesce(char_length(referrer_host),0)<=180
);
