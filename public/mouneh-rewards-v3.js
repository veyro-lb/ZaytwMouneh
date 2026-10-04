(() => {
  "use strict";

  const AUTH_KEY="zwm:mouneh:session:v1";
  const CLAIMS_KEY="zwm:mouneh:claims:v1";
  const WALLET_KEY="zwm:mouneh:selected-wallet:v1";
  const REFERRAL_KEY="zwm:mouneh:pending-referral:v1";
  const LEGAL_PENDING_KEY="zwm:mouneh:legal-consent-pending:v1";
  const LEGAL_CONSENT_VERSION="2026-10-04";
  const CONFIG_SRC="admin-config.js?v=20261004-rewards4";
  const VERSION="20261004-account2";
  const state={config:null,session:null,authUser:null,publicData:{rewards:[],campaigns:[],config:{}},dashboard:null,loading:false,authMode:"signin",selectedWallet:"",lastSubtotal:0,pendingSignupEmail:"",authNotice:"",googleEnabled:null,pendingOpen:false,referralStatus:null};

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
  function normalizeReferral(value){
    return String(value||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,20);
  }
  function pendingReferral(){
    let fromUrl="";
    try{fromUrl=normalizeReferral(new URL(location.href).searchParams.get("ref")||"")}catch{}
    const stored=normalizeReferral(readLocal(REFERRAL_KEY,"")||"");
    const code=fromUrl||stored;
    if(code)saveLocal(REFERRAL_KEY,code);
    return code;
  }
  function clearPendingReferral(){
    try{localStorage.removeItem(REFERRAL_KEY)}catch{}
    try{
      const u=new URL(location.href);
      if(u.searchParams.has("ref")){
        u.searchParams.delete("ref");
        history.replaceState({},document.title,u.pathname+(u.search||"")+(u.hash||""));
      }
    }catch{}
  }
  function referralShareLink(code){
    const clean=normalizeReferral(code);
    return clean?location.origin+"/?ref="+encodeURIComponent(clean):location.origin+"/";
  }
  const authRedirectUrl=()=>location.origin+location.pathname+"?mouneh_auth=1";
  function cleanAuthUrl(){
    try{
      const u=new URL(location.href);
      ["mouneh_auth","error","error_code","error_description"].forEach(k=>u.searchParams.delete(k));
      u.hash="";
      history.replaceState({},document.title,u.pathname+(u.search||""));
    }catch{}
  }
  async function consumeAuthCallback(){
    const hash=new URLSearchParams(String(location.hash||"").replace(/^#/,""));
    const url=new URL(location.href);
    const err=hash.get("error_description")||hash.get("error")||url.searchParams.get("error_description")||url.searchParams.get("error");
    if(err){
      state.authNotice=decodeURIComponent(String(err).replace(/\+/g," "));
      state.authMode="signin-form";
      cleanAuthUrl();
      return false;
    }
    const access=hash.get("access_token"),refresh=hash.get("refresh_token");
    if(!access)return false;
    const expiresIn=Number(hash.get("expires_in")||3600);
    writeSession({
      access_token:access,
      refresh_token:refresh||"",
      token_type:hash.get("token_type")||"bearer",
      expires_in:expiresIn,
      expires_at:Number(hash.get("expires_at")||Math.floor(Date.now()/1000)+expiresIn)
    });
    await persistPendingLegalConsent();
    state.authMode="public";
    state.authNotice=tr("Email verified. Welcome to your Mouneh Points Wallet 🌿","تم تأكيد البريد. أهلاً بك في محفظة نقاط المونة 🌿");
    try{sessionStorage.setItem("zwm:mouneh:just-verified","1")}catch{}
    cleanAuthUrl();
    return true;
  }
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
  async function authRequest(path,body,token,method="POST"){
    const headers={"apikey":key(),"Content-Type":"application/json"};
    if(token)headers.Authorization="Bearer "+token;
    const r=await fetch(baseUrl()+"/auth/v1/"+path,{method,headers,body:method==="GET"||body===undefined?undefined:JSON.stringify(body)});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.msg||data.message||data.error_description||data.error||tr("Authentication failed.","تعذّر تسجيل الدخول."));
    return data;
  }
  async function authGet(path,token){return authRequest(path,undefined,token,"GET");}
  async function loadAuthSettings(){
    try{
      const data=await authGet("settings");
      state.googleEnabled=!!data?.external?.google;
    }catch{state.googleEnabled=null}
  }
  async function getAuthUser(){
    const s=await validSession();
    if(!s?.access_token){state.authUser=null;return null;}
    try{state.authUser=await authGet("user",s.access_token);return state.authUser}catch{state.authUser=null;return null}
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
    state.authUser=data.user||null;
    const acceptedAt=new Date().toISOString();
    try{
      const user=await authRequest("user",{data:{terms_accepted_at:acceptedAt,privacy_acknowledged_at:acceptedAt,legal_consent_version:LEGAL_CONSENT_VERSION}},s.access_token,"PUT");
      if(user)state.authUser=user;
    }catch{}
    await loadDashboard();
    await ensureMemberFromAuth();
  }
  async function signUp(email,password,name,phone,referral=""){
    const referralCode=normalizeReferral(referral||pendingReferral());
    if(referralCode)saveLocal(REFERRAL_KEY,referralCode);
    const path="signup?redirect_to="+encodeURIComponent(authRedirectUrl());
    const acceptedAt=new Date().toISOString();
    const data=await authRequest(path,{email,password,data:{full_name:name,name,phone,referral_code:referralCode,terms_accepted_at:acceptedAt,privacy_acknowledged_at:acceptedAt,legal_consent_version:LEGAL_CONSENT_VERSION}});
    const s=data.session||null;
    state.pendingSignupEmail=email;
    if(s?.access_token){
      writeSession(s);state.authUser=data.user||null;
      await loadDashboard();
      if(state.dashboard?.needsJoin)await secureJoin(name,phone,referralCode);
      await loadDashboard();
      return {session:true,user:data.user||null};
    }
    state.authMode="verify";
    return {session:false,user:data.user||null};
  }
  async function resendVerification(){
    const email=String(state.pendingSignupEmail||"").trim();
    if(!email)throw new Error(tr("Enter your email again to resend verification.","أدخل بريدك مجدداً لإعادة إرسال التأكيد."));
    await authRequest("resend?redirect_to="+encodeURIComponent(authRedirectUrl()),{type:"signup",email});
  }
  function rememberPendingLegalConsent(){
    try{sessionStorage.setItem(LEGAL_PENDING_KEY,new Date().toISOString())}catch{}
  }
  async function persistPendingLegalConsent(){
    let acceptedAt="";
    try{acceptedAt=String(sessionStorage.getItem(LEGAL_PENDING_KEY)||"")}catch{}
    if(!acceptedAt||!state.session?.access_token)return;
    try{
      const user=await authRequest("user",{data:{terms_accepted_at:acceptedAt,privacy_acknowledged_at:acceptedAt,legal_consent_version:LEGAL_CONSENT_VERSION}},state.session.access_token,"PUT");
      if(user)state.authUser=user;
      try{sessionStorage.removeItem(LEGAL_PENDING_KEY)}catch{}
    }catch{}
  }
  function legalConsentAccepted(status){
    const consent=$("mrLegalConsent");
    if(consent?.checked)return true;
    if(status)status.textContent=tr("Please agree to the Terms of Service and confirm that you have read the Privacy Policy to continue.","يرجى الموافقة على شروط الخدمة وتأكيد قراءتك لسياسة الخصوصية للمتابعة.");
    if(consent){consent.focus();try{consent.reportValidity()}catch{}}
    return false;
  }
  async function signInWithGoogle(){
    pendingReferral();
    if(state.googleEnabled===false)throw new Error(tr("Google sign-in is not enabled yet for this Zayt w Mouneh account.","تسجيل الدخول عبر Google غير مفعّل بعد لهذا الحساب."));
    rememberPendingLegalConsent();
    const redirect=encodeURIComponent(authRedirectUrl());
    const scopes=encodeURIComponent("openid email profile https://www.googleapis.com/auth/userinfo.email");
    location.assign(baseUrl()+"/auth/v1/authorize?provider=google&redirect_to="+redirect+"&scopes="+scopes);
  }
  async function ensureMemberFromAuth(){
    if(!state.session||!state.dashboard?.needsJoin)return;
    const user=await getAuthUser();
    const meta=user?.user_metadata||{};
    const name=String(meta.full_name||meta.name||"").trim();
    const phone=String(meta.phone||"").trim();
    if(name&&phone){
      try{
        await secureJoin(name,phone,pendingReferral()||meta.referral_code||"");
        state.dashboard=await rpc("dashboard",{});
        await loadReferralStatus();
      }catch{}
    }
  }
  async function signOut(){
    const s=await validSession();
    if(s?.access_token){
      try{await authRequest("logout",undefined,s.access_token)}catch{}
    }
    writeSession(null);state.dashboard=null;state.referralStatus=null;state.selectedWallet="";try{localStorage.removeItem(WALLET_KEY)}catch{}
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

  async function secureJoin(name,phone,referral=""){
    const code=normalizeReferral(referral||pendingReferral());
    const out=await rpc("join_secure",{name,phone,referral:code});
    clearPendingReferral();
    return out;
  }
  async function loadReferralStatus(){
    if(!state.session||!state.dashboard?.member){state.referralStatus=null;return null;}
    try{state.referralStatus=await rpc("referral_status",{});return state.referralStatus}
    catch{state.referralStatus=null;return null}
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
      await loadReferralStatus();
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
      '<div class="mr-wallet-preview"><span>◫</span><div><strong>'+tr("Mouneh Points Wallet","محفظة نقاط المونة")+'</strong><small>'+tr("Your redeemed vouchers stay together here until you use them.","تجتمع قسائمك المستبدلة هنا حتى تستخدمها.")+'</small></div></div>'+
    "</div>"+
    rewardCards(true)+
    '<div class="mr-auth-actions"><button class="mr-primary" type="button" data-mr-auth="signup">'+tr("Join Mouneh Rewards","انضم إلى مكافآت المونة")+'</button><button type="button" data-mr-auth="signin">'+tr("I already have an account","لدي حساب")+"</button></div>"+
    '<div class="mr-benefits"><span>+10 '+tr("welcome points","نقاط ترحيبية")+'</span><span>+20 '+tr("first delivered order","أول طلب مستلم")+'</span><span>+50 '+tr("when a referred friend qualifies","عند تأهل صديق مُحال")+"</span></div>";
  }

  function googleButton(){
    const disabled=state.googleEnabled===false;
    return '<button class="mr-google '+(disabled?"is-disabled":"")+'" type="button" data-mr-google '+(disabled?'disabled aria-disabled="true"':"")+'><span class="mr-google-g">G</span><strong>'+tr("Continue with Google","المتابعة عبر Google")+'</strong></button>'+
      (disabled?'<small class="mr-provider-note">'+tr("Google sign-in coming soon.","تسجيل الدخول عبر Google قريباً.")+'</small>':"");
  }

  function authView(){
    const signup=state.authMode==="signup-form";
    return '<div class="mr-auth">'+
      '<div class="mr-auth-tabs"><button type="button" data-mr-auth="signin" class="'+(!signup?"is-active":"")+'">'+tr("Sign in","دخول")+'</button><button type="button" data-mr-auth="signup" class="'+(signup?"is-active":"")+'">'+tr("Create account","إنشاء حساب")+"</button></div>"+
      '<h2>'+(signup?tr("Create your Zayt w Mouneh account","أنشئ حساب زيت ومونة"):tr("Welcome back","أهلاً بعودتك"))+'</h2>'+
      '<p>'+(signup?tr("One account for Mouneh Points, your wallet, rewards and future orders.","حساب واحد لنقاط المونة والمحفظة والمكافآت والطلبات القادمة."):tr("Sign in to open your Mouneh Points Wallet and rewards.","سجّل الدخول لفتح محفظة نقاط المونة ومكافآتك."))+'</p>'+
      '<label class="mr-legal-consent mr-auth-consent"><input id="mrLegalConsent" type="checkbox" form="mrAuthForm" required aria-required="true"><span>'+tr("I agree to the ","أوافق على ")+'<a href="/terms.html" target="_blank" rel="noopener">'+tr("Terms of Service","شروط الخدمة")+'</a>'+tr(" and confirm that I have read the "," وأقرّ بأنني قرأت ")+'<a href="/privacy.html" target="_blank" rel="noopener">'+tr("Privacy Policy","سياسة الخصوصية")+'</a>.</span></label>'+
      '<p class="mr-auth-legal">'+tr("Required before sign in, account creation, or Google sign-in.","يجب تحديد خانة الموافقة قبل تسجيل الدخول أو إنشاء حساب أو المتابعة عبر Google.")+'</p>'+
      googleButton()+
      '<div class="mr-or"><span></span><b>'+tr("or","أو")+'</b><span></span></div>'+
      '<form id="mrAuthForm" class="mr-auth-form '+(signup?"is-signup":"is-signin")+'">'+
      (signup?'<label>'+tr("Full name","الاسم الكامل")+'<input id="mrSignupName" name="name" autocomplete="name" maxlength="120" required></label>':"")+
      '<label>'+tr("Account email","بريد الحساب")+'<input id="mrEmail" type="email" autocomplete="email" required></label>'+
      (signup?'<label>'+tr("Phone / WhatsApp number","رقم الهاتف / واتساب")+'<input id="mrSignupPhone" type="tel" inputmode="tel" autocomplete="tel" maxlength="40" required></label><label>'+tr("Referral code (optional)","رمز الإحالة (اختياري)")+'<input id="mrSignupReferral" value="'+esc(pendingReferral())+'" maxlength="20" autocomplete="off" autocapitalize="characters" placeholder="'+tr("Friend’s code","رمز صديقك")+'"></label>':"")+
      '<label>'+tr("Password","كلمة المرور")+'<input id="mrPassword" type="password" autocomplete="'+(signup?"new-password":"current-password")+'" minlength="8" required></label>'+
      (signup?'<label>'+tr("Confirm password","تأكيد كلمة المرور")+'<input id="mrPasswordConfirm" type="password" autocomplete="new-password" minlength="8" required></label>':"")+
      '<button class="mr-primary" type="submit">'+(signup?tr("Create account & verify email","إنشاء الحساب وتأكيد البريد"):tr("Sign in","تسجيل الدخول"))+'</button>'+
      '<span id="mrAuthStatus" class="mr-status">'+esc(state.authNotice||"")+'</span></form>'+
      '<p class="mr-auth-trust">'+tr("Your account is securely stored with Zayt w Mouneh. We never store your password in plain text.","يُحفظ حسابك بأمان لدى زيت ومونة، ولا نخزن كلمة المرور كنص مكشوف.")+'</p>'+
      '<button class="mr-text" type="button" data-mr-back>'+tr("Back to rewards","العودة للمكافآت")+"</button></div>";
  }

  function verifyView(){
    const email=esc(state.pendingSignupEmail||"");
    return '<div class="mr-verify"><div class="mr-verify-mark">✉</div><p>'+tr("Zayt w Mouneh account","حساب زيت ومونة")+'</p><h2>'+tr("Check your email","تحقق من بريدك")+'</h2>'+
      '<span>'+tr("We sent a Zayt w Mouneh verification link to ","أرسلنا رابط تأكيد خاص بزيت ومونة إلى ")+'<strong>'+email+'</strong>. '+tr("Open it to confirm your email; you will return here signed in.","افتحه لتأكيد البريد وستعود إلى هنا وأنت مسجّل الدخول.")+'</span>'+
      '<div class="mr-verify-note"><b>🌿</b><div><strong>'+tr("After verification","بعد التأكيد")+'</strong><small>'+tr("Your name and phone are already saved, and your Mouneh Points Wallet will be created automatically.","سيكون اسمك ورقمك محفوظين وستُنشأ محفظة نقاط المونة تلقائياً.")+'</small></div></div>'+
      '<button type="button" class="mr-primary" data-mr-resend>'+tr("Resend verification email","إعادة إرسال رسالة التأكيد")+'</button>'+
      '<span id="mrVerifyStatus" class="mr-status"></span>'+
      '<button type="button" class="mr-text" data-mr-auth="signin">'+tr("Back to sign in","العودة لتسجيل الدخول")+'</button></div>';
  }

  function joinView(){
    const user=state.authUser||{};
    const meta=user.user_metadata||{};
    const name=esc(meta.full_name||meta.name||"");
    const phone=esc(meta.phone||"");
    const email=esc(user.email||"");
    if(state.dashboard?.needsVerification){
      return '<div class="mr-message"><span>✉</span><h2>'+tr("Verify your email first","أكد بريدك أولاً")+'</h2><p>'+tr("Open your Zayt w Mouneh verification email, then return here. We will recognize the verified account automatically.","افتح رسالة تأكيد زيت ومونة ثم عد إلى هنا وسنتعرف على الحساب المؤكد تلقائياً.")+'</p><button type="button" class="mr-primary" data-mr-signout>'+tr("Use another account","استخدم حساباً آخر")+"</button></div>";
    }
    return '<div class="mr-join"><p>'+tr("Finish your account","أكمل حسابك")+'</p><h2>'+tr("One quick step 🌿","خطوة أخيرة سريعة 🌿")+'</h2><span>'+tr("Google does not always share a phone number. We need these account details before opening your Mouneh Points Wallet.","Google لا يشارك رقم الهاتف دائماً. نحتاج هذه البيانات قبل فتح محفظة نقاط المونة.")+'</span>'+
      '<form id="mrJoinForm"><label>'+tr("Full name","الاسم الكامل")+'<input id="mrJoinName" value="'+name+'" maxlength="120" required></label><label>'+tr("Account email","بريد الحساب")+'<input id="mrJoinEmail" type="email" value="'+email+'" readonly required></label><label>'+tr("Phone / WhatsApp number","رقم الهاتف / واتساب")+'<input id="mrJoinPhone" type="tel" inputmode="tel" autocomplete="tel" value="'+phone+'" maxlength="40" required></label><label>'+tr("Referral code (optional)","رمز الإحالة (اختياري)")+'<input id="mrReferral" value="'+esc(pendingReferral())+'" maxlength="20" autocapitalize="characters"></label><button class="mr-primary" type="submit">'+tr("Open my Mouneh Points Wallet","افتح محفظة نقاط المونة")+'</button><span id="mrJoinStatus" class="mr-status"></span></form>'+
      '<button class="mr-text" type="button" data-mr-signout>'+tr("Sign out","تسجيل الخروج")+"</button></div>";
  }

  function accountIdentityView(){
    const m=state.dashboard?.member||{};
    const user=state.authUser||{};
    const email=String(user.email||"");
    const initial=String(m.name||email||"M").trim().charAt(0).toUpperCase()||"M";
    return '<section class="mr-account-identity"><span class="mr-account-avatar">'+esc(initial)+'</span><div><small>'+tr("Signed in as","الحساب الحالي")+'</small><strong>'+esc(m.name||tr("Mouneh member","عضو المونة"))+'</strong><em>'+esc(email||m.phone||"")+'</em></div><b>✓ '+tr("Verified","مؤكد")+'</b></section>';
  }

  function orderStatusLabel(status){
    const map=ar()
      ?{new:"تم استلام الطلب",confirmed:"تم التأكيد",preparing:"قيد التحضير",out_for_delivery:"خرج للتوصيل",delivered:"تم التسليم",cancelled:"ملغي"}
      :{new:"Order received",confirmed:"Confirmed",preparing:"Preparing",out_for_delivery:"Out for delivery",delivered:"Delivered",cancelled:"Cancelled"};
    return map[status]||String(status||"");
  }
  function recentOrdersView(){
    const rows=(state.dashboard?.orders||[]).slice(0,3);
    if(!rows.length)return "";
    return '<section class="mr-order-status"><div class="mr-section-head"><div><p>'+tr("Orders & points","الطلبات والنقاط")+'</p><h3>'+tr("What is confirmed and what is pending","ما تم تأكيده وما يزال قيد الانتظار")+'</h3></div></div><div class="mr-order-status-list">'+rows.map(o=>{
      const delivered=o.status==="delivered";
      const cancelled=o.status==="cancelled";
      const points=Number(o.awarded)||0;
      const pointLabel=delivered?("+"+points+" 🌿"):cancelled?tr("No points","بدون نقاط"):tr("Points pending","النقاط معلّقة");
      return '<article><div><strong>'+esc(o.reference)+'</strong><small>'+esc(orderStatusLabel(o.status))+' · '+money(o.total)+'</small></div><span class="'+(delivered?"is-confirmed":cancelled?"is-cancelled":"is-pending")+'">'+pointLabel+'</span></article>';
    }).join("")+'</div><small class="mr-order-proof">✓ '+tr("Points become final only after Zayt w Mouneh confirms the order as delivered.","تصبح النقاط نهائية فقط بعد أن تؤكد زيت ومونة أن الطلب تم تسليمه.")+'</small></section>';
  }
  function referralView(){
    const m=state.dashboard?.member||{};
    const rs=state.referralStatus||{};
    const code=String(rs.code||m.code||"");
    const joined=Number(rs.joined??state.dashboard?.referrals??0)||0;
    const qualified=Number(rs.qualified)||0;
    const pending=Math.max(0,Number(rs.pending??(joined-qualified))||0);
    const link=referralShareLink(code);
    return '<section class="mr-referral"><div class="mr-referral-main"><p>'+tr("Invite a friend","ادعُ صديقاً")+'</p><h3>'+tr("Share your pantry code","شارك رمز المونة الخاص بك")+'</h3><span>'+tr("You earn 50 points after your friend’s first qualifying $25+ order is actually delivered. Your friend gets a 20-point welcome bonus.","تحصل على 50 نقطة بعد تسليم أول طلب مؤهل لصديقك بقيمة 25$ أو أكثر، ويحصل صديقك على 20 نقطة ترحيبية.")+'</span><div class="mr-referral-stats"><small>'+tr("Joined","انضموا")+'<b>'+joined+'</b></small><small>'+tr("Waiting","بانتظار التسليم")+'<b>'+pending+'</b></small><small>'+tr("Qualified","تأهلوا")+'<b>'+qualified+'</b></small></div><em>✓ '+tr("Delivery is verified by Zayt w Mouneh in the owner order system before any referral points are issued.","يتم تأكيد التسليم من زيت ومونة في نظام الطلبات الخاص بالمالك قبل إصدار أي نقاط إحالة.")+'</em></div><button type="button" data-mr-copy="'+esc(link)+'"><small>'+tr("Your code","رمزك")+'</small><strong>'+esc(code)+'</strong><em>'+tr("Copy invite link","نسخ رابط الدعوة")+'</em></button></section>';
  }

  function walletView(){
    const wallet=(state.dashboard?.wallet||[]).filter(w=>w.status!=="used");
    if(!wallet.length)return '<p class="mr-empty">'+tr("No vouchers yet. Redeem points to create one.","لا توجد قسائم بعد. استبدل النقاط لإنشاء واحدة.")+"</p>";
    return '<div class="mr-wallet-list">'+wallet.map(w=>'<article><div><span>'+tr("Reward voucher","قسيمة مكافأة")+'</span><strong>'+money(w.value)+' '+tr("off","خصم")+'</strong><small>'+tr("Minimum order ","حد أدنى للطلب ")+money(w.minimum)+' · '+(w.status==="reserved"?tr("Reserved","محجوزة"):tr("Available","متاحة"))+'</small></div><b class="mr-status-pill">'+esc(w.status)+'</b></article>').join("")+"</div>";
  }

  function walletHero(){
    const rows=(state.dashboard?.wallet||[]).filter(w=>w.status!=="used");
    const available=rows.filter(w=>w.status==="available");
    const value=available.reduce((sum,w)=>sum+Number(w.value||0),0);
    const points=Number(state.dashboard?.member?.balance)||0;
    return '<section class="mr-wallet-hero"><div class="mr-wallet-title"><span>◫</span><div><p>'+tr("Mouneh Points Wallet","محفظة نقاط المونة")+'</p><h3>'+tr("Your points & vouchers in one place","نقاطك وقسائمك في مكان واحد")+'</h3></div></div><div class="mr-wallet-kpis"><div><small>'+tr("Points balance","رصيد النقاط")+'</small><strong>'+points.toLocaleString()+' 🌿</strong></div><div><small>'+tr("Available vouchers","القسائم المتاحة")+'</small><strong>'+available.length+' · '+money(value)+'</strong></div></div></section>';
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
      accountIdentityView()+
      '<a class="mr-full-account" href="account.html"><span>⌂</span><div><strong>'+tr("Open My Account","فتح حسابي")+'</strong><small>'+tr("Orders, rewards, referrals, addresses & security","الطلبات والمكافآت والإحالات والعناوين والأمان")+'</small></div><b>↗</b></a>'+
      (next?'<div class="mr-progress"><div><span>'+tr("Next reward","المكافأة التالية")+'</span><b>'+esc(next.points-points)+' '+tr("points to ","نقطة للوصول إلى ")+money(next.value)+' '+tr("off","خصم")+'</b></div><i><em style="width:'+nextPct+'%"></em></i></div>':'<div class="mr-progress is-complete"><div><span>'+tr("Top milestone reached","وصلت لأعلى مرحلة")+'</span><b>'+tr("Redeem whenever you are ready.","استبدل نقاطك عندما تريد.")+"</b></div></div>")+
      walletHero()+
      '<section class="mr-section"><div class="mr-section-head"><div><p>'+tr("Rewards","المكافآت")+'</p><h3>'+tr("Turn points into vouchers","حوّل نقاطك إلى قسائم")+"</h3></div></div>"+rewardCards(false)+"</section>"+
      '<section class="mr-section mr-wallet-section"><div class="mr-section-head"><div><p>'+tr("Mouneh Points Wallet","محفظة نقاط المونة")+'</p><h3>'+tr("Your reward vouchers","قسائم مكافآتك")+"</h3></div></div>"+walletView()+"</section>"+
      recentOrdersView()+
      referralView()+
      '<details class="mr-details"><summary>'+tr("Profile & birthday","الملف الشخصي وتاريخ الميلاد")+'</summary><form id="mrProfileForm"><label>'+tr("Name","الاسم")+'<input id="mrProfileName" value="'+esc(m.name||"")+'" maxlength="120"></label><label>'+tr("WhatsApp","واتساب")+'<input id="mrProfilePhone" value="'+esc(m.phone||"")+'" maxlength="40"></label><label>'+tr("Address","العنوان")+'<input id="mrProfileAddress" value="'+esc(m.address||"")+'" maxlength="500"></label><label>'+tr("Birthday","تاريخ الميلاد")+'<input id="mrProfileBirthday" type="date" value="'+esc(m.birthday||"")+'" '+(m.birthday?"disabled":"")+'></label><button type="submit">'+tr("Save profile","حفظ الملف")+'</button><span id="mrProfileStatus" class="mr-status"></span></form></details>'+
      '<section class="mr-section"><div class="mr-section-head"><div><p>'+tr("Recent activity","النشاط الأخير")+'</p><h3>'+tr("How your balance moved","حركة رصيدك")+"</h3></div></div>"+ledgerView()+"</section>"+
      '<div class="mr-footer-actions"><button type="button" data-mr-refresh>'+tr("Refresh","تحديث")+'</button><button type="button" data-mr-signout>'+tr("Sign out","تسجيل الخروج")+"</button></div>";
  }

  function notifyAccount(){
    try{document.dispatchEvent(new CustomEvent("zwm:account-updated",{detail:{signedIn:!!state.dashboard?.member}}))}catch{}
  }

  function render(){
    const body=$("mounehRewardsBody");
    const accountEntry=maintainAccountEntry();
    if(!body){notifyAccount();return;}
    const navBtn=maintainPointsButton();
    const navCopy=navBtn?.querySelector(".mr-nav-copy");
    if(navCopy){navCopy.textContent=tr("Mouneh Points","نقاط المونة");navCopy.style.setProperty("display","none","important");}
    const badge=$("mounehPointsBadge");
    if(badge){
      const points=Number(state.dashboard?.member?.balance);
      badge.textContent=Number.isFinite(points)?points:"—";
      badge.hidden=false;
      const memberName=String(state.dashboard?.member?.name||"").trim();
      if(navBtn)navBtn.setAttribute("aria-label",memberName&&Number.isFinite(points)?tr("Open Mouneh Points for ","فتح نقاط المونة لحساب ")+memberName+" · "+points+" "+tr("points","نقطة"):tr("Mouneh Points · sign in to see your balance","نقاط المونة · سجّل الدخول لرؤية رصيدك"));
    }
    if(state.loading){body.innerHTML='<div class="mr-loading"><span>🌿</span><p>'+tr("Loading your Mouneh Points…","جارٍ تحميل نقاط المونة…")+"</p></div>";notifyAccount();return;}
    if(state.session&&state.dashboard?.member)body.innerHTML=dashboardView();
    else if(state.session&&state.dashboard)body.innerHTML=joinView();
    else if(state.authMode==="verify")body.innerHTML=verifyView();
    else if(state.authMode==="signin-form"||state.authMode==="signup-form")body.innerHTML=authView();
    else body.innerHTML=publicView();
    body.dir=ar()?"rtl":"ltr";
    notifyAccount();
  }

  function setDrawer(open){
    const drawer=$("mounehRewardsDrawer"),back=$("mounehRewardsBackdrop");
    if(!drawer||!back)return;
    const isOpen=drawer.classList.contains("is-open");
    if(Boolean(open)===isOpen)return;
    if(open)window.ZWM_CLOSE_NAV?.();
    drawer.classList.toggle("is-open",open);
    back.hidden=!open;
    document.body.classList.toggle("mouneh-rewards-open",open);
    drawer.setAttribute("aria-hidden",String(!open));
    if(open){
      state.loading=true;render();
      Promise.all([loadPublic(),loadAuthSettings(),validSession().then(async()=>{if(state.session)await getAuthUser();await loadDashboard();await ensureMemberFromAuth();})]).catch(()=>{}).finally(()=>{state.loading=false;render();renderCheckout()});
    }
  }

  function requestOpen(){
    if(!$("mounehRewardsDrawer")){state.pendingOpen=true;return;}
    setDrawer(true);
  }
  function maintainAccountEntry(){
    const nav=document.querySelector(".nav-actions");
    let link=$("mounehAccountButton");
    if(!link){
      link=document.createElement("a");
      link.id="mounehAccountButton";
      link.className="mouneh-account-nav";
      link.href="account.html";
      link.innerHTML='<span class="mr-account-nav-avatar">●</span><span class="mr-account-nav-copy"></span>';
    }
    const member=state.dashboard?.member||null;
    const user=state.authUser||null;
    const first=member?.name?String(member.name).trim().split(/\s+/)[0]:"";
    const initial=(first||String(user?.email||"A")).charAt(0).toUpperCase();
    const avatar=link.querySelector(".mr-account-nav-avatar");
    const copy=link.querySelector(".mr-account-nav-copy");
    if(avatar)avatar.textContent=member?initial:"○";
    if(copy)copy.textContent=member?(first||tr("My Account","حسابي")):tr("Sign in","دخول");
    link.setAttribute("aria-label",member?tr("Open My Account for ","فتح حساب ")+(member.name||user?.email||""):tr("Sign in or open My Account","تسجيل الدخول أو فتح حسابي"));
    if(nav){
      const cart=nav.querySelector("#cartButton");
      nav.insertBefore(link,cart||null);
    }
    const duplicate=$("mounehAccountMenuLink");
    if(duplicate)duplicate.remove();
    return link;
  }
  function bindPointsButton(btn){
    if(!btn||btn.dataset.mrBound)return;
    btn.addEventListener("click",(e)=>{e.preventDefault();e.stopPropagation();requestOpen();});
    btn.dataset.mrBound="1";
  }
  function maintainPointsButton(){
    const nav=document.querySelector(".nav-actions");
    let btn=$("mounehRewardsButton");
    if(!btn){
      btn=document.createElement("button");
      btn.type="button";btn.id="mounehRewardsButton";btn.className="mouneh-points-nav";
      btn.innerHTML='<span class="mr-nav-leaf">🌿</span><span class="mr-nav-copy">'+tr("Mouneh Points","نقاط المونة")+'</span><b id="mounehPointsBadge">—</b>';
      btn.setAttribute("data-mr-open","");
    }
    btn.classList.add("mouneh-points-nav","is-compact");
    btn.removeAttribute("hidden");
    btn.setAttribute("data-mr-open","");
    btn.style.setProperty("display","flex","important");
    btn.style.setProperty("visibility","visible","important");
    btn.style.setProperty("opacity","1","important");
    btn.style.setProperty("flex-shrink","0","important");
    btn.style.setProperty("width","auto","important");
    btn.style.setProperty("min-width","52px","important");
    btn.style.setProperty("min-height","44px","important");
    btn.style.setProperty("padding","0 10px","important");
    btn.style.setProperty("gap","5px","important");
    let leaf=btn.querySelector(".mr-nav-leaf");
    if(!leaf){leaf=document.createElement("span");leaf.className="mr-nav-leaf";leaf.textContent="🌿";btn.prepend(leaf)}
    let copy=btn.querySelector(".mr-nav-copy");
    if(!copy){copy=document.createElement("span");copy.className="mr-nav-copy";copy.textContent=tr("Mouneh Points","نقاط المونة");btn.appendChild(copy)}
    copy.style.setProperty("display","none","important");
    let badge=btn.querySelector("#mounehPointsBadge");
    if(!badge){badge=document.createElement("b");badge.id="mounehPointsBadge";badge.textContent="—";btn.appendChild(badge)}
    badge.hidden=false;
    badge.style.setProperty("display","inline","important");
    const points=Number(state.dashboard?.member?.balance);
    badge.textContent=Number.isFinite(points)?points:"—";
    btn.setAttribute("aria-label",Number.isFinite(points)?tr("Open Mouneh Points · ","فتح نقاط المونة · ")+points+" "+tr("points","نقطة"):tr("Mouneh Points · sign in to see your balance","نقاط المونة · سجّل الدخول لرؤية رصيدك"));
    if(nav){
      const account=maintainAccountEntry();
      const cart=nav.querySelector("#cartButton");
      nav.insertBefore(btn,account||cart||null);
      btn.classList.remove("is-floating");
    }else if(!btn.isConnected){
      btn.classList.add("is-floating");
      document.body.appendChild(btn);
    }
    bindPointsButton(btn);
    return btn;
  }
  function startPointsButtonGuard(){
    if(window.__ZWM_POINTS_GUARD)return;
    window.__ZWM_POINTS_GUARD=true;
    let queued=false;
    const check=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;maintainAccountEntry();maintainPointsButton()})};
    new MutationObserver(check).observe(document.body,{childList:true,subtree:true});
    window.addEventListener("resize",check,{passive:true});
    window.addEventListener("orientationchange",check,{passive:true});
    window.addEventListener("pageshow",check);
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)check()});
    check();
  }

  function injectUI(){
    if($("mounehRewardsDrawer"))return;
    const link=document.createElement("link");
    link.rel="stylesheet";link.href="mouneh-rewards-v3.css?v="+VERSION;document.head.appendChild(link);

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

    maintainAccountEntry();
    bindPointsButton(btn);
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
    box.innerHTML='<div class="mr-checkout-member"><div><span>🌿</span><p><strong>'+esc(m.balance)+' '+tr("points","نقطة")+'</strong><small>'+tr("Earning for ","تُحتسب لحساب ")+esc(m.name||tr("your account","حسابك"))+' · '+tr("about ","حوالي ")+maxBase+" "+tr("points after delivery","نقطة بعد الاستلام")+'</small></p></div><button type="button" data-mr-open>'+tr("View account","الحساب")+'</button></div>'+
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
    if(p.name.length<2||p.phone.replace(/\D/g,"").length<7){if(status)status.textContent=tr("Name and a valid phone number are required.","الاسم ورقم هاتف صحيح مطلوبان.");return;}
    if(status)status.textContent=tr("Joining…","جارٍ الانضمام…");
    try{
      await secureJoin(p.name,p.phone,p.referral);
      state.dashboard=await rpc("dashboard",{});
      await loadReferralStatus();
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


  function authProviders(){
    const providers=new Set();
    const user=state.authUser||{};
    if(user.app_metadata?.provider)providers.add(String(user.app_metadata.provider));
    (user.identities||[]).forEach(x=>{if(x?.provider)providers.add(String(x.provider))});
    return Array.from(providers);
  }
  async function updateProfileData(p={}){
    await rpc("profile",{
      name:String(p.name||"").trim(),
      phone:String(p.phone||"").trim(),
      address:p.address===undefined?undefined:String(p.address||"").trim(),
      birthday:String(p.birthday||"")
    });
    state.dashboard=await rpc("dashboard",{});
    render();renderCheckout();
    return state.dashboard;
  }
  async function accountAddresses(action="list",p={}){
    return namedRpc("mouneh_addresses",{action,p});
  }
  async function savePreferredLanguage(language){
    const lang=language==="ar"?"ar":"en";
    await namedRpc("mouneh_account_preferences",{language:lang});
    state.dashboard=await rpc("dashboard",{});
    render();
    return lang;
  }
  async function changeAccountPassword(currentPassword,newPassword){
    const user=await getAuthUser();
    const email=String(user?.email||"").trim();
    const providers=authProviders();
    if(!providers.includes("email"))throw new Error(tr("This account signs in with Google. Manage its password through Google.","هذا الحساب يسجّل الدخول عبر Google. أدِر كلمة المرور من Google."));
    if(String(currentPassword||"").length<1)throw new Error(tr("Enter your current password.","أدخل كلمة المرور الحالية."));
    if(String(newPassword||"").length<8)throw new Error(tr("New password must be at least 8 characters.","يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل."));
    const signed=await authRequest("token?grant_type=password",{email,password:String(currentPassword)});
    const fresh=signed.session||signed;
    if(!fresh?.access_token)throw new Error(tr("Current password could not be verified.","تعذّر التحقق من كلمة المرور الحالية."));
    writeSession(fresh);
    const updated=await authRequest("user",{password:String(newPassword)},fresh.access_token,"PUT");
    state.authUser=updated||user;
    notifyAccount();
    return true;
  }
  async function finalizeAccountDeletion(confirmEmail){
    const email=String(confirmEmail||"").trim();
    await namedRpc("mouneh_delete_account",{confirm_email:email});
    writeSession(null);
    state.authUser=null;state.dashboard=null;state.referralStatus=null;state.selectedWallet="";
    try{localStorage.removeItem(WALLET_KEY)}catch{}
    try{sessionStorage.setItem("zwm:mouneh:account-deleted","1")}catch{}
    render();renderCheckout();
    return {deleted:true};
  }
  async function deleteAccountWithPassword(currentPassword,confirmEmail){
    const user=await getAuthUser();
    const email=String(user?.email||"").trim();
    if(email.toLowerCase()!==String(confirmEmail||"").trim().toLowerCase())throw new Error(tr("Type your account email exactly to confirm deletion.","اكتب بريد حسابك تماماً لتأكيد الحذف."));
    const providers=authProviders();
    if(!providers.includes("email"))return {needsGoogle:true};
    const signed=await authRequest("token?grant_type=password",{email,password:String(currentPassword||"")});
    const fresh=signed.session||signed;
    if(!fresh?.access_token)throw new Error(tr("Current password could not be verified.","تعذّر التحقق من كلمة المرور الحالية."));
    writeSession(fresh);
    return finalizeAccountDeletion(email);
  }
  async function deleteAccountWithGoogle(confirmEmail){
    const user=await getAuthUser();
    const email=String(user?.email||"").trim();
    if(email.toLowerCase()!==String(confirmEmail||"").trim().toLowerCase())throw new Error(tr("Type your account email exactly to confirm deletion.","اكتب بريد حسابك تماماً لتأكيد الحذف."));
    try{sessionStorage.setItem("zwm:mouneh:delete-pending",email)}catch{}
    return signInWithGoogle();
  }
  async function processPendingAccountDeletion(){
    let email="";
    try{email=String(sessionStorage.getItem("zwm:mouneh:delete-pending")||"")}catch{}
    if(!email||!state.session)return false;
    try{
      await finalizeAccountDeletion(email);
      try{sessionStorage.removeItem("zwm:mouneh:delete-pending")}catch{}
      return true;
    }catch(err){
      try{sessionStorage.removeItem("zwm:mouneh:delete-pending");sessionStorage.setItem("zwm:mouneh:delete-error",String(err.message||err))}catch{}
      return false;
    }
  }
  function openSignIn(){
    state.authMode="signin-form";
    render();
    requestOpen();
  }
  function openSignUp(){
    state.authMode="signup-form";
    render();
    requestOpen();
  }

  function bindActions(){
    if(window.__ZWM_REWARDS_ACTIONS_BOUND)return;
    window.__ZWM_REWARDS_ACTIONS_BOUND=true;
    document.addEventListener("click",async(e)=>{
      const auth=e.target.closest("[data-mr-auth]");
      if(auth){
        state.authMode=auth.dataset.mrAuth==="signup"?"signup-form":"signin-form";
        render();return;
      }
      if(e.target.closest("[data-mr-back]")){state.authMode="public";state.authNotice="";render();return;}
      const google=e.target.closest("[data-mr-google]");
      if(google){
        const status=$("mrAuthStatus");
        if(!legalConsentAccepted(status))return;
        if(google.dataset.mrBusy==="1")return;
        google.dataset.mrBusy="1";google.disabled=true;google.setAttribute("aria-busy","true");
        try{if(status)status.textContent=tr("Opening Google…","جارٍ فتح Google…");await signInWithGoogle()}catch(err){if(status)status.textContent=err.message;if(google.isConnected){google.disabled=state.googleEnabled===false;google.removeAttribute("aria-busy");delete google.dataset.mrBusy}}
        return;
      }
      const resend=e.target.closest("[data-mr-resend]");
      if(resend){
        if(resend.dataset.mrBusy==="1")return;
        resend.dataset.mrBusy="1";resend.disabled=true;resend.setAttribute("aria-busy","true");
        const status=$("mrVerifyStatus");
        try{if(status)status.textContent=tr("Sending…","جارٍ الإرسال…");await resendVerification();if(status)status.textContent=tr("Sent. Check your inbox and spam folder.","تم الإرسال. تحقق من الوارد والبريد غير المرغوب.")}catch(err){if(status)status.textContent=err.message}finally{if(resend.isConnected){resend.disabled=false;resend.removeAttribute("aria-busy");delete resend.dataset.mrBusy}}
        return;
      }
      if(e.target.closest("[data-mr-open]")){requestOpen();return;}
      const signout=e.target.closest("[data-mr-signout]");
      if(signout){if(signout.dataset.mrBusy==="1")return;signout.dataset.mrBusy="1";signout.disabled=true;try{await signOut()}finally{if(signout.isConnected){signout.disabled=false;delete signout.dataset.mrBusy}}return;}
      const refresh=e.target.closest("[data-mr-refresh]");
      if(refresh){if(refresh.dataset.mrBusy==="1")return;refresh.dataset.mrBusy="1";refresh.disabled=true;state.loading=true;render();try{await loadDashboard()}finally{state.loading=false;render()}return;}
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
        const form=e.target;
        if(form.dataset.mrBusy==="1")return;
        form.dataset.mrBusy="1";
        const submit=form.querySelector('button[type="submit"]');
        if(submit){submit.disabled=true;submit.setAttribute("aria-busy","true")}
        const status=$("mrAuthStatus"),email=$("mrEmail").value.trim(),password=$("mrPassword").value;
        if(!legalConsentAccepted(status)){delete form.dataset.mrBusy;if(submit){submit.disabled=false;submit.removeAttribute("aria-busy")}return;}
        if(status)status.textContent=tr("Working…","جارٍ التنفيذ…");
        try{
          if(state.authMode==="signup-form"){
            const name=$("mrSignupName").value.trim(),phone=$("mrSignupPhone").value.trim(),confirm=$("mrPasswordConfirm").value,referral=$("mrSignupReferral")?.value.trim()||pendingReferral();
            if(name.length<2)throw new Error(tr("Please enter your full name.","يرجى إدخال الاسم الكامل."));
            if(phone.replace(/\D/g,"").length<7)throw new Error(tr("Please enter a valid phone / WhatsApp number.","يرجى إدخال رقم هاتف / واتساب صحيح."));
            if(password!==confirm)throw new Error(tr("Passwords do not match.","كلمتا المرور غير متطابقتين."));
            const out=await signUp(email,password,name,phone,referral);
            if(!out.session){render();return;}
          }else await signIn(email,password);
          state.authMode="public";state.authNotice="";render();
        }catch(err){if(status)status.textContent=err.message;}
        finally{if(form.isConnected){delete form.dataset.mrBusy;if(submit){submit.disabled=false;submit.removeAttribute("aria-busy")}}}
        return;
      }
      if(e.target.id==="mrJoinForm"){
        e.preventDefault();const form=e.target;if(form.dataset.mrBusy==="1")return;form.dataset.mrBusy="1";const submit=form.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
        try{await join(form)}finally{if(form.isConnected){delete form.dataset.mrBusy;if(submit)submit.disabled=false}}return;
      }
      if(e.target.id==="mrProfileForm"){
        e.preventDefault();const form=e.target;if(form.dataset.mrBusy==="1")return;form.dataset.mrBusy="1";const submit=form.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
        try{await saveProfile()}finally{if(form.isConnected){delete form.dataset.mrBusy;if(submit)submit.disabled=false}}return;
      }
    });
  }

  async function init(){
    if(window.__ZWM_REWARDS_INIT_STARTED)return;
    window.__ZWM_REWARDS_INIT_STARTED=true;
    try{
      startPointsButtonGuard();
      if(!window.ZWM_CMS_CONFIG)await loadScript(CONFIG_SRC);
      state.config=window.ZWM_CMS_CONFIG||{};
      if(!state.config.enabled||!state.config.supabaseUrl||!state.config.supabasePublishableKey)return;
      state.session=readSession();
      state.selectedWallet=readLocal(WALLET_KEY,"")||"";
      pendingReferral();
      await consumeAuthCallback();
      injectUI();
      startPointsButtonGuard();
      bindActions();
      await Promise.all([loadPublic(),loadAuthSettings()]);
      if(state.session){
        try{
          await getAuthUser();
          await loadDashboard();
          await ensureMemberFromAuth();
          await processPendingAccountDeletion();
        }catch{}
      }
      render();renderCheckout();
      if(state.pendingOpen){state.pendingOpen=false;setDrawer(true);}
      try{
        if(sessionStorage.getItem("zwm:mouneh:just-verified")==="1"){
          sessionStorage.removeItem("zwm:mouneh:just-verified");
          setDrawer(true);
        }
      }catch{}
      window.addEventListener("storage",(e)=>{
        if(e.key===AUTH_KEY){state.session=readSession();loadDashboard().catch(()=>{})}
      });
      const liveSync=()=>{if(document.visibilityState==="hidden"||!state.session)return;loadDashboard().catch(()=>{})};
      window.addEventListener("focus",liveSync);
      document.addEventListener("visibilitychange",()=>{if(!document.hidden)liveSync()});
      setInterval(liveSync,15000);
      new MutationObserver(()=>{const newAr=ar();const drawer=$("mounehRewardsDrawer");if(drawer&&drawer.dataset.mrAr!==String(newAr)){drawer.dataset.mrAr=String(newAr);render();renderCheckout();}}).observe(document.documentElement,{attributes:true,attributeFilter:["lang","dir"]});
    }catch(err){console.warn("Mouneh Rewards unavailable:",err);}
  }

  window.ZWM_REWARDS={
    submitOrder,
    refreshCheckout,
    open:requestOpen,
    openSignIn,
    openSignUp,
    refresh:()=>loadDashboard(),
    getState:()=>({
      ready:!!state.config,
      session:!!state.session,
      member:state.dashboard?.member||null,
      dashboard:state.dashboard||null,
      authUser:state.authUser||null,
      referralStatus:state.referralStatus||null,
      publicData:state.publicData||{rewards:[],campaigns:[],config:{}},
      selectedWallet:state.selectedWallet,
      providers:authProviders()
    }),
    account:{
      addresses:accountAddresses,
      updateProfile:updateProfileData,
      saveLanguage:savePreferredLanguage,
      changePassword:changeAccountPassword,
      deleteWithPassword:deleteAccountWithPassword,
      deleteWithGoogle:deleteAccountWithGoogle,
      signOut,
      refresh:loadDashboard
    }
  };
  const earlyRewardsButton=$("mounehRewardsButton");
  if(earlyRewardsButton&&!earlyRewardsButton.dataset.mrBound)bindPointsButton(earlyRewardsButton);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();