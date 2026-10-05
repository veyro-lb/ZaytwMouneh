-- Keep all notification side effects failure-isolated from business transactions,
-- and preserve authenticated customer deep links through the Account flow.

create or replace function private.notification_order_finalized()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_admin record;
  v_item_count integer;
  v_finalized boolean := false;
begin
  if tg_op='INSERT' then
    v_finalized := new.created_source='website';
  else
    v_finalized := new.created_source='website' and old.created_source is distinct from new.created_source;
  end if;
  if not v_finalized then return new; end if;

  v_item_count := case when jsonb_typeof(new.items)='array' then
    coalesce((select sum(greatest(0,coalesce((x->>'qty')::integer,0))) from jsonb_array_elements(new.items) x),0)
    else 0 end;

  begin
    for v_admin in select a.user_id from public.admin_users a loop
      perform private.notification_create(
        v_admin.user_id,'admin','ORDER_CREATED','new_order','order',new.reference,
        'admin_new_order_title','admin_new_order_body','{}'::jsonb,
        jsonb_build_object('reference',new.reference,'total',new.total,'currency',new.currency,'item_count',v_item_count),
        '/admin?view=orders&order='||new.reference,'critical',
        jsonb_build_object('reference',new.reference,'total',new.total,'currency',new.currency,'item_count',v_item_count),
        'admin:ORDER_CREATED:'||new.reference,null
      );
    end loop;
  exception when others then
    null;
  end;

  if new.customer_id is not null then
    begin
      perform private.notification_create(
        new.customer_id,'customer','ORDER_CREATED','order_updates','order',new.reference,
        'customer_order_received_title','customer_order_received_body','{}'::jsonb,
        jsonb_build_object('reference',new.reference),
        '/account?notification_ref='||new.reference||'#orders','important',
        jsonb_build_object('reference',new.reference,'status',new.status),
        'customer:ORDER_CREATED:'||new.reference,null
      );
    exception when others then
      null;
    end;
  end if;
  return new;
end;
$$;
revoke all on function private.notification_order_finalized() from public,anon,authenticated;

create or replace function private.notification_order_update()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare v_admin record;
begin
  if old.status is distinct from new.status and new.customer_id is not null
     and new.status in ('confirmed','preparing','out_for_delivery','delivered','cancelled') then
    begin
      perform private.notification_create(
        new.customer_id,'customer','ORDER_STATUS_CHANGED','order_updates','order',new.reference,
        'customer_order_'||new.status||'_title','customer_order_status_body','{}'::jsonb,
        jsonb_build_object('reference',new.reference,'status',new.status),
        '/account?notification_ref='||new.reference||'#orders',
        case when new.status in ('delivered','cancelled') then 'important' else 'informational' end,
        jsonb_build_object('reference',new.reference,'status',new.status),
        'customer:ORDER_STATUS:'||new.reference||':'||new.status,null
      );
    exception when others then
      null;
    end;
  end if;

  if old.payment_status is distinct from new.payment_status and new.payment_status='failed' then
    begin
      for v_admin in select a.user_id from public.admin_users a loop
        perform private.notification_create(
          v_admin.user_id,'admin','PAYMENT_FAILED','payment_issue','order',new.reference,
          'admin_payment_failed_title','admin_payment_failed_body','{}'::jsonb,
          jsonb_build_object('reference',new.reference),
          '/admin?view=orders&order='||new.reference,'critical',
          jsonb_build_object('reference',new.reference,'payment_status',new.payment_status),
          'admin:PAYMENT_FAILED:'||new.reference,null
        );
      end loop;
    exception when others then
      null;
    end;
  end if;
  return new;
end;
$$;
revoke all on function private.notification_order_update() from public,anon,authenticated;

create or replace function private.notification_wholesale_insert()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare v_admin record;
begin
  begin
    for v_admin in select a.user_id from public.admin_users a loop
      perform private.notification_create(
        v_admin.user_id,'admin','WHOLESALE_INQUIRY_CREATED','wholesale','wholesale_inquiry',new.id::text,
        'admin_wholesale_title','admin_wholesale_body','{}'::jsonb,
        jsonb_build_object('business_name',new.business_name),
        '/admin?view=wholesale&lead='||new.id::text,'critical',
        jsonb_build_object('lead_id',new.id,'business_name',new.business_name,'business_type',new.business_type),
        'admin:WHOLESALE_INQUIRY_CREATED:'||new.id::text,null
      );
    end loop;
  exception when others then
    null;
  end;
  return new;
end;
$$;
revoke all on function private.notification_wholesale_insert() from public,anon,authenticated;
