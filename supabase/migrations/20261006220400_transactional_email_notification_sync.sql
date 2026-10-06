-- Zayt W Mouneh — transactional email + notification synchronization.
-- Additive, production-safe extension of the existing authoritative notification event pipeline.
-- Business operations never depend on successful email delivery.

create table if not exists private.transactional_email_config (
  id boolean primary key default true check (id),
  dispatch_token text not null default encode(gen_random_bytes(32),'hex'),
  updated_at timestamptz not null default now()
);
insert into private.transactional_email_config(id) values(true) on conflict (id) do nothing;

create table if not exists private.transactional_email_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications(id) on delete set null,
  event_key text not null unique check (char_length(event_key) between 8 and 500),
  event_type text not null check (event_type in (
    'ORDER_RECEIVED','ORDER_CONFIRMED','ORDER_PREPARING','ORDER_OUT_FOR_DELIVERY',
    'ORDER_DELIVERED','ORDER_CANCELLED','ORDER_ITEM_ATTENTION',
    'WHOLESALE_REQUEST_RECEIVED','WHOLESALE_CONTACTED','WHOLESALE_NEEDS_INFORMATION',
    'WHOLESALE_QUOTE_PREPARING','WHOLESALE_QUOTE_SENT','WHOLESALE_NEGOTIATING',
    'WHOLESALE_APPROVED','WHOLESALE_COMPLETED'
  )),
  audience text not null default 'customer' check (audience in ('customer','admin')),
  recipient text not null check (char_length(recipient) between 3 and 254),
  locale text not null default 'en' check (locale in ('en','ar','fr')),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id text not null check (char_length(entity_id) between 1 and 220),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','sent','retry','dead')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  last_error text,
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists transactional_email_outbox_due_idx
  on private.transactional_email_outbox(status,next_attempt_at)
  where status in ('pending','retry');
create index if not exists transactional_email_outbox_notification_idx
  on private.transactional_email_outbox(notification_id)
  where notification_id is not null;
create index if not exists transactional_email_outbox_entity_idx
  on private.transactional_email_outbox(entity_type,entity_id,created_at desc);

revoke all on table private.transactional_email_config from public, anon, authenticated;
revoke all on table private.transactional_email_outbox from public, anon, authenticated;

create or replace function private.transactional_email_locale(p_locale text)
returns text
language sql
immutable
set search_path=''
as $$
  select case lower(trim(coalesce(p_locale,'')))
    when 'ar' then 'ar'
    when 'fr' then 'fr'
    else 'en'
  end;
$$;

create or replace function private.transactional_email_valid_recipient(p_email text)
returns boolean
language sql
immutable
set search_path=''
as $$
  select nullif(trim(coalesce(p_email,'')),'') is not null
    and char_length(trim(p_email)) <= 254
    and trim(p_email) ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$';
$$;

