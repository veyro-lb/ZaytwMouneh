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
assert.match(js,/var ENABLED=false/,"Campaign must stay off until explicit launch approval");
assert.match(js,/harvestPreview/,"Private preview query required");
assert.match(js,/harvestPopup/,"Explicit popup QA override required");
assert.match(js,/zwm-golden-harvest-2026-popup-seen-v1/,"Persist first-visit dismissal");
assert.match(js,/languageWelcome/,"Do not hide or replace existing language welcome");
assert.match(js,/startPopupAfterLanguageWelcome/,"Campaign popup must wait for language selection");
assert.match(js,/var POPUP_KEY=/);
assert.match(js,/id="ghCampaignPopup"|popup\.id="ghCampaignPopup"/);
assert.match(js,/id="harvest-picks"/,"Campaign must have a scroll destination");
assert.match(js,/insertBefore\(stage,anchor\)/,"Seasonal collection must immediately precede Pantry Favourites");
assert.match(js,/querySelector\("body\[data-page='home'\] #featured"\)/,"Home placement should use existing first collection");
assert.doesNotMatch(js,/old\.inert=true|inactiveShopHeroVideo|old\.setAttribute\("aria-hidden"/,"Normal homepage hero must remain visible");
assert.match(js,/popupContinue/);
assert.match(js,/popupDiscover/);
assert.match(js,/closePopup\(true\)/,"Popup CTA must dismiss and reveal collection");
assert.match(js,/closePopup\(false\)/,"Continue to Website must dismiss without scrolling");
assert.match(js,/scrollIntoView/);
assert.match(js,/gh-pick-badge/);
assert.match(js,/data-gh-add/);
assert.match(js,/window\.ZWM_HARVEST_CART/,"Must use existing cart API bridge");
assert.doesNotMatch(js,/cartKey\(|zwm-cart-v5|localStorage\.setItem\(.+cart/i,"No direct cart storage mutation from campaign");
assert.match(js,/function variantFor\(size\)/);
assert.match(js,/v\.id===size\.id/,"Do not mistake 500ml for missing 4L tin");
assert.match(js,/Number\.isFinite\(Number\(v.price\)\)/,"No invented price");
assert.match(js,/PRODUCTS_DATA/,"Use actual current catalogue");
assert.match(js,/window\.addEventListener\("zwm:catalog-cache-updated"/,"Re-render after owner catalogue refresh");
assert.match(js,/visibilitychange/);
assert.match(js,/IntersectionObserver/);
assert.match(js,/prefers-reduced-motion/);
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,"CSS braces");
assert.match(css,/object-fit:contain/,"Full product photos must remain visible");
assert.match(css,/@media\(max-width:680px\)/,"Mobile must have one-column layout");
assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,"Desktop must show all tins side by side");
assert.match(css,/#a53d35/,"Badge must be a tasteful harvest red");
assert.match(css,/gh-popup/);
assert.match(css,/gh-picks/);
assert.match(css,/html\[dir="rtl"\]/);
assert.match(css,/prefers-reduced-motion/);
assert.doesNotMatch(css,/body\.zwm-harvest-active\[data-page="home"\] \.home-pantry-hero\s*{display:none/i,"Never hide normal homepage hero");
for(const [size,id,file] of [
 ["4","extra-virgin-olive-oil-4-l","4l.webp"],
 ["8.77","extra-virgin-olive-oil-8-77-l","8-77l.webp"],
 ["17.54","extra-virgin-olive-oil-17-54-l","17-54l.webp"]
])assert.ok(js.includes('size:"'+size+'",id:"'+id+'",file:"'+file+'"'),"Incorrect tin size or variant "+size);
for(const page of ["index","shop"]){
  const html=read("public/"+page+".html");
  const styles=[...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)];
  assert.ok(styles.at(-1)?.[0].includes("storefront-shell.css"),page+" shell stylesheet must load last");
  assert.equal((html.match(/golden-harvest-2026\.css/g)||[]).length,1,page+" exactly one campaign CSS");
  assert.equal((html.match(/golden-harvest-2026\.js/g)||[]).length,1,page+" exactly one campaign JS");
  assert.ok(html.indexOf("products-data.js")<html.indexOf("golden-harvest-2026.js"),page+" campaign must load after catalogue");
  assert.ok(html.indexOf("app.js")<html.indexOf("golden-harvest-2026.js"),page+" campaign must load after app");
}
const home=read("public/index.html");
assert.ok(home.includes('<section class="page-intro page-intro-shop home-pantry-hero"'),"Existing homepage hero must be untouched");
assert.ok(home.includes('id="featured"'),"Pantry Favourites must remain");
assert.ok(home.includes('id="languageWelcome"'),"Existing welcome language modal must remain");
assert.ok(home.includes('id="productModal"'),"Existing Quick View must remain");
const app=read("public/app.js");
assert.match(app,/window\.ZWM_HARVEST_CART=\{/,"Safe existing cart bridge must be registered");
assert.match(app,/productCanOrder\(p\)/,"Bridge respects current availability");
assert.match(app,/addToCart\(p,v,\(cart\[key\]\?\.qty\|\|0\)\+1\)/,"Bridge uses original cart code and increments quantity");
assert.match(app,/find\(row=>row\.id===variantId\)/,"No wrong-size fallback");
assert.doesNotMatch(app.slice(app.indexOf("window.ZWM_HARVEST_CART={"),app.indexOf("window.ZWM_HARVEST_CART={")+900),/localStorage\.setItem/,"No direct cart state writes in bridge");

// Verify all selected-language copies and announced badge text are complete.
const vm=require("node:vm");
const begin=js.indexOf("  var COPY={");
const finish=js.indexOf(";\n  function language()",begin);
assert.ok(begin>=0&&finish>begin,"Translated campaign copy must exist");
const COPY=vm.runInNewContext("(function(){"+js.slice(begin,finish)+";return COPY;})()");
const KEYS=["kicker","title","description","badge","smallBadge","price","add","inquire","unavailable","viewAll","notes",
 "imageAlt","popupKicker","popupTitle","popupSubtitle","popupDescription","popupDiscover","popupContinue","popupClose",
 "popupFilm","announcement","announcementLink","shopTitle","shopText","shopCta","shopAll"];
for(const l of ["en","ar","fr"]){
 assert.ok(COPY[l],"Missing campaign translation "+l);
 for(const key of KEYS)assert.ok(typeof COPY[l][key]==="string"&&COPY[l][key].trim(),"Missing "+l+"."+key);
}
assert.equal(COPY.en.kicker,"SEASONAL PICKS · HARVEST 2026");
assert.equal(COPY.en.title,"Fresh From the Harvest");
assert.equal(COPY.en.description,"Discover our freshly harvested 2026 Lebanese olive oil.");
assert.equal(COPY.en.badge,"JUST ARRIVED · 2026 HARVEST");
assert.equal(COPY.ar.badge,"وصل جديد · حصاد ٢٠٢٦");
assert.equal(COPY.fr.badge,"NOUVEAU · RÉCOLTE 2026");
assert.equal(COPY.ar.title,"زيت السنة وصل");
assert.equal(COPY.fr.title,"La récolte 2026 est arrivée");
assert.equal(COPY.en.popupDiscover,"Discover the Harvest");
assert.equal(COPY.en.popupContinue,"Continue to Website");
assert.match(js,/function language\(\)\{var l=document\.documentElement\.lang/);
assert.match(js,/lang="'+"\'+language\(\)/,"Seasonal section follows chosen language");
assert.match(js,/dir="'+"\'+dir\(\)/,"Seasonal section follows RTL");
console.log("Golden Harvest 2026 campaign gate passed: five genuine media files, normal hero preserved, popup and first collection, 3 sizes, safe existing cart bridge, complete EN/AR/FR.");
