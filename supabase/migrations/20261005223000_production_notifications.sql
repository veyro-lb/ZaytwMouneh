-- Zayt w Mouneh production notification infrastructure.
-- Additive only: persistent notifications, preferences, Web Push subscriptions/deliveries,
-- authoritative order/wholesale triggers, realtime read state and async dispatch hooks.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  audience text not null check (audience in ('owner','customer')),
  category text not null check (char_length(category) between 2 and 60),
  notification_type text not null check (char_length(notification_type) between 2 and 100),
  entity_type text not null check (char_length(entity_type) between 2 and 60),
  entity_id text not null check (char_length(entity_id) between 1 and 180),
  title_key text not null check (char_length(title_key) between 2 and 160),
  body_key text not null check (char_length(body_key) between 2 and 160),
  route text not null check (route ~ '^/' and char_length(route) <= 600),
  priority text not null default 'important' check (priority in ('critical','important','informational')),
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text not null check (char_length(dedupe_key) between 2 and 300),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  push_requested_at timestamptz,
  push_last_attempt_at timestamptz,
  push_completed_at timestamptz,
  push_attempts integer not null default 0 check (push_attempts >= 0),
  push_state text not null default 'pending' check (push_state in ('pending','processing','sent','partial','failed','skipped')),
  last_error text,
  unique(recipient_user_id,dedupe_key)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  audience text not null check (audience in ('owner','customer')),
  endpoint text not null unique check (endpoint ~ '^https://' and char_length(endpoint) <= 2400),
  p256dh text not null check (char_length(p256dh) between 40 and 300),
  auth text not null check (char_length(auth) between 8 and 300),
  device_label text check (device_label is null or char_length(device_label) <= 120),
  browser_label text check (browser_label is null or char_length(browser_label) <= 120),
  locale text not null default 'en' check (locale in ('en','ar','fr')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  last_success_at timestamptz,
  failure_count integer not null default 0 check (failure_count >= 0),
  revoked_at timestamptz
);

create table if not exists public.notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  audience text not null check (audience in ('owner','customer')),
  category text not null check (char_length(category) between 2 and 60),
  in_app_enabled boolean not null default true,
  push_enabled boolean not null default true,
  marketing_opt_in boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(user_id,audience,category)
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  subscription_id uuid references public.push_subscriptions(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','failed','endpoint_invalid','skipped')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  accepted_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(notification_id,subscription_id)
);

create index if not exists notifications_user_created_idx
  on public.notifications(recipient_user_id,created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications(recipient_user_id,created_at desc)
  where read_at is null;
create index if not exists notifications_push_pending_idx
  on public.notifications(push_state,created_at)
  where push_state in ('pending','partial','failed');
create index if not exists push_subscriptions_user_active_idx
  on public.push_subscriptions(user_id,audience,updated_at desc)
  where enabled and revoked_at is null;
create index if not exists notification_deliveries_notification_idx
  on public.notification_deliveries(notification_id,status);
create index if not exists notification_preferences_user_idx
  on public.notification_preferences(user_id,audience);

alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_deliveries enable row level security;

revoke all on table public.notifications from public, anon, authenticated;
revoke all on table public.push_subscriptions from public, anon, authenticated;
revoke all on table public.notification_preferences from public, anon, authenticated;
revoke all on table public.notification_deliveries from public, anon, authenticated;

grant select on table public.notifications to authenticated;
grant update(read_at) on table public.notifications to authenticated;
grant select,insert,update,delete on table public.notification_preferences to authenticated;

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications"
on public.notifications for select
to authenticated
using ((select auth.uid()) = recipient_user_id);

drop policy if exists "users mark own notifications read" on public.notifications;
create policy "users mark own notifications read"
on public.notifications for update
to authenticated
using ((select auth.uid()) = recipient_user_id)
with check ((select auth.uid()) = recipient_user_id);

drop policy if exists "users read own notification preferences" on public.notification_preferences;
create policy "users read own notification preferences"
on public.notification_preferences for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "users insert own notification preferences" on public.notification_preferences;
create policy "users insert own notification preferences"
on public.notification_preferences for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    audience = 'customer'
    or exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
  )
);

drop policy if exists "users update own notification preferences" on public.notification_preferences;
create policy "users update own notification preferences"
on public.notification_preferences for update
to authenticated
using (
  (select auth.uid()) = user_id
  and (
    audience = 'customer'
    or exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
  )
)
with check (
  (select auth.uid()) = user_id
  and (
    audience = 'customer'
    or exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
  )
);

drop policy if exists "users delete own notification preferences" on public.notification_preferences;
create policy "users delete own notification preferences"
on public.notification_preferences for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and (
    audience = 'customer'
    or exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))
  )
);

