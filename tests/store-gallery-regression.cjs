'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
(async()=>{
 for(const page of ['index.html','about.html']){
  const dom=new JSDOM(read('public/'+page),{url:'https://zaytwmouneh.com/'+page,runScripts:'outside-only'});
  const w=dom.window,d=w.document;
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
  w.matchMedia=()=>({matches:true});
  const track=d.querySelector('.sg-track');let scrolling;track.scrollBy=options=>{scrolling=options};
  assert.ok(track,page+' has a static photo gallery');
  assert.equal(d.querySelectorAll('[data-sg-photo]').length,12);
  for(const el of d.querySelectorAll('.sg-section [src],.sg-section [srcset],.sg-oil [src],.sg-oil [poster],.sg-section [data-sg-photo],.sg-section [data-sg-cover]')){
   const values=el.hasAttribute('srcset')?el.getAttribute('srcset').split(',').map(x=>x.trim().split(' ')[0]):[el.getAttribute('src')||el.getAttribute('poster')||el.getAttribute('href')];
   for(const asset of values)assert.ok(fs.existsSync(path.join('public',asset)),asset+' exists');
  }
  const ids=[...d.querySelectorAll('[id]')].map(el=>el.id);assert.equal(ids.length,new Set(ids).size,'no duplicate IDs');
  w.eval(read('public/store-gallery-v1.js'));
  assert.equal(d.querySelector('.sg-arrows').hidden,false);
  const first=d.querySelector('[data-sg-photo]');first.click();
  const dialog=d.querySelector('.sg-lightbox');assert.ok(dialog.open);assert.ok(dialog.querySelector('img').src.endsWith('/inside-store.jpg'));
  assert.equal(d.activeElement,dialog.querySelector('.sg-lightbox-close'));
  dialog.querySelector('.sg-lightbox-next').click();assert.ok(dialog.querySelector('img').src.endsWith('/store-sign.jpg'));
  d.documentElement.lang='ar';d.documentElement.dir='rtl';await new Promise(r=>setTimeout(r,0));
  assert.equal(d.querySelector('#sgTitle').textContent,'تعرّفوا ع محلّنا عن قريب.');
  assert.equal(dialog.querySelector('.sg-lightbox-close').getAttribute('aria-label'),'إغلاق الصورة');
  assert.equal(dialog.querySelector('img').alt,'اسمنا ومحلّنا');
  dialog.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));assert.ok(dialog.querySelector('img').src.endsWith('/inside-store.jpg'));
  dialog.querySelector('.sg-lightbox-close').click();assert.equal(dialog.open,false);assert.equal(d.activeElement,first);assert.equal(d.body.style.overflow,'');
  d.querySelector('[data-sg-next]').click();assert.equal(scrolling.behavior,'auto');
  d.documentElement.lang='fr';d.documentElement.dir='ltr';await new Promise(r=>setTimeout(r,0));
  assert.equal(d.querySelector('#sgTitle').textContent,'Entrez dans notre boutique.');
  if(page==='index.html'){
   assert.equal(d.querySelector('#ghPicksStage').nextElementSibling.id,'shop-olive-oil-film');
   const stage=d.querySelector('#ghPicksStage'),film=d.querySelector('#shop-olive-oil-film');
   d.querySelector('#featured').before(stage);stage.replaceChildren(d.createElement('section'));await new Promise(r=>setTimeout(r,0));assert.equal(stage.nextElementSibling,film,'film follows harvest redraw');
   const video=d.querySelector('.sg-oil video');assert.equal(video.preload,'none');assert.equal(video.autoplay,false);assert.ok(video.controls);assert.ok(video.playsInline);
   assert.ok(d.querySelector('#featured').compareDocumentPosition(d.querySelector('#inside-our-shop'))&w.Node.DOCUMENT_POSITION_FOLLOWING);
  }
  dom.window.close();
 }
 console.log('PASS: shop gallery assets, modal navigation/focus, three languages, static fallback, harvest redraw, and video loading policy');
})().catch(e=>{console.error(e);process.exitCode=1});
