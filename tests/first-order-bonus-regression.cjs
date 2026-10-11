'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const code=fs.readFileSync('public/first-order-bonus-v1.js','utf8');
const KEY='zwm:first-order-reward:history:v2',VISIT='zwm:first-order-reward:visit:v2';
const wait=()=>new Promise(r=>setTimeout(r,1050));
function setup({page='shop',lang='en',seen=false,orders=[],modal=false,preview=false,history=null,visit=false,storageFails=false}={}){
 const dom=new JSDOM(`<html lang="${lang}"><body data-page="${page}"><section id="productModal" aria-hidden="true" style="visibility:hidden"><div class="product-modal-card" role="dialog" aria-modal="true"></div></section>${modal?'<div id="ghCampaignPopup"><section role="dialog" aria-modal="true"></section></div>':''}</body></html>`,{url:'https://zaytwmouneh.com/shop'+(preview?'?welcome=points':''),runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.ZWM_REWARDS={getState:()=>({dashboard:{orders}}),openSignUp:()=>w.joined=true};
 if(seen)w.localStorage.setItem('zwm:first-order-reward:seen:v1','1');
 if(history)w.localStorage.setItem(KEY,JSON.stringify(history));
 if(visit)w.sessionStorage.setItem(VISIT,'1');
 if(storageFails)Object.defineProperty(w,'localStorage',{get(){throw new Error('blocked')}});
 w.eval(code);return {dom,w,doc:w.document};
}
(async()=>{
 for(const lang of ['en','ar','fr']){
  const {dom,w,doc}=setup({lang});await wait();
  assert.ok(doc.querySelector('.fob-card'),'first visitor sees offer');
  assert.equal(doc.querySelector('.fob-card').dir,lang==='ar'?'rtl':'ltr');
  assert.equal(doc.querySelector('.fob-reward strong').textContent,'+20');
  assert.equal(doc.querySelector('.fob-shop').getAttribute('href'),'/'+(lang==='en'?'':lang+'/')+'shop#shop');
  assert.equal(JSON.parse(w.localStorage.getItem(KEY)).count,1);
  doc.querySelector('.fob-join').click();assert.equal(w.joined,true);assert.equal(doc.querySelector('.fob-card'),null);
  assert.equal(JSON.parse(w.localStorage.getItem(KEY)).dismissed,true,'signup ends reminders');dom.window.close();
 }
 const old=Date.now()-8*24*60*60*1000;
 for(const options of [{seen:true},{orders:[{reference:'existing'}]},{page:'checkout'},{page:'admin'},{page:'account'},
  {visit:true},{preview:true,visit:true},{history:{count:2,lastShown:old}},{preview:true,history:{count:2,lastShown:old}},
  {history:{count:1,lastShown:Date.now()}},{history:{count:1,lastShown:old,dismissed:true}}]){
  const {dom,doc}=setup(options);await wait();assert.equal(doc.querySelector('.fob-card'),null,JSON.stringify(options));dom.window.close();
 }
 for(const options of [{preview:true,seen:true},{preview:true,orders:[{reference:'existing'}]},{history:{count:1,lastShown:old}}]){
  const {dom,w,doc}=setup(options);await wait();assert.ok(doc.querySelector('.fob-card'),'one later visit may show reminder');
  if(options.history)assert.equal(JSON.parse(w.localStorage.getItem(KEY)).count,2,'maximum second appearance recorded');
  if(options.preview)assert.equal(new URL(w.location.href).searchParams.has('welcome'),false,'reopen flag consumed');
  doc.querySelector('.fob-close').click();assert.equal(JSON.parse(w.localStorage.getItem(KEY)).dismissed,true,'close stops future reminders');dom.window.close();
 }
 const {dom,w,doc}=setup({modal:true});await wait();assert.equal(doc.querySelector('.fob-card'),null,'harvest has priority');
 doc.querySelector('#ghCampaignPopup').hidden=true;await wait();assert.ok(doc.querySelector('.fob-card'),'show after campaign closes');
 const saved=w.localStorage.getItem(KEY),visit=w.sessionStorage.getItem(VISIT);
 const product=doc.querySelector('#productModal');product.setAttribute('aria-hidden','false');product.style.visibility='visible';product.classList.add('is-open');
 await new Promise(r=>setTimeout(r,10));assert.equal(doc.querySelector('.fob-card'),null,'shopping dismisses card for the visit');
 product.setAttribute('aria-hidden','true');product.style.visibility='hidden';product.classList.remove('is-open');await wait();
 assert.equal(doc.querySelector('.fob-card'),null,'no resurfacing after repeated product clicks');
 assert.equal(visit,'1');dom.window.close();
 const next=setup({history:JSON.parse(saved),visit:true});await wait();assert.equal(next.doc.querySelector('.fob-card'),null,'next page in visit stays quiet');next.w.close();
 const fallback=setup({storageFails:true});await wait();assert.ok(fallback.doc.querySelector('.fob-card'),'session fallback works');
 assert.equal(JSON.parse(fallback.w.sessionStorage.getItem(KEY)).count,1);fallback.doc.querySelector('.fob-close').click();
 assert.equal(JSON.parse(fallback.w.sessionStorage.getItem(KEY)).dismissed,true);fallback.w.close();
 console.log('First order card: PASS (EN/AR/FR, max two appearances, seven-day cooldown, once per visit, permanent dismissal, modal priority and storage fallback).');
})().catch(e=>{console.error(e);process.exitCode=1;});
