# Zayt w Mouneh — transparent illustration integration

The original illustration ZIP is distributed from the ChatGPT conversation. GitHub's connected text-file API cannot upload its binary PNG/WebP files; **do not mistake this README for the images**. Install the binary assets using \`scripts/install-botanical-assets.ps1\` from the ZIP first. That script uploads the exact artwork to this **design branch only**, never \`main\`.

## Artwork and intended placement

| Base filename | Recommended placement |
| --- | --- |
| \`olive-branch-left\` | Home hero top/left outer corner, only where text remains clear |
| \`olive-branch-right\` | Optional balanced home hero corner, desktop only if space allows |
| \`mouneh-jars\` | Large About/heritage or homepage editorial visual |
| \`zaatar-bundle\` | Recipes collection intro, about local herbs |
| \`wheat-bundle\` | Food-tradition and grains editorial copy |
| \`pomegranate\` | About/recipe accent, avoid product cards |
| \`lemons-and-leaves\` | Recipe intro or selected food story |
| \`mortar-and-herbs\` | Cookbook detail editorial accent |
| \`olive-sprig\` | Small heading accent, used sparingly |
| \`olive-divider\` | A single section divider on light background |
| \`olive-flourish\` | Footer divider or gold botanical accent |

Every entry will have both \`.png\` and \`.webp\` versions at \`public/assets/decor/<name>.<extension>\`. The images have genuine alpha transparency (no baked-in white background). Preserve transparency; **never convert them to JPEG**.

## What Copilot should do after asset upload

1. Inspect existing decorative styling in Home, About, Recipes and Footer, and identify old simplistic/unclear CSS/SVG ornamentation.
2. Replace **only decorative** code with the original illustrations above. Do not layer new artwork over the old decoration or remove functional elements.
3. Use image elements with empty \`alt\`, \`aria-hidden="true"\`, \`pointer-events:none\`, \`object-fit:contain\`, no background fill, and appropriate width/height. Prefer optimized transparent WebP.
4. Keep illustrations visible and relevant without obscuring headings or controls: position at section edges or in reserved editorial columns; reduce/hide on mobile.
5. Preserve the Origin Map, product images, search, cart, checkout, recipe routes, Arabic RTL and French.
6. Render **زيت ومونة** as actual correctly shaped Arabic text, not generated calligraphic artwork.
7. Test desktop/mobile, English/Arabic/French, and run \`npm.cmd run check\`.
8. Don't push, merge or deploy until the owner reviews the local result.

### Git and safety

The feature branch is \`design/olive-mouneh-assets\`. Live Cloudflare production deploys from \`main\` and must remain unchanged until reviewed. Local Copilot work may be uncommitted: use \`git status\` and preserve it in a separate commit or \`git stash push -u\` **before** switching branches; never discard it blindly.
