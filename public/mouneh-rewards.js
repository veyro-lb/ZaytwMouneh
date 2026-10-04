(() => {
  "use strict";

  const AUTH_KEY="zwm:mouneh:session:v1";
  const CLAIMS_KEY="zwm:mouneh:claims:v1";
  const WALLET_KEY="zwm:mouneh:selected-wallet:v1";
  const CONFIG_SRC="admin-config.js?v=20261004-rewards3";
  const VERSION="20261004-rewards3";
  const state={config:null,session:null,publicData:{rewards:[],campaigns:[],config:{}},dashboard:null,loading:false,authMode:"signin",selectedWallet:"",lastSubtotal:0};

  const $=(id)=>document.getElementById(id);
  const esc=(v)=>String(v??"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const ar=()=>document.documentElement.lang==="ar"||document.documentElement.dir==="rtl";
  const tr=(en,arText)=>ar()?arText:en;
  const money=(v)=>"$"+(Number(v)||0).toFixed(2);
  const uuid=()=>crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(c)=>{const r=Math.random()*16|0,v=c==="x"?r:(r&3|8);return v.toString(16)});
  const claimToken=()=>{const a=new Uint8Array(32);crypto.getRandomValues(a);return Array.from(a,(n)=>n.toString(16).padStart(2,"0")).join("")};
  const safeJson=(raw,fallback)=>{try{return JSON.parse(raw)||fallback}catch{return fallback}};
  const saveLocal=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const readLocal=(k,f)=>{try{return safeJson(localStorage.getItem(k),f)}catch{return f}};
  const config=()=>window.ZWM_CMS_CONFIG||state.config||{};
  const baseUrl=()=>String(config().supabaseUrl||"").replace(/\/$/,"");
  const key=()=>config().supabasePublishableKey||"";

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src=src;s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }

  function readSession(){
    const s=readLocal(AUTH_KEY,null);
    if(!s||!s.access_token||!s.refresh_token)return null;
    return s;
  }
  function writeSession(s){
    state.session=s&&s.access_token?s:null;
    if(state.session)saveLocal(AUTH_KEY,state.session);
    else try{localStorage.removeItem(AUTH_KEY)}catch{}
  }
  function sessionExpired(s){
    if(!s)return true;
    const exp=Number(s.expires_at||0);
    return exp>0&&Date.now()/1000>exp-45;
  }
  async function authRequest(path,body,token){
    const headers={"apikey":key(),"Content-Type":"application/json"};
    if(token)headers.Authorization="Bearer "+token;
    const r=await fetch(baseUrl()+"/auth/v1/"+path,{method:"POST",headers,body:body===undefined?undefined:JSON.stringify(body)});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.msg||data.message||data.error_description||data.error||tr("Authentication failed.","تعذّر تسجيل الدخول."));
    return data;
  }
  async function refreshSession(){
    if(!state.session?.refresh_token)return null;
    try{
      const data=await authRequest("token?grant_type=refresh_token",{refresh_token:state.session.refresh_token});
      const s=data.session||data;
      if(s?.access_token)writeSession(s);
      return state.session;
    }catch{
      writeSession(null);state.dashboard=null;return null;
    }
  }
  async function validSession(){
    if(!state.session)state.session=readSession();
    if(state.session&&sessionExpired(state.session))await refreshSession();
    return state.session;
  }
  async function signIn(email,password){
    const data=await authRequest("token?grant_type=password",{email,password});
    const s=data.session||data;
    if(!s?.access_token)throw new Error(tr("Could not start your session.","تعذّر بدء الجلسة."));
    writeSession(s);
    await loadDashboard();
  }
  async function signUp(email,password){
    const data=await authRequest("signup",{email,password});
    const s=data.session||null;
    if(s?.access_token){writeSession(s);await loadDashboard();return {session:true};}
    return {session:false,user:data.user||null};
  }
  async function signOut(){
    const s=await validSession();
    if(s?.access_token){
      try{await authRequest("logout",undefined,s.access_token)}catch{}
    }
    writeSession(null);state.dashboard=null;state.selectedWallet="";try{localStorage.removeItem(WALLET_KEY)}catch{}
    render();renderCheckout();
  }

  async function rpc(action,p={},retry=true){
    const s=await validSession();
    const headers={"apikey":key(),"Content-Type":"application/json","Prefer":"return=representation"};
    if(s?.access_token)headers.Authorization="Bearer "+s.access_token;
    const r=await fetch(baseUrl()+"/rest/v1/rpc/mouneh_api",{method:"POST",headers,body:JSON.stringify({action,p})});
    const data=await r.json().catch(()=>({}));
    if(r.status===401&&s?.refresh_token&&retry){
      await refreshSession();
      return rpc(action,p,false);
    }
    if(!r.ok)throw new Error(data.message||data.hint||data.details||tr("Mouneh Points request failed.","تعذّر طلب نقاط المونة."));
    return data;
  }

  async function loadPublic(){
    try{state.publicData=await rpc("public",{},false)||state.publicData}catch{}
  }

  async function claimSavedOrders(){
    if(!state.session||!state.dashboard?.member)return;
    const claims=readLocal(CLAIMS_KEY,[]);
    if(!Array.isArray(claims)||!claims.length)return;
    const keep=[];
    for(const item of claims.slice(0,20)){
      try{await rpc("claim",{reference:item.reference,claim_token:item.claim_token});}
      catch(err){
        const msg=String(err.message||"");
        if(!/already linked|invalid/i.test(msg))keep.push(item);
      }
    }
    saveLocal(CLAIMS_KEY,keep);
    if(keep.length!==claims.length){
      try{state.dashboard=await rpc("dashboard",{})}catch{}
    }
  }

  async function loadDashboard(){
    const s=await validSession();
    if(!s){state.dashboard=null;render();return null;}
    try{
      state.dashboard=await rpc("dashboard",{});
      await claimSavedOrders();
    }catch(err){
      if(/Join Mouneh Rewards first/i.test(String(err.message||"")))state.dashboard={needsJoin:true};
      else if(/verified email/i.test(String(err.message||"")))state.dashboard={needsVerification:true};
      else throw err;
    }
    render();renderCheckout();
    return state.dashboard;
  }

  function nextReward(){
    const points=Number(state.dashboard?.member?.balance)||0;
    return (state.publicData.rewards||[]).filter(r=>r.active&&Number(r.points)>points).sort((a,b)=>Number(a.points)-Number(b.points))[0]||null;
  }
  function tierLabel(tier){
    return tier==="golden"?tr("Golden Pantry","المونة الذهبية"):tier==="olive"?tr("Olive Circle","دائرة الزيتون"):tr("Mouneh Member","عضو المونة");
  }
  function rewardCards(publicOnly=false){
    const balance=Number(state.dashboard?.member?.balance)||0;
    const rows=(state.publicData.rewards||[]).filter(r=>r.active).sort((a,b)=>Number(a.points)-Number(b.points));
    if(!rows.length)return '<p class="mr-empty">'+tr("Rewards are being prepared.","يتم تجهيز المكافآت.")+"</p>";
    return '<div class="mr-reward-grid">'+rows.map((r)=>{
      const can=!publicOnly&&balance>=Number(r.points);
      return '<article class="mr-reward-card '+(can?"is-ready":"")+'">'+
        '<span class="mr-leaf">🌿</span><strong>'+esc(r.points)+' '+tr("pts","نقطة")+'</strong>'+
        '<b>'+money(r.value)+" "+tr("off","خصم")+'</b>'+
        '<small>'+tr("Use on orders from ","تُستخدم على طلبات من ")+money(r.minimum)+'</small>'+
        (!publicOnly?'<button type="button" data-mr-redeem="'+esc(r.id)+'" '+(can?"":"disabled")+'>'+ (can?tr("Redeem","استبدال"):tr("Keep collecting","تابع التجميع")) +'</button>':"")+
      "</article>";
    }).join("")+"</div>";
  }

  function publicView(){
    return '<div class="mr-hero">'+
      '<div class="mr-hero-mark">🌿</div>'+
      '<p>'+tr("Mouneh Rewards","مكافآت المونة")+'</p>'+
      '<h2>'+tr("Your pantry gives back.","مونتك بتردّلك الجميل.")+'</h2>'+
      '<span>'+tr("Earn points on delivered orders, unlock rewards, referrals and member-only boosts.","اجمع نقاط على الطلبات المستلمة وافتح مكافآت وإحالات ومضاعفات خاصة بالأعضاء.")+'</span>'+
      '<div class="mr-rule"><strong>$1 = 1 🌿</strong><small>'+tr("Base earning rate · points confirm after delivery","المعدل الأساسي · تتثبت النقاط بعد الاستلام")+'</small></div>'+
    "</div>"+
    rewardCards(true)+
    '<div class="mr-auth-actions"><button class="mr-primary" type="button" data-mr-auth="signup">'+tr("Join Mouneh Rewards","انضم إلى مكافآت المونة")+'</button><button type="button" data-mr-auth="signin">'+tr("I already have an account","لدي حساب")+"</button></div>"+
    '<div class="mr-benefits"><span>+10 '+tr("welcome points","نقاط ترحيبية")+'</span><span>+20 '+tr("first delivered order","أول طلب مستلم")+'</span><span>+50 '+tr("when a referred friend qualifies","عند تأهل صديق مُحال")+"</span></div>";
  }

  function authView(){
    return '<div class="mr-auth">'+
      '<div class="mr-auth-tabs"><button type="button" data-mr-auth="signin" class="'+(state.authMode==="signin"?"is-active":"")+'">'+tr("Sign in","دخول")+'</button><button type="button" data-mr-auth="signup" class="'+(state.authMode==="signup"?"is-active":"")+'">'+tr("Create account","إنشاء حساب")+"</button></div>"+
      '<h2>'+(state.authMode==="signup"?tr("Start collecting Mouneh Points","ابدأ بجمع نقاط المونة"):tr("Welcome back","أهلاً بعودتك"))+'</h2>'+
      '<p>'+(state.authMode==="signup"?tr("Use an email you can access. You may be asked to verify it before joining.","استخدم بريداً يمكنك الوصول إليه. قد يُطلب منك تأكيده قبل الانضمام."):tr("Sign in to see your balance, vouchers and order history.","سجّل الدخول لرؤية رصيدك والقسائم وسجل الطلبات."))+'</p>'+
      '<form id="mrAuthForm"><label>'+tr("Email","البريد الإلكتروني")+'<input id="mrEmail" type="email" autocomplete="email" required></label><label>'+tr("Password","كلمة المرور")+'<input id="mrPassword" type="password" autocomplete="'+(state.authMode==="signup"?"new-password":"current-password")+'" minlength="8" required></label>'+
      '<button class="mr-primary" type="submit">'+(state.authMode==="signup"?tr("Create account","إنشاء الحساب"):tr("Sign in","تسجيل الدخول"))+'</button><span id="mrAuthStatus" class="mr-status"></span></form>'+
      '<button class="mr-text" type="button" data-mr-back>'+tr("Back to rewards","العودة للمكافآت")+"</button></div>";
  }

  function joinView(){
    if(state.dashboard?.needsVerification){
      return '<div class="mr-message"><span>✉</span><h2>'+tr("Verify your email first","أكد بريدك أولاً")+'</h2><p>'+tr("Open the verification email from Zayt w Mouneh, then come back and sign in.","افتح رسالة التأكيد من زيت ومونة ثم عد وسجّل الدخول.")+'</p><button type="button" class="mr-primary" data-mr-signout>'+tr("Use another account","استخدم حساباً آخر")+"</button></div>";
    }
    return '<div class="mr-join"><p>'+tr("One last step","خطوة أخيرة")+'</p><h2>'+tr("Join the Mouneh Club 🌿","انضم إلى نادي المونة 🌿")+'</h2><span>'+tr("You will start with 10 welcome points. Referral code is optional.","ستبدأ بـ10 نقاط ترحيبية. رمز الإحالة اختياري.")+'</span>'+
      '<form id="mrJoinForm"><label>'+tr("Your name","اسمك")+'<input id="mrJoinName" maxlength="120" required></label><label>'+tr("WhatsApp number","رقم واتساب")+'<input id="mrJoinPhone" type="tel" inputmode="tel" maxlength="40"></label><label>'+tr("Referral code (optional)","رمز الإحالة (اختياري)")+'<input id="mrReferral" maxlength="20"></label><button class="mr-primary" type="submit">'+tr("Join & get 10 points","انضم واحصل على 10 نقاط")+'</button><span id="mrJoinStatus" class="mr-status"></span></form>'+
      '<button class="mr-text" type="button" data-mr-signout>'+tr("Sign out","تسجيل الخروج")+"</button></div>";
  }

  function walletView(){
    const wallet=(state.dashboard?.wallet||[]).filter(w=>w.status!=="used");
    if(!wallet.length)return '<p class="mr-empty">'+tr("No vouchers yet. Redeem points to create one.","لا توجد قسائم بعد. استبدل النقاط لإنشاء واحدة.")+"</p>";
    return '<div class="mr-wallet-list">'+wallet.map(w=>'<article><div><span>'+tr("Reward voucher","قسيمة مكافأة")+'</span><strong>'+money(w.value)+' '+tr("off","خصم")+'</strong><small>'+tr("Minimum order ","حد أدنى للطلب ")+money(w.minimum)+' · '+(w.status==="reserved"?tr("Reserved","محجوزة"):tr("Available","متاحة"))+'</small></div><b class="mr-status-pill">'+esc(w.status)+'</b></article>').join("")+"</div>";
  }

  function ledgerView(){
    const rows=(state.dashboard?.ledger||[]).slice(0,8);
    if(!rows.length)return "";
    return '<div class="mr-ledger">'+rows.map(x=>'<div><span><b>'+esc(Number(x.points)>0?"+"+x.points:x.points)+' 🌿</b>'+esc(x.reason)+'</span><small>'+new Date(x.created_at).toLocaleDateString(ar()?"ar-LB":"en-LB",{month:"short",day:"numeric"})+'</small></div>').join("")+"</div>";
  }

  function dashboardView(){
    const m=state.dashboard.member||{};
    const points=Number(m.balance)||0;
    const next=nextReward();
    const nextPct=next?Math.min(100,points/Number(next.points)*100):100;
    const code=String(m.code||"");
    return '<div class="mr-member-head"><div><p>'+tr("Your Mouneh Points","نقاط المونة الخاصة بك")+'</p><strong>'+points.toLocaleString()+' <span>🌿</span></strong><small>'+esc(tierLabel(m.tier))+' · '+tr("annual delivered spend ","إنفاق سنوي مستلم ")+money(m.annual_spend)+'</small></div><span class="mr-tier '+esc(m.tier||"member")+'">'+esc(tierLabel(m.tier))+"</span></div>"+
      (next?'<div class="mr-progress"><div><span>'+tr("Next reward","المكافأة التالية")+'</span><b>'+esc(next.points-points)+' '+tr("points to ","نقطة للوصول إلى ")+money(next.value)+' '+tr("off","خصم")+'</b></div><i><em style="width:'+nextPct+'%"></em></i></div>':'<div class="mr-progress is-complete"><div><span>'+tr("Top milestone reached","وصلت لأعلى مرحلة")+'</span><b>'+tr("Redeem whenever you are ready.","استبدل نقاطك عندما تريد.")+"</b></div></div>")+
      '<section class="mr-section"><div class="mr-section-head"><div><p>'+tr("Rewards","المكافآت")+'</p><h3>'+tr("Turn points into vouchers","حوّل نقاطك إلى قسائم")+"</h3></div></div>"+rewardCards(false)+"</section>"+
      '<section class="mr-section"><div class="mr-section-head"><div><p>'+tr("Wallet","المحفظة")+'</p><h3>'+tr("Your available discounts","خصوماتك المتاحة")+"</h3></div></div>"+walletView()+"</section>"+
      '<section class="mr-referral"><div><p>'+tr("Invite a friend","ادعُ صديقاً")+'</p><h3>'+tr("Give the pantry a little push","شارك المونة مع من تحب")+'</h3><span>'+tr("Your friend gets a welcome boost after their qualifying first delivered order, and you get 50 points.","يحصل صديقك على دفعة ترحيبية بعد أول طلب مستلم مؤهل، وتحصل أنت على 50 نقطة.")+'</span></div><button type="button" data-mr-copy="'+esc(code)+'"><small>'+tr("Your code","رمزك")+'</small><strong>'+esc(code)+'</strong><em>'+tr("Copy","نسخ")+"</em></button></section>"+
      '<details class="mr-details"><summary>'+tr("Profile & birthday","الملف الشخصي وتاريخ الميلاد")+'</summary><form id="mrProfileForm"><label>'+tr("Name","الاسم")+'<input id="mrProfileName" value="'+esc(m.name||"")+'" maxlength="120"></label><label>'+tr("WhatsApp","واتساب")+'<input id="mrProfilePhone" value="'+esc(m.phone||"")+'" maxlength="40"></label><label>'+tr("Address","العنوان")+'<input id="mrProfileAddress" value="'+esc(m.address||"")+'" maxlength="500"></label><label>'+tr("Birthday","تاريخ الميلاد")+'<input id="mrProfileBirthday" type="date" value="'+esc(m.birthday||"")+'" '+(m.birthday?"disabled":"")+'></label><button type="submit">'+tr("Save profile","حفظ الملف")+'</button><span id="mrProfileStatus" class="mr-status"></span></form></details>'+
      '<section class="mr-section"><div class="mr-section-head"><div><p>'+tr("Recent activity","النشاط الأخير")+'</p><h3>'+tr("How your balance moved","حركة رصيدك")+"</h3></div></div>"+ledgerView()+"</section>"+
      '<div class="mr-footer-actions"><button type="button" data-mr-refresh>'+tr("Refresh","تحديث")+'</button><button type="button" data-mr-signout>'+tr("Sign out","تسجيل الخروج")+"</button></div>";
  }

  function render(){
    const body=$("mounehRewardsBody");
    if(!body)return;
    const badge=$("mounehPointsBadge");
    if(badge){
      const points=Number(state.dashboard?.member?.balance);
      badge.textContent=Number.isFinite(points)?points:"";
      badge.hidden=!Number.isFinite(points);
    }
    if(state.loading){body.innerHTML='<div class="mr-loading"><span>🌿</span><p>'+tr("Loading your Mouneh Points…","جارٍ تحميل نقاط المونة…")+"</p></div>";return;}
    if(state.session&&state.dashboard?.member)body.innerHTML=dashboardView();
    else if(state.session&&state.dashboard)body.innerHTML=joinView();
    else if(state.authMode==="signin-form"||state.authMode==="signup-form")body.innerHTML=authView();
    else body.innerHTML=publicView();
    body.dir=ar()?"rtl":"ltr";
  }

  function setDrawer(open){
    const drawer=$("mounehRewardsDrawer"),back=$("mounehRewardsBackdrop");
    if(!drawer||!back)return;
    drawer.classList.toggle("is-open",open);
    back.hidden=!open;
    document.body.classList.toggle("mouneh-rewards-open",open);
    drawer.setAttribute("aria-hidden",String(!open));
    if(open){
      state.loading=true;render();
      Promise.all([loadPublic(),validSession().then(()=>loadDashboard())]).catch(()=>{}).finally(()=>{state.loading=false;render();renderCheckout()});
    }
  }

  function injectUI(){
    if($("mounehRewardsDrawer"))return;
    const link=document.createElement("link");
    link.rel="stylesheet";link.href="mouneh-rewards.css?v="+VERSION;document.head.appendChild(link);

    const nav=document.querySelector(".nav-actions");
    let btn=$("mounehRewardsButton");
    if(!btn){
      btn=document.createElement("button");
      btn.type="button";btn.id="mounehRewardsButton";btn.className="mouneh-points-nav";
      btn.innerHTML='<span class="mr-nav-leaf">🌿</span><span class="mr-nav-copy">'+tr("Mouneh Points","نقاط المونة")+'</span><b id="mounehPointsBadge" hidden></b>';
      btn.setAttribute("aria-label",tr("Open Mouneh Points","فتح نقاط المونة"));
      btn.setAttribute("data-mr-open","");
      if(nav){
        const cart=nav.querySelector("#cartButton");
        nav.insertBefore(btn,cart||null);
      }else{
        btn.classList.add("is-floating");document.body.appendChild(btn);
      }
    }else{
      btn.setAttribute("aria-label",tr("Open Mouneh Points","فتح نقاط المونة"));
      btn.setAttribute("data-mr-open","");
      const copy=btn.querySelector(".mr-nav-copy");
      if(copy)copy.textContent=tr("Mouneh Points","نقاط المونة");
    }

    const back=document.createElement("div");
    back.id="mounehRewardsBackdrop";back.className="mouneh-rewards-backdrop";back.hidden=true;
    const drawer=document.createElement("aside");
    drawer.id="mounehRewardsDrawer";drawer.className="mouneh-rewards-drawer";drawer.setAttribute("aria-hidden","true");
    drawer.innerHTML='<header class="mr-drawer-head"><div><span>🌿</span><div><small>'+tr("Zayt w Mouneh","زيت ومونة")+'</small><strong>'+tr("Mouneh Points","نقاط المونة")+'</strong></div></div><button type="button" id="mounehRewardsClose" aria-label="'+tr("Close","إغلاق")+'">×</button></header><div id="mounehRewardsBody" class="mr-drawer-body"></div>';
    document.body.append(back,drawer);

    const form=$("orderForm");
    if(form&&!$("mounehCheckoutRewards")){
      const box=document.createElement("section");
      box.id="mounehCheckoutRewards";box.className="mouneh-checkout-rewards";
      const anchor=form.querySelector(".cart-whatsapp-ready")||form.querySelector("#sendOrderButton");
      form.insertBefore(box,anchor||null);
    }

    if(!btn.dataset.mrBound){btn.addEventListener("click",()=>setDrawer(true));btn.dataset.mrBound="1";}
    $("mounehRewardsClose").addEventListener("click",()=>setDrawer(false));
    back.addEventListener("click",()=>setDrawer(false));
    document.addEventListener("keydown",(e)=>{if(e.key==="Escape"&&drawer.classList.contains("is-open"))setDrawer(false)});
  }

  function availableWallet(subtotal){
    const wallet=(state.dashboard?.wallet||[]).filter(w=>w.status==="available"&&Number(subtotal)>=Number(w.minimum));
    return wallet.sort((a,b)=>Number(b.value)-Number(a.value));
  }
  function renderCheckout(){
    const box=$("mounehCheckoutRewards");
    if(!box)return;
    const subtotal=Number(state.lastSubtotal)||0;
    const m=state.dashboard?.member;
    if(!m){
      box.innerHTML='<button type="button" class="mr-checkout-join" data-mr-open><span>🌿</span><div><strong>'+tr("Earn Mouneh Points on this order","اجمع نقاط المونة على هذا الطلب")+'</strong><small>'+tr("Sign in or join before ordering. Points are confirmed when delivered.","سجّل الدخول أو انضم قبل الطلب. تتثبت النقاط عند الاستلام.")+"</small></div><b>↗</b></button>";
      return;
    }
    const wallet=availableWallet(subtotal);
    const stored=String(state.selectedWallet||readLocal(WALLET_KEY,"")||"");
    if(stored&&!wallet.some(w=>w.id===stored))state.selectedWallet="";
    else state.selectedWallet=stored;
    const maxBase=Math.floor(subtotal*Number(state.publicData.config?.base_rate||1)*(m.tier==="golden"?1.5:m.tier==="olive"?1.25:1));
    box.innerHTML='<div class="mr-checkout-member"><div><span>🌿</span><p><strong>'+esc(m.balance)+' '+tr("points","نقطة")+'</strong><small>'+tr("About ","حوالي ")+maxBase+" "+tr("base points after delivery","نقطة أساسية بعد الاستلام")+'</small></p></div><button type="button" data-mr-open>'+tr("View account","الحساب")+'</button></div>'+
      (wallet.length?'<label class="mr-voucher-select">'+tr("Use a reward voucher","استخدم قسيمة مكافأة")+'<select id="mounehWalletSelect"><option value="">'+tr("No voucher","بدون قسيمة")+'</option>'+wallet.map(w=>'<option value="'+esc(w.id)+'" '+(state.selectedWallet===w.id?"selected":"")+'>'+money(w.value)+' '+tr("off · min ","خصم · حد أدنى ")+money(w.minimum)+'</option>').join("")+'</select></label>':'<small class="mr-checkout-note">'+tr("No available voucher for this basket yet.","لا توجد قسيمة متاحة لهذه السلة حالياً.")+"</small>");
    const select=$("mounehWalletSelect");
    if(select)select.addEventListener("change",()=>{state.selectedWallet=select.value;saveLocal(WALLET_KEY,state.selectedWallet)});
  }

  function refreshCheckout(subtotal){
    state.lastSubtotal=Number(subtotal)||0;
    renderCheckout();
  }

  async function submitOrder(payload){
    await loadPublic();
    const request_id=uuid();
    const token=claimToken();
    const allowWallet=payload.allow_wallet!==false;
    const p={...payload,request_id,claim_token:token};
    delete p.allow_wallet;
    if(allowWallet&&state.dashboard?.member&&state.selectedWallet)p.wallet_id=state.selectedWallet;
    let result;
    try{result=await rpc("submit",p);}
    catch(err){
      if(/Failed to fetch|network/i.test(String(err.message||"")))result=await rpc("submit",p);
      else throw err;
    }
    if(result?.claim_token&&result?.reference&&!state.dashboard?.member){
      const claims=readLocal(CLAIMS_KEY,[]);
      if(!claims.some(x=>x.reference===result.reference)){
        claims.push({reference:result.reference,claim_token:result.claim_token,created_at:new Date().toISOString()});
        saveLocal(CLAIMS_KEY,claims.slice(-20));
      }
    }
    if(state.dashboard?.member){
      state.selectedWallet="";saveLocal(WALLET_KEY,"");
      try{state.dashboard=await rpc("dashboard",{})}catch{}
      render();renderCheckout();
    }
    return result;
  }

  async function redeem(rewardId,button){
    if(button)button.disabled=true;
    try{
      await rpc("redeem",{reward_id:rewardId,request_id:uuid()});
      state.dashboard=await rpc("dashboard",{});
      render();renderCheckout();
    }catch(err){alert(err.message||tr("Could not redeem reward.","تعذّر استبدال المكافأة."));if(button)button.disabled=false;}
  }

  async function join(form){
    const status=$("mrJoinStatus");
    const p={name:$("mrJoinName").value.trim(),phone:$("mrJoinPhone").value.trim(),referral:$("mrReferral").value.trim()};
    if(status)status.textContent=tr("Joining…","جارٍ الانضمام…");
    try{
      await rpc("join",p);
      state.dashboard=await rpc("dashboard",{});
      await claimSavedOrders();
      render();renderCheckout();
    }catch(err){if(status)status.textContent=err.message;}
  }
  async function saveProfile(){
    const status=$("mrProfileStatus");
    const p={name:$("mrProfileName").value.trim(),phone:$("mrProfilePhone").value.trim(),address:$("mrProfileAddress").value.trim(),birthday:$("mrProfileBirthday")?.value||""};
    if(status)status.textContent=tr("Saving…","جارٍ الحفظ…");
    try{
      await rpc("profile",p);
      state.dashboard=await rpc("dashboard",{});
      render();
    }catch(err){if(status)status.textContent=err.message;}
  }

  function bindActions(){
    document.addEventListener("click",async(e)=>{
      const auth=e.target.closest("[data-mr-auth]");
      if(auth){
        state.authMode=auth.dataset.mrAuth==="signup"?"signup-form":"signin-form";
        render();return;
      }
      if(e.target.closest("[data-mr-back]")){state.authMode="public";render();return;}
      if(e.target.closest("[data-mr-open]")){setDrawer(true);return;}
      if(e.target.closest("[data-mr-signout]")){await signOut();return;}
      if(e.target.closest("[data-mr-refresh]")){state.loading=true;render();try{await loadDashboard()}finally{state.loading=false;render()}return;}
      const redeemBtn=e.target.closest("[data-mr-redeem]");
      if(redeemBtn){await redeem(redeemBtn.dataset.mrRedeem,redeemBtn);return;}
      const copy=e.target.closest("[data-mr-copy]");
      if(copy){
        try{await navigator.clipboard.writeText(copy.dataset.mrCopy);copy.querySelector("em").textContent=tr("Copied","تم النسخ");}catch{}
      }
    });

    document.addEventListener("submit",async(e)=>{
      if(e.target.id==="mrAuthForm"){
        e.preventDefault();
        const status=$("mrAuthStatus"),email=$("mrEmail").value.trim(),password=$("mrPassword").value;
        if(status)status.textContent=tr("Working…","جارٍ التنفيذ…");
        try{
          if(state.authMode==="signup-form"){
            const out=await signUp(email,password);
            if(!out.session){if(status)status.textContent=tr("Account created. Check your email to verify it, then sign in.","تم إنشاء الحساب. تحقق من بريدك لتأكيده ثم سجّل الدخول.");return;}
          }else await signIn(email,password);
          state.authMode="public";render();
        }catch(err){if(status)status.textContent=err.message;}
        return;
      }
      if(e.target.id==="mrJoinForm"){e.preventDefault();await join(e.target);return;}
      if(e.target.id==="mrProfileForm"){e.preventDefault();await saveProfile();return;}
    });
  }

  async function init(){
    try{
      if(!window.ZWM_CMS_CONFIG)await loadScript(CONFIG_SRC);
      state.config=window.ZWM_CMS_CONFIG||{};
      if(!state.config.enabled||!state.config.supabaseUrl||!state.config.supabasePublishableKey)return;
      state.session=readSession();
      state.selectedWallet=readLocal(WALLET_KEY,"")||"";
      injectUI();
      bindActions();
      await loadPublic();
      if(state.session){try{await loadDashboard()}catch{}}
      render();renderCheckout();
      window.addEventListener("storage",(e)=>{
        if(e.key===AUTH_KEY){state.session=readSession();loadDashboard().catch(()=>{})}
      });
      new MutationObserver(()=>{const newAr=ar();const drawer=$("mounehRewardsDrawer");if(drawer&&drawer.dataset.mrAr!==String(newAr)){drawer.dataset.mrAr=String(newAr);render();renderCheckout();}}).observe(document.documentElement,{attributes:true,attributeFilter:["lang","dir"]});
    }catch(err){console.warn("Mouneh Rewards unavailable:",err);}
  }

  window.ZWM_REWARDS={submitOrder,refreshCheckout,open:()=>setDrawer(true),refresh:()=>loadDashboard(),getState:()=>({member:state.dashboard?.member||null,selectedWallet:state.selectedWallet})};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();