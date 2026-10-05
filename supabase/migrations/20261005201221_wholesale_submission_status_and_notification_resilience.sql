-- Zayt w Mouneh — Wholesale submission repair, customer status lookup, notification resilience.
-- Supabase migration version recorded in production: 20261005201221.

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
  if cm='email' and char_length(trim(coalesce(p->>'email','')))=0 then raise exception 'Email is required for email contact'; end if;

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

alter table public.wholesale_leads
  drop constraint if exists wholesale_leads_email_check;
alter table public.wholesale_leads
  add constraint wholesale_leads_email_check
  check (
    email is null
    or email = ''
    or email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  );

create or replace function private.get_wholesale_enquiry_status_core(p_submission_key uuid)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select jsonb_build_object(
    'found', true,
    'reference', 'ZW-B2B-' || upper(substr(replace(l.id::text,'-',''),1,8)),
    'status', l.status,
    'created_at', l.created_at,
    'updated_at', l.updated_at,
    'business_name', l.business_name,
    'contact_name', l.contact_name,
    'business_type', l.business_type,
    'custom_business_type', l.custom_business_type,
    'location', l.location,
    'purchase_frequency', l.purchase_frequency,
    'approximate_volume', l.approximate_volume,
    'first_order_timing', l.first_order_timing,
    'priorities', to_jsonb(l.priorities),
    'unlisted_products', l.unlisted_products,
    'notes', l.notes,
    'preferred_contact_method', l.preferred_contact_method,
    'last_contacted_at', l.last_contacted_at,
    'next_follow_up_at', l.next_follow_up_at,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'product_name', i.product_name_snapshot,
          'variant', i.selected_variant,
          'quantity', i.requested_quantity,
          'unit', i.requested_unit,
          'notes', i.notes
        )
        order by i.created_at, i.id
      )
      from public.wholesale_lead_items i
      where i.lead_id=l.id
    ), '[]'::jsonb)
  )
  from public.wholesale_leads l
  where l.submission_key=p_submission_key
  limit 1
$$;

revoke all on function private.get_wholesale_enquiry_status_core(uuid) from public;
grant execute on function private.get_wholesale_enquiry_status_core(uuid) to anon,authenticated;

create or replace function public.get_wholesale_enquiry_status(p_submission_key uuid)
returns jsonb
language sql
security invoker
set search_path=''
as $$
  select private.get_wholesale_enquiry_status_core(p_submission_key)
$$;

revoke all on function public.get_wholesale_enquiry_status(uuid) from public;
grant execute on function public.get_wholesale_enquiry_status(uuid) to anon,authenticated;

alter table public.notification_preferences
  drop constraint if exists notification_preferences_category_check;
alter table public.notification_preferences
  add constraint notification_preferences_category_check
  check (category in (
    'new_order','new_orders',
    'wholesale','wholesale_inquiries',
    'payment_issue','payment_issues',
    'customer_requests',
    'reviews',
    'inventory','low_stock','out_of_stock',
    'order_updates','back_in_stock','mouneh_points','marketing',
    'routine','routine_activity'
  ));

create or replace function private.zwm_notify_wholesale_insert()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  a record;
begin
  for a in select user_id from public.admin_users loop
    begin
      perform private.zwm_create_notification(
        a.user_id,'admin','WHOLESALE_INQUIRY_CREATED','wholesale_lead',new.id::text,
        'wholesale.created.title','wholesale.created.body',
        '/admin?notification=wholesale&id='||new.id::text,
        'critical','wholesale_inquiries',
        jsonb_build_object('business_name',new.business_name,'business_type',new.business_type),
        'WHOLESALE_INQUIRY_CREATED:'||new.id::text
      );
    exception when others then
      raise warning 'Wholesale lead % saved, but admin notification failed for user %: %', new.id, a.user_id, sqlerrm;
    end;
  end loop;
  return new;
end
$$;

notify pgrst, 'reload schema';
