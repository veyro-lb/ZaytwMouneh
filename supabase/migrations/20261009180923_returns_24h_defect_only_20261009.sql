-- Mirrored from the 2026-10-09 Supabase migration of the same timestamp.
-- Restricts new online requests to genuine product/order issues within 24 hours of delivery.
-- Claims covered by consumer law, late reports or delivery-time disputes go to customer service.
create or replace function private.zwm_return_validate_24h_issue()
returns trigger
language plpgsql
set search_path = ''
as $body$
declare
  delivery_time timestamptz;
  order_state text;
begin
  if new.reason_code not in ('damaged','leaking_broken','wrong_product','missing_item','quality_safety','other') then
    raise exception 'Returns are accepted only for genuine product or order problems. Please contact Zayt w Mouneh for other assistance.';
  end if;
  select o.delivered_at, o.status into delivery_time, order_state
  from public.orders o where o.reference = new.order_reference;
  if order_state is distinct from 'delivered' or delivery_time is null then
    raise exception 'The delivery time could not be verified. Please contact Zayt w Mouneh.';
  end if;
  if delivery_time > statement_timestamp() then
    raise exception 'The recorded delivery time is invalid. Please contact Zayt w Mouneh.';
  end if;
  if delivery_time < statement_timestamp() - interval '24 hours' then
    raise exception 'The 24-hour online product issue reporting period has ended. Please contact Zayt w Mouneh for further assistance.';
  end if;
  return new;
end
$body$;

drop trigger if exists zwm_return_validate_24h_issue on public.return_requests;
create trigger zwm_return_validate_24h_issue
before insert on public.return_requests
for each row
execute function private.zwm_return_validate_24h_issue();
