-- Close legacy order-creation bypasses and keep native checkout analytics/customer links in sync.

create or replace function public.mouneh_api(action text, p jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
begin
  if action='submit' then
    raise exception 'Use the secure website checkout to place orders.';
  elsif action='join_secure' then
    return mouneh.join_secure(p->>'name',p->>'phone',p->>'referral');
  elsif action='referral_status' then
    return mouneh.referral_status();
  end if;
  return mouneh.api(action,p);
end
$$;

create or replace function public.mouneh_rewards(action text, p jsonb default '{}'::jsonb)
returns jsonb
language sql
security definer
set search_path=''
as $$ select public.mouneh_api(action,p) $$;

revoke all on function mouneh.api(text,jsonb) from anon,authenticated;
grant execute on function public.mouneh_api(text,jsonb) to anon,authenticated,service_role;
grant execute on function public.mouneh_rewards(text,jsonb) to anon,authenticated,service_role;

drop policy if exists "site can insert analytics events" on public.site_events;
create policy "site can insert analytics events"
on public.site_events
for insert
to anon,authenticated
with check (
  event_name = any(array[
    'page_view','product_view','add_to_cart','whatsapp_click','search',
    'cart_opened','checkout_started','checkout_completed','order_delivered'
  ])
  and char_length(page_path)<=300
  and coalesce(char_length(session_id),0)<=80
  and coalesce(char_length(referrer_host),0)<=180
);

create or replace function mouneh.sync_order_customer()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.user_id is not null then
    update public.orders
    set customer_id=new.user_id,
        updated_at=greatest(updated_at,now())
    where reference=new.reference
      and customer_id is distinct from new.user_id;
  end if;
  return new;
end
$$;

drop trigger if exists mouneh_order_customer_sync on mouneh.order_links;
create trigger mouneh_order_customer_sync
after insert or update of user_id on mouneh.order_links
for each row
when (new.user_id is not null)
execute function mouneh.sync_order_customer();

update public.orders o
set customer_id=l.user_id
from mouneh.order_links l
where l.reference=o.reference
  and l.user_id is not null
  and o.customer_id is distinct from l.user_id;

notify pgrst,'reload schema';

