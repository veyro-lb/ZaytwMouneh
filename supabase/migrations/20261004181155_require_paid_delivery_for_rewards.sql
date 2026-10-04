-- Require verified delivery and verified payment before awarding Mouneh Points.

alter table public.orders
  add column if not exists paid_at timestamptz,
  add column if not exists payment_status_history jsonb not null default '[]'::jsonb;

update public.orders
set payment_status_history=jsonb_build_array(
  jsonb_build_object(
    'status',coalesce(payment_status,'pending'),
    'at',coalesce(updated_at,submitted_at,now()),
    'source','migration'
  )
)
where jsonb_array_length(coalesce(payment_status_history,'[]'::jsonb))=0;

create or replace function mouneh.order_payment_guard()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  admin_user boolean:=false;
  service_user boolean:=false;
  allowed boolean:=false;
  source_name text:='owner';
begin
  admin_user:=auth.uid() is not null and exists(select 1 from public.admin_users where user_id=auth.uid());
  service_user:=coalesce(auth.role(),'')='service_role';

  if not admin_user and not service_user then
    raise exception 'Owner or trusted payment service authentication required';
  end if;

  if old.payment_status is not distinct from new.payment_status then return new; end if;

  allowed:=case coalesce(old.payment_status,'pending')
    when 'pending' then new.payment_status in ('paid','failed','not_required')
    when 'failed' then new.payment_status in ('pending','paid')
    when 'paid' then new.payment_status in ('partially_refunded','refunded')
    when 'partially_refunded' then new.payment_status='refunded'
    when 'not_required' then new.payment_status in ('pending','paid')
    when 'refunded' then false
    else false
  end;

  if not allowed then
    raise exception 'Invalid payment status transition: % to %',old.payment_status,new.payment_status;
  end if;

  source_name:=case when service_user and not admin_user then 'payment_service' else 'owner' end;
  new.updated_at:=now();

  if new.payment_status='paid' then
    new.paid_at:=coalesce(new.paid_at,now());
  end if;

  new.payment_status_history:=coalesce(old.payment_status_history,'[]'::jsonb)
    || jsonb_build_array(jsonb_build_object(
      'status',new.payment_status,
      'previous',old.payment_status,
      'at',now(),
      'source',source_name,
      'actor',case when admin_user then auth.uid()::text else null end
    ));

  return new;
end
$$;

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

  elsif o.status='cancelled' or o.payment_status in ('failed','refunded','partially_refunded') then
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

create or replace function mouneh.order_payment_after()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  perform mouneh.settle(new.reference);
  return new;
end
$$;

drop trigger if exists mouneh_order_payment_guard on public.orders;
drop trigger if exists mouneh_order_payment_after on public.orders;

create trigger mouneh_order_payment_guard
before update of payment_status on public.orders
for each row when(old.payment_status is distinct from new.payment_status)
execute function mouneh.order_payment_guard();

create trigger mouneh_order_payment_after
after update of payment_status on public.orders
for each row when(old.payment_status is distinct from new.payment_status)
execute function mouneh.order_payment_after();

create or replace function mouneh.referral_status()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid := auth.uid();
  m mouneh.members;
  joined_count integer := 0;
  qualified_count integer := 0;
  disqualified_count integer := 0;
begin
  if u is null then raise exception 'Sign in required'; end if;
  select * into m from mouneh.members where user_id=u;
  if not found then raise exception 'Join Mouneh Rewards first'; end if;

  select count(*)::integer into joined_count from mouneh.members child where child.referrer=u;

  select count(*)::integer into qualified_count
  from mouneh.members child
  where child.referrer=u
    and exists (
      select 1 from mouneh.order_links l join public.orders o using(reference)
      where l.user_id=child.user_id and l.referral_awarded=true
        and o.status='delivered' and o.payment_status='paid'
    );

  select count(*)::integer into disqualified_count
  from mouneh.members child
  where child.referrer=u
    and not exists (
      select 1 from mouneh.order_links l join public.orders o using(reference)
      where l.user_id=child.user_id and l.referral_awarded=true
        and o.status='delivered' and o.payment_status='paid'
    )
    and exists (
      select 1 from mouneh.order_links l join public.orders o using(reference)
      where l.user_id=child.user_id and o.delivered_at is not null and o.payment_status='paid'
    );

  return jsonb_build_object(
    'code',m.code,'joined',joined_count,'qualified',qualified_count,'disqualified',disqualified_count,
    'pending',greatest(joined_count-qualified_count-disqualified_count,0),
    'reward_points',50,'friend_bonus_points',20,'minimum_order',25,
    'confirmation','owner_delivered_and_payment_received'
  );
end
$$;

revoke all on function mouneh.referral_status() from public,anon;
grant execute on function mouneh.referral_status() to authenticated;

notify pgrst,'reload schema';
