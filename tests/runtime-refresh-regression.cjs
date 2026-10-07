const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const {JSDOM}=require("jsdom");

const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const wait=ms=>new Promise(r=>setTimeout(r,ms));

function stripScripts(html){
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi,"");
}

async function testCustomerOrders(){
  const html='<!doctype html><html><body data-page="account"><main id="accountShell"><section data-account-panel="overview"><div class="account-grid"></div></section><section data-account-panel="orders"></section></main></body></html>';
  const dom=new JSDOM(html,{url:"https://store.example/account#orders",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window;
  let now=100000,fetches=0;
  const intervals=[];
  w.Date.now=()=>now;
  w.requestAnimationFrame=fn=>w.setTimeout(()=>fn(now),0);
  w.setInterval=(fn,delay)=>{intervals.push({fn,delay});return intervals.length};
  w.clearInterval=()=>{};
  w.ZWM_CMS_CONFIG={supabaseUrl:"https://example.supabase.co",supabasePublishableKey:"public"};
  w.localStorage.setItem("zwm:mouneh:session:v1",JSON.stringify({access_token:"token",refresh_token:"refresh"}));
  w.ZWM_REWARDS={getState:()=>({member:{id:"m1"}}),refresh:async()=>{}};
  w.fetch=async()=>{fetches++;return {ok:true,status:200,json:async()=>({orders:[],counts:{all:0,active:0,delivered:0,cancelled:0}})}};
  try{
    w.eval(read("public/customer-orders-v1.js"));
    w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
    w.document.dispatchEvent(new w.CustomEvent("zwm:account-updated"));
    await wait(25);
    assert.equal(fetches,1,"account-ready event should make one initial list request");
    assert(intervals.some(x=>x.delay===120000),"orders background cadence should be 120 seconds");
    assert(!intervals.some(x=>x.delay===8000),"8-second order polling must not return");

    const rootEl=w.document.getElementById("accountShell");
    rootEl.appendChild(w.document.createElement("div"));
    await wait(25);
    assert.equal(fetches,1,"DOM mutation must not trigger an order network request");

    w.dispatchEvent(new w.Event("focus"));
    await wait(5);
    assert.equal(fetches,1,"fresh focus must not refetch orders");

    now+=61000;
    w.dispatchEvent(new w.Event("focus"));
    await wait(10);
    assert.equal(fetches,2,"stale focus should refresh orders once");

    const button=w.document.querySelector("[data-customer-orders-refresh]");
    assert(button,"manual order refresh button should remain mounted");
    button.click();
    await wait(10);
    assert.equal(fetches,3,"manual refresh should still work");

    Object.defineProperty(w.document,"hidden",{configurable:true,value:true});
    now+=180000;
    w.document.dispatchEvent(new w.Event("visibilitychange"));
    await wait(5);
    assert.equal(fetches,3,"hidden tabs must not refresh orders");
  }finally{
    dom.window.close();
  }
}

async function testCustomerOrdersAuthRecovery(){
  const html='<!doctype html><html><body data-page="account"><main id="accountShell"><section data-account-panel="overview"><div class="account-grid"></div></section><section data-account-panel="orders"></section></main></body></html>';
  const dom=new JSDOM(html,{url:"https://store.example/account#orders",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window;
  let now=150000,fetches=0,refreshCalls=0;
  const intervals=[];
  w.Date.now=()=>now;
  w.requestAnimationFrame=fn=>w.setTimeout(()=>fn(now),0);
  w.setInterval=(fn,delay)=>{intervals.push({fn,delay});return intervals.length};
  w.clearInterval=()=>{};
  w.ZWM_CMS_CONFIG={supabaseUrl:"https://example.supabase.co",supabasePublishableKey:"public"};
  w.localStorage.setItem("zwm:mouneh:session:v1",JSON.stringify({access_token:"expired",refresh_token:"refresh"}));
  w.ZWM_REWARDS={
    getState:()=>({member:{id:"m1"}}),
    refresh:async()=>{},
    auth:{refreshSession:async()=>{refreshCalls++;const next={access_token:"fresh",refresh_token:"refresh2"};w.localStorage.setItem("zwm:mouneh:session:v1",JSON.stringify(next));return next}}
  };
  w.fetch=async()=>{
    fetches++;
    if(fetches===1)return {ok:false,status:401,json:async()=>({message:"expired"})};
    return {ok:true,status:200,json:async()=>({orders:[],counts:{all:0,active:0,delivered:0,cancelled:0}})};
  };
  try{
    w.eval(read("public/customer-orders-v1.js"));
    w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
    await wait(30);
    assert.equal(refreshCalls,1,"orders 401 should use exactly one shared session refresh");
    assert.equal(fetches,2,"orders should retry once after the coordinated refresh");

    w.dispatchEvent(new w.Event("zwm:auth-expired"));
    now+=180000;
    const background=intervals.find(x=>x.delay===120000);
    assert(background,"orders background timer should exist");
    background.fn();
    await wait(10);
    assert.equal(fetches,2,"settled signed-out orders must stop authenticated background traffic");
  }finally{
    dom.window.close();
  }
}

async function testAccountStaleness(){
  const dom=new JSDOM(stripScripts(read("public/account.html")),{url:"https://store.example/account#overview",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window;
  let now=200000,refreshes=0;
  const intervals=[];
  w.Date.now=()=>now;
  w.requestAnimationFrame=fn=>w.setTimeout(()=>fn(now),0);
  w.setInterval=(fn,delay)=>{intervals.push({fn,delay});return intervals.length};
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.HTMLElement.prototype.scrollIntoView=function(){};
  const rewardState={ready:true,session:true,member:{name:"Test",balance:0},dashboard:{member:{name:"Test",balance:0},wallet:[],orders:[],ledger:[]},lastAccountLoadAt:now,publicData:{config:{}},providers:[],authMode:"public",accountBusy:false,accountError:""};
  w.ZWM_REWARDS={getState:()=>rewardState,refresh:async()=>{refreshes++;rewardState.lastAccountLoadAt=now},account:{refresh:async()=>{refreshes++;rewardState.lastAccountLoadAt=now}}};
  try{
    w.eval(read("public/account.js"));
    await wait(10);
    assert(!intervals.some(x=>x.delay===120000),"account shell should not own a duplicate recurring account poll");
    w.dispatchEvent(new w.Event("focus"));
    await wait(5);
    assert.equal(refreshes,0,"fresh account focus must not hit the API");
    now+=121000;
    w.dispatchEvent(new w.Event("focus"));
    await wait(10);
    assert.equal(refreshes,1,"stale account focus should refresh once");
    w.dispatchEvent(new w.Event("pageshow"));
    w.document.dispatchEvent(new w.Event("visibilitychange"));
    await wait(10);
    assert.equal(refreshes,1,"focus/pageshow/visibility burst should deduplicate while fresh");
  }finally{
    dom.window.close();
  }
}

async function testAuthRefreshSingleFlight(){
  const dom=new JSDOM("<!doctype html><html lang=\"en\"><body></body></html>",{url:"https://store.example/",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window;
  let refreshCalls=0,expiredEvents=0,failRefresh=false;
  w.ZWM_CMS_CONFIG={enabled:true,supabaseUrl:"https://example.supabase.co",supabasePublishableKey:"public"};
  w.requestAnimationFrame=fn=>w.setTimeout(()=>fn(Date.now()),0);
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.addEventListener("zwm:auth-expired",()=>expiredEvents++);
  w.fetch=async(url,options={})=>{
    const href=String(url);
    let status=200,data={};
    if(href.includes("grant_type=password")){
      data={session:{access_token:"access-1",refresh_token:"refresh-1",expires_at:Math.floor(Date.now()/1000)+3600},user:{id:"u1",email:"test@example.invalid"}};
    }else if(href.includes("grant_type=refresh_token")){
      refreshCalls++;
      if(failRefresh){status=400;data={message:"refresh failed"}}
      else data={session:{access_token:"access-2",refresh_token:"refresh-2",expires_at:Math.floor(Date.now()/1000)+3600},user:{id:"u1"}};
    }else if(href.includes("/auth/v1/user")){
      data={id:"u1",email:"test@example.invalid",user_metadata:{}};
    }else if(href.includes("/auth/v1/settings")){
      data={external:{google:false}};
    }else if(href.includes("/rest/v1/rpc/mouneh_api")){
      let body={};try{body=JSON.parse(options.body||"{}")}catch{}
      data=body.action==="public"?{rewards:[],campaigns:[],config:{}}:body.action==="dashboard"?{member:null,needsJoin:false,wallet:[],orders:[],ledger:[]}:{};
    }else{
      data={};
    }
    return {ok:status>=200&&status<300,status,json:async()=>data};
  };
  try{
    w.eval(read("public/mouneh-rewards-v8.js"));
    await w.ZWM_REWARDS.auth.signIn("test@example.invalid","password123");
    await Promise.all([
      w.ZWM_REWARDS.auth.refreshSession(),
      w.ZWM_REWARDS.auth.refreshSession(),
      w.ZWM_REWARDS.auth.refreshSession()
    ]);
    assert.equal(refreshCalls,1,"simultaneous refresh callers must share one token refresh");

    failRefresh=true;
    await Promise.all([
      w.ZWM_REWARDS.auth.refreshSession(),
      w.ZWM_REWARDS.auth.refreshSession()
    ]);
    assert.equal(refreshCalls,2,"failed simultaneous refresh must still make only one refresh request");
    const state=w.ZWM_REWARDS.getState();
    assert.equal(state.session,false,"failed token refresh must settle signed out");
    assert.equal(expiredEvents,1,"expired session should emit one settled auth-expired event");
    assert.match(state.authNotice,/session expired/i,"expired session should show a clear sign-in-required notice");
  }finally{
    await wait(20);
    dom.window.close();
  }
}

function testCoordinationGuards(){
  const rewards=read("public/mouneh-rewards-v8.js");
  const site=read("public/site-runtime-v9.js");
  const notifications=read("public/customer-notifications-v1.js");
  const order=read("public/order.js");
  const returns=read("public/returns-v1.js");
  assert.match(rewards,/refreshSessionInFlight/,"session refresh must be single-flight");
  assert.match(rewards,/dashboardLoadInFlight/,"dashboard refresh must be single-flight");
  assert.match(rewards,/zwm:auth-expired/,"expired session must settle into one auth-expired event");
  assert.match(site,/CMS_STALE_MS\s*=\s*5\*60\*1000/,"CMS refresh should use a five-minute freshness window");
  assert.match(notifications,/BELL_BACKGROUND_REFRESH_MS=120000/,"notification polling should be moderate");
  assert.match(order,/ORDER_REFRESH_MS=30000/,"order detail should not poll every five seconds");
  assert.match(returns,/REQUEST_TIMEOUT_MS=15000/,"returns requests need a finite timeout");
  assert.match(returns,/refreshSession/,"returns 401s should route through the shared session refresh");
  assert.match(read("public/customer-orders-v1.js"),/REQUEST_TIMEOUT_MS=15000/,"customer order requests need a finite timeout");
}

(async()=>{
  await testCustomerOrders();
  await testCustomerOrdersAuthRecovery();
  await testAccountStaleness();
  await testAuthRefreshSingleFlight();
  testCoordinationGuards();
  console.log("Runtime refresh regression passed: stale-aware account/orders, hidden-tab suppression, manual refresh, single-flight auth refresh, and expiry settlement.");
})().catch(err=>{console.error(err);process.exitCode=1});
