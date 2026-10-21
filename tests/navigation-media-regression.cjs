'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync('public/'+p,'utf8');
(async()=>{
 for(const locale of ['en','ar','fr']){
  const prefix=locale==='en'?'':'/'+locale;
  const dom=new JSDOM('<html lang="'+locale+'"><head><base href="/"></head><body><a id="section" href="#details">Details</a><a data-page-section id="static" href="/shop#details">Static</a><a id="external" href="https://example.com/#details">External</a><div id="details"></div></body></html>',{url:'https://zaytwmouneh.com'+prefix+'/shop?category=Olive%20Oil',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;w.localStorage.setItem('zwm-locale-v3',locale);
  w.eval(read('seo-a11y-v1.js'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  const a=w.document.getElementById('section'),url=new URL(a.href);
  assert.equal(url.pathname,prefix+'/shop');assert.equal(url.search,'?category=Olive%20Oil');assert.equal(url.hash,'#details');
  assert.equal(new URL(w.document.getElementById('static').href).search,url.search);
  assert.equal(new URL(w.document.getElementById('static').href).pathname,prefix+'/shop');
  assert.equal(w.document.getElementById('external').href,'https://example.com/#details');
  w.document.getElementById('section').setAttribute('href','#details');w.document.dispatchEvent(new w.Event('zwm:seo-refresh'));
  assert.equal(new URL(a.href).pathname,prefix+'/shop','dynamic section links preserve their page');
  a.setAttribute('href','#details');
  a.addEventListener('click',e=>e.preventDefault());a.click();
  assert.equal(new URL(a.href).pathname,prefix+'/shop','late-created section links are fixed on click');
  await new Promise(r=>w.setTimeout(r,0));dom.window.close();
 }
 const app=read('app.js'),mediaCode=app.slice(app.indexOf('function shouldLimitHeroMedia(){'),app.indexOf('function openLanguageWelcome(){'));
 for(const saveData of [true,false]){
  const dom=new JSDOM('<button id="scenePlayback"></button><div data-scene><video></video></div><div data-scene><video></video></div><button data-scene-dot></button><button data-scene-dot></button>',{pretendToBeVisual:true});
  const d=dom.window.document,counts=[0,0],plays=[0,0];
  d.querySelectorAll('video').forEach((v,i)=>{v.load=()=>counts[i]++;v.play=()=>{plays[i]++;return Promise.resolve()};v.pause=()=>{}});
  const ctx=vm.createContext({window:{matchMedia:()=>({matches:false})},navigator:{connection:{saveData}},document:d,$:s=>d.querySelector(s),$$:s=>Array.from(d.querySelectorAll(s)),sceneIndex:0,heroVisible:true});
  vm.runInContext(mediaCode,ctx);vm.runInContext('startScenes();showScene(0)',ctx);
  assert.equal(d.querySelectorAll('video')[1].preload,'none');assert.equal(counts[1],0);
  assert.equal(counts[0],saveData?0:1);assert.equal(plays[0],saveData?0:1);
  if(saveData){vm.runInContext('showScene(0,true)',ctx);assert.equal(counts[0],1);assert.equal(plays[0],1,'explicit play still works with Save-Data');}
  dom.window.close();
 }
 const premium=read('premium-v2.js'),bootstrap=premium.slice(premium.indexOf('/* Native HD media:'));
 for(const limited of [true,false]){
  const dom=new JSDOM('<video id="shopHeroVideo"></video><button id="homeVideoPlayback"></button>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,v=w.document.querySelector('video');let loads=0;
  v.load=()=>loads++;v.play=()=>Promise.resolve();v.pause=()=>{};w.shouldLimitHeroMedia=()=>limited;
  w.eval(bootstrap);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  assert.equal(v.autoplay,!limited);assert.equal(v.preload,limited?'none':'metadata');assert.equal(loads,limited?0:1);
  dom.window.close();
 }
 console.log('PASS: page-section links preserve route, filters and locale; inactive videos do not preload; Save-Data suppresses automatic media while allowing explicit playback.');
})().catch(e=>{console.error(e);process.exitCode=1});
