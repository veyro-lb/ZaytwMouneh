// Run with NODE_PATH pointing to an installation of jsdom 26.1.0.
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const baseline=process.argv.includes('--baseline');
const read=p=>baseline?cp.execFileSync('git',['show','HEAD:public/'+p],{encoding:'utf8'}):fs.readFileSync('public/'+p,'utf8');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function setup(page,hash='signup'){
 const html=read(page+'.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,'');
 const dom=new JSDOM(html,{url:'https://store.example/'+page+'#'+hash,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;let frames=0;
 w.requestAnimationFrame=fn=>w.setTimeout(()=>{if(w.document){frames++;fn(Date.now())}},16);
 w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
 w.fetch=async()=>({ok:true,json:async()=>[],text:async()=>''});
 return {dom,w,frames:()=>frames};
}
async function stability(page){
 const {dom,w,frames}=setup(page);
 try{
  w.eval(read('site-runtime-v9.js'));
  w.eval(read('commerce-v1.js'));
  await wait(160);const start=frames();await wait(160);
  const extra=frames()-start;
  console.log(page+' idle observer frames:',extra);
  if(!baseline)assert.equal(extra,0,'observers must stop scheduling work when idle');
  const menu=w.document.getElementById('navLinks');
  if(!baseline){
   assert.equal(menu.inert,true);
   w.document.getElementById('navToggle').click();assert.equal(menu.inert,false);assert(menu.classList.contains('is-open'));
   w.document.getElementById('navToggle').click();assert.equal(menu.inert,true);assert(!menu.classList.contains('is-open'));
  }
 }finally{await wait(80);dom.window.close()}
}
async function account(){
 const {dom,w}=setup('account');let googleCalls=0;
 const state={ready:true,session:false,googleEnabled:true};
 w.ZWM_REWARDS={getState:()=>state,auth:{setMode(){},rememberLegalConsent(){},signInWithGoogle:async()=>{googleCalls++}}};
 try{
  w.eval(read('account.js'));const d=w.document;
  const email=d.getElementById('accountEmail');email.value='test@example.invalid';
  const consent=d.getElementById('accountLegalConsent');consent.click();assert.equal(consent.checked,true);
  d.dispatchEvent(new w.CustomEvent('zwm:account-updated'));
  if(baseline){console.log('baseline consent after refresh:',d.getElementById('accountLegalConsent').checked);return}
  assert.equal(d.getElementById('accountEmail'),email,'idle refresh must preserve the form node');
  state.googleEnabled=null;d.dispatchEvent(new w.CustomEvent('zwm:account-updated'));
  assert.equal(d.getElementById('accountEmail').value,'test@example.invalid');assert.equal(d.getElementById('accountLegalConsent').checked,true);
  d.querySelector('[data-account-google]').click();await wait(0);assert.equal(googleCalls,1);
  d.querySelector('[data-account-auth="signin"]').click();assert.equal(w.location.hash,'#signin');
  d.querySelector('[data-account-auth="signup"]').click();assert.equal(w.location.hash,'#signup');
  assert(d.getElementById('accountSignupName'));
  // A checkbox toggles locally; legal documents are separate links.
  d.getElementById('accountLegalConsent').click();assert.equal(w.location.pathname,'/account');
  assert.equal(d.querySelector('[data-auth-legal-link="terms"]').target,'_blank');
  w.document.documentElement.lang='ar';w.document.documentElement.dir='rtl';await wait(0);
  assert(d.querySelector('.account-auth-card h1').textContent.includes('حسابك'));
  console.log('account: consent, field preservation, Google dispatch, tabs, legal links, Arabic passed');
 }finally{await wait(80);dom.window.close()}
}
(async()=>{for(const page of ['account','index','shop','gift','recipes','about','contact'])await stability(page);await account()})().catch(e=>{console.error(e);process.exitCode=1});
