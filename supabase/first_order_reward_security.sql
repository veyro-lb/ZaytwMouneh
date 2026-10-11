-- Harden the existing 20-point first-order reward without adding a new bonus.
create table private.first_order_reward_claims (
 user_id uuid primary key,
 phone_key text not null unique,
 email_key text not null unique,
 order_ref text not null unique,
 points integer not null default 20 check(points=20),
 created_at timestamptz not null default now()
);
-- Claims survive account/order deletion so a new account cannot reset this reward.
alter table private.first_order_reward_claims enable row level security;
revoke all on private.first_order_reward_claims from public, anon, authenticated;

insert into private.first_order_reward_claims(user_id,phone_key,email_key,order_ref,created_at)
select l.user_id,mouneh.phone_key(coalesce(nullif(o.customer_phone,''),m.phone)),
       lower(btrim(a.email)),l.order_ref,l.created_at
from mouneh.ledger l join mouneh.members m on m.user_id=l.user_id
join auth.users a on a.id=l.user_id left join public.orders o on o.reference=l.order_ref
where l.event_key='first:'||l.user_id::text and l.points=20 and l.order_ref is not null
  and length(mouneh.phone_key(coalesce(nullif(o.customer_phone,''),m.phone)))>=7
  and nullif(btrim(a.email),'') is not null
order by l.created_at
on conflict do nothing;

create or replace function private.award_first_order_reward(ref text)
returns void language plpgsql security definer set search_path='' as $reward$
declare o public.orders; l mouneh.order_links; phone_identity text; email_identity text;
begin
 select * into o from public.orders where reference=ref;
 if not found or o.created_source is distinct from 'website'
    or o.status is distinct from 'delivered' or o.payment_status is distinct from 'paid'
    or coalesce(o.subtotal-o.discount_total,0)<=0 then return; end if;
 select * into l from mouneh.order_links where reference=ref;
 if not found or l.user_id is null then return; end if;
 perform 1 from mouneh.members where user_id=l.user_id for update;
 if not found then return; end if;
 select lower(btrim(email)) into email_identity from auth.users
 where id=l.user_id and email_confirmed_at is not null;
 phone_identity:=mouneh.phone_key(o.customer_phone);
 if email_identity is null or email_identity='' or length(phone_identity)<7 then return; end if;
 if exists(select 1 from private.first_order_reward_claims
           where user_id=l.user_id or phone_key=phone_identity or email_key=email_identity)
 or exists(select 1 from mouneh.ledger where user_id=l.user_id and event_key='first:'||l.user_id::text)
 then return; end if;
 -- Include guest orders and account history, regardless of contact formatting.
 if exists(select 1 from public.orders prior
           left join mouneh.order_links pl on pl.reference=prior.reference
           where prior.reference<>ref and prior.created_source='website'
           and (pl.user_id=l.user_id or prior.customer_id=l.user_id
                or mouneh.phone_key(prior.customer_phone)=phone_identity
                or lower(btrim(prior.customer_email))=email_identity)
           and prior.delivered_at is not null and prior.payment_status='paid') then return; end if;
 -- Also honor historical first rewards when order history has been removed.
 if exists(select 1 from mouneh.ledger previous
           join mouneh.members member on member.user_id=previous.user_id
           left join auth.users account on account.id=previous.user_id
           where previous.event_key='first:'||previous.user_id::text
           and (mouneh.phone_key(member.phone)=phone_identity
                or lower(btrim(account.email))=email_identity)) then return; end if;
 insert into private.first_order_reward_claims(user_id,phone_key,email_key,order_ref)
 values(l.user_id,phone_identity,email_identity,ref) on conflict do nothing;
 if found then perform mouneh.credit(l.user_id,20,'First delivered and paid order',
                                     'first:'||l.user_id::text,ref); end if;
end $reward$;
revoke all on function private.award_first_order_reward(text) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION mouneh.settle(ref text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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

  if o.status='delivered'
     and o.payment_status='paid'
     and l.user_id is not null
     and l.awarded=0
  then
    select * into m from mouneh.members where user_id=l.user_id for update;
    mult:=case mouneh.tier(l.user_id) when 'golden' then 1.5 when 'olive' then 1.25 else 1 end;
    n:=floor(greatest(0,l.weighted_subtotal*(1-l.discount/nullif(l.subtotal,0)))*mult);

    perform mouneh.credit(l.user_id,n,'Delivered and paid order','order:'||ref,ref);
    update mouneh.order_links set awarded=n where reference=ref;
    perform private.award_first_order_reward(ref);

    if m.referrer is not null
       and not exists(
         select 1 from mouneh.order_links
         where user_id=l.user_id and referral_awarded
       )
    then
      child_phone_key:=mouneh.phone_key(m.phone);
      select mouneh.phone_key(parent.phone)
        into parent_phone_key
      from mouneh.members parent
      where parent.user_id=m.referrer;
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

  elsif o.status='cancelled'
     or o.payment_status in ('refunded','partially_refunded')
  then
    for m in
      select mm.*
      from mouneh.members mm
      where mm.user_id in(
        select user_id from mouneh.ledger where order_ref=ref and points>0
      )
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
$function$
