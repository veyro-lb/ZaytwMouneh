# Catalogue audit — Batch 6 — 2026-10-06

## Scope and source of truth

- Repository: `veyro-lb/ZaytwMouneh`
- Production storefront source: `public/`
- Starting `main`: `e09911d65798cfdd6d1f84046ce6a5f1eb8f9dd6`
- Catalogue source: `public/products-data.js`
- Product photo map: `public/product-photos.js`
- Supabase project: `Zayt W Mouneh`

This audit preserves stable product and variant IDs unless repository and live-data evidence proves a merge is safe. No commercial facts, prices, translations, or image matches are invented.

## Current structural inventory

| Check | Result |
| --- | ---: |
| Catalogue records | 332 |
| Unique product IDs | 332 |
| Variants | 423 |
| Unique variant IDs | 423 |
| Categories | 21 |
| Duplicate product IDs | 0 |
| Duplicate variant IDs | 0 |
| Missing English names | 0 |
| Missing Arabic names | 0 |
| Invalid / NaN prices | 0 |
| Zero or negative prices | 0 |
| Exact product photo mappings | 290 |
| Products without exact photo mapping | 42 |
| Orphan photo mappings | 0 |
| Structured `nameFr` fields | 0 |

The live Supabase `product_overrides` table currently contains one override: `sekar-nabet` is hidden/deleted. Therefore the immutable source catalogue contains 332 records while the current owner override can reduce the live visible catalogue to 331 after the storefront cache is refreshed.

## Duplicate English display-name audit

### Rock Sugar
- `secar-nabat`: 200 g $0.75; 400 g $1.50.
- `sekar-nabet`: 200 g $0.80.
- Cleaned Arabic names match.
- Both use the same supplied artwork.
- Live Supabase marks `sekar-nabet` hidden/deleted.
- No current review, back-in-stock, Wholesale-item, or order-row references were found for either spelling.
- **Decision:** do not merge automatically. The same-size price conflict is unresolved. Preserve the hidden legacy ID until the owner confirms the intended 200 g price/history.

### Dried Apricots
- `meshmosh-mojafaf`: 500 g $9.60.
- `moshmosh-mojafaf`: 250 g $4.50.
- Cleaned Arabic names match.
- Both use the same supplied artwork.
- **Decision:** owner review. Shared naming/artwork suggests duplication, but price-per-weight is not identical and there is no authoritative merge signal.

### Sun-Dried Tomatoes
- `sun-dried-tomatoes`: Dried Foods; 250 g $3.25; Arabic label specifies sun-dried tomatoes; dedicated image.
- `bandoura-mujafafeh`: Mouneh; 300 g $7.00; different Arabic wording; separate dedicated image.
- **Decision:** keep separate. Existing category, pack, price, Arabic label, and exact-image evidence supports distinct catalogue records.

### Barley Flour
- `barley-flour`: 1 kg $3.50.
- `barly-flour`: 500 g $1.75.
- Both use the same exact image and the prices scale exactly by weight.
- **Decision:** likely duplicate, but do not merge without owner confirmation because IDs may be referenced externally or historically.

### Corn Flour
- `corn-flour`: 500 g $0.75.
- `dora-flour`: 1 kg $2.60.
- Neither has an exact product photo mapping.
- **Decision:** owner review. Name similarity alone is not enough and the prices do not establish equivalence.

### Flax Seeds
- `bezer-al-ketan`: 500 g $4.50.
- `bezer-el-kettan`: 200 g $1.80.
- Cleaned Arabic names match; both use the same supplied artwork; prices scale exactly by weight.
- **Decision:** likely transliteration duplication, but preserve both stable IDs pending owner confirmation.

### Spicy Stuffed Green Olives
- `zaytoun-akhdar-mahshe-har`: 360 g $5.00.
- `zaytoun-akhdar-mehshe-har`: 2.5 kg $8.00.
- Both currently lack exact photo mappings.
- **Decision:** owner review. The spelling strongly suggests a duplicated name, but the pack/price relationship is too different to merge safely.

### Cinnamon Sticks
- `korfa-cigar`: 100 g $1.20; Arabic label `قرفة سيجار`; dedicated image.
- `korfa-oud`: 100 g $1.00; Arabic label `قرفة عود`; separate dedicated image.
- **Decision:** keep separate. Same English display name masks truthful form/type distinctions already present in the source.

## Text and localization findings

