(() => {
  "use strict";

  const SESSION_KEY="zwm:owner-session:v3";
  const cfg=window.ZWM_CMS_CONFIG||{};
  const state={data:null,query:"",member:null,loading:false};
  const $=(id)=>document.getElementById(id);
  const esc=(v)=>String(v??"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money=(v)=>"$"+(Number(v)||0).toFixed(2);
  const uuid=()=>crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(c)=>{const r=Math.random()*16|0,v=c==="x"?r:(r&3|8);return v.toString(16)});
  const isAr=()=>document.documentElement.dir==="rtl"||document.documentElement.lang==="ar";
  const tr=(en,ar)=>isAr()?ar:en;
  const phoneKey=(v)=>String(v||"").replace(/\D/g,"");

  function session(){
    try{
      const value=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");
      return value?.access_token?value:null;
    }catch{return null;}
  }
  async function rpc(action,p={}){
    const s=session();
    if(!s)throw new Error(tr("Owner session required.","يلزم تسجيل دخول المالك."));
    const r=await fetch(String(cfg.supabaseUrl||"").replace(/\/$/,"")+"/rest/v1/rpc/mouneh_api",{
      method:"POST",
      headers:{"apikey":cfg.supabasePublishableKey,"Authorization":"Bearer "+s.access_token,"Content-Type":"application/json","Prefer":"return=representation"},
      body:JSON.stringify({action,p})
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.message||data.hint||data.details||tr("Rewards request failed.","تعذّر طلب المكافآت."));
    return data;
  }

  function toast(message,error=false){
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
    state.loading=true;
    const root=$("rewardsAdminBody");
    if(root)root.classList.add("is-loading");
    try{
      const [data]=await Promise.all([rpc("admin_data",{}),loadAuthStatus()]);
      state.data=data;
      render();
    }catch(err){
      if(root)root.innerHTML='<p class="empty-state">'+esc(err.message)+'</p>';
    }finally{
      state.loading=false;if(root)root.classList.remove("is-loading");
    }
  }

  function metrics(){
    const d=state.data||{},members=d.members||[],wallet=d.wallet||[],campaigns=d.campaigns||[];
    const points=members.reduce((s,m)=>s+Math.max(0,Number(m.balance)||0),0);
    const available=wallet.filter(w=>w.status==="available").reduce((s,w)=>s+(Number(w.value)||0),0);
    const activeCampaigns=campaigns.filter(c=>c.active&&new Date(c.ends_at)>new Date()).length;
    const golden=members.filter(m=>m.tier==="golden").length;
    return {members:members.length,points,available,activeCampaigns,golden};
  }

  function filteredMembers(){
    const members=[...(state.data?.members||[])];
    const q=state.query.trim().toLowerCase();
    const out=q?members.filter(m=>[m.name,m.phone,m.code,m.tier,m.user_id].join(" ").toLowerCase().includes(q)):members;
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
    ).join(""):'<p class="empty-state">'+tr("No rewards members yet.","لا يوجد أعضاء مكافآت بعد.")+'</p>';
  }

  function renderRules(){
    const root=$("rewardsRuleGrid");
    if(!root)return;
    const rows=[...(state.data?.rewards||[])].sort((a,b)=>Number(a.points)-Number(b.points));
    root.innerHTML=rows.map(r=>
      '<article class="reward-rule-card" data-reward-rule="'+esc(r.id)+'">'+
        '<div><span>🌿</span><strong>'+esc(r.id.toUpperCase())+'</strong></div>'+
        '<label>'+tr("Points","النقاط")+'<input data-rule-field="points" type="number" min="1" step="1" value="'+esc(r.points)+'"></label>'+
        '<label>'+tr("Discount $","الخصم $")+'<input data-rule-field="value" type="number" min=".01" step=".01" value="'+esc(r.value)+'"></label>'+
        '<label>'+tr("Minimum $","الحد الأدنى $")+'<input data-rule-field="minimum" type="number" min="0" step=".01" value="'+esc(r.minimum)+'"></label>'+
        '<label class="reward-rule-toggle"><input data-rule-field="active" type="checkbox" '+(r.active?"checked":"")+'><span>'+tr("Active","مفعّل")+'</span></label>'+
        '<button type="button" data-save-rule="'+esc(r.id)+'">'+tr("Save reward","حفظ المكافأة")+'</button>'+
      '</article>'
    ).join("");
  }

  function renderCampaigns(){
    const root=$("rewardsCampaignList");
    if(!root)return;
    const rows=[...(state.data?.campaigns||[])].sort((a,b)=>new Date(b.starts_at)-new Date(a.starts_at));
    root.innerHTML=rows.length?rows.map(c=>{
      const active=c.active&&new Date(c.ends_at)>new Date();
      return '<article class="rewards-campaign-row '+(active?"is-active":"")+'"><div><span>'+esc(c.multiplier)+'×</span><div><strong>'+esc(isAr()?(c.title_ar||c.title):c.title)+'</strong><small>'+esc(c.category||tr("All categories","كل الفئات"))+' · '+new Date(c.starts_at).toLocaleDateString()+' → '+new Date(c.ends_at).toLocaleDateString()+'</small></div></div><button type="button" data-disable-campaign="'+esc(c.id)+'" '+(!c.active?"disabled":"")+'>'+(c.active?tr("Stop","إيقاف"):tr("Ended","منتهية"))+'</button></article>';
    }).join(""):'<p class="empty-state">'+tr("No point-boost campaigns yet.","لا توجد حملات مضاعفة نقاط بعد.")+'</p>';
  }

  function renderConfig(){
    const c=state.data?.config||{};
    const enabled=$("rewardsEnabled"),rate=$("rewardsBaseRate");
    if(enabled)enabled.checked=c.enabled!==false;
    if(rate)rate.value=Number(c.base_rate||1);
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
  }
  function closeMember(){
    $("rewardsMemberModal").hidden=true;document.body.classList.remove("rewards-modal-open");state.member=null;
  }

  async function refreshAfter(message){
    state.data=await rpc("admin_data",{});
    render();if(state.member){const id=state.member.user_id;const next=(state.data.members||[]).find(m=>m.user_id===id);state.member=next||null;if(next){$("rewardsMemberModalMeta").textContent=(next.phone||next.code||"")+" · "+next.balance+" 🌿 · "+tierName(next.tier);}}
    if(message)toast(message);
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
    const value=Number($("rewardsGiftValue").value),minimum=Number($("rewardsGiftMinimum").value),reason=$("rewardsGiftReason").value.trim()||"Thank you";
    if(!(value>0&&value<=100&&minimum>=value))return toast(tr("Voucher value must be $0–$100 and minimum order must be at least the voucher value.","يجب أن تكون قيمة القسيمة بين 0 و100 دولار والحد الأدنى لا يقل عن قيمة القسيمة."),true);
    try{await rpc("admin_reward",{user_id:state.member.user_id,value,minimum,reason});await refreshAfter(tr("Voucher added to member wallet.","تمت إضافة القسيمة إلى محفظة العضو."));$("rewardsGiftValue").value="";$("rewardsGiftMinimum").value="";$("rewardsGiftReason").value="";}catch(err){toast(err.message,true);}
  }

  async function saveRule(id){
    const card=document.querySelector('[data-reward-rule="'+CSS.escape(id)+'"]');
    if(!card)return;
    const get=(name)=>card.querySelector('[data-rule-field="'+name+'"]');
    const p={id,points:Number(get("points").value),value:Number(get("value").value),minimum:Number(get("minimum").value),active:get("active").checked};
    try{await rpc("admin_reward_rule",p);await refreshAfter(tr("Reward rule saved.","تم حفظ قاعدة المكافأة."));}catch(err){toast(err.message,true);}
  }

  async function saveConfig(){
    const p={enabled:$("rewardsEnabled").checked,base_rate:Number($("rewardsBaseRate").value)};
    if(!(p.base_rate>=.1&&p.base_rate<=3))return toast(tr("Base rate must be between 0.1 and 3 points per $1.","يجب أن يكون المعدل بين 0.1 و3 نقاط لكل دولار."),true);
    try{await rpc("admin_config",p);await refreshAfter(tr("Mouneh Points settings saved.","تم حفظ إعدادات نقاط المونة."));}catch(err){toast(err.message,true);}
  }

  async function createCampaign(e){
    e.preventDefault();
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
      e.target.reset();$("rewardsCampaignMultiplier").value="2";
      await refreshAfter(tr("Point-boost campaign created.","تم إنشاء حملة مضاعفة النقاط."));
    }catch(err){toast(err.message,true);}
  }
  async function disableCampaign(id){
    try{await rpc("admin_campaign",{id});await refreshAfter(tr("Campaign stopped.","تم إيقاف الحملة."));}catch(err){toast(err.message,true);}
  }

  function enhanceCustomerCards(){
    const grid=$("customerGrid");
    if(!grid||!state.data)return;
    const byPhone=new Map((state.data.members||[]).map(m=>[phoneKey(m.phone),m]).filter(x=>x[0]));
    grid.querySelectorAll(".customer-card").forEach(card=>{
      card.querySelectorAll(".rewards-customer-badge").forEach(x=>x.remove());
      const small=card.querySelector(".customer-card-head small");
      const member=byPhone.get(phoneKey(small?.textContent||""));
      if(!member)return;
      const badge=document.createElement("span");
      badge.className="rewards-customer-badge";
      badge.textContent=member.balance+" 🌿 · "+tierName(member.tier);
      card.querySelector(".customer-card-stats")?.appendChild(badge);
    });
  }

  function setRewardsTitle(){
    const title=$("viewTitle");if(title)title.textContent=tr("Mouneh Points","نقاط المونة");
  }

  function bind(){
    document.addEventListener("click",(e)=>{
      const view=e.target.closest('[data-view="rewards"],[data-mobile-view="rewards"]');
      if(view){setTimeout(()=>{setRewardsTitle();load();},0);}
      const manage=e.target.closest("[data-rewards-manage]");if(manage)openMember(manage.dataset.rewardsManage);
      if(e.target.closest("#rewardsMemberModalClose")||e.target===$("rewardsMemberModal"))closeMember();
      if(e.target.closest("#rewardsRefresh"))load();
      if(e.target.closest("#rewardsAdjustButton"))adjustPoints();
      if(e.target.closest("#rewardsTierButton"))saveTier();
      if(e.target.closest("#rewardsGiftButton"))giftReward();
      const rule=e.target.closest("[data-save-rule]");if(rule)saveRule(rule.dataset.saveRule);
      if(e.target.closest("#rewardsSaveConfig"))saveConfig();
      const stop=e.target.closest("[data-disable-campaign]");if(stop&&!stop.disabled)disableCampaign(stop.dataset.disableCampaign);
    });
    $("rewardsMemberSearch")?.addEventListener("input",(e)=>{state.query=e.target.value;renderMembers();});
    $("rewardsCampaignForm")?.addEventListener("submit",createCampaign);
    document.addEventListener("keydown",(e)=>{if(e.key==="Escape"&&!$("rewardsMemberModal")?.hidden)closeMember()});
    const customers=$("customerGrid");if(customers)new MutationObserver(()=>enhanceCustomerCards()).observe(customers,{childList:true,subtree:true});
    new MutationObserver(()=>{if(document.querySelector('.dashboard-view[data-view-panel="rewards"].is-active')){setRewardsTitle();if(!state.data)load();}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:["class","hidden"]});
  }

  function init(){
    bind();
    const app=$("adminApp");
    if(app&&!app.hidden&&session())load();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();