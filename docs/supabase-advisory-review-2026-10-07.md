# Supabase advisory review — 2026-10-07

Project: **Zayt W Mouneh**

This review treats advisories as signals, not automatic migration instructions.

## SECURITY DEFINER functions

The security advisor reports six `SECURITY DEFINER` functions executable by `authenticated`. All six are owned by `postgres`; `anon` and `PUBLIC` do not have EXECUTE.

| Function | Decision | Control verified |
| --- | --- | --- |
| `admin_mark_order_item_attention(...)` | Keep authenticated EXECUTE | Requires `auth.uid()` and membership in `public.admin_users` before privileged work. |
| `notification_create_customer_test(uuid)` | Keep authenticated EXECUTE | Requires signed-in user and an active customer push subscription owned by that same user. |
| `notification_create_test(uuid)` | Keep authenticated EXECUTE | Requires signed-in admin and an active admin push subscription owned by that admin. |
| `notification_test_status(uuid)` | Keep authenticated EXECUTE | Looks up only a TEST_PUSH notification whose `user_id` equals `auth.uid()` before reading private delivery state. |
| `zwm_push_public_key()` | Keep authenticated EXECUTE | Returns only the VAPID public key; no private signing key is exposed. |
| `zwm_return_admin_customer_message(uuid,text)` | Keep authenticated EXECUTE | Requires `auth.uid()` plus `public.admin_users` membership and validates request state/message length. |

No grant was revoked because each exposed call is intentional and currently guarded. Revisit if signup/role architecture changes.

## Private RLS tables with no policies

Advisor entries:

- `private.notification_delivery_attempts`
- `private.return_order_access_tokens`
- `private.return_order_lookup_attempts`

Verified state: both `anon` and `authenticated` have no SELECT/INSERT/UPDATE/DELETE privilege on all three tables. They are internal tables behind privileged functions. No customer RLS policy was added.

## Unused indexes

The performance advisor reports 24 unused indexes. No indexes were removed. The project and several notification/returns/wholesale paths are new, so zero observed scans is not evidence that an index is harmful. Remove an index only after representative production query statistics and query plans show it is redundant.

## Leaked-password protection

The Auth advisor reports leaked-password protection disabled. This batch does not silently change authentication policy or enable a potentially plan-dependent feature. If the current Supabase plan exposes it without additional paid service, enable it deliberately and regression-test signup/password-change/reset flows.

## Follow-up rule

For future `SECURITY DEFINER` functions: set an explicit `search_path`, revoke default PUBLIC/anon EXECUTE, grant only the role that must call the function, and validate `auth.uid()`/role/ownership before touching privileged data.
