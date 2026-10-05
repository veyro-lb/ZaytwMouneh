-- Zayt w Mouneh — customer-visible Wholesale history and resilient owner notifications.
-- Production migration: 20261005202141

alter table public.wholesale_leads
  add column if not exists customer_user_id uuid null references auth.users(id) on delete set null;

create index if not exists wholesale_leads_customer_user_created_idx
  on public.wholesale_leads(customer_user_id, created_at desc)
  where customer_user_id is not null;

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
  customer_id uuid:=auth.uid();
begin
  if p is null or jsonb_typeof(p)<>'object' then raise exception 'Invalid wholesale request'; end if;
  if bt not in ('restaurant','cafe','bakery','catering','grocery_store','minimarket','specialty_food_shop','hotel_hospitality','corporate_office','distributor','other') then raise exception 'Invalid business type'; end if;
  if cm not in ('whatsapp','phone','email') then raise exception 'Invalid contact method'; end if;
  if loc not in ('en','ar','fr') then raise exception 'Invalid locale'; end if;
  if coalesce((p->>'consent')::boolean,false) is not true then raise exception 'Consent required'; end if;
  if cm='email' and char_length(trim(coalesce(p->>'email','')))=0 then raise exception 'Email is required for email contact'; end if;

  if jsonb_typeof(coalesce(p->'priorities','[]'::jsonb))='array' then
    select coalesce(array_agg(left(v,80)),'{}'::text[]) into clean_priorities
    from jsonb_array_elements_text(coalesce(p->'priorities','[]'::jsonb)) x(v)
    where v in ('product_quality','consistent_supply','lebanese_origin','wholesale_pricing','bulk_packaging','delivery_reliability','product_variety','recurring_ordering','other');
  end if;

  insert into public.wholesale_leads(
    id,customer_user_id,business_name,contact_name,business_type,custom_business_type,phone,email,location,website_or_instagram,
    purchase_frequency,approximate_volume,first_order_timing,priorities,current_supplier_status,supplier_switch_reason,
    unlisted_products,notes,preferred_contact_method,locale,consent,source,status
  ) values (
    lead_id,customer_id,left(trim(coalesce(p->>'business_name','')),180),left(trim(coalesce(p->>'contact_name','')),160),bt,
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
      insert into public.wholesale_lead_items(
        lead_id,product_id,product_name_snapshot,selected_variant,requested_quantity,requested_unit,notes
      ) values(
        lead_id,left(trim(coalesce(item->>'product_id','')),180),left(trim(coalesce(item->>'product_name_snapshot','')),220),
        nullif(left(trim(coalesce(item->>'selected_variant','')),180),''),
        (item->>'requested_quantity')::numeric,coalesce(nullif(item->>'requested_unit',''),'units'),
        nullif(left(trim(coalesce(item->>'notes','')),600),'')
      );
    end loop;
  end if;

  if item_count=0 and char_length(trim(coalesce(p->>'unlisted_products','')))=0 then
    raise exception 'Add at least one product or describe products not listed';
  end if;

  return lead_id;
end
$$;

revoke all on function private.submit_wholesale_enquiry_core(jsonb) from public;
revoke execute on function private.submit_wholesale_enquiry_core(jsonb) from anon,authenticated;

create or replace function private.get_my_wholesale_enquiries_core()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid:=auth.uid();
  account_email text;
  result jsonb;
begin
  if uid is null then raise exception 'Authentication required'; end if;

  select lower(trim(u.email))
    into account_email
  from auth.users u
  where u.id=uid and u.email_confirmed_at is not null;

  if account_email is not null then
    update public.wholesale_leads l
    set customer_user_id=uid,
        updated_at=greatest(l.updated_at,now())
    where l.customer_user_id is null
      and l.email is not null
      and lower(trim(l.email))=account_email;
  end if;

  select coalesce(jsonb_agg(entry order by created_at_sort desc),'[]'::jsonb)
    into result
  from (
    select l.created_at as created_at_sort,
      jsonb_build_object(
        'reference','ZW-B2B-' || upper(substr(replace(l.id::text,'-',''),1,8)),
        'status',l.status,
        'created_at',l.created_at,
        'updated_at',l.updated_at,
        'business_name',l.business_name,
        'contact_name',l.contact_name,
        'business_type',l.business_type,
        'custom_business_type',l.custom_business_type,
        'location',l.location,
        'purchase_frequency',l.purchase_frequency,
        'approximate_volume',l.approximate_volume,
        'first_order_timing',l.first_order_timing,
        'priorities',to_jsonb(l.priorities),
        'unlisted_products',l.unlisted_products,
        'notes',l.notes,
        'preferred_contact_method',l.preferred_contact_method,
        'last_contacted_at',l.last_contacted_at,
        'next_follow_up_at',l.next_follow_up_at,
        'items',coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'product_name',i.product_name_snapshot,
              'variant',i.selected_variant,
              'quantity',i.requested_quantity,
              'unit',i.requested_unit,
              'notes',i.notes
            )
            order by i.created_at,i.id
          )
          from public.wholesale_lead_items i
          where i.lead_id=l.id
        ),'[]'::jsonb)
      ) as entry
    from public.wholesale_leads l
    where l.customer_user_id=uid
    order by l.created_at desc
    limit 100
  ) x;

  return result;