create or replace function private.transactional_email_enqueue(
  p_notification_id uuid,
  p_event_key text,
  p_event_type text,
  p_recipient text,
  p_locale text,
  p_entity_type text,
  p_entity_id text,
  p_payload jsonb default '{}'::jsonb,
  p_audience text default 'customer'
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid;
  v_recipient text := lower(trim(coalesce(p_recipient,'')));
begin
  if not private.transactional_email_valid_recipient(v_recipient) then
    return null;
  end if;
  if p_event_type not in (
    'ORDER_RECEIVED','ORDER_CONFIRMED','ORDER_PREPARING','ORDER_OUT_FOR_DELIVERY',
    'ORDER_DELIVERED','ORDER_CANCELLED','ORDER_ITEM_ATTENTION',
    'WHOLESALE_REQUEST_RECEIVED','WHOLESALE_CONTACTED','WHOLESALE_NEEDS_INFORMATION',
    'WHOLESALE_QUOTE_PREPARING','WHOLESALE_QUOTE_SENT','WHOLESALE_NEGOTIATING',
    'WHOLESALE_APPROVED','WHOLESALE_COMPLETED'
  ) then
    raise exception 'Unsupported transactional email event';
  end if;
  if p_audience not in ('customer','admin') then
    raise exception 'Invalid transactional email audience';
  end if;

  insert into private.transactional_email_outbox(
    notification_id,event_key,event_type,audience,recipient,locale,
    entity_type,entity_id,payload
  ) values(
    p_notification_id,left(p_event_key,500),p_event_type,p_audience,v_recipient,
    private.transactional_email_locale(p_locale),
    left(p_entity_type,80),left(p_entity_id,220),coalesce(p_payload,'{}'::jsonb)
  )
  on conflict(event_key) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
    from private.transactional_email_outbox
    where event_key=left(p_event_key,500);
  end if;
  return v_id;
end;
$$;

revoke all on function private.transactional_email_enqueue(uuid,text,text,text,text,text,text,jsonb,text) from public, anon, authenticated;

create or replace function public.transactional_email_claim_outbox(p_limit integer default 20)
returns table(
  outbox_id uuid,
  notification_id uuid,
  event_key text,
  event_type text,
  audience text,
  recipient text,
  locale text,
  entity_type text,
  entity_id text,
  payload jsonb,
  attempts integer
)
language plpgsql
security definer
set search_path=''
as $$
begin
  if coalesce((select auth.jwt()->>'role'),'') <> 'service_role' then
    raise exception 'Not authorized';
  end if;

  return query
  with due as (
    select o.id
    from private.transactional_email_outbox o
    where o.status in ('pending','retry')
      and o.next_attempt_at <= now()
      and o.attempts < 5
      and (o.locked_at is null or o.locked_at < now()-interval '5 minutes')
    order by o.created_at
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,20),50))
  ),
  claimed as (
    update private.transactional_email_outbox o
    set status='processing',
        attempts=o.attempts+1,
        locked_at=now(),
        updated_at=now()
    from due
    where o.id=due.id
    returning o.*
  )
  select c.id,c.notification_id,c.event_key,c.event_type,c.audience,c.recipient,
         c.locale,c.entity_type,c.entity_id,c.payload,c.attempts
  from claimed c;
end;
$$;

revoke all on function public.transactional_email_claim_outbox(integer) from public, anon, authenticated;
grant execute on function public.transactional_email_claim_outbox(integer) to service_role;

create or replace function public.transactional_email_outbox_finish(
  p_outbox_id uuid,
  p_status text,
  p_error text default null,
  p_provider_message_id text default null,
  p_retry_seconds integer default 60
)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if coalesce((select auth.jwt()->>'role'),'') <> 'service_role' then
    raise exception 'Not authorized';
  end if;
  if p_status not in ('sent','retry','dead') then
    raise exception 'Invalid transactional email outbox status';
  end if;

  update private.transactional_email_outbox
  set status=p_status,
      last_error=case when p_error is null then null else left(p_error,500) end,
      provider_message_id=case when p_provider_message_id is null then provider_message_id else left(p_provider_message_id,180) end,
      next_attempt_at=case when p_status='retry'
        then now()+make_interval(secs=>greatest(30,least(coalesce(p_retry_seconds,60),3600)))
        else next_attempt_at end,
      sent_at=case when p_status='sent' then now() else sent_at end,
      locked_at=null,
      updated_at=now()
  where id=p_outbox_id;
end;
$$;

revoke all on function public.transactional_email_outbox_finish(uuid,text,text,text,integer) from public, anon, authenticated;
grant execute on function public.transactional_email_outbox_finish(uuid,text,text,text,integer) to service_role;

create or replace function public.transactional_email_server_config()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  if coalesce((select auth.jwt()->>'role'),'') <> 'service_role' then
    raise exception 'Not authorized';
  end if;
  return (
    select jsonb_build_object('dispatch_token',dispatch_token)
    from private.transactional_email_config
    where id=true
  );
end;
$$;

revoke all on function public.transactional_email_server_config() from public, anon, authenticated;
grant execute on function public.transactional_email_server_config() to service_role;

create or replace function private.transactional_email_retry_tick()
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_url text;
  v_token text;
begin
  if not exists(
    select 1
    from private.transactional_email_outbox
    where status in ('pending','retry')
      and next_attempt_at<=now()
      and attempts<5
  ) then
    return;
  end if;

  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name='zwm_project_url'
  limit 1;

  select dispatch_token into v_token
  from private.transactional_email_config
  where id=true;

  if v_url is null or v_token is null then
    return;
  end if;

  begin
    perform net.http_post(
      url=>rtrim(v_url,'/')||'/functions/v1/transactional-email',
      headers=>jsonb_build_object(
        'Content-Type','application/json',
        'x-zwm-email-dispatch-secret',v_token
      ),
      body=>jsonb_build_object('action','dispatch'),
      timeout_milliseconds=>5000
    );
  exception when others then
    null;
  end;
