-- Annual rewards tier spend counts only orders that are both paid and delivered.

create or replace function mouneh.spend(u uuid)
returns numeric
language sql
stable
set search_path=''
as $$
  select coalesce(sum(l.subtotal-l.discount),0)
  from mouneh.order_links l
  join public.orders o using(reference)
  where l.user_id=u
    and o.status='delivered'
    and o.payment_status='paid'
    and o.delivered_at >= date_trunc('year',now())
$$;
