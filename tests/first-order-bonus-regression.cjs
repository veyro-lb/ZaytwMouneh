'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const code=fs.readFileSync('public/first-order-bonus-v1.js','utf8');
const wait=()=>new Promise(r=>setTimeout(r,1050));
function setup({page='shop',lang='en',seen=false,orders=[],modal=false}={}){
 const dom=new JSDOM(`<html lang="${lang}"><body data-page="${page}">${modal?'<div id="ghCampaignPopup"><section role="dialog" aria-modal="true"></section></div>':''}</body></html>`,{url:'https://zaytwmouneh.com/shop',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.ZWM_REWARDS={getState:()=>({dashboard:{orders}}),openSignUp:()=>w.joined=true};
 if(seen)w.localStorage.setItem('zwm:first-order-reward:seen:v1','1');
 w.eval(code);return {dom,w,doc:w.document};
}
(async()=>{
 for(const lang of ['en','ar','fr']){
  const {dom,w,doc}=setup({lang});await wait();
  assert.ok(doc.querySelector('.fob-card'),'first visitor sees offer');
  assert.equal(doc.querySelector('.fob-card').dir,lang==='ar'?'rtl':'ltr');
  assert.equal(doc.querySelector('.fob-reward strong').textContent,'+20');
  assert.equal(doc.querySelector('.fob-shop').getAttribute('href'),'/'+(lang==='en'?'':lang+'/')+'shop#shop');
  doc.querySelector('.fob-join').click();assert.equal(w.joined,true);assert.equal(doc.querySelector('.fob-card'),null);dom.window.close();
 }
 for(const options of [{seen:true},{orders:[{reference:'existing'}]},{page:'checkout'},{page:'admin'},{page:'account'}]){
  const {dom,doc}=setup(options);await wait();assert.equal(doc.querySelector('.fob-card'),null);dom.window.close();
 }
 const {dom,doc}=setup({modal:true});await wait();assert.equal(doc.querySelector('.fob-card'),null,'harvest has priority');
 doc.querySelector('#ghCampaignPopup').hidden=true;await wait();assert.ok(doc.querySelector('.fob-card'),'show after campaign closes');
 doc.querySelector('#ghCampaignPopup').hidden=false;await new Promise(r=>setTimeout(r,10));assert.equal(doc.querySelector('.fob-card').hidden,true,'pause when another dialog opens');
 doc.querySelector('#ghCampaignPopup').hidden=true;await new Promise(r=>setTimeout(r,10));assert.equal(doc.querySelector('.fob-card').hidden,false);
 doc.querySelector('.fob-close').click();assert.equal(doc.querySelector('.fob-card'),null);dom.window.close();
 console.log('First order bonus UI: PASS (languages, modal priority, repeat suppression, member history, checkout exclusion, join and dismiss).');
})().catch(e=>{console.error(e);process.exitCode=1;});
