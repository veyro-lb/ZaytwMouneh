#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,"public",p),"utf8");
const version="20261009-varied2";
const footer="mouneh-olive-flourish.svg";
const assets={
  "index.html":"mouneh-home-olive-grove.svg",
  "shop.html":"mouneh-shop-harvest-garland.svg",
  "recipes.html":"mouneh-recipes-olive-blossom.svg"
};

const footerArt=read("assets/decor/"+footer);
const css=read("mouneh-decor-v1.css");
assert.match(footerArt,/<svg\b/);
assert.match(footerArt,/viewBox="0 0 430 93"/);
assert.match(footerArt,/href="data:image\/webp;base64,UklGR/);
assert(!/<script\b|<foreignObject\b|\bonload\s*=/i.test(footerArt),"Footer art must contain no executable content");
assert((footerArt.match(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/)||[])[1]?.length===4968,"Keep approved detailed footer artwork intact");

const unique=new Set();
for(const file of Object.values(assets)){
  assert(!unique.has(file),"Different sections must not reuse a design");
  unique.add(file);
  const svg=read("assets/decor/"+file);
  assert.match(svg,/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="1200" height="260" viewBox="0 0 1200 260"/);
  assert(svg.endsWith("</svg>"),file+": SVG not closed");
  assert(svg.includes("linearGradient")&&svg.includes("radialGradient"),file+": detail layers missing");
  assert(!/<script\b|<foreignObject\b|\bonload\s*=|<image\b[^>]+https?:/i.test(svg),file+": SVG has executable/external content");
}
assert(css.includes("object-fit:contain")&&!css.includes("object-fit:cover"),"Never crop decorative artwork");
assert(css.includes("width:min(calc(100% - 64px),240px)"),"Mobile footer stays compact");
assert(css.includes("width:min(calc(100% - 48px),340px)"),"Mobile shop divider fits viewport");
assert(css.includes("width:min(100%,270px)"),"Shop image remains compact on mobile");
assert(css.includes('body[data-page="recipes"] .zwm-recipes-divider'),"Recipe artwork needs dedicated spacing");
assert(css.includes(".footer .zwm-mouneh-footer-art .zwm-mouneh-script{display:none}"),"Do not double the footer brand");
assert(css.includes("margin:0 auto 26px"),"Footer spacing must remain");
assert(css.includes("@media(max-width:560px)")&&css.includes("prefers-reduced-motion"),"Responsive/reduced-motion support missing");
assert(!css.includes("margin-top:-4px"),"No calligraphy overlap");

for(const page of ["index.html","shop.html","about.html","contact.html","recipes.html","gift.html"]){
  const html=read(page);
  assert(html.includes("/mouneh-decor-v1.css?v="+version),page+": refreshed CSS missing");
  assert(html.includes('class="zwm-mouneh-footer-art"'),page+": footer wrapper missing");
  const matches=html.match(/src="\/assets\/decor\/mouneh-olive-flourish\.svg\?v=20261009-detailed1"/g)||[];
  assert.equal(matches.length,1,page+": footer should use one shared, stable detailed image only");
  assert(html.includes('width="1200" height="259"'),page+": stable footer proportions lost");
  assert(html.includes('lang="ar" dir="rtl">زيت ومونة</span>'),page+": decorative brand script missing");
  if(assets[page]){
    assert(html.includes('src="/assets/decor/'+assets[page]+'?v='+version+'"'),page+": unique high-resolution section asset missing");
    assert(html.includes('width="1200" height="260"'),page+": preserve scalable art proportions");
  }
}
assert(read("index.html").includes('class="zwm-home-divider shell"'),"Home art must have its own slot");
assert(read("shop.html").includes('zwm-brand-divider'),"Shop art must have its own divider");
assert(read("recipes.html").includes('class="zwm-recipes-divider shell"'),"Recipe blossom must sit between sections");
assert.equal((read("shop.html").match(/<span aria-hidden="true"><svg viewBox="0 0 24 24"/g)||[]).length,4,"Trust icons changed unexpectedly");
const photos=read("product-photos.js");
assert(!photos.includes("source-faithful-transparent-cutout"),"Leave product photos untouched");
console.log("PASS: three unique scalable section illustrations, one original footer ornament on six pages, spacing/RTL/accessibility and unchanged product-photo behavior");
