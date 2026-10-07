alter table private.transactional_email_outbox
  drop constraint if exists transactional_email_outbox_event_type_check;

alter table private.transactional_email_outbox
  add constraint transactional_email_outbox_event_type_check
  check (event_type = any (array[
    'ORDER_RECEIVED'::text,
    'ORDER_CONFIRMED'::text,
    'ORDER_PREPARING'::text,
    'ORDER_OUT_FOR_DELIVERY'::text,
    'ORDER_DELIVERED'::text,
    'ORDER_CANCELLED'::text,
    'ORDER_ITEM_ATTENTION'::text,
    'WHOLESALE_REQUEST_RECEIVED'::text,
    'WHOLESALE_CONTACTED'::text,
    'WHOLESALE_NEEDS_INFORMATION'::text,
    'WHOLESALE_QUOTE_PREPARING'::text,
    'WHOLESALE_QUOTE_SENT'::text,
    'WHOLESALE_NEGOTIATING'::text,
    'WHOLESALE_APPROVED'::text,
    'WHOLESALE_COMPLETED'::text,
    'RETURN_REQUEST_RECEIVED'::text,
    'RETURN_INFORMATION_NEEDED'::text,
    'RETURN_REPLY_RECEIVED'::text,
    'RETURN_AUTHORIZED'::text,
    'RETURN_RESOLUTION_APPROVED'::text,
    'RETURN_REJECTED'::text,
    'RETURN_REFUND_PENDING'::text,
    'RETURN_REFUND_COMPLETED'::text,
    'RETURN_COMPLETED'::text
  ]));

create or replace function private.transactional_email_enqueue(
  p_notification_id uuid,
  p_event_key text,
  p_event_type text,
  p_recipient text,
  p_locale text,
  p_entity_type text,
  p_entity_id text,
  p_payload jsonb default '{}'::jsonb,
  p_audience text default 'customer'::text
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
    'WHOLESALE_APPROVED','WHOLESALE_COMPLETED',
    'RETURN_REQUEST_RECEIVED','RETURN_INFORMATION_NEEDED','RETURN_REPLY_RECEIVED',
    'RETURN_AUTHORIZED','RETURN_RESOLUTION_APPROVED','RETURN_REJECTED',
    'RETURN_REFUND_PENDING','RETURN_REFUND_COMPLETED','RETURN_COMPLETED'
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

revoke all on function private.transactional_email_enqueue(uuid,text,text,text,text,text,text,jsonb,text)
from public,anon,authenticated;

create or replace function public.zwm_return_admin_customer_message(
  p_request_id uuid,
  p_message text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  r public.return_requests;
  v_message text:=trim(coalesce(p_message,''));
  v_suffix text:='reply:'||gen_random_uuid()::text;
begin
  if u is null
     or not exists(select 1 from public.admin_users a where a.user_id=u) then
    raise exception 'Owner access required';
  end if;

  select * into r
  from public.return_requests
  where id=p_request_id
  for update;

  if r.id is null then raise exception 'Request not found'; end if;
  if r.status in ('completed','rejected','cancelled') then raise exception 'This request is closed'; end if;
  if char_length(v_message) not between 1 and 3000 then raise exception 'Customer-visible message is required'; end if;

  insert into public.return_request_messages(request_id,sender_id,sender_role,visibility,message)
  values(r.id,u,'admin','customer',v_message);

  update public.return_requests
  set assigned_admin_id=coalesce(assigned_admin_id,u),updated_at=now()
  where id=r.id
  returning * into r;

  insert into public.return_request_events(request_id,actor_id,event_type,new_state,metadata,customer_visible)
  values(r.id,u,'admin_customer_message',jsonb_build_object('status',r.status),jsonb_build_object('message_added',true),true);

  perform private.zwm_return_notify_customer(
    r.id,'RETURN_STATUS_CHANGED','RETURN_REPLY_RECEIVED',v_suffix,v_message
  );

  return private.zwm_return_admin_payload(r.id);
end;
$$;

revoke all on function public.zwm_return_admin_customer_message(uuid,text) from public,anon;
grant execute on function public.zwm_return_admin_customer_message(uuid,text) to authenticated,service_role;