end;
$$;

revoke all on function private.transactional_email_retry_tick() from public, anon, authenticated;

create or replace function private.transactional_email_order_recipient(
  p_customer_id uuid,
  p_order_email text
)
returns text
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_email text;
begin
  if p_customer_id is not null then
    select lower(trim(u.email))
    into v_email
    from auth.users u
    where u.id=p_customer_id
      and u.email is not null
      and u.email_confirmed_at is not null
    limit 1;
  end if;
  if not private.transactional_email_valid_recipient(v_email) then
    v_email:=lower(trim(coalesce(p_order_email,'')));
  end if;
  if not private.transactional_email_valid_recipient(v_email) then
    return null;
  end if;
  return v_email;
end;
$;

revoke all on function private.transactional_email_order_recipient(uuid,text) from public, anon, authenticated;
revoke all on function private.transactional_email_locale(text) from public, anon, authenticated;
revoke all on function private.transactional_email_valid_recipient(text) from public, anon, authenticated;

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
  v_customer_notification_id uuid;
  v_email text;
  v_locale text;
  v_route text;
begin
  if tg_op='INSERT' then
    v_finalized := new.created_source='website';
  else
    v_finalized := new.created_source='website' and old.created_source is distinct from new.created_source;
  end if;
  if not v_finalized then return new; end if;

  v_item_count := case when jsonb_typeof(new.items)='array' then
    coalesce((select sum(greatest(0,coalesce((x->>'qty')::integer,(x->>'quantity')::integer,0))) from jsonb_array_elements(new.items) x),0)
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
      v_customer_notification_id:=private.notification_create(
        new.customer_id,'customer','ORDER_CREATED','order_updates','order',new.reference,
        'customer_order_received_title','customer_order_received_body','{}'::jsonb,
        jsonb_build_object('reference',new.reference),
        '/account?notification_ref='||new.reference||'#orders','important',
        jsonb_build_object('reference',new.reference,'status',new.status),
        'customer:ORDER_CREATED:'||new.reference,null
      );
    exception when others then
      v_customer_notification_id:=null;
    end;
  end if;

  begin
    v_email:=private.transactional_email_order_recipient(new.customer_id,new.customer_email);
    v_locale:=private.transactional_email_locale(coalesce(new.extra->>'locale',new.language));
    v_route:=case when new.customer_id is not null
      then '/account?notification_ref='||new.reference||'#orders'
      else '/contact'
    end;
    perform private.transactional_email_enqueue(
      v_customer_notification_id,
      'order:'||new.reference||':received:email',
      'ORDER_RECEIVED',
      v_email,
      v_locale,
      'order',
      new.reference,
      jsonb_build_object(
        'reference',new.reference,
        'customer_name',coalesce(new.customer_name,''),
        'items',coalesce(new.items,'[]'::jsonb),
        'total',new.total,
        'currency',new.currency,
        'delivery_summary',coalesce(new.delivery_address->>'area',new.area,''),
        'status',new.status,
        'route',v_route
      ),
      'customer'
    );
  exception when others then
    raise warning 'Order % finalized, but transactional email queueing failed: %',new.reference,sqlerrm;
  end;

  return new;
end;
$$;

create or replace function private.notification_order_update()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_admin record;
  v_notification_id uuid;
  v_email text;
  v_locale text;
  v_route text;
  v_event_type text;
