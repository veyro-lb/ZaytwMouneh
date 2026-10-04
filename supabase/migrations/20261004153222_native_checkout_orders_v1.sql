-- Native commerce v1: extend the existing order/rewards architecture rather than creating a second system.

alter table public.orders
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists customer_id uuid,
  add column if not exists customer_email text,
  add column if not exists subtotal numeric(12,2),
  add column if not exists discount_total numeric(12,2) default 0,
  add column if not exists reward_discount numeric(12,2) default 0,
  add column if not exists delivery_fee numeric(12,2) default 0,
  add column if not exists delivery_zone_id text,
  add column if not exists delivery_address jsonb default '{}'::jsonb,
  add column if not exists payment_method text default 'cash_on_delivery',
  add column if not exists payment_status text default 'pending',
  add column if not exists created_source text default 'other',
  add column if not exists cancellation_reason text,
  add column if not exists preparing_at timestamptz,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists idempotency_key uuid;

update public.orders o
set
  id=coalesce(o.id,gen_random_uuid()),
  subtotal=coalesce(o.subtotal,nullif(o.extra->>'products_subtotal','')::numeric,o.total),
  reward_discount=coalesce(o.reward_discount,nullif(o.extra->>'mouneh_discount','')::numeric,0),
  discount_total=coalesce(o.discount_total,nullif(o.extra->>'mouneh_discount','')::numeric,0),
  delivery_fee=coalesce(o.delivery_fee,nullif(o.extra->>'delivery_fee','')::numeric,0),
  created_source=case
    when o.created_source is not null and o.created_source<>'other' then o.created_source
    when o.extra->>'source'='manual' then 'admin'
    when o.extra->>'source'='cart' then 'whatsapp_manual'
    else 'other'
  end
where o.id is null
   or o.subtotal is null
   or o.reward_discount is null
   or o.discount_total is null
   or o.delivery_fee is null;

update public.orders o
set customer_id=l.user_id,
    idempotency_key=l.request_id
from mouneh.order_links l
where l.reference=o.reference
  and (o.customer_id is null or o.idempotency_key is null);

alter table public.orders alter column id set not null;
alter table public.orders alter column subtotal set default 0;
update public.orders set subtotal=coalesce(subtotal,0);
alter table public.orders alter column subtotal set not null;

create unique index if not exists orders_internal_id_uidx on public.orders(id);
create unique index if not exists orders_idempotency_key_uidx on public.orders(idempotency_key) where idempotency_key is not null;
create index if not exists orders_customer_id_submitted_idx on public.orders(customer_id,submitted_at desc);
create index if not exists orders_status_submitted_idx on public.orders(status,submitted_at desc);

do $$
begin
  if not exists(select 1 from pg_constraint where conname='orders_customer_id_fkey') then
    alter table public.orders
      add constraint orders_customer_id_fkey foreign key(customer_id) references auth.users(id) on delete set null;
  end if;
  if not exists(select 1 from pg_constraint where conname='orders_payment_status_check') then
    alter table public.orders
      add constraint orders_payment_status_check check(payment_status in ('pending','paid','failed','refunded','partially_refunded','not_required'));
  end if;
  if not exists(select 1 from pg_constraint where conname='orders_created_source_check') then
    alter table public.orders
      add constraint orders_created_source_check check(created_source in ('website','admin','whatsapp_manual','phone_manual','other'));
  end if;
  if not exists(select 1 from pg_constraint where conname='orders_checkout_amounts_check') then
    alter table public.orders
      add constraint orders_checkout_amounts_check check(
        subtotal>=0 and discount_total>=0 and reward_discount>=0 and delivery_fee>=0 and total>=0
      );
  end if;
end $$;

alter table mouneh.addresses
  add column if not exists street text default '',
  add column if not exists building text default '',
  add column if not exists floor_apartment text default '',
  add column if not exists landmark text default '',
  add column if not exists latitude numeric(10,7),
  add column if not exists longitude numeric(10,7);

update mouneh.addresses
set street=case when coalesce(street,'')='' then address else street end
where coalesce(street,'')='';

