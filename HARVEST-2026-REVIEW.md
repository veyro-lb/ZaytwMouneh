# Golden Harvest 2026 — review and launch checklist

This seasonal change is isolated from the main Zayt w Mouneh experience. Do not enable before the intended **Monday, 12 October 2026** launch.

## Review and activation

- Review the draft PR branch `campaign/golden-harvest-2026-review` in the successfully deployed Cloudflare preview environment. Add `?harvestPreview=1` to the homepage or shop URL.
- Check the desktop/mobile layout and switch EN / AR / FR.
- Confirm the five campaign assets shown below exist at these exact paths (uploaded and validated October 9).
- Configure and verify the **4 L** olive-oil variant through the existing admin/catalogue, only when its actual current price and inventory are confirmed. The campaign intentionally keeps it non-orderable until then.
- After media, catalogue and checkout review, change `var ENABLED=false;` to `var ENABLED=true;` in `public/golden-harvest-2026.js`. Merge the reviewed PR and deploy only on the intended date.
- After the season ends, set `ENABLED=false` again. Existing homepage/shop sections return automatically.

## Assets needed before production

| Original supplied asset | Website path |
|---|---|
| 4 L tin photo | `public/assets/harvest-2026/4l.webp` |
| 8.77 L tin photo | `public/assets/harvest-2026/8-77l.webp` |
| 17.54 L tin photo | `public/assets/harvest-2026/17-54l.webp` |
| 8-second supplied harvest film, muted/recompressed | `public/assets/harvest-2026/harvest-film.mp4` |
| Poster extracted from film | `public/assets/harvest-2026/hero-poster.jpg` |

**All five optimized media assets were uploaded and verified in the review branch on October 9.** The image formats, nonempty files, and exact filenames passed the independent `Golden Harvest 2026 review gate` GitHub Actions check. The user-supplied tin labels remain unaltered. Browser playback and full visual QA are still required before public launch.

## Shopping behavior

- The live `extra-virgin-olive-oil` product provides the real variant data.
- Campaign prices are read from `PRODUCTS_DATA` after owner admin overrides, never hardcoded.
- 8.77 L and 17.54 L buttons open existing shop quick-view with the matching variant preselected.
- 4 L intentionally links to contact until a distinct real variant appears in the catalogue. It must **never** be mapped to the legacy 500 ml variant.
- The existing cart, checkout, authentication, rewards, inventory security and Supabase authorization remain unchanged.
- Existing remaining sizes (1 L, 500 ml) continue in the regular shop.

## Reversibility and runtime

- Campaign HTML is added only when enabled or preview is requested.
- Scoped styles: `public/golden-harvest-2026.css`.
- Campaign runtime: `public/golden-harvest-2026.js`.
- Homepage/shop links: one CSS and one JS reference added to each HTML page.
- Live CMS announcement text and other global page behavior remain unchanged outside campaign mode.
- The current site-wide language switcher handles EN/AR/FR; this module updates itself on locale changes.
- Video is muted, plays inline, pauses when hidden/offscreen and respects reduced motion.

## Build checks as of October 9

- `Verify harvest campaign and media`: **PASS** — optimized media, size mapping, translations and integration.
- `Production regression gate`: **PASS** after four exact stylesheet order fixes (About, Contact, Gift and Recipes) and alignment of three outdated admin asset-version assertions with the current October 9 files. No check was bypassed.
- `Workers Builds: zaytwmouneh`: **PASS** — Cloudflare branch preview deployment after adding the required empty `previews` configuration to both Wrangler files.
- Preview URL reported by Cloudflare GitHub integration: `https://campaign-golden-harvest-2026-review-zaytwmouneh.veyro-202.workers.dev/?harvestPreview=1`. This is a preview, not the production store.
- The campaign remains **off by default** for normal visitors (`ENABLED=false`); the PR remains draft and has not been merged.

## QA still required before launch

Preview browser across screen sizes and Arabic RTL; confirm real tin images load without clipping; film poster and autoplay work; test all links; verify dynamic owner prices, inventory and actual ordering; inspect console and keyboard navigation; verify CMS announcement interaction; test 4 L once added by admin.

No unrelated site files or database rows should be changed for this campaign.
