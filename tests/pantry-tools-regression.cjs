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
function setup(width,locale,page){
  let html=read(page+".html").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"");
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
    read("instant-shop-v1.js"),
    read("pantry-tools-v1.js")
  ].join("\n;\n"));
  d.dispatchEvent(new w.Event("DOMContentLoaded",{bubbles:true}));
  return {dom,w,d,errors,observers};
}

(async()=>{
 for(const page of ['index','shop'])for(const locale of ['en','ar','fr']){
  const {dom,w,d,errors,observers}=setup(390,locale,page);
  try{
   await wait(70);const api=w.ZWM_INSTANT_SHOP,host=d.querySelector('.pantry-tools');assert(host,page+' tools rendered');
   const total=()=>Math.round(Number(host.querySelector('[data-pt-total]').textContent.split('$').pop())*100);
   for(const budget of [15,25,50]){
    host.querySelector('[data-pt-budget="'+budget+'"]').click();
    assert(total()>0&&total()<=budget*100,'selection respects strict budget');
    assert(host.querySelector('[data-pt-items] li').textContent.length>0);
   }
   const original=total();host.querySelector('[data-pt-remove]').click();assert(total()<original,'preview can be edited');
   const items=api.products(),p=items.find(x=>x.id==='semaq'),v=p.variants[0];api.add(p.id,v.id);
   const before=api.cart().count;
   host.querySelector('[data-pt-add]').click();assert(api.cart().count>before,'budget adds to existing cart');
   const after=api.cart().count;host.querySelector('[data-pt-add]').click();assert.equal(api.cart().count,after,'accidental double-tap does not duplicate selection');
   const saved=()=>w.localStorage.getItem('zwm-cart-v5'),snapshot=saved();
   assert(!api.addBundle([{productId:p.id,variantId:v.id,price:999}],15));assert.equal(saved(),snapshot,'stale price rejected');
   const set=w.Storage.prototype.setItem;w.Storage.prototype.setItem=function(){throw Error('blocked')};
   assert(!api.addBundle([{productId:p.id,variantId:v.id,price:v.price}],15));assert.equal(saved(),snapshot,'save failure is atomic');
   w.Storage.prototype.setItem=set;
   host.querySelector('[data-pt-taste="spicy"]').click();
   const cards=()=>[...d.querySelectorAll(page==='index'?'[data-iq-product]':'.product-card[data-product]')];
   assert(cards().length>0);assert(cards().every(card=>w.ZWM_PANTRY_TOOLS.matches({id:card.dataset.iqProduct||card.dataset.product})),'taste filtering uses curated IDs');
   if(page==='shop'){
    const category=d.querySelector('#categorySelect');category.value='Honey';category.dispatchEvent(new w.Event('change',{bubbles:true}));
    assert.equal(cards().length,0,'taste and category filters intersect');
    d.querySelector('#clearSearch').click();assert(cards().length>0,'clear filters also resets taste');
   }
   w.ZWM_PANTRY_TOOLS.resetTaste();w.renderProducts?.();
   api.view(p.id,v.id,null);const link=d.querySelector('#modalProductAsk'),url=new URL(link.href),message=url.searchParams.get('text');
   assert.equal(url.pathname,'/96170381412');assert(message.includes(p.name)&&message.includes(v.label));
   const oil=items.find(x=>x.id==='extra-virgin-olive-oil');w.closeProduct();api.view(oil.id,oil.variants[0].id,null);
   const first=d.querySelector('#modalProductAsk').href;
   d.querySelectorAll('[data-modal-variant]')[1].click();assert.notEqual(d.querySelector('#modalProductAsk').href,first,'question follows selected size');
   assert.deepEqual(errors,[]);
  }finally{observers.forEach(o=>o.disconnect());dom.window.close()}
 }
 for(const locale of ['en','ar','fr']){
  const html=read('product.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
  const dom=new JSDOM(html,{url:'https://store.example/product/extra-virgin-olive-oil',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,d=w.document;
  try{
   w.localStorage.setItem('zwm-locale-v3',locale);w.ZWM_CMS_CONFIG={supabaseUrl:'https://data.example',supabasePublishableKey:'test'};
   w.fetch=async url=>({ok:true,status:200,text:async()=>JSON.stringify(String(url).includes('site_settings')?[{key:'contact',value:{whatsapp:'96170123456'}}]:[])});
   w.eval(read('products-data.js')+';'+read('product-page-v1.js'));
   d.dispatchEvent(new w.Event('DOMContentLoaded'));await wait(50);
   const link=d.querySelector('#c6ProductAsk');assert(link,'standalone question link rendered');
   assert.equal(new URL(link.href).pathname,'/96170123456','live shop contact used');
   const first=link.href,select=d.querySelector('#c6Variant');
   select.selectedIndex=1;select.dispatchEvent(new w.Event('change',{bubbles:true}));
   assert.notEqual(link.href,first,'standalone question follows selected size');
   assert(new URL(link.href).searchParams.get('text').includes(locale==='ar'?'4 لتر':'4 L'));
  }finally{w.close()}
 }
 console.log('Pantry tools passed: home/shop EN/AR/FR, strict budgets, preview edits, native-cart atomic saves, taste filters and size-specific WhatsApp questions.');
})().catch(e=>{console.error(e);process.exitCode=1});
