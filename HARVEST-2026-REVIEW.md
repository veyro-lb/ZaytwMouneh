# Golden Harvest 2026 — review and launch checklist

This seasonal change is isolated from the main Zayt w Mouneh experience. Do not enable before the intended **Monday, 12 October 2026** launch.

## Review and activation

- Review the draft PR branch `campaign/golden-harvest-2026-review` in a Cloudflare preview deployment (if a preview deployment is available). Add `?harvestPreview=1` to the homepage or shop URL.
- Check the desktop/mobile layout and switch EN / AR / FR.
- Upload the five campaign assets shown below, using the exact paths.
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

The supplied media was optimized outside GitHub. **The GitHub connector in this session does not accept local binary-file uploads; asset paths have not been populated. Do not launch until all files exist in the repository.** The campaign has fallback media for reviewing layout only. The user-supplied tin labels must remain unaltered.

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

## QA still required before launch

Preview browser across screen sizes and Arabic RTL; confirm real tin images load without clipping; film poster and autoplay work; test all links; verify dynamic owner prices, inventory and actual ordering; inspect console and keyboard navigation; verify CMS announcement interaction; test 4 L once added by admin.

No unrelated site files or database rows should be changed for this campaign.