begin
  if old.status is distinct from new.status
     and new.status in ('confirmed','preparing','out_for_delivery','delivered','cancelled') then

    if new.customer_id is not null then
      begin
        v_notification_id:=private.notification_create(
          new.customer_id,'customer','ORDER_STATUS_CHANGED','order_updates','order',new.reference,
          'customer_order_'||new.status||'_title','customer_order_status_body','{}'::jsonb,
          jsonb_build_object('reference',new.reference,'status',new.status),
          '/account?notification_ref='||new.reference||'#orders',
          case when new.status in ('delivered','cancelled') then 'important' else 'informational' end,
          jsonb_build_object('reference',new.reference,'status',new.status),
          'customer:ORDER_STATUS:'||new.reference||':'||new.status,null
        );
      exception when others then
        v_notification_id:=null;
      end;
    end if;

    v_event_type:=case new.status
      when 'confirmed' then 'ORDER_CONFIRMED'
      when 'preparing' then 'ORDER_PREPARING'
      when 'out_for_delivery' then 'ORDER_OUT_FOR_DELIVERY'
      when 'delivered' then 'ORDER_DELIVERED'
      when 'cancelled' then 'ORDER_CANCELLED'
      else null
    end;

    begin
      if v_event_type is not null then
        v_email:=private.transactional_email_order_recipient(new.customer_id,new.customer_email);
        v_locale:=private.transactional_email_locale(coalesce(new.extra->>'locale',new.language));
        v_route:=case when new.customer_id is not null
          then '/account?notification_ref='||new.reference||'#orders'
          else '/contact'
        end;
        perform private.transactional_email_enqueue(
          v_notification_id,
          'order:'||new.reference||':status:'||new.status||':email',
          v_event_type,
          v_email,
          v_locale,
          'order',
          new.reference,
          jsonb_build_object(
            'reference',new.reference,
            'customer_name',coalesce(new.customer_name,''),
            'items',coalesce(new.items,'[]'::jsonb),
            'total',new.total,
            'currency',new.currency,
            'delivery_summary',coalesce(new.delivery_address->>'area',new.area,''),
            'status',new.status,
            'route',v_route,
            'cancellation_reason',case when new.status='cancelled' then coalesce(new.cancellation_reason,'') else '' end
          ),
          'customer'
        );
      end if;
    exception when others then
      raise warning 'Order % status saved, but transactional email queueing failed: %',new.reference,sqlerrm;
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

create or replace function private.zwm_notify_wholesale_insert()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  a record;
  v_reference text := 'ZW-B2B-' || upper(substr(replace(new.id::text,'-',''),1,8));
  v_customer_notification_id uuid;
  v_email text;
begin
  if to_regclass('public.notifications') is null then
    return new;
  end if;

  for a in select user_id from public.admin_users loop
    begin
      perform private.notification_create(
        a.user_id,'admin','WHOLESALE_INQUIRY_CREATED','wholesale',
        'wholesale_lead',new.id::text,
        'wholesale.created.title','wholesale.created.body',
        '{}'::jsonb,
        jsonb_build_object('reference',v_reference,'business_name',new.business_name),
        '/admin?notification=wholesale&id='||new.id::text,
        'critical',
        jsonb_build_object('reference',v_reference,'business_name',new.business_name,'business_type',new.business_type),
        'admin:WHOLESALE_INQUIRY_CREATED:'||new.id::text,
        null
      );
    exception when others then
      raise warning 'Wholesale lead % saved, but admin notification failed for user %: %',new.id,a.user_id,sqlerrm;
    end;
  end loop;

  if new.customer_user_id is not null and new.customer_hidden_at is null then
    begin
      v_customer_notification_id:=private.notification_create(
        new.customer_user_id,'customer','WHOLESALE_STATUS_CHANGED','wholesale',
        'wholesale_lead',new.id::text,
        'customer_wholesale_status_title','customer_wholesale_status_body',
        '{}'::jsonb,
        jsonb_build_object('reference',v_reference,'status','new'),
        '/wholesale?notification=wholesale&id='||new.id::text||'#wholesale-history',
        'important',
        jsonb_build_object('reference',v_reference,'status','new','business_name',new.business_name),
        'customer:WHOLESALE_STATUS:'||new.id::text||':new',
        null
      );
    exception when others then
      v_customer_notification_id:=null;
    end;
  end if;

  begin
    select lower(trim(u.email)) into v_email
    from auth.users u
    where u.id=new.customer_user_id and u.email is not null and u.email_confirmed_at is not null
    limit 1;
    if not private.transactional_email_valid_recipient(v_email) then
      v_email:=lower(trim(coalesce(new.email,'')));
    end if;
    perform private.transactional_email_enqueue(
      v_customer_notification_id,
      'wholesale:'||new.id::text||':received:email',
      'WHOLESALE_REQUEST_RECEIVED',
      v_email,
      private.transactional_email_locale(new.locale),
      'wholesale_lead',
      new.id::text,
      jsonb_build_object(
        'reference',v_reference,
        'business_name',new.business_name,
        'contact_name',new.contact_name,
        'status','new',
        'route',case when new.customer_user_id is not null
          then '/wholesale?notification=wholesale&id='||new.id::text||'#wholesale-history'
          else '/wholesale'
        end
      ),
      'customer'
    );
  exception when others then
    raise warning 'Wholesale lead % saved, but transactional email queueing failed: %',new.id,sqlerrm;
  end;

  return new;
