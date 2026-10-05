create or replace function private.mouneh_bonus_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  u uuid := auth.uid();
  m mouneh.members;
  reviewed jsonb := '[]'::jsonb;
  claimed_birthday boolean := false;
  birthday_today boolean := false;
  old_enough boolean := false;
  local_today date := (now() at time zone 'Asia/Beirut')::date;
  local_year integer := extract(year from (now() at time zone 'Asia/Beirut'))::integer;
begin
  if u is null then
    raise exception 'Sign in required';
  end if;

  select * into m
  from mouneh.members
  where user_id = u;

  if not found then
    raise exception 'Join Mouneh Rewards first';
  end if;

  select coalesce(jsonb_agg(r.product_id order by r.product_id), '[]'::jsonb)
  into reviewed
  from mouneh.reviews r
  where r.user_id = u;

  claimed_birthday := exists(
    select 1
    from mouneh.ledger l
    where l.user_id = u
      and l.event_key = 'birthday:' || u::text || ':' || local_year::text
  );

  birthday_today := m.birthday is not null
    and to_char(m.birthday, 'MM-DD') = to_char(local_today, 'MM-DD');

  old_enough := m.created_at <= now() - interval '30 days';

  return jsonb_build_object(
    'birthday',
    jsonb_build_object(
      'saved', m.birthday is not null,
      'date', m.birthday,
      'eligible_today', birthday_today and old_enough and not claimed_birthday,
      'claimed_this_year', claimed_birthday,
      'membership_eligible', old_enough,
      'points', 25
    ),
    'reviewed_product_ids', reviewed,
    'review_points', 5
  );
end
$$;

create or replace function private.mouneh_claim_birthday_bonus()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  u uuid := auth.uid();
  m mouneh.members;
  local_today date := (now() at time zone 'Asia/Beirut')::date;
  local_year integer := extract(year from (now() at time zone 'Asia/Beirut'))::integer;
begin
  if u is null then
    raise exception 'Sign in required';
  end if;

  select * into m
  from mouneh.members
  where user_id = u
  for update;

  if not found then
    raise exception 'Join Mouneh Rewards first';
  end if;

  if m.birthday is null
     or to_char(m.birthday,'MM-DD') <> to_char(local_today,'MM-DD')
     or m.created_at > now() - interval '30 days'
  then
    raise exception 'Birthday bonus is available on your birthday, after 30 days of membership';
  end if;

  perform mouneh.credit(
    u,
    25,
    'Birthday surprise',
    'birthday:' || u::text || ':' || local_year::text
  );

  return private.mouneh_bonus_status();
end
$$;

revoke all on function private.mouneh_bonus_status() from public;
revoke all on function private.mouneh_bonus_status() from anon;
grant execute on function private.mouneh_bonus_status() to authenticated;

revoke all on function private.mouneh_claim_birthday_bonus() from public;
revoke all on function private.mouneh_claim_birthday_bonus() from anon;
grant execute on function private.mouneh_claim_birthday_bonus() to authenticated;

create or replace function public.mouneh_bonus_status()
returns jsonb
language sql
stable
set search_path = ''
as $$ select private.mouneh_bonus_status() $$;

create or replace function public.mouneh_claim_birthday_bonus()
returns jsonb
language sql
set search_path = ''
as $$ select private.mouneh_claim_birthday_bonus() $$;

revoke all on function public.mouneh_bonus_status() from public;
revoke all on function public.mouneh_bonus_status() from anon;
grant execute on function public.mouneh_bonus_status() to authenticated;

revoke all on function public.mouneh_claim_birthday_bonus() from public;
revoke all on function public.mouneh_claim_birthday_bonus() from anon;
grant execute on function public.mouneh_claim_birthday_bonus() to authenticated;
