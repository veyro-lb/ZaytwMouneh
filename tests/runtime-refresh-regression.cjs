const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const {JSDOM}=require("jsdom");

const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const response=(status,data)=>({ok:status>=200&&status<300,status,json:async()=>data});

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
  w.ZWM_REWARDS={getState:()=>({member:{id:"m1"}}),refresh:async()=>{},auth:{refreshSession:async()=>null}};
  w.fetch=async()=>{fetches++;return response(200,{orders:[],counts:{all:0,active:0,delivered:0,cancelled:0}})};
  try{
    w.eval(read("public/customer-orders-v1.js"));
    w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
    await wait(25);
    assert.equal(fetches,1,"customer orders should make one initial list request");
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

    w.dispatchEvent(new w.CustomEvent("zwm:auth-expired"));
    await wait(5);
    assert.equal(fetches,3,"auth expiry must settle without another orders request");
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
  w.ZWM_REWARDS={getState:()=>rewardState,refresh:async()=>{refreshes++;await wait(4);rewardState.lastAccountLoadAt=now},account:{refresh:async()=>{refreshes++;rewardState.lastAccountLoadAt=now}}};
  try{
    w.eval(read("public/account.js"));
    await wait(10);
    assert(intervals.some(x=>x.delay===120000),"account cadence should be 120 seconds");
    w.dispatchEvent(new w.Event("focus"));
    await wait(5);
    assert.equal(refreshes,0,"fresh account focus must not hit the API");
    now+=121000;
    w.dispatchEvent(new w.Event("focus"));
    w.dispatchEvent(new w.Event("pageshow"));
    w.document.dispatchEvent(new w.Event("visibilitychange"));
    await wait(12);
    assert.equal(refreshes,1,"focus/pageshow/visibility burst should collapse to one stale refresh");

    Object.defineProperty(w.document,"hidden",{configurable:true,value:true});
    now+=121000;
    w.document.dispatchEvent(new w.Event("visibilitychange"));
    await wait(5);
    assert.equal(refreshes,1,"hidden account tabs must stay quiet");
  }finally{
    dom.window.close();
  }
}

