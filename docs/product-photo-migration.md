# Product photo migration — 2026-10-03

Reviewed all 332 JPEGs across the seven supplied WhatsApp ZIPs. Selected 247 original files for 261 product IDs. Files are byte-for-byte originals: no resizing, stretching, cropping, recompression, or generated replacement artwork.

The gallery now loads one individual image per card instead of clipping a shared six-image strip. Original aspect ratios are preserved using `object-fit: contain`; product cards use a portrait frame. Artwork containing several jars or packages remains intact as supplied.

## Matching policy

Names printed on the artwork determine matches. Shared artwork is used only when its printed names include both products (such as the two flower waters, sweet/hot pepper paste, cow/goat kishk, or explicitly illustrated labneh flavors). Existing supported cow/goat kishk and Koura olive matches are retained. No new regional origin is inferred from generic artwork.

Alternate photographs, brand logos, seasonal promotions, assorted-product posters, and products without an exact catalogue match are reviewed but not assigned arbitrarily. Videos are not used as product photographs. 71 catalogue entries have no selected exact artwork and keep the existing neutral placeholder.

## Corrected mismatch

`bhar-crispy` previously showed whole turmeric. Its incorrect image is removed; `kurkum-hab` uses the correctly labeled original. Ground Ceylon cinnamon and Ceylon cinnamon sticks now use their respective artwork.

## Verification

`product-photo-audit.json` records each selected source filename and ZIP, dimensions, SHA-256, product IDs, all reviewed JPEGs, and the remaining products without exact photography. Every selected asset is checked against its ZIP bytes. Historical product atlases are removed after all consumers switch to individual images.
