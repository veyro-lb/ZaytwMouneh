const {JSDOM}=require("jsdom");
const fs=require("node:fs");
const assert=require("node:assert/strict");
const read=name=>fs.readFileSync("public/"+name,"utf8");
const wait=ms=>new Promise(r=>setTimeout(r,ms));

function response(status,data){
  return {ok:status>=200&&status<300,status,json:async()=>data};
}

async function authSingleFlight(){
  const dom=new JSDOM('<!doctype html><html lang="en"><body></body></html>',{url:"https://store.example/",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window;
  let tokenCalls=0,expiredEvents=0;
  w.ZWM_CMS_CONFIG={enabled:true,supabaseUrl:"https://service.example",supabasePublishableKey:"test"};
  w.fetch=async(url,opt={})=>{
    if(String(url).includes("/auth/v1/settings"))return response(200,{external:{google:false}});
    if(String(url).includes("/auth/v1/token")){
      tokenCalls++;
      await wait(8);
      return response(400,{message:"Invalid Refresh Token"});
    }
    if(String(url).includes("/rest/v1/rpc/mouneh_api"))return response(200,{rewards:[],campaigns:[],config:{}});
    return response(200,{});
  };
  w.document.addEventListener("zwm:session-expired",()=>expiredEvents++);
  try{
    w.eval(read("mouneh-rewards-v8.js"));
    await wait(30);
    const key="zwm:mouneh:session:v1";
    w.localStorage.setItem(key,JSON.stringify({access_token:"expired",refresh_token:"bad",expires_at:1}));
    const results=await Promise.all([
      w.ZWM_REWARDS.auth.refreshSession(),
      w.ZWM_REWARDS.auth.refreshSession(),
      w.ZWM_REWARDS.auth.refreshSession()
    ]);
    assert.deepEqual(results,[null,null,null]);
    assert.equal(tokenCalls,1,"concurrent auth failures must share one refresh-token request");
    assert.equal(expiredEvents,1,"expired session must settle once");
    assert.equal(w.localStorage.getItem(key),null,"invalid session storage must be cleared once");
    await w.ZWM_REWARDS.auth.refreshSession();
    assert.equal(tokenCalls,1,"settled signed-out state must not restart token refresh");
    console.log("runtime auth: concurrent refresh single-flight and one signed-out state passed");
  }finally{dom.window.close()}
}

async function accountResumeDedup(){
  const dom=new JSDOM('<!doctype html><html lang="en"><body data-page="account"><div id="accountShell"></div></body></html>',{url:"https://store.example/account#overview",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window,d=w.document;
  let now=1_000_000,refreshes=0,hidden=false;
  w.Date.now=()=>now;
  Object.defineProperty(d,"hidden",{configurable:true,get:()=>hidden});
  Object.defineProperty(d,"visibilityState",{configurable:true,get:()=>hidden?"hidden":"visible"});
  const member={name:"Runtime Test",balance:10,tier:"olive",phone:"0000000"};
  const state={ready:true,session:true,member,dashboard:{member,orders:[],wallet:[],ledger:[]},publicData:{rewards:[]},authUser:{email:"test@example.invalid"},lastAccountLoadAt:now};
  const refresh=async()=>{refreshes++;state.lastAccountLoadAt=now};
  w.ZWM_REWARDS={getState:()=>state,refresh,refreshIfStale:refresh,open(){},account:{}};
  w.requestAnimationFrame=fn=>w.setTimeout(fn,0);
  try{
    w.eval(read("account.js"));
    w.dispatchEvent(new w.Event("focus"));
    w.dispatchEvent(new w.PageTransitionEvent("pageshow"));
    d.dispatchEvent(new w.Event("visibilitychange"));
    await wait(0);
    assert.equal(refreshes,0,"fresh account state must not refresh on resume events");

    now+=91_000;
    w.dispatchEvent(new w.Event("focus"));
    w.dispatchEvent(new w.PageTransitionEvent("pageshow"));
    d.dispatchEvent(new w.Event("visibilitychange"));
    await wait(0);
    assert.equal(refreshes,1,"focus/pageshow/visibility burst must collapse to one stale refresh");

    d.dispatchEvent(new w.CustomEvent("zwm:account-updated",{detail:{updatedAt:now}}));
    await wait(0);
    assert.equal(refreshes,1,"account state notification must render without starting another request");

    hidden=true;now+=91_000;
    d.dispatchEvent(new w.Event("visibilitychange"));
    await wait(0);
    assert.equal(refreshes,1,"hidden account tabs must not refresh");
    hidden=false;
    w.dispatchEvent(new w.Event("focus"));
    await wait(0);
    assert.equal(refreshes,2,"account must refresh again after a real stale period");
    console.log("runtime account: idle/resume/stale/hidden dedup passed");
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
    const bootstrap=intervals.find(x=>x.ms===300);
    const poll=intervals.find(x=>x.ms>=60000);
    assert(bootstrap,"orders bootstrap timer missing");
    assert(poll&&poll.ms===60000,"orders periodic refresh must be one minute, not an 8-second loop");
    bootstrap.fn();
    await wait(5);
    assert.equal(fetches,1,"initial signed-in orders load must issue one list request");

    poll.fn();await wait(0);
    assert.equal(fetches,1,"fresh periodic tick must not refetch");
    now+=46_000;poll.fn();await wait(5);
    assert.equal(fetches,2,"stale visible orders must refresh");

    hidden=true;now+=60_000;poll.fn();await wait(0);
    assert.equal(fetches,2,"hidden tabs must skip periodic orders requests");
    hidden=false;
    d.querySelector("[data-customer-orders-refresh]").click();
    await wait(5);
    assert.equal(fetches,3,"manual Refresh must bypass the stale gate");

    d.dispatchEvent(new w.CustomEvent("zwm:account-updated"));
    await wait(0);
    assert.equal(fetches,3,"account render event must not duplicate a fresh orders request");
    console.log("runtime orders: 60s cadence, stale gate, hidden pause and manual refresh passed");
  }finally{dom.window.close()}
}

async function accountBootTimeout(){
  const dom=new JSDOM('<!doctype html><html lang="en"><body data-page="account"><div id="accountShell"></div></body></html>',{url:"https://store.example/account",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window,d=w.document;
  const timers=[];
  const nativeSetTimeout=w.setTimeout.bind(w);
  w.setTimeout=(fn,ms,...args)=>{if(ms===12000){timers.push(fn);return 999}return nativeSetTimeout(fn,ms,...args)};
  w.ZWM_REWARDS={getState:()=>({ready:false,session:false}),open(){}};
  try{
    w.eval(read("account.js"));
    assert(d.getElementById("accountShell").textContent.includes("Loading")||d.getElementById("accountShell").textContent.includes("Connecting"));
    assert.equal(timers.length,1,"account boot timeout must be finite");
    timers[0]();
    assert(!/Loading your account|Connecting to your account/.test(d.getElementById("accountShell").textContent),"account must leave its spinner after boot timeout");
    assert(/retry/i.test(d.getElementById("accountShell").textContent),"account timeout state must offer retry");
    console.log("runtime account: finite loading state passed");
  }finally{dom.window.close()}
}

(async()=>{
  await authSingleFlight();
  await accountResumeDedup();
  await customerOrdersCadence();
  await accountBootTimeout();
  console.log("Runtime stability regression passed.");
})().catch(err=>{console.error(err);process.exitCode=1});
