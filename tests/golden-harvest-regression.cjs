"use strict";
/* Independent, zero-dependency seasonal campaign validation. Does not touch production data. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const js=read("public/golden-harvest-2026.js");
const css=read("public/golden-harvest-2026.css");
const media="public/assets/harvest-2026/";
const images=["4l.webp","8-77l.webp","17-54l.webp"];
const required=[...images,"harvest-film.mp4","hero-poster.jpg"];
for(const name of required){
 const file=path.join(root,media,name);
 assert.ok(fs.existsSync(file),"Missing campaign asset: "+name);
 const data=fs.readFileSync(file);
 assert.ok(data.length>6000,name+" is suspiciously small");
 if(name.endsWith(".webp")){
  assert.equal(data.toString("ascii",0,4),"RIFF",name+" must be a WebP RIFF container");
  assert.equal(data.toString("ascii",8,12),"WEBP",name+" must be a WebP image");
 }else if(name.endsWith(".mp4")){
  assert.equal(data.toString("ascii",4,8),"ftyp",name+" must be an MP4");
 }else{
  assert.equal(data[0],0xff,name+" must be JPEG");
  assert.equal(data[1],0xd8,name+" must be JPEG");
 }
}
assert.doesNotThrow(()=>new Function(js),"Campaign script parses");
assert.match(js,/var ENABLED=false/,"Campaign must not launch prematurely");
assert.match(js,/harvestPreview/,"Review must be available with preview query parameter");
assert.match(js,/prefers-reduced-motion/);
assert.match(js,/visibilitychange/);
assert.match(js,/IntersectionObserver/);
assert.match(js,/localechange|MutationObserver/);
assert.match(js,/function variantFor\(size\)/);
assert.match(js,/function available\(p\)/);
assert.match(js,/PRODUCTS_DATA/,"Catalogue is live-derived, not duplicated");
assert.doesNotMatch(js,/localStorage\.setItem|sessionStorage\.setItem/,"Do not mutate commerce state");
assert.ok(js.includes('var OIL_ID="extra-virgin-olive-oil"'));
for(const [size,id,file] of [
 ["4","extra-virgin-olive-oil-4-l","4l.webp"],
 ["8.77","extra-virgin-olive-oil-8-77-l","8-77l.webp"],
 ["17.54","extra-virgin-olive-oil-17-54-l","17-54l.webp"]
]){
 assert.ok(js.includes('size:"'+size+'",id:"'+id+'",file:"'+file+'"'),"Incorrect tin size or variant "+size);
}
for(const lang of ["en:","ar:","fr:"])assert.ok(js.includes(lang),"Missing translation "+lang);
assert.match(js,/زيت السنة وصل/);
assert.match(css,/prefers-reduced-motion/);
assert.match(css,/object-fit:contain/);
assert.match(css,/@media \(max-width:690px\)/);
assert.match(css,/html\[dir="rtl"\]/);
for(const page of ["index","shop"]){
 const html=read("public/"+page+".html");
 const styles=[...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)];
 assert.ok(styles.at(-1)?.[0].includes("storefront-shell.css"),page+" storefront shell stylesheet must be last");
 assert.equal((html.match(/golden-harvest-2026\.css/g)||[]).length,1,page+" exactly one CSS include");
 assert.equal((html.match(/golden-harvest-2026\.js/g)||[]).length,1,page+" exactly one JS include");
 assert.ok(html.indexOf("products-data.js")<html.indexOf("golden-harvest-2026.js"),page+" campaign must load after catalogue data");
 assert.ok(html.indexOf("app.js")<html.indexOf("golden-harvest-2026.js"),page+" campaign must load after app");
}
console.log("Golden Harvest 2026 standalone gate passed: five authentic media files, three capacities, EN/AR/FR, gated launch, script syntax, preserved storefront load order.");
