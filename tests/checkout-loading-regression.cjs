const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('public/checkout.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
const script=fs.readFileSync('public/checkout.js','utf8');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function scenario(stalled){
  const dom=new JSDOM(html,{url:'https://store.example/checkout',runScripts:'outside-only'});
  const w=dom.window,d=w.document;
  let catalogueCalls=0,submissions=0,aborted=false;
  try{
    w.PRODUCTS_DATA=[{id:'oil',nameEn:'Olive Oil',variants:[{id:'one',sizeEn:'1 L',price:12}]}];
    w.ZWM_CMS_CONFIG={supabaseUrl:'https://api.example',supabasePublishableKey:'public'};
    w.ZWM_LOCALE={get:()=> 'en',set(){}};
    w.ZWM_REWARDS={auth:{refreshSession:async()=>null}};
    w.ZWM_LEBANON_AREAS=stalled==='areas'?[]:[{id:'beirut',en:'Beirut',ar:'بيروت'}];
    w.localStorage.setItem('zwm-cart-v5',JSON.stringify({oil:{productId:'oil',variantId:'one',qty:1}}));
    if(stalled==='auth')w.localStorage.setItem('zwm:mouneh:session:v1',JSON.stringify({access_token:'expired'}));
    const timer=w.setTimeout.bind(w);
    w.setTimeout=(fn,ms,...args)=>timer(fn,ms===20000||ms===10000?25:ms,...args);
    w.fetch=async(url,options={})=>{
      if(String(url).includes('product_overrides')){
        catalogueCalls++;
        if(stalled==='catalogue'&&catalogueCalls===1)return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted=true;reject(new w.DOMException('Aborted','AbortError'))},{once:true}));
        return {ok:true,json:async()=>[]};
      }
      if(String(url).includes('/auth/v1/user'))return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted=true;reject(new w.DOMException('Aborted','AbortError'))},{once:true}));
      const body=JSON.parse(options.body||'{}');
      if(body.action==='submit'){submissions++;throw new Error('Test must not create an order')}
      return {ok:true,status:200,json:async()=>body.action==='config'?{delivery:{enabled:true,fee:5,zones:[]}}:body.action==='dashboard'?null:{}};
    };
    assert(d.getElementById('placeOrderButton').disabled,'the initial HTML must block ordering');
    w.eval(script);
    if(d.readyState==='loading')await new Promise(resolve=>d.addEventListener('DOMContentLoaded',resolve,{once:true}));
    const before=new w.Event('submit',{bubbles:true,cancelable:true});
    d.getElementById('nativeCheckoutForm').dispatchEvent(before);
    assert(before.defaultPrevented,'submission during initialization must never become a native GET');
    await wait(80);
    if(stalled!=='areas')assert(aborted,'a stalled initialization request must abort');
    d.getElementById('checkoutArea').value='Beirut';
    d.getElementById('checkoutArea').dispatchEvent(new w.Event('change',{bubbles:true}));
    if(stalled==='catalogue'){
      assert(d.getElementById('placeOrderButton').disabled,'unverified prices must block ordering');
      const retry=d.querySelector('.checkout-retry');
      assert(retry,'catalogue timeouts must expose recovery');
      retry.click();await wait(30);
      assert(!d.querySelector('.checkout-retry'),'successful retry must clear recovery control');
    }
    assert(!d.getElementById('nativeCheckoutForm').hidden,'checkout remains available after optional auth timeout');
    assert(!d.getElementById('placeOrderButton').disabled,'verified checkout can proceed once an area is entered');
    const invalid=new w.Event('submit',{bubbles:true,cancelable:true});
    d.getElementById('nativeCheckoutForm').dispatchEvent(invalid);await wait(80);
    assert(invalid.defaultPrevented);
    assert.equal(d.getElementById('checkoutName').getAttribute('aria-invalid'),'true','retry must retain working validation');
    assert.equal(submissions,0);
    assert(w.localStorage.getItem('zwm-cart-v5'),'loading failures must preserve the cart');
  }finally{w.close()}
}
(async()=>{await scenario('catalogue');await scenario('auth');await scenario('areas');console.log('Checkout loading regression passed: early submit blocked, stalled requests aborted, catalogue retry recovered, area timeout settled, guest checkout and cart preserved.')})().catch(error=>{console.error(error);process.exitCode=1});
