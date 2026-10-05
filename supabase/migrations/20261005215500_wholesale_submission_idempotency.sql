-- Make wholesale RFQ submission retry-safe across double taps and ambiguous network failures.
alter table public.wholesale_leads
  add column if not exists submission_key uuid null;

create unique index if not exists wholesale_leads_submission_key_idx
  on public.wholesale_leads(submission_key)
  where submission_key is not null;

create or replace function private.submit_wholesale_enquiry_idempotent(p jsonb)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  k uuid:=coalesce(nullif(p->>'submission_key','')::uuid,gen_random_uuid());
  existing_id uuid;
  created_id uuid;
begin
  -- Serialize only retries for the same client-generated key.
  perform pg_advisory_xact_lock(hashtextextended(k::text,0));

  select id into existing_id
  from public.wholesale_leads
  where submission_key=k
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  created_id:=private.submit_wholesale_enquiry_core(p);

  update public.wholesale_leads
  set submission_key=k
  where id=created_id;

  return created_id;
end
$$;

revoke all on function private.submit_wholesale_enquiry_core(jsonb) from public,anon,authenticated;
revoke all on function private.submit_wholesale_enquiry_idempotent(jsonb) from public,anon,authenticated;

create or replace function public.submit_wholesale_enquiry(p jsonb)
returns uuid
language sql
security definer
set search_path=''
as $ select private.submit_wholesale_enquiry_idempotent(p) $;

revoke all on function public.submit_wholesale_enquiry(jsonb) from public;
grant execute on function public.submit_wholesale_enquiry(jsonb) to anon,authenticated;
