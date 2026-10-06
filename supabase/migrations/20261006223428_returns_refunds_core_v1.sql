-- Zayt W Mouneh — returns, exchanges, refunds and product issues core schema.
-- Source mirror of production migration 20261006223428.

create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  public_request_number text not null unique check (public_request_number ~ '^ZWM-RR-[A-Z0-9]{8}$'),
  order_reference text not null references public.orders(reference) on delete restrict,
  customer_id uuid references auth.users(id) on delete set null,
  client_request_id uuid not null unique,
  request_type text not null default 'product_issue' check (request_type in ('product_issue','return_exchange')),
  reason_code text not null check (reason_code in ('damaged','leaking_broken','wrong_product','missing_item','quality_safety','unopened_return','other')),
  status text not null default 'submitted' check (status in ('submitted','under_review','awaiting_customer','return_authorized','received','approved','rejected','resolution_in_progress','completed','cancelled')),
  requested_resolution text check (requested_resolution is null or requested_resolution in ('replacement','exchange','partial_refund','full_affected_item_refund','other')),
  resolution_type text not null default 'none' check (resolution_type in ('none','replacement','exchange','partial_refund','full_refund')),
  refund_status text not null default 'not_required' check (refund_status in ('not_required','pending','processing','completed','failed')),
  customer_description text not null check (char_length(customer_description) between 3 and 3000),
  discovered_at timestamptz,
  submitted_at timestamptz not null default now(),
  review_started_at timestamptz,
  resolved_at timestamptz,
  cancelled_at timestamptz,
  assigned_admin_id uuid references auth.users(id) on delete set null,
  visible_issue_reported_late boolean not null default false,
  change_of_mind_manual_date_review boolean not null default false,
  safety_flag boolean not null default false,
  return_not_required boolean not null default false,
  additional_review_recommended boolean not null default false,
  customer_visible_resolution text check (customer_visible_resolution is null or char_length(customer_visible_resolution) <= 2000),
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 1200),
  internal_note text check (internal_note is null or char_length(internal_note) <= 3000),
  approved_refund_total numeric(12,2) not null default 0 check (approved_refund_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists return_requests_order_idx on public.return_requests(order_reference,submitted_at desc);
create index if not exists return_requests_customer_idx on public.return_requests(customer_id,submitted_at desc) where customer_id is not null;
create index if not exists return_requests_status_idx on public.return_requests(status,submitted_at desc);
create index if not exists return_requests_safety_idx on public.return_requests(safety_flag,submitted_at desc) where safety_flag;

create table if not exists public.return_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.return_requests(id) on delete cascade,
  line_index integer not null check (line_index > 0),
  line_key text not null check (char_length(line_key) between 1 and 220),
  product_id text,
  variant_id text,
  product_name text not null check (char_length(product_name) between 1 and 300),
  variant_name text,
  purchased_quantity integer not null check (purchased_quantity > 0),
  quantity_requested integer not null check (quantity_requested > 0 and quantity_requested <= purchased_quantity),
  approved_quantity integer check (approved_quantity is null or (approved_quantity >= 0 and approved_quantity <= purchased_quantity)),
  line_gross_amount numeric(12,2) not null default 0 check (line_gross_amount >= 0),
  line_net_paid_amount numeric(12,2) not null default 0 check (line_net_paid_amount >= 0),
  approved_refund_amount numeric(12,2) not null default 0 check (approved_refund_amount >= 0),
  condition_declared text,
  received_at timestamptz,
  inspected_at timestamptz,
  inspection_condition text,
  inventory_disposition text check (inventory_disposition is null or inventory_disposition in ('not_restockable','restockable','dispose')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(request_id,line_index)
);
create index if not exists return_request_items_line_idx on public.return_request_items(line_index,request_id);

create table if not exists public.return_request_evidence (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.return_requests(id) on delete restrict,
  request_item_id uuid references public.return_request_items(id) on delete set null,
  storage_path text not null unique check (char_length(storage_path) between 10 and 500),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  file_size integer not null check (file_size > 0 and file_size <= 5242880),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists return_request_evidence_request_idx on public.return_request_evidence(request_id,created_at);

create table if not exists public.return_request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.return_requests(id) on delete restrict,
  sender_id uuid references auth.users(id) on delete set null,
  sender_role text not null check (sender_role in ('customer','admin','system')),
  visibility text not null check (visibility in ('customer','internal')),
  message text not null check (char_length(message) between 1 and 3000),
  created_at timestamptz not null default now()
);
create index if not exists return_request_messages_request_idx on public.return_request_messages(request_id,created_at);

create table if not exists public.return_request_events (
  id bigint generated by default as identity primary key,
  request_id uuid not null references public.return_requests(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (char_length(event_type) between 1 and 100),
  previous_state jsonb not null default '{}'::jsonb check (jsonb_typeof(previous_state)='object'),
  new_state jsonb not null default '{}'::jsonb check (jsonb_typeof(new_state)='object'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  customer_visible boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists return_request_events_request_idx on public.return_request_events(request_id,created_at);

create table if not exists public.refund_transactions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.return_requests(id) on delete restrict,
  order_reference text not null references public.orders(reference) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD' check (currency='USD'),
  method text,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','cancelled')),
  external_reference text,
  idempotency_key uuid not null unique,
  processed_by uuid references auth.users(id) on delete set null,
  processed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(request_id)
);
create index if not exists refund_transactions_status_idx on public.refund_transactions(status,created_at desc);
create index if not exists refund_transactions_order_idx on public.refund_transactions(order_reference,created_at desc);

create table if not exists public.return_fulfillments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.return_requests(id) on delete restrict,
  order_reference text not null references public.orders(reference) on delete restrict,
  fulfillment_type text not null check (fulfillment_type in ('replacement','exchange')),
  status text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
  replacement_details jsonb not null default '{}'::jsonb check (jsonb_typeof(replacement_details)='object'),
  exchange_difference numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.return_requests enable row level security;
alter table public.return_request_items enable row level security;
alter table public.return_request_evidence enable row level security;
alter table public.return_request_messages enable row level security;
alter table public.return_request_events enable row level security;
alter table public.refund_transactions enable row level security;
alter table public.return_fulfillments enable row level security;

revoke all on public.return_requests,public.return_request_items,public.return_request_evidence,public.return_request_messages,public.return_request_events,public.refund_transactions,public.return_fulfillments from anon,authenticated;

drop policy if exists "owner/admin read return_requests" on public.return_requests;
create policy "owner/admin read return_requests" on public.return_requests for select to authenticated using (
  exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
  or customer_id=(select auth.uid())
  or exists(select 1 from mouneh.order_links l where l.reference=order_reference and l.user_id=(select auth.uid()))
  or exists(select 1 from public.orders o where o.reference=order_reference and o.customer_id=(select auth.uid()))
);
drop policy if exists "owner/admin read return_request_items" on public.return_request_items;
create policy "owner/admin read return_request_items" on public.return_request_items for select to authenticated using (
  exists(select 1 from public.return_requests r where r.id=request_id and (
    exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())) or r.customer_id=(select auth.uid())
    or exists(select 1 from mouneh.order_links l where l.reference=r.order_reference and l.user_id=(select auth.uid()))
    or exists(select 1 from public.orders o where o.reference=r.order_reference and o.customer_id=(select auth.uid()))
  ))
);
drop policy if exists "owner/admin read return_request_evidence" on public.return_request_evidence;
create policy "owner/admin read return_request_evidence" on public.return_request_evidence for select to authenticated using (
  exists(select 1 from public.return_requests r where r.id=request_id and (
    exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())) or r.customer_id=(select auth.uid())
    or exists(select 1 from mouneh.order_links l where l.reference=r.order_reference and l.user_id=(select auth.uid()))
    or exists(select 1 from public.orders o where o.reference=r.order_reference and o.customer_id=(select auth.uid()))
  ))
);
drop policy if exists "owner/admin read return_request_messages" on public.return_request_messages;
create policy "owner/admin read return_request_messages" on public.return_request_messages for select to authenticated using (
  (visibility='customer' or exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
  and exists(select 1 from public.return_requests r where r.id=request_id and (
    exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())) or r.customer_id=(select auth.uid())
    or exists(select 1 from mouneh.order_links l where l.reference=r.order_reference and l.user_id=(select auth.uid()))
    or exists(select 1 from public.orders o where o.reference=r.order_reference and o.customer_id=(select auth.uid()))
  ))
);
drop policy if exists "owner/admin read return_request_events" on public.return_request_events;
create policy "owner/admin read return_request_events" on public.return_request_events for select to authenticated using (
  (customer_visible or exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())))
  and exists(select 1 from public.return_requests r where r.id=request_id and (
    exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())) or r.customer_id=(select auth.uid())
    or exists(select 1 from mouneh.order_links l where l.reference=r.order_reference and l.user_id=(select auth.uid()))
    or exists(select 1 from public.orders o where o.reference=r.order_reference and o.customer_id=(select auth.uid()))
  ))
);
drop policy if exists "owner/admin read refund_transactions" on public.refund_transactions;
create policy "owner/admin read refund_transactions" on public.refund_transactions for select to authenticated using (
  exists(select 1 from public.return_requests r where r.id=request_id and (
    exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())) or r.customer_id=(select auth.uid())
    or exists(select 1 from mouneh.order_links l where l.reference=r.order_reference and l.user_id=(select auth.uid()))
    or exists(select 1 from public.orders o where o.reference=r.order_reference and o.customer_id=(select auth.uid()))
  ))
);
drop policy if exists "owner/admin read return_fulfillments" on public.return_fulfillments;
create policy "owner/admin read return_fulfillments" on public.return_fulfillments for select to authenticated using (
  exists(select 1 from public.return_requests r where r.id=request_id and (
    exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())) or r.customer_id=(select auth.uid())
    or exists(select 1 from mouneh.order_links l where l.reference=r.order_reference and l.user_id=(select auth.uid()))
    or exists(select 1 from public.orders o where o.reference=r.order_reference and o.customer_id=(select auth.uid()))
  ))
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('return-evidence','return-evidence',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "return evidence owner/admin read" on storage.objects;
create policy "return evidence owner/admin read" on storage.objects for select to authenticated using (
  bucket_id='return-evidence' and exists(
    select 1 from public.return_request_evidence e join public.return_requests r on r.id=e.request_id
    where e.storage_path=name and (
      exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())) or r.customer_id=(select auth.uid())
      or exists(select 1 from mouneh.order_links l where l.reference=r.order_reference and l.user_id=(select auth.uid()))
      or exists(select 1 from public.orders o where o.reference=r.order_reference and o.customer_id=(select auth.uid()))
    )
  )
);

