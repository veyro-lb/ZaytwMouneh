# Storefront architecture and release hygiene

## Production source of truth

**Production storefront = `public/` only.** Both Wrangler configs point Cloudflare assets at `./public`. Root-level storefront HTML/CSS/JS/SEO/media copies were removed and CI rejects their return.

## Page shells

Editorial/catalogue pages keep the canonical storefront shell. Product detail keeps its compact product shell; checkout/order keep the focused commerce shell. Those focused shells now retain brand continuity, account/cart access where relevant, locale behavior, and Terms / Privacy / Returns / Contact access without adding the full browsing menu to checkout.

## Release and cache strategy

`public/release.json` is the release source of truth. Customer HTML release markers and `storefront-release.js` URLs use one release id. `storefront-release.js` is explicitly no-store, checks `release.json` with `no-store`, reports an available update, and never auto-reloads.

Versioned static JS/CSS can retain normal caching. `admin-config.js` is already no-store and the runtime now loads it without a stale hard-coded query token. Dynamic rewards fallback loading derives its token from the page release marker.

## Performance decisions and measurements

- Removed 309 obsolete root storefront/media blobs totalling about 65.42 MiB from the duplicate source tree; production bytes were already served from `public/`, so this is repository/source hygiene rather than a network-payload claim.
- Removed unused `public/premium.js`; current customer pages use the maintained premium/runtime files instead.
- The only remaining eager-image hits were in that unused legacy helper, so they disappear without changing supplied product photo bytes or dimensions.
- Product and collection rendering preserves explicit image dimensions and existing lazy-loading behavior; exact product hero media is not forcibly downgraded.
- Home/shop video behavior remains guarded by Save-Data plus visibility/offscreen/reduced-motion logic already covered by performance regression.
- `fr-runtime-v1.js` remains conditional to French. It is not loaded for EN/AR.

## Product SEO decision

Resolved real product routes are indexable: runtime derives title, description, canonical/hreflang, Open Graph data and Product schema from catalogue/runtime facts. The HTML template remains conservative until a product resolves. Product URLs are already in the sitemap. Product Offer schema now emits availability only when the product actually has an explicit availability field; missing availability is no longer serialized as an invented InStock fact.

## Custom-domain migration checklist

Current public origin remains `https://zaytwmouneh.veyro-202.workers.dev` until the custom domain is connected.

1. Update static canonical/OG/hreflang origins in customer HTML and `public/seo-a11y-v1.js`.
2. Regenerate `public/sitemap.xml` and update `public/robots.txt`.
3. Review Store/Product structured-data URLs and transactional-email links.
4. Update Supabase Edge Function allowed-origin/CORS constants and email origin values.
5. Update Supabase Auth site URL / redirect allow-list.
6. Keep the Workers origin temporarily accepted during cutover where safe; remove it after verification.
7. Run `npm run check`, browser regression, crawl canonical/hreflang/sitemap output, and test EN/AR/FR auth + checkout redirects.

## Supabase advisory decisions — 2026-10-07

- Six authenticated `SECURITY DEFINER` functions were inspected. Admin mutations verify `auth.uid()` plus `public.admin_users`; customer test/status RPCs bind access to the signed-in user's own subscription/notification; the VAPID RPC exposes only the public key. Their authenticated EXECUTE grants are intentional for current flows.
- Three `private.*` tables report RLS enabled with no policies. They are private implementation tables used behind privileged functions/service paths, not direct client API tables. Adding permissive policies would weaken that boundary.
- Leaked-password protection is disabled. Enabling it remains an Auth policy/configuration decision and was not silently changed by this storefront batch.
- 24 indexes are reported unused. None were removed because advisor counters alone are insufficient workload evidence, especially for recently added returns/notifications/wholesale paths.

References:
- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index