- English names: 332/332 present.
- Arabic names: 332/332 present.
- 329 product objects contain legacy Unicode bidi control characters, mostly around Arabic source text. These are reported but not bulk-rewritten in this batch because the catalogue is a one-line generated data file and a mass rewrite would create a high-risk concurrent diff.
- Structured French product names: 0/332. Current French display coverage is supplied by `public/fr-runtime-v1.js` through explicit product-name translations and generic translation rules rather than `nameFr` catalogue fields.
- French runtime integration is preserved. Migrating all product translations into structured catalogue data requires a dedicated evidence-backed localization migration; Batch 6 does not fabricate translations to make the metric read 100%.

## Size and price findings

- All 423 prices are finite numeric values and greater than zero.
- No price has more than two decimal places.
- One explicit nonstandard size remains for owner review:
  - `zaatar-with-nuts-1-unit-not-listed`: `1 (unit not listed)`
- Existing `Size not listed` variants are retained because the source does not provide a trustworthy unit. They are not converted by guesswork.

## Photo coverage

Current production map coverage is 290/332 (87.35%). The 42 products without an exact mapping are:

- `carbonate`
- `hamod-el-laymoun`
- `pakmaya-yeast`
- `white-sugar`
- `peanuts-carob-bar`
- `teen-hibal`
- `corn-flour`
- `dora-flour`
- `yeast`
- `kameh-makshour`
- `makhlotet-hboub`
- `popcorn`
- `dried-rosemary`
- `habaa`
- `silani-tea`
- `lokmet-el-nahel`
- `makdous-el-beqaa-har`
- `waraq-enab-bel-may`
- `zaatar-zahra-mathoun`
- `loz-hab-be-qeshroh`
- `somsom-mhamas`
- `somsom-nay`
- `castor-seeds-oil`
- `zaytoun-akhdar-beqaa`
- `zaytoun-akhdar-mahshe-har`
- `zaytoun-akhdar-mehshe-har`
- `zaytoun-aswad-beqaa`
- `kabees-el-loz`
- `humus-amreeki`
- `bhar-aswad-har`
- `bhar-crispy`
- `bhar-dajaj`
- `bhar-lahme`
- `bhar-mashawe`
- `bodret-el-thoumm`
- `hail-naem`
- `helbah-hab`
- `jozet-el-teeb-hab`
- `loumi`
- `sabo`
- `hamod-el-hosrum-beqaa`
- `hamod-el-hosrum-koura`

There are no orphan photo mappings. Shared photo paths remain reportable, not automatically erroneous, because some supplied artwork explicitly covers multiple catalogue entries.

No missing product has been assigned a similar, generated, stock, or web image.

## Compatibility checks and merge impact

No product ID, variant ID, price, category, or product record is changed by this batch. Consequently:

- no cart/favorites migration is required;
- no SEO redirect is created;
- no back-in-stock record migration is required;
- no review reassociation is required;
- no Wholesale historical item is rewritten;
- no order-history item is rewritten.

Live tables were inspected for the duplicate Rock Sugar IDs. Current reviews, back-in-stock requests, Wholesale items, and existing orders contain no references to those two IDs. Historical-snapshot behavior in Wholesale remains unchanged.

## Automated validation

`scripts/catalogue-validator.cjs` is the reusable validator for future catalogue updates.

Human report:
```sh
npm run catalogue:report
```

CI structural gate:
```sh
npm run catalogue:check
```

The CI gate fails on structural corruption such as duplicate IDs, malformed variants, missing required English names, invalid categories, invalid/non-positive prices, excessive price precision, products without variants, or mapped local assets that do not exist. It reports missing exact photos, duplicate display names, bidi controls, missing structured French names, shared image paths, and owner-review size labels without failing CI.

## Owner-review queue

1. Confirm whether the hidden `sekar-nabet` record should remain only as a legacy ID or whether its historical $0.80 price has a specific meaning.
2. Confirm whether the Dried Apricots pair is one product split by size or genuinely separate stock.
3. Confirm whether the Barley Flour pair should eventually consolidate under one canonical ID.
4. Confirm whether the Flax Seeds pair should eventually consolidate under one canonical ID.
5. Confirm whether the Corn Flour pair represents the same flour/source.
6. Confirm the correct relationship between the two Spicy Stuffed Green Olives records.
7. Supply/confirm the unit for `zaatar-with-nuts-1-unit-not-listed`.
8. Supply exact photography for the 42 unmapped products if available.
9. Plan a dedicated structured French product-data migration if `nameFr` is required as a catalogue field rather than runtime localization.

## Media pipeline note

Current product rendering preserves image width/height metadata, lazy loading/async decoding in parts of the storefront, and admin framing overrides. The current product map does not yet provide a full deterministic AVIF/WebP/JPEG derivative set with per-product `srcset`. That is recorded as an outstanding media-pipeline improvement rather than being mixed into this data-hygiene change, because image optimization work landed concurrently and the exact source images must not be recompressed or remapped speculatively.