end;
$$;

create or replace function private.zwm_notify_wholesale_status_update()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_reference text := 'ZW-B2B-' || upper(substr(replace(new.id::text,'-',''),1,8));
  v_notification_id uuid;
  v_email text;
  v_event_type text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  if new.customer_user_id is not null and new.customer_hidden_at is null then
    begin
      v_notification_id:=private.notification_create(
        new.customer_user_id,'customer','WHOLESALE_STATUS_CHANGED','wholesale',
        'wholesale_lead',new.id::text,
        'customer_wholesale_status_title','customer_wholesale_status_body',
        '{}'::jsonb,
        jsonb_build_object('reference',v_reference,'status',new.status),
        '/wholesale?notification=wholesale&id='||new.id::text||'#wholesale-history',
        case when new.status in ('needs_information','approved','converted','lost') then 'important' else 'informational' end,
        jsonb_build_object('reference',v_reference,'status',new.status,'business_name',new.business_name),
        'customer:WHOLESALE_STATUS:'||new.id::text||':'||new.status,
        null
      );
    exception when others then
      v_notification_id:=null;
    end;
  end if;

  v_event_type:=case new.status
    when 'contacted' then 'WHOLESALE_CONTACTED'
    when 'needs_information' then 'WHOLESALE_NEEDS_INFORMATION'
    when 'quote_preparing' then 'WHOLESALE_QUOTE_PREPARING'
    when 'quote_sent' then 'WHOLESALE_QUOTE_SENT'
    when 'negotiating' then 'WHOLESALE_NEGOTIATING'
    when 'approved' then 'WHOLESALE_APPROVED'
    when 'converted' then 'WHOLESALE_COMPLETED'
    else null
  end;

  if v_event_type is not null then
    begin
      select lower(trim(u.email)) into v_email
      from auth.users u
      where u.id=new.customer_user_id and u.email is not null and u.email_confirmed_at is not null
      limit 1;
      if not private.transactional_email_valid_recipient(v_email) then
        v_email:=lower(trim(coalesce(new.email,'')));
      end if;
      perform private.transactional_email_enqueue(
        v_notification_id,
        'wholesale:'||new.id::text||':status:'||new.status||':email',
        v_event_type,
        v_email,
        private.transactional_email_locale(new.locale),
        'wholesale_lead',
        new.id::text,
        jsonb_build_object(
          'reference',v_reference,
          'business_name',new.business_name,
          'contact_name',new.contact_name,
          'status',new.status,
          'route',case when new.customer_user_id is not null
            then '/wholesale?notification=wholesale&id='||new.id::text||'#wholesale-history'
            else '/wholesale'
          end
        ),
        'customer'
      );
    exception when others then
      raise warning 'Wholesale status for lead % saved, but transactional email queueing failed: %',new.id,sqlerrm;
    end;
  end if;

  return new;
end;
$$;

