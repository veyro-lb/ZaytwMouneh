# Custom domain migration checklist

Current public origin: `https://zaytwmouneh.veyro-202.workers.dev`

Do not replace the Workers origin until the final custom domain is connected, TLS is active, and the production route is verified. The migration should be one controlled release.

## 1. Cloudflare

- Attach the final custom domain to the same static Worker/assets deployment.
- Confirm HTTPS, redirects, and `public/` asset routing before changing SEO origins.
- Decide one canonical host (apex or `www`) and redirect the other host to it.

## 2. Static SEO/public origin references

Search the production tree for the Workers origin and update, in one commit:

- canonical and Open Graph URLs in `public/*.html`
- hreflang URLs, including `public/wholesale.html`
- structured-data URLs in `public/index.html`, `public/premium-v2.js`, and any other live schema emitters
- `public/seo-a11y-v1.js` origin constant
- `public/sitemap.xml`
- `public/robots.txt` sitemap URL

Product-page SEO already derives its runtime canonical/schema URLs from `location.origin`, so it will follow the active host automatically.

Do not update root-level legacy storefront snapshots; they are not production.

## 3. Supabase / browser-origin allowlists

Review and deploy origin changes together for:

- `supabase/functions/notification-push/index.ts` (currently fixed to the Workers origin)
- `supabase/functions/return-evidence-upload/index.ts`
- `supabase/functions/return-order-verify/index.ts`

The return functions already include the expected `zaytwmouneh.com` and `www.zaytwmouneh.com` hosts alongside the Workers host. Keep the Workers host during a transition only if it must remain reachable.

## 4. Authentication

In Supabase Auth settings:

- change the Site URL to the chosen canonical domain
- add exact production redirect URLs used by sign-in/reset flows
- keep the Workers redirect temporarily only if users can still legitimately land there
- verify password reset, sign-in, sign-out, and session restoration in EN / AR / FR

## 5. Transactional links and notifications

Search server functions/migrations/config for absolute storefront origins. Verify order, returns, notification, and transactional-email links open the final domain and preserve their path/query data. Prefer a server-side configurable origin for any future absolute-link emitter rather than adding new hardcoded hosts.

## 6. SEO cutover

- regenerate/verify the sitemap against the final canonical host
- verify robots references that sitemap
- verify canonical, hreflang, Open Graph, and Product schema on representative EN / AR / FR pages
- keep product IDs and URL slugs unchanged
- submit the new sitemap only after the final host serves the same production content

## 7. Regression verification

Smoke-test Home, Shop, Product, Gift, Account, Checkout, Order, Returns, Wholesale, Terms, and Privacy on mobile and desktop. Check Arabic RTL, French loading, cart/session persistence, auth callbacks, order/returns security, and all edge-function CORS paths.
