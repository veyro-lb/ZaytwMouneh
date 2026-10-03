# Zayt w Mouneh

Premium responsive static storefront for Zayt w Mouneh.

## Current experience

- 332 grouped products with 423 priced size/pack variants from the supplied retail price list
- 21 pantry categories
- Full English and Arabic storefront modes, with RTL layout in Arabic
- Language switch positioned beside the cart
- Product names, Arabic names, pack sizes and prices sourced from the supplied price-list PDF
- Product cards and product detail modal with exact size selection
- Estimated cart total and WhatsApp order summary with quantity, size, unit price and subtotal
- About / Mission section based on the supplied Zayt w Mouneh brand catalogue
- Real supplied Zayt w Mouneh logo asset
- Rope + wood design language interpreted as a suspended shop sign rather than a full background image
- Rotating pantry hero with honey, lentils/pulses and wheat/harvest footage
- Search and a compact category selector
- Responsive mobile, tablet and laptop layouts
- Cart persistence with localStorage
- Reduced-motion accessibility support
- No framework, package manager, build step or Wrangler requirement

## Cloudflare Pages

This repository is a plain static site.

- Framework preset: None
- Build command: leave empty
- Build output directory: /
- Root directory: /

If Cloudflare Pages is connected to this repository and watches `main`, commits deploy directly.


## Commerce UX added

- Delivery messaging for all of Lebanon, with final delivery details confirmed on WhatsApp
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
