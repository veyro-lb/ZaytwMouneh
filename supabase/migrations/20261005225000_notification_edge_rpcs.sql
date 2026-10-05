-- Server-only RPCs used by the notification Edge Function.
-- No browser role receives EXECUTE.

create or replace function public.notification_create_test(p_user uuid,p_subscription_id uuid)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid;
begin
  if p_user is null or p_subscription_id is null then
    raise exception 'Missing test notification target';
  end if;
  if not exists(
    select 1 from public.admin_users a where a.user_id=p_user
  ) then
    raise exception 'Owner access required';
  end if;
  if not exists(
    select 1 from public.push_subscriptions s
    where s.id=p_subscription_id and s.user_id=p_user and s.audience='admin'
      and s.enabled and s.revoked_at is null
  ) then
    raise exception 'Active owner device required';
  end if;

  v_id:=private.notification_create(
    p_user,'admin','TEST_PUSH','test','device',p_subscription_id::text,
    'admin_test_title','admin_test_body','{}'::jsonb,'{}'::jsonb,
    '/admin?view=settings','important',
    jsonb_build_object('test',true),
    'admin:TEST_PUSH:'||gen_random_uuid()::text,p_subscription_id
  );
  return v_id;
end;
$$;
revoke all on function public.notification_create_test(uuid,uuid) from public,anon,authenticated;
grant execute on function public.notification_create_test(uuid,uuid) to service_role;

create or replace function public.notification_push_allowed(p_user uuid,p_audience text,p_category text)
returns boolean
language sql
security definer
set search_path=''
as $$
  select private.notification_pref(p_user,p_audience,p_category,'push');
$$;
revoke all on function public.notification_push_allowed(uuid,text,text) from public,anon,authenticated;
grant execute on function public.notification_push_allowed(uuid,text,text) to service_role;

create or replace function public.notification_delivery_accepted(p_notification_id uuid,p_subscription_id uuid)
returns boolean
language sql
security definer
set search_path=''
as $$
  select exists(
    select 1
    from private.notification_delivery_log l
    where l.notification_id=p_notification_id
      and l.subscription_id=p_subscription_id
      and l.delivery_state='accepted'
  );
$$;
revoke all on function public.notification_delivery_accepted(uuid,uuid) from public,anon,authenticated;
grant execute on function public.notification_delivery_accepted(uuid,uuid) to service_role;
