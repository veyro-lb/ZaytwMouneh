create index if not exists refund_transactions_processed_by_idx on public.refund_transactions(processed_by) where processed_by is not null;
create index if not exists return_fulfillments_created_by_idx on public.return_fulfillments(created_by) where created_by is not null;
create index if not exists return_fulfillments_order_reference_idx on public.return_fulfillments(order_reference);
create index if not exists return_request_events_actor_idx on public.return_request_events(actor_id) where actor_id is not null;
create index if not exists return_request_evidence_request_item_idx on public.return_request_evidence(request_item_id) where request_item_id is not null;
create index if not exists return_request_evidence_uploaded_by_idx on public.return_request_evidence(uploaded_by) where uploaded_by is not null;
create index if not exists return_request_messages_sender_idx on public.return_request_messages(sender_id) where sender_id is not null;
create index if not exists return_requests_assigned_admin_idx on public.return_requests(assigned_admin_id) where assigned_admin_id is not null;
