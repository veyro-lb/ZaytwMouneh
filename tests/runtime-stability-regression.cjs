const {JSDOM}=require("jsdom");
const fs=require("node:fs");
const assert=require("node:assert/strict");
const read=name=>fs.readFileSync("public/"+name,"utf8");
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const response=(status,data)=>({ok:status>=200&&status<300,status,json:async()=>data});

async function authSingleFlight(){
  const dom=new JSDOM('<!doctype html><html lang="en"><body></body></html>',{url:"https://store.example/",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window;
  let tokenCalls=0,expiredEvents=0;
  const key="zwm:mouneh:session:v1";
  w.ZWM_CMS_CONFIG={enabled:true,supabaseUrl:"https://service.example",supabasePublishableKey:"test"};
  w.localStorage.setItem(key,JSON.stringify({access_token:"valid",refresh_token:"bad",expires_at:Math.floor(Date.now()/1000)+3600}));
  w.fetch=async(url,opt={})=>{
    const u=String(url);
    if(u.includes("/auth/v1/settings"))return response(200,{external:{google:false}});
    if(u.includes("/auth/v1/user"))return response(200,{id:"user-1",email:"runtime@example.invalid"});
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
    w.eval(read("mouneh-rewards-v8.js"));
    await wait(40);
    const results=await Promise.all([
      w.ZWM_REWARDS.auth.refreshSession(),
      w.ZWM_REWARDS.auth.refreshSession(),
      w.ZWM_REWARDS.auth.refreshSession()
    ]);
    assert.deepEqual(results,[null,null,null]);
    assert.equal(tokenCalls,1,"concurrent auth failures must share one token refresh");
    assert.equal(expiredEvents,1,"expired auth must settle once");
    assert.equal(w.localStorage.getItem(key),null,"invalid session must be cleared");
    await w.ZWM_REWARDS.auth.refreshSession();
    assert.equal(tokenCalls,1,"settled signed-out state must not restart refresh");
    console.log("runtime auth: single-flight refresh and one signed-out state passed");
  }finally{dom.window.close()}
}

async function accountResumeDedup(){
  const dom=new JSDOM('<!doctype html><html lang="en"><body data-page="account"><div id="accountShell"></div></body></html>',{url:"https://store.example/account#overview",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window,d=w.document;
  let now=1_000_000,refreshes=0,hidden=false,nextId=1;
  const intervals=[];
  w.Date.now=()=>now;
  Object.defineProperty(d,"hidden",{configurable:true,get:()=>hidden});
  Object.defineProperty(d,"visibilityState",{configurable:true,get:()=>hidden?"hidden":"visible"});
  w.setInterval=(fn,ms)=>{const id=nextId++;intervals.push({id,fn,ms});return id};
  w.clearInterval=()=>{};
  const member={name:"Runtime Test",balance:10,tier:"olive",phone:"0000000"};
  const state={ready:true,session:true,member,dashboard:{member,orders:[],wallet:[],ledger:[]},publicData:{rewards:[]},authUser:{email:"test@example.invalid"},lastAccountLoadAt:now};
  const refresh=async()=>{refreshes++;await wait(4);state.lastAccountLoadAt=now};
  w.ZWM_REWARDS={getState:()=>state,refresh,open(){},account:{}};
  w.requestAnimationFrame=fn=>w.setTimeout(fn,0);
  try{
    w.eval(read("account.js"));
    assert(intervals.every(x=>x.ms>=120000),"account must not restore a tight polling loop");
    w.dispatchEvent(new w.Event("focus"));
    w.dispatchEvent(new w.PageTransitionEvent("pageshow"));
    d.dispatchEvent(new w.Event("visibilitychange"));
    await wait(8);
    assert.equal(refreshes,0,"fresh account state must not refresh on resume");

    now+=121000;
    w.dispatchEvent(new w.Event("focus"));
    w.dispatchEvent(new w.PageTransitionEvent("pageshow"));
    d.dispatchEvent(new w.Event("visibilitychange"));
    await wait(10);
    assert.equal(refreshes,1,"focus/pageshow/visibility burst must collapse to one stale refresh");

    hidden=true;now+=121000;d.dispatchEvent(new w.Event("visibilitychange"));await wait(0);
    assert.equal(refreshes,1,"hidden account tab must not refresh");
    hidden=false;w.dispatchEvent(new w.Event("focus"));await wait(8);
    assert.equal(refreshes,2,"account must refresh after a real stale period");
    console.log("runtime account: stale resume dedup and hidden pause passed");
  }finally{dom.window.close()}
}

async function customerOrdersCadence(){
  const html='<!doctype html><html lang="en"><body data-page="account"><div id="accountShell"><section data-account-panel="overview"><div class="account-grid"></div></section><section data-account-panel="orders"></section></div></body></html>';
  const dom=new JSDOM(html,{url:"https://store.example/account#orders",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window,d=w.document;
  let now=5_000_000,hidden=false,fetches=0,nextId=1;
  const intervals=[];
  w.Date.now=()=>now;
  Object.defineProperty(d,"hidden",{configurable:true,get:()=>hidden});
  Object.defineProperty(d,"visibilityState",{configurable:true,get:()=>hidden?"hidden":"visible"});
  w.requestAnimationFrame=fn=>w.setTimeout(fn,0);
  w.setInterval=(fn,ms)=>{const id=nextId++;intervals.push({id,fn,ms,active:true});return id};
  w.clearInterval=id=>{const row=intervals.find(x=>x.id===id);if(row)row.active=false};
  w.ZWM_CMS_CONFIG={supabaseUrl:"https://service.example",supabasePublishableKey:"test"};
  w.ZWM_REWARDS={getState:()=>({member:{id:"member"},session:true}),refresh:async()=>{},auth:{refreshSession:async()=>null}};
  w.localStorage.setItem("zwm:mouneh:session:v1",JSON.stringify({access_token:"valid",refresh_token:"refresh",expires_at:9999999999}));
  w.fetch=async url=>{
    if(String(url).includes("zwm_customer_orders")){fetches++;return response(200,{orders:[],counts:{all:0,active:0,delivered:0,cancelled:0}})}
    return response(200,{});
  };
  try{
    w.eval(read("customer-orders-v1.js"));
    const bootstrap=intervals.find(x=>x.ms===300),background=intervals.find(x=>x.ms>=120000);
    assert(bootstrap,"orders bootstrap timer missing");
    assert(background&&background.ms===120000,"orders background refresh must stay at two minutes");
    assert(!intervals.some(x=>x.ms===8000),"8-second orders polling must not return");

    bootstrap.fn();await wait(8);
    assert.equal(fetches,1,"initial signed-in orders load must issue one list request");
    background.fn();await wait(0);
    assert.equal(fetches,1,"fresh background tick must not refetch");

    now+=61000;d.dispatchEvent(new w.CustomEvent("zwm:account-updated"));await wait(8);
    assert.equal(fetches,2,"stale account orders must refresh after the freshness window");
    d.dispatchEvent(new w.CustomEvent("zwm:customer-order-changed"));await wait(8);
    assert.equal(fetches,3,"order-status signal must refresh immediately without page reload");

    hidden=true;now+=121000;background.fn();await wait(0);
    assert.equal(fetches,3,"hidden tabs must skip background orders requests");
    hidden=false;
    d.querySelector("[data-customer-orders-refresh]").click();await wait(8);
    assert.equal(fetches,4,"manual Refresh must always work");

    w.dispatchEvent(new w.CustomEvent("zwm:auth-expired"));await wait(0);
    assert.equal(fetches,4,"session-expired settlement must not start another orders request");
    console.log("runtime orders: event-driven refresh, 120s cadence, hidden pause and manual refresh passed");
  }finally{dom.window.close()}
}

async function notificationCadence(){
  const dom=new JSDOM('<!doctype html><html lang="en"><body><header class="site-header"><div class="nav-actions"></div></header></body></html>',{url:"https://store.example/",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window,d=w.document;
  let now=8_000_000,hidden=false,notificationGets=0,nextId=1;
  const intervals=[];
  w.Date.now=()=>now;
  Object.defineProperty(d,"hidden",{configurable:true,get:()=>hidden});
  Object.defineProperty(d,"visibilityState",{configurable:true,get:()=>hidden?"hidden":"visible"});
  w.requestAnimationFrame=fn=>w.setTimeout(fn,0);
  w.setInterval=(fn,ms)=>{const id=nextId++;intervals.push({id,fn,ms});return id};
  w.clearInterval=()=>{};
  w.ZWM_CMS_CONFIG={supabaseUrl:"https://service.example",supabasePublishableKey:"test"};
  w.ZWM_REWARDS={auth:{refreshSession:async()=>null}};
  w.localStorage.setItem("zwm:mouneh:session:v1",JSON.stringify({access_token:"valid",refresh_token:"refresh"}));
  w.fetch=async url=>{
    const u=String(url);
    if(u.includes("/auth/v1/user"))return response(200,{id:"user-1"});
    if(u.includes("/rest/v1/notifications?")){notificationGets++;return response(200,[])}
    return response(200,[]);
  };
  try{
    w.eval(read("customer-notifications-v1.js"));
    await wait(20);
    assert.equal(notificationGets,1,"notification bell should load once at boot");
    const bg=intervals.find(x=>x.ms===120000);assert(bg,"notification background cadence must be two minutes");

    w.dispatchEvent(new w.Event("focus"));await wait(0);
    assert.equal(notificationGets,1,"fresh focus must not refetch notifications");
    now+=61000;w.dispatchEvent(new w.Event("focus"));await wait(8);
    assert.equal(notificationGets,2,"stale focus should refresh notifications once");

    hidden=true;now+=121000;bg.fn();await wait(0);
    assert.equal(notificationGets,2,"hidden tabs must not poll notifications");
    w.dispatchEvent(new w.CustomEvent("zwm:auth-expired"));hidden=false;now+=121000;w.dispatchEvent(new w.Event("focus"));await wait(0);
    assert.equal(notificationGets,2,"signed-out notification state must stay quiet");
    console.log("runtime notifications: stale gate, hidden pause and signed-out quiet state passed");
  }finally{dom.window.close()}
}

async function accountBootTimeout(){
  const dom=new JSDOM('<!doctype html><html lang="en"><body data-page="account"><div id="accountShell"></div></body></html>',{url:"https://store.example/account",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window,d=w.document;
  const timers=[];
  const nativeSetTimeout=w.setTimeout.bind(w);
  w.setTimeout=(fn,ms,...args)=>{if(ms===12000){timers.push(fn);return 999}return nativeSetTimeout(fn,ms,...args)};
  w.setInterval=()=>1;
  w.ZWM_REWARDS={getState:()=>({ready:false,session:false}),open(){}};
  try{
    w.eval(read("account.js"));
    assert.equal(timers.length,1,"account boot timeout must be finite");
    timers[0]();
    assert(!/Loading your account|Connecting to your account/.test(d.getElementById("accountShell").textContent),"account must leave its spinner after timeout");
    assert(/retry/i.test(d.getElementById("accountShell").textContent),"account timeout state must offer retry");
    console.log("runtime account: finite loading state passed");
  }finally{dom.window.close()}
}

(async()=>{
  await authSingleFlight();
  await accountResumeDedup();
  await customerOrdersCadence();
  await notificationCadence();
  await accountBootTimeout();
  console.log("Runtime stability regression passed.");
})().catch(err=>{console.error(err);process.exitCode=1});
