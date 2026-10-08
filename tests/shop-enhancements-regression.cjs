"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {JSDOM}=require("jsdom");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const js=read("public/shop-extras-v1.js");
const app=read("public/app.js");
const shop=read("public/shop.html");
const checkout=read("public/checkout.js");
const checkoutHtml=read("public/checkout.html");
const order=read("public/order.js");
const orderHtml=read("public/order.html");
const gift=read("public/gift.html");

assert(shop.includes('id="zwmPriceCeiling"')&&shop.includes("shop-extras-v1.js"),"Shop must mount budget control and its script");
assert(app.includes("&&budgetOk&&"),"Budget must participate in catalogue filtering before pagination");
assert(!app.includes('data-product="${escapeHtml(p.id)}" tabindex="0" role="button"'),"Cards must not nest interactive controls in a button role");
assert(app.includes('aria-label="${escapeHtml(t.view+" "+currentName(p))}"'),"Product view buttons must be labelled");

async function main(){
  const dom=new JSDOM(`<!doctype html><html lang="en"><body data-page="shop">
    <div class="zwm-budget-filter"><label id="zwmPriceLabel" for="zwmPriceCeiling"></label>
    <small id="zwmPriceHint"></small><input id="zwmPriceCeiling" type="range" min="0" max="100" step="1" value="100">
    <output id="zwmPriceValue"></output><button id="zwmPriceReset" type="button"></button></div>
    <button id="clearSearch"></button>
    <section id="productModal"><div class="product-modal-visual"><div id="productModalMark"></div></div>
    <h2 id="productModalTitle">Olive Oil</h2></section></body></html>`,{
      url:"https://example.test/shop?category=Oils&maxPrice=5#shop",
      runScripts:"outside-only",pretendToBeVisual:true
    });
  const w=dom.window;
  let renders=0;
  w.renderProducts=()=>{renders++};
  w.eval('var PRODUCTS_DATA = '+JSON.stringify([
    {id:"a",variants:[{price:3},{price:18}]},
    {id:"b",variants:[{price:10}]},
    {id:"c",variants:[{price:21}]}
  ])+";");
  w.eval(js);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  const allowed=w.ZWM_CATALOGUE_ENHANCEMENTS.allowsPrice;
  assert.equal(allowed({variants:[{price:3},{price:18}]}),true,"Cheapest available pack should qualify");
  assert.equal(allowed({variants:[{price:10}]}),false,"Expensive products should be excluded");
  assert.equal(w.document.getElementById("zwmPriceCeiling").max,"21");
  assert.equal(w.document.getElementById("zwmPriceValue").textContent,"Up to $5");
  assert(renders>0,"Initial filtered catalogue must render");
  const control=w.document.getElementById("zwmPriceCeiling");
  control.value="2";control.dispatchEvent(new w.Event("change",{bubbles:true}));
  assert.equal(allowed({variants:[{price:3}]}),false,"Slider changes must update predicate");
  assert.equal(new URL(w.location.href).searchParams.get("maxPrice"),"2");
  w.document.getElementById("zwmPriceReset").click();
  assert.equal(allowed({variants:[{price:500}]}),true,"Clearing budget must show all prices");
  assert.equal(new URL(w.location.href).searchParams.has("maxPrice"),false);
  assert.equal(new URL(w.location.href).searchParams.get("category"),"Oils","Other filters must be preserved");
  const mark=w.document.getElementById("productModalMark");
  mark.innerHTML='<img src="/assets/products/originals/olive-oil.jpg" alt="Olive Oil">';
  await new Promise(resolve=>w.setTimeout(resolve,0));
  const zoom=w.document.getElementById("zwmProductZoom");
  assert(zoom&&!zoom.hidden,"Enlarge button must appear for products with photos");
  const viewer=w.document.getElementById("zwmProductLightbox");
  viewer.showModal=function(){this.open=true};
  viewer.close=function(){this.open=false;this.dispatchEvent(new w.Event("close"))};
  zoom.click();
  assert(viewer.open,"Lightbox should open");
  assert(viewer.querySelector("img").src.endsWith("/assets/products/originals/olive-oil.jpg"),"Lightbox should use verified source photo");
  w.document.dispatchEvent(new w.KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));
  assert(!viewer.open,"Escape must close the enlarged image before the product quick view");
  mark.innerHTML="";
  await new Promise(resolve=>w.setTimeout(resolve,0));
  assert(zoom.hidden,"Zoom should be unavailable without a source image");

  // Static journey invariants: no submission is sent to production from regression tests.
  assert(checkoutHtml.includes('id="savedAddressSelect"')&&checkout.includes('rpc("mouneh_addresses",{action:"list"'),"Saved addresses must be populated through the authorized RPC");
  assert(checkout.includes('addEventListener("submit",submit)'),"Checkout must wire form submission");
  assert(checkout.includes('loadOverrides()')&&checkout.includes('state.catalogVerified'),"Checkout must check catalogue prices and availability");
  assert(orderHtml.includes('id="orderTimeline"')&&order.includes('rpc("detail",{reference:state.ref,claim_token:state.claim})'),"Tracking requires order ref and session/guest claim");
  assert(order.includes('claimFor(state.ref)')&&order.includes('claim_token'),"Guest order claims must remain required");
  assert(gift.includes('id="giftPreviewMessage"'),"Gift message preview must remain wired");
  console.log("PASS: price filtering, URL preservation, accessible zoom, and checkout/order/gift static journey invariants");
  dom.window.close();
}
main().catch(err=>{console.error(err);process.exitCode=1});
