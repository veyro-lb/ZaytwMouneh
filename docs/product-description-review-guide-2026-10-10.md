# Product-description overhaul — review record (10 October 2026)

## Scope

The source catalogue contains **332 records across 21 categories**. The runtime alias cleanup merges or redirects 3 legacy duplicates, leaving **329 canonical runtime products**. This work prepares a description draft for every source record in English, Arabic and French.

- Review CSV: `docs/product-descriptions-review-2026-10-10.csv`
- Preview data: `public/product-descriptions-v1.js`
- Preview integration: `public/product.html` and `public/shop.html` (review branch only)
- Verified count in draft: 332 English descriptions unique; 332 Arabic drafts; 332 French drafts
- **49 ambiguous/label-sensitive products held out of automatic display**
- **280 runtime products would receive descriptions if this draft PR were merged**
- 3 source-only legacy aliases do not reappear as active products
- Supabase `product_overrides` continues to take precedence over catalogue defaults; no database writes were made
- Prices, availability, photos, account data, stock and checkout are unchanged

## Quality and approval state

**DRAFT — NOT APPROVED FOR PRODUCTION.** English copy is written individually, using only name/category/format and ordinary culinary use where applicable. This is not confirmation of actual ingredients, organic status, geographic origin, certifications, therapeutic benefits, absence of allergens or nutritional values. Do not label any such facts as verified without documentation.

Arabic and French text are **preliminary translations/placeholders, not native-speaker-verified copy**. In the French drafts, 55 important product names have editorial French equivalents while 277 retain their catalogue English names pending proper translation. Review all 332 Arabic and French descriptions before approving for publication; the remaining translated descriptions should match the specificity of the English rather than keeping broad category wording.

Known source-name problems (including OCR-like reversed Arabic word order) must also be corrected **without** silently rewriting owner-approved catalogue names.

## Label and identity verification priorities

1. **Debsy Carob (35 records):** Check front/back labels for ingredients, allergens, sweeteners and the precise meaning of sugar-related claims. The prior request to state “no added sugar, sweetened only with carob” is **not yet label-verified**; no new description makes that assertion.
2. **49 product-identity/safety holds:** Brands of uncertain composition, unidentified herbal products, propolis items, sugar-free formulations, distilled botanicals, lupini products and oils with unknown culinary versus topical purpose. The preview script deliberately skips all 49.
3. **Oils (11):** Confirm food-grade vs cosmetic-only use, dilution and intended application, particularly bitter almond, castor, rosemary, rose and other concentrated oils.
4. **Allergy-sensitive items:** Nuts, seeds, tahini, honey/bee products, dairy mouneh, cookies, soap and mixed snacks require ingredients/allergen confirmation. Never infer gluten-free, lactose-free, vegan or organic status.
5. **Duplicate aliases:** `barly-flour` → `barley-flour`, `bezer-el-kettan` → `bezer-al-ketan`, and `sekar-nabet` → `secar-nabat`. Preserve original redirect handling.
6. **Supplier verification:** Verify unlisted pack sizes, preparation directions, full ingredient labels, the meaning of proprietary names and whether products in named regions actually originate there.

## Implementation notes

- `products-data.js` remains untouched. The overlay is injected **after** it on product/shop pages and before product-page or shop logic, preventing conflicts with concurrent catalogue/SEO work.
- Copy is matched strictly by product ID; no replacement of owner-provided `descriptionEn`, `descriptionAr`, or `descriptionFr`.
- The product-page factual-content heading was changed from “Verified product information” to “Product information” so general editorial descriptions are not misrepresented as supplier-verified facts.
- No claim of zero added sugar was generated. Sugar-free words in **existing product names** are not independent verification.
- Run `node tests/product-descriptions-regression.cjs` after any change to the CSV, overlay, HTML loading order or aliases.

## Approval gate before merging

1. Review all 332 English descriptions, especially the 49 holds and user-required carob claims.
2. Replace generic Arabic/French placeholders with specific, fluent translations and check French product names.
3. Use product-label photos or supplier information to fill verified `ingredientsEn/Ar/Fr` and `allergensEn/Ar/Fr` when evidence is available.
4. Preview each language, inspect product details and SEO tags, test owner overrides, and verify checkout and pricing remain unchanged.
5. Remove safety holds **only after** review and merge the PR after verification. Never force-push main or delete other work.
