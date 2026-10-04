(() => {
  "use strict";
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const shell=()=>$("#accountShell");
  const ar=()=>document.documentElement.lang==="ar"||document.documentElement.dir==="rtl";
  const tr=(en,arText)=>ar()?arText:en;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money=v=>"$"+(Number(v)||0).toFixed(2);
  const requestedAuthOnLoad=(()=>{try{return new URL(location.href).searchParams.get("auth")||""}catch{return ""}})();
  let landingAfterAuth=!!requestedAuthOnLoad;
  let active=(location.hash||"#overview").slice(1);
  const allowed=new Set(["overview","points","orders","referrals","profile"]);
  if(!allowed.has(active))active="overview";
  let syncing=false, lastRenderSig="", lastSyncedAt=Date.now(), previousMemberState=null;

  function syncLanguageVisibility(){
    const showArabic=ar();
    $$(".only-en, .only-ar").forEach(el=>{
      const hide=showArabic?el.classList.contains("only-en"):el.classList.contains("only-ar");
      if(hide)el.style.setProperty("display","none","important");
      else el.style.removeProperty("display");
    });
  }

  function api(){return window.ZWM_REWARDS||null}
  function state(){try{return api()?.getState?.()||{}}catch{return {}}}
  function setLang(lang){
    const next=lang==="ar"?"ar":"en";
    try{localStorage.setItem("zwm-lang-v2",next)}catch{}
    document.documentElement.lang=next;document.documentElement.dir=next==="ar"?"rtl":"ltr";
    $$("[data-lang]").forEach(b=>b.classList.toggle("is-active",b.dataset.lang===next));
    syncLanguageVisibility();
    render(true);
  }
  function tierLabel(t){return t==="golden"?tr("Golden Pantry","المونة الذهبية"):t==="olive"?tr("Olive Circle","دائرة الزيتون"):tr("Mouneh Member","عضو المونة")}
  function statusLabel(s){return s==="delivered"?tr("Delivered","تم التسليم"):s==="cancelled"?tr("Cancelled","ملغي"):s==="confirmed"?tr("Confirmed","مؤكد"):tr("Pending","قيد الانتظار")}
  function navTabs(){
    const tabs=[["overview","⌂",tr("Overview","نظرة عامة")],["points","🌿",tr("Points & Wallet","النقاط والمحفظة")],["orders","▤",tr("Orders","الطلبات")],["referrals","↗",tr("Referrals","الإحالات")],["profile","⚙",tr("Profile & Security","الملف والأمان")]];
    return '<div class="account-tabs" role="tablist">'+tabs.map(([id,icon,label])=>'<button type="button" data-account-tab="'+id+'" class="'+(active===id?"is-active":"")+'" role="tab" aria-selected="'+(active===id)+'" aria-current="'+(active===id?"page":"false")+'"><span class="account-tab-icon">'+icon+'</span><span>'+label+'</span></button>').join("")+'</div>';
  }
  function guestView(s){
    return '<div class="account-guest">'+
      '<section class="account-card account-guest-main"><p class="account-eyebrow">'+tr("My Account","حسابي")+'</p><h1>'+tr("You are browsing as a guest.","أنت تتصفح كزائر.")+'</h1><p>'+tr("No customer account is active on this device. You can still shop normally, or sign in to keep your Mouneh Points, vouchers, delivered-order history and referral progress together.","لا يوجد حساب عميل مسجّل على هذا الجهاز. يمكنك التسوق بشكل عادي، أو تسجيل الدخول لحفظ نقاط المونة والقسائم وسجل الطلبات المستلمة وتقدم الإحالات في مكان واحد.")+'</p><div class="account-actions"><a class="is-primary" href="account.html?auth=signin">'+tr("Sign in","تسجيل الدخول")+'</a><a href="account.html?auth=signup">'+tr("Create account","إنشاء حساب")+'</a><a href="shop.html">'+tr("Continue shopping","متابعة التسوق")+'</a></div></section>'+
      '<aside class="account-card"><p class="account-eyebrow">'+tr("Why create an account?","لماذا تنشئ حساباً؟")+'</p><div class="account-benefits"><span><b>🌿</b>'+tr("See your live points balance and reward vouchers.","شاهد رصيد نقاطك وقسائم المكافآت مباشرة.")+'</span><span><b>✓</b>'+tr("Points are confirmed only after an order is actually delivered.","تتثبت النقاط فقط بعد تسليم الطلب فعلياً.")+'</span><span><b>↗</b>'+tr("Track referral progress without guessing whether it qualified.","تابع حالة الإحالات بوضوح ومعرفة ما إذا تأهلت.")+'</span><span><b>⌂</b>'+tr("Keep profile and account security settings in one place.","احتفظ ببيانات الملف وإعدادات أمان الحساب في مكان واحد.")+'</span></div><p>'+tr("Already ordered before creating an account? Eligible saved orders can be linked when the secure claim information is available on this device.","طلبت سابقاً قبل إنشاء الحساب؟ يمكن ربط الطلبات المؤهلة عند توفر معلومات الربط الآمنة على هذا الجهاز.")+'</p></aside>'+
    '</div>';
  }
  function overviewPanel(s,m){
    const wallet=(s.dashboard?.wallet||[]).filter(w=>w.status!=="used");
    const available=wallet.filter(w=>w.status==="available");
    const orders=s.dashboard?.orders||[];
    const rewards=(s.publicData?.rewards||[]).filter(r=>r.active).sort((a,b)=>Number(a.points)-Number(b.points));
    const points=Number(m.balance)||0;
    const next=rewards.find(r=>Number(r.points)>points);
    const pct=next?Math.min(100,points/Number(next.points)*100):100;
    const ledger=(s.dashboard?.ledger||[]).slice(0,6);
    return '<section class="account-panel" data-account-panel="overview" '+(active==="overview"?"":"hidden")+'>'+
      '<div class="account-grid"><article class="account-stat"><small>'+tr("Points balance","رصيد النقاط")+'</small><strong>'+points.toLocaleString()+' 🌿</strong></article><article class="account-stat"><small>'+tr("Available vouchers","القسائم المتاحة")+'</small><strong>'+available.length+' · '+money(available.reduce((n,w)=>n+Number(w.value||0),0))+'</strong></article><article class="account-stat"><small>'+tr("Orders on account","طلبات الحساب")+'</small><strong>'+orders.length+'</strong></article><article class="account-stat"><small>'+tr("Member tier","فئة العضوية")+'</small><strong>'+esc(tierLabel(m.tier))+'</strong></article></div>'+
      '<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Your next reward","مكافأتك التالية")+'</h2><p>'+tr("Your balance updates automatically when delivery status changes.","يتحدث رصيدك تلقائياً عند تغيّر حالة التسليم.")+'</p></div></div>'+(next?'<strong>'+esc(next.points-points)+' '+tr("points until ","نقطة للوصول إلى ")+money(next.value)+' '+tr("off","خصم")+'</strong><div class="account-progress"><span style="width:'+pct+'%"></span></div>':'<strong>'+tr("Top reward milestone reached.","وصلت إلى أعلى مرحلة مكافآت.")+'</strong>')+'</article>'+
      '<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Recent points activity","آخر حركة للنقاط")+'</h2></div><button class="account-primary" type="button" data-open-points>'+tr("Open rewards","فتح المكافآت")+'</button></div><div class="account-list">'+(ledger.length?ledger.map(x=>'<div class="account-row"><div><strong>'+esc((Number(x.points)>0?"+":"")+x.points)+' 🌿</strong><small>'+esc(x.reason||"")+'</small></div><span class="account-pill">'+new Date(x.created_at).toLocaleDateString(ar()?"ar-LB":"en-LB")+'</span></div>').join(""):'<p>'+tr("No points activity yet.","لا يوجد نشاط نقاط بعد.")+'</p>')+'</div></article>'+
    '</section>';
  }
  function pointsPanel(s,m){
    const points=Number(m.balance)||0;
    const wallet=(s.dashboard?.wallet||[]).filter(w=>w.status!=="used");
    const rewards=(s.publicData?.rewards||[]).filter(r=>r.active).sort((a,b)=>Number(a.points)-Number(b.points));
    return '<section class="account-panel" data-account-panel="points" '+(active==="points"?"":"hidden")+'>'+
      '<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Mouneh Points & Wallet","نقاط المونة والمحفظة")+'</h2><p>'+tr("Delivered orders earn points. Redeem them into vouchers when you reach a reward level.","الطلبات المستلمة تكسب نقاطاً. استبدلها بقسائم عند بلوغ مستوى المكافأة.")+'</p></div><button type="button" class="account-primary" data-open-points>'+tr("Manage rewards","إدارة المكافآت")+'</button></div><div class="account-grid" style="margin-top:16px"><article class="account-stat"><small>'+tr("Current balance","الرصيد الحالي")+'</small><strong>'+points.toLocaleString()+' 🌿</strong></article><article class="account-stat"><small>'+tr("Annual delivered spend","الإنفاق السنوي المستلم")+'</small><strong>'+money(m.annual_spend)+'</strong></article></div></article>'+
      '<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Reward ladder","سلم المكافآت")+'</h2></div></div><div class="account-reward-grid">'+(rewards.length?rewards.map(r=>'<div class="account-reward"><strong>'+esc(r.points)+' 🌿 · '+money(r.value)+' '+tr("off","خصم")+'</strong><small>'+tr("Minimum order ","حد أدنى للطلب ")+money(r.minimum)+'</small><span class="account-pill">'+(points>=Number(r.points)?tr("Ready","جاهزة"):tr("Keep collecting","تابع التجميع"))+'</span></div>').join(""):'<p>'+tr("Rewards are being prepared.","يتم تجهيز المكافآت.")+'</p>')+'</div></article>'+
      '<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Your vouchers","قسائمك")+'</h2></div></div><div class="account-list">'+(wallet.length?wallet.map(w=>'<div class="account-row"><div><strong>'+money(w.value)+' '+tr("off","خصم")+'</strong><small>'+tr("Minimum order ","حد أدنى للطلب ")+money(w.minimum)+'</small></div><span class="account-pill">'+esc(w.status)+'</span></div>').join(""):'<p>'+tr("No vouchers yet. Open rewards when you are ready to redeem points.","لا توجد قسائم بعد. افتح المكافآت عندما تصبح جاهزاً لاستبدال النقاط.")+'</p>')+'</div></article>'+
    '</section>';
  }
  function ordersPanel(s){
    const rows=s.dashboard?.orders||[];
    return '<section class="account-panel" data-account-panel="orders" '+(active==="orders"?"":"hidden")+'><article class="account-card"><div class="account-section-title"><div><h2>'+tr("Orders & points status","حالة الطلبات والنقاط")+'</h2><p>'+tr("Points become final only after Zayt w Mouneh confirms the order as delivered.","تصبح النقاط نهائية فقط بعد أن تؤكد زيت ومونة تسليم الطلب.")+'</p></div></div><div class="account-list">'+(rows.length?rows.map(o=>{const delivered=o.status==="delivered",cancelled=o.status==="cancelled";return '<div class="account-row"><div><strong>'+esc(o.reference||tr("Order","طلب"))+'</strong><small>'+statusLabel(o.status)+' · '+money(o.total)+'</small></div><span class="account-pill '+(!delivered&&!cancelled?"is-pending":cancelled?"is-cancelled":"")+'">'+(delivered?("+"+(Number(o.awarded)||0)+" 🌿"):cancelled?tr("No points","بدون نقاط"):tr("Points pending","النقاط معلّقة"))+'</span></div>'}).join(""):'<p>'+tr("No account-linked orders yet.","لا توجد طلبات مرتبطة بالحساب بعد.")+'</p>')+'</div></article></section>';
  }
  function referralsPanel(s,m){
    const rs=s.referralStatus||{}, code=String(rs.code||m.code||"");
    const joined=Number(rs.joined??s.dashboard?.referrals??0)||0, qualified=Number(rs.qualified)||0, pending=Math.max(0,Number(rs.pending??(joined-qualified))||0);
    const link=code?location.origin+"/?ref="+encodeURIComponent(code):location.origin+"/";
    return '<section class="account-panel" data-account-panel="referrals" '+(active==="referrals"?"":"hidden")+'><article class="account-card"><div class="account-section-title"><div><h2>'+tr("Invite friends, clearly","ادعُ أصدقاءك بوضوح")+'</h2><p>'+tr("You earn 50 points after a friend’s first qualifying $25+ order is actually delivered. The friend receives the current welcome referral bonus.","تحصل على 50 نقطة بعد تسليم أول طلب مؤهل لصديقك بقيمة 25$ أو أكثر. ويحصل الصديق على مكافأة الإحالة الترحيبية الحالية.")+'</p></div></div><div class="account-grid" style="margin-top:16px"><article class="account-stat"><small>'+tr("Joined","انضموا")+'</small><strong>'+joined+'</strong></article><article class="account-stat"><small>'+tr("Waiting for delivery","بانتظار التسليم")+'</small><strong>'+pending+'</strong></article><article class="account-stat"><small>'+tr("Qualified","تأهلوا")+'</small><strong>'+qualified+'</strong></article></div><div class="account-referral-code" style="margin-top:16px"><div><small>'+tr("Your referral code","رمز الإحالة")+'</small><strong>'+esc(code||"—")+'</strong></div><button type="button" class="account-primary" data-copy-ref="'+esc(link)+'">'+tr("Copy invite link","نسخ رابط الدعوة")+'</button></div><p>'+tr("Referral rewards are issued only after delivery is verified in the owner order system, so a code alone cannot create points.","لا تُصدر نقاط الإحالة إلا بعد التحقق من التسليم في نظام طلبات المالك، لذلك لا يمكن للرمز وحده إنشاء نقاط.")+'</p></article></section>';
  }
  function profilePanel(s,m){
    const email=s.authUser?.email||"", providers=(s.providers||[]).join(", ")||tr("Secure account","حساب آمن");
    return '<section class="account-panel" data-account-panel="profile" '+(active==="profile"?"":"hidden")+'>'+
      '<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Profile","الملف الشخصي")+'</h2><p>'+tr("Changes save directly to your account and update this page without a manual refresh.","تُحفظ التغييرات مباشرة في حسابك وتتحدث هذه الصفحة من دون تحديث يدوي.")+'</p></div></div><form id="accountProfileForm" class="account-form" style="margin-top:16px"><label>'+tr("Name","الاسم")+'<input name="name" maxlength="120" value="'+esc(m.name||"")+'" required></label><label>'+tr("WhatsApp","واتساب")+'<input name="phone" maxlength="40" value="'+esc(m.phone||"")+'"></label><label class="full">'+tr("Address","العنوان")+'<input name="address" maxlength="500" value="'+esc(m.address||"")+'"></label><label>'+tr("Birthday","تاريخ الميلاد")+'<input name="birthday" type="date" value="'+esc(m.birthday||"")+'" '+(m.birthday?"disabled":"")+'></label><label>'+tr("Preferred language","اللغة المفضلة")+'<select name="language"><option value="en" '+(!ar()?"selected":"")+'>English</option><option value="ar" '+(ar()?"selected":"")+'>العربية</option></select></label><div class="full"><button type="submit" class="account-primary">'+tr("Save profile","حفظ الملف")+'</button></div><p class="account-status full" id="accountProfileStatus"></p></form></article>'+
      '<div class="account-security"><article class="account-card"><p class="account-eyebrow">'+tr("Account identity","هوية الحساب")+'</p><h3>'+esc(email||tr("Verified customer account","حساب عميل موثّق"))+'</h3><p>'+tr("Sign-in method: ","طريقة الدخول: ")+esc(providers)+'. '+tr("Your password is handled by the authentication provider and is never shown here.","تتم إدارة كلمة المرور عبر مزود المصادقة ولا تظهر هنا أبداً.")+'</p></article>'+
      '<article class="account-card"><p class="account-eyebrow">'+tr("Password & security","كلمة المرور والأمان")+'</p><form id="accountPasswordForm" class="account-form"><label class="full">'+tr("Current password","كلمة المرور الحالية")+'<input name="currentPassword" type="password" autocomplete="current-password"></label><label class="full">'+tr("New password","كلمة المرور الجديدة")+'<input name="newPassword" type="password" minlength="8" autocomplete="new-password"></label><div class="full"><button type="submit" class="account-primary">'+tr("Change password","تغيير كلمة المرور")+'</button></div><p class="account-status full" id="accountPasswordStatus"></p></form></article></div>'+
      '<article class="account-card account-danger"><div class="account-section-title"><div><h2>'+tr("Session & legal","الجلسة والقانون")+'</h2><p>'+tr("Use sign out on shared devices. Privacy and program rules are always available below.","استخدم تسجيل الخروج على الأجهزة المشتركة. سياسة الخصوصية وقواعد البرنامج متاحة دائماً أدناه.")+'</p></div></div><div class="account-actions"><button type="button" data-account-signout>'+tr("Sign out","تسجيل الخروج")+'</button><a href="privacy.html">'+tr("Privacy Policy","سياسة الخصوصية")+'</a><a href="terms.html">'+tr("Terms of Service","شروط الخدمة")+'</a><a href="terms.html#terms-rewards">'+tr("Mouneh Points Rules","قواعد نقاط المونة")+'</a></div></article>'+
    '</section>';
  }
  function memberView(s,m){
    const first=String(m.name||"").trim().split(/\s+/)[0]||tr("there","بك");
    const initial=(first||String(s.authUser?.email||"A")).charAt(0).toUpperCase();
    const syncTime=new Date(lastSyncedAt).toLocaleTimeString(ar()?"ar-LB":"en-LB",{hour:"2-digit",minute:"2-digit"});
    return '<div class="account-layout"><aside class="account-side account-card"><div class="account-identity"><span class="account-avatar">'+esc(initial)+'</span><div><strong>'+esc(m.name||tr("My Account","حسابي"))+'</strong><small>'+esc(s.authUser?.email||"")+'</small></div></div>'+navTabs()+'<div class="account-side-note"><span class="account-sync"><i></i>'+tr("Auto-sync on","المزامنة التلقائية مفعّلة")+'</span><small>'+tr("Last checked ","آخر تحقق ")+esc(syncTime)+'</small></div></aside><div class="account-content"><header class="account-hero"><div><p class="account-eyebrow" style="color:#d8c16f">'+tr("My Zayt w Mouneh","حساب زيت ومونة")+'</p><h1>'+tr("Welcome, ","أهلاً، ")+esc(first)+'.</h1><p>'+esc(tierLabel(m.tier))+' · '+tr("Delivered-order rewards account","حساب مكافآت الطلبات المستلمة")+'</p></div><button class="account-balance" type="button" data-account-tab="points" aria-label="'+tr("Open Points & Wallet","فتح النقاط والمحفظة")+'"><small>'+tr("Mouneh Points","نقاط المونة")+'</small><strong>'+Number(m.balance||0).toLocaleString()+' 🌿</strong><em>'+tr("Open wallet","فتح المحفظة")+' →</em></button></header>'+overviewPanel(s,m)+pointsPanel(s,m)+ordersPanel(s)+referralsPanel(s,m)+profilePanel(s,m)+'</div></div>';
  }
  function render(force=false){
    const el=shell();if(!el)return;
    const s=state();
    const hasMember=!!(s.session&&s.member);
    if(hasMember&&(landingAfterAuth||previousMemberState===false)){
      active="overview";
      landingAfterAuth=false;
      try{
        const u=new URL(location.href);
        u.searchParams.delete("auth");
        history.replaceState({},document.title,u.pathname+(u.search||"")+"#overview");
      }catch{}
    }
    previousMemberState=hasMember;
    syncLanguageVisibility();
    const sig=JSON.stringify([active,ar(),!!s.session,s.member?.balance,s.member?.name,s.dashboard?.orders?.length,s.dashboard?.wallet?.length,s.referralStatus?.joined,s.referralStatus?.qualified,s.authUser?.email,lastSyncedAt]);
    if(!force&&sig===lastRenderSig)return;lastRenderSig=sig;
    if(!api()){el.innerHTML='<section class="account-loading"><span>🌿</span><strong>'+tr("Loading your account…","جارٍ تحميل حسابك…")+'</strong></section>';return}
    if(!s.session||!s.member){el.innerHTML=guestView(s);return}
    el.innerHTML=memberView(s,s.member);
  }
  async function sync(){
    if(syncing||document.visibilityState==="hidden")return;
    const a=api(),s=state(); if(!a||!s.session)return render();
    syncing=true;try{await a.refresh?.();lastSyncedAt=Date.now()}catch{}finally{syncing=false;render(true)}
  }
  document.addEventListener("click",async e=>{
    const tab=e.target.closest("[data-account-tab]"); if(tab){active=tab.dataset.accountTab;history.replaceState({},document.title,"#"+active);render(true);return}
    const auth=e.target.closest("[data-account-auth]"); if(auth){auth.dataset.accountAuth==="signup"?api()?.openSignUp?.():api()?.openSignIn?.();return}
    if(e.target.closest("[data-open-points]")){api()?.open?.();return}
    const copy=e.target.closest("[data-copy-ref]"); if(copy){try{await navigator.clipboard.writeText(copy.dataset.copyRef);copy.textContent=tr("Copied","تم النسخ")}catch{}return}
    const signout=e.target.closest("[data-account-signout]"); if(signout){signout.disabled=true;try{await api()?.account?.signOut?.();active="overview";render(true)}finally{signout.disabled=false}return}
    const lang=e.target.closest("[data-lang]"); if(lang)setLang(lang.dataset.lang);
    const toggle=e.target.closest("#navToggle"); if(toggle){const links=$("#navLinks"),open=toggle.getAttribute("aria-expanded")==="true";toggle.setAttribute("aria-expanded",String(!open));links?.classList.toggle("is-open",!open);document.body.classList.toggle("nav-open",!open)}
  });
  document.addEventListener("submit",async e=>{
    if(e.target.id==="accountProfileForm"){
      e.preventDefault();const f=e.target,status=$("#accountProfileStatus"),btn=f.querySelector('button[type="submit"]');btn.disabled=true;status.textContent=tr("Saving…","جارٍ الحفظ…");
      try{const data=new FormData(f);await api()?.account?.updateProfile?.({name:data.get("name"),phone:data.get("phone"),address:data.get("address"),birthday:data.get("birthday")||""});const lang=String(data.get("language")||"en");await api()?.account?.saveLanguage?.(lang);setLang(lang);status.textContent=tr("Saved.","تم الحفظ.");render(true)}catch(err){status.textContent=err.message||String(err)}finally{btn.disabled=false}return;
    }
    if(e.target.id==="accountPasswordForm"){
      e.preventDefault();const f=e.target,status=$("#accountPasswordStatus"),btn=f.querySelector('button[type="submit"]');btn.disabled=true;status.textContent=tr("Updating…","جارٍ التحديث…");
      try{const data=new FormData(f);await api()?.account?.changePassword?.(data.get("currentPassword"),data.get("newPassword"));f.reset();status.textContent=tr("Password updated.","تم تحديث كلمة المرور.")}catch(err){status.textContent=err.message||String(err)}finally{btn.disabled=false}return;
    }
  });
  document.addEventListener("zwm:account-updated",()=>{lastSyncedAt=Date.now();render(true)});
  window.addEventListener("focus",sync);
  window.addEventListener("online",sync);
  window.addEventListener("pageshow",sync);
  window.addEventListener("storage",e=>{if(!e.key||String(e.key).startsWith("zwm"))sync()});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)sync()});
  new MutationObserver(()=>render(true)).observe(document.documentElement,{attributes:true,attributeFilter:["lang","dir"]});
  const stored=(()=>{try{return localStorage.getItem("zwm-lang-v2")}catch{return null}})(); if(stored)setLang(stored); else syncLanguageVisibility();
  $("#accountYear") && ($("#accountYear").textContent=new Date().getFullYear());
  render(true);

  const requestedAuth=requestedAuthOnLoad;
  function openRequestedAuth(){
    if(!requestedAuth)return true;
    const a=api();
    const fn=requestedAuth==="signup"?a?.openSignUp:a?.openSignIn;
    if(typeof fn!=="function")return false;
    fn.call(a);
    try{
      const u=new URL(location.href);u.searchParams.delete("auth");
      history.replaceState({},document.title,u.pathname+(u.search||"")+(u.hash||""));
    }catch{}
    return true;
  }
  if(!openRequestedAuth()){
    let attempts=0;
    const authWait=setInterval(()=>{attempts+=1;if(openRequestedAuth()||attempts>80)clearInterval(authWait)},100);
  }
  setInterval(sync,10000);
})();