update public.site_settings
set value =
  coalesce(value,'{}'::jsonb)
  || jsonb_build_object(
      'enabled',coalesce((value->>'enabled')::boolean,true),
      'freeEnabled',coalesce((value->>'freeEnabled')::boolean,true),
      'freeAbove',coalesce(nullif(value->>'freeAbove','')::numeric,50),
      'eligibilityBasis',coalesce(nullif(value->>'eligibilityBasis',''),'before_discount'),
      'zones',case when jsonb_typeof(value->'zones')='array' then value->'zones' else '[]'::jsonb end
    )
where key='delivery';

insert into public.site_settings(key,value)
select 'delivery',jsonb_build_object(
  'enabled',true,
  'fee',0,
  'freeEnabled',true,
  'freeAbove',50,
  'minimum',0,
  'eligibilityBasis','before_discount',
  'eta','',
  'zones','[]'::jsonb
)
where not exists(select 1 from public.site_settings where key='delivery');

create or replace function private.zwm_delivery_quote(p_subtotal numeric,p_discount numeric,p jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  d jsonb;
  zones jsonb;
  z jsonb;
  requested text;
  zone_id text;
  zone_name_en text;
  zone_name_ar text;
  fee numeric:=0;
  threshold numeric:=0;
  minimum numeric:=0;
  basis text:='before_discount';
  eligible numeric:=0;
  free_enabled boolean:=true;
  delivery_enabled boolean:=true;
  zone_active boolean:=true;
  eta_en text:='';
  eta_ar text:='';
begin
  select value into d from public.site_settings where key='delivery';
  d:=coalesce(d,'{}'::jsonb);
  delivery_enabled:=coalesce(nullif(d->>'enabled','')::boolean,true);
  if not delivery_enabled then raise exception 'Delivery is currently unavailable.'; end if;

  zones:=case when jsonb_typeof(d->'zones')='array' then d->'zones' else '[]'::jsonb end;
  requested:=trim(coalesce(p#>>'{delivery,zone_id}',p#>>'{delivery,area}',p->>'area',''));

  if jsonb_array_length(zones)>0 then
    select value into z
    from jsonb_array_elements(zones)
    where lower(trim(coalesce(value->>'id','')))=lower(requested)
       or lower(trim(coalesce(value->>'area','')))=lower(requested)
       or lower(trim(coalesce(value->>'name_en','')))=lower(requested)
       or lower(trim(coalesce(value->>'name_ar','')))=lower(requested)
    limit 1;
    if z is null then raise exception 'Delivery is currently unavailable in this area.'; end if;
    zone_active:=coalesce(nullif(z->>'active','')::boolean,true);
    if not zone_active then raise exception 'Delivery is currently unavailable in this area.'; end if;
  else
    if requested='' then raise exception 'Please select or enter a delivery area.'; end if;
    z:='{}'::jsonb;
  end if;

  zone_id:=coalesce(nullif(z->>'id',''),nullif(z->>'area',''),nullif(z->>'name_en',''),requested);
  zone_name_en:=coalesce(nullif(z->>'name_en',''),nullif(z->>'area',''),requested);
  zone_name_ar:=coalesce(nullif(z->>'name_ar',''),zone_name_en);
  fee:=greatest(0,coalesce(nullif(z->>'fee','')::numeric,nullif(d->>'fee','')::numeric,0));
  threshold:=greatest(0,coalesce(
    nullif(z->>'free_delivery_threshold','')::numeric,
    nullif(z->>'freeAbove','')::numeric,
    nullif(d->>'freeAbove','')::numeric,
    50
  ));
  minimum:=greatest(0,coalesce(
    nullif(z->>'minimum_order','')::numeric,
    nullif(z->>'minimum','')::numeric,
    nullif(d->>'minimum','')::numeric,
    0
  ));
  basis:=case when coalesce(z->>'eligibility_basis',d->>'eligibilityBasis','before_discount')='after_discount'
              then 'after_discount' else 'before_discount' end;
  free_enabled:=coalesce(nullif(z->>'free_enabled','')::boolean,nullif(d->>'freeEnabled','')::boolean,true);
  eligible:=case when basis='after_discount' then greatest(0,p_subtotal-p_discount) else greatest(0,p_subtotal) end;
  if eligible<minimum then
    raise exception 'Minimum order is $%.',trim(to_char(minimum,'FM999999990.00'));
  end if;
  if free_enabled and threshold>0 and eligible>=threshold then fee:=0; end if;
  eta_en:=coalesce(nullif(z->>'eta_en',''),nullif(z->>'eta',''),nullif(d->>'eta_en',''),nullif(d->>'eta',''),'');
  eta_ar:=coalesce(nullif(z->>'eta_ar',''),eta_en);

  return jsonb_build_object(
    'zone_id',zone_id,
    'zone_name_en',zone_name_en,
    'zone_name_ar',zone_name_ar,
    'fee',round(fee,2),
    'free_delivery_threshold',round(threshold,2),
    'minimum_order',round(minimum,2),
    'eligibility_basis',basis,
    'eligible_subtotal',round(eligible,2),
    'free_delivery',fee=0 and free_enabled and threshold>0 and eligible>=threshold,
    'eta_en',eta_en,
    'eta_ar',eta_ar
  );
end
$$;

create or replace function private.zwm_addresses_core(action text,p jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  addr_id uuid;
  make_default boolean:=coalesce((p->>'is_default')::boolean,false);
  item_count integer;
  street_value text;
  building_value text;
  floor_value text;
  full_address text;
begin
  if u is null or not exists(
    select 1 from auth.users where id=u and email_confirmed_at is not null and not is_anonymous
  ) then raise exception 'Verified account required'; end if;
  if not exists(select 1 from mouneh.members where user_id=u) then raise exception 'Join Mouneh Rewards first'; end if;

  if action='list' then
    return coalesce((select jsonb_agg(to_jsonb(a) order by a.is_default desc,a.created_at)
      from mouneh.addresses a where a.user_id=u),'[]'::jsonb);
  elsif action='upsert' then
    street_value:=left(trim(coalesce(p->>'street',p->>'address','')),250);
    building_value:=left(trim(coalesce(p->>'building','')),160);
    floor_value:=left(trim(coalesce(p->>'floor_apartment','')),120);
    full_address:=left(trim(coalesce(nullif(p->>'address',''),
      concat_ws(', ',nullif(street_value,''),nullif(building_value,''),nullif(floor_value,'')))),500);
    if char_length(trim(coalesce(p->>'label','')))=0
       or char_length(trim(coalesce(p->>'area','')))=0
       or char_length(full_address)<3 then
      raise exception 'Address label, area and address are required';
    end if;
    if nullif(p->>'id','') is null then
      select count(*) into item_count from mouneh.addresses where user_id=u;
      if item_count>=5 then raise exception 'You can save up to 5 addresses'; end if;
      if item_count=0 then make_default:=true; end if;
      if make_default then update mouneh.addresses set is_default=false,updated_at=now() where user_id=u; end if;
      insert into mouneh.addresses(
        user_id,label,area,address,street,building,floor_apartment,landmark,delivery_notes,
        latitude,longitude,is_default
      )
      values(
        u,left(trim(p->>'label'),40),left(trim(p->>'area'),180),full_address,
        street_value,building_value,floor_value,left(trim(coalesce(p->>'landmark','')),220),
        left(trim(coalesce(p->>'delivery_notes','')),500),
        nullif(p->>'latitude','')::numeric,nullif(p->>'longitude','')::numeric,make_default
      ) returning id into addr_id;
    else
      addr_id:=(p->>'id')::uuid;
      if not exists(select 1 from mouneh.addresses where id=addr_id and user_id=u) then raise exception 'Address not found'; end if;
      if make_default then update mouneh.addresses set is_default=false,updated_at=now() where user_id=u; end if;
      update mouneh.addresses
      set label=left(trim(p->>'label'),40),
          area=left(trim(p->>'area'),180),
          address=full_address,
          street=street_value,
          building=building_value,
          floor_apartment=floor_value,
          landmark=left(trim(coalesce(p->>'landmark','')),220),
          delivery_notes=left(trim(coalesce(p->>'delivery_notes','')),500),
          latitude=nullif(p->>'latitude','')::numeric,
          longitude=nullif(p->>'longitude','')::numeric,
          is_default=make_default,
          updated_at=now()
      where id=addr_id and user_id=u;
      if not exists(select 1 from mouneh.addresses where user_id=u and is_default) then
        update mouneh.addresses set is_default=true,updated_at=now()
        where id=(select id from mouneh.addresses where user_id=u order by created_at limit 1);
      end if;
    end if;
  elsif action='delete' then
    addr_id:=nullif(p->>'id','')::uuid;
    if addr_id is null then raise exception 'Address id required'; end if;
    delete from mouneh.addresses where id=addr_id and user_id=u;
    if not found then raise exception 'Address not found'; end if;
    if not exists(select 1 from mouneh.addresses where user_id=u and is_default) then
      update mouneh.addresses set is_default=true,updated_at=now()
      where id=(select id from mouneh.addresses where user_id=u order by created_at limit 1);
    end if;
  elsif action='default' then
    addr_id:=nullif(p->>'id','')::uuid;
    if addr_id is null or not exists(select 1 from mouneh.addresses where id=addr_id and user_id=u) then
      raise exception 'Address not found';
    end if;
    update mouneh.addresses set is_default=false,updated_at=now() where user_id=u;
    update mouneh.addresses set is_default=true,updated_at=now() where id=addr_id and user_id=u;
  else
    raise exception 'Unknown address action';
  end if;

  return coalesce((select jsonb_agg(to_jsonb(a) order by a.is_default desc,a.created_at)
    from mouneh.addresses a where a.user_id=u),'[]'::jsonb);
end
$$;

create or replace function public.zwm_checkout(action text,p jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  result jsonb;
  quote jsonb;
  ref text;
  req uuid;
  claim text;
  linked mouneh.order_links;
  ord public.orders;
  email_value text;
  address_snapshot jsonb;
  cancellation_note text;
  is_admin boolean:=false;
begin
  is_admin:=u is not null and exists(select 1 from public.admin_users where user_id=u);

  if action='config' then
    return jsonb_build_object(
      'delivery',coalesce((select value from public.site_settings where key='delivery'),'{}'::jsonb),
      'payment_methods',jsonb_build_array(jsonb_build_object(
        'code','cash_on_delivery','active',true,'label_en','Cash on Delivery','label_ar','الدفع عند الاستلام'
      )),
      'terms_version','2026-10-04-native-commerce-v1'
    );
  end if;

  if action='submit' then
    if coalesce((p->>'terms_accepted')::boolean,false) is not true then
      raise exception 'Please accept the Terms of Service and Privacy Policy.';
    end if;
    if length(trim(coalesce(p->>'customer_name','')))<2 then raise exception 'Please enter your full name.'; end if;
    if length(regexp_replace(coalesce(p->>'customer_phone',''),'\D','','g'))<7 then raise exception 'Please enter a valid phone number.'; end if;
    if coalesce(p->>'payment_method','cash_on_delivery')<>'cash_on_delivery' then raise exception 'This payment method is not available yet.'; end if;
    if trim(coalesce(p#>>'{delivery,area}',p->>'area',''))='' then raise exception 'Please enter your delivery area.'; end if;
    if trim(coalesce(p#>>'{delivery,street}',''))='' then raise exception 'Please enter your street or neighborhood.'; end if;
    if trim(coalesce(p#>>'{delivery,building}',''))='' then raise exception 'Please enter your building or residence.'; end if;
    if jsonb_typeof(p->'items')<>'array' or jsonb_array_length(p->'items') not between 1 and 100 then raise exception 'Your cart is empty.'; end if;
    if nullif(p->>'request_id','') is null then raise exception 'Missing order request token.'; end if;
    req:=(p->>'request_id')::uuid;
    claim:=coalesce(p->>'claim_token','');

    select * into ord from public.orders where idempotency_key=req;
    if found then
      select * into linked from mouneh.order_links where reference=ord.reference;
      if not (
        (linked.user_id is not null and linked.user_id=u)
        or (linked.user_id is null and linked.claim_hash=md5(claim))
        or is_admin
      ) then raise exception 'Order request already used'; end if;
      return jsonb_build_object(
        'reference',ord.reference,
        'subtotal',ord.subtotal,
        'discount',ord.reward_discount,
        'delivery_fee',ord.delivery_fee,
        'total',ord.total,
        'pending_points',coalesce(linked.awarded,0),
        'claim_token',case when linked.user_id is null then claim else null end,
        'idempotent',true
      );
    end if;

    result:=mouneh.api('submit',
      p
      || jsonb_build_object(
          'area',left(trim(coalesce(p#>>'{delivery,area}',p->>'area','')),180),
          'extra',coalesce(p->'extra','{}'::jsonb)
                   || jsonb_build_object('delivery_fee',0,'source','native_checkout','checkout_version',1)
        )
    );
    ref:=result->>'reference';
    quote:=private.zwm_delivery_quote(
      coalesce((result->>'subtotal')::numeric,0),
      coalesce((result->>'discount')::numeric,0),
      p
    );

    select coalesce(nullif(trim(p->>'customer_email'),''),
                    (select email from auth.users where id=u))
      into email_value;

    address_snapshot:=jsonb_strip_nulls(jsonb_build_object(
      'label',nullif(left(trim(coalesce(p#>>'{delivery,label}','')),40),''),
      'area',left(trim(coalesce(p#>>'{delivery,area}',p->>'area','')),180),
      'street',left(trim(coalesce(p#>>'{delivery,street}','')),250),
      'building',left(trim(coalesce(p#>>'{delivery,building}','')),160),
      'floor_apartment',nullif(left(trim(coalesce(p#>>'{delivery,floor_apartment}','')),120),''),
      'landmark',nullif(left(trim(coalesce(p#>>'{delivery,landmark}','')),220),''),
      'instructions',nullif(left(trim(coalesce(p#>>'{delivery,instructions}','')),500),''),
      'latitude',case when nullif(p#>>'{delivery,latitude}','') is null then null else (p#>>'{delivery,latitude}')::numeric end,
      'longitude',case when nullif(p#>>'{delivery,longitude}','') is null then null else (p#>>'{delivery,longitude}')::numeric end
    ));

    update public.orders
    set customer_id=u,
        customer_email=left(coalesce(email_value,''),240),
        area=address_snapshot->>'area',
        subtotal=round(coalesce((result->>'subtotal')::numeric,0),2),
        reward_discount=round(coalesce((result->>'discount')::numeric,0),2),
        discount_total=round(coalesce((result->>'discount')::numeric,0),2),
        delivery_fee=round(coalesce((quote->>'fee')::numeric,0),2),
        total=round(
          greatest(0,coalesce((result->>'subtotal')::numeric,0)-coalesce((result->>'discount')::numeric,0))
          +coalesce((quote->>'fee')::numeric,0),2
        ),
        delivery_zone_id=quote->>'zone_id',
        delivery_address=address_snapshot,
        payment_method='cash_on_delivery',
        payment_status='pending',
        created_source='website',
        terms_accepted_at=now(),
        terms_version=left(coalesce(p->>'terms_version','2026-10-04-native-commerce-v1'),120),
        idempotency_key=req,
        extra=coalesce(extra,'{}'::jsonb)
              || jsonb_build_object(
                  'source','website',
                  'delivery_fee',(quote->>'fee')::numeric,
                  'delivery_zone',quote->>'zone_id',
                  'delivery_quote',quote,
                  'products_subtotal',(result->>'subtotal')::numeric,
                  'mouneh_discount',(result->>'discount')::numeric
                ),
        status_history=case when jsonb_array_length(coalesce(status_history,'[]'::jsonb))=0
          then jsonb_build_array(jsonb_build_object('status','new','at',submitted_at,'source','website'))
          else status_history end,
        updated_at=now()
    where reference=ref
    returning * into ord;

    if ord.reference is null then raise exception 'Could not finalize order.'; end if;

    insert into public.site_events(event_name,page_path,session_id,meta)
    values('checkout_completed','/checkout.html',left(coalesce(p->>'session_id',''),80),
      jsonb_build_object('order_reference',ref,'signed_in',u is not null,'free_delivery',coalesce((quote->>'free_delivery')::boolean,false)))
    on conflict do nothing;

    return result || jsonb_build_object(
      'delivery_fee',ord.delivery_fee,
      'total',ord.total,
      'payment_method',ord.payment_method,
      'delivery',quote,
      'created_source',ord.created_source
    );
  end if;

  if action in ('detail','cancel') then
    ref:=left(trim(coalesce(p->>'reference','')),80);
    if ref='' then raise exception 'Order not found'; end if;
    select * into ord from public.orders where reference=ref;
    if not found then raise exception 'Order not found'; end if;
    select * into linked from mouneh.order_links where reference=ref;
    claim:=coalesce(p->>'claim_token','');

    if not (
      is_admin
      or (u is not null and linked.user_id=u)
      or (linked.user_id is null and length(claim)>=64 and linked.claim_hash=md5(claim))
    ) then raise exception 'Order not found'; end if;

    if action='cancel' then
      if ord.status<>'new' then raise exception 'This order can no longer be cancelled online. Please contact us for help.'; end if;
      cancellation_note:=left(trim(coalesce(p->>'reason','Customer requested')),300);
      perform set_config('app.zwm_customer_cancel','1',true);
      update public.orders
      set status='cancelled',cancellation_reason=cancellation_note
      where reference=ref
      returning * into ord;
    end if;

    return (to_jsonb(ord)-'private_notes')
      || jsonb_build_object(
          'points_awarded',coalesce(linked.awarded,0),
          'reward_discount',coalesce(linked.discount,ord.reward_discount,0),
          'can_cancel',ord.status='new',
          'support_phone',coalesce((select value->>'whatsapp' from public.site_settings where key='contact'),'96181581230')
        );
  end if;

  raise exception 'Unknown checkout action';
end
$$;

revoke all on function public.zwm_checkout(text,jsonb) from public;
grant execute on function public.zwm_checkout(text,jsonb) to anon,authenticated,service_role;

drop policy if exists "site can create whatsapp orders" on public.orders;
revoke insert,update,delete,truncate on public.orders from anon;

alter table public.site_events drop constraint if exists site_events_event_name_check;
alter table public.site_events add constraint site_events_event_name_check
check(event_name in (
  'page_view','product_view','add_to_cart','whatsapp_click','search',
  'cart_opened','checkout_started','checkout_completed','order_delivered'
));

create or replace function mouneh.order_status_guard()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  admin_user boolean:=false;
  customer_cancel boolean:=false;
  allowed boolean:=false;
  source_name text;
begin
  admin_user:=auth.uid() is not null and exists(select 1 from public.admin_users where user_id=auth.uid());
  customer_cancel:=coalesce(current_setting('app.zwm_customer_cancel',true),'')='1';

  if not admin_user and not customer_cancel then raise exception 'Owner authentication required'; end if;
  if customer_cancel and not(old.status='new' and new.status='cancelled') then raise exception 'Customer cancellation is not allowed for this status'; end if;

  allowed:=case old.status
    when 'new' then new.status in ('confirmed','cancelled')
    when 'confirmed' then new.status in ('preparing','cancelled')
    when 'preparing' then new.status in ('out_for_delivery','cancelled')
    when 'out_for_delivery' then new.status in ('delivered','cancelled')
    when 'delivered' then admin_user and new.status='cancelled'
    when 'cancelled' then false
    else false
  end;
  if old.status<>new.status and not allowed then
    raise exception 'Invalid order status transition: % to %',old.status,new.status;
  end if;

  source_name:=case when customer_cancel then 'customer' else 'owner' end;
  new.updated_at:=now();
  if new.status='confirmed' then new.confirmed_at:=coalesce(new.confirmed_at,now()); end if;
  if new.status='preparing' then new.preparing_at:=coalesce(new.preparing_at,now()); end if;
  if new.status='out_for_delivery' then new.out_for_delivery_at:=coalesce(new.out_for_delivery_at,now()); end if;
  if new.status='delivered' then new.delivered_at:=coalesce(new.delivered_at,now()); end if;
  if new.status='cancelled' then new.cancelled_at:=coalesce(new.cancelled_at,now()); end if;
  new.status_history:=coalesce(old.status_history,'[]'::jsonb)
    || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'status',new.status,
      'previous',old.status,
      'at',now(),
      'source',source_name,
      'actor',case when admin_user then auth.uid()::text else null end
    )));
  return new;
end
$$;

create or replace function mouneh.order_status_after()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  perform mouneh.settle(new.reference);
  if new.status='delivered' then
    insert into public.site_events(event_name,page_path,meta)
    values('order_delivered','/admin.html',jsonb_build_object('order_reference',new.reference))
    on conflict do nothing;
  end if;
  return new;
end
$$;

drop trigger if exists mouneh_order_status on public.orders;
drop trigger if exists mouneh_order_status_guard on public.orders;
drop trigger if exists mouneh_order_status_after on public.orders;
create trigger mouneh_order_status_guard
before update of status on public.orders
for each row when(old.status is distinct from new.status)
execute function mouneh.order_status_guard();
create trigger mouneh_order_status_after
after update of status on public.orders
for each row when(old.status is distinct from new.status)
execute function mouneh.order_status_after();

do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

notify pgrst,'reload schema';

