# Zayt w Mouneh

Production static storefront for Zayt w Mouneh.

## Architecture

- `src/pages/` contains editable HTML page sources.
- `src/partials/` contains shared static storefront shell fragments.
- `scripts/build.mjs` renders those sources into committed `public/*.html`.
- Runtime JavaScript, CSS, product data and media remain deployable assets under `public/`.
- Cloudflare/Workers serves `public/` only.
- Root-level legacy storefront copies are intentionally removed.

The build uses Node.js built-ins only. It adds no paid dependency and no frontend framework.

## Development and release

Use Node 22.

```bash
npm ci --ignore-scripts
npm run build
npm run check
```

`npm run build` expands shared shell partials, generates `public/asset-versions.js`, applies content-addressed asset URLs, generates `public/release.json`, and writes deployable HTML into `public/`.

Generated HTML, the asset manifest and release file stay committed so the current Cloudflare static deployment remains compatible. Edit `src/pages/` or `src/partials/`, not generated HTML.

## Shared shells

Normal storefront pages share one header/footer. Legal pages share the footer and keep a small legal-header variant because their announcement action intentionally differs. Wholesale, product, checkout/order, account and admin keep specialized shells where behavior differs.

## Cache versioning

Do not bump date-style `?v=YYYYMMDD-...` strings. Static HTML versions local assets from content automatically. Dynamic loaders use `window.ZWM_ASSET_URL(path)` from the generated asset manifest.

## Deployment

Production publishes only `public/`. The Wrangler configuration already points there. If a host runs a build, use `npm run build && npm run check` and publish `public/`. No new paid service is required.
