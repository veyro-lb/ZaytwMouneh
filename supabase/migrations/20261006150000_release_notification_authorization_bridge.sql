-- Batch 1: compatibility-safe notification authorization and telemetry bridge.
-- Apply before deploying the updated static client/edge worker.

create or replace function public.notification_create_test(
  p_user uuid,
  p_subscription_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Sign-in required';
  end if;

  if p_user is distinct from v_user then
    raise exception 'Owner access required';
  end if;

  if not exists (
    select 1
    from public.admin_users a
    where a.user_id = v_user
  ) then
    raise exception 'Owner access required';
  end if;

  if not exists (
    select 1
    from public.push_subscriptions s
    where s.id = p_subscription_id
      and s.user_id = v_user
      and s.audience = 'admin'
      and s.enabled
      and s.revoked_at is null
  ) then
    raise exception 'Active owner device required';
  end if;

  v_id := private.notification_create(
    v_user,
    'admin',
    'TEST_PUSH',
    'test',
    'device',
    p_subscription_id::text,
    'admin_test_title',
    'admin_test_body',
    '{}'::jsonb,
    '{}'::jsonb,
    '/admin?view=settings',
    'important',
    jsonb_build_object('test', true),
    'admin:TEST_PUSH:' || gen_random_uuid()::text,
    p_subscription_id
  );

  return v_id;
end;
$$;

revoke all on function public.notification_create_test(uuid, uuid) from public;
revoke execute on function public.notification_create_test(uuid, uuid) from anon;
grant execute on function public.notification_create_test(uuid, uuid) to authenticated, service_role;

create or replace function public.notification_create_test(
  p_subscription_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Sign-in required';
  end if;

  if not exists (
    select 1
    from public.admin_users a
    where a.user_id = v_user
  ) then
    raise exception 'Owner access required';
  end if;

  if not exists (
    select 1
    from public.push_subscriptions s
    where s.id = p_subscription_id
      and s.user_id = v_user
      and s.audience = 'admin'
      and s.enabled
      and s.revoked_at is null
  ) then
    raise exception 'Active owner device required';
  end if;

  v_id := private.notification_create(
    v_user,
    'admin',
    'TEST_PUSH',
    'test',
    'device',
    p_subscription_id::text,
    'admin_test_title',
    'admin_test_body',
    '{}'::jsonb,
    '{}'::jsonb,
    '/admin?view=settings',
    'important',
    jsonb_build_object('test', true),
    'admin:TEST_PUSH:' || gen_random_uuid()::text,
    p_subscription_id
  );

  return v_id;
end;
$$;

revoke all on function public.notification_create_test(uuid) from public;
revoke execute on function public.notification_create_test(uuid) from anon;
grant execute on function public.notification_create_test(uuid) to authenticated, service_role;

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

  insert into public.notification_delivery_attempts(
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
    from public.notification_delivery_attempts a
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

revoke execute on function public.notification_create_customer_test(uuid) from public, anon;
grant execute on function public.notification_create_customer_test(uuid) to authenticated, service_role;

revoke execute on function public.notification_test_status(uuid) from public, anon;
grant execute on function public.notification_test_status(uuid) to authenticated, service_role;

revoke execute on function public.zwm_push_public_key() from public, anon;
grant execute on function public.zwm_push_public_key() to authenticated, service_role;

notify pgrst, 'reload schema';
