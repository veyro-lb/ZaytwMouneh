const {JSDOM}=require("jsdom");
const fs=require("node:fs");
const assert=require("node:assert/strict");
const read=p=>fs.readFileSync("public/"+p,"utf8");
const wait=ms=>new Promise(r=>setTimeout(r,ms));

function mediaMatches(query,width){
  const max=query.match(/max-width:\s*(\d+)px/); if(max&&width>+max[1])return false;
  const min=query.match(/min-width:\s*(\d+)px/); if(min&&width<+min[1])return false;
  return true;
}
function setup(width,locale){
  let html=read("index.html").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"");
  const dom=new JSDOM(html,{url:"https://store.example/",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window,d=w.document;
  const observers=[];const NativeObserver=w.MutationObserver;
  w.MutationObserver=class extends NativeObserver {constructor(callback){super(callback);observers.push(this)}};
  Object.defineProperty(w,"innerWidth",{configurable:true,value:width});
  Object.defineProperty(w,"innerHeight",{configurable:true,value:800});
  w.requestAnimationFrame=fn=>w.setTimeout(()=>fn(Date.now()),0);
  w.cancelAnimationFrame=id=>w.clearTimeout(id);
  w.matchMedia=q=>({matches:mediaMatches(q,width),media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
  w.IntersectionObserver=class{constructor(cb){this.cb=cb}observe(el){this.cb([{target:el,isIntersecting:true}],this)}unobserve(){}disconnect(){}};
  w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
  w.HTMLElement.prototype.scrollIntoView=function(){};
  if(w.HTMLMediaElement){w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){}}
  if(!w.CSS)w.CSS={}; if(!w.CSS.escape)w.CSS.escape=s=>String(s).replace(/[^a-zA-Z0-9_-]/g,"\\$&");
  w.fetch=async()=>({ok:true,status:200,json:async()=>[],text:async()=>""});
  w.navigator.share=undefined;
  w.navigator.clipboard={writeText:async()=>{}};
  if(locale==="ar"){w.localStorage.setItem("zwm-lang-v2","ar");w.localStorage.setItem("zwm-locale-v3","ar")}
  else if(locale==="fr"){w.localStorage.setItem("zwm-lang-v2","en");w.localStorage.setItem("zwm:french:v1","1");w.localStorage.setItem("zwm-locale-v3","fr")}
  else{w.localStorage.setItem("zwm-lang-v2","en");w.localStorage.setItem("zwm-locale-v3","en")}
  const errors=[];w.console.error=(...a)=>errors.push(a.map(String).join(" "));
  w.eval([
    read("products-data.js"),
    read("product-photos.js"),
    read("product-search-v1.js"),
    read("app.js"),
    read("fr-runtime-v1.js"),
    read("conversion-v1.js"),
    read("instant-shop-v1.js")
  ].join("\n;\n"));
  d.dispatchEvent(new w.Event("DOMContentLoaded",{bubbles:true}));
  return {dom,w,d,errors,observers};
}

(async()=>{
 for(const locale of ['en','ar','fr']){
  const {dom,w,d,errors,observers}=setup(390,locale);
  await wait(50);
  const card=d.querySelector('[data-iq-product="extra-virgin-olive-oil"]');assert(card);
  const select=card.querySelector('[data-iq-select]');
  const qty=()=>card.querySelector('[data-iq-quantity]').textContent;
  const saved=()=>Object.values(JSON.parse(w.localStorage.getItem('zwm-cart-v5')||'{}'));
  card.querySelector('[data-iq-add]').click();
  assert.equal(qty(),'1');assert.equal(saved()[0].qty,1);
  card.querySelector('[data-iq-delta="1"]').click();assert.equal(qty(),'2');
  assert.equal(d.querySelector('#cartCount').textContent,'2');
  assert.equal(d.querySelector('[data-iq-cart-count]').textContent,'2');
  const first=select.value;
  select.selectedIndex=1;select.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert(!card.querySelector('[data-iq-add]').hidden);
  card.querySelector('[data-iq-add]').click();assert.equal(saved().length,2);
  card.querySelector('[data-iq-view]').click();
  assert(d.querySelector('#productModal').classList.contains('is-open'));
  assert.equal(d.querySelector('[data-modal-variant].is-active').dataset.modalVariant,select.value);
  w.closeProduct();
  select.value=first;select.dispatchEvent(new w.Event('change',{bubbles:true}));
  w.changeCartQty(w.cartKey(card.dataset.iqProduct,first),1);assert.equal(qty(),'3');
  for(let i=0;i<3;i++)card.querySelector('[data-iq-delta="-1"]').click();
  assert.equal(saved().length,1);assert(!card.querySelector('[data-iq-add]').hidden);
  d.querySelector('[data-iq-review]').click();assert(d.body.classList.contains('cart-open'));
  assert.equal(d.querySelector('[data-iq-checkout]').getAttribute('href'),'/checkout');
  assert(!d.querySelector('[data-iq-checkout]').hidden);
  assert.deepEqual(errors,[]);
  observers.forEach(o=>o.disconnect());dom.window.close();
 }
 console.log('Homepage native-cart integration passed: EN/AR/FR, per-size quantities, modal size, drawer sync and checkout.');
})().catch(error=>{console.error(error);process.exitCode=1});
