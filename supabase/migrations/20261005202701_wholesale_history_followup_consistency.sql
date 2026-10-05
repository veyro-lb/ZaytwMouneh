-- Follow-up consistency for Wholesale history claiming and owner notification preferences.
-- Production migration: 20261005202701

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
    set customer_user_id=uid
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
        'critical','wholesale_inquiries',
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

notify pgrst,'reload schema';
