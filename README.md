# Zayt w Mouneh

Production storefront, commerce, customer account, Mouneh Points and owner-console code for Zayt w Mouneh.

## Production source of truth

**Only `public/` is deployed as the static asset directory.** The Worker entrypoint is `worker.js`, configured by `wrangler.jsonc`.

Do not edit legacy root-level storefront copies. The production storefront, account, checkout, order experience, legal pages and admin console all live under `public/`.

## Production architecture

- Cloudflare Worker + Static Assets
- `public/` for storefront/admin/account/checkout assets
- `worker.js` for crawlable product pages, dynamic sitemap/robots and request-origin canonical URLs
- Supabase for Auth, customer/order/rewards data and owner content overrides
- Website-native checkout; WhatsApp is an optional support channel, not the checkout mechanism
- Guest checkout supported; claim tokens securely link guest orders to an account later
- English/Arabic storefront with RTL support
- 328 shopper-facing products, 21 categories and 423 priced variants
- Individual crawlable URLs at `/products/<product-id>`

## Release discipline

Changes to `main` are production changes. Keep the release marker in `public/release.json` current and run the QA workflow before/after storefront changes.

See `docs/production-architecture.md` for routing, caching, security and commerce invariants.
