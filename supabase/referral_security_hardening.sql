-- Referral security hardening for Zayt w Mouneh Mouneh Points.
-- Applied to the live Supabase project on 2026-10-04.
-- Keeps referral attribution one-time, delivery-gated, phone-normalized,
-- non-retroactive, and synchronized with customer referral status.

create or replace function mouneh.phone_key(raw text)
returns text
language plpgsql
immutable
set search_path=''
as $$
declare
  d text := regexp_replace(coalesce(raw,''),'[^0-9]','','g');
begin
  if left(d,2)='00' then d:=substr(d,3); end if;
  if left(d,3)='961' then d:=substr(d,4); end if;
  if length(d)>7 and left(d,1)='0' then d:=substr(d,2); end if;
  return d;
end
$$;

revoke all on function mouneh.phone_key(text) from public, anon, authenticated;

create or replace function mouneh.join_secure(name text, phone text, referral text default null)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid := auth.uid();
  clean_name text := trim(coalesce(name,''));
  clean_phone text := trim(coalesce(phone,''));
  clean_phone_key text := mouneh.phone_key(phone);
  clean_ref text := upper(trim(coalesce(referral,'')));
  ref_user uuid;
  ref_phone_key text;
  existing mouneh.members;
begin
  if u is null or not exists (
    select 1 from auth.users
    where id=u and email_confirmed_at is not null and not is_anonymous
  ) then
    raise exception 'Please sign in with a verified email';
  end if;

  if not exists(select 1 from mouneh.config where enabled) then
    raise exception 'Rewards enrollment is currently paused';
  end if;

  if char_length(clean_name) < 2 or char_length(clean_name) > 120 then
    raise exception 'Please enter your full name';
  end if;

  if char_length(clean_phone_key) < 7 or char_length(clean_phone_key) > 15 then
    raise exception 'Please enter a valid phone / WhatsApp number';
  end if;

  select * into existing from mouneh.members where user_id=u;
  if found then
    return jsonb_build_object(
      'ok', true,
      'already_member', true,
      'referral_applied', existing.referrer is not null
    );
  end if;

  if clean_ref <> '' then
    if clean_ref !~ '^[A-Z0-9]{10}$' then
      raise exception 'Referral code not found. Check the code or leave it blank.';
    end if;

    select user_id, mouneh.phone_key(m.phone)
      into ref_user, ref_phone_key
    from mouneh.members m
    where m.code=clean_ref and m.user_id<>u
    limit 1;

    if ref_user is null then
      raise exception 'Referral code not found. Check the code or leave it blank.';
    end if;

    if ref_phone_key<>'' and ref_phone_key=clean_phone_key then
      raise exception 'This referral code cannot be used with the same phone number.';
    end if;
  end if;

  insert into mouneh.members(user_id,name,phone,referrer)
  values(u,clean_name,clean_phone,ref_user);

  perform mouneh.credit(u,10,'Welcome to Mouneh Rewards','join:'||u);

  return jsonb_build_object(
    'ok', true,
    'already_member', false,
    'referral_applied', ref_user is not null
  );
end
$$;

revoke all on function mouneh.join_secure(text,text,text) from public, anon;
grant execute on function mouneh.join_secure(text,text,text) to authenticated;

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

  if o.status='delivered' and l.user_id is not null and l.awarded=0 then
    select * into m from mouneh.members where user_id=l.user_id for update;
    mult:=case mouneh.tier(l.user_id) when 'golden' then 1.5 when 'olive' then 1.25 else 1 end;
    n:=floor(greatest(0,l.weighted_subtotal*(1-l.discount/nullif(l.subtotal,0)))*mult);

    perform mouneh.credit(l.user_id,n,'Delivered order','order:'||ref,ref);
    update mouneh.order_links set awarded=n where reference=ref;
    perform mouneh.credit(l.user_id,20,'First delivered order','first:'||l.user_id,ref);

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
         )
         and m.created_at<=o.submitted_at
         and l.subtotal-l.discount>=25
         and length(child_phone_key)>=7
         and length(parent_phone_key)>=7
         and child_phone_key<>parent_phone_key
         and (order_phone_key='' or order_phone_key<>parent_phone_key)
      then
        perform mouneh.credit(m.referrer,50,'Friend completed their first qualifying order','referrer:'||l.user_id,ref);
        perform mouneh.credit(l.user_id,20,'Referral welcome bonus','referred:'||l.user_id,ref);
        update mouneh.order_links set referral_awarded=true where reference=ref;
      end if;
    end if;

    update mouneh.wallet set status='used' where order_ref=ref and status='reserved';

  elsif o.status='cancelled' then
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
        -coalesce((select sum(points)::integer from mouneh.ledger where order_ref=ref and user_id=m.user_id),0),
        'Cancelled / refunded order',
        'cancel:'||ref||':'||m.user_id,
        ref
      );
    end loop;
    update mouneh.wallet set status='available',order_ref=null where order_ref=ref;
  end if;
end
$$;

revoke all on function mouneh.settle(text) from public, anon, authenticated;

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
  if u is null then
    raise exception 'Sign in required';
  end if;

  select * into m from mouneh.members where user_id=u;
  if not found then
    raise exception 'Join Mouneh Rewards first';
  end if;

  select count(*)::integer
  into joined_count
  from mouneh.members child
  where child.referrer=u;

  select count(*)::integer
  into qualified_count
  from mouneh.members child
  where child.referrer=u
    and exists (
      select 1
      from mouneh.order_links l
      join public.orders o using(reference)
      where l.user_id=child.user_id
        and l.referral_awarded=true
        and o.status='delivered'
    );

  select count(*)::integer
  into disqualified_count
  from mouneh.members child
  where child.referrer=u
    and not exists (
      select 1
      from mouneh.order_links l
      join public.orders o using(reference)
      where l.user_id=child.user_id
        and l.referral_awarded=true
        and o.status='delivered'
    )
    and exists (
      select 1
      from mouneh.order_links l
      join public.orders o using(reference)
      where l.user_id=child.user_id
        and o.delivered_at is not null
    );

  return jsonb_build_object(
    'code', m.code,
    'joined', joined_count,
    'qualified', qualified_count,
    'disqualified', disqualified_count,
    'pending', greatest(joined_count-qualified_count-disqualified_count,0),
    'reward_points', 50,
    'friend_bonus_points', 20,
    'minimum_order', 25,
    'confirmation', 'owner_delivered_status'
  );
end
$$;

revoke all on function mouneh.referral_status() from public, anon;
grant execute on function mouneh.referral_status() to authenticated;
