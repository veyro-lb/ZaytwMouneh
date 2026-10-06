-- Zayt w Mouneh — final Wholesale + notification event hardening.
-- Routes real Wholesale events through the durable notification outbox and adds customer status updates.

create or replace function private.notification_default_push(p_audience text,p_category text)
returns boolean
language sql
immutable
set search_path=''
as $$
  select case
    when p_audience='admin' and p_category in ('new_order','wholesale','payment_issue','customer_requests','test') then true
    when p_audience='customer' and p_category in ('order_updates','wholesale','back_in_stock','mouneh_points') then true
    else false
  end;
$$;

create or replace function private.zwm_notify_wholesale_insert()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  a record;
  v_reference text := 'ZW-B2B-' || upper(substr(replace(new.id::text,'-',''),1,8));
begin
  if to_regclass('public.notifications') is null then
    return new;
  end if;

  for a in select user_id from public.admin_users loop
    begin
      perform private.notification_create(
        a.user_id,
        'admin',
        'WHOLESALE_INQUIRY_CREATED',
        'wholesale',
        'wholesale_lead',
        new.id::text,
        'wholesale.created.title',
        'wholesale.created.body',
        '{}'::jsonb,
        jsonb_build_object('reference',v_reference,'business_name',new.business_name),
        '/admin?notification=wholesale&id='||new.id::text,
        'critical',
        jsonb_build_object(
          'reference',v_reference,
          'business_name',new.business_name,
          'business_type',new.business_type
        ),
        'admin:WHOLESALE_INQUIRY_CREATED:'||new.id::text,
        null
      );
    exception when others then
      raise warning 'Wholesale lead % saved, but admin notification failed for user %: %',new.id,a.user_id,sqlerrm;
    end;
  end loop;

  return new;
end
$$;

drop trigger if exists zwm_notification_wholesale_insert on public.wholesale_leads;
create trigger zwm_notification_wholesale_insert
after insert on public.wholesale_leads
for each row execute function private.zwm_notify_wholesale_insert();

create or replace function private.zwm_notify_wholesale_status_update()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_reference text := 'ZW-B2B-' || upper(substr(replace(new.id::text,'-',''),1,8));
begin
  if old.status is not distinct from new.status
     or new.customer_user_id is null
     or new.customer_hidden_at is not null then
    return new;
  end if;

  begin
    perform private.notification_create(
      new.customer_user_id,
      'customer',
      'WHOLESALE_STATUS_CHANGED',
      'wholesale',
      'wholesale_lead',
      new.id::text,
      'customer_wholesale_status_title',
      'customer_wholesale_status_body',
      '{}'::jsonb,
      jsonb_build_object('reference',v_reference,'status',new.status),
      '/wholesale?notification=wholesale&id='||new.id::text||'#wholesale-history',
      case when new.status in ('needs_information','approved','converted','lost') then 'important' else 'informational' end,
      jsonb_build_object(
        'reference',v_reference,
        'status',new.status,
        'business_name',new.business_name
      ),
      'customer:WHOLESALE_STATUS:'||new.id::text||':'||new.status,
      null
    );
  exception when others then
    raise warning 'Wholesale status for lead % saved, but customer notification failed: %',new.id,sqlerrm;
  end;

  return new;
end
$$;

drop trigger if exists zwm_notification_wholesale_status_update on public.wholesale_leads;
create trigger zwm_notification_wholesale_status_update
after update of status on public.wholesale_leads
for each row
when (old.status is distinct from new.status)
execute function private.zwm_notify_wholesale_status_update();

-- Remove a redundant permissive policy while preserving the explicit per-operation ownership policies.
drop policy if exists "users manage own notification preferences" on public.notification_preferences;

-- Notification-specific index cleanup from the production advisor.
drop index if exists public.notifications_user_history_idx;
create index if not exists notification_delivery_log_outbox_idx
  on private.notification_delivery_log(outbox_id);
create index if not exists notification_delivery_log_subscription_idx
  on private.notification_delivery_log(subscription_id)
  where subscription_id is not null;
create index if not exists notification_outbox_target_subscription_idx
  on private.notification_push_outbox(target_subscription_id)
  where target_subscription_id is not null;
create index if not exists notification_delivery_attempts_subscription_idx
  on public.notification_delivery_attempts(subscription_id)
  where subscription_id is not null;

notify pgrst,'reload schema';
