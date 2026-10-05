(() => {
  "use strict";
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const shell=()=>$("#accountShell");
  const ar=()=>document.documentElement.lang==="ar"||document.documentElement.dir==="rtl";
  const tr=(en,arText)=>ar()?arText:en;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const ltr=v=>ar()?"\u2066"+String(v??"")+"\u2069":String(v??"");
  const money=v=>ltr("$"+(Number(v)||0).toFixed(2));
  function voucherStatusLabel(status){
    const s=String(status||"").toLowerCase();
    if(s==="available")return tr("Available","متاحة");
    if(s==="reserved")return tr("Reserved","محجوزة");
    if(s==="used")return tr("Used","مستخدمة");
    if(s==="expired")return tr("Expired","منتهية");
    if(s==="cancelled")return tr("Cancelled","ملغاة");
    return status||tr("Unknown","غير معروفة");
  }
  function providerLabel(provider){
    const p=String(provider||"").toLowerCase();
    if(p==="google")return "Google";
    if(p==="email"||p==="password"||p==="email_password")return tr("Email & password","البريد الإلكتروني وكلمة المرور");
    return provider||tr("Secure account","حساب آمن");
  }
  function ledgerReasonLabel(reason){
    const raw=String(reason||"").trim();
    const exact={
      "Welcome to Mouneh Rewards":tr("Welcome to Mouneh Rewards","مكافأة الانضمام إلى نقاط المونة"),
      "Delivered and paid order":tr("Delivered and paid order","طلب تم تسليمه واستلام دفعه"),
      "First delivered and paid order":tr("First delivered and paid order","مكافأة أول طلب تم تسليمه واستلام دفعه"),
      "Friend completed their first qualifying order":tr("Friend completed their first qualifying order","أكمل صديقك أول طلب مؤهل"),
      "Friend completed first qualifying delivered and paid order":tr("Friend completed first qualifying delivered and paid order","أكمل صديقك أول طلب مؤهل وتم تسليمه واستلام دفعه"),
      "Referral welcome bonus":tr("Referral welcome bonus","مكافأة ترحيبية للإحالة"),
      "Birthday surprise":tr("Birthday surprise","مفاجأة عيد الميلاد")
    };
    if(exact[raw])return exact[raw];
    if(ar()&&raw.startsWith("Owner voucher:"))return raw.replace(/^Owner voucher:\s*/,"قسيمة من المالك: ");
    return raw;
  }
  async function copyText(value){
    const text=String(value||"");
    if(!text)return false;
    try{
      if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(text);
        return true;
      }
    }catch{}
    try{
      const area=document.createElement("textarea");
      area.value=text;
      area.setAttribute("readonly","");
      area.style.position="fixed";
      area.style.opacity="0";
      area.style.pointerEvents="none";
      document.body.appendChild(area);
      area.select();
      area.setSelectionRange(0,text.length);
      const ok=document.execCommand("copy");
      area.remove();
      return !!ok;
    }catch{
      return false;
    }
  }
  const requestedAuthOnLoad=(()=>{try{return new URL(location.href).searchParams.get("auth")||""}catch{return ""}})();
  let landingAfterAuth=!!requestedAuthOnLoad;
  const initialHash=(location.hash||"").slice(1);
  let guestAuthMode=(requestedAuthOnLoad==="signup"||initialHash==="signup")?"signup":"signin";
  let active=initialHash||"overview";
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
  function requestFrenchTranslation(root){
    let french=false;
    try{french=localStorage.getItem("zwm:french:v1")==="1"}catch{}
    if(!french)return;
    requestAnimationFrame(()=>{
      try{
        if(typeof window.ZWM_APPLY_FRENCH==="function")window.ZWM_APPLY_FRENCH(root||shell());
        else document.dispatchEvent(new CustomEvent("zwm:translate-french",{detail:{root:root||shell()}}));
      }catch{}
    });
  }
  function setLang(lang){
    const next=lang==="ar"?"ar":"en";
    try{localStorage.setItem("zwm-lang-v2",next)}catch{}
    document.documentElement.lang=next;document.documentElement.dir=next==="ar"?"rtl":"ltr";
    $$("[data-lang]").forEach(b=>b.classList.toggle("is-active",b.dataset.lang===next));
    syncLanguageVisibility();
    render(true);
  }
  function tierLabel(t){return t==="golden"?tr("Golden Pantry","المونة الذهبية"):t==="olive"?tr("Olive Circle","دائرة الزيتون"):tr("Mouneh Member","عضو المونة")}
  function statusLabel(s){return s==="delivered"?tr("Delivered","تم التسليم"):s==="cancelled"?tr("Cancelled","ملغى"):s==="out_for_delivery"?tr("Out for delivery","خرج للتوصيل"):s==="preparing"?tr("Preparing","قيد التحضير"):s==="confirmed"?tr("Confirmed","مؤكد"):tr("Order received","تم استلام الطلب")}
  function activateAccountTab(next,{scrollOnMobile=true}={}){
    if(!allowed.has(next))return false;
    active=next;
    try{
      const u=new URL(location.href);
      u.hash=next;
      history.replaceState({},document.title,u.pathname+(u.search||"")+u.hash);
    }catch{}
    render(true);
    if(scrollOnMobile&&window.matchMedia?.("(max-width: 980px)")?.matches){
      requestAnimationFrame(()=>document.querySelector(".account-content")?.scrollIntoView({block:"start",behavior:"smooth"}));
    }
    return true;
  }
  function navTabs(){
    const tabs=[["overview","⌂",tr("Overview","نظرة عامة")],["points","🌿",tr("Points & Wallet","النقاط والمحفظة")],["orders","▤",tr("Orders","الطلبات")],["referrals","↗",tr("Referrals","الإحالات")],["profile","⚙",tr("Profile & Security","الملف والأمان")]];
    return '<div class="account-tabs" role="tablist">'+tabs.map(([id,icon,label])=>'<button type="button" data-account-tab="'+id+'" class="'+(active===id?"is-active":"")+'" role="tab" aria-selected="'+(active===id)+'" aria-current="'+(active===id?"page":"false")+'"><span class="account-tab-icon">'+icon+'</span><span>'+label+'</span></button>').join("")+'</div>';
  }
  function guestView(s){
    if(s.session&&s.dashboard?.needsJoin){
      const meta=s.authUser?.user_metadata||{};
      const suggestedName=String(meta.full_name||meta.name||"").trim();
      const email=String(s.authUser?.email||"").trim();
      return '<div class="account-auth-layout">'+
        '<section class="account-card account-auth-card account-complete-card">'+
          '<div class="account-auth-mark">✓</div>'+
          '<p class="account-eyebrow">'+tr("Google sign-in complete","تم تسجيل الدخول عبر Google")+'</p>'+
          '<h1>'+tr("One last step.","خطوة أخيرة.")+'</h1>'+
          '<p>'+tr("You are signed in"+(email?" as ":"")+(email?email:"")+". Add your phone number so orders, Mouneh Points and referrals stay securely linked to this account.","تم تسجيل دخولك"+(email?" بالبريد ":"")+(email?email:"")+". أضف رقم هاتفك لربط الطلبات ونقاط المونة والإحالات بهذا الحساب بشكل آمن.")+'</p>'+
          '<form id="accountCompleteForm" class="account-auth-form" autocomplete="on">'+
            '<label>'+tr("Full name","الاسم الكامل")+'<input id="accountCompleteName" name="name" autocomplete="name" maxlength="120" value="'+esc(suggestedName)+'" required></label>'+
            '<label>'+tr("Phone / WhatsApp number","رقم الهاتف / واتساب")+'<input id="accountCompletePhone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required></label>'+
            '<label class="account-complete-referral">'+tr("Referral code (optional)","رمز الإحالة (اختياري)")+'<input id="accountCompleteReferral" name="referral" maxlength="20" autocomplete="off" autocapitalize="characters" value="'+esc(s.pendingReferral||"")+'"></label>'+
            '<button class="account-primary account-auth-submit" type="submit">'+tr("Finish & open my dashboard","إكمال وفتح لوحة حسابي")+'</button>'+
            '<p id="accountCompleteStatus" class="account-status"></p>'+
          '</form>'+
          '<button type="button" class="account-secondary account-complete-signout" data-account-signout>'+tr("Use a different account","استخدام حساب آخر")+'</button>'+
        '</section>'+guestBenefits()+'</div>';
    }
    if(s.authMode==="verify"){
      const email=esc(s.pendingSignupEmail||"");
      return '<div class="account-auth-layout"><section class="account-card account-auth-card account-verify-card"><div class="account-auth-mark">✉</div><p class="account-eyebrow">'+tr("My Account","حسابي")+'</p><h1>'+tr("Check your email","تحقق من بريدك")+'</h1><p>'+tr("A verification email was requested for ","أرسلنا رابط تأكيد إلى ")+'<strong>'+email+'</strong>. '+tr("Open it to verify your email, then return here. If this email already belongs to an account, use Sign in instead. Your dashboard will open automatically after sign-in.","افتحه لتأكيد بريدك ثم عد إلى هنا. ستفتح لوحة حسابك تلقائياً بعد تسجيل الدخول.")+'</p><div class="account-actions"><button type="button" class="is-primary" data-account-resend>'+tr("Resend verification email","إعادة إرسال رسالة التأكيد")+'</button><button type="button" data-account-auth="signin">'+tr("Back to sign in","العودة لتسجيل الدخول")+'</button></div><p id="accountVerifyStatus" class="account-status" role="status"></p></section>'+guestBenefits()+'</div>';
    }
    const signup=guestAuthMode==="signup";
    const googleDisabled=s.googleEnabled===false;
    return '<div class="account-auth-layout">'+
      '<section class="account-card account-auth-card"><p class="account-eyebrow">'+tr("My Zayt w Mouneh","حساب زيت ومونة")+'</p><div class="account-auth-tabs" role="tablist"><button type="button" data-account-auth="signin" class="'+(!signup?"is-active":"")+'">'+tr("Sign in","تسجيل الدخول")+'</button><button type="button" data-account-auth="signup" class="'+(signup?"is-active":"")+'">'+tr("Create account","إنشاء حساب")+'</button></div>'+
      '<h1>'+(signup?tr("Create your account.","أنشئ حسابك."):tr("Welcome back.","أهلاً بعودتك."))+'</h1>'+
      '<p>'+(signup?tr("One account keeps your Mouneh Points, vouchers, orders and referrals together.","حساب واحد يجمع نقاط المونة والقسائم والطلبات والإحالات في مكان واحد."):tr("Sign in to open your full customer dashboard — not just the points wallet.","سجّل الدخول لفتح لوحة حسابك الكاملة، وليس محفظة النقاط فقط."))+'</p>'+
      '<div class="account-legal-consent">'+
        '<label class="account-legal-toggle" for="accountLegalConsent"><input id="accountLegalConsent" type="checkbox" form="accountAuthForm" required aria-required="true"><span class="account-legal-check" aria-hidden="true">✓</span><span>'+tr("I agree to the Terms of Service and confirm that I have read the Privacy Policy.","أوافق على شروط الخدمة وأقرّ بأنني قرأت سياسة الخصوصية.")+'</span></label>'+
        '<div class="account-legal-links"><a data-auth-legal-link="terms" href="/terms-and-rewards.html?rev=20261004-legal7" target="_blank" rel="noopener noreferrer">'+tr("Open Terms of Service","فتح شروط الخدمة")+' ↗</a><a data-auth-legal-link="privacy" href="/privacy-and-data.html?rev=20261004-legal7" target="_blank" rel="noopener noreferrer">'+tr("Open Privacy Policy","فتح سياسة الخصوصية")+' ↗</a></div>'+
      '</div>'+
      '<button class="account-google '+(googleDisabled?"is-disabled":"")+'" type="button" data-account-google '+(googleDisabled?'disabled aria-disabled="true"':"")+'><span>G</span><strong>'+tr("Continue with Google","المتابعة عبر Google")+'</strong></button>'+
      '<div class="account-or"><span></span><b>'+tr("or","أو")+'</b><span></span></div>'+
      '<form id="accountAuthForm" class="account-auth-form" novalidate>'+
        (signup?'<label>'+tr("Full name","الاسم الكامل")+'<input id="accountSignupName" name="name" autocomplete="name" maxlength="120" required></label>':"")+
        '<label>'+tr("Account email","بريد الحساب")+'<input id="accountEmail" name="email" type="email" autocomplete="email" required></label>'+
        (signup?'<label>'+tr("Phone / WhatsApp number","رقم الهاتف / واتساب")+'<input id="accountSignupPhone" name="phone" type="tel" autocomplete="tel" required></label>':"")+
        '<label>'+tr("Password","كلمة المرور")+'<input id="accountPassword" name="password" type="password" autocomplete="'+(signup?"new-password":"current-password")+'" minlength="8" required></label>'+
        (signup?'<label>'+tr("Confirm password","تأكيد كلمة المرور")+'<input id="accountPasswordConfirm" name="passwordConfirm" type="password" autocomplete="new-password" minlength="8" required></label><label>'+tr("Referral code (optional)","رمز الإحالة (اختياري)")+'<input id="accountSignupReferral" name="referral" value="'+esc(s.pendingReferral||"")+'" maxlength="20" autocomplete="off" autocapitalize="characters"></label>':"")+
        '<button class="account-primary account-auth-submit" type="submit">'+(signup?tr("Create my account","إنشاء حسابي"):tr("Sign in to dashboard","تسجيل الدخول إلى اللوحة"))+'</button>'+
        '<p id="accountAuthStatus" class="account-status" role="status">'+esc(s.authNotice||"")+'</p>'+
      '</form>'+
      '<p class="account-auth-note">'+tr("After sign-in, this page becomes your dashboard with Overview, Points & Wallet, Orders, Referrals, and Profile & Security.","بعد تسجيل الدخول تتحول هذه الصفحة إلى لوحة حسابك وتضم النظرة العامة والنقاط والمحفظة والطلبات والإحالات والملف والأمان.")+'</p>'+
      '</section>'+guestBenefits()+'</div>';
  }
  function guestBenefits(){
    return '<aside class="account-card account-auth-side"><p class="account-eyebrow">'+tr("Inside your dashboard","داخل لوحة حسابك")+'</p><h2>'+tr("Everything in one place.","كل شيء في مكان واحد.")+'</h2><div class="account-benefits"><span><b>⌂</b>'+tr("Overview with your balance, vouchers, orders and tier.","نظرة عامة على الرصيد والقسائم والطلبات والفئة.")+'</span><span><b>🌿</b>'+tr("Mouneh Points & Wallet with reward progress.","نقاط المونة والمحفظة مع تقدم المكافآت.")+'</span><span><b>▤</b>'+tr("Account-linked order history and delivery status.","سجل الطلبات المرتبطة بالحساب وحالة التسليم.")+'</span><span><b>↗</b>'+tr("Referral progress with delivery-verified qualification.","متابعة الإحالات مع التحقق من التسليم.")+'</span><span><b>⚙</b>'+tr("Profile, language and account security controls.","الملف واللغة وإعدادات أمان الحساب.")+'</span></div><a class="account-auth-shop" href="shop.html">'+tr("Continue shopping instead","متابعة التسوق بدلاً من ذلك")+' →</a></aside>';
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
      '<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Your next reward","مكافأتك التالية")+'</h2><p>'+tr("Your balance updates automatically after delivery and payment are both confirmed.","يتحدث رصيدك تلقائياً بعد تأكيد التسليم واستلام الدفع.")+'</p></div></div>'+(next?'<strong>'+esc(next.points-points)+' '+tr("points until ","نقطة للوصول إلى ")+money(next.value)+' '+tr("off","خصم")+'</strong><div class="account-progress"><span style="width:'+pct+'%"></span></div>':'<strong>'+tr("Top reward milestone reached.","وصلت إلى أعلى مرحلة مكافآت.")+'</strong>')+'</article>'+
      '<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Recent points activity","آخر حركة للنقاط")+'</h2></div><button class="account-primary" type="button" data-open-points>'+tr("Open rewards","فتح المكافآت")+'</button></div><div class="account-list">'+(ledger.length?ledger.map(x=>'<div class="account-row"><div><strong>'+esc((Number(x.points)>0?"+":"")+x.points)+' 🌿</strong><small>'+esc(x.reason||"")+'</small></div><span class="account-pill">'+new Date(x.created_at).toLocaleDateString(ar()?"ar-LB":"en-LB")+'</span></div>').join(""):'<p>'+tr("No points activity yet.","لا يوجد نشاط نقاط بعد.")+'</p>')+'</div></article>'+
    '</section>';
  }
  function pointsPanel(s,m){
    const points=Number(m.balance)||0;
    const wallet=(s.dashboard?.wallet||[]).filter(w=>w.status!=="used");
    const rewards=(s.publicData?.rewards||[]).filter(r=>r.active).sort((a,b)=>Number(a.points)-Number(b.points));
    return '<section class="account-panel" data-account-panel="points" '+(active==="points"?"":"hidden")+'>'+
      '<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Mouneh Points & Wallet","نقاط المونة والمحفظة")+'</h2><p>'+tr("Paid & delivered orders earn points. Redeem them into vouchers when you reach a reward level.","الطلبات المدفوعة والمسلّمة تكسب نقاطاً. استبدلها بقسائم عند بلوغ مستوى المكافأة.")+'</p></div><button type="button" class="account-primary" data-open-points>'+tr("Manage rewards","إدارة المكافآت")+'</button></div><div class="account-grid" style="margin-top:16px"><article class="account-stat"><small>'+tr("Current balance","الرصيد الحالي")+'</small><strong>'+points.toLocaleString()+' 🌿</strong></article><article class="account-stat"><small>'+tr("Annual paid & delivered spend","الإنفاق السنوي المدفوع والمسلّم")+'</small><strong>'+money(m.annual_spend)+'</strong></article></div></article>'+
      '<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Reward ladder","سلم المكافآت")+'</h2></div></div><div class="account-reward-grid">'+(rewards.length?rewards.map(r=>'<div class="account-reward"><strong>'+esc(r.points)+' 🌿 · '+money(r.value)+' '+tr("off","خصم")+'</strong><small>'+tr("Minimum order ","حد أدنى للطلب ")+money(r.minimum)+'</small><span class="account-pill">'+(points>=Number(r.points)?tr("Ready","جاهزة"):tr("Keep collecting","تابع التجميع"))+'</span></div>').join(""):'<p>'+tr("Rewards are being prepared.","يتم تجهيز المكافآت.")+'</p>')+'</div></article>'+
      '<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Your vouchers","قسائمك")+'</h2></div></div><div class="account-list">'+(wallet.length?wallet.map(w=>'<div class="account-row"><div><strong>'+money(w.value)+' '+tr("off","خصم")+'</strong><small>'+tr("Minimum order ","حد أدنى للطلب ")+money(w.minimum)+'</small></div><span class="account-pill">'+esc(w.status)+'</span></div>').join(""):'<p>'+tr("No vouchers yet. Open rewards when you are ready to redeem points.","لا توجد قسائم بعد. افتح المكافآت عندما تصبح جاهزاً لاستبدال النقاط.")+'</p>')+'</div></article>'+
    '</section>';
  }
  function ordersPanel(s){
    const rows=s.dashboard?.orders||[];
    return '<section class="account-panel" data-account-panel="orders" '+(active==="orders"?"":"hidden")+'><article class="account-card"><div class="account-section-title"><div><h2>'+tr("Orders & points status","حالة الطلبات والنقاط")+'</h2><p>'+tr("Points become final only after delivery and payment are both confirmed.","تصبح النقاط نهائية فقط بعد تأكيد التسليم واستلام الدفع.")+'</p></div></div><div class="account-list">'+(rows.length?rows.map(o=>{const delivered=o.status==="delivered",cancelled=o.status==="cancelled";return '<div class="account-row"><div><strong>'+esc(o.reference||tr("Order","طلب"))+'</strong><small>'+statusLabel(o.status)+' · '+money(o.total)+'</small></div><span class="account-pill '+(!delivered&&!cancelled?"is-pending":cancelled?"is-cancelled":"")+'">'+(delivered?("+"+(Number(o.awarded)||0)+" 🌿"):cancelled?tr("No points","بدون نقاط"):tr("Points pending","النقاط معلّقة"))+'</span></div>'}).join(""):'<p>'+tr("No account-linked orders yet.","لا توجد طلبات مرتبطة بالحساب بعد.")+'</p>')+'</div></article></section>';
  }
  function referralsPanel(s,m){
    const rs=s.referralStatus||{}, code=String(rs.code||m.code||"");
    const joined=Number(rs.joined??s.dashboard?.referrals??0)||0;
    const qualified=Number(rs.qualified)||0;
    const disqualified=Math.max(0,Number(rs.disqualified)||0);
    const pending=Math.max(0,Number(rs.pending??(joined-qualified-disqualified))||0);
    const link=code
      ?location.origin+"/account?auth=signup&ref="+encodeURIComponent(code)+"#signup"
      :location.origin+"/account?auth=signup#signup";
    return '<section class="account-panel" data-account-panel="referrals" '+(active==="referrals"?"":"hidden")+'><article class="account-card"><div class="account-section-title"><div><h2>'+tr("Invite friends, clearly","ادعُ أصدقاءك بوضوح")+'</h2><p>'+tr("You earn 50 points only when your friend joins with your referral before ordering and their first qualifying order is $25+ after discount, delivered, and payment-confirmed. The friend receives the current referral bonus.","تحصل على 50 نقطة فقط عندما ينضم صديقك عبر إحالتك قبل الطلب، ويكون أول طلب مؤهل له بقيمة 25 دولاراً أو أكثر بعد الخصم، ويتم تأكيد تسليمه واستلام الدفع. ويحصل الصديق على مكافأة الإحالة الحالية.")+'</p></div></div><div class="account-grid" style="margin-top:16px"><article class="account-stat"><small>'+tr("Joined","انضموا")+'</small><strong>'+joined+'</strong></article><article class="account-stat"><small>'+tr("Waiting for delivery","بانتظار التسليم")+'</small><strong>'+pending+'</strong></article><article class="account-stat"><small>'+tr("Qualified","تأهلوا")+'</small><strong>'+qualified+'</strong></article><article class="account-stat"><small>'+tr("Not eligible","غير مؤهل")+'</small><strong>'+disqualified+'</strong></article></div><div class="account-referral-code" style="margin-top:16px"><div><small>'+tr("Your referral code","رمز الإحالة")+'</small><strong>'+esc(code||"—")+'</strong></div><button type="button" class="account-primary" data-copy-ref="'+esc(link)+'">'+tr("Copy invite link","نسخ رابط الدعوة")+'</button></div><p>'+tr("Referral rewards are issued only after delivery and payment are verified in the owner order system. Same-phone and retroactive referrals do not qualify.","لا تُمنح مكافآت الإحالة إلا بعد التحقق من التسليم واستلام الدفع في نظام طلبات المالك. ولا تتأهل الإحالات برقم الهاتف نفسه أو الإحالات بأثر رجعي.")+'</p></article></section>';
  }

  function profilePanel(s,m){
    const email=s.authUser?.email||"", providers=(s.providers||[]).map(providerLabel).join("، ")||tr("Secure account","حساب آمن");
    return '<section class="account-panel" data-account-panel="profile" '+(active==="profile"?"":"hidden")+'>'+
      '<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Profile","الملف الشخصي")+'</h2><p>'+tr("Changes save directly to your account and update this page without a manual refresh.","تُحفظ التغييرات مباشرة في حسابك وتتحدث هذه الصفحة من دون تحديث يدوي.")+'</p></div></div><form id="accountProfileForm" class="account-form" style="margin-top:16px"><label>'+tr("Name","الاسم")+'<input name="name" maxlength="120" value="'+esc(m.name||"")+'" required></label><label>'+tr("WhatsApp","واتساب")+'<input name="phone" maxlength="40" value="'+esc(m.phone||"")+'"></label><label class="full">'+tr("Address","العنوان")+'<input name="address" maxlength="500" value="'+esc(m.address||"")+'"></label><label>'+tr("Birthday","تاريخ الميلاد")+'<input name="birthday" type="date" value="'+esc(m.birthday||"")+'" '+(m.birthday?"disabled":"")+'></label><label>'+tr("Preferred language","اللغة المفضلة")+'<select name="language"><option value="en" '+(!ar()?"selected":"")+'>English</option><option value="ar" '+(ar()?"selected":"")+'>العربية</option></select></label><div class="full"><button type="submit" class="account-primary">'+tr("Save profile","حفظ الملف")+'</button></div><p class="account-status full" id="accountProfileStatus"></p></form></article>'+
      '<div class="account-security"><article class="account-card"><p class="account-eyebrow">'+tr("Account identity","هوية الحساب")+'</p><h3>'+esc(email||tr("Verified customer account","حساب عميل موثّق"))+'</h3><p>'+tr("Sign-in method: ","طريقة الدخول: ")+esc(providers)+'. '+tr("Your password is handled by the authentication provider and is never shown here.","تتم إدارة كلمة المرور عبر مزود المصادقة ولا تظهر هنا أبداً.")+'</p></article>'+
      '<article class="account-card"><p class="account-eyebrow">'+tr("Password & security","كلمة المرور والأمان")+'</p><form id="accountPasswordForm" class="account-form"><label class="full">'+tr("Current password","كلمة المرور الحالية")+'<input name="currentPassword" type="password" autocomplete="current-password"></label><label class="full">'+tr("New password","كلمة المرور الجديدة")+'<input name="newPassword" type="password" minlength="8" autocomplete="new-password"></label><div class="full"><button type="submit" class="account-primary">'+tr("Change password","تغيير كلمة المرور")+'</button></div><p class="account-status full" id="accountPasswordStatus"></p></form></article></div>'+
      '<article class="account-card account-danger"><div class="account-section-title"><div><h2>'+tr("Session & legal","الجلسة والقانون")+'</h2><p>'+tr("Use sign out on shared devices. Privacy and program rules are always available below.","استخدم تسجيل الخروج على الأجهزة المشتركة. سياسة الخصوصية وقواعد البرنامج متاحة دائماً أدناه.")+'</p></div></div><div class="account-actions"><button type="button" data-account-signout>'+tr("Sign out","تسجيل الخروج")+'</button><a href="/privacy-and-data.html?rev=20261004-legal7">'+tr("Privacy Policy","سياسة الخصوصية")+'</a><a href="/terms-and-rewards.html?rev=20261004-legal7">'+tr("Terms of Service","شروط الخدمة")+'</a><a href="/terms-and-rewards.html?rev=20261004-legal7#terms-rewards">'+tr("Mouneh Points Rules","قواعد نقاط المونة")+'</a></div></article>'+
    '</section>';
  }
  function memberView(s,m){
    const first=String(m.name||"").trim().split(/\s+/)[0]||tr("there","بك");
    const initial=(first||String(s.authUser?.email||"A")).charAt(0).toUpperCase();
    const syncTime=new Date(lastSyncedAt).toLocaleTimeString(ar()?"ar-LB":"en-LB",{hour:"2-digit",minute:"2-digit"});
    return '<div class="account-layout"><aside class="account-side account-card"><div class="account-identity"><span class="account-avatar">'+esc(initial)+'</span><div><strong>'+esc(m.name||tr("My Account","حسابي"))+'</strong><small>'+esc(s.authUser?.email||"")+'</small></div></div>'+navTabs()+'<div class="account-side-note"><span class="account-sync"><i></i>'+tr("Auto-sync on","المزامنة التلقائية مفعّلة")+'</span><small>'+tr("Last checked ","آخر تحقق ")+esc(syncTime)+'</small></div></aside><div class="account-content"><header class="account-hero"><div><p class="account-eyebrow" style="color:#d8c16f">'+tr("My Zayt w Mouneh","حساب زيت ومونة")+'</p><h1>'+tr("Welcome, ","أهلاً، ")+esc(first)+'.</h1><p>'+esc(tierLabel(m.tier))+' · '+tr("Paid & delivered rewards account","حساب مكافآت الطلبات المدفوعة والمسلّمة")+'</p></div><button class="account-balance" type="button" data-account-tab="points" aria-label="'+tr("Open Points & Wallet","فتح النقاط والمحفظة")+'"><small>'+tr("Mouneh Points","نقاط المونة")+'</small><strong>'+Number(m.balance||0).toLocaleString()+' 🌿</strong><em>'+tr("Open wallet","فتح المحفظة")+' →</em></button></header>'+overviewPanel(s,m)+pointsPanel(s,m)+ordersPanel(s)+referralsPanel(s,m)+profilePanel(s,m)+'</div></div>';
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
    const sig=JSON.stringify([active,guestAuthMode,ar(),!!s.session,s.member?.balance,s.member?.name,s.dashboard?.orders?.length,s.dashboard?.wallet?.length,s.referralStatus?.joined,s.referralStatus?.qualified,s.authUser?.email,s.authMode,s.authNotice,s.pendingSignupEmail,s.googleEnabled,hasMember?lastSyncedAt:0]);
    if(!force&&sig===lastRenderSig)return;lastRenderSig=sig;
    if(!api()){el.innerHTML='<section class="account-loading"><span>🌿</span><strong>'+tr("Loading your account…","جارٍ تحميل حسابك…")+'</strong></section>';requestFrenchTranslation(el);return}
    if(s.session&&!s.member&&!s.dashboard){el.innerHTML='<section class="account-loading"><span>🌿</span><strong>'+tr("Finishing sign-in…","جارٍ إكمال تسجيل الدخول…")+'</strong></section>';requestFrenchTranslation(el);return}
    if(!s.session||!s.member){
      // Preserve the form and consent when service readiness/language changes.
      const existing=$("#accountAuthForm");
      const keep=existing&&el.dataset.authMode===guestAuthMode;
      const fields=keep?Array.from(el.querySelectorAll("input")).map(input=>({id:input.id,value:input.value,checked:input.checked})):[];
      const focused=keep&&el.contains(document.activeElement)?document.activeElement.id:"";
      el.innerHTML=guestView(s);
      el.dataset.authMode=guestAuthMode;
      fields.forEach(saved=>{const input=document.getElementById(saved.id);if(input){input.value=saved.value;input.checked=saved.checked}});
      if(focused)document.getElementById(focused)?.focus({preventScroll:true});
      requestFrenchTranslation(el);
      return;
    }
    el.innerHTML=memberView(s,s.member);
    requestFrenchTranslation(el);
  }
  async function sync(){
    if(syncing||document.visibilityState==="hidden")return;
    const a=api(),s=state(); if(!a||!s.session)return render();
    syncing=true;try{await a.refresh?.();lastSyncedAt=Date.now()}catch{}finally{syncing=false;render(true)}
  }
  function accountConsentAccepted(status){
    const consent=$("#accountLegalConsent");
    if(consent?.checked)return true;
    if(status)status.textContent=tr("Please agree to the Terms of Service and confirm that you have read the Privacy Policy to continue.","يرجى الموافقة على شروط الخدمة وتأكيد قراءتك لسياسة الخصوصية للمتابعة.");
    if(consent){consent.focus();try{consent.reportValidity()}catch{}}
    return false;
  }
  document.addEventListener("click",async e=>{
    const legalLink=e.target.closest("[data-auth-legal-link]");
    if(legalLink){e.stopPropagation();return}
    const tab=e.target.closest("[data-account-tab]"); if(tab){e.preventDefault();activateAccountTab(tab.dataset.accountTab);return}
    const auth=e.target.closest("[data-account-auth]"); if(auth){e.preventDefault();guestAuthMode=auth.dataset.accountAuth==="signup"?"signup":"signin";api()?.auth?.setMode?.(guestAuthMode);try{history.replaceState({},document.title,location.pathname+(location.search||"")+"#"+guestAuthMode)}catch{}render(true);return}
    const google=e.target.closest("[data-account-google]");
    if(google){
      e.preventDefault();
      const status=$("#accountAuthStatus");
      if(!state().ready){if(status)status.textContent=tr("Account services are still loading. Try again in a moment.","خدمات الحساب لا تزال قيد التحميل. حاول مرة أخرى بعد لحظة.");return}
      if(!accountConsentAccepted(status))return;
      if(google.dataset.busy==="1")return;
      google.dataset.busy="1";google.disabled=true;google.setAttribute("aria-busy","true");
      try{
        api()?.auth?.rememberLegalConsent?.();
        if(status)status.textContent=tr("Opening Google…","جارٍ فتح Google…");
        await api()?.auth?.signInWithGoogle?.();
      }catch(err){
        if(status)status.textContent=err?.message||String(err);
        if(google.isConnected){google.disabled=state().googleEnabled===false;google.removeAttribute("aria-busy");delete google.dataset.busy}
      }
      return;
    }
    const resend=e.target.closest("[data-account-resend]");
    if(resend){
      e.preventDefault();
      if(resend.dataset.busy==="1")return;
      resend.dataset.busy="1";resend.disabled=true;resend.setAttribute("aria-busy","true");
      const status=$("#accountVerifyStatus");
      try{
        if(status)status.textContent=tr("Sending…","جارٍ الإرسال…");
        await api()?.auth?.resendVerification?.();
        if(status)status.textContent=tr("Verification request accepted. Check your inbox and spam folder.","تم الإرسال. تحقق من الوارد والبريد غير المرغوب.");
      }catch(err){if(status)status.textContent=err?.message||String(err)}
      finally{if(resend.isConnected){resend.disabled=false;resend.removeAttribute("aria-busy");delete resend.dataset.busy}}
      return;
    }
    if(e.target.closest("[data-open-points]")){api()?.open?.();return}
    const copy=e.target.closest("[data-copy-ref]"); if(copy){const ok=await copyText(copy.dataset.copyRef);copy.textContent=ok?tr("Copied","تم النسخ"):tr("Copy failed","فشل النسخ");return}
    const signout=e.target.closest("[data-account-signout]"); if(signout){signout.disabled=true;try{await api()?.account?.signOut?.();active="overview";render(true)}finally{signout.disabled=false}return}
    const lang=e.target.closest("[data-lang]"); if(lang)setLang(lang.dataset.lang);
    const toggle=e.target.closest("#navToggle"); if(toggle&&document.documentElement.dataset.zwmReliableMenuBound!=="1"){const links=$("#navLinks"),open=toggle.getAttribute("aria-expanded")==="true";toggle.setAttribute("aria-expanded",String(!open));links?.classList.toggle("is-open",!open);document.body.classList.toggle("menu-open",!open);document.body.classList.remove("nav-open")}
  });
  document.addEventListener("submit",async e=>{
    if(e.target.id==="accountAuthForm"){
      e.preventDefault();
      const form=e.target,status=$("#accountAuthStatus"),submit=form.querySelector('button[type="submit"]');
      if(form.dataset.busy==="1")return;
      if(!state().ready){if(status)status.textContent=tr("Account services are still loading. Try again in a moment.","خدمات الحساب لا تزال قيد التحميل. حاول مرة أخرى بعد لحظة.");return}
      if(!accountConsentAccepted(status))return;
      if(!form.checkValidity()){try{form.reportValidity()}catch{};return}
      form.dataset.busy="1";
      if(submit){submit.disabled=true;submit.setAttribute("aria-busy","true")}
      if(status)status.textContent=tr("Working…","جارٍ التنفيذ…");
      try{
        const data=new FormData(form);
        const email=String(data.get("email")||"").trim();
        const password=String(data.get("password")||"");
        api()?.auth?.setMode?.(guestAuthMode);
        if(guestAuthMode==="signup"){
          const name=String(data.get("name")||"").trim();
          const phone=String(data.get("phone")||"").trim();
          const confirm=String(data.get("passwordConfirm")||"");
          const referral=String(data.get("referral")||"").trim();
          if(name.length<2)throw new Error(tr("Please enter your full name.","يرجى إدخال الاسم الكامل."));
          if(phone.replace(/\D/g,"").length<7)throw new Error(tr("Please enter a valid phone / WhatsApp number.","يرجى إدخال رقم هاتف / واتساب صحيح."));
          if(password!==confirm)throw new Error(tr("Passwords do not match.","كلمتا المرور غير متطابقتين."));
          await api()?.auth?.signUp?.(email,password,name,phone,referral);
        }else{
          await api()?.auth?.signIn?.(email,password);
        }
        landingAfterAuth=true;
        lastSyncedAt=Date.now();
        const s=state();
        if(s.session&&s.member){
          active="overview";
          try{history.replaceState({},document.title,location.pathname+"#overview")}catch{}
        }
        render(true);
      }catch(err){
        if(status)status.textContent=err?.message||String(err);
      }finally{
        delete form.dataset.busy;
        if(submit&&submit.isConnected){submit.disabled=false;submit.removeAttribute("aria-busy")}
      }
      return;
    }
    if(e.target.id==="accountCompleteForm"){
      e.preventDefault();
      const f=e.target,status=$("#accountCompleteStatus"),btn=f.querySelector('button[type="submit"]');
      if(f.dataset.busy==="1")return;
      f.dataset.busy="1";if(btn){btn.disabled=true;btn.setAttribute("aria-busy","true")}
      if(status)status.textContent=tr("Finishing your account…","جارٍ إكمال حسابك…");
      try{
        const data=new FormData(f);
        await api()?.account?.completeSetup?.(data.get("name"),data.get("phone"),data.get("referral")||"");
        active="overview";
        try{history.replaceState({},document.title,location.pathname+"#overview")}catch{}
        if(status)status.textContent=tr("Ready. Opening your dashboard…","تم. جارٍ فتح لوحة حسابك…");
        render(true);
      }catch(err){
        if(status)status.textContent=err?.message||String(err);
      }finally{
        delete f.dataset.busy;
        if(btn&&btn.isConnected){btn.disabled=false;btn.removeAttribute("aria-busy")}
      }
      return;
    }
    if(e.target.id==="accountProfileForm"){
      e.preventDefault();const f=e.target,status=$("#accountProfileStatus"),btn=f.querySelector('button[type="submit"]');btn.disabled=true;status.textContent=tr("Saving…","جارٍ الحفظ…");
      try{const data=new FormData(f);await api()?.account?.updateProfile?.({name:data.get("name"),phone:data.get("phone"),address:data.get("address"),birthday:data.get("birthday")||""});const lang=String(data.get("language")||"en");await api()?.account?.saveLanguage?.(lang);setLang(lang);status.textContent=tr("Saved.","تم الحفظ.");render(true)}catch(err){status.textContent=err.message||String(err)}finally{btn.disabled=false}return;
    }
    if(e.target.id==="accountPasswordForm"){
      e.preventDefault();const f=e.target,status=$("#accountPasswordStatus"),btn=f.querySelector('button[type="submit"]');btn.disabled=true;status.textContent=tr("Updating…","جارٍ التحديث…");
      try{const data=new FormData(f);await api()?.account?.changePassword?.(data.get("currentPassword"),data.get("newPassword"));f.reset();status.textContent=tr("Password updated.","تم تحديث كلمة المرور.")}catch(err){status.textContent=err.message||String(err)}finally{btn.disabled=false}return;
    }
  });
  document.addEventListener("zwm:account-updated",()=>{lastSyncedAt=Date.now();render()});
  window.addEventListener("hashchange",()=>{
    const next=(location.hash||"").slice(1);
    if(allowed.has(next)&&next!==active){active=next;render(true)}
  });
  window.addEventListener("focus",sync);
  window.addEventListener("online",sync);
  window.addEventListener("storage",syncAccountShellChrome);
  window.addEventListener("pageshow",syncAccountShellChrome);
  window.addEventListener("pageshow",sync);
  window.addEventListener("storage",e=>{if(!e.key||String(e.key).startsWith("zwm"))sync()});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)sync()});
  new MutationObserver(()=>{
    // French is translated by fr-runtime after each account render. Do not render
    // again just because that runtime normalizes <html lang="fr" dir="ltr">.
    let french=false;
    try{french=localStorage.getItem("zwm:french:v1")==="1"}catch{}
    if(french&&document.documentElement.lang==="fr")return;
    render(true);
  }).observe(document.documentElement,{attributes:true,attributeFilter:["lang","dir"]});
  function syncAccountShellChrome(){
    document.querySelectorAll("[data-footer-year]").forEach(el=>{el.textContent=new Date().getFullYear()});
    const count=$("#cartCount");
    if(count){
      let total=0;
      try{
        const raw=JSON.parse(localStorage.getItem("zwm-cart-v5")||"{}");
        total=Object.values(raw||{}).reduce((sum,item)=>sum+Math.max(0,Number(item?.qty)||0),0);
      }catch{}
      count.textContent=String(total);
    }
  }
  const stored=(()=>{try{return localStorage.getItem("zwm-lang-v2")}catch{return null}})(); if(stored)setLang(stored); else syncLanguageVisibility();
  $("#accountYear") && ($("#accountYear").textContent=new Date().getFullYear());
  syncAccountShellChrome();
  render(true);

  if(requestedAuthOnLoad){
    guestAuthMode=requestedAuthOnLoad==="signup"?"signup":"signin";
    try{
      const u=new URL(location.href);u.searchParams.delete("auth");
      history.replaceState({},document.title,u.pathname+(u.search||"")+"#"+guestAuthMode);
    }catch{}
    render(true);
  }
  window.addEventListener("hashchange",()=>{
    const hash=(location.hash||"").slice(1);
    if(hash==="signin"||hash==="signup"){
      guestAuthMode=hash;
      api()?.auth?.setMode?.(hash);
      render(true);
      document.querySelector(".account-auth-card")?.scrollIntoView?.({block:"start",behavior:"smooth"});
      return;
    }
    if(allowed.has(hash)){
      active=hash;
      render(true);
      document.querySelector('[data-account-panel="'+hash+'"]')?.scrollIntoView?.({block:"start",behavior:"smooth"});
    }
  });
  setInterval(sync,30000);
})();