-- Zayt w Mouneh — Batch 5 admin/operations hardening
-- Preserve order/audit history and remove browser-role TRUNCATE capability.

drop policy if exists "admins can delete orders" on public.orders;
revoke delete on table public.orders from authenticated;

revoke truncate on table
  public.admin_activity,
  public.admin_backups,
  public.admin_notes,
  public.admin_users,
  public.orders,
  public.product_overrides,
  public.product_revisions,
  public.site_events,
  public.site_settings
from authenticated;
