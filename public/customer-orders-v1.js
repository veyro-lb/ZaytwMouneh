(function(){
"use strict";

var SESSION_KEY="zwm:mouneh:session:v1";
var CLAIMS_KEY="zwm:mouneh:claims:v1";
var state={orders:[],counts:{all:0,active:0,delivered:0,cancelled:0},filter:"all",loading:false,loaded:false,error:"",claiming:false,lastLoaded:0};
var mountQueued=false;

function qs(s,r){return (r||document).querySelector(s)}
function qsa(s,r){return Array.from((r||document).querySelectorAll(s))}
function ar(){return document.documentElement.lang==="ar"||document.documentElement.dir==="rtl"}
function tr(en,arText){return ar()?arText:en}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function money(v){return "$"+(Number(v)||0).toFixed(2)}
function read(key,fallback){try{var raw=localStorage.getItem(key);return raw==null?fallback:JSON.parse(raw)}catch{return fallback}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function session(){return read(SESSION_KEY,null)}
function rewardsState(){try{return window.ZWM_REWARDS&&window.ZWM_REWARDS.getState?window.ZWM_REWARDS.getState():{}}catch{return {}}}
function statusLabel(s){
  var en={new:"Order received",confirmed:"Confirmed",preparing:"Preparing",out_for_delivery:"Out for delivery",delivered:"Delivered",cancelled:"Cancelled"};
  var aa={new:"تم استلام الطلب",confirmed:"تم التأكيد",preparing:"قيد التحضير",out_for_delivery:"خرج للتوصيل",delivered:"تم التسليم",cancelled:"ملغي"};
  return (ar()?aa:en)[s]||s||"";
}
function statusClass(s){return s==="cancelled"?"is-cancelled":s==="delivered"?"":"is-pending"}
function formatDate(v){try{return new Date(v).toLocaleDateString(ar()?"ar-LB":"en-LB",{year:"numeric",month:"short",day:"numeric"})}catch{return ""}}

async function ensureConfig(){
  if(window.ZWM_CMS_CONFIG&&window.ZWM_CMS_CONFIG.supabaseUrl&&window.ZWM_CMS_CONFIG.supabasePublishableKey)return window.ZWM_CMS_CONFIG;
  await new Promise(function(resolve){
    var existing=qs('script[data-customer-orders-config]');
    if(existing){
      if(window.ZWM_CMS_CONFIG)return resolve();
      existing.addEventListener("load",resolve,{once:true});
      existing.addEventListener("error",resolve,{once:true});
      setTimeout(resolve,1200);
      return;
    }
    var script=document.createElement("script");
    script.src=window.ZWM_ASSET_URL?window.ZWM_ASSET_URL("/admin-config.js"):"/admin-config.js";
    script.dataset.customerOrdersConfig="1";
    script.onload=resolve;
    script.onerror=resolve;
    document.head.appendChild(script);
  });
  return window.ZWM_CMS_CONFIG||{};
}

async function rpc(action,p){
  var cfg=await ensureConfig(),sess=session();
  if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)throw new Error(tr("Order services are temporarily unavailable.","خدمة الطلبات غير متاحة مؤقتاً."));
  var headers={"apikey":cfg.supabasePublishableKey,"Content-Type":"application/json","Prefer":"return=representation"};
  if(sess&&sess.access_token)headers.Authorization="Bearer "+sess.access_token;
  var response=await fetch(String(cfg.supabaseUrl).replace(/\/$/,"")+"/rest/v1/rpc/zwm_customer_orders",{
    method:"POST",
    headers:headers,
    body:JSON.stringify({action:action,p:p||{}})
  });
  var data=await response.json().catch(function(){return {}});
  if(!response.ok)throw new Error(data.message||data.hint||data.details||tr("Could not load your orders.","تعذّر تحميل طلباتك."));
  return data;
}

function claimRows(){
  var rows=read(CLAIMS_KEY,[]);
  return Array.isArray(rows)?rows.filter(function(x){return x&&x.reference&&x.claim_token}):[];
}
async function claimGuestOrders(){
  var rs=rewardsState(),sess=session(),rows=claimRows();
  if(state.claiming||!rs.member||!sess||!sess.access_token||!rows.length)return 0;
  state.claiming=true;
  var kept=[],claimed=0;
  try{
    for(var i=0;i<rows.length;i++){
      try{
        await rpc("claim",{reference:rows[i].reference,claim_token:rows[i].claim_token});
        claimed++;
      }catch(err){
        kept.push(rows[i]);
      }
    }
    if(claimed){
      write(CLAIMS_KEY,kept.slice(-20));
      try{await window.ZWM_REWARDS.refresh()}catch{}
    }
    return claimed;
  }finally{
    state.claiming=false;
  }
}

async function loadOrders(options){
  options=options||{};
  var rs=rewardsState(),sess=session();
  if(!rs.member||!sess||!sess.access_token){
    state.orders=[];state.counts={all:0,active:0,delivered:0,cancelled:0};state.loaded=false;state.loading=false;state.error="";
    scheduleMount();
    return;
  }
  if(state.loading)return;
  state.loading=true;
  state.error="";
  if(!options.silent)scheduleMount();
  try{
    await claimGuestOrders();
    var out=await rpc("list",{filter:"all"});
    state.orders=Array.isArray(out&&out.orders)?out.orders:[];
    state.counts=Object.assign({all:0,active:0,delivered:0,cancelled:0},out&&out.counts||{});
    state.loaded=true;
    state.lastLoaded=Date.now();
  }catch(err){
    state.error=err&&err.message?err.message:String(err);
    state.loaded=true;
  }finally{
    state.loading=false;
    scheduleMount();
  }
}

function filteredOrders(){
  if(state.filter==="active")return state.orders.filter(function(o){return ["new","confirmed","preparing","out_for_delivery"].includes(o.status)});
  if(state.filter==="delivered")return state.orders.filter(function(o){return o.status==="delivered"});
  if(state.filter==="cancelled")return state.orders.filter(function(o){return o.status==="cancelled"});
  return state.orders;
}
function pointsText(o){
  if(o.rewards_state==="earned"||Number(o.points_awarded||0)>0)return "+"+Number(o.points_awarded||0)+" 🌿";
  if(o.status==="cancelled"||o.rewards_state==="none")return tr("No points","بدون نقاط");
  if(o.rewards_state==="waiting_payment")return Number(o.pending_points||0)>0?"~"+Number(o.pending_points)+" 🌿 "+tr("waiting for payment","بانتظار الدفع"):tr("Waiting for payment","بانتظار الدفع");
  if(o.rewards_state==="waiting_delivery")return Number(o.pending_points||0)>0?"~"+Number(o.pending_points)+" 🌿 "+tr("waiting for delivery","بانتظار التسليم"):tr("Waiting for delivery","بانتظار التسليم");
  return Number(o.pending_points||0)>0?"~"+Number(o.pending_points)+" 🌿 "+tr("pending","معلّقة"):tr("Points pending","النقاط معلّقة");
}
function previewText(o){
  var preview=Array.isArray(o.preview)?o.preview.filter(Boolean):[],items=Number(o.item_count)||0;
  if(!preview.length)return items+" "+tr(items===1?"item":"items","منتج");
  var text=preview.join(" · ");
  if(items>preview.length)text+=" · +"+(items-preview.length);
  return text;
}

function filterButton(id,en,arText){
  return '<button type="button" data-customer-order-filter="'+id+'" class="'+(state.filter===id?"is-active":"")+'"><span>'+tr(en,arText)+'</span><b>'+Number(state.counts[id]||0)+'</b></button>';
}
function orderCard(o){
  return '<article class="customer-order-card">'+
    '<div class="customer-order-card-head"><div><small>'+esc(formatDate(o.submitted_at))+'</small><strong>'+esc(o.reference||tr("Order","طلب"))+'</strong></div><span class="account-pill '+statusClass(o.status)+'">'+esc(statusLabel(o.status))+'</span></div>'+
    '<p class="customer-order-preview">'+esc(previewText(o))+'</p>'+
    '<div class="customer-order-meta"><span><small>'+tr("Total","المجموع")+'</small><strong>'+money(o.total)+'</strong></span><span><small>'+tr("Mouneh Points","نقاط المونة")+'</small><strong>'+pointsText(o)+'</strong></span></div>'+
    '<div class="customer-order-actions"><a class="account-primary" href="/order.html?ref='+encodeURIComponent(o.reference)+'">'+tr("View details","عرض التفاصيل")+'</a><a href="/shop.html">'+tr("Shop again","التسوق مجدداً")+'</a></div>'+
  '</article>';
}

function mountOrdersPanel(){
  var panel=qs('[data-account-panel="orders"]');
  if(!panel)return;
  var stamp=[state.lastLoaded,state.filter,state.loading,state.error,ar(),state.orders.length].join("|");
  if(panel.dataset.customerOrdersStamp===stamp)return;
  panel.dataset.customerOrdersStamp=stamp;
  var rows=filteredOrders();
  panel.innerHTML='<article class="account-card customer-orders-shell">'+
    '<div class="account-section-title"><div><h2>'+tr("My Orders","طلباتي")+'</h2><p>'+tr("Orders placed on the website appear here automatically. Guest orders from this browser are securely added after sign-in.","تظهر الطلبات التي تتم عبر الموقع هنا تلقائياً. وتُضاف طلبات الضيف من هذا المتصفح بأمان بعد تسجيل الدخول.")+'</p></div>'+
    '<button type="button" class="customer-orders-refresh" data-customer-orders-refresh '+(state.loading?"disabled":"")+'>'+tr(state.loading?"Refreshing…":"Refresh",state.loading?"جارٍ التحديث…":"تحديث")+'</button></div>'+
    '<div class="customer-order-filters">'+
      filterButton("all","All","الكل")+filterButton("active","Active","قيد التنفيذ")+filterButton("delivered","Delivered","تم التسليم")+filterButton("cancelled","Cancelled","ملغي")+
    '</div>'+
    (state.error?'<p class="account-status customer-order-error">'+esc(state.error)+'</p>':"")+
    '<div class="customer-order-grid">'+
      (rows.length?rows.map(orderCard).join(""):'<div class="customer-order-empty"><span>🧺</span><strong>'+tr("No orders in this view yet.","لا توجد طلبات في هذا القسم بعد.")+'</strong><a href="/shop.html">'+tr("Start shopping","ابدأ التسوق")+' →</a></div>')+
    '</div>'+
  '</article>';
}

function mountOverview(){
  var panel=qs('[data-account-panel="overview"]');
  if(!panel)return;
  var stamp=[state.lastLoaded,state.orders.length,ar()].join("|");
  if(panel.dataset.customerLatestStamp===stamp)return;
  panel.dataset.customerLatestStamp=stamp;
  qsa(".customer-latest-order",panel).forEach(function(el){el.remove()});
  if(!state.orders.length)return;
  var latest=state.orders[0],grid=qs(".account-grid",panel);
  if(!grid)return;
  var card=document.createElement("article");
  card.className="account-card customer-latest-order";
  card.innerHTML='<div class="account-section-title"><div><h2>'+tr("Latest order","آخر طلب")+'</h2><p>'+esc(latest.reference)+' · '+esc(formatDate(latest.submitted_at))+'</p></div><span class="account-pill '+statusClass(latest.status)+'">'+esc(statusLabel(latest.status))+'</span></div>'+
    '<div class="customer-latest-body"><span><small>'+tr("Total","المجموع")+'</small><strong>'+money(latest.total)+'</strong></span><span><small>'+tr("Mouneh Points","نقاط المونة")+'</small><strong>'+pointsText(latest)+'</strong></span><a class="account-primary" href="/order.html?ref='+encodeURIComponent(latest.reference)+'">'+tr("View order","عرض الطلب")+'</a></div>';
  grid.insertAdjacentElement("afterend",card);
}

function mount(){
  mountQueued=false;
  if(document.body.dataset.page!=="account")return;
  var rs=rewardsState();
  if(!rs.member)return;
  mountOrdersPanel();
  mountOverview();
}
function scheduleMount(){
  if(mountQueued)return;
  mountQueued=true;
  requestAnimationFrame(mount);
}
function injectCss(){
  if(qs('link[data-customer-orders-css]'))return;
  var link=document.createElement("link");
  link.rel="stylesheet";
  link.href=window.ZWM_ASSET_URL?window.ZWM_ASSET_URL("/customer-orders-v1.css"):"/customer-orders-v1.css";
  link.dataset.customerOrdersCss="1";
  document.head.appendChild(link);
}

document.addEventListener("click",function(e){
  var filter=e.target.closest&&e.target.closest("[data-customer-order-filter]");
  if(filter){state.filter=filter.dataset.customerOrderFilter||"all";scheduleMount();return}
  var refresh=e.target.closest&&e.target.closest("[data-customer-orders-refresh]");
  if(refresh){loadOrders();return}
});
document.addEventListener("zwm:account-updated",function(){loadOrders({silent:true})});
window.addEventListener("focus",function(){if(Date.now()-state.lastLoaded>4000)loadOrders({silent:true})});
window.addEventListener("online",function(){loadOrders({silent:true})});
window.addEventListener("storage",function(e){
  if(!e.key||e.key===SESSION_KEY||e.key===CLAIMS_KEY||String(e.key).indexOf("zwm:rewards")===0)loadOrders({silent:true});
});
document.addEventListener("visibilitychange",function(){if(!document.hidden&&Date.now()-state.lastLoaded>4000)loadOrders({silent:true})});

function init(){
  injectCss();
  var root=qs("#accountShell")||document.body;
  new MutationObserver(function(){scheduleMount();var rs=rewardsState();if(rs.member&&!state.loaded&&!state.loading)loadOrders({silent:true})}).observe(root,{childList:true,subtree:true});
  var tries=0,timer=setInterval(function(){
    tries++;
    var rs=rewardsState();
    if(rs.member){clearInterval(timer);loadOrders();scheduleMount()}
    else if(tries>30)clearInterval(timer);
  },300);
  setInterval(function(){if(!document.hidden&&rewardsState().member)loadOrders({silent:true})},8000);
  scheduleMount();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();