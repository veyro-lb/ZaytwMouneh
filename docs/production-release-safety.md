# Production release safety

This file records the release controls that must be enabled for the live `main` branch and the security decisions made in Batch 1.

## GitHub main protection

The connected GitHub integration cannot read or change branch protection because its installation token does not include repository administration access. The repository itself reports admin permission for the user, but the integration receives HTTP 403 from the branch-protection endpoint. Do not treat branch protection as enabled until these settings are applied in GitHub.

In **Settings → Rules → Rulesets** (or **Settings → Branches → Branch protection rules**), create a rule targeting `main` with:

- Require a pull request before merging.
- Require status checks to pass before merging.
- Require the unique check **Production regression gate**.
- Require the branch to be up to date before merging.
- Block force pushes.
- Block branch deletion.
- Do not allow bypassing the rule for normal production work. Keep an emergency admin bypass only if the owner intentionally wants a break-glass path.
- Do not require a paid feature; this repository is public and GitHub branch protection/rules are available on the free plan for public repositories.

After the permanent workflow has completed successfully at least once, select its emitted **Production regression gate** check as the required status check.

## Supabase notification security

The owner notification test is caller-bound. The production client calls `notification_create_test(p_subscription_id)`; the function derives the user from `auth.uid()`, confirms that exact user is in `public.admin_users`, and confirms the target admin push subscription belongs to that same user.

A short compatibility window keeps the old two-argument RPC, but it requires `p_user = auth.uid()`. The cleanup migration removes that old signature after the new client is live.

Legacy notification delivery telemetry is accessed only by service-role RPCs. The final cleanup migration moves `notification_delivery_attempts` from `public` to `private` so normal frontend clients cannot address it through the Data API.

The following authenticated `SECURITY DEFINER` RPCs may remain intentional after cleanup:

- `notification_create_customer_test(p_subscription_id)`: creates a private/outbox-backed test notification only after checking the caller and caller-owned customer subscription.
- `notification_create_test(p_subscription_id)`: creates a private/outbox-backed owner test only after checking `auth.uid()` is an admin and owns the admin subscription.
- `notification_test_status(p_notification_id)`: reads private outbox/delivery state only after confirming the test notification belongs to `auth.uid()`.
- `zwm_push_public_key()`: returns only the VAPID **public** key from private configuration; it does not expose the private VAPID key.

All use `search_path = ''` and their relation references are schema-qualified.

## Free-plan password/auth baseline

Do not require Supabase Pro solely for leaked-password protection. Supabase documents leaked-password checks as a paid-plan feature.

The storefront enforces a minimum of 8 characters for signup, password reset, and password change. Password-recovery success messaging is intentionally non-enumerating: it says that a message was sent **if** the email belongs to an account, and 4xx recovery differences other than rate limiting are not surfaced to the user.

In Supabase Dashboard, verify the free-plan Auth settings keep:

- minimum password length at least 8;
- email confirmation enabled if already used by production;
- Google provider configuration unchanged;
- existing Site URL and redirect URLs unchanged;
- no weaker password rule than the client-side 8-character baseline.

Do not enable a stricter character-composition rule without a product decision; it adds user friction and is not required for this batch.
