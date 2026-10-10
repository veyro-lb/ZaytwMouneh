# Zayt W Mouneh — Organic Search Discovery Audit (10 October 2026)

## Scope and truthfulness

This audit covers all **332 base catalogue records** in `public/products-data.js` (21 categories, 424 size/price variants). The accompanying `docs/seo-product-audit-2026-10-10.csv` records every product individually: English and Arabic names, transliteration, category, sizes, existing photo mapping, candidate *relevant* language-specific search terms, and evidence gaps. It is an audit of information present in GitHub and the two existing Supabase owner overrides — **not verified keyword search volume, not a guarantee of Google rankings**.

The sole current hidden override is `sekar-nabet`; it is kept in the audit but **excluded from the HTML A–Z directory**. `loz-hab-be-qeshroh` has an image/name owner override; that current owner change must remain the source of truth. We have **not edited any product names, prices, ingredients, allergens, origin claims, photos or owner overrides**.

## Findings by severity

| Finding | Audit result | Recommended action |
| --- | --- | --- |
| Product pages initially contain generic HTML; product title, description, and Product JSON-LD are inserted by JavaScript | All individual product routes | Verify Google's **rendered HTML** for one product per major category. Longer-term add real product HTML prerendering at the route level; use live owner overrides for final pricing and stock. |
| No `descriptionEn`, `descriptionAr`, or `descriptionFr` in base data | 332/332 | Owners should provide factual, product-specific details; do not generate imagined ingredients, health claims, origin, or certifications. |
| No verified `nameFr` in base catalogue | 332/332 | Manually review French product names, then add verified translations. Existing runtime translation is not proof of correctness. |
| English display names duplicated | 8 name groups, 16 records | Review whether duplicated items are truly distinct, differentiate by accurate size/packaging/type or consolidate retired duplicates. Do not arbitrarily delete. |
| Arabic bidi-control characters inside raw names | 329/332 | Normalize formatting when presenting/searching while protecting proper Arabic characters; audit raw spelling separately. |
| No exact photo mapped in GitHub photo map | 42/332 | Request verified exact packaging photos where missing; a live owner image override may supply an image. |
| Owner-hidden product still appears in original 1,023-URL sitemap | `sekar-nabet`, 3 language URLs | Coordinate a future sitemap regeneration from the active catalog instead of editing product data ad hoc; verify hidden routes return `noindex` when JS loads. |
| HTML shop grid exposes product card names as text and Quick View buttons | Product grid | Add real localized links and a static public directory without removing Quick View. |
| Short generic meta descriptions on individual product pages | Whole catalogue | Generate relevant category- and size-based copy using *verified* fields; do not use keyword stuffing. |

## User search intent we can legitimately address

Prioritize real customer searches **matching products we actually carry**. Search engines evaluate relevance and quality; the same short word can have many meanings and no site can rank for every related word.

| English | Arabic | French | Landing page |
| --- | --- | --- | --- |
| Zayt W Mouneh, Lebanese mouneh, Lebanese pantry | زيت ومونة، مونة لبنانية، مونة بلدية | mouneh libanaise, produits libanais | Home, `/shop`, `/catalogue` |
| Lebanese extra virgin olive oil, olive oil 1 L, olive oil 4 L | زيت زيتون، زيت زيتون بكر ممتاز، زيت بلدي | huile d'olive libanaise, huile d'olive extra vierge | `/product/extra-virgin-olive-oil` |
| zaatar, Lebanese thyme, manoushe ingredients | زعتر، زعتر بلدي، زعتر مناقيش | zaatar, thym libanais | Real zaatar product pages |
| Lebanese honey, natural honey | عسل، عسل طبيعي | miel libanais, miel | Honey category and individual products; do **not** claim organic/raw unless documented |
| kishk, makdous, shanklish, labneh balls | كشك، مكدوس، شنكيش، لبنة مكازلة | kechek, makdous, labné | Exact corresponding products |
| carob molasses, dibs, sumac, olives, nuts, pickles | دبس الخروب، سماق، زيتون، مكسرات، مخللات | mélasse de caroube, sumac, olives, fruits secs | Exact product and category pages |

## What this PR changes

1. Links individual product card names to actual product URLs in the selected locale, while preserving Quick View click behavior on the rest of each card.
2. Adds `/catalogue`, a human-accessible static HTML directory of 331 visible products in 21 categories, linking to 993 English/Arabic/French product routes. Accessible from the shop footer.
3. Improves product metadata and `Product` JSON-LD descriptions using verified name, category, size and any live owner-supplied details. These are not claims that products are all Lebanese-made.
4. Adds an automated regression check to preserve the directory and prevent accidentally promoting the hidden product.
5. Leaves prices, Supabase, checkout, 2026 harvest assets, unrelated administration, and sitemap unchanged.

## Follow-up work after deployment

- Verify `/catalogue`, and Google's rendered product page for representative examples from each of the 21 categories using Search Console URL Inspection + Rich Results Test.
- Track **Performance → Search results → Queries** and **Pages → Indexing** for several weeks. Optimize based on real impressions, not guessing keyword volume.
- Obtain owner-verified unique product descriptions and ingredients only where evidence exists; review correct Arabic spelling and French translations with a fluent reviewer.
- Review duplicate product names, exact photo gaps and the hidden product in the sitemap; update active-catalogue SEO data only after owner approval.
- Evaluate static prerendering of full product HTML. Cloudflare currently uses catch-all rewrites from product paths to `product.html`, so switching routing must be tested carefully before a release.
- Improve genuine local authority via accurate Google Business Profile (if eligible), consistent store details, natural product guides and real relevant backlinks.

Relevant Google documentation: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics and https://developers.google.com/search/docs/appearance/structured-data/product-snippet.
