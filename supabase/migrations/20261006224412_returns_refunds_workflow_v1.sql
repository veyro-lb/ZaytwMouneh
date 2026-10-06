-- Zayt W Mouneh — returns/refunds authoritative workflow.
-- Source mirror of production migration 20261006224412.

alter table private.transactional_email_outbox drop constraint if exists transactional_email_outbox_event_type_check;
alter table private.transactional_email_outbox add constraint transactional_email_outbox_event_type_check check (event_type in (
  'ORDER_RECEIVED','ORDER_CONFIRMED','ORDER_PREPARING','ORDER_OUT_FOR_DELIVERY','ORDER_DELIVERED','ORDER_CANCELLED','ORDER_ITEM_ATTENTION',
  'WHOLESALE_REQUEST_RECEIVED','WHOLESALE_CONTACTED','WHOLESALE_NEEDS_INFORMATION','WHOLESALE_QUOTE_PREPARING','WHOLESALE_QUOTE_SENT','WHOLESALE_NEGOTIATING','WHOLESALE_APPROVED','WHOLESALE_COMPLETED',
  'RETURN_REQUEST_RECEIVED','RETURN_INFORMATION_NEEDED','RETURN_AUTHORIZED','RETURN_RESOLUTION_APPROVED','RETURN_REJECTED','RETURN_REFUND_PENDING','RETURN_REFUND_COMPLETED','RETURN_COMPLETED'
));

CREATE OR REPLACE FUNCTION private.zwm_return_admin_payload(p_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select private.zwm_return_customer_payload(r.id)||jsonb_build_object(
  'safety_flag',r.safety_flag,'additional_review_recommended',r.additional_review_recommended,
  'assigned_admin_id',r.assigned_admin_id,'internal_note',r.internal_note,
  'order',(select to_jsonb(o)-'private_notes' from public.orders o where o.reference=r.order_reference),
  'admin_items',coalesce((select jsonb_agg(jsonb_build_object(
    'id',i.id,'line_index',i.line_index,'product_id',i.product_id,'variant_id',i.variant_id,'product_name',i.product_name,
    'variant_name',i.variant_name,'purchased_quantity',i.purchased_quantity,'quantity_requested',i.quantity_requested,
    'approved_quantity',i.approved_quantity,'line_gross_amount',i.line_gross_amount,'line_net_paid_amount',i.line_net_paid_amount,
    'approved_refund_amount',i.approved_refund_amount,'received_at',i.received_at,'inspected_at',i.inspected_at,
    'inspection_condition',i.inspection_condition,'inventory_disposition',i.inventory_disposition
  ) order by i.line_index) from public.return_request_items i where i.request_id=r.id),'[]'::jsonb),
  'admin_evidence',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'storage_path',e.storage_path,'mime_type',e.mime_type,'file_size',e.file_size,'created_at',e.created_at) order by e.created_at)
    from public.return_request_evidence e where e.request_id=r.id),'[]'::jsonb),
  'internal_messages',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'sender_role',m.sender_role,'message',m.message,'created_at',m.created_at) order by m.created_at)
    from public.return_request_messages m where m.request_id=r.id and m.visibility='internal'),'[]'::jsonb),
  'audit_events',coalesce((select jsonb_agg(jsonb_build_object('event_type',e.event_type,'actor_id',e.actor_id,'previous_state',e.previous_state,'new_state',e.new_state,'metadata',e.metadata,'customer_visible',e.customer_visible,'created_at',e.created_at) order by e.created_at)
    from public.return_request_events e where e.request_id=r.id),'[]'::jsonb),
  'claim_history',jsonb_build_object(
    'orders',(select count(*) from public.orders o where r.customer_id is not null and o.customer_id=r.customer_id),
    'requests',(select count(*) from public.return_requests x where r.customer_id is not null and x.customer_id=r.customer_id),
    'approved',(select count(*) from public.return_requests x where r.customer_id is not null and x.customer_id=r.customer_id and x.status in ('approved','resolution_in_progress','completed')),
    'rejected',(select count(*) from public.return_requests x where r.customer_id is not null and x.customer_id=r.customer_id and x.status='rejected'),
    'refunded',coalesce((select sum(t.amount) from public.refund_transactions t join public.return_requests x on x.id=t.request_id
      where r.customer_id is not null and x.customer_id=r.customer_id and t.status='completed'),0)
  )
) from public.return_requests r where r.id=p_id
$function$;

