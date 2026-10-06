-- Zayt W Mouneh — admin returns payload hardening.
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
revoke all on function private.zwm_return_admin_payload(uuid) from public,anon,authenticated;
