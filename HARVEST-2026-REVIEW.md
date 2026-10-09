# Golden Harvest 2026 — review and launch checklist

This seasonal change is isolated from the main Zayt w Mouneh experience. Do not enable before the intended **Monday, 12 October 2026** launch.

## Review and activation

- Review the draft PR branch `campaign/golden-harvest-2026-review` in the successfully deployed Cloudflare preview environment. Add `?harvestPreview=1` to the homepage or shop URL.
- Check the desktop/mobile layout and switch EN / AR / FR.
- Confirm the six campaign assets shown below exist at these exact paths (uploaded and validated October 9).
- Configure and verify the **4 L** olive-oil variant through the existing admin/catalogue, only when its actual current price and inventory are confirmed. The campaign intentionally keeps it non-orderable until then.
- After media, catalogue and checkout review, change `var ENABLED=false;` to `var ENABLED=true;` in `public/golden-harvest-2026.js`. Merge the reviewed PR and deploy only on the intended date.
- After the season ends, set `ENABLED=false` again. Existing homepage/shop sections return automatically.

## Assets needed before production

| Original supplied asset | Website path |
|---|---|
| 1 L bottle photo | `public/assets/harvest-2026/1l.webp` |
| 4 L tin photo | `public/assets/harvest-2026/4l.webp` |
| 8.77 L tin photo | `public/assets/harvest-2026/8-77l.webp` |
| 17.54 L tin photo | `public/assets/harvest-2026/17-54l.webp` |
| 8-second supplied harvest film, muted/recompressed | `public/assets/harvest-2026/harvest-film.mp4` |
| Poster extracted from film | `public/assets/harvest-2026/hero-poster.jpg` |

**All six optimized media assets were uploaded and verified in the review branch on October 9.** The image formats, nonempty files, and exact filenames passed the independent `Golden Harvest 2026 review gate` GitHub Actions check. The user-supplied tin labels remain unaltered. Browser playback and full visual QA are still required before public launch.

## Shopping behavior

- The live `extra-virgin-olive-oil` product provides the real variant data.
- Campaign prices are read from `PRODUCTS_DATA` after owner admin overrides, never hardcoded.
- 1 L, 8.77 L and 17.54 L **Add to cart** buttons use a validated bridge to the existing storefront cart, with the exact confirmed variant IDs. The original cart, totals, checkout and stock rules remain in charge.
- 4 L intentionally provides an **inquiry** action (not a fake price or order button) until a distinct 4 L variant with owner-confirmed price and availability appears in the catalogue. It must **never** be mapped to the legacy 500 ml variant.
- The existing checkout, authentication, rewards, inventory security and Supabase authorization remain unchanged. A small safe storefront-cart method is exposed solely to let the campaign call the existing add-to-cart routine, never to bypass it.
- The 1 L bottle also remains in the regular shop; the 500 ml size stays there as before.

## Reversibility and runtime

- Campaign HTML is added only when enabled or preview is requested. **The original homepage hero remains unchanged.** The campaign inserts the Seasonal Picks product collection directly after that hero and before Pantry Favourites.
- The separate **first-visit cinematic popup** (video, logo, bilingual/translated campaign copy) waits until the existing welcome-language dialog has finished. Dismissal is remembered locally; the preview-only `?harvestPreview=1&harvestPopup=1` forces it open for review.
- **Discover the Harvest** closes the popup and scrolls to the first product collection; **Continue to Website** only closes the popup without scrolling.
- Scoped styles: `public/golden-harvest-2026.css`.
- Campaign runtime: `public/golden-harvest-2026.js`.
- Homepage/shop links: one CSS and one JS reference added to each HTML page.
- Live CMS announcement text and other global page behavior remain unchanged outside campaign mode.
- The current site-wide language switcher handles EN/AR/FR; this module updates itself on locale changes.
- Popup video is muted, plays inline, pauses when hidden or closed and respects reduced motion; the normal homepage hero video remains managed by the existing website.

## Visual revision — October 9 (reference-matched)

- The normal homepage hero is **not replaced**. The cinematic first-visit announcement is a **compact centered floating dialog**, layered over a dimmed and softly blurred homepage background, with the Zayt w Mouneh logo, harvest video, a **deep harvest-red primary CTA** and an outlined Continue button.
- The first product collection stays **immediately after the hero and before Pantry Favourites**. It now has a centered headline, a large burgundy/red **JUST ARRIVED · 2026 HARVEST** pill, gold **SEASONAL PICKS · HARVEST 2026** overline, delicate gold divider, and the four cream photo cards with smaller red season badges.
- Product images remain the genuine uploaded WebP photographs, using `object-fit: contain` to avoid cropping; exact 4 L / 8.77 L / 17.54 L variant mapping, verified live catalogue prices and original cart flow remain unchanged.
- Language-aware EN / AR / FR headline and badges; Arabic layout stays RTL. Mobile keeps the popup as a centered dialog rather than a forced full-screen replacement.
- `public/index.html` and `public/shop.html` reference **versioned campaign CSS/JS (`20261009-harvest-launch2`)** to avoid stale Cloudflare/browser caches.
- Visual QA can be repeated without changing first-visit storage by adding `?harvestPreview=1&harvestPopup=1` to the branch preview URL.
- Browser screenshot QA in an actual graphical browser is still required before public release; free CI tests ensure dialogue/collection actions and variant selection, but cannot replace manual visual checks.

## Build checks as of October 9

- `Verify harvest campaign and media`: **PASS** — genuine media signatures, size mapping, full translations, preservation of existing sections, product/cart bridge, and a separate jsdom interaction test of the welcome → popup → collection journey, language switching, catalogue refresh, and variant-specific Add to cart actions.
- `Production regression gate`: **PASS** after four exact stylesheet order fixes (About, Contact, Gift and Recipes) and alignment of three outdated admin asset-version assertions with the current October 9 files. No check was bypassed.
- `Workers Builds: zaytwmouneh`: **PASS** — Cloudflare branch preview deployment after adding the required empty `previews` configuration to both Wrangler files.
- Preview URL reported by Cloudflare GitHub integration: `https://campaign-golden-harvest-2026-review-zaytwmouneh.veyro-202.workers.dev/?harvestPreview=1`. This is a preview, not the production store.
- The campaign remains **off by default** for normal visitors (`ENABLED=false`); the PR remains draft and has not been merged.

## QA still required before launch

Review the real Cloudflare preview manually across desktop and mobile (including short phones) and Arabic RTL; confirm the five media files load visually, full tin photography is never cropped, film poster/autoplay work, and navigation/keyboard access is intact. In the actual shop, independently verify the 8.77 L and 17.54 L cart totals and checkout; confirm any updated owner prices/availability and test 4 L only after its new variant is configured. The automated jsdom interaction test passes, but it does not replace visual browser acceptance.

No unrelated site files or database rows should be changed for this campaign.

## Updated 1 L and photo set — October 9

- Four new user-supplied photographs: 1 L bottle, 4 L, 8.77 L, and 17.54 L tins. WebP files were uploaded as verified Git blobs; no labels were edited.
- The 1 L featured card uses the existing `extra-virgin-olive-oil-1-l` catalogue variant. Its current base price is $12, subject to the existing owner overrides; it uses the normal cart bridge and inventory rules.
- Responsive collection now uses four columns on large desktop, two on tablet and one on narrow mobile. Campaign is still preview-only until launch approval.
