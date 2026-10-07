create or replace function private.zwm_return_require_delivered()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if not exists(
    select 1 from public.orders o
    where o.reference=new.order_reference
      and o.status='delivered'
  ) then
    raise exception 'Returns and product-issue requests are available after delivery';
  end if;
  return new;
end;
$$;

revoke all on function private.zwm_return_require_delivered() from public,anon,authenticated;

drop trigger if exists return_requests_require_delivered on public.return_requests;
create trigger return_requests_require_delivered
before insert on public.return_requests
for each row execute function private.zwm_return_require_delivered();
