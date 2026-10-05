-- Finish notification delivery infrastructure on top of the applied core.
-- Keeps checkout authoritative, adds secure read/preferences APIs, realtime, outbox claiming,
-- async Web Push dispatch hooks, retry scheduling, and removes unsupported review moderation alerts.

alter table public.push_subscriptions
  add column if not exists browser_label text check (browser_label is null or char_length(browser_label) <= 100);

grant update(read_at) on table public.notifications to authenticated;
grant select,insert,update,delete on table public.notification_preferences to authenticated;

drop policy if exists "users update own notification read state" on public.notifications;
create policy "users update own notification read state"
on public.notifications for update
to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id);

drop policy if exists "users read own notification preferences" on public.notification_preferences;
create policy "users read own notification preferences"
on public.notification_preferences for select
to authenticated
using ((select auth.uid())=user_id);

drop policy if exists "users insert own notification preferences" on public.notification_preferences;
create policy "users insert own notification preferences"
on public.notification_preferences for insert
to authenticated
with check ((select auth.uid())=user_id);

drop policy if exists "users update own notification preferences" on public.notification_preferences;
create policy "users update own notification preferences"
on public.notification_preferences for update
to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id);

drop policy if exists "users delete own notification preferences" on public.notification_preferences;
create policy "users delete own notification preferences"
on public.notification_preferences for delete
to authenticated
using ((select auth.uid())=user_id);

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

-- The native checkout first inserts an internal draft-ish order and then authoritatively
-- finalizes it as created_source='website'. Alert only at that finalization boundary.
drop trigger if exists zwm_notification_order_insert on public.orders;

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

  if new.customer_id is not null then
    perform private.notification_create(
      new.customer_id,'customer','ORDER_CREATED','order_updates','order',new.reference,
      'customer_order_received_title','customer_order_received_body','{}'::jsonb,
      jsonb_build_object('reference',new.reference),'/order?ref='||new.reference,'important',
      jsonb_build_object('reference',new.reference,'status',new.status),
      'customer:ORDER_CREATED:'||new.reference,null
    );
  end if;
  return new;
exception when others then
  -- Notification failure must never roll back a legitimate order.
  return new;
end;
$$;
revoke all on function private.notification_order_finalized() from public,anon,authenticated;

drop trigger if exists zwm_notification_order_finalized_insert on public.orders;
create trigger zwm_notification_order_finalized_insert
after insert on public.orders
for each row execute function private.notification_order_finalized();

drop trigger if exists zwm_notification_order_finalized_update on public.orders;
create trigger zwm_notification_order_finalized_update
after update of created_source on public.orders
for each row execute function private.notification_order_finalized();

-- Storefront reviews are already verified/published and there is no moderation workflow.
-- Do not invent a "needs moderation" operational alert.
drop trigger if exists zwm_notification_review_insert on public.storefront_reviews;

create or replace function public.notification_claim_outbox(p_limit integer default 25)
returns table(
  outbox_id uuid,
  notification_id uuid,
  target_subscription_id uuid,
  attempts integer,
  user_id uuid,
  audience text,
  category text,
  notification_type text,
  title_key text,
  body_key text,
  title_args jsonb,
  body_args jsonb,
  route text,
  priority text,
  metadata jsonb
)
language plpgsql
security definer
set search_path=''
as $$
begin
  return query
  with due as (
    select o.id
    from private.notification_push_outbox o
    where o.status in ('pending','retry')
      and o.next_attempt_at<=now()
      and (o.locked_at is null or o.locked_at<now()-interval '5 minutes')
    order by o.created_at
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,25),50))
  ),
  claimed as (
    update private.notification_push_outbox o
    set status='processing',locked_at=now(),attempts=o.attempts+1,updated_at=now()
    from due
    where o.id=due.id
    returning o.*
  )
  select
    c.id,c.notification_id,c.target_subscription_id,c.attempts,
    n.user_id,n.audience,n.category,n.notification_type,n.title_key,n.body_key,
    n.title_args,n.body_args,n.route,n.priority,n.metadata
  from claimed c
  join public.notifications n on n.id=c.notification_id;
