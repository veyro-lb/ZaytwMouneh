-- Restrict the public rewards gateway to known actions and block legacy enrollment/order bypasses.
create or replace function public.mouneh_api(action text, p jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
begin
  if action='submit' then
    raise exception 'Use the secure website checkout to place orders.';
  elsif action='join' then
    raise exception 'Use secure rewards enrollment.';
  elsif action='join_secure' then
    return mouneh.join_secure(p->>'name',p->>'phone',p->>'referral');
  elsif action='referral_status' then
    return mouneh.referral_status();
  elsif action = any(array[
    'public','dashboard','claim','profile','redeem','favorites','birthday','review',
    'admin_data','admin_adjust','admin_campaign','admin_config','admin_reward',
    'admin_reward_create','admin_tier'
  ]) then
    return mouneh.api(action,p);
  end if;
  raise exception 'Unknown rewards action';
end
$$;

create or replace function public.mouneh_rewards(action text, p jsonb default '{}'::jsonb)
returns jsonb
language sql
security definer
set search_path=''
as $$ select public.mouneh_api(action,p) $$;

notify pgrst,'reload schema';

