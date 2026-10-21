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
  let html=read("shop.html").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"");
  const dom=new JSDOM(html,{url:"https://store.example/shop",runScripts:"outside-only",pretendToBeVisual:true});
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
    read("conversion-v1.js")
  ].join("\n;\n"));
  d.dispatchEvent(new w.Event("DOMContentLoaded",{bubbles:true}));
  return {dom,w,d,errors,observers};
}

(async()=>{
  for(const locale of ['en','ar','fr']){
    const {dom,w,d,errors,observers}=setup(390,locale);
    await wait(40);
    const card=d.querySelector('.product-card:has([data-card-variant])');
    assert(card,'A product with multiple sizes must be available');
    const id=card.dataset.product,select=card.querySelector('[data-card-variant]');
    const add=card.querySelector('[data-add]'),minus=card.querySelector('[data-card-q="-1"]'),plus=card.querySelector('[data-card-q="1"]'),qty=card.querySelector('[data-card-qty]');
    const saved=()=>JSON.parse(w.localStorage.getItem('zwm-cart-v5')||'{}');
    const selectedRow=()=>Object.values(saved()).find(r=>r.productId===id&&r.variantId===select.value);
    assert(qty.parentElement.hidden,'Empty cart shows the add button');
    add.click();assert.equal(selectedRow().qty,1);assert(add.hidden);assert(!qty.parentElement.hidden);
    plus.click();plus.click();assert.equal(selectedRow().qty,3);assert.equal(qty.textContent,'3');
    minus.click();assert.equal(selectedRow().qty,2);assert.equal(d.querySelector('#cartCount').textContent,'2');
    const firstVariant=select.value;
    select.selectedIndex=1;select.dispatchEvent(new w.Event('change',{bubbles:true}));
    assert(!add.hidden);assert(qty.parentElement.hidden,'Other size starts empty');
    await wait(330);add.click();assert.equal(selectedRow().qty,1);
    select.value=firstVariant;select.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(qty.textContent,'2');
    w.changeCartQty(w.cartKey(id,firstVariant),1);assert.equal(qty.textContent,'3','Cart drawer changes sync to card');
    w.renderProducts();
    const fresh=()=>d.querySelector(`[data-product="${id}"]`);
    assert.equal(fresh().querySelector('[data-card-qty]').textContent,'3','Rerender preserves saved quantity');
    for(let i=0;i<3;i++)fresh().querySelector('[data-card-q="-1"]').click();
    assert(!selectedRow(),'Minus at one removes only this size');
    assert.equal(Object.values(saved()).filter(r=>r.productId===id).length,1,'Other size stays in cart');
    assert(!fresh().querySelector('[data-add]').hidden);
    assert(!d.body.classList.contains('cart-open'),'Shopping controls do not open the cart');
    assert(!d.querySelector('#productModal').classList.contains('is-open'),'Shopping controls do not open Quick View');
    const p=w.productById(id),v=w.cardVariantFor(p);
    w.addToCart(p,v,99);assert(fresh().querySelector('[data-card-q="1"]').disabled);
    w.changeShoppingQty(p,v,1);assert.equal(selectedRow().qty,99,'Quantity is capped');
    const originalSet=w.Storage.prototype.setItem;
    w.Storage.prototype.setItem=function(){throw new Error('blocked')};
    assert.equal(w.changeShoppingQty(p,v,-1),false);assert.equal(fresh().querySelector('[data-card-qty]').textContent,'99','Failed saves do not change UI');
    w.Storage.prototype.setItem=originalSet;
    const featured=d.querySelector('[data-featured-add]');
    if(featured){
      const fp=w.productById(featured.dataset.featuredAdd),fv=w.defaultVariant(fp);
      w.removeCart(w.cartKey(fp.id,fv.id));await wait(330);featured.click();
      const stepper=featured.parentElement.querySelector('.shopping-qty');
      assert(!stepper.hidden);stepper.querySelector('[data-shopping-delta="1"]').click();assert.equal(stepper.querySelector('span').textContent,'2');
      stepper.querySelector('[data-shopping-delta="-1"]').click();stepper.querySelector('[data-shopping-delta="-1"]').click();assert(!featured.hidden);assert(stepper.hidden);
    }
    assert.equal(errors.length,0,errors.join(' | '));
    observers.forEach(observer=>observer.disconnect());
    await wait(0);dom.window.close();
  }
  console.log('Shopping quantities: direct changes, sizes, removal, limits, persistence failure and featured cards passed in EN/AR/FR.');
})().catch(e=>{console.error(e);process.exit(1)});
