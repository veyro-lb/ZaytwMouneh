# Product photo cutout readiness — image audit handoff (2026-10-09)

**Scope:** Current source catalogue and exact mapped images in `public/`; owner-managed Supabase photo overrides may change live results. This document is a preparation aid for the ongoing image audit, **not a claim that transparent cutouts have been made**.

## Confirmed inventory

| Check | Result |
| --- | ---: |
| Source catalogue products | 332 |
| Mapped photo entries | 290 |
| Unique mapped paths | 277 |
| Catalogue items with no exact photo mapping | 42 |
| Shared photo paths requiring identity review | 13 |
| Existing mapped photo formats | JPEG (290/290; no alpha transparency) |
| Approved transparent product cutouts created in this pass | **0** |

The **per-product machine-readable inventory** is [`product-cutout-readiness-inventory-2026-10-09.json`](./product-cutout-readiness-inventory-2026-10-09.json). It lists each product ID, existing verified mapping, any shared-image IDs, and a *proposed* cutout path. Proposed paths do **not** indicate a file exists.

### Important quality finding

Visual inspection of the current GitHub originals for `american-rice`, `extra-virgin-olive-oil`, `zaatar-manakish`, `tahini`, `white-honey-blend`, and `roasted-cheese-corn` shows **flattened promotional JPGs** combining the merchandise with background scenes, promotional titles, brand imagery, and WhatsApp contact information. Samples of the supplied WhatsApp ZIP photography show the same poster-like treatment. Other images may vary; a per-file visual quality decision was **not** made for all 277 unique mapped paths.

These images are legitimate *source* artwork but **are not transparent, isolated product cutouts**. A blanket `object-fit: contain` rule will preserve the entire poster rather than isolate the package. CSS alone cannot remove a baked-in background. Automatically thresholding JPEG backgrounds could erase transparent packaging, product labels, shadows, multiple legitimate items, or contaminate cutout edges.

### Safe workflow for the image-audit agent

1. **Preserve all current originals** byte-for-byte in `public/assets/products/originals/`. Do not overwrite, delete, recrop, recompress or replace source images.
2. Use this inventory plus `docs/product-photo-audit.json`, `docs/product-photo-migration.md`, and `docs/product-photo-followup.md` to avoid redoing source matching.
3. Produce cutouts *only* for assets whose package outline and identification can be verified visually. Separate promotional backdrop and superimposed text, while keeping actual printed packaging and brand labels intact. A clean real product cutout is preferable to a hallucinated or damaged package.
4. Store approved derivatives separately, e.g. `public/assets/products/cutouts/<product-id>.png` (lossless transparent PNG); do not assume the proposed path in the inventory already exists. If using transparent WebP, verify alpha and browser compatibility. Make sure no false white/colored matte survives.
5. For shared artwork, verify whether the image truly represents *both* IDs, and do not split mixed packaging into misleading single-item pictures. Preserve existing verified shared imagery until separate verified originals are available.
6. For missing mappings, retain existing placeholders pending genuine product photographs. **Never match by similar product name alone, use stock replacements, or invent product claims.**
7. Ensure the actual image displays correctly in the catalogue, individual product page, quick view, image enlargement, checkout/cart and relevant gift flows; maintain EN / AR / FR, RTL, object positioning, and focus handling.
8. Before switching a mapping, verify original product ID, photo integrity, transparent alpha, entire package visible, correct variant/product identity, actual file path, image dimensions, loading performance, and browser results. Review owner-managed Supabase photo overrides without changing authorization.
9. Coordinate against the latest `main` and other concurrent chats. Keep the final image change as a focused PR or staged local work when instructed not to push/merge. Do not deploy without approval.

### Source items with no exact mapped photo (42)

