#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const publicDir=path.resolve(__dirname,"..","public");
const read=p=>fs.readFileSync(path.join(publicDir,p),"utf8");
const binary=p=>fs.readFileSync(path.join(publicDir,p));
const version="20261009-photo3";
const footer="mouneh-footer-olive-gold.webp";
const sections={
  "index.html":{file:"mouneh-home-olive-grove.webp",width:700,height:144},
  "shop.html":{file:"mouneh-shop-harvest-garland.webp",width:860,height:117},
  "recipes.html":{file:"mouneh-recipes-olive-blossom.webp",width:880,height:117}
};
const signatures=new Set();
function verifyWebp(name,width,height){
  const data=binary("assets/decor/"+name);
  assert(data.length>=12000&&data.length<100000,name+": photo asset size unexpected");
  assert.equal(data.toString("ascii",0,4),"RIFF",name+": bad RIFF signature");
  assert.equal(data.toString("ascii",8,12),"WEBP",name+": not a WebP image");
  assert.equal(data.toString("ascii",12,16),"VP8X",name+": expected extended transparent WebP");
  assert((data[20]&0x10)!==0,name+": missing transparency/alpha flag");
  assert(data.includes(Buffer.from("ALPH")),name+": no alpha data chunk");
  assert.equal(data.readUIntLE(24,3)+1,width,name+": intrinsic width changed");
  assert.equal(data.readUIntLE(27,3)+1,height,name+": intrinsic height changed");
  const digest=crypto.createHash("sha256").update(data).digest("hex");
  assert(!signatures.has(digest),name+": photo reused instead of distinct art");
  signatures.add(digest);
}
verifyWebp(footer,970,122);
for(const art of Object.values(sections))verifyWebp(art.file,art.width,art.height);

const css=read("mouneh-decor-v1.css");
assert(css.includes("object-fit:contain")&&!css.includes("object-fit:cover"),"Do not crop photos");
assert(css.includes("aspect-ratio:700/144")&&css.includes("aspect-ratio:860/117")
    &&css.includes("aspect-ratio:880/117")&&css.includes("aspect-ratio:970/122"),"Intrinsic aspect ratios must match real assets");
assert(css.includes("width:min(calc(100% - 64px),290px)"),"Mobile footer needs safe width");
assert(css.includes("width:min(100%,330px)"),"Mobile section ornaments should stay compact");
assert(css.includes("padding:12px 0 18px"),"Homepage mobile spacing should stay tight");
assert(!css.includes(".zwm-brand-divider>span"),"Fake gold divider lines must not return");
assert(css.includes("@media(max-width:560px)")&&css.includes("prefers-reduced-motion"),"Responsive styles required");

const pages=["index.html","shop.html","about.html","contact.html","recipes.html","gift.html"];
for(const page of pages){
  const html=read(page);
  assert(html.includes("/mouneh-decor-v1.css?v="+version),page+": updated styles missing");
  assert(html.includes('class="zwm-mouneh-footer-art"'),page+": footer photo slot missing");
  const footerRef='src="/assets/decor/'+footer+'?v='+version+'" width="970" height="122"';
  assert.equal(html.split(footerRef).length-1,1,page+": consistent footer should appear once");
  assert(!/src="\/assets\/decor\/[^"]+\.svg/.test(html),page+": obsolete SVG decoration still referenced");
  if(sections[page]){
    const a=sections[page];
    const ref='src="/assets/decor/'+a.file+'?v='+version+'" width="'+a.width+'" height="'+a.height+'"';
    assert(html.includes(ref),page+": unique high-resolution photo divider absent");
  }
}
const shop=read("shop.html");
const divider=shop.split('class="botanical-divider shell motion-reveal zwm-brand-divider"')[1]?.split('<section class="seasonal-story')[0]||"";
assert(!divider.includes("<span></span>"),"Shop still contains old fake divider line");
assert(divider.includes('lang="ar" dir="rtl">زيت ومونة</span>'),"Shop calligraphy/RTL script must remain");
assert.equal((shop.match(/<span aria-hidden="true"><svg viewBox="0 0 24 24"/g)||[]).length,4,"Trust icons must not change");
assert(!read("product-photos.js").includes("source-faithful-transparent-cutout"),"Product photos must stay untouched");
console.log("PASS: four distinct transparent photo WebPs, one consistent footer across six pages, responsive placement, Arabic script and no decorative SVGs");
