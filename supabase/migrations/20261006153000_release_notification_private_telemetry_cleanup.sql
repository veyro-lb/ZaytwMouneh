-- Batch 1: final cleanup after the updated notification worker/client are live.
-- The edge worker must already use notification_legacy_delivery_* RPCs before this migration runs.

alter table public.notification_delivery_attempts set schema private;

revoke all on table private.notification_delivery_attempts from public, anon, authenticated;

create or replace function public.notification_legacy_delivery_record(
  p_notification_id uuid,
  p_subscription_id uuid,
  p_state text,
  p_error_category text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_state not in (
    'queued',
    'accepted',
    'temporary_failure',
    'permanent_failure',
    'no_subscription',
    'skipped_preference'
  ) then
    raise exception 'Invalid delivery state';
  end if;

  insert into private.notification_delivery_attempts(
    notification_id,
    subscription_id,
    state,
    error_category
  )
  values (
    p_notification_id,
    p_subscription_id,
    p_state,
    case
      when p_error_category is null then null
      else left(p_error_category, 120)
    end
  );
end;
$$;

create or replace function public.notification_legacy_delivery_accepted(
  p_notification_id uuid,
  p_subscription_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from private.notification_delivery_attempts a
    where a.notification_id = p_notification_id
      and a.subscription_id = p_subscription_id
      and a.state = 'accepted'
  );
$$;

revoke all on function public.notification_legacy_delivery_record(uuid, uuid, text, text) from public;
revoke execute on function public.notification_legacy_delivery_record(uuid, uuid, text, text) from anon, authenticated;
grant execute on function public.notification_legacy_delivery_record(uuid, uuid, text, text) to service_role;

revoke all on function public.notification_legacy_delivery_accepted(uuid, uuid) from public;
revoke execute on function public.notification_legacy_delivery_accepted(uuid, uuid) from anon, authenticated;
grant execute on function public.notification_legacy_delivery_accepted(uuid, uuid) to service_role;

revoke all on function public.notification_create_test(uuid, uuid) from public, anon, authenticated, service_role;
drop function public.notification_create_test(uuid, uuid);

notify pgrst, 'reload schema';
