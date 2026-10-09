"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {JSDOM}=require("jsdom");
const source=fs.readFileSync(path.join(__dirname,"../public/golden-harvest-2026.js"),"utf8");
const product={
 id:"extra-virgin-olive-oil",category:"Olive Oil",availability:"in_stock",
 variants:[
  {id:"extra-virgin-olive-oil-500-ml",sizeEn:"500 ml",price:6},
  {id:"extra-virgin-olive-oil-8-77-l",sizeEn:"8.77 L",price:85},
  {id:"extra-virgin-olive-oil-17-54-l",sizeEn:"17.54 L",price:169}
 ]
};
const pause=()=>new Promise(resolve=>setImmediate(resolve));
function makePage(locale="en",{showWelcome=false,forcePopup=false,shop=false,missingBridge=false}={}){
 const html='<!doctype html><html lang="'+locale+'" dir="'+(locale==="ar"?"rtl":"ltr")+'"><head></head>'+
  '<body data-page="'+(shop?"shop":"home")+'">'+
  '<div id="languageWelcome" '+(showWelcome?"":"hidden")+'></div>'+
  '<header class="site-header"><div class="announcement"><span id="announcementText"></span><a id="announcementOrder" href="/shop"></a></div></header>'+
  '<main><section class="home-pantry-hero" id="normalHero"><h1>Normal home hero stays</h1></section>'+
  (shop?'<section class="seasonal-story"><div class="seasonal-story-card"></div></section>':
   '<section id="featured"><h2>Pantry Favourites stays</h2></section>')+'</main></body></html>';
 const url="https://preview.example/"+(forcePopup?"?harvestPreview=1&harvestPopup=1":"?harvestPreview=1");
 const dom=new JSDOM(html,{url,runScripts:"outside-only",pretendToBeVisual:true});
 const w=dom.window;
 w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 w.HTMLMediaElement.prototype.play=function(){this.dataset.played="yes";return Promise.resolve()};
 w.HTMLMediaElement.prototype.pause=function(){this.dataset.paused="yes"};
 w.HTMLElement.prototype.scrollIntoView=function(){this.dataset.scrolled="yes"};
 w.PRODUCTS_DATA=JSON.parse(JSON.stringify([product]));
 const added=[];
 if(!missingBridge)w.ZWM_HARVEST_CART={
  offer(id,variant){
   const p=w.PRODUCTS_DATA.find(p=>p.id===id),v=p?.variants.find(v=>v.id===variant);
   return v?{price:v.price,available:p.availability==="in_stock"}:null;
  },
  add(id,variant){added.push({id,variant});return true}
 };
 if(showWelcome)w.document.body.classList.add("welcome-open");
 w.eval(source);
 w.document.dispatchEvent(new w.Event("DOMContentLoaded",{bubbles:true}));
 return {dom,w,added};
}
(async function(){
 const {dom,w,added}=makePage("en",{showWelcome:true});
 const d=w.document;
 assert.ok(d.getElementById("normalHero")&&!d.getElementById("normalHero").hidden,"Original hero must be visible");
 assert.equal(d.getElementById("normalHero").nextElementSibling.id,"ghPicksStage","Harvest picks immediately after normal hero");
 assert.equal(d.getElementById("ghPicksStage").nextElementSibling.id,"featured","Pantry Favourites remains after Seasonal Picks");
 assert.equal(d.querySelectorAll(".gh-pick-card").length,3,"Three promoted products");
 assert.deepEqual(Array.from(d.querySelectorAll(".gh-pick-capacity")).map(el=>el.textContent.trim()),["4 L","8.77 L","17.54 L"]);
 assert.equal(d.querySelectorAll(".gh-pick-badge").length,3);
 assert.equal(d.querySelector(".gh-pick-badge").textContent,"2026 HARVEST");
 assert.equal(d.querySelector("#ghPicksTitle").textContent,"Fresh From the Harvest");
 assert.equal(d.querySelectorAll("button[data-gh-add]").length,2,"Missing 4L variant must not be addable");
 assert.ok(d.querySelector('.gh-pick-card[data-gh-size="4"] .gh-pick-inquire'));
 assert.ok(!d.querySelector('.gh-pick-card[data-gh-size="4"] .gh-pick-price'));
 assert.ok(d.querySelector('.gh-pick-card[data-gh-size="8.77"] .gh-pick-price').textContent.includes("85"));
 assert.ok(d.querySelector('.gh-pick-card[data-gh-size="17.54"] .gh-pick-price').textContent.includes("169"));
 assert.equal(d.getElementById("ghCampaignPopup").hidden,true,"Initial language picker has priority");
 d.getElementById("languageWelcome").hidden=true;
 d.body.classList.remove("welcome-open");
 await pause();
 assert.equal(d.getElementById("ghCampaignPopup").hidden,false,"Cinematic popup opens after choosing language");
 assert.match(d.querySelector("#ghPopupTitle").textContent,/The 2026 Harvest/,"Popup title follows the reference launch headline");
 assert.ok(d.querySelector(".gh-picks-arrival"),"Seasonal collection must have a prominent red arrival badge");
 assert.equal(d.querySelector(".gh-picks-arrival").textContent.trim(),"JUST ARRIVED · 2026 HARVEST");
 assert.equal(d.querySelector(".gh-pick-badge").textContent.trim(),"2026 HARVEST");
 d.querySelector("[data-gh-discover]").click();
 assert.equal(d.getElementById("ghCampaignPopup").hidden,true,"Discover closes popup");
 assert.equal(d.getElementById("harvest-picks").dataset.scrolled,"yes","Discover navigates directly to three tins");
 assert.equal(w.localStorage.getItem("zwm-golden-harvest-2026-popup-seen-v1"),"1");
 d.querySelector('[data-gh-add="extra-virgin-olive-oil-8-77-l"]').click();
 d.querySelector('[data-gh-add="extra-virgin-olive-oil-17-54-l"]').click();
 assert.deepEqual(added.map(x=>x.variant),["extra-virgin-olive-oil-8-77-l","extra-virgin-olive-oil-17-54-l"],"Buttons use real variant IDs");
 w.PRODUCTS_DATA[0].variants[1].price=87.5;
 w.dispatchEvent(new w.Event("zwm:catalog-cache-updated"));
 assert.ok(d.querySelector('.gh-pick-card[data-gh-size="8.77"] .gh-pick-price').textContent.includes("87.50"),"Current catalogue price updates");
 d.documentElement.lang="fr";d.documentElement.dir="ltr";await pause();
 assert.equal(d.querySelector("#ghPicksTitle").textContent,"La récolte 2026 est arrivée");
 assert.equal(d.querySelector(".gh-pick-badge").textContent,"RÉCOLTE 2026");
 assert.equal(d.querySelector(".gh-picks-arrival").textContent.trim(),"NOUVEAU · RÉCOLTE 2026");
 dom.window.close();

 const second=makePage("ar");
 assert.equal(second.w.document.querySelector("#ghPicksTitle").textContent,"زيت السنة وصل");
 assert.equal(second.w.document.querySelector(".gh-pick-badge").textContent,"موسم ٢٠٢٦");
 assert.equal(second.w.document.querySelector(".gh-picks-arrival").textContent.trim(),"وصل جديد · موسم ٢٠٢٦");
 assert.equal(second.w.document.querySelector(".gh-picks-intro>p").textContent,"زيت زيتون بكر ممتاز معصور على البارد، من موسم الزيتون ٢٠٢٦.");
 assert.match(second.w.document.querySelector("#ghPopupDescription").textContent,/معصور على البارد/);
 assert.equal(second.w.document.querySelector("#harvest-picks").dir,"rtl");
 assert.equal(second.w.document.getElementById("ghCampaignPopup").hidden,false);
 second.w.document.querySelector('[data-gh-close="continue"]').click();
 assert.equal(second.w.document.getElementById("ghCampaignPopup").hidden,true);
 assert.equal(second.w.document.getElementById("harvest-picks").dataset.scrolled,undefined,"Continue leaves visitor at normal homepage");
 second.dom.window.close();

 const shop=makePage("fr",{shop:true});
 assert.equal(shop.w.document.querySelector(".gh-shop-spotlight h2").textContent,"La récolte 2026 est arrivée");
 assert.ok(shop.w.document.querySelector(".gh-shop-cta").getAttribute("href").includes("#harvest-picks"));
 assert.equal(shop.w.document.getElementById("ghCampaignPopup"),null,"No first-visit popup on shop route");
 shop.dom.window.close();
 const cached=makePage("en",{missingBridge:true});
 assert.equal(cached.w.document.querySelector('.gh-pick-card[data-gh-size="8.77"] .gh-pick-price').textContent.includes("85"),true,"Keep verified catalogue price visible while old cart API is missing");
 assert.equal(cached.w.document.querySelectorAll("[data-gh-add]").length,0,"Never allow ordering until validated cart bridge is available");
 cached.dom.window.close();
 console.log("Golden Harvest experience passed: original hero/order, welcome→film→collection, continue dismissal, EN/AR/FR, exact variant cart actions, live price refresh, shop navigation.");
})().catch(e=>{console.error(e);process.exitCode=1});