create or replace function private.zwm_enqueue_notification(
  p_user uuid,
  p_audience text,
  p_category text,
  p_type text,
  p_entity_type text,
  p_entity_id text,
  p_title_key text,
  p_body_key text,
  p_route text,
  p_priority text,
  p_metadata jsonb,
  p_dedupe_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_user is null then return null; end if;
  insert into public.notifications(
    recipient_user_id,audience,category,notification_type,entity_type,entity_id,
    title_key,body_key,route,priority,metadata,dedupe_key
  )
  values(
    p_user,p_audience,p_category,p_type,p_entity_type,left(p_entity_id,180),
    p_title_key,p_body_key,left(p_route,600),p_priority,coalesce(p_metadata,'{}'::jsonb),left(p_dedupe_key,300)
  )
  on conflict(recipient_user_id,dedupe_key) do nothing
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function private.zwm_enqueue_notification(uuid,text,text,text,text,text,text,text,text,text,jsonb,text) from public,anon,authenticated;

create or replace function private.zwm_order_notification_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  a record;
  item_count integer;
  is_finalized boolean := false;
begin
  if tg_op='INSERT' then
    is_finalized := new.created_source='website';
  elsif tg_op='UPDATE' then
    is_finalized := new.created_source='website' and old.created_source is distinct from new.created_source;
  end if;

  if is_finalized then
    select coalesce(sum(greatest(0,coalesce((x->>'qty')::integer,0))),0)
      into item_count
      from jsonb_array_elements(coalesce(new.items,'[]'::jsonb)) x;
    for a in select user_id from public.admin_users loop
      perform private.zwm_enqueue_notification(
        a.user_id,'owner','new_orders','ORDER_CREATED','order',new.reference,
        'owner.order_created.title','owner.order_created.body',
        '/admin?view=orders&order='||new.reference,'critical',
        jsonb_build_object(
          'reference',new.reference,
          'total',new.total,
          'currency',new.currency,
          'item_count',item_count
        ),
        'OWNER:ORDER_CREATED:'||new.reference
      );
    end loop;
  end if;

  if tg_op='UPDATE' and old.payment_status is distinct from new.payment_status and new.payment_status='failed' then
    for a in select user_id from public.admin_users loop
      perform private.zwm_enqueue_notification(
        a.user_id,'owner','payment_issues','PAYMENT_FAILED','order',new.reference,
        'owner.payment_failed.title','owner.payment_failed.body',
        '/admin?view=orders&order='||new.reference,'critical',
        jsonb_build_object('reference',new.reference,'payment_status',new.payment_status),
        'OWNER:PAYMENT_FAILED:'||new.reference
      );
    end loop;
  end if;

  if tg_op='UPDATE'
     and old.status is distinct from new.status
     and new.status in ('confirmed','preparing','out_for_delivery','delivered','cancelled')
     and new.customer_id is not null then
    perform private.zwm_enqueue_notification(
      new.customer_id,'customer','order_updates','ORDER_STATUS_CHANGED','order',new.reference,
      'customer.order_status.'||new.status||'.title',
      'customer.order_status.'||new.status||'.body',
      '/order?ref='||new.reference,'important',
      jsonb_build_object('reference',new.reference,'status',new.status),
      'CUSTOMER:ORDER_STATUS_CHANGED:'||new.reference||':'||new.status
    );
  end if;

  return new;
exception when others then
  -- Notification infrastructure must never break checkout or order operations.
  return new;
end;
$$;
revoke all on function private.zwm_order_notification_events() from public,anon,authenticated;

drop trigger if exists zwm_notification_order_events on public.orders;
create trigger zwm_notification_order_events
after insert or update of created_source,status,payment_status
on public.orders
for each row execute function private.zwm_order_notification_events();

create or replace function private.zwm_wholesale_notification_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare a record;
begin
  for a in select user_id from public.admin_users loop
    perform private.zwm_enqueue_notification(
      a.user_id,'owner','wholesale','WHOLESALE_INQUIRY_CREATED','wholesale_lead',new.id::text,
      'owner.wholesale_created.title','owner.wholesale_created.body',
      '/admin?view=wholesale&lead='||new.id::text,'critical',
      jsonb_build_object('lead_id',new.id,'business_name',left(new.business_name,180)),
      'OWNER:WHOLESALE_INQUIRY_CREATED:'||new.id::text
    );
  end loop;
  return new;
exception when others then
  return new;
end;
$$;
revoke all on function private.zwm_wholesale_notification_event() from public,anon,authenticated;

drop trigger if exists zwm_notification_wholesale_created on public.wholesale_leads;
create trigger zwm_notification_wholesale_created
after insert on public.wholesale_leads
for each row execute function private.zwm_wholesale_notification_event();

create or replace function private.zwm_revoke_owner_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.push_subscriptions
     set enabled=false,revoked_at=now(),updated_at=now()
   where user_id=old.user_id and audience='owner' and enabled;
  return old;
end;
$$;
revoke all on function private.zwm_revoke_owner_push() from public,anon,authenticated;

drop trigger if exists zwm_notification_admin_revoked on public.admin_users;
create trigger zwm_notification_admin_revoked
after delete on public.admin_users
for each row execute function private.zwm_revoke_owner_push();

create or replace function public.notification_server_config()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'project_url',(select decrypted_secret from vault.decrypted_secrets where name='zwm_project_url' limit 1),
    'dispatch_secret',(select decrypted_secret from vault.decrypted_secrets where name='zwm_notification_dispatch_secret' limit 1),
    'vapid_public',(select decrypted_secret from vault.decrypted_secrets where name='zwm_vapid_public' limit 1),
    'vapid_private',(select decrypted_secret from vault.decrypted_secrets where name='zwm_vapid_private' limit 1),
    'vapid_subject',(select decrypted_secret from vault.decrypted_secrets where name='zwm_vapid_subject' limit 1)
  );
