# Zayt w Mouneh

Premium, responsive static storefront for Zayt w Mouneh.

## What is included

- 337 products across all 21 catalogue categories
- Responsive desktop, tablet and mobile layouts
- Search + category filters + horizontal quick-browse rail
- Product detail popup with short descriptions
- Quantity controls on cards, popup and cart
- Persistent cart using localStorage
- WhatsApp order handoff to +961 81 581 230
- Animated hero with a real honey-motion layer plus graceful CSS fallback
- Rope, wood, cream, heritage green and gold visual language
- Reduced-motion support for accessibility
- No framework and no build step

## Cloudflare Pages

This project is intentionally static. **Wrangler is not required.**

Recommended settings:

- Framework preset: None
- Build command: leave empty
- Build output directory: /
- Root directory: /

If this repository is already connected to a Cloudflare Pages project, new commits to `main` should trigger a new deployment automatically.

## Motion asset

The hero includes a muted decorative honey clip from Pexels, with an animated CSS fallback so the hero still looks complete if the remote video is unavailable.

Source: https://www.pexels.com/video/honey-close-up-7281326/

## Files

- `index.html`
- `styles.css`
- `app.js`
- `assets/logo.svg`
- `.nojekyll`
- `_headers`
