# Storefront architecture and source-of-truth policy

## Canonical locations

| Concern | Canonical location |
| --- | --- |
| Editable HTML | `src/pages/` |
| Shared storefront shell | `src/partials/` |
| Runtime JS/CSS/data/media | `public/` |
| Generated HTML | `public/*.html` |
| Generated asset manifest | `public/asset-versions.js` |
| Generated release fingerprint | `public/release.json` |
| Deployment root | `public/` |

The old root storefront had diverged from the live `public/` tree. It is intentionally retired so a developer cannot patch the wrong copy.

The build only consolidates shells that were already byte-identical. Specialized wholesale, product, checkout/order, account and owner/admin shells remain separate where their interaction or translation wiring differs.

Asset cache busting is content-addressed. HTML source uses clean paths; the build adds Git-blob content hashes. Dynamic loaders resolve through `window.ZWM_ASSET_URL(path)`.

Retired deploy generations after reference checks: `site-runtime-v7.js`, `site-runtime-v8.js`, `mouneh-rewards-v7.js`, `mouneh-rewards-v7.css`, `premium.js`, and `gift-v3.css`. The `app.js` compatibility fallback now targets active `site-runtime-v9.js`.

Release flow: reconcile latest main, edit canonical sources, run `npm run build`, run `npm run check`, review generated diffs, then merge only after regression CI passes.
