"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {JSDOM}=require("jsdom");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const campaign=read("public/golden-harvest-2026.js");
const catalogue=read("public/products-data.js");
const catalogueContext={window:{}};
const oil=require("node:vm").runInNewContext(catalogue+"; PRODUCTS_DATA.find(p=>p.id==='extra-virgin-olive-oil')",catalogueContext);
assert.ok(oil,"Real olive oil catalogue product missing");
const photos={window:{}};
require("node:vm").runInNewContext(read("public/product-photos.js"),photos);
const map=photos.window.ZWM_PRODUCT_PHOTOS.sourceFor;
const sizes=[
  ["extra-virgin-olive-oil-500-ml","500 ml",6,"500ml.avif"],
  ["extra-virgin-olive-oil-1-l","1 L",12,"1l.webp"],
  ["extra-virgin-olive-oil-4-l","4 L",40,"4l.webp"],
  ["extra-virgin-olive-oil-8-77-l","8.77 L",85,"8-77l.webp"],
  ["extra-virgin-olive-oil-17-54-l","17.54 L",169,"17-54l.webp"]
];
for(const [id,label,price,file] of sizes){
  const v=oil.variants.find(x=>x.id===id);
  assert.ok(v,"Missing catalogue variant "+id);
  assert.equal(Number(v.price),price,"Incorrect catalogue price for "+label);
  const photo=map(oil.id,id);
  assert.ok(photo&&photo.url.includes("/assets/harvest-2026/"+file),"Wrong image for "+label);
  assert.equal(photo.fit,"contain","Never crop "+label);
  const disk=path.join(root,"public/assets/harvest-2026",file);
  assert.ok(fs.statSync(disk).size>5000,"Missing or empty photo "+file);
}
for(const file of ["harvest-film.mp4","hero-poster.jpg"])assert.ok(fs.statSync(path.join(root,"public/assets/harvest-2026",file)).size>6000);
assert.match(campaign,/var ENABLED=true;/,"Live release must enable popup without private preview flags");
const home=read("public/index.html"),shop=read("public/shop.html"),app=read("public/app.js"),checkout=read("public/checkout.js");
assert.ok(home.indexOf('id="ghPicksStage"')>=0&&home.indexOf('id="ghPicksStage"')<home.indexOf('id="featured"'),"Harvest must be before Pantry Favourites");
assert.ok(home.includes('class="page-intro page-intro-shop home-pantry-hero"'),"Existing homepage hero must remain");
assert.match(home,/golden-harvest-2026\.js\?v=20261009-live1/);
assert.match(shop,/golden-harvest-2026\.js\?v=20261009-live1/);
assert.match(app,/window\.ZWM_HARVEST_CART=\{/,"Existing cart bridge required");
assert.match(app,/productVisualMarkup\(p,"product-modal-image",v\.id\)/,"Selected quick-view photo required");
assert.match(checkout,/productPhoto\(r\.p,r\.v\.id\)/,"Selected checkout photo required");
function page(locale="en",isShop=false){
  const html='<html lang="'+locale+'" dir="'+(locale==="ar"?"rtl":"ltr")+'"><body data-page="'+(isShop?"shop":"home")+'"><div id="languageWelcome" hidden></div><div class="announcement"><span id="announcementText"></span><a id="announcementOrder"></a></div><main><div class="home-pantry-hero">Original homepage hero</div>'+(isShop?'<section class="seasonal-story"><div class="seasonal-story-card"></div></section>':'<section id="featured">Original Pantry Favourites</section>')+'</main></body></html>';
  const dom=new JSDOM(html,{url:"https://example.com/",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window;
  w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
  w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};
  w.HTMLMediaElement.prototype.pause=function(){};
  w.HTMLElement.prototype.scrollIntoView=function(){this.dataset.scrolled="1"};
  w.PRODUCTS_DATA=[JSON.parse(JSON.stringify(oil))];
  const adds=[];
  w.ZWM_HARVEST_CART={
    offer(pid,vid){const v=w.PRODUCTS_DATA[0].variants.find(x=>x.id===vid);return v?{price:v.price,available:true}:null},
    add(pid,vid){adds.push(vid);return !!w.PRODUCTS_DATA[0].variants.find(v=>v.id===vid)}
  };
  w.eval(campaign);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded",{bubbles:true}));
  return {dom,w,adds};
}
const {dom,w,adds}=page();
const d=w.document;
assert.equal(d.querySelectorAll(".gh-pick-card").length,5,"Five products must appear without preview flag");
assert.ok(d.querySelector('.gh-pick-card[data-gh-size="4"] .gh-pick-price').textContent.includes("40"));
assert.equal(d.querySelector('.gh-pick-card[data-gh-size="4"] img').getAttribute("src").includes("4l.webp"),true);
assert.equal(d.querySelectorAll("button[data-gh-add]").length,5,"All five priced sizes must be orderable");
assert.equal(d.querySelector("#ghCampaignPopup").hidden,false,"Public first-visit popup must open");
d.querySelector('[data-gh-add="extra-virgin-olive-oil-4-l"]').click();
assert.deepEqual(adds,["extra-virgin-olive-oil-4-l"],"4L must use its distinct real variant in cart");
d.documentElement.lang="ar";
w.dispatchEvent(new w.Event("zwm:localechange"));
assert.equal(d.querySelector("#ghPicksTitle").textContent,"زيت السنة وصل");
assert.equal(d.getElementById("harvest-picks").dir,"rtl");
dom.window.close();
const shopPage=page("fr",true);
assert.ok(shopPage.w.document.querySelector(".gh-shop-spotlight"),"Live shop teaser missing");
assert.equal(shopPage.w.document.querySelector("#ghCampaignPopup"),null,"Popup should only appear on home");
shopPage.dom.window.close();
console.log("Golden Harvest 2026 live smoke PASSED: active EN/AR/FR campaign, five exact size/photo/price mappings, popup, cart 4L $40, home and shop.");