create or replace function private.zwm_return_order_lines(p_order_reference text)
returns table(line_index integer,line_key text,product_id text,variant_id text,product_name text,variant_name text,purchased_quantity integer,gross_amount numeric,allocated_net_amount numeric)
language sql stable security definer set search_path=''
as $$
with o as (
  select items,coalesce(subtotal,0) subtotal,coalesce(discount_total,0) discount_total from public.orders where reference=p_order_reference
), raw as (
  select x.ordinality::integer line_index,x.value item,
    greatest(1,coalesce(nullif(x.value->>'qty','')::integer,nullif(x.value->>'quantity','')::integer,1)) qty,
    greatest(0,round(coalesce(nullif(x.value->>'subtotal','')::numeric,
      coalesce(nullif(x.value->>'unit_price','')::numeric,0)*greatest(1,coalesce(nullif(x.value->>'qty','')::integer,nullif(x.value->>'quantity','')::integer,1)),0)*100))::bigint gross_cents
  from o cross join lateral jsonb_array_elements(case when jsonb_typeof(o.items)='array' then o.items else '[]'::jsonb end) with ordinality x(value,ordinality)
), totals as (
  select coalesce(sum(r.gross_cents),0)::bigint total_gross_cents,
    least(coalesce(sum(r.gross_cents),0)::bigint,greatest(0,round(greatest(0,o.subtotal-o.discount_total)*100))::bigint) net_cents
  from o left join raw r on true group by o.subtotal,o.discount_total
), calc as (
  select r.*,case when t.total_gross_cents>0 then floor((r.gross_cents::numeric*t.net_cents::numeric)/t.total_gross_cents)::bigint else 0 end base_cents,
    case when t.total_gross_cents>0 then mod((r.gross_cents::numeric*t.net_cents::numeric),t.total_gross_cents::numeric) else 0 end frac,t.net_cents
  from raw r cross join totals t
), ranked as (
  select c.*,row_number() over(order by c.frac desc,c.line_index) rn,sum(c.base_cents) over() base_sum from calc c
)
select r.line_index,left(coalesce(nullif(r.item->>'variant_id',''),nullif(r.item->>'product_id',''),'line')||':'||r.line_index::text,220),
  nullif(r.item->>'product_id',''),nullif(r.item->>'variant_id',''),
  left(coalesce(nullif(r.item->>'name',''),nullif(r.item->>'name_en',''),nullif(r.item->>'product_id',''),'Item'),300),
  left(coalesce(nullif(r.item->>'size',''),nullif(r.item->>'variant_name',''),nullif(r.item->>'size_en',''),''),300),
  r.qty,(r.gross_cents::numeric/100)::numeric(12,2),
  ((r.base_cents + case when r.rn <= greatest(0,r.net_cents-r.base_sum) then 1 else 0 end)::numeric/100)::numeric(12,2)
from ranked r order by r.line_index;
$$;
revoke all on function private.zwm_return_order_lines(text) from public,anon,authenticated;
