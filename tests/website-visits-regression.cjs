"use strict";

// Run with: node tests/website-visits-regression.cjs
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

const admin=read("public/admin.js");
const runtime=read("public/site-runtime-v9.js");
const html=read("public/admin.html");
const migration=read("supabase/migrations/20261009200519_website_unique_visitors_20261009.sql");

const begin=admin.indexOf("  function websiteVisitMetrics(pageViews){");
const end=admin.indexOf("\n  function analyticsSnapshot(days){",begin);
assert(begin>=0&&end>begin,"visitor aggregator must exist");
const websiteVisitMetrics=new Function(admin.slice(begin,end)+"\nreturn websiteVisitMetrics;")();

assert.deepEqual(websiteVisitMetrics([]),{visitors:0,visits:0,repeatVisits:0,average:0});
const events=[
  {visitor_id:"visitor-a",session_id:"session-1"},
  {visitor_id:"visitor-a",session_id:"session-1"}, // refresh is not a visit
  {visitor_id:"visitor-a",session_id:"session-2"}, // repeat visit
  {visitor_id:"visitor-b",session_id:"session-3"},
  {visitor_id:null,session_id:"legacy-session"}, // pre-rollout
  {visitor_id:"visitor-c",session_id:null} // unidentifiable session
];
assert.deepEqual(websiteVisitMetrics(events),{visitors:2,visits:3,repeatVisits:1,average:1.5});
assert.deepEqual(websiteVisitMetrics([{visitor_id:"x",session_id:"s"}]),{visitors:1,visits:1,repeatVisits:0,average:1});

assert(runtime.includes('const VISITOR_KEY = "zwm:analytics:visitor:v1"'),"first-party local ID");
assert(runtime.includes('if(eventName==="page_view"){'),"visitor ID should only accompany page views");
assert(runtime.includes("if(id)row.visitor_id=id"),"page-view visitor ID should be sent");
assert(runtime.includes("analyticsOptedOut()"),"owner opt-out must be honored");
assert(html.includes('id="websiteUniqueVisitors"'),"unique visitor tile");
assert(html.includes('id="websiteTotalVisits"'),"visit tile");
assert(html.includes('id="websiteAverageVisits"'),"average visit tile");
assert(html.includes('id="websiteRepeatVisits"'),"repeat visit tile");
assert(/add column if not exists visitor_id uuid/i.test(migration),"nullable visitor ID migration");
for(const page of ["index","shop","about","contact","gift","wholesale","recipes","account","checkout"]){
  assert(read("public/"+page+".html").includes("site-runtime-v9.js?v=20261010-launchreview2"),page+" must use new tracking runtime");
}

const storefront=read("public/app.js");
const dedicatedProduct=read("public/product-page-v1.js");
const commerce=read("public/commerce-v1.js");
const checkout=read("public/checkout.js");
assert(!runtime.includes('e.target.closest("#productModalAdd,[data-add-to-cart]'),"click-based add events must not double-count");
assert(runtime.includes('keepalive:eventName==="add_to_cart"'),"cart analytics must survive immediate navigation");
assert(!commerce.includes('track("checkout_started"'),"navigation must not double-log checkout starts");
assert(!storefront.includes('track?.("checkout_started"'),"storefront navigation must not double-log checkout starts");
assert(checkout.includes('track("checkout_started"'),"valid checkout view must record checkout start");

function extractFunction(source,startMarker,endMarker){
  const start=source.indexOf(startMarker),end=source.indexOf(endMarker,start);
  assert(start>=0&&end>start,"missing expected function boundary "+startMarker);
  return source.slice(start,end);
}
const storefrontAdd=extractFunction(storefront,"function addToCart(","\nfunction changeCartQty(");
new Function("assert",[
  'const cart={};let saved=true,rendered=0;const events=[];',
  'const cartKey=(p,v)=>p+"::"+v,productCanOrder=()=>true;',
  'const saveCart=()=>saved,renderCart=()=>{rendered++},cartRows=()=>Object.values(cart).map(r=>({qty:r.qty,v:{price:5}}));',
  'const deliveryQuoteFor=()=>({freeAbove:50}),$=()=>null,lang="en";',
  'const money=n=>"$"+n,UI={en:{added:"Added"}},currentName=p=>p.id,currentSize=v=>v.id,toast=()=>{};',
  'const window={ZWM_CMS:{track:(event,meta)=>events.push({event,meta})}};',
  storefrontAdd,
  'const p={id:"pantry-a",variants:[{id:"pack",price:5}]},v=p.variants[0];',
  'assert.equal(addToCart(p,v,1,true),true);',
  'assert.equal(addToCart(p,v,1,true),true);',
  'assert.equal(cart["pantry-a::pack"].qty,2,"repeated add should increase quantity");',
  'assert.equal(events.length,2,"exactly one event per successful cart mutation");',
  'assert.equal(events[0].event,"add_to_cart");',
  'assert.equal(events[0].meta.product_id,"pantry-a");',
  'saved=false;assert.equal(addToCart(p,v,1,true),false);',
  'assert.equal(cart["pantry-a::pack"].qty,2,"failed save must restore previous quantity");',
  'assert.equal(events.length,2,"failed save must not create an add event");',
  'saved=true;assert.equal(addToCart(p,{id:"invalid",price:5},1,true),false);',
  'assert.equal(events.length,2,"invalid variants must not create events");'
].join("\n"))(assert);

const dedicatedAdd=extractFunction(dedicatedProduct,"function addProduct(","\nfunction updateCartCount(");
new Function("assert",[
  'let cart={},stored=true,rendered=0;const events=[];',
  'const readCart=()=>({...cart}),writeCart=c=>{if(!stored)return false;cart=c;return true;},updateCartCount=()=>{rendered++};',
  'const window={ZWM_CMS:{track:(event,meta)=>events.push({event,meta})}};',
  dedicatedAdd,
  'const p={id:"pantry-a"},v={id:"pack"};',
  'assert.equal(addProduct(p,v,1),true);assert.equal(addProduct(p,v,1),true);',
  'assert.equal(cart["pantry-a::pack"].qty,2);assert.equal(events.length,2);',
  'stored=false;assert.equal(addProduct(p,v,1),false);',
  'assert.equal(cart["pantry-a::pack"].qty,2);assert.equal(events.length,2);'
].join("\n"))(assert);
assert(storefront.includes('function saveCart(){return safeStorageSet('),"saveCart should report persistence");
for(const marker of [
  'addToCart(p,chosen,1,true)',
  'addToCart(p,defaultVariant(p),1,true)',
  'addToCart(currentModalProduct,currentModalVariant,qtyFor("modal"),true)'
])assert(storefront.includes(marker),"purchase CTA should accumulate quantity: "+marker);

console.log("Website Visits regression checks passed.");