async function testAuthSingleFlight(){
  const dom=new JSDOM('<!doctype html><html lang="en"><body></body></html>',{url:"https://store.example/",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window;
  const key="zwm:mouneh:session:v1";
  let tokenCalls=0,expiredEvents=0;
  w.ZWM_CMS_CONFIG={enabled:true,supabaseUrl:"https://example.supabase.co",supabasePublishableKey:"public"};
  w.localStorage.setItem(key,JSON.stringify({access_token:"valid",refresh_token:"bad",expires_at:Math.floor(Date.now()/1000)+3600}));
  w.fetch=async(url,opt={})=>{
    const u=String(url);
    if(u.includes("/auth/v1/settings"))return response(200,{external:{google:false}});
    if(u.includes("/auth/v1/user"))return response(200,{id:"u1",email:"runtime@example.invalid"});
    if(u.includes("/auth/v1/token")){
      tokenCalls++;
      await wait(8);
      return response(400,{message:"Invalid Refresh Token"});
    }
    if(u.includes("/rest/v1/rpc/mouneh_api")){
      let action="";try{action=JSON.parse(opt.body||"{}").action||""}catch{}
      if(action==="public")return response(200,{rewards:[],campaigns:[],config:{}});
      if(action==="dashboard")return response(200,{member:null,orders:[],wallet:[],ledger:[]});
      return response(200,{});
    }
    return response(200,{});
  };
  w.addEventListener("zwm:auth-expired",()=>expiredEvents++);
  try{
    w.eval(read("public/mouneh-rewards-v8.js"));
    await wait(45);
    const result=await Promise.all([
      w.ZWM_REWARDS.auth.refreshSession(),
      w.ZWM_REWARDS.auth.refreshSession(),
      w.ZWM_REWARDS.auth.refreshSession()
    ]);
    assert.deepEqual(result,[null,null,null],"all concurrent refresh callers should settle signed out");
    assert.equal(tokenCalls,1,"concurrent components must share one refresh-token request");
    assert.equal(expiredEvents,1,"failed refresh must emit one settled auth-expired event");
    assert.equal(w.localStorage.getItem(key),null,"invalid session must be cleared once");
    await w.ZWM_REWARDS.auth.refreshSession();
    assert.equal(tokenCalls,1,"settled signed-out state must not start a refresh loop");
  }finally{
    dom.window.close();
  }
}

async function testNotificationStaleness(){
  const html='<!doctype html><html lang="en"><body data-page="account"><header class="site-header"><div class="nav-actions"></div></header><section data-account-panel="profile"></section></body></html>';
  const dom=new JSDOM(html,{url:"https://store.example/account#profile",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window;
  let now=400000,notificationGets=0,prefGets=0;
  const intervals=[];
  w.Date.now=()=>now;
  w.requestAnimationFrame=fn=>w.setTimeout(()=>fn(now),0);
  w.setInterval=(fn,delay)=>{intervals.push({fn,delay});return intervals.length};
  w.clearInterval=()=>{};
  w.matchMedia=()=>({matches:false});
  w.ZWM_CMS_CONFIG={supabaseUrl:"https://example.supabase.co",supabasePublishableKey:"public"};
  w.ZWM_REWARDS={auth:{refreshSession:async()=>null}};
  w.localStorage.setItem("zwm:mouneh:session:v1",JSON.stringify({access_token:"token",refresh_token:"refresh"}));
  w.fetch=async(url,opt={})=>{
    const u=String(url);
    if(u.includes("/auth/v1/user"))return response(200,{id:"u1"});
    if(u.includes("/rest/v1/notifications?")){notificationGets++;return response(200,[])}
    if(u.includes("/rest/v1/notification_preferences?select=")){prefGets++;return response(200,[])}
    if(u.includes("/rest/v1/notification_preferences?on_conflict="))return response(201,[]);
    return response(200,[]);
  };
  try{
    w.eval(read("public/customer-notifications-v1.js"));
    w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
    await wait(35);
    assert.equal(notificationGets,1,"notification bell should fetch once at boot");
    assert.equal(prefGets,1,"notification preferences should fetch once when the profile card mounts");
    assert(intervals.some(x=>x.delay===120000),"notification background cadence should be 120 seconds");

    w.dispatchEvent(new w.Event("focus"));
    await wait(8);
    assert.equal(notificationGets,1,"fresh focus must not refetch notifications");
    assert.equal(prefGets,1,"focus must not refetch device/preferences state");

    now+=61000;
    w.dispatchEvent(new w.Event("focus"));
    await wait(10);
    assert.equal(notificationGets,2,"stale notification state should refresh once");
    assert.equal(prefGets,1,"stale bell refresh must not reload profile preferences");

    w.dispatchEvent(new w.CustomEvent("zwm:auth-expired"));
    now+=121000;
    w.dispatchEvent(new w.Event("focus"));
    await wait(8);
    assert.equal(notificationGets,2,"signed-out notification state must stop background refreshes");
  }finally{
    dom.window.close();
  }
}

async function testAccountBootTimeout(){
  const dom=new JSDOM('<!doctype html><html lang="en"><body data-page="account"><div id="accountShell"></div></body></html>',{url:"https://store.example/account",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window;
  const timeoutFns=[];
  const nativeTimeout=w.setTimeout.bind(w);
  w.setTimeout=(fn,delay,...args)=>{if(delay===12000){timeoutFns.push(fn);return 999}return nativeTimeout(fn,delay,...args)};
  w.setInterval=()=>1;
  w.ZWM_REWARDS={getState:()=>({ready:false,session:false}),open(){}};
  try{
    w.eval(read("public/account.js"));
    assert.equal(timeoutFns.length,1,"account boot needs one finite timeout");
    timeoutFns[0]();
    const text=w.document.getElementById("accountShell").textContent;
    assert(!/Loading your account|Connecting to your account/.test(text),"account must leave the spinner after timeout");
    assert(/retry/i.test(text),"timed-out account state must offer a retry action");
  }finally{
    dom.window.close();
  }
}

function testCoordinationGuards(){
  const rewards=read("public/mouneh-rewards-v8.js");
  const site=read("public/site-runtime-v9.js");
  const notifications=read("public/customer-notifications-v1.js");
  const orders=read("public/customer-orders-v1.js");
  const order=read("public/order.js");
  const returns=read("public/returns-v1.js");
  const commerce=read("public/commerce-v1.js");
  assert.match(rewards,/refreshSessionInFlight/,"session refresh must be single-flight");
  assert.match(rewards,/dashboardLoadInFlight/,"dashboard refresh must be single-flight");
  assert.match(site,/CMS_STALE_MS\s*=\s*5\*60\*1000/,"CMS refresh should use a five-minute freshness window");
  assert.match(notifications,/REQUEST_TIMEOUT_MS=12000/,"notifications need a finite timeout");
  assert.match(orders,/REQUEST_TIMEOUT_MS=12000/,"customer orders need a finite timeout");
  assert.match(order,/ORDER_REFRESH_MS=30000/,"order detail should not poll every five seconds");
  assert.match(returns,/CONFIG_TIMEOUT_MS=8000/,"returns configuration loading needs a finite timeout");
  assert(!commerce.includes('observe(document.documentElement,{subtree:true,childList:true'),"commerce must not watch the entire document subtree");
}

(async()=>{
  await testCustomerOrders();
  await testAccountStaleness();
  await testAuthSingleFlight();
  await testNotificationStaleness();
  await testAccountBootTimeout();
  testCoordinationGuards();
  console.log("Runtime refresh regression passed: stale-aware account/orders/notifications, single-flight auth expiry, hidden-tab suppression, manual refresh, and finite failure states.");
})().catch(err=>{console.error(err);process.exitCode=1});