create or replace function public.admin_mark_order_item_attention(
  p_reference text,
  p_item_label text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := auth.uid();
  v_order public.orders%rowtype;
  v_label text := left(trim(coalesce(p_item_label,'')),200);
  v_note text := nullif(left(trim(coalesce(p_note,'')),500),'');
  v_hash text;
  v_customer_notification_id uuid;
  v_email text;
  v_locale text;
  a record;
begin
  if v_user is null or not exists(select 1 from public.admin_users where user_id=v_user) then
    raise exception 'Owner access required';
  end if;
  if v_label='' then
    raise exception 'Choose the item that needs attention';
  end if;

  select * into v_order
  from public.orders
  where reference=left(trim(coalesce(p_reference,'')),80)
  limit 1;
  if not found then
    raise exception 'Order not found';
  end if;

  v_hash:=md5(lower(v_label));

  if v_order.customer_id is not null then
    begin
      v_customer_notification_id:=private.notification_create(
        v_order.customer_id,'customer','ORDER_ITEM_ATTENTION','order_updates','order',v_order.reference,
        'customer_order_item_attention_title','customer_order_item_attention_body','{}'::jsonb,
        jsonb_build_object('reference',v_order.reference,'item',v_label),
        '/account?notification_ref='||v_order.reference||'#orders',
        'critical',
        jsonb_build_object('reference',v_order.reference,'item',v_label,'note',coalesce(v_note,'')),
        'customer:ORDER_ITEM_ATTENTION:'||v_order.reference||':'||v_hash,
        null
      );
    exception when others then
      v_customer_notification_id:=null;
    end;
  end if;

  begin
    for a in select user_id from public.admin_users loop
      perform private.notification_create(
        a.user_id,'admin','ORDER_ITEM_ATTENTION','customer_requests','order',v_order.reference,
        'admin_order_item_attention_title','admin_order_item_attention_body','{}'::jsonb,
        jsonb_build_object('reference',v_order.reference,'item',v_label),
        '/admin?view=orders&order='||v_order.reference,
        'critical',
        jsonb_build_object('reference',v_order.reference,'item',v_label,'note',coalesce(v_note,'')),
        'admin:ORDER_ITEM_ATTENTION:'||v_order.reference||':'||v_hash,
        null
      );
    end loop;
  exception when others then
    null;
  end;

  begin
    v_email:=private.transactional_email_order_recipient(v_order.customer_id,v_order.customer_email);
    v_locale:=private.transactional_email_locale(coalesce(v_order.extra->>'locale',v_order.language));
    perform private.transactional_email_enqueue(
      v_customer_notification_id,
      'order:'||v_order.reference||':item_attention:'||v_hash||':email',
      'ORDER_ITEM_ATTENTION',
      v_email,
      v_locale,
      'order',
      v_order.reference,
      jsonb_build_object(
        'reference',v_order.reference,
        'customer_name',coalesce(v_order.customer_name,''),
        'item',v_label,
        'note',coalesce(v_note,''),
        'status',v_order.status,
        'route',case when v_order.customer_id is not null
          then '/account?notification_ref='||v_order.reference||'#orders'
          else '/contact'
        end
      ),
      'customer'
    );
  exception when others then
    raise warning 'Order % item-attention email queueing failed: %',v_order.reference,sqlerrm;
  end;

  return true;
end;
$$;

revoke all on function public.admin_mark_order_item_attention(text,text,text) from public, anon;
grant execute on function public.admin_mark_order_item_attention(text,text,text) to authenticated, service_role;

drop trigger if exists zwm_notification_order_finalized_insert on public.orders;
create trigger zwm_notification_order_finalized_insert
after insert on public.orders
for each row execute function private.notification_order_finalized();

drop trigger if exists zwm_notification_order_finalized_update on public.orders;
create trigger zwm_notification_order_finalized_update
after update on public.orders
for each row execute function private.notification_order_finalized();

drop trigger if exists zwm_notification_order_update on public.orders;
create trigger zwm_notification_order_update
after update on public.orders
for each row execute function private.notification_order_update();

drop trigger if exists zwm_notification_wholesale_insert on public.wholesale_leads;
create trigger zwm_notification_wholesale_insert
after insert on public.wholesale_leads
for each row execute function private.zwm_notify_wholesale_insert();

drop trigger if exists zwm_notification_wholesale_status_update on public.wholesale_leads;
create trigger zwm_notification_wholesale_status_update
after update of status on public.wholesale_leads
for each row
when (old.status is distinct from new.status)
execute function private.zwm_notify_wholesale_status_update();

do $$
declare
  j record;
begin
  for j in select jobid from cron.job where jobname='zwm-transactional-email-retry' loop
    perform cron.unschedule(j.jobid);
  end loop;
  perform cron.schedule(
    'zwm-transactional-email-retry',
    '* * * * *',
    'select private.transactional_email_retry_tick();'
  );
end
$$;

notify pgrst,'reload schema';
