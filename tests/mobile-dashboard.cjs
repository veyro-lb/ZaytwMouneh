// DOM/CSS regression checks; not a physical-device rendering test.
// NODE_PATH=<jsdom 26.1.0 installation>/node_modules node tests/mobile-dashboard.cjs
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const baseline=process.argv.includes('--baseline');
const css=baseline?cp.execFileSync('git',['show','HEAD:public/account.css'],{encoding:'utf8'}):fs.readFileSync('public/account.css','utf8');
function mediaMatches(text,width){
 return !Array.from(text.matchAll(/(min|max)-width:\s*(\d+)px/g)).some(([,kind,n])=>kind==='min'?width<+n:width>+n);
}
function stylesAt(width){
 const d=new JSDOM('<style></style>');d.window.document.querySelector('style').textContent=css;
 function flatten(rules){return Array.from(rules).map(r=>r.media?(mediaMatches(r.conditionText,width)?flatten(r.cssRules):''):r.cssText).join('\n')}
 const result=flatten(d.window.document.styleSheets[0].cssRules);d.window.close();return result;
}
(async()=>{
for(const width of [320,375,390,430,700,768,980,1280])for(const language of ['en','ar']){
 const dom=new JSDOM('<html lang="'+language+'" dir="'+(language==='ar'?'rtl':'ltr')+'"><head><style></style></head><body data-page="account"><div id="accountShell"></div></body></html>',{url:'https://store.example/account#overview',runScripts:'outside-only'});
 const w=dom.window,d=w.document;
 const member={name:'Test Customer',balance:75,tier:'olive',annual_spend:75,phone:'0000000'};
 const state={ready:true,session:true,member,authUser:{email:'test@example.invalid'},dashboard:{member,wallet:[],orders:[],ledger:[]},publicData:{rewards:[]}};
 w.ZWM_REWARDS={getState:()=>state,refresh:async()=>{},open(){}};
 w.requestAnimationFrame=fn=>w.setTimeout(fn,16);
 w.ZWM_CMS_CONFIG={supabaseUrl:'https://service.example',supabasePublishableKey:'test'};
 w.fetch=async()=>({ok:true,json:async()=>[]});
 try{
  d.querySelector('style').textContent=stylesAt(width);
  w.eval(fs.readFileSync('public/account.js','utf8'));
  const columns=w.getComputedStyle(d.querySelector('.account-layout')).gridTemplateColumns;
  if(baseline){if(width===390&&language==='en')console.log('Baseline at 390px:',columns);continue}
  assert.equal(columns,width<=980?'minmax(0,1fr)':'240px minmax(0,1fr)',width+' '+language);
  if(width<=700){
   assert.equal(w.getComputedStyle(d.querySelector('.account-tabs')).gridTemplateColumns,'repeat(2,minmax(0,1fr))');
   assert.equal(w.getComputedStyle(d.querySelector('.account-side')).position,'static');
   assert.equal(w.getComputedStyle(d.querySelector('.account-identity')).display,'flex');
   assert.equal(w.getComputedStyle(d.querySelector('.account-hero')).flexDirection,'column');
   assert.equal(w.getComputedStyle(d.querySelector('.account-form input')).fontSize,'16px');
  }
  for(const id of ['overview','points','orders','referrals','profile']){
   d.querySelector('[data-account-tab="'+id+'"]').click();
   const shown=Array.from(d.querySelectorAll('[data-account-panel]')).filter(p=>!p.hidden);
   assert.equal(shown.length,1);assert.equal(shown[0].dataset.accountPanel,id);
   assert.notEqual(w.getComputedStyle(shown[0]).display,'none');
   assert(shown[0].textContent.trim().length>0);
  }
  w.eval(fs.readFileSync('public/commerce-v1.js','utf8'));
  d.dispatchEvent(new w.Event('DOMContentLoaded'));await new Promise(r=>setTimeout(r,45));
  const addresses=d.querySelector('[data-native-address-tab]');assert(addresses);
  addresses.click();await new Promise(r=>setTimeout(r,25));
  assert(d.querySelector('#nativeAddressesPanel #nativeAddressForm'));
  assert.equal(Array.from(d.querySelectorAll('[data-account-panel]')).filter(p=>!p.hidden).length,0);
  d.querySelector('[data-account-tab="overview"]').click();
  assert(!d.querySelector('[data-account-panel="overview"]').hidden);
  assert(!d.querySelector('#nativeAddressesPanel'));
  console.log(width+'px '+language+': layout, five panels, addresses and return navigation pass');
 }finally{w.close()}
}

})().catch(e=>{console.error(e);process.exitCode=1});
