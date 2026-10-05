create or replace function private.notification_is_admin(p_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.admin_users a where a.user_id=p_user);
$$;
revoke all on function private.notification_is_admin(uuid) from public, anon, authenticated;

create or replace function private.notification_default_in_app(p_audience text,p_category text)
returns boolean language sql immutable set search_path='' as $$
  select case when p_category='marketing' then false else true end;
$$;

create or replace function private.notification_default_push(p_audience text,p_category text)
returns boolean language sql immutable set search_path='' as $$
  select case
    when p_audience='admin' and p_category in ('new_order','wholesale','payment_issue','customer_requests','test') then true
    when p_audience='customer' and p_category in ('order_updates','back_in_stock','mouneh_points') then true
    else false
  end;
$$;

create or replace function private.notification_pref(p_user uuid,p_audience text,p_category text,p_channel text)
returns boolean language sql stable security definer set search_path='' as $$
  select case when p_channel='push' then coalesce(
      (select np.push_enabled from public.notification_preferences np where np.user_id=p_user and np.category=p_category),
      private.notification_default_push(p_audience,p_category)
    ) else coalesce(
      (select np.in_app_enabled from public.notification_preferences np where np.user_id=p_user and np.category=p_category),
      private.notification_default_in_app(p_audience,p_category)
    ) end;
$$;
revoke all on function private.notification_pref(uuid,text,text,text) from public, anon, authenticated;

create or replace function private.notification_create(
  p_user uuid,p_audience text,p_notification_type text,p_category text,p_entity_type text,p_entity_id text,
  p_title_key text,p_body_key text,p_title_args jsonb,p_body_args jsonb,p_route text,p_priority text,
  p_metadata jsonb,p_dedupe_key text,p_target_subscription_id uuid default null
)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_push boolean; v_in_app boolean;
begin
  if p_user is null then return null; end if;
  v_push := private.notification_pref(p_user,p_audience,p_category,'push');
  v_in_app := private.notification_pref(p_user,p_audience,p_category,'in_app');
  if not v_push and not v_in_app then return null; end if;

  insert into public.notifications(
    user_id,audience,notification_type,category,entity_type,entity_id,title_key,body_key,
    title_args,body_args,route,priority,metadata,dedupe_key
  ) values(
    p_user,p_audience,p_notification_type,p_category,p_entity_type,left(p_entity_id,220),p_title_key,p_body_key,
    coalesce(p_title_args,'{}'::jsonb),coalesce(p_body_args,'{}'::jsonb),p_route,p_priority,
    coalesce(p_metadata,'{}'::jsonb),p_dedupe_key
  )
  on conflict(user_id,dedupe_key) do nothing returning id into v_id;

  if v_id is null then
    select n.id into v_id from public.notifications n where n.user_id=p_user and n.dedupe_key=p_dedupe_key;
    return v_id;
  end if;

  if v_push then
    insert into private.notification_push_outbox(notification_id,target_subscription_id)
    values(v_id,p_target_subscription_id) on conflict(notification_id) do nothing;
  end if;
  return v_id;
end;
$$;
revoke all on function private.notification_create(uuid,text,text,text,text,text,text,text,jsonb,jsonb,text,text,jsonb,text,uuid) from public, anon, authenticated;