-- Wholesale deletion controls.
-- Admin deletion permanently removes a lead through an allowlist-checked RPC.
-- Customer deletion only hides the enquiry from that customer's account history;
-- it never cancels or removes the business lead from the owner CRM.

alter table public.wholesale_leads
  add column if not exists customer_hidden_at timestamptz null;

create or replace function private.admin_delete_wholesale_enquiry_core(p_lead_id uuid)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid := auth.uid();
  deleted_count integer := 0;
begin
  if uid is null or not exists (
    select 1 from public.admin_users a where a.user_id=uid
  ) then
    raise exception 'Admin access required';
  end if;

  begin
    if to_regclass('public.notifications') is not null then
      execute 'delete from public.notifications where entity_type=$1 and entity_id=$2'
        using 'wholesale_lead', p_lead_id::text;
    end if;
  exception when others then
    raise warning 'Could not clean Wholesale notifications for %: %',p_lead_id,sqlerrm;
  end;

  delete from public.wholesale_leads where id=p_lead_id;
  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end
$$;

revoke all on function private.admin_delete_wholesale_enquiry_core(uuid) from public,anon,authenticated;
grant execute on function private.admin_delete_wholesale_enquiry_core(uuid) to authenticated;

create or replace function public.admin_delete_wholesale_enquiry(p_lead_id uuid)
returns boolean
language sql
security invoker
set search_path=''
as $$ select private.admin_delete_wholesale_enquiry_core(p_lead_id) $$;

revoke all on function public.admin_delete_wholesale_enquiry(uuid) from public,anon;
grant execute on function public.admin_delete_wholesale_enquiry(uuid) to authenticated;

create or replace function private.hide_my_wholesale_enquiry_core(p_lead_id uuid)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid := auth.uid();
  changed_count integer := 0;
begin
  if uid is null then
    raise exception 'Authentication required';
  end if;

  update public.wholesale_leads
  set customer_hidden_at=now(),updated_at=now()
  where id=p_lead_id
    and customer_user_id=uid;

  get diagnostics changed_count = row_count;
  return changed_count > 0;
end
$$;

revoke all on function private.hide_my_wholesale_enquiry_core(uuid) from public,anon,authenticated;
grant execute on function private.hide_my_wholesale_enquiry_core(uuid) to authenticated;

create or replace function public.hide_my_wholesale_enquiry(p_lead_id uuid)
returns boolean
language sql
security invoker
set search_path=''
as $$ select private.hide_my_wholesale_enquiry_core(p_lead_id) $$;

revoke all on function public.hide_my_wholesale_enquiry(uuid) from public,anon;
grant execute on function public.hide_my_wholesale_enquiry(uuid) to authenticated;

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
        'lead_id',l.id,
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
      and l.customer_hidden_at is null
    order by l.created_at desc
    limit 100
  ) x;

  return result;
end
$$;

revoke all on function private.get_my_wholesale_enquiries_core() from public,anon,authenticated;
grant execute on function private.get_my_wholesale_enquiries_core() to authenticated;

notify pgrst,'reload schema';
