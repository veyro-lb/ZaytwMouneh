# Production storefront source of truth

## Rule

**PRODUCTION STOREFRONT = `public/`**

Cloudflare serves `./public` directly. Both `wrangler.toml` and `wrangler.jsonc` declare `./public` as the assets directory. Customer-facing fixes must therefore be made under `public/`, not in root-level storefront snapshots.

There is no storefront build step that copies root HTML/CSS/JS into `public/`.

## Legacy root snapshots

The repository still contains root-level names that also exist under `public/`:

- `about.html`
- `app.js`
- `contact.html`
- `gift-v3.css`
- `gift-v4.css`
- `gift.html`
- `index.html`
- `premium.css`
- `premium.js`
- `product-photos.js`
- `products-data.js`
- `recipes.html`
- `shop.html`
- `styles.css`

They have diverged from production and are **not deployment inputs**. They are intentionally left in place in this batch because other tooling/history may still reference them. Do not edit them for customer-facing work. Retire them only in a dedicated cleanup after proving no scripts, docs, or migration tooling still consume them.

CI runs `scripts/guard-source-of-truth.cjs` and fails when a change touches one of these root snapshots.

## Mutable asset caching

Large media under `public/assets/` remains long-lived and immutable. Core mutable storefront JS/CSS revalidates on navigation through `public/_headers`, so an old query-string key cannot keep a shared runtime or catalogue stale for a full day.

Dynamic fallbacks in `site-runtime-v9.js` use canonical, unversioned URLs for `admin-config.js` and `mouneh-rewards-v8.js`; they no longer inject historical query versions.

## Release metadata

`public/release.json` is the authoritative deployed release value. HTML `zwm-release` meta tags are diagnostic page-build markers only. `storefront-release.js` fetches `release.json` with `no-store`, exposes the latest release as `window.ZWM_RELEASE`, keeps the page marker as `window.ZWM_RELEASE_PAGE`, and never forces a reload.

This prevents reload loops while still letting stale pages discover the current deployed release.

## Commerce shell contract

Marketing/account/returns/wholesale pages use the canonical `.site-header` and `.footer` shell. Product and checkout/order remain intentionally focused commerce experiences, but must preserve:

- Zayt w Mouneh brand/home access
- EN / AR / FR language behavior and Arabic RTL
- account access where relevant
- cart/back-to-cart access where relevant
- Returns, Terms, and Privacy access
- responsive shell behavior

The architecture regression test protects these contracts.
