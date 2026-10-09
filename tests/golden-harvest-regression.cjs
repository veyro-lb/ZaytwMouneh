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
assert.match(js,/price:linked&&Number\.isFinite/,"Catalogue price must remain visible even when client still has an old app bridge cached");
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
assert.match(css,/\.gh-popup-panel\{[^}]*width:min\(940px,/,"Desktop popup must be a wide 940px cinematic viewport");
assert.match(js,/popupTitle:"2026<br><em>The Golden Harvest<\/em>"/,"2026 must be the prominent English title");
assert.match(js,/popupTitle:"٢٠٢٦<br><em>زيت السنة وصل<\/em>"/,"Arabic must feature a large ٢٠٢٦ title");
assert.match(css,/\.gh-popup-video\{[^}]*object-fit:cover/,"Video must fill cinematic frame");
assert.match(css,/\.gh-popup-shade\{[^}]*linear-gradient\(90deg/,"Soft horizontal gradient preserves visible harvest film");
assert.match(css,/\.gh-popup-continue\{[^}]*background:transparent/,"Continue must be visually secondary");
assert.match(css,/\.gh-popup-discover\{[^}]*background:#a53d35/,"Popup CTA must be harvest red");
assert.match(css,/\.gh-picks-arrival\{[^}]*background:#a53d35/,"Section must have a prominent harvest red new-arrival badge");
assert.match(js,/gh-picks-arrival/,"Section heading must render the red badge");
assert.match(css,/\.gh-popup-panel\{width:min\(100%,510px\)/,"Small screens should still show a floating popup");
assert.match(css,/gh-popup/);
assert.match(css,/gh-picks/);
assert.match(css,/html\[dir="rtl"\]/);
assert.match(css,/prefers-reduced-motion/);
// Mobile layout guard: ensure narrow-phone badges cannot overlay tins, 44px
// touch targets stay reachable and short landscape/portrait screens scroll safely.
assert.match(css,/\/\* Mobile overflow protection \(Golden Harvest\) \*\//,"Mobile layout rules must be present");
assert.match(css,/@media\(max-width:680px\) and \(max-height:680px\)/,"Short portrait phones must have compact spacing");
assert.match(css,/@media\(max-height:550px\) and \(min-width:681px\)/,"Landscape and short desktop screens must be scrollable");
assert.match(css,/\.gh-pick-badge\{position:relative;top:auto;left:auto;/,"Mobile badges must stay in card flow, not overlay photographs");
assert.match(css,/\.gh-pick-figure\{height:clamp\(272px,88vw,420px\);width:100%;max-width:100%;padding:12px 12px 0\}/,"Mobile product photos need separate space from badges");
assert.match(css,/\.gh-popup-panel\{width:100%;max-width:510px;height:auto;min-height:0;max-height:calc\(100dvh - 20px\);overflow-x:hidden;overflow-y:auto;/,"Popup must scroll within phone viewport");
assert.match(css,/\.gh-popup-dismiss\{inset-inline-end:12px;top:12px;width:44px;height:44px/,"Mobile dismissal control must have an accessible tap target");
assert.match(css,/\.gh-popup-discover\{width:100%;min-width:0;min-height:50px/,"Primary CTA must stay readable and finger-friendly");
assert.match(css,/html\[lang="ar"\] \.gh-popup-content h2\{font-size:clamp\(1\.95rem,8\.4vw,3\.25rem\);line-height:1\.32/,"Arabic headline needs mobile wrapping and generous leading");
assert.match(css,/html\[lang="fr"\] \.gh-popup-content h2/,"French title must fit narrow phones");
assert.match(css,/\.gh-pick-figure img\{max-width:100%!important;max-height:100%;object-fit:contain\}/,"Product pictures must never be cropped on mobile");

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
  assert.match(html,/app\.js\?v=20261009-contact2/,"Use fresh asset version so the correct support number and validated cart API are served");
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
 "imageAlt","popupKicker","popupTitle","popupDescription","popupDiscover","popupContinue","popupClose",
 "popupFilm","announcement","announcementLink","shopTitle","shopText","shopCta","shopAll"];
for(const l of ["en","ar","fr"]){
 assert.ok(COPY[l],"Missing campaign translation "+l);
 for(const key of KEYS)assert.ok(typeof COPY[l][key]==="string"&&COPY[l][key].trim(),"Missing "+l+"."+key);
}
assert.equal(COPY.en.kicker,"SEASONAL PICKS · HARVEST 2026");
assert.equal(COPY.en.title,"Fresh From the Harvest");
assert.equal(COPY.en.description,"Discover our 2026 Lebanese cold-pressed extra virgin olive oil.");
assert.equal(COPY.en.badge,"JUST ARRIVED · 2026 HARVEST");
assert.equal(COPY.ar.badge,"وصل جديد · موسم الزيتون ٢٠٢٦");
assert.equal(COPY.fr.badge,"NOUVEAU · RÉCOLTE 2026");
assert.equal(COPY.ar.title,"زيت السنة وصل");
assert.equal(COPY.ar.description,"زيت زيتون بكر ممتاز معصور على البارد.");
assert.ok(!Object.values(COPY.ar).some(v=>/حصاد/.test(v)),"Do not use حصاد in Arabic campaign; use موسم الزيتون");
assert.match(COPY.ar.popupDescription,/زيت زيتون بكر ممتاز معصور على البارد/);
assert.match(COPY.fr.description,/vierge extra libanaise, pressée à froid/);
assert.equal(COPY.fr.title,"La récolte 2026 est arrivée");
assert.equal(COPY.en.popupDiscover,"Discover the Harvest");
assert.equal(COPY.en.popupContinue,"Continue to Website");
assert.ok(!("popupSubtitle" in COPY.ar)&&!("popupSubtitle" in COPY.en)&&!("popupSubtitle" in COPY.fr),"The title should not be repeated as a popup subtitle");
assert.doesNotMatch(js,/gh-popup-subtitle|gh-popup-film-label/,"No redundant subtitle or film badge should be rendered");
assert.equal(COPY.ar.popupTitle.replace(/<[^>]*>/g,""),"٢٠٢٦زيت السنة وصل");
assert.equal(COPY.ar.popupKicker,"زيت ومونة");
assert.ok(!COPY.ar.popupDescription.includes("موسم الزيتون ٢٠٢٦"),"Season year belongs only to the popup overline");
assert.equal(COPY.ar.popupDescription,"زيت زيتون بكر ممتاز معصور على البارد.");
assert.equal(COPY.ar.popupDiscover,"اكتشفوا صفائح الزيت");
assert.equal(COPY.en.popupTitle.replace(/<[^>]*>/g,""),"2026The Golden Harvest");
assert.ok(!COPY.en.popupKicker.includes("2026")&&!COPY.en.popupDescription.includes("2026"),"English popup should only state year in its title");
assert.ok(!COPY.fr.popupKicker.includes("2026")&&!COPY.fr.popupDescription.includes("2026"),"French popup should only state year in its title");
assert.equal(COPY.fr.kicker,"SÉLECTIONS DE SAISON");

assert.match(js,/function language\(\)\{var l=document\.documentElement\.lang/);
assert.ok(js.includes("lang=\"\'+language()+\'\""),"Seasonal section follows chosen language");
assert.ok(js.includes("dir=\"\'+dir()+\'\""),"Seasonal section follows RTL");
// Check every public-facing preview route and shared shopping script for the
// previously incorrect business number, including structured data and WhatsApp links.
const checkedPhoneFiles=[
 "index.html","shop.html","contact.html","about.html","gift.html","recipes.html",
 "account.html","wholesale.html","checkout.html","returns.html","product.html",
 "privacy.html","terms.html","privacy-policy.html","privacy-and-data.html",
 "terms-of-service.html","terms-and-rewards.html","returns-policy.html",
 "admin.html","order.js","app.js","premium-v2.js","admin.js","checkout.js","conversion-v1.js"
];
for(const name of checkedPhoneFiles){
 const body=read("public/"+name);
 assert.doesNotMatch(body,/96181581230|81\s+581\s+230/,"Old phone must not appear in "+name);
}
for(const name of ["index.html","shop.html","contact.html","about.html"]){
 const html=read("public/"+name);
 assert.match(html,/tel:\+96170381412/,"Correct callable phone link needed on "+name);
 assert.match(html,/https:\/\/wa\.me\/96170381412/,"Correct WhatsApp link needed on "+name);
 assert.match(html,/\+961 70 381 412/,"Correct visible phone text needed on "+name);
}
console.log("Golden Harvest 2026 campaign gate passed: five genuine media files, normal hero preserved, popup and first collection, 3 sizes, safe existing cart bridge, complete EN/AR/FR.");
