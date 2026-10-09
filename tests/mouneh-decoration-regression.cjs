#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,"public",p),"utf8");

const art=read("assets/decor/mouneh-olive-flourish.svg");
const css=read("mouneh-decor-v1.css");
assert.match(art,/<svg\b/);
assert.match(art,/viewBox="0 0 430 93"/);
assert.match(art,/href="data:image\/webp;base64,UklGR/);
assert(!/<script\b|<foreignObject\b|\bonload\s*=/i.test(art),"Decorative SVG must contain no executable content");
assert((art.match(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/)||[])[1]?.length===4968,"Approved transparent photo must stay intact");
assert(css.includes("object-fit:contain")&&!css.includes("object-fit:cover"),"Decorative art should not crop");
assert(css.includes("width:min(calc(100% - 64px),240px)"),"Mobile footer ornament must remain compact at 240px maximum");
assert(css.includes("width:min(calc(100% - 48px),340px)"),"Mobile section divider needs a safe viewport width");
assert(css.includes(".footer .zwm-mouneh-footer-art .zwm-mouneh-script{display:none}"),"Do not repeat the Arabic brand name immediately above the footer logo");
assert(css.includes("margin:0 auto 26px"),"Footer ornament must be separated from its links and logo");
assert(css.includes("width:min(100%,270px)"),"Mobile shop divider art should not fill the screen");
assert(!css.includes("margin-top:-4px"),"Do not pull the calligraphy into the olive branch artwork");
assert(css.includes("@media(max-width:560px)")&&css.includes("prefers-reduced-motion"),"Responsive and reduced-motion styles required");
for(const page of ["index.html","shop.html","about.html","contact.html","recipes.html","gift.html"]){
  const html=read(page);
  assert(html.includes("/mouneh-decor-v1.css?v=20261009-detailed1"),page+": refreshed decorative styles missing");
  assert(html.includes('class="zwm-mouneh-footer-art"'),page+": footer artwork wrapper missing");
  assert(html.includes('src="/assets/decor/mouneh-olive-flourish.svg?v=20261009-detailed1"'),page+": ornament reference missing");
  assert(html.includes('width="1200" height="259"'),page+": reserve the original image aspect ratio");
  assert(html.includes('lang="ar" dir="rtl">زيت ومونة</span>'),page+": decorative brand script missing");
}
const shop=read("shop.html");
assert(shop.includes("zwm-brand-divider"),"Shop must have full-width ornamental section divider");
assert.equal((shop.match(/<span aria-hidden="true"><svg viewBox="0 0 24 24"/g)||[]).length,4,"Four benefit icons must be consistent");
const photos=read("product-photos.js");
assert(!photos.includes("source-faithful-transparent-cutout"),"Product-photo experiments must stay disabled");
console.log("PASS: six main pages reference the same detailed transparent olive photo, refreshed 430/93 spacing, no duplicate footer script, four icons and untouched original product photos");