CREATE OR REPLACE FUNCTION private.zwm_return_customer_payload(p_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select jsonb_build_object(
  'id',r.id,'request_number',r.public_request_number,'order_reference',r.order_reference,
  'reason_code',r.reason_code,'status',r.status,'requested_resolution',r.requested_resolution,
  'resolution_type',r.resolution_type,'refund_status',r.refund_status,'customer_description',r.customer_description,
  'discovered_at',r.discovered_at,'submitted_at',r.submitted_at,'updated_at',r.updated_at,'resolved_at',r.resolved_at,
  'visible_issue_reported_late',r.visible_issue_reported_late,'change_of_mind_manual_date_review',r.change_of_mind_manual_date_review,
  'return_not_required',r.return_not_required,'customer_visible_resolution',r.customer_visible_resolution,
  'rejection_reason',r.rejection_reason,'approved_refund_total',r.approved_refund_total,
  'items',coalesce((select jsonb_agg(jsonb_build_object(
    'id',i.id,'line_index',i.line_index,'product_id',i.product_id,'variant_id',i.variant_id,'product_name',i.product_name,
    'variant_name',i.variant_name,'purchased_quantity',i.purchased_quantity,'quantity_requested',i.quantity_requested,
    'approved_quantity',i.approved_quantity,'approved_refund_amount',i.approved_refund_amount,'received_at',i.received_at,
    'inspected_at',i.inspected_at,'inventory_disposition',i.inventory_disposition
  ) order by i.line_index) from public.return_request_items i where i.request_id=r.id),'[]'::jsonb),
  'messages',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'sender_role',m.sender_role,'message',m.message,'created_at',m.created_at) order by m.created_at)
    from public.return_request_messages m where m.request_id=r.id and m.visibility='customer'),'[]'::jsonb),
  'events',coalesce((select jsonb_agg(jsonb_build_object('event_type',e.event_type,'new_state',e.new_state,'metadata',e.metadata,'created_at',e.created_at) order by e.created_at)
    from public.return_request_events e where e.request_id=r.id and e.customer_visible),'[]'::jsonb),
  'evidence',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'mime_type',e.mime_type,'file_size',e.file_size,'created_at',e.created_at) order by e.created_at)
    from public.return_request_evidence e where e.request_id=r.id),'[]'::jsonb),
  'refund',(select jsonb_build_object('amount',t.amount,'currency',t.currency,'method',t.method,'status',t.status,'external_reference',t.external_reference,'processed_at',t.processed_at)
    from public.refund_transactions t where t.request_id=r.id limit 1),
  'fulfillment',(select jsonb_build_object('type',f.fulfillment_type,'status',f.status,'replacement_details',f.replacement_details,'exchange_difference',f.exchange_difference,'completed_at',f.completed_at)
    from public.return_fulfillments f where f.request_id=r.id limit 1)
) from public.return_requests r where r.id=p_id
$function$;

CREATE OR REPLACE FUNCTION private.zwm_return_evidence_after_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.return_request_events(request_id,actor_id,event_type,new_state,metadata,customer_visible)
  values(new.request_id,new.uploaded_by,'evidence_added',jsonb_build_object('evidence_id',new.id,'mime_type',new.mime_type,'file_size',new.file_size),'{}'::jsonb,true);
  perform private.zwm_return_notify_admins(new.request_id,'RETURN_CUSTOMER_UPDATE','evidence:'||new.id::text,'important');
  return new;
end $function$;

