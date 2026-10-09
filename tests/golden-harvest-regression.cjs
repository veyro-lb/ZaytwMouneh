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
// Explicitly validate the selected language throughout the seasonal presentation.
const vm=require("node:vm");
const copyStart=js.indexOf("  var COPY={");
const copyEnd=js.indexOf(";\n  function language()",copyStart);
assert.ok(copyStart>=0&&copyEnd>copyStart,"Localization catalogue must be readable");
const copy=vm.runInNewContext("(function(){"+js.slice(copyStart,copyEnd)+"; return COPY;})()");
const copyKeys=["overline","title","tagline","localeDisplay","localeAria","heroFooter","desc",
  "discover","pantry","choose","chooseText","season","chooseSize","unavailable","inquire",
  "note","storyOverline","story","storyCopy","table","tableCopy","shopZaatar","shopOlives",
  "announcement","announcementLink","shopDesc","allOil","shopPromo","shopJump",
  "imageAlt","storyImageAlt","shopImageAlt"];
for(const locale of ["en","ar","fr"]){
  assert.ok(copy[locale],locale+" translation missing");
  for(const key of copyKeys){
    assert.ok(typeof copy[locale][key]==="string"&&copy[locale][key].trim().length>0,locale+" campaign copy missing "+key);
  }
}
assert.match(copy.en.title,/GOLDEN/i);
assert.match(copy.ar.title,/[\u0600-\u06ff]/);
assert.match(copy.fr.title,/RÉCOLTE/);
assert.match(copy.ar.tagline,/زيت السنة وصل/);
assert.doesNotMatch(copy.en.tagline,/[\u0600-\u06ff]/,"English presentation must not force an Arabic tagline");
assert.doesNotMatch(copy.fr.tagline,/[\u0600-\u06ff]/,"French presentation must not force an Arabic tagline");
assert.equal(copy.en.localeDisplay,"ENGLISH");
assert.equal(copy.ar.localeDisplay,"العربية");
assert.equal(copy.fr.localeDisplay,"FRANÇAIS");
assert.match(js,/function language\(\)\{var s=document\.documentElement\.lang/,"Campaign must follow chosen page language");
assert.match(js,/function sectionLocale\(\)/,"Campaign must carry semantic lang/dir tags");
assert.match(js,/gh-locale-indicator/,"Selected language must be visible");
assert.match(js,/gh-season-line/,"Tagline must follow active locale");
assert.doesNotMatch(js,/gh-ar-line/,"No hardcoded Arabic-only line across all language modes");
assert.match(js,/card\.lang=language\(\);card\.dir=dir\(\)/,"Shop teaser language/direction not synced");
assert.match(js,/esc\(c\.heroFooter\)/,"Hero caption must be translated");
assert.match(js,/esc\(c\.shopImageAlt\)/,"Shop image accessible label must be translated");
assert.match(css,/gh-locale-indicator/);
assert.match(css,/html\[lang="ar"\] \.zwm-gh h1/,"Arabic display heading needs adequate leading");
console.log("Seasonal locale checks passed: EN / AR / FR are complete and matched to the active storefront language.");

console.log("Golden Harvest 2026 standalone gate passed: five authentic media files, three capacities, EN/AR/FR, gated launch, script syntax, preserved storefront load order.");
