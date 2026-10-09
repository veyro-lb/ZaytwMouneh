-- Remove obsolete order/return notifications whenever an owner deletes these records.
create or replace function private.zwm_prune_deleted_record_notifications()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if tg_table_name='orders' then
   delete from public.notifications where entity_type='order' and entity_id=old.reference;
 elsif tg_table_name='return_requests' then
   delete from public.notifications where entity_type='return_request' and entity_id=old.id::text;
 end if;
 return old;
end $$;
revoke all on function private.zwm_prune_deleted_record_notifications() from public,anon,authenticated;
drop trigger if exists zwm_deleted_order_notification_cleanup on public.orders;
create trigger zwm_deleted_order_notification_cleanup after delete on public.orders
for each row execute function private.zwm_prune_deleted_record_notifications();
drop trigger if exists zwm_deleted_return_notification_cleanup on public.return_requests;
create trigger zwm_deleted_return_notification_cleanup after delete on public.return_requests
for each row execute function private.zwm_prune_deleted_record_notifications();