CREATE OR REPLACE FUNCTION private.zwm_return_notify_admins(p_id uuid, p_type text, p_suffix text, p_priority text DEFAULT 'important'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.return_requests; a record;
begin
  select * into r from public.return_requests where id=p_id;
  if r.id is null then return; end if;
  for a in select user_id from public.admin_users loop
    perform private.notification_create(a.user_id,'admin',p_type,'customer_requests','return_request',r.id::text,
      'admin_return_update_title','admin_return_update_body','{}'::jsonb,
      jsonb_build_object('reference',r.public_request_number,'order_reference',r.order_reference,'status',r.status,'reason_code',r.reason_code,'safety_flag',r.safety_flag),
      '/admin?view=returns&request='||r.public_request_number,p_priority,
      jsonb_build_object('reference',r.public_request_number,'order_reference',r.order_reference,'status',r.status,'reason_code',r.reason_code,'safety_flag',r.safety_flag),
      'admin:'||p_type||':'||r.public_request_number||':'||left(p_suffix,120),null);
  end loop;
exception when others then
  raise warning 'Return admin notification failed for %: %',p_id,sqlerrm;
end $function$;

CREATE OR REPLACE FUNCTION private.zwm_return_notify_customer(p_id uuid, p_type text, p_event text, p_suffix text, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.return_requests; o public.orders; uid uuid;
begin
  select * into r from public.return_requests where id=p_id;
  if r.id is null then return; end if;
  select * into o from public.orders where reference=r.order_reference;
  uid:=coalesce(r.customer_id,o.customer_id,(select l.user_id from mouneh.order_links l where l.reference=r.order_reference));
  if uid is not null then
    perform private.notification_create(uid,'customer',p_type,'customer_requests','return_request',r.id::text,
      'customer_return_update_title','customer_return_update_body','{}'::jsonb,
      jsonb_build_object('reference',r.public_request_number,'order_reference',r.order_reference,'status',r.status,
        'resolution_type',r.resolution_type,'refund_status',r.refund_status,'amount',r.approved_refund_total,'note',coalesce(p_note,'')),
      '/account?return_request='||r.public_request_number||'#orders',
      case when r.status in ('rejected','completed') then 'important' else 'informational' end,
      jsonb_build_object('reference',r.public_request_number,'order_reference',r.order_reference,'status',r.status,
        'resolution_type',r.resolution_type,'refund_status',r.refund_status,'amount',r.approved_refund_total,'note',coalesce(p_note,'')),
      'customer:'||p_type||':'||r.public_request_number||':'||left(p_suffix,120),null);
  end if;
  perform private.zwm_return_queue_email(r.id,p_event,p_suffix,p_note);
exception when others then
  raise warning 'Return customer notification failed for %: %',p_id,sqlerrm;
end $function$;

CREATE OR REPLACE FUNCTION private.zwm_return_order_access(p_ref text, p_claim text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=auth.uid(); o public.orders; l mouneh.order_links;
begin
  select * into o from public.orders where reference=p_ref;
  if o.reference is null then return false; end if;
  if u is not null and exists(select 1 from public.admin_users a where a.user_id=u) then return true; end if;
  select * into l from mouneh.order_links where reference=p_ref;
  if u is not null and (o.customer_id=u or l.user_id=u) then return true; end if;
  return l.user_id is null and length(coalesce(p_claim,''))>=64 and l.claim_hash=md5(coalesce(p_claim,''));
end $function$;

CREATE OR REPLACE FUNCTION private.zwm_return_queue_email(p_id uuid, p_event text, p_suffix text, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.return_requests; o public.orders; recipient text; loc text; route text;
begin
  select * into r from public.return_requests where id=p_id;
  if r.id is null then return; end if;
  select * into o from public.orders where reference=r.order_reference;
  recipient:=private.transactional_email_order_recipient(o.customer_id,o.customer_email);
  if not private.transactional_email_valid_recipient(recipient) then return; end if;
  loc:=private.transactional_email_locale(coalesce(o.extra->>'locale',o.language));
  route:=case when o.customer_id is not null then '/account?return_request='||r.public_request_number||'#orders' else '/order?ref='||r.order_reference end;
  insert into private.transactional_email_outbox(notification_id,event_key,event_type,audience,recipient,locale,entity_type,entity_id,payload)
  values(null,'return:'||r.public_request_number||':'||left(p_suffix,180)||':email',p_event,'customer',recipient,loc,'return_request',r.id::text,
    jsonb_build_object('reference',r.public_request_number,'order_reference',r.order_reference,'status',r.status,
      'resolution_type',r.resolution_type,'refund_status',r.refund_status,'approved_refund_total',r.approved_refund_total,
      'currency',o.currency,'note',coalesce(p_note,''),'route',route))
  on conflict(event_key) do nothing;
exception when others then
  raise warning 'Return email queue failed for %: %',p_id,sqlerrm;
end $function$;

CREATE OR REPLACE FUNCTION private.zwm_returns(action text, p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  u uuid:=auth.uid(); is_admin boolean:=false; ref text; claim text; reason text; descr text; req public.return_requests; ord public.orders;
  rid uuid; public_no text; client_id uuid; line record; j jsonb; qty integer; reserved integer; manual_date boolean:=false; late boolean:=false;
  a text; msg text; rejection text; previous jsonb; res text; approved_qty integer; other_refund numeric(12,2); line_max numeric(12,2);
  total_max numeric(12,2):=0; proposed numeric(12,2); remaining numeric(12,2); allocation numeric(12,2); order_remaining numeric(12,2);
  tx public.refund_transactions; method text; ext text; evidence_count integer; evidence_bytes bigint;
begin
  action:=lower(trim(coalesce(action,'')));
  is_admin:=u is not null and exists(select 1 from public.admin_users x where x.user_id=u);

  if action='order_context' then
    ref:=left(trim(coalesce(p->>'reference','')),80); claim:=coalesce(p->>'claim_token','');
    if not private.zwm_return_order_access(ref,claim) then raise exception 'Order not found'; end if;
    select * into ord from public.orders where reference=ref;
    return jsonb_build_object(
      'reference',ord.reference,'status',ord.status,'delivered_at',ord.delivered_at,'payment_status',ord.payment_status,'currency',ord.currency,
      'eligible_for_help',ord.status in ('out_for_delivery','delivered'),
      'unopened_return_allowed',ord.delivered_at is null or ord.delivered_at>=now()-interval '10 days',
      'unopened_return_needs_manual_date_review',ord.delivered_at is null,
      'visible_issue_reported_late',ord.delivered_at is not null and ord.delivered_at<now()-interval '48 hours',
      'items',coalesce((select jsonb_agg(to_jsonb(x) order by x.line_index) from private.zwm_return_order_lines(ref) x),'[]'::jsonb),
      'requests',coalesce((select jsonb_agg(private.zwm_return_customer_payload(r.id) order by r.submitted_at desc)
        from public.return_requests r where r.order_reference=ref),'[]'::jsonb)
    );
  end if;

  if action='submit' then
    ref:=left(trim(coalesce(p->>'reference','')),80); claim:=coalesce(p->>'claim_token','');
    if not private.zwm_return_order_access(ref,claim) then raise exception 'Order not found'; end if;
    select * into ord from public.orders where reference=ref for share;
    if ord.status not in ('out_for_delivery','delivered') then raise exception 'This order is not eligible for a product issue request yet'; end if;
    reason:=lower(trim(coalesce(p->>'reason_code','')));
    if reason not in ('damaged','leaking_broken','wrong_product','missing_item','quality_safety','unopened_return','other') then raise exception 'Please select a valid issue'; end if;
    descr:=trim(coalesce(p->>'description',''));
    if char_length(descr) not between 3 and 3000 then raise exception 'Please describe what happened'; end if;
    client_id:=nullif(p->>'client_request_id','')::uuid;
    if client_id is null then raise exception 'Missing request token'; end if;
    select * into req from public.return_requests where client_request_id=client_id;
    if req.id is not null then
      if req.order_reference<>ref then raise exception 'Request token already used'; end if;
      return private.zwm_return_customer_payload(req.id);
    end if;

    if reason='unopened_return' then
      if ord.delivered_at is not null and ord.delivered_at<now()-interval '10 days' then
        raise exception 'The standard return/exchange period for an unused product has ended.';
      end if;
      manual_date:=ord.delivered_at is null;
      if coalesce((p->>'unopened')::boolean,false) is not true
        or coalesce((p->>'unused')::boolean,false) is not true
        or coalesce((p->>'seal_intact')::boolean,false) is not true
        or coalesce((p->>'packaging_intact')::boolean,false) is not true then
        raise exception 'Unopened returns require the item to be unused, sealed and in original packaging';
      end if;
    end if;
    late:=reason in ('damaged','leaking_broken','wrong_product','missing_item') and ord.delivered_at is not null and ord.delivered_at<now()-interval '48 hours';
    if jsonb_typeof(p->'items')<>'array' or jsonb_array_length(p->'items')<1 then raise exception 'Select at least one affected item'; end if;

    loop
      public_no:='ZWM-RR-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
      exit when not exists(select 1 from public.return_requests r where r.public_request_number=public_no);
    end loop;
    insert into public.return_requests(public_request_number,order_reference,customer_id,client_request_id,request_type,reason_code,status,requested_resolution,
      customer_description,discovered_at,visible_issue_reported_late,change_of_mind_manual_date_review,safety_flag,additional_review_recommended)
    values(public_no,ref,coalesce(u,ord.customer_id),client_id,case when reason='unopened_return' then 'return_exchange' else 'product_issue' end,
      reason,'submitted',nullif(lower(trim(coalesce(p->>'requested_resolution',''))),''),
      descr,nullif(p->>'discovered_at','')::timestamptz,late,manual_date,reason='quality_safety',false)
    returning * into req;

    for j in select value from jsonb_array_elements(p->'items') loop
      qty:=greatest(1,coalesce((j->>'quantity')::integer,1));
      select * into line from private.zwm_return_order_lines(ref) x where x.line_index=(j->>'line_index')::integer;
      if line.line_index is null then raise exception 'Selected item is not in this order'; end if;
      select coalesce(sum(i.quantity_requested),0) into reserved
      from public.return_request_items i join public.return_requests r on r.id=i.request_id
      where r.order_reference=ref and i.line_index=line.line_index and r.id<>req.id and r.status not in ('rejected','cancelled');
      if qty>line.purchased_quantity-reserved then raise exception 'Requested quantity exceeds the unresolved quantity for this order item'; end if;
      insert into public.return_request_items(request_id,line_index,line_key,product_id,variant_id,product_name,variant_name,purchased_quantity,quantity_requested,
        line_gross_amount,line_net_paid_amount,condition_declared)
      values(req.id,line.line_index,line.line_key,line.product_id,line.variant_id,line.product_name,line.variant_name,line.purchased_quantity,qty,
        line.gross_amount,line.allocated_net_amount,
        case when reason='unopened_return' then 'Customer declared unopened, unused, seal intact and original packaging intact' else null end);
    end loop;

    insert into public.return_request_events(request_id,actor_id,event_type,new_state,metadata,customer_visible)
    values(req.id,u,'request_submitted',jsonb_build_object('status','submitted'),jsonb_build_object('reason_code',reason,'late_visible_issue',late,'manual_delivery_date_review',manual_date),true);
    perform private.zwm_return_notify_admins(req.id,case when reason='quality_safety' then 'RETURN_SAFETY_ISSUE' else 'RETURN_REQUEST_CREATED' end,'submitted',case when reason='quality_safety' then 'critical' else 'important' end);
    perform private.zwm_return_notify_customer(req.id,'RETURN_REQUEST_CREATED','RETURN_REQUEST_RECEIVED','submitted',null);
    return private.zwm_return_customer_payload(req.id);
  end if;

  if action in ('list','detail','add_message','cancel','evidence_context') then
    if action='list' then
      if u is null then raise exception 'Sign in required'; end if;
      return jsonb_build_object('requests',coalesce((select jsonb_agg(private.zwm_return_customer_payload(r.id) order by r.submitted_at desc)
        from public.return_requests r where r.customer_id=u
          or exists(select 1 from mouneh.order_links l where l.reference=r.order_reference and l.user_id=u)
          or exists(select 1 from public.orders o where o.reference=r.order_reference and o.customer_id=u)),'[]'::jsonb));
    end if;
    rid:=nullif(p->>'request_id','')::uuid;
    if rid is null and nullif(p->>'request_number','') is not null then
      select id into rid from public.return_requests where public_request_number=left(trim(p->>'request_number'),40);
    end if;
    select * into req from public.return_requests where id=rid;
    if req.id is null or not private.zwm_return_order_access(req.order_reference,coalesce(p->>'claim_token','')) then raise exception 'Request not found'; end if;
    if action='detail' then return private.zwm_return_customer_payload(req.id); end if;
    if action='evidence_context' then
      if u is null then raise exception 'Sign in required to attach evidence'; end if;
      select count(*),coalesce(sum(file_size),0) into evidence_count,evidence_bytes from public.return_request_evidence where request_id=req.id;
      return jsonb_build_object('request_id',req.id,'status',req.status,'file_count',evidence_count,'total_bytes',evidence_bytes,'can_upload',req.status not in ('completed','rejected','cancelled'));
    end if;
    if action='add_message' then
      if req.status in ('completed','rejected','cancelled') then raise exception 'This request is closed'; end if;
      msg:=trim(coalesce(p->>'message',''));
      if char_length(msg) not between 1 and 3000 then raise exception 'Message is required'; end if;
      insert into public.return_request_messages(request_id,sender_id,sender_role,visibility,message) values(req.id,u,'customer','customer',msg);
      if req.status='awaiting_customer' then update public.return_requests set status='under_review',updated_at=now() where id=req.id returning * into req; end if;
      insert into public.return_request_events(request_id,actor_id,event_type,new_state,metadata,customer_visible)
      values(req.id,u,'customer_message_added',jsonb_build_object('status',req.status),jsonb_build_object('message_added',true),true);
      perform private.zwm_return_notify_admins(req.id,'RETURN_CUSTOMER_UPDATE','message:'||gen_random_uuid()::text,'important');
      return private.zwm_return_customer_payload(req.id);
    end if;
    if action='cancel' then
      if req.status not in ('submitted','awaiting_customer') then raise exception 'This request can no longer be cancelled online'; end if;
      update public.return_requests set status='cancelled',cancelled_at=now(),updated_at=now() where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,new_state,customer_visible)
      values(req.id,u,'request_cancelled',jsonb_build_object('status','cancelled'),true);
      return private.zwm_return_customer_payload(req.id);
    end if;
  end if;

  if action in ('admin_list','admin_detail','admin_action') then
    if not is_admin then raise exception 'Owner access required'; end if;
    if action='admin_list' then
      return jsonb_build_object('requests',coalesce((select jsonb_agg(jsonb_build_object(
        'id',r.id,'request_number',r.public_request_number,'order_reference',r.order_reference,'reason_code',r.reason_code,'status',r.status,
        'submitted_at',r.submitted_at,'updated_at',r.updated_at,'safety_flag',r.safety_flag,'refund_status',r.refund_status,
        'approved_refund_total',r.approved_refund_total,'customer_id',r.customer_id,
        'customer_name',o.customer_name,'customer_email',o.customer_email,
        'potential_amount',coalesce((select sum(i.line_net_paid_amount*i.quantity_requested/i.purchased_quantity) from public.return_request_items i where i.request_id=r.id),0)
      ) order by r.submitted_at desc) from public.return_requests r join public.orders o on o.reference=r.order_reference),'[]'::jsonb));
    end if;
    rid:=nullif(p->>'request_id','')::uuid;
    if rid is null and nullif(p->>'request_number','') is not null then select id into rid from public.return_requests where public_request_number=left(trim(p->>'request_number'),40); end if;
    if action='admin_detail' then
      if rid is null then raise exception 'Request not found'; end if;
      return private.zwm_return_admin_payload(rid);
    end if;

    a:=lower(trim(coalesce(p->>'admin_action','')));
    select * into req from public.return_requests where id=rid for update;
    if req.id is null then raise exception 'Request not found'; end if;
    select * into ord from public.orders where reference=req.order_reference for update;
    previous:=jsonb_build_object('status',req.status,'resolution_type',req.resolution_type,'refund_status',req.refund_status,'approved_refund_total',req.approved_refund_total);

    if a='start_review' then
      if req.status<>'submitted' then raise exception 'Request is not awaiting review'; end if;
      update public.return_requests set status='under_review',review_started_at=coalesce(review_started_at,now()),assigned_admin_id=u,updated_at=now() where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,previous_state,new_state,customer_visible)
      values(req.id,u,'review_started',previous,jsonb_build_object('status','under_review'),true);
      return private.zwm_return_admin_payload(req.id);
    elsif a='request_information' then
      if req.status not in ('submitted','under_review','awaiting_customer') then raise exception 'Information cannot be requested in this state'; end if;
      msg:=trim(coalesce(p->>'customer_message',''));
      if char_length(msg) not between 3 and 3000 then raise exception 'Customer-visible message is required'; end if;
      insert into public.return_request_messages(request_id,sender_id,sender_role,visibility,message) values(req.id,u,'admin','customer',msg);
      update public.return_requests set status='awaiting_customer',assigned_admin_id=u,updated_at=now() where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,previous_state,new_state,customer_visible)
      values(req.id,u,'information_requested',previous,jsonb_build_object('status','awaiting_customer'),true);
      perform private.zwm_return_notify_customer(req.id,'RETURN_MORE_INFO_NEEDED','RETURN_INFORMATION_NEEDED','information_needed:'||gen_random_uuid()::text,msg);
      return private.zwm_return_admin_payload(req.id);
    elsif a='authorize_return' then
      if req.status not in ('submitted','under_review','awaiting_customer') then raise exception 'Return cannot be authorized in this state'; end if;
      update public.return_requests set status='return_authorized',assigned_admin_id=u,updated_at=now() where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,previous_state,new_state,customer_visible)
      values(req.id,u,'return_authorized',previous,jsonb_build_object('status','return_authorized'),true);
      perform private.zwm_return_notify_customer(req.id,'RETURN_STATUS_CHANGED','RETURN_AUTHORIZED','return_authorized',coalesce(p->>'customer_message',''));
      return private.zwm_return_admin_payload(req.id);
    elsif a='waive_return' then
      if req.reason_code<>'quality_safety' then raise exception 'Return waiver is reserved for safety / impractical cases'; end if;
      update public.return_requests set return_not_required=true,status=case when status='submitted' then 'under_review' else status end,assigned_admin_id=u,updated_at=now() where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,previous_state,new_state,metadata,customer_visible)
      values(req.id,u,'return_waived',previous,jsonb_build_object('status',req.status,'return_not_required',true),jsonb_build_object('reason','safety_or_impractical'),true);
      return private.zwm_return_admin_payload(req.id);
    elsif a='mark_received' then
      if req.status<>'return_authorized' then raise exception 'Return is not authorized'; end if;
      update public.return_request_items set received_at=now(),inventory_disposition='not_restockable',updated_at=now() where request_id=req.id;
      update public.return_requests set status='received',assigned_admin_id=u,updated_at=now() where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,previous_state,new_state,customer_visible)
      values(req.id,u,'items_received',previous,jsonb_build_object('status','received'),true);
      return private.zwm_return_admin_payload(req.id);
    elsif a='mark_inspected' then
      if req.status not in ('received','return_authorized','under_review') then raise exception 'Inspection is not available in this state'; end if;
      update public.return_request_items set inspected_at=now(),inspection_condition=left(nullif(trim(coalesce(p->>'inspection_condition','')),''),500),
        inventory_disposition=case when lower(coalesce(p->>'inventory_disposition','not_restockable')) in ('restockable','dispose','not_restockable')
          then lower(coalesce(p->>'inventory_disposition','not_restockable')) else 'not_restockable' end,updated_at=now() where request_id=req.id;
      update public.return_requests set status='under_review',assigned_admin_id=u,updated_at=now() where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,previous_state,new_state,customer_visible)
      values(req.id,u,'items_inspected',previous,jsonb_build_object('status','under_review'),true);
      return private.zwm_return_admin_payload(req.id);
    elsif a in ('approve_replacement','approve_exchange') then
      if req.status not in ('submitted','under_review','received','return_authorized') then raise exception 'Resolution cannot be approved in this state'; end if;
      res:=case when a='approve_replacement' then 'replacement' else 'exchange' end;
      insert into public.return_fulfillments(request_id,order_reference,fulfillment_type,status,replacement_details,exchange_difference,created_by)
      values(req.id,req.order_reference,res,'pending',coalesce(p->'replacement_details','{}'::jsonb),
        round(coalesce(nullif(p->>'exchange_difference','')::numeric,0),2),u)
      on conflict(request_id) do update set fulfillment_type=excluded.fulfillment_type,replacement_details=excluded.replacement_details,
        exchange_difference=excluded.exchange_difference,updated_at=now();
      update public.return_request_items set approved_quantity=quantity_requested,approved_refund_amount=0,
        inventory_disposition=coalesce(inventory_disposition,'not_restockable'),updated_at=now() where request_id=req.id;
      update public.return_requests set status='resolution_in_progress',resolution_type=res,refund_status='not_required',
        approved_refund_total=0,assigned_admin_id=u,customer_visible_resolution=left(nullif(trim(coalesce(p->>'customer_message','')),''),2000),updated_at=now()
      where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,previous_state,new_state,customer_visible)
      values(req.id,u,res||'_approved',previous,jsonb_build_object('status','resolution_in_progress','resolution_type',res),true);
      perform private.zwm_return_notify_customer(req.id,'RETURN_STATUS_CHANGED','RETURN_RESOLUTION_APPROVED',res||'_approved',coalesce(p->>'customer_message',''));
      return private.zwm_return_admin_payload(req.id);
    elsif a in ('approve_partial_refund','approve_full_refund') then
      if req.status not in ('submitted','under_review','received','return_authorized') then raise exception 'Refund cannot be approved in this state'; end if;
      total_max:=0;
      for line in select * from public.return_request_items i where i.request_id=req.id order by i.line_index for update loop
        approved_qty:=coalesce((select (x->>'approved_quantity')::integer from jsonb_array_elements(coalesce(p->'approved_items','[]'::jsonb)) x
          where (x->>'line_index')::integer=line.line_index limit 1),line.quantity_requested);
        if approved_qty<0 or approved_qty>line.quantity_requested then raise exception 'Approved quantity exceeds the requested quantity'; end if;
        select coalesce(sum(i2.approved_refund_amount),0) into other_refund
        from public.return_request_items i2 join public.return_requests r2 on r2.id=i2.request_id
        where r2.order_reference=req.order_reference and i2.line_index=line.line_index and r2.id<>req.id and r2.refund_status in ('pending','processing','completed');
        line_max:=greatest(0,trunc((line.line_net_paid_amount*approved_qty/line.purchased_quantity)::numeric,2)-other_refund);
        total_max:=total_max+line_max;
      end loop;
      select greatest(0,(ord.subtotal-coalesce(ord.discount_total,0))-coalesce(sum(t.amount),0)) into order_remaining
      from public.refund_transactions t where t.order_reference=req.order_reference and t.request_id<>req.id and t.status in ('pending','processing','completed');
      order_remaining:=coalesce(order_remaining,greatest(0,ord.subtotal-coalesce(ord.discount_total,0)));
      total_max:=least(total_max,order_remaining);
      if total_max<=0 then raise exception 'No refundable value remains for the selected item(s)'; end if;
      proposed:=case when a='approve_full_refund' then total_max else round(coalesce(nullif(p->>'refund_amount','')::numeric,0),2) end;
      if proposed<=0 or proposed>total_max then raise exception 'Refund amount exceeds the maximum remaining refundable amount'; end if;

      remaining:=proposed;
      for line in select * from public.return_request_items i where i.request_id=req.id order by i.line_index for update loop
        approved_qty:=coalesce((select (x->>'approved_quantity')::integer from jsonb_array_elements(coalesce(p->'approved_items','[]'::jsonb)) x
          where (x->>'line_index')::integer=line.line_index limit 1),line.quantity_requested);
        select coalesce(sum(i2.approved_refund_amount),0) into other_refund
        from public.return_request_items i2 join public.return_requests r2 on r2.id=i2.request_id
        where r2.order_reference=req.order_reference and i2.line_index=line.line_index and r2.id<>req.id and r2.refund_status in ('pending','processing','completed');
        line_max:=greatest(0,trunc((line.line_net_paid_amount*approved_qty/line.purchased_quantity)::numeric,2)-other_refund);
        allocation:=least(line_max,remaining);
        update public.return_request_items set approved_quantity=approved_qty,approved_refund_amount=allocation,updated_at=now() where id=line.id;
        remaining:=remaining-allocation;
      end loop;
      if remaining<>0 then raise exception 'Refund allocation could not be completed safely'; end if;
      insert into public.refund_transactions(request_id,order_reference,amount,currency,status,idempotency_key)
      values(req.id,req.order_reference,proposed,ord.currency,'pending',coalesce(nullif(p->>'idempotency_key','')::uuid,gen_random_uuid()))
      on conflict(request_id) do nothing returning * into tx;
      if tx.id is null then select * into tx from public.refund_transactions where request_id=req.id; end if;
      if tx.amount<>proposed or tx.status not in ('pending','failed') then raise exception 'A refund transaction already exists for this request'; end if;
      res:=case when a='approve_full_refund' then 'full_refund' else 'partial_refund' end;
      update public.return_requests set status='resolution_in_progress',resolution_type=res,refund_status='pending',approved_refund_total=proposed,
        assigned_admin_id=u,customer_visible_resolution=left(nullif(trim(coalesce(p->>'customer_message','')),''),2000),updated_at=now()
      where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,previous_state,new_state,metadata,customer_visible)
      values(req.id,u,'refund_approved',previous,jsonb_build_object('status','resolution_in_progress','resolution_type',res,'refund_status','pending','approved_refund_total',proposed),
        jsonb_build_object('amount',proposed,'currency',ord.currency,'maximum',total_max),true);
      perform private.zwm_return_notify_customer(req.id,'RETURN_STATUS_CHANGED','RETURN_REFUND_PENDING','refund_pending',coalesce(p->>'customer_message',''));
      return private.zwm_return_admin_payload(req.id);
    elsif a='mark_refund_processed' then
      select * into tx from public.refund_transactions where request_id=req.id for update;
      if tx.id is null or tx.status not in ('pending','failed') or req.refund_status not in ('pending','failed') then raise exception 'No pending refund is available'; end if;
      method:=lower(trim(coalesce(p->>'refund_method',''))); ext:=left(nullif(trim(coalesce(p->>'refund_reference','')),''),180);
      if method not in ('cash','bank_transfer','original_payment_method','other') then raise exception 'Refund method is required'; end if;
      update public.refund_transactions set status='completed',method=method,external_reference=ext,processed_by=u,
        processed_at=coalesce(nullif(p->>'processed_at','')::timestamptz,now()),failure_reason=null,updated_at=now() where id=tx.id;
      update public.return_requests set status='completed',refund_status='completed',resolved_at=now(),updated_at=now() where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,previous_state,new_state,metadata,customer_visible)
      values(req.id,u,'refund_completed',previous,jsonb_build_object('status','completed','refund_status','completed','approved_refund_total',req.approved_refund_total),
        jsonb_build_object('method',method,'reference',ext),true);
      perform private.zwm_return_notify_customer(req.id,'RETURN_STATUS_CHANGED','RETURN_REFUND_COMPLETED','refund_completed',coalesce(p->>'customer_message',''));
      return private.zwm_return_admin_payload(req.id);
    elsif a='mark_refund_failed' then
      select * into tx from public.refund_transactions where request_id=req.id for update;
      if tx.id is null or tx.status not in ('pending','processing') then raise exception 'No refund is being processed'; end if;
      msg:=left(trim(coalesce(p->>'failure_reason','Refund processing failed')),500);
      update public.refund_transactions set status='failed',failure_reason=msg,updated_at=now() where id=tx.id;
      update public.return_requests set refund_status='failed',status='resolution_in_progress',updated_at=now() where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,previous_state,new_state,metadata,customer_visible)
      values(req.id,u,'refund_failed',previous,jsonb_build_object('status','resolution_in_progress','refund_status','failed'),jsonb_build_object('reason',msg),false);
      perform private.zwm_return_notify_admins(req.id,'RETURN_REFUND_FAILED','refund_failed','critical');
      return private.zwm_return_admin_payload(req.id);
    elsif a='reject' then
      if req.status in ('completed','rejected','cancelled') then raise exception 'Request is already closed'; end if;
      rejection:=trim(coalesce(p->>'rejection_reason',''));
      if char_length(rejection) not between 3 and 1200 then raise exception 'A professional customer-facing rejection reason is required'; end if;
      update public.return_requests set status='rejected',resolution_type='none',refund_status='not_required',rejection_reason=rejection,
        customer_visible_resolution=null,resolved_at=now(),assigned_admin_id=u,updated_at=now() where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,previous_state,new_state,metadata,customer_visible)
      values(req.id,u,'request_rejected',previous,jsonb_build_object('status','rejected'),jsonb_build_object('reason',rejection),true);
      perform private.zwm_return_notify_customer(req.id,'RETURN_STATUS_CHANGED','RETURN_REJECTED','rejected',rejection);
      return private.zwm_return_admin_payload(req.id);
    elsif a='complete_resolution' then
      if req.status<>'resolution_in_progress' or req.resolution_type not in ('replacement','exchange') then raise exception 'No replacement or exchange is in progress'; end if;
      update public.return_fulfillments set status='completed',completed_at=now(),updated_at=now() where request_id=req.id;
      update public.return_requests set status='completed',resolved_at=now(),updated_at=now() where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,previous_state,new_state,customer_visible)
      values(req.id,u,'resolution_completed',previous,jsonb_build_object('status','completed','resolution_type',req.resolution_type),true);
      perform private.zwm_return_notify_customer(req.id,'RETURN_STATUS_CHANGED','RETURN_COMPLETED','completed',coalesce(p->>'customer_message',''));
      return private.zwm_return_admin_payload(req.id);
    elsif a='internal_note' then
      msg:=trim(coalesce(p->>'internal_note',''));
      if char_length(msg) not between 1 and 3000 then raise exception 'Internal note is required'; end if;
      insert into public.return_request_messages(request_id,sender_id,sender_role,visibility,message) values(req.id,u,'admin','internal',msg);
      update public.return_requests set internal_note=left(msg,3000),updated_at=now() where id=req.id returning * into req;
      insert into public.return_request_events(request_id,actor_id,event_type,previous_state,new_state,metadata,customer_visible)
      values(req.id,u,'internal_note_added',previous,jsonb_build_object('status',req.status),jsonb_build_object('internal',true),false);
      return private.zwm_return_admin_payload(req.id);
    end if;
    raise exception 'Unknown admin action';
  end if;

  raise exception 'Unknown returns action';
end $function$;

CREATE OR REPLACE FUNCTION public.zwm_returns(action text, p jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select private.zwm_returns(action,p) $function$;

revoke all on function private.zwm_return_order_access(text,text) from public,anon,authenticated;
revoke all on function private.zwm_return_customer_payload(uuid) from public,anon,authenticated;
revoke all on function private.zwm_return_admin_payload(uuid) from public,anon,authenticated;
revoke all on function private.zwm_return_queue_email(uuid,text,text,text) from public,anon,authenticated;
revoke all on function private.zwm_return_notify_customer(uuid,text,text,text,text) from public,anon,authenticated;
revoke all on function private.zwm_return_notify_admins(uuid,text,text,text) from public,anon,authenticated;
revoke all on function private.zwm_return_evidence_after_insert() from public,anon,authenticated;

drop trigger if exists return_request_evidence_after_insert on public.return_request_evidence;
create trigger return_request_evidence_after_insert
after insert on public.return_request_evidence
for each row execute function private.zwm_return_evidence_after_insert();

revoke all on function public.zwm_returns(text,jsonb) from public;
grant execute on function public.zwm_returns(text,jsonb) to anon,authenticated,service_role;
