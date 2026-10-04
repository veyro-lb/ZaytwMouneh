-- A temporary failed payment must not release a reserved reward voucher.
-- The voucher remains attached for a retry; cancellation/refund releases it.

create or replace function mouneh.settle(ref text)
returns void
language plpgsql
set search_path=''
as $$
declare
  l mouneh.order_links;
  o public.orders;
  m mouneh.members;
  n integer;
  mult numeric;
  child_phone_key text;
  parent_phone_key text;
  order_phone_key text;
begin
  select * into l from mouneh.order_links where reference=ref for update;
  if not found then return; end if;
  select * into o from public.orders where reference=ref;

  if o.status='delivered' and o.payment_status='paid' and l.user_id is not null and l.awarded=0 then
    select * into m from mouneh.members where user_id=l.user_id for update;
    mult:=case mouneh.tier(l.user_id) when 'golden' then 1.5 when 'olive' then 1.25 else 1 end;
    n:=floor(greatest(0,l.weighted_subtotal*(1-l.discount/nullif(l.subtotal,0)))*mult);

    perform mouneh.credit(l.user_id,n,'Delivered and paid order','order:'||ref,ref);
    update mouneh.order_links set awarded=n where reference=ref;
    perform mouneh.credit(l.user_id,20,'First delivered and paid order','first:'||l.user_id,ref);

    if m.referrer is not null
       and not exists(select 1 from mouneh.order_links where user_id=l.user_id and referral_awarded)
    then
      child_phone_key:=mouneh.phone_key(m.phone);
      select mouneh.phone_key(parent.phone) into parent_phone_key
      from mouneh.members parent where parent.user_id=m.referrer;
      order_phone_key:=mouneh.phone_key(o.customer_phone);

      if not exists(
           select 1
           from mouneh.order_links prior_link
           join public.orders prior_order using(reference)
           where prior_link.user_id=l.user_id
             and prior_link.reference<>ref
             and prior_order.delivered_at is not null
             and prior_order.payment_status='paid'
         )
         and m.created_at<=o.submitted_at
         and l.subtotal-l.discount>=25
         and length(child_phone_key)>=7
         and length(parent_phone_key)>=7
         and child_phone_key<>parent_phone_key
         and (order_phone_key='' or order_phone_key<>parent_phone_key)
      then
        perform mouneh.credit(m.referrer,50,'Friend completed first qualifying delivered and paid order','referrer:'||l.user_id,ref);
        perform mouneh.credit(l.user_id,20,'Referral welcome bonus','referred:'||l.user_id,ref);
        update mouneh.order_links set referral_awarded=true where reference=ref;
      end if;
    end if;

    update mouneh.wallet set status='used' where order_ref=ref and status='reserved';

  elsif o.status='cancelled' or o.payment_status in ('refunded','partially_refunded') then
    for m in
      select mm.*
      from mouneh.members mm
      where mm.user_id in(select user_id from mouneh.ledger where order_ref=ref and points>0)
      order by mm.user_id
    loop
      perform mouneh.credit(
        m.user_id,
        -coalesce((select sum(points)::integer from mouneh.ledger where order_ref=ref and user_id=m.user_id and points>0),0),
        case when o.status='cancelled' then 'Cancelled order' else 'Payment reversed / refunded' end,
        'reverse:'||ref||':'||m.user_id,
        ref
      );
    end loop;

    update mouneh.order_links set awarded=0 where reference=ref;
    update mouneh.wallet set status='available',order_ref=null where order_ref=ref;
  end if;
end
$$;

revoke all on function mouneh.settle(text) from public,anon,authenticated;
