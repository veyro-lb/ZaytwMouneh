(() => {
  "use strict";

  const SESSION_KEY="zwm:owner-session:v3";
  const cfg=window.ZWM_CMS_CONFIG||{};
  const state={data:null,query:"",member:null,loading:false,dirty:false,busy:false};
  const $=(id)=>document.getElementById(id);
  const esc=(v)=>String(v??"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money=(v)=>"$"+(Number(v)||0).toFixed(2);
  const uuid=()=>crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(c)=>{const r=Math.random()*16|0,v=c==="x"?r:(r&3|8);return v.toString(16)});
  const isAr=()=>document.documentElement.dir==="rtl"||document.documentElement.lang==="ar";
  const tr=(en,ar)=>isAr()?ar:en;
  const categoryArabic={
  "Condiments":"مستلزمات المطبخ",
  "Dates":"تمر",
  "Debsy Carob":"دبسي خروب",
  "Distillates + Syrups":"مقطرات وشرابات",
  "Dried Foods":"أطعمة مجففة",
  "Flour":"طحين",
  "Grains":"حبوب",
  "Herbs":"أعشاب",
  "Honey":"عسل",
  "Molasses":"دبس",
  "Mouneh":"مونة",
  "Nuts + Seeds":"مكسرات وبذور",
  "Oils":"زيوت",
  "Olive Oil":"زيت زيتون",
  "Olives":"زيتون",
  "Pickles":"مخللات",
  "Pulses":"بقوليات",
  "Soap":"صابون",
  "Spices":"بهارات",
  "Sweets + Candy":"حلويات وسكاكر",
  "Vinegars":"خل"
};
  const categoryName=(name)=>isAr()?(categoryArabic[name]||name):name;
  const phoneKey=(v)=>String(v||"").replace(/\D/g,"");

  function session(){
    try{
      const value=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");
      return value?.access_token?value:null;
    }catch{return null;}
  }
  async function rpc(action,p={},retry=true){
    const s=session();
    if(!s)throw new Error(tr("Owner session required.","يلزم تسجيل دخول المالك."));
    const r=await fetch(String(cfg.supabaseUrl||"").replace(/\/$/,"")+"/rest/v1/rpc/mouneh_api",{
      method:"POST",
      headers:{"apikey":cfg.supabasePublishableKey,"Authorization":"Bearer "+s.access_token,"Content-Type":"application/json","Prefer":"return=representation"},
      body:JSON.stringify({action,p})
    });
    const data=await r.json().catch(()=>({}));
    if(r.status===401&&retry&&s.refresh_token){
      const refreshed=await fetch(cfg.supabaseUrl+"/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:{apikey:cfg.supabasePublishableKey,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:s.refresh_token})});
      const next=await refreshed.json();
      if(refreshed.ok&&next.access_token){sessionStorage.setItem(SESSION_KEY,JSON.stringify({...s,...next,expires_at:Math.floor(Date.now()/1000)+next.expires_in}));return rpc(action,p,false);}
    }
    if(!r.ok)throw new Error(data.message||data.hint||data.details||tr("Rewards request failed.","تعذّر طلب المكافآت."));
    return data;
  }

  async function ownerFunction(name,payload={},retry=true){
    const s=session();
    if(!s)throw new Error(tr("Owner session required.","يلزم تسجيل دخول المالك."));
    const endpoint=String(cfg.supabaseUrl||"").replace(/\/$/,"")+"/functions/v1/"+name;
    const r=await fetch(endpoint,{
      method:"POST",
      headers:{"apikey":cfg.supabasePublishableKey,"Authorization":"Bearer "+s.access_token,"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    const data=await r.json().catch(()=>({}));
    if(r.status===401&&retry&&s.refresh_token){
      const refreshed=await fetch(cfg.supabaseUrl+"/auth/v1/token?grant_type=refresh_token",{
        method:"POST",
        headers:{apikey:cfg.supabasePublishableKey,"Content-Type":"application/json"},
        body:JSON.stringify({refresh_token:s.refresh_token})
      });
      const next=await refreshed.json().catch(()=>({}));
      if(refreshed.ok&&next.access_token){
        sessionStorage.setItem(SESSION_KEY,JSON.stringify({...s,...next,expires_at:Math.floor(Date.now()/1000)+next.expires_in}));
        return ownerFunction(name,payload,false);
      }
    }
    if(!r.ok)throw new Error(data.error||data.message||tr("Account removal failed.","تعذّرت إزالة الحساب."));
    return data;
  }

  function toast(message,error=false){
    if(error&&isAr()&&/[a-zA-Z]{3}/.test(message)){
      const errors={"An active reward already uses this points level":"توجد مكافأة مفعّلة بهذا العدد من النقاط.","Owner access required":"يلزم تسجيل دخول المالك.","Reward no longer exists":"لم تعد هذه المكافأة موجودة. حدّث البيانات.","Invalid reward points, discount or minimum order":"تحقّق من النقاط وقيمة الخصم والحد الأدنى للطلب.","Owner session required.":"يلزم تسجيل دخول المالك."};
      message=errors[message]||"تعذّر إتمام الطلب. تحقّق من الاتصال والبيانات وحاول مجدداً.";
    }
    const stack=$("toastStack");
    if(!stack)return alert(message);
    const el=document.createElement("div");
    el.className="admin-toast"+(error?" is-error":"");
    el.textContent=message;stack.appendChild(el);setTimeout(()=>el.remove(),3400);
  }

  function tierName(tier){
    return tier==="golden"?tr("Golden","ذهبي"):tier==="olive"?tr("Olive","زيتون"):tr("Member","عضو");
  }

  async function loadAuthStatus(){
    const email=$("rewardsAuthEmailStatus"),confirm=$("rewardsAuthConfirmStatus"),google=$("rewardsAuthGoogleStatus");
    if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)return;
    try{
      const r=await fetch(String(cfg.supabaseUrl).replace(/\/$/,"")+"/auth/v1/settings",{headers:{"apikey":cfg.supabasePublishableKey}});
      const d=await r.json();
      const emailOn=!!d?.external?.email;
      const googleOn=!!d?.external?.google;
      const confirmRequired=d?.mailer_autoconfirm===false;
      if(email){email.textContent=emailOn?tr("Active","مفعّل"):tr("Off","متوقف");email.dataset.status=emailOn?"ok":"warn";}
      if(confirm){confirm.textContent=confirmRequired?tr("Required","مطلوب"):tr("Automatic","تلقائي");confirm.dataset.status=confirmRequired?"ok":"warn";}
      if(google){google.textContent=googleOn?tr("Connected","متصل"):tr("Needs setup","يحتاج إعداد");google.dataset.status=googleOn?"ok":"warn";}
    }catch{
      [email,confirm,google].forEach(el=>{if(el){el.textContent=tr("Could not check","تعذّر الفحص");el.dataset.status="warn";}});
    }
  }

  async function load(){
    if(state.loading)return;
    if(state.dirty)return toast(tr("Save changes before refreshing.","احفظ التعديلات قبل التحديث."),true);
    state.loading=true;
    const root=$("rewardsAdminBody");
    if(root)root.classList.add("is-loading");
    try{
      const [data]=await Promise.all([rpc("admin_data",{}),loadAuthStatus()]);
      state.data=data;
      render();
    }catch(err){
      toast(tr('Could not load rewards. Use Refresh to try again.','تعذّر تحميل المكافآت. اضغط تحديث للمحاولة مجدداً.'),true);
    }finally{
      state.loading=false;if(root)root.classList.remove("is-loading");
    }
  }

  function metrics(){
    const d=state.data||{},members=d.members||[],wallet=d.wallet||[],campaigns=d.campaigns||[];
    const points=members.reduce((s,m)=>s+Math.max(0,Number(m.balance)||0),0);
    const available=wallet.filter(w=>w.status==="available").reduce((s,w)=>s+(Number(w.value)||0),0);
    const activeCampaigns=campaigns.filter(c=>c.active&&new Date(c.starts_at)<=new Date()&&new Date(c.ends_at)>new Date()).length;
    const golden=members.filter(m=>m.tier==="golden").length;
    return {members:members.length,points,available,activeCampaigns,golden};
  }

  function filteredMembers(){
    const members=[...(state.data?.members||[])];
    const q=state.query.trim().toLowerCase();
    const out=q?members.filter(m=>[m.name,m.phone,m.code,m.tier,tierName(m.tier),m.user_id].join(" ").toLowerCase().includes(q)):members;
    return out.sort((a,b)=>(Number(b.balance)||0)-(Number(a.balance)||0));
  }

  function renderMembers(){
    const root=$("rewardsMemberGrid");
    if(!root)return;
    const members=filteredMembers();
    $("rewardsMemberCount").textContent=members.length+" "+tr(members.length===1?"member":"members","عضو");
    root.innerHTML=members.length?members.map(m=>
      '<article class="rewards-member-card">'+
        '<div class="rewards-member-head"><div><span class="rewards-avatar">'+esc((m.name||"M").trim().charAt(0).toUpperCase())+'</span><div><strong>'+esc(m.name||tr("Unnamed member","عضو بدون اسم"))+'</strong><small>'+esc(m.phone||m.code||m.user_id)+'</small></div></div><span class="rewards-tier '+esc(m.tier||"member")+'">'+esc(tierName(m.tier))+'</span></div>'+
        '<div class="rewards-member-stats"><div><small>'+tr("Balance","الرصيد")+'</small><b>'+esc(m.balance)+' 🌿</b></div><div><small>'+tr("Annual spend","الإنفاق السنوي")+'</small><b>'+money(m.annual_spend)+'</b></div><div><small>'+tr("Member code","رمز العضو")+'</small><b>'+esc(m.code||"—")+'</b></div></div>'+
        '<button type="button" data-rewards-manage="'+esc(m.user_id)+'">'+tr("Manage points & rewards","إدارة النقاط والمكافآت")+'</button>'+
      '</article>'
    ).join(""):'<p class="empty-state">'+(state.query?tr("No matching members.","لا يوجد أعضاء مطابقون للبحث."):tr("No rewards members yet.","لا يوجد أعضاء مكافآت بعد."))+'</p>';
  }

  function renderRules(){
    const root=$("rewardsRuleGrid");
    if(!root)return;
    const rows=[...(state.data?.rewards||[])].sort((a,b)=>Number(a.points)-Number(b.points));
    root.innerHTML=rows.map(r=>
      '<article class="reward-rule-card" data-reward-rule="'+esc(r.id)+'">'+
        '<div><span>🌿</span><strong>'+esc(r.points)+' '+tr('points','نقطة')+'</strong></div>'+
        '<label>'+tr("Points","النقاط")+'<input data-rule-field="points" type="number" min="1" max="1000000" step="1" required value="'+esc(r.points)+'"></label>'+
        '<label>'+tr("Discount $","الخصم (دولار)")+'<input data-rule-field="value" type="number" min=".01" max="1000" step=".01" required value="'+esc(r.value)+'"></label>'+
        '<label>'+tr("Minimum $","الحد الأدنى (دولار)")+'<input data-rule-field="minimum" type="number" min="0.01" max="1000000" step=".01" required value="'+esc(r.minimum)+'"></label>'+
        '<label class="reward-rule-toggle"><input data-rule-field="active" type="checkbox" '+(r.active?"checked":"")+'><span>'+tr("Active","مفعّل")+'</span></label>'+
        '<button type="button" data-save-rule="'+esc(r.id)+'">'+tr("Save reward","حفظ المكافأة")+'</button>'+
      '</article>'
    ).join("");
  }

  function renderCampaigns(){
    const select=$("rewardsCampaignCategory");
    if(select){const current=select.value;const categories=new Set([...(typeof PRODUCTS_DATA!=="undefined"?PRODUCTS_DATA:[]).map(p=>p.category),...[...document.querySelectorAll('#productCategory option')].map(o=>o.value)].filter(Boolean));
      if(current)categories.add(current);
      select.innerHTML='<option value="">'+tr('All categories','جميع الفئات')+'</option>'+[...categories].sort().map(c=>'<option value="'+esc(c)+'">'+esc(categoryName(c))+'</option>').join('');select.value=current;
    }
    const root=$("rewardsCampaignList");
    if(!root)return;
    const rows=[...(state.data?.campaigns||[])].sort((a,b)=>new Date(b.starts_at)-new Date(a.starts_at));
    root.innerHTML=rows.length?rows.map(c=>{
      const active=c.active&&new Date(c.starts_at)<=new Date()&&new Date(c.ends_at)>new Date();
      return '<article class="rewards-campaign-row '+(active?"is-active":"")+'"><div><span>'+esc(c.multiplier)+'×</span><div><strong>'+esc(isAr()?(c.title_ar||c.title):c.title)+'</strong><small>'+esc(c.category?categoryName(c.category):tr("All categories","كل الفئات"))+' · '+new Date(c.starts_at).toLocaleDateString(isAr()?"ar-LB":"en-GB")+' → '+new Date(c.ends_at).toLocaleDateString(isAr()?"ar-LB":"en-GB")+'</small></div></div><button type="button" data-disable-campaign="'+esc(c.id)+'" '+(!c.active?"disabled":"")+'>'+(c.active?tr("Stop","إيقاف"):tr("Ended","منتهية"))+'</button></article>';
    }).join(""):'<p class="empty-state">'+tr("No point-boost campaigns yet.","لا توجد حملات مضاعفة نقاط بعد.")+'</p>';
  }

  function renderConfig(){
    const c=state.data?.config||{};
    const enabled=$("rewardsEnabled"),rate=$("rewardsBaseRate");
    if(enabled)enabled.checked=c.enabled!==false;
    if(rate)rate.value=Number(c.base_rate??1);
  }

  function render(){
    if(!state.data)return;
    const m=metrics();
    $("rewardsMembersMetric").textContent=m.members.toLocaleString();
    $("rewardsPointsMetric").textContent=m.points.toLocaleString();
    $("rewardsVoucherMetric").textContent=money(m.available);
    $("rewardsCampaignMetric").textContent=m.activeCampaigns.toLocaleString();
    $("rewardsGoldenMetric").textContent=m.golden.toLocaleString();
    renderMembers();renderRules();renderCampaigns();renderConfig();
    enhanceCustomerCards();
  }

  function openMember(id){
    const member=(state.data?.members||[]).find(m=>m.user_id===id);
    if(!member)return;
    state.member=member;
    state.returnFocus=document.activeElement;
    $("rewardsMemberModalName").textContent=member.name||tr("Mouneh member","عضو المونة");
    $("rewardsMemberModalMeta").textContent=(member.phone||member.code||"")+" · "+member.balance+" 🌿 · "+tierName(member.tier);
    $("rewardsAdjustPoints").value="";
    $("rewardsAdjustReason").value="";
    $("rewardsTierOverride").value=member.tier_override||"";
    $("rewardsGiftValue").value="";
    $("rewardsGiftMinimum").value="";
    $("rewardsGiftReason").value="";
    $("rewardsMemberModal").hidden=false;
    document.body.classList.add("rewards-modal-open");
    $("rewardsMemberModalClose").focus();
  }
  function closeMember(){
    $("rewardsMemberModal").hidden=true;document.body.classList.remove("rewards-modal-open");state.member=null;state.returnFocus?.focus();
  }

  async function refreshAfter(message){
    const drafts=[...document.querySelectorAll('[data-reward-rule]')].filter(c=>c.dataset.dirty==='true'&&c.dataset.rewardRule!==state.savedRule).map(c=>({id:c.dataset.rewardRule,values:[...c.querySelectorAll('input')].map(i=>({value:i.value,checked:i.checked}))}));
    const configDraft=state.configDirty&&!state.savedConfig?{enabled:$("rewardsEnabled").checked,rate:$("rewardsBaseRate").value}:null;
    state.data=await rpc("admin_data",{});
    state.dirty=!!drafts.length||!!configDraft||!!state.newDirty||!!state.campaignDirty;
    state.configDirty=!!configDraft;state.savedRule=null;state.savedConfig=false;
    try{localStorage.setItem("zwm:rewards-updated",String(Date.now()));}catch{}
    render();
    drafts.forEach(d=>{const c=document.querySelector('[data-reward-rule="'+CSS.escape(d.id)+'"]');if(c){c.dataset.dirty='true';c.querySelectorAll('input').forEach((i,n)=>{i.value=d.values[n].value;i.checked=d.values[n].checked;});}});
    if(configDraft){$("rewardsEnabled").checked=configDraft.enabled;$("rewardsBaseRate").value=configDraft.rate;}
    if(state.member){const id=state.member.user_id;const next=(state.data.members||[]).find(m=>m.user_id===id);state.member=next||null;if(next){$("rewardsMemberModalMeta").textContent=(next.phone||next.code||"")+" · "+next.balance+" 🌿 · "+tierName(next.tier);}}
    if(message)toast(message);
  }

  async function removeCustomerAccount(userId,label,button){
    if(!userId||state.busy)return;
    const display=label||tr("this customer","هذا العميل");
    const warning=tr(
      "Remove "+display+"’s account? Their login, points, vouchers, saved addresses and rewards profile will be deleted. Historical orders will stay.",
      "إزالة حساب "+display+"؟ سيتم حذف تسجيل الدخول والنقاط والقسائم والعناوين المحفوظة وملف المكافآت، بينما ستبقى الطلبات السابقة."
    );
    if(!window.confirm(warning))return;
    const typed=window.prompt(tr("Type DELETE to confirm permanent account removal.","اكتب DELETE لتأكيد إزالة الحساب نهائياً."));
    if(typed!=="DELETE")return;
    state.busy=true;
    if(button)button.disabled=true;
    try{
      const result=await ownerFunction("admin-remove-customer",{user_id:userId});
      if(state.member?.user_id===userId)closeMember();
      state.data=await rpc("admin_data",{});
      render();
      try{localStorage.setItem("zwm:rewards-updated",String(Date.now()));}catch{}
      $("refreshButton")?.click();
      toast(tr(
        "Customer account removed. "+Number(result.preserved_orders||0)+" historical order(s) were kept.",
        "تمت إزالة حساب العميل. تم الاحتفاظ بـ "+Number(result.preserved_orders||0)+" من الطلبات السابقة."
      ));
    }catch(err){
      toast(err?.message||tr("Could not remove customer account.","تعذّرت إزالة حساب العميل."),true);
    }finally{
      state.busy=false;
      if(button&&document.contains(button))button.disabled=false;
    }
  }

  async function adjustPoints(){
    if(!state.member)return;
    const points=Number($("rewardsAdjustPoints").value),reason=$("rewardsAdjustReason").value.trim();
    if(!Number.isInteger(points)||points===0||Math.abs(points)>10000)return toast(tr("Enter a whole point adjustment between -10,000 and 10,000.","أدخل تعديلاً صحيحاً بين -10000 و10000."),true);
    if(reason.length<3)return toast(tr("Add a clear reason.","أضف سبباً واضحاً."),true);
    try{await rpc("admin_adjust",{user_id:state.member.user_id,points,reason,request_id:uuid()});await refreshAfter(tr("Points updated.","تم تحديث النقاط."));$("rewardsAdjustPoints").value="";$("rewardsAdjustReason").value="";}catch(err){toast(err.message,true);}
  }

  async function saveTier(){
    if(!state.member)return;
    try{await rpc("admin_tier",{user_id:state.member.user_id,tier:$("rewardsTierOverride").value});await refreshAfter(tr("Tier updated.","تم تحديث المستوى."));}catch(err){toast(err.message,true);}
  }

  async function giftReward(){
    if(!state.member)return;
    const value=Number($("rewardsGiftValue").value),minimum=Number($("rewardsGiftMinimum").value),reason=$("rewardsGiftReason").value.trim()||tr("Thank you","شكراً لك");
    if(!(value>0&&value<=100&&minimum>=value))return toast(tr("Voucher value must be $0–$100 and minimum order must be at least the voucher value.","يجب أن تكون قيمة القسيمة بين 0 و100 دولار والحد الأدنى لا يقل عن قيمة القسيمة."),true);
    try{await rpc("admin_reward",{user_id:state.member.user_id,value,minimum,reason});await refreshAfter(tr("Voucher added to member wallet.","تمت إضافة القسيمة إلى محفظة العضو."));$("rewardsGiftValue").value="";$("rewardsGiftMinimum").value="";$("rewardsGiftReason").value="";}catch(err){toast(err.message,true);}
  }

  async function saveRule(id){
    const card=document.querySelector('[data-reward-rule="'+CSS.escape(id)+'"]');
    if(!card)return;
    const get=(name)=>card.querySelector('[data-rule-field="'+name+'"]');
    const p={id,points:Number(get("points").value),value:Number(get("value").value),minimum:Number(get("minimum").value),active:get("active").checked};
    if(!validRule(p,id))return;
    try{await rpc("admin_reward_rule",p);state.savedRule=id;await refreshAfter(tr("Reward rule saved.","تم حفظ قاعدة المكافأة."));}catch(err){toast(err.message,true);}
  }

  async function saveConfig(){
    const p={enabled:$("rewardsEnabled").checked,base_rate:Number($("rewardsBaseRate").value)};
    if(!(p.base_rate>=.1&&p.base_rate<=3))return toast(tr("Base rate must be between 0.1 and 3 points per $1.","يجب أن يكون المعدل بين 0.1 و3 نقاط لكل دولار."),true);
    try{await rpc("admin_config",p);state.savedConfig=true;await refreshAfter(tr("Mouneh Points settings saved.","تم حفظ إعدادات نقاط المونة."));}catch(err){toast(err.message,true);}
  }

  async function createCampaign(e){
    e.preventDefault();
    if(!e.target.reportValidity())return;
    const p={
      title:$("rewardsCampaignTitle").value.trim(),
      title_ar:$("rewardsCampaignTitleAr").value.trim(),
      category:$("rewardsCampaignCategory").value.trim(),
      multiplier:Number($("rewardsCampaignMultiplier").value),
      starts_at:new Date($("rewardsCampaignStart").value).toISOString(),
      ends_at:new Date($("rewardsCampaignEnd").value).toISOString()
    };
    if(!p.title||!(p.multiplier>=1&&p.multiplier<=3)||new Date(p.ends_at)<=new Date(p.starts_at))return toast(tr("Complete the campaign and use a valid start/end window.","أكمل بيانات الحملة وحدد وقت بداية ونهاية صحيح."),true);
    try{
      await rpc("admin_campaign",p);
      state.campaignDirty=false;e.target.reset();$("rewardsCampaignMultiplier").value="2";
      await refreshAfter(tr("Point-boost campaign created.","تم إنشاء حملة مضاعفة النقاط."));
    }catch(err){toast(err.message,true);}
  }
  async function disableCampaign(id){
    try{await rpc("admin_campaign",{id});await refreshAfter(tr("Campaign stopped.","تم إيقاف الحملة."));}catch(err){toast(err.message,true);}
  }

  function enhanceCustomerCards(){
    const grid=$("customerGrid");
    if(!grid||!state.data)return;
    const members=state.data.members||[];
    const byPhone=new Map(members.map(m=>[phoneKey(m.phone),m]).filter(x=>x[0]));
    const byId=new Map(members.map(m=>[m.user_id,m]));
    grid.querySelectorAll(".customer-card").forEach(card=>{
      const key=card.dataset.customerKey||"";
      const small=card.querySelector(".customer-card-head small");
      const member=key.startsWith("uid:")?byId.get(key.slice(4)):byPhone.get(phoneKey(small?.textContent||""));
      if(!member)return;

      const stats=card.querySelector(".customer-card-stats");
      const label=member.balance+" 🌿 · "+tierName(member.tier);
      let badge=card.querySelector(".rewards-customer-badge");
      if(!badge&&stats){
        badge=document.createElement("span");
        badge.className="rewards-customer-badge";
        badge.textContent=label;
        stats.appendChild(badge);
      }else if(badge&&badge.textContent!==label){
        badge.textContent=label;
      }

      const actions=card.querySelector(".customer-card-actions");
      let manage=actions?.querySelector("[data-rewards-manage]");
      if(actions&&!manage){
        manage=document.createElement("button");
        manage.type="button";
        manage.className="customer-account-manage";
        manage.dataset.rewardsManage=member.user_id;
        manage.textContent=tr("Manage account","إدارة الحساب");
        actions.appendChild(manage);
      }else if(manage){
        if(manage.dataset.rewardsManage!==member.user_id)manage.dataset.rewardsManage=member.user_id;
        const manageLabel=tr("Manage account","إدارة الحساب");
        if(manage.textContent!==manageLabel)manage.textContent=manageLabel;
      }
    });
  }

  function setRewardsTitle(){
    const title=$("viewTitle");if(title)title.textContent=tr("Mouneh Points","نقاط المونة");
  }

  function validRule(p,id){
    if(!Number.isInteger(p.points)||p.points<1||p.points>1000000||!Number.isFinite(p.value)||p.value<=0||p.value>1000||!Number.isFinite(p.minimum)||p.minimum<p.value||p.minimum>1000000){
      toast(tr("Use whole points (1–1,000,000), a discount up to $1,000, and a minimum order at least equal to the discount.","أدخل نقاطاً صحيحة بين 1 و1000000، وخصماً لا يتجاوز 1000 دولار، وحداً أدنى للطلب لا يقل عن الخصم."),true);return false;
    }
    if(p.active&&(state.data?.rewards||[]).some(r=>r.id!==id&&r.active&&Number(r.points)===p.points)){
      toast(tr("An active reward already uses this points level.","توجد مكافأة مفعّلة بهذا العدد من النقاط."),true);return false;
    }
    return true;
  }
  function toggleNew(open){
    $("rewardsNewLevel").hidden=!open;$("rewardsAddLevel").setAttribute("aria-expanded",String(open));
    if(open)$("rewardsNewPoints").focus();
    else{state.newDirty=false;state.dirty=!!state.configDirty||!!state.campaignDirty||!!document.querySelector('[data-reward-rule][data-dirty="true"]');$("rewardsNewLevel").reset();$("rewardsAddLevel").focus();}
  }
  async function addLevel(){
    if(!$("rewardsNewLevel").reportValidity())return;
    const p={id:"r-"+uuid(),points:Number($("rewardsNewPoints").value),value:Number($("rewardsNewValue").value),minimum:Number($("rewardsNewMinimum").value),active:true};
    if(!validRule(p))return;
    await rpc("admin_reward_create",p);
    toggleNew(false);
    await refreshAfter(tr("Reward level added and published.","تمت إضافة مستوى المكافأة ونشره."));
  }
  async function run(button,fn){
    if(state.busy)return;
    state.busy=true;if(button)button.disabled=true;
    try{await fn();}catch{toast(tr("Could not save. Refresh to check the latest data before trying again.","تعذّر الحفظ. حدّث البيانات للتحقق من آخر حالة قبل المحاولة مجدداً."),true);}
    finally{state.busy=false;if(button)button.disabled=false;}
  }
  function refreshLanguage(){
    if(document.querySelector('.dashboard-view[data-view-panel="rewards"].is-active'))setRewardsTitle();
    const drafts=[...document.querySelectorAll('[data-reward-rule]')].map(card=>({id:card.dataset.rewardRule,dirty:card.dataset.dirty,values:[...card.querySelectorAll('input')].map(i=>({value:i.value,checked:i.checked}))}));
    if(state.data){renderMembers();renderRules();renderCampaigns();enhanceCustomerCards();}
    drafts.forEach(d=>{const card=document.querySelector('[data-reward-rule="'+CSS.escape(d.id)+'"]');if(card)card.dataset.dirty=d.dirty||'';card?.querySelectorAll('input').forEach((i,n)=>{i.value=d.values[n].value;i.checked=d.values[n].checked;});});
    if(state.member)$("rewardsMemberModalMeta").textContent=(state.member.phone||state.member.code||"")+" · "+state.member.balance+" 🌿 · "+tierName(state.member.tier);
    loadAuthStatus();
  }
  function bind(){
    document.addEventListener("zwm:admin-language",refreshLanguage);
    document.addEventListener("click",(e)=>{
      const view=e.target.closest('[data-view="rewards"],[data-mobile-view="rewards"]');
      if(view)setTimeout(()=>{setRewardsTitle();if(!state.dirty)load();},0);
      const manage=e.target.closest("[data-rewards-manage]");if(manage)openMember(manage.dataset.rewardsManage);
      if(e.target.closest("#rewardsMemberModalClose")||e.target===$("rewardsMemberModal"))closeMember();
      if(e.target.closest("#rewardsAddLevel"))toggleNew(true);
      if(e.target.closest("#rewardsCancelLevel"))toggleNew(false);
      const button=e.target.closest("button");if(!button)return;
      if(button.id==="rewardsRefresh")return run(button,load);
      if(button.id==="rewardsAdjustButton")return run(button,adjustPoints);
      if(button.id==="rewardsTierButton")return run(button,saveTier);
      if(button.id==="rewardsGiftButton")return run(button,giftReward);
      if(button.id==="rewardsRemoveAccountButton"&&state.member)return removeCustomerAccount(state.member.user_id,state.member.name||tr("this customer","هذا العميل"),button);
      if(button.dataset.saveRule)return run(button,()=>saveRule(button.dataset.saveRule));
      if(button.id==="rewardsSaveConfig")return run(button,saveConfig);
      if(button.dataset.disableCampaign)return run(button,()=>disableCampaign(button.dataset.disableCampaign));
    });
    $("rewardsAdminBody")?.addEventListener("input",e=>{if(e.target.id!=="rewardsMemberSearch"){
      state.dirty=true;const card=e.target.closest('[data-reward-rule]');if(card)card.dataset.dirty='true';
      if(e.target.closest('.rewards-settings-form'))state.configDirty=true;
      if(e.target.closest('#rewardsNewLevel'))state.newDirty=true;
      if(e.target.closest('#rewardsCampaignForm'))state.campaignDirty=true;
    }});
    $("rewardsMemberSearch")?.addEventListener("input",e=>{state.query=e.target.value;renderMembers();});
    $("rewardsNewLevel")?.addEventListener("submit",e=>{e.preventDefault();run(e.submitter,addLevel);});
    $("rewardsCampaignForm")?.addEventListener("submit",e=>{e.preventDefault();run(e.submitter,()=>createCampaign(e));});
    document.addEventListener("keydown",e=>{
      const modal=$("rewardsMemberModal");if(!modal||modal.hidden)return;
      if(e.key==="Escape")closeMember();
      if(e.key==="Tab"){
        const items=[...modal.querySelectorAll('button,input,select')].filter(x=>!x.disabled),first=items[0],last=items[items.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    });
    const customers=$("customerGrid");
    if(customers){
      let customerEnhanceQueued=false;
      new MutationObserver(()=>{
        if(customerEnhanceQueued)return;
        customerEnhanceQueued=true;
        queueMicrotask(()=>{
          customerEnhanceQueued=false;
          enhanceCustomerCards();
        });
      }).observe(customers,{childList:true,subtree:true});
    }
    const panel=document.querySelector('[data-view-panel="rewards"]');
    if(panel)new MutationObserver(()=>{if(panel.classList.contains("is-active")){setRewardsTitle();if(!state.data&&!state.loading)load();}}).observe(panel,{attributes:true,attributeFilter:["class"]});
    window.addEventListener("beforeunload",e=>{if(state.dirty){e.preventDefault();e.returnValue="";}});
  }

  function init(){
    bind();
    const app=$("adminApp");
    if(app&&!app.hidden&&session())load();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