end;
$$;
revoke all on function public.notification_claim_outbox(integer) from public,anon,authenticated;
grant execute on function public.notification_claim_outbox(integer) to service_role;

create or replace function public.notification_outbox_finish(
  p_outbox_id uuid,
  p_status text,
  p_error text default null,
  p_retry_seconds integer default 60
)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_status not in ('sent','retry','dead','no_subscriptions','disabled') then
    raise exception 'Invalid notification outbox status';
  end if;
  update private.notification_push_outbox
  set status=p_status,
      last_error=case when p_error is null then null else left(p_error,1000) end,
      next_attempt_at=case when p_status='retry' then now()+make_interval(secs=>greatest(30,least(coalesce(p_retry_seconds,60),3600))) else next_attempt_at end,
      locked_at=null,
      updated_at=now()
  where id=p_outbox_id;
end;
$$;
revoke all on function public.notification_outbox_finish(uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.notification_outbox_finish(uuid,text,text,integer) to service_role;

create or replace function public.notification_delivery_record(
  p_notification_id uuid,
  p_outbox_id uuid,
  p_subscription_id uuid,
  p_state text,
  p_error_category text default null
)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_state not in ('accepted','permanent_failure','temporary_failure','skipped') then
    raise exception 'Invalid delivery state';
  end if;
  insert into private.notification_delivery_log(
    notification_id,outbox_id,subscription_id,delivery_state,error_category
  ) values(
    p_notification_id,p_outbox_id,p_subscription_id,p_state,
    case when p_error_category is null then null else left(p_error_category,120) end
  );
end;
$$;
revoke all on function public.notification_delivery_record(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.notification_delivery_record(uuid,uuid,uuid,text,text) to service_role;

create or replace function public.notification_server_config()
returns jsonb
language sql
security definer
set search_path=''
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

create or replace function private.notification_dispatch_request()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name='zwm_project_url' limit 1;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name='zwm_notification_dispatch_secret' limit 1;
  if v_url is null or v_secret is null then return new; end if;
  begin
    perform net.http_post(
      url=>rtrim(v_url,'/')||'/functions/v1/notification-push',
      headers=>jsonb_build_object('Content-Type','application/json','x-zwm-dispatch-secret',v_secret),
      body=>jsonb_build_object('action','dispatch'),
      timeout_milliseconds=>2000
    );
  exception when others then
    null;
  end;
  return new;
end;
$$;
revoke all on function private.notification_dispatch_request() from public,anon,authenticated;

drop trigger if exists zwm_notification_dispatch_request on private.notification_push_outbox;
create trigger zwm_notification_dispatch_request
after insert on private.notification_push_outbox
for each statement execute function private.notification_dispatch_request();

create or replace function private.notification_retry_tick()
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_url text;
  v_secret text;
begin
  if not exists(
    select 1 from private.notification_push_outbox
    where status in ('pending','retry')
      and next_attempt_at<=now()
      and attempts<5
  ) then return; end if;
  select decrypted_secret into v_url from vault.decrypted_secrets where name='zwm_project_url' limit 1;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name='zwm_notification_dispatch_secret' limit 1;
  if v_url is null or v_secret is null then return; end if;
  begin
    perform net.http_post(
      url=>rtrim(v_url,'/')||'/functions/v1/notification-push',
      headers=>jsonb_build_object('Content-Type','application/json','x-zwm-dispatch-secret',v_secret),
      body=>jsonb_build_object('action','dispatch'),
      timeout_milliseconds=>4000
    );
  exception when others then
    null;
  end;
end;
$$;
revoke all on function private.notification_retry_tick() from public,anon,authenticated;

do $$
begin
  if not exists(select 1 from cron.job where jobname='zwm-notification-retry') then
    perform cron.schedule('zwm-notification-retry','* * * * *','select private.notification_retry_tick();');
  end if;
end
$$;
