# Zayt w Mouneh

Premium responsive static storefront for Zayt w Mouneh.

## Current experience

- 328 shopper-facing products with 423 priced size/pack variants from the supplied retail price list
- 21 pantry categories
- Full English, Arabic and French storefront modes, with RTL layout in Arabic
- Language switch positioned beside the cart
- Product names, Arabic names, pack sizes and prices sourced from the supplied price-list PDF
- Product cards and product detail modal with exact size selection
- Native website checkout with quantity, size, unit price, delivery details, rewards and order tracking
- About / Mission section based on the supplied Zayt w Mouneh brand catalogue
- Real supplied Zayt w Mouneh logo asset
- Rope + wood design language interpreted as a suspended shop sign rather than a full background image
- Rotating pantry hero with honey, lentils/pulses and wheat/harvest footage
- Search and a compact category selector
- Responsive mobile, tablet and laptop layouts
- Cart persistence with localStorage
- Reduced-motion accessibility support
- No frontend framework or build step; Cloudflare Wrangler deploys the static assets plus the small product-page Worker

## Production deployment

**The production source of truth is `public/`.** Root-level storefront copies are legacy and must not be edited.

Cloudflare Workers Static Assets deploys `./public` from `main` using `wrangler.jsonc`. The Worker handles `/products/*` so product pages are server-rendered for SEO; the rest of the site remains static-first.

HTML uses clean extensionless URLs. Versioned JS/CSS/assets use long-lived browser caching; account, checkout, order and admin surfaces are no-store.

## Commerce UX added

- Delivery messaging and native website checkout for Lebanon, with WhatsApp reserved for support and optional transactional status updates
- Fuzzy search that tolerates common spelling mistakes and searches English, Arabic and Arabizi/transliterated catalogue names
- Search suggestions while typing
- Saved/favorite products
- Recently viewed products
- Product badges for useful factual context such as multiple sizes, traditional mouneh and baking/breakfast use
- Related products in the product detail view
- Mobile review/order bar tied to the live cart
- "Make a gift" builder that turns the current pantry list into a gift request with recipient, occasion, packing preference, message and delivery area
- Expanded trust, delivery, social and footer sections
- Hero videos pause when off-screen or the tab is hidden to reduce unnecessary work

## Future visual upgrades

Intentionally left for a later phase:
1. Additional photography for catalogue entries without an exact supplied image
2. Curated / seasonal collections

## Premium storefront layer

- Editorial olive / ivory / gold visual system with larger product imagery and tighter spacing
- Curated seasonal collections and collection deep-links
- Interactive Lebanon provenance experience for Bekaa, Koura, Mount Lebanon and Chouf
- Recipe hub with one-click pantry bundles for mujadara, manoushe and fattoush
- Budget-based “Surprise me” pantry builder
- Shareable baskets and local “reorder last basket” memory
- Enhanced product modal with storage guidance, pairings, share links, feedback links and Product schema
- Gift builder budgets, ribbon choice, card language, hide-price preference and live card preview
- Privacy-conscious local analytics hooks plus dataLayer events for future analytics integration
- Static Store schema and expanded SEO discoverability

261 product IDs now use 247 original, name-matched photographs supplied in the seven WhatsApp ZIPs. Files retain their original bytes and dimensions. Cards display one complete image with `object-fit: contain`; products without exact artwork use a neutral placeholder. See `docs/product-photo-migration.md` and `docs/product-photo-audit.json` for coverage and provenance.

Photo follow-up (2026-10-03): 287 of 328 current products have photos: 258 use unchanged uploaded ZIP originals and 29 use existing official Debsy images. 41 need exact source photography. The deployed mapping lives only in `public/`. See `docs/product-photo-followup.md`.


## Production architecture

- Native website checkout is the ordering channel. WhatsApp is support/status messaging, not the checkout transport.
- Product SEO pages are server-rendered at `/products/<id>` from the same catalogue data used by the shop.
- `public/product-index.json` is the compact product source used by the product-page Worker.
- `public/sitemap.xml` includes every product page.
- `public/_headers` owns cache and browser-security policy; `public/_redirects` owns legacy URL canonicalization.
- Run `node tests/production-contract.cjs` before publishing.
