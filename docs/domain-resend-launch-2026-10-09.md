# Zayt W Mouneh — custom-domain + Resend go-live

Last verified 2026-10-09. This is a **pre-launch runbook**, not permission to publish or email real customers. Production storefront source of truth: `public/`. Do not overwrite concurrent work by other chats.

## Confirmed configuration

- Registered domain: **zaytwmouneh.com** (Cloudflare registration confirmation on October 9, 2026). **Registration does not mean connected to Workers**; DNS/HTTPS are not verified from these tools.
- Worker name: `zaytwmouneh`. Both Wrangler configurations serve `./public`.
- Supabase project: Zayt W Mouneh (`mraobsbgrtmgpdjqjrzr`).
- Supabase Edge Function `transactional-email`: ACTIVE, version 5. The database's private dispatch token exists. The `zwm-transactional-email-retry` Cron job is active every minute.
- On October 9: private email outbox contained **2 `sent`** (each has provider message ID) and **4 `dead`** with `invalid_recipient_or_payload`. The 4 rejected rows must be investigated in Resend's sending logs; they were **not resent**. Provider acceptance is not proof of inbox arrival.
- `notification-push`: upgraded to version 14. CORS and Origin enforcement allow `https://zaytwmouneh.com`, `https://www.zaytwmouneh.com`, and the existing Workers address only.
- Web SEO canonical/OG origins and `public/sitemap.xml` were rebased to `https://zaytwmouneh.com`. Sitemap has 5,115 occurrences of the canonical host, zero of the old host.
- During pre-launch `public/_headers` applies `X-Robots-Tag: noindex, nofollow, noarchive` on all served pages; `public/robots.txt` does not advertise a sitemap. **This does not prevent visitors opening the URL**.

## Action required in the owner's dashboards — no paid upgrades needed

### 1. Cloudflare — connect and restrict access

1. Dashboard → **Workers & Pages** → existing Worker `zaytwmouneh` → **Settings → Domains & Routes → Add → Custom Domain**; enter `zaytwmouneh.com`. Cloudflare provisions Worker DNS and HTTPS.
2. Configure `www.zaytwmouneh.com` to redirect to the apex (`https://zaytwmouneh.com`) or choose the opposite **consistently**. Do not serve duplicate canonical hosts.
3. For true privacy, protect **both** the custom hostname and the Worker/preview URLs with Cloudflare Zero Trust **Access**, limiting visitors to approved email addresses. An unlisted URL plus `noindex` alone is **not private**. Verify user checkout/auth flows before switching Access on because emails and OAuth redirects may require approved access.
4. Verify all SSL hostnames and that no unexpected staging/preview URL is publicly accessible. Do not turn off the existing Workers URL before testing any dependencies and monitoring.

### 2. Resend — domain authentication and sending

1. Resend → **Domains**: add the **verified sending domain** you want, e.g. `send.zaytwmouneh.com` (recommended to separate sending reputation); follow Resend's **exact generated** DNS records in Cloudflare (DKIM, SPF/return path, and recommended DMARC). DNS values are generated per domain — **never guess** them. Wait for Resend's verified status.
2. Select a sender address that belongs to that verified domain (for example, `Zayt W Mouneh <updates@send.zaytwmouneh.com>`). If recipients should reply, configure a functioning Reply-To/inbox separately — Resend sending does **not** automatically create a mailbox.
3. Do not paste keys into the chat, GitHub, or frontend code. Keep Resend API keys in Supabase secrets / Auth SMTP settings only.
4. The Free tier currently provides **3,000 emails/month and 100/day**; both store and Auth messages count towards its sending limits. Review current limits in Resend dashboard before launch.
5. Resend → **Emails/logs**: inspect why the four Oct 7 messages were rejected (`invalid_recipient_or_payload`). They may be test cases or sender/recipient restrictions. Do not bulk replay production outbox or send unsolicited customer emails.

### 3. Supabase — store email API (distinct from Auth)

1. Supabase → Edge Functions → **Secrets**: verify these **exact names** exist and are valid: `ZWM_RESEND_API_KEY` and `ZWM_TRANSACTIONAL_EMAIL_FROM`. The latter must be a sender on a Resend-verified domain.
2. Confirm `transactional-email` is deployed and active (version 5 at audit), with the private dispatch token and Cron already configured; do **not** create duplicate cron schedules.
3. Run one controlled test order/return to **owner-owned test inboxes only** and check outbox status, Resend provider ID, actual arrival, spam folder, template layout and domain link.

### 4. Supabase Auth — separate SMTP system

1. Supabase → **Authentication → SMTP Settings**: enable custom SMTP with Resend's `smtp.resend.com`, port `465` (implicit TLS) or `587` (STARTTLS), username `resend`, and **your Resend API key** as the password. Set sender name Zayt W Mouneh and a verified sender email. Alternatively use the official Resend–Supabase integration if available on the existing free plans.
2. In **Authentication → URL Configuration**, set **Site URL** to `https://zaytwmouneh.com`, and add only appropriate allow-listed redirect destinations (e.g. `https://zaytwmouneh.com/**`, `https://www.zaytwmouneh.com/**` only if used). Keep the old Workers callback temporarily during migration if current auth flows need it.
3. Paste the existing five branded files from `supabase/templates/` into matching confirmation, recovery, email-change, invite, and magic-link Auth templates. Set subjects per `docs/email-branding.md`. Supabase Auth template files existing in GitHub **does not** mean they are installed in the Supabase dashboard.
4. Verify the existing Google OAuth/Google Cloud redirect configuration **only if Google login is enabled**; do not change working provider credentials casually.
5. Run signup verification, password reset, login/magic link, logout and return-from-OAuth tests in EN, AR/RTL and FR on desktop/mobile, with approved test identities. Confirm each confirmation link opens a reachable domain.

### 5. Final smoke tests before public launch

- Check that the Cloudflare custom domain and its HTTPS certificate resolve; verify www redirect and no redirects across unrelated hosts.
- Check page links, canonical + hreflang + Open Graph preview URLs, product pages, sitemap and logo/image links on the actual domain.
- Test accounts, checkout, orders, returns, wholesale, push notifications and authorized admin operations without touching live customer data.
- GitHub **Production regression** workflow was already failing during the audit before domain edits with `about.html canonical storefront shell must be the final stylesheet`. This belongs to the parallel storefront styling batch; do not bypass/disable the gate. Re-run after that batch merges.
- Keep `noindex` during preview. **When explicitly launching**, remove the pre-launch header, restore `Sitemap: https://zaytwmouneh.com/sitemap.xml` to robots.txt and verify the final canonicals again. Do not unindex or expose public access automatically before the owner approves launch.

## Reference docs
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/workers/static-assets/headers/
- https://supabase.com/docs/guides/auth/auth-smtp
- https://resend.com/docs/send-with-smtp
- https://resend.com/docs/dashboard/domains/introduction
- https://resend.com/pricing
