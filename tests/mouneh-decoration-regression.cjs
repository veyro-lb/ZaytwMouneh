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
assert.match(art,/viewBox="0 0 1200 220"/);
assert.match(art,/<linearGradient id="leaf"/);
assert(!/<image\b|<script\b/i.test(art),"Decorative SVG must contain only native vectors, no embedded raster/script");
assert(css.includes("object-fit:contain")&&!css.includes("object-fit:cover"),"Decorative art should not crop");
assert(css.includes("calc(100% - 40px)")&&css.includes("calc(100% - 32px)"),"Mobile footer artwork needs valid responsive widths");
assert(css.includes("@media(max-width:560px)")&&css.includes("prefers-reduced-motion"),"Responsive and reduced-motion styles required");
for(const page of ["index.html","shop.html","about.html","contact.html","recipes.html","gift.html"]){
  const html=read(page);
  assert(html.includes("mouneh-decor-v1.css"),page+": decorative styles missing");
  assert(html.includes('class="zwm-mouneh-footer-art"'),page+": footer artwork wrapper missing");
  assert(html.includes('src="/assets/decor/mouneh-olive-flourish.svg"'),page+": ornament reference missing");
  assert(html.includes('width="1200" height="220"'),page+": reserve image aspect ratio");
  assert(html.includes('lang="ar" dir="rtl">زيت ومونة</span>'),page+": decorative brand script missing");
}
const shop=read("shop.html");
assert(shop.includes("zwm-brand-divider"),"Shop must have full-width ornamental section divider");
assert.equal((shop.match(/<span aria-hidden="true"><svg viewBox="0 0 24 24"/g)||[]).length,4,"Four benefit icons must be consistent");
const photos=read("product-photos.js");
assert(!photos.includes("source-faithful-transparent-cutout"),"Product-photo experiments must stay disabled");
console.log("PASS: six customer pages have uncropped brand ornaments; Arabic script, responsive styles, four icons and original product photos are preserved");
