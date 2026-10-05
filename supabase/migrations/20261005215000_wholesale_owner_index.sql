-- Cover the CRM owner-assignment foreign key for admin filtering and updates.
create index if not exists wholesale_leads_assigned_owner_idx
on public.wholesale_leads(assigned_owner)
where assigned_owner is not null;
