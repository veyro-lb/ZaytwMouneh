"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {JSDOM}=require("jsdom");
const html=fs.readFileSync("public/index.html","utf8");
const code=fs.readFileSync("public/instant-shop-v1.js","utf8");
const css=fs.readFileSync("public/instant-shop-v1.css","utf8");
const app=fs.readFileSync("public/app.js","utf8");

assert(html.includes('id="instant-shop"'),"homepage quick-shop exists");
assert(html.indexOf('id="instant-shop"')>html.indexOf("home-pantry-hero"),"shop follows hero");
assert(html.indexOf('id="instant-shop"')<html.indexOf('id="harvest-picks"'),"shop must appear before long collections");
assert(html.includes('href="#instant-shop"'),"homepage hero CTA links to the instant-shop");
assert(html.includes("/instant-shop-v1.css?v=20261022-instantshop1"),"homepage CSS cache-busted");
assert(html.includes("/instant-shop-v1.js?v=20261022-instantshop1"),"homepage script cache-busted");
assert(html.includes("app.js?v=20261022-instantshop1"),"cached main cart integration refreshed");
assert(!html.includes("No account needed")&&!html.includes("Real shop in Lebanon"),"remove undesired claims");
assert(html.includes('data-iq-checkout href="/checkout"'),"use actual checkout route");
assert(app.includes("window.ZWM_INSTANT_SHOP=Object.freeze("),"feature uses live storefront commerce API");
assert(app.includes('return addToCart(p,v,1,true)===true'),"homepage add uses native validated cart");
assert(app.includes('window.dispatchEvent(new Event("zwm:cart-rendered"))'),"cart updates are reflected");
assert(!code.includes("localStorage.setItem"),"separate localStorage cart must not be used");
assert(css.includes("@media(max-width:680px)"),"responsive layout is included");
assert(css.includes("prefers-reduced-motion"),"respect reduced-motion users");
const section=html.slice(html.indexOf('<section id="instant-shop"'),html.indexOf('</section>',html.indexOf('<section id="instant-shop"'))+10);
const dom=new JSDOM('<!doctype html><html lang="en"><body>'+section+'</body></html>',{
  url:"https://zaytwmouneh.com/",runScripts:"outside-only",pretendToBeVisual:true
});
const w=dom.window,d=w.document;
let cart=[],opened=0,locale="en",events=[];
const products=[
  {id:"extra-virgin-olive-oil",name:"Extra Virgin Olive Oil",category:"Olive Oil",categoryLabel:"Olive Oil",variants:[{id:"500ml",label:"500 ml",price:6},{id:"1l",label:"1 L",price:12}],imageFor:()=>"/assets/harvest-2026/1l.webp"},
  {id:"flower-honey",name:"Flower Honey",category:"Honey",categoryLabel:"Honey",variants:[{id:"500g",label:"500 g",price:19}],imageFor:()=>"/assets/products/originals/flower-honey.jpg"},
  {id:"semaq",name:"Sumac",category:"Spices",categoryLabel:"Spices",variants:[{id:"250g",label:"250 g",price:5.5}],imageFor:()=>""}
];
w.ZWM_INSTANT_SHOP={
  products:()=>products,
  locale:()=>locale,
  add:(id,variant)=>{
    const p=products.find(x=>x.id===id),v=p?.variants.find(x=>x.id===variant);
    if(!v)return false;
    cart.push({id,variant,price:v.price});events.push("add");return true;
  },
  cart:()=>({count:cart.length,subtotal:cart.reduce((sum,x)=>sum+x.price,0),freeAbove:50,canCheckout:cart.length>0}),
  openCart:()=>{opened++}
};
w.eval(code);
d.dispatchEvent(new w.Event("DOMContentLoaded"));
assert.equal(d.querySelectorAll(".iq-card").length,3,"real products display");
assert.equal(d.querySelector("[data-iq-cart-count]").textContent,"0");
const oil=d.querySelector('[data-iq-product="extra-virgin-olive-oil"]');
const size=oil.querySelector("[data-iq-select]");
size.value="1l";size.dispatchEvent(new w.Event("change",{bubbles:true}));
assert.equal(oil.querySelector(".iq-price").textContent,"$12.00","selecting size updates price");
oil.querySelector("[data-iq-add]").click();
assert.equal(cart[0].variant,"1l","selected real variant sent to native cart");
assert.equal(d.querySelector("[data-iq-cart-count]").textContent,"1");
assert.equal(d.querySelector("[data-iq-checkout]").hidden,false,"checkout CTA available once cart is ready");
d.querySelector("[data-iq-review]").click();
assert.equal(opened,1,"review opens native cart");
const budget=d.querySelector('[data-iq-filter="budget"]');
budget.click();
assert.equal(d.querySelectorAll(".iq-card").length,2,"budget filter respects real prices");
locale="ar";w.dispatchEvent(new w.Event("zwm:cart-rendered"));
assert.equal(d.querySelector("[data-iq-title]").textContent,"كل شي بتحبّه… بطلب واحد.");
assert.equal(d.querySelector("[data-iq-checkout]").textContent,"كمّل الطلب ↖");
assert.equal(d.querySelector("[data-iq-cart-count]").textContent,"1","basket preserved after language change");
w.close();
console.log("Instant shop regression passed: placement, assets, real cart API, variants, filters, mobile, RTL and checkout.");