$$;
revoke all on function public.notification_server_config() from public,anon,authenticated;
grant execute on function public.notification_server_config() to service_role;

create or replace function public.claim_notifications_for_push(p_notification_id uuid default null,p_limit integer default 25)
returns setof public.notifications
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with candidates as (
    select n.id
      from public.notifications n
     where (p_notification_id is null or n.id=p_notification_id)
       and n.push_state in ('pending','partial','failed')
       and n.push_attempts < 5
       and n.created_at > now()-interval '7 days'
     order by n.created_at
     for update skip locked
     limit greatest(1,least(coalesce(p_limit,25),50))
  ),
  claimed as (
    update public.notifications n
       set push_state='processing',
           push_requested_at=coalesce(n.push_requested_at,now()),
           push_last_attempt_at=now(),
           push_attempts=n.push_attempts+1,
           last_error=null
      from candidates c
     where n.id=c.id
     returning n.*
  )
  select * from claimed;
end;
$$;
revoke all on function public.claim_notifications_for_push(uuid,integer) from public,anon,authenticated;
grant execute on function public.claim_notifications_for_push(uuid,integer) to service_role;

create or replace function private.zwm_request_push_dispatch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  dispatch_secret text;
begin
  select decrypted_secret into project_url
    from vault.decrypted_secrets where name='zwm_project_url' limit 1;
  select decrypted_secret into dispatch_secret
    from vault.decrypted_secrets where name='zwm_notification_dispatch_secret' limit 1;
  if project_url is null or dispatch_secret is null then return new; end if;
  begin
    perform net.http_post(
      url => rtrim(project_url,'/')||'/functions/v1/notification-push',
      headers => jsonb_build_object(
        'Content-Type','application/json',
        'x-zwm-dispatch-secret',dispatch_secret
      ),
      body => jsonb_build_object('action','dispatch','notification_id',new.id),
      timeout_milliseconds => 2000
    );
  exception when others then
    null;
  end;
  return new;
end;
$$;
revoke all on function private.zwm_request_push_dispatch() from public,anon,authenticated;

drop trigger if exists zwm_notification_dispatch_after_insert on public.notifications;
create trigger zwm_notification_dispatch_after_insert
after insert on public.notifications
for each row execute function private.zwm_request_push_dispatch();

create or replace function private.zwm_notification_retry_tick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  dispatch_secret text;
begin
  if not exists(
    select 1 from public.notifications
    where push_state in ('pending','partial','failed')
      and push_attempts < 5
      and created_at > now()-interval '7 days'
  ) then return; end if;
  select decrypted_secret into project_url
    from vault.decrypted_secrets where name='zwm_project_url' limit 1;
  select decrypted_secret into dispatch_secret
    from vault.decrypted_secrets where name='zwm_notification_dispatch_secret' limit 1;
  if project_url is null or dispatch_secret is null then return; end if;
  begin
    perform net.http_post(
      url => rtrim(project_url,'/')||'/functions/v1/notification-push',
      headers => jsonb_build_object(
        'Content-Type','application/json',
        'x-zwm-dispatch-secret',dispatch_secret
      ),
      body => jsonb_build_object('action','dispatch'),
      timeout_milliseconds => 4000
    );
  exception when others then
    null;
  end;
end;
$$;
revoke all on function private.zwm_notification_retry_tick() from public,anon,authenticated;

do $$
begin
  if not exists(select 1 from cron.job where jobname='zwm-notification-retry') then
    perform cron.schedule('zwm-notification-retry','* * * * *','select private.zwm_notification_retry_tick();');
  end if;
end
$$;

do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(
       select 1 from pg_publication_tables
       where pubname='supabase_realtime' and schemaname='public' and tablename='notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