end
$$;

revoke all on function private.get_my_wholesale_enquiries_core() from public,anon,authenticated;
grant execute on function private.get_my_wholesale_enquiries_core() to authenticated;

create or replace function public.get_my_wholesale_enquiries()
returns jsonb
language sql
security invoker
set search_path=''
as $$ select private.get_my_wholesale_enquiries_core() $$;

revoke all on function public.get_my_wholesale_enquiries() from public,anon;
grant execute on function public.get_my_wholesale_enquiries() to authenticated;

create or replace function private.zwm_create_notification(
  p_user uuid,p_audience text,p_type text,p_entity_type text,p_entity_id text,
  p_title_key text,p_body_key text,p_route text,p_priority text,p_category text,
  p_metadata jsonb,p_dedupe_key text
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid;
  v_in_app boolean:=true;
  v_category text:=case
    when p_category in ('new_orders','new_order') then 'new_order'
    when p_category in ('wholesale_inquiries','wholesale') then 'wholesale'
    when p_category in ('payment_issues','payment_issue') then 'payment_issue'
    when p_category in ('low_stock','out_of_stock','inventory') then 'inventory'
    when p_category in ('routine_activity','routine') then 'routine'
    else p_category
  end;
begin
  if p_user is null then return null; end if;

  perform private.zwm_ensure_default_notification_preferences(p_user,p_audience='admin');

  select coalesce(in_app_enabled,true) into v_in_app
  from public.notification_preferences
  where user_id=p_user and category in (p_category,v_category)
  order by case when category=p_category then 0 else 1 end
  limit 1;

  if not coalesce(v_in_app,true) then return null; end if;

  insert into public.notifications(
    user_id,audience,notification_type,category,entity_type,entity_id,
    title_key,body_key,route,priority,metadata,dedupe_key
  ) values (
    p_user,p_audience,p_type,v_category,p_entity_type,p_entity_id,
    p_title_key,p_body_key,p_route,p_priority,coalesce(p_metadata,'{}'::jsonb),p_dedupe_key
  )
  on conflict (user_id,dedupe_key) do update set dedupe_key=excluded.dedupe_key
  returning id into v_id;

  return v_id;
end
$$;

create or replace function private.zwm_notify_wholesale_insert()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare a record;
begin
  for a in select user_id from public.admin_users loop
    begin
      perform private.zwm_create_notification(
        a.user_id,'admin','WHOLESALE_INQUIRY_CREATED','wholesale_lead',new.id::text,
        'wholesale.created.title','wholesale.created.body',
        '/admin?notification=wholesale&id='||new.id::text,
        'critical','wholesale',
        jsonb_build_object('business_name',new.business_name,'business_type',new.business_type),
        'WHOLESALE_INQUIRY_CREATED:'||new.id::text
      );
    exception when others then
      raise warning 'Wholesale lead % saved, but admin notification failed for user %: %',new.id,a.user_id,sqlerrm;
    end;
  end loop;
  return new;
end
$$;

select private.zwm_create_notification(
  a.user_id,'admin','WHOLESALE_INQUIRY_CREATED','wholesale_lead',l.id::text,
  'wholesale.created.title','wholesale.created.body',
  '/admin?notification=wholesale&id='||l.id::text,
  'critical','wholesale',
  jsonb_build_object('business_name',l.business_name,'business_type',l.business_type),
  'WHOLESALE_INQUIRY_CREATED:'||l.id::text
)
from public.wholesale_leads l
cross join public.admin_users a
where not exists (
  select 1 from public.notifications n
  where n.user_id=a.user_id
    and n.dedupe_key='WHOLESALE_INQUIRY_CREATED:'||l.id::text
);

notify pgrst,'reload schema';