- `carbonate` — Carbonate
- `hamod-el-laymoun` — Citric Acid (Lemon Salt)
- `pakmaya-yeast` — Pakmaya Yeast
- `white-sugar` — White Sugar
- `peanuts-carob-bar` — Peanuts Carob Bar
- `teen-hibal` — String-Dried Figs
- `corn-flour` — Corn Flour
- `dora-flour` — Corn Flour
- `yeast` — Yeast
- `kameh-makshour` — Cracked Wheat
- `makhlotet-hboub` — Mixed Grains
- `popcorn` — Popcorn
- `dried-rosemary` — Dried Rosemary
- `habaa` — Habaa Herb
- `silani-tea` — Ceylon Tea
- `lokmet-el-nahel` — Bee Bite
- `makdous-el-beqaa-har` — Spicy Bekaa Makdous
- `waraq-enab-bel-may` — Grape Leaves in Water
- `zaatar-zahra-mathoun` — Ground Wild Thyme Flowers
- `loz-hab-be-qeshroh` — Almonds in Shell
- `somsom-mhamas` — Toasted Sesame
- `somsom-nay` — Raw Sesame
- `castor-seeds-oil` — Castor Seed Oil
- `zaytoun-akhdar-beqaa` — Bekaa Green Olives
- `zaytoun-akhdar-mahshe-har` — Spicy Stuffed Green Olives
- `zaytoun-akhdar-mehshe-har` — Spicy Stuffed Green Olives
- `zaytoun-aswad-beqaa` — Bekaa Black Olives
- `kabees-el-loz` — Pickled Almonds
- `humus-amreeki` — American Chickpeas
- `bhar-aswad-har` — Hot Black Pepper
- `bhar-crispy` — Crispy Seasoning
- `bhar-dajaj` — Chicken Seasoning
- `bhar-lahme` — Meat Seasoning
- `bhar-mashawe` — Grilling Seasoning
- `bodret-el-thoumm` — Garlic Powder
- `hail-naem` — Ground Cardamom
- `helbah-hab` — Fenugreek Seeds
- `jozet-el-teeb-hab` — Whole Nutmeg
- `loumi` — Dried Lime
- `sabo` — Sabo
- `hamod-el-hosrum-beqaa` — Bekaa Verjuice
- `hamod-el-hosrum-koura` — Koura Verjuice

### Shared image paths requiring product-identity verification (13)

- `assets/products/originals/secar-nabat.jpg` → `secar-nabat`, `sekar-nabet`
- `assets/products/originals/maa-ward.jpg` → `maa-ward`, `maa-zaher`
- `assets/products/originals/meshmosh-mojafaf.jpg` → `meshmosh-mojafaf`, `moshmosh-mojafaf`
- `assets/products/originals/barley-flour.jpg` → `barley-flour`, `barly-flour`
- `assets/products/originals/burglur-abyad-kheshen.jpg` → `burglur-abyad-kheshen`, `burglur-abyad-neeme`
- `assets/products/originals/white-honey-blend.jpg` → `zayt-w-mouneh-white-honey-blend`, `white-honey-blend`
- `assets/products/originals/proplis-with-ethanol.jpg` → `proplis-with-ethanol`, `propolis-with-olive-oil`
- `assets/products/originals/debes-el-fleyfleh.jpg` → `debes-el-fleyfleh`, `debes-el-fleyfleh-har`
- `assets/products/originals/kishek-bakari-beqaa.jpg` → `kishek-bakari-beqaa`, `kishek-meeza-beqaa`
- `assets/products/originals/labneh-mkaazleh-habet-barakeh.jpg` → `labneh-mkaazleh-habet-barakeh`, `labneh-mkaazleh-zaatar`
- `assets/products/originals/bezer-al-ketan.jpg` → `bezer-al-ketan`, `bezer-el-kettan`
- `assets/products/originals/roasted-cheese-corn.jpg` → `roasted-cheese-corn`, `roasted-salted-corn`
- `assets/products/originals/khal-el-enab.jpg` → `khal-el-enab`, `khal-el-tefeh`

### Audit completion criteria

- All intended product shots have an individually **approved**, correctly identified, cleanly isolated product image OR an explicit placeholder pending photography.
- Do not mark an opaque source JPEG as a completed transparent cutout.
- Check the backgrounds and product boundaries visually on a representative light **and** dark page background to catch halos.
- Flag labels cropped off, incorrect item, missing packaging details, mismatched shadows, fake/altered products, repeated poster copy and contact numbers around the product.
- Report by product ID which assets have approved derivatives, which cannot be safely isolated, and which need new clean photography.
- Verify all affected viewports and run the existing regression suite; distinguish tests executed from static checks and production/browser verification.
- Keep originals and provenance documentation unchanged.

**No production storefront mapping or live commerce data was changed during this preparation pass.**
