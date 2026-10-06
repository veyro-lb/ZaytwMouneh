(function(){
"use strict";
if(window.__ZWM_CUSTOMER_NOTIFICATIONS_V1__)return;
window.__ZWM_CUSTOMER_NOTIFICATIONS_V1__=true;
const KEY="zwm:mouneh:session:v1";
const assetUrl=path=>window.ZWM_ASSET_URL?window.ZWM_ASSET_URL(path):path;
const CFG=assetUrl("/admin-config.js");
let cfg=null,user=null,rows=[];
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const lang=()=>{try{return window.ZWM_LOCALE?.get?.()||"en"}catch{return"en"}};
const C={
 en:{
  notifications:"Notifications",title:"Account alerts",copy:"Get important updates about orders and wholesale requests linked to this account.",
  enable:"Enable on this device",enabled:"On for this device",off:"Not enabled on this device",blocked:"Blocked by browser",
  unsupported:"Push notifications unavailable",test:"Send test",testing:"Sending test notification…",
  delivered:"Test notification delivered to this device.",retry:"Temporary delivery issue. It will retry automatically.",
  order:"Order status updates",orderHelp:"Order received, confirmed, preparing, out for delivery, delivered or cancelled.",wholesale:"Wholesale request updates",wholesaleHelp:"Status changes such as review, follow-up, approval or more information needed.",
  note:"Your phone or computer controls notification sounds, vibration, Focus and Do Not Disturb.",
  ios:"On iPhone, add Zayt w Mouneh to your Home Screen, open it there, then enable notifications.",
  empty:"No notifications yet.",markAll:"Mark all as read",now:"Now"
 },
 ar:{
  notifications:"الإشعارات",title:"تنبيهات الحساب",copy:"احصل على تحديثات مهمة حول الطلبات وطلبات الجملة المرتبطة بهذا الحساب.",
  enable:"تفعيل على هذا الجهاز",enabled:"مفعّلة على هذا الجهاز",off:"غير مفعّلة على هذا الجهاز",blocked:"محظورة من المتصفح",
  unsupported:"الإشعارات غير متاحة",test:"إرسال اختبار",testing:"جارٍ إرسال الإشعار التجريبي…",
  delivered:"تم تسليم الإشعار التجريبي إلى هذا الجهاز.",retry:"تعذّر التسليم مؤقتاً وسيتم إعادة المحاولة تلقائياً.",
  order:"تحديثات حالة الطلب",orderHelp:"تم الاستلام، التأكيد، التحضير، خرج للتوصيل، تم التسليم أو الإلغاء.",wholesale:"تحديثات طلبات الجملة",wholesaleHelp:"تغييرات الحالة مثل المراجعة أو المتابعة أو الموافقة أو الحاجة إلى معلومات إضافية.",
  note:"الهاتف أو الكمبيوتر هو الذي يتحكم بالصوت والاهتزاز ووضع التركيز وعدم الإزعاج.",
  ios:"على iPhone، أضف زيت ومونة إلى الشاشة الرئيسية وافتحه منها ثم فعّل الإشعارات.",
  empty:"لا توجد إشعارات بعد.",markAll:"تحديد الكل كمقروء",now:"الآن"
 },
 fr:{
  notifications:"Notifications",title:"Alertes du compte",copy:"Recevez les mises à jour importantes des commandes et demandes de gros liées à ce compte.",
  enable:"Activer sur cet appareil",enabled:"Activées sur cet appareil",off:"Non activées sur cet appareil",blocked:"Bloquées par le navigateur",
  unsupported:"Notifications push indisponibles",test:"Envoyer un test",testing:"Envoi de la notification test…",
  delivered:"Notification test livrée à cet appareil.",retry:"Échec temporaire. Une nouvelle tentative sera faite automatiquement.",
  order:"Mises à jour de commande",orderHelp:"Commande reçue, confirmée, en préparation, en livraison, livrée ou annulée.",wholesale:"Mises à jour des demandes de gros",wholesaleHelp:"Changements de statut : examen, suivi, approbation ou informations complémentaires.",
  note:"Votre téléphone ou ordinateur contrôle les sons, vibrations, Concentration et Ne pas déranger.",
  ios:"Sur iPhone, ajoutez Zayt w Mouneh à l’écran d’accueil, ouvrez-la depuis cet écran, puis activez les notifications.",
  empty:"Aucune notification.",markAll:"Tout marquer comme lu",now:"À l’instant"
 }
};
const tr=k=>(C[lang()]||C.en)[k]||k;
function sess(){try{return JSON.parse(localStorage.getItem(KEY)||"null")}catch{return null}}
async function setup(){
 if(window.ZWM_CMS_CONFIG){cfg=window.ZWM_CMS_CONFIG;return}
 await new Promise(res=>{const s=document.createElement("script");s.src=CFG;s.onload=res;s.onerror=res;document.head.appendChild(s)});
 cfg=window.ZWM_CMS_CONFIG||null;
}
function headers(extra={}){
 const s=sess();
 return {"apikey":cfg.supabasePublishableKey,"Content-Type":"application/json",...(s?.access_token?{"Authorization":"Bearer "+s.access_token}:{}),...extra};
}
async function api(path,opt={}){
 const r=await fetch(cfg.supabaseUrl.replace(/\/$/,"")+"/rest/v1/"+path,{...opt,headers:{...headers(),...(opt.headers||{})}});
 const d=await r.json().catch(()=>null);
 if(!r.ok)throw Error(d?.message||d?.hint||"Request failed");
 return d;
}
async function me(){
 const s=sess();if(!s?.access_token)return null;
 const r=await fetch(cfg.supabaseUrl.replace(/\/$/,"")+"/auth/v1/user",{headers:headers()});
 return r.ok?r.json():null;
}
function b64(s){const p="=".repeat((4-s.length%4)%4),raw=atob((s+p).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
async function reg(){if(!("serviceWorker"in navigator))throw Error(tr("unsupported"));return navigator.serviceWorker.register(assetUrl("/admin-sw.js"),{scope:"/",updateViaCache:"none"})}
async function currentSub(){try{return(await reg()).pushManager.getSubscription()}catch{return null}}
async function registeredDevice(){
 const s=await currentSub();if(!s)return null;
 const d=await api("push_subscriptions?select=id,endpoint,enabled,revoked_at,last_success_at&user_id=eq."+encodeURIComponent(user.id)+"&audience=eq.customer&endpoint=eq."+encodeURIComponent(s.endpoint)+"&enabled=eq.true&revoked_at=is.null&limit=1").catch(()=>[]);
 return d?.[0]||null;
}
async function subscribe(){
 if(!("Notification"in window)||!("PushManager"in window))throw Error(tr("unsupported"));
 if(Notification.permission==="denied")throw Error(tr("blocked"));
 if(Notification.permission!=="granted"&&await Notification.requestPermission()!=="granted")throw Error(tr("blocked"));
 const registration=await reg();await navigator.serviceWorker.ready;
 let sub=await registration.pushManager.getSubscription();
 let key=await api("rpc/zwm_push_public_key",{method:"POST",body:"{}"});
 if(!key){await new Promise(x=>setTimeout(x,700));key=await api("rpc/zwm_push_public_key",{method:"POST",body:"{}"})}
 if(!key)throw Error("Push temporarily unavailable");
 if(!sub)sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(key)});
 const j=sub.toJSON();
 await api("push_subscriptions?on_conflict=endpoint,audience",{method:"POST",headers:{"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({
  user_id:user.id,audience:"customer",endpoint:j.endpoint,p256dh:j.keys.p256dh,auth_key:j.keys.auth,
  device_label:/iPhone/i.test(navigator.userAgent)?"iPhone":/iPad/i.test(navigator.userAgent)?"iPad":/Android/i.test(navigator.userAgent)?"Android":/Windows/i.test(navigator.userAgent)?"Windows PC":/Mac/i.test(navigator.userAgent)?"Mac":"Browser device",
  browser_label:(navigator.userAgent||"").slice(0,100),locale:lang(),enabled:true,revoked_at:null,last_used_at:new Date().toISOString()
 })});
 return registeredDevice();
}
async function bootstrapPrefs(){
 const now=new Date().toISOString(),defaults=["order_updates","wholesale"].map(category=>({user_id:user.id,category,in_app_enabled:true,push_enabled:true,updated_at:now}));
 await api("notification_preferences?on_conflict=user_id,category",{method:"POST",headers:{"Prefer":"resolution=ignore-duplicates,return=minimal"},body:JSON.stringify(defaults)}).catch(()=>{});
}
function statusTitle(n){
 const m=n.metadata||{},ref=m.reference||n.entity_id||"";
 if(n.notification_type==="ORDER_CREATED")return (lang()==="ar"?"تم استلام الطلب":lang()==="fr"?"Commande reçue":"Order received")+(ref?" · "+ref:"");
 if(n.notification_type==="ORDER_STATUS_CHANGED"){
  const map={
   en:{confirmed:"Order confirmed",preparing:"Order is being prepared",out_for_delivery:"Out for delivery",delivered:"Order delivered",cancelled:"Order cancelled"},
   ar:{confirmed:"تم تأكيد الطلب",preparing:"الطلب قيد التحضير",out_for_delivery:"الطلب خرج للتوصيل",delivered:"تم تسليم الطلب",cancelled:"تم إلغاء الطلب"},
   fr:{confirmed:"Commande confirmée",preparing:"Commande en préparation",out_for_delivery:"Commande en livraison",delivered:"Commande livrée",cancelled:"Commande annulée"}
  };
  return ((map[lang()]||map.en)[m.status]||tr("notifications"))+(ref?" · "+ref:"");
 }
 if(n.notification_type==="WHOLESALE_STATUS_CHANGED"){
  const map={
   en:{new:"Wholesale request received",contacted:"Wholesale request contacted",needs_information:"Wholesale request needs information",quote_preparing:"Wholesale quote in preparation",quote_sent:"Wholesale quote sent",negotiating:"Wholesale request in discussion",approved:"Wholesale request approved",converted:"Wholesale request completed",lost:"Wholesale request closed",archived:"Wholesale request archived"},
   ar:{new:"تم استلام طلب الجملة",contacted:"تم التواصل بشأن طلب الجملة",needs_information:"طلب الجملة يحتاج معلومات إضافية",quote_preparing:"يتم تحضير عرض الجملة",quote_sent:"تم إرسال عرض الجملة",negotiating:"طلب الجملة قيد المناقشة",approved:"تمت الموافقة على طلب الجملة",converted:"اكتمل طلب الجملة",lost:"تم إغلاق طلب الجملة",archived:"تمت أرشفة طلب الجملة"},
   fr:{new:"Demande de gros reçue",contacted:"Contact effectué pour la demande de gros",needs_information:"Informations requises pour la demande de gros",quote_preparing:"Devis de gros en préparation",quote_sent:"Devis de gros envoyé",negotiating:"Demande de gros en discussion",approved:"Demande de gros approuvée",converted:"Demande de gros finalisée",lost:"Demande de gros clôturée",archived:"Demande de gros archivée"}
  };
  return ((map[lang()]||map.en)[m.status]||tr("wholesale"))+(ref?" · "+ref:"");
 }
 return tr("notifications");
}
function iconFor(n){if(n.notification_type==="WHOLESALE_STATUS_CHANGED")return"📦";if(n.notification_type==="ORDER_CREATED")return"🧺";if(n.notification_type==="ORDER_STATUS_CHANGED"){const s=n.metadata?.status;return s==="out_for_delivery"?"🚚":s==="delivered"?"✓":s==="cancelled"?"×":"📦"}return"🔔"}
function timeLabel(v){const t=new Date(v),s=Math.max(0,Math.floor((Date.now()-t.getTime())/1000));if(s<60)return tr("now");if(s<3600)return Math.floor(s/60)+(lang()==="ar"?" د":lang()==="fr"?" min":" min");if(s<86400)return Math.floor(s/3600)+(lang()==="ar"?" س":lang()==="fr"?" h":" h");return t.toLocaleDateString(lang()==="ar"?"ar-LB":lang()==="fr"?"fr-LB":"en-LB",{month:"short",day:"numeric"})}
function safeRoute(route){try{const u=new URL(route||"/account",location.origin);return u.origin===location.origin?u.pathname+u.search+u.hash:"/account"}catch{return"/account"}}
async function fetchNotifications(){
 const all=await api("notifications?select=*&user_id=eq."+encodeURIComponent(user.id)+"&audience=eq.customer&order=created_at.desc&limit=40");
 rows=(all||[]).filter(n=>n.notification_type!=="TEST_PUSH");
 return rows;
}
async function markRead(id){await api("notifications?id=eq."+encodeURIComponent(id),{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({read_at:new Date().toISOString()})})}
async function markAll(){await api("notifications?user_id=eq."+encodeURIComponent(user.id)+"&audience=eq.customer&read_at=is.null",{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({read_at:new Date().toISOString()})});await refreshBell()}
async function refreshBell(){
 if(!user)return;
 try{
  await fetchNotifications();
  const unread=rows.filter(n=>!n.read_at).length,b=$("#zwmCustomerNotificationBadge"),list=$("#zwmCustomerNotificationList");
  if(b){b.textContent=String(unread);b.hidden=!unread}
  if(list)list.innerHTML=rows.length?rows.slice(0,20).map(n=>'<button type="button" class="zwm-notification-item '+(!n.read_at?"is-unread":"")+'" data-customer-notification="'+n.id+'"><span class="zwm-notification-icon" aria-hidden="true">'+iconFor(n)+'</span><span class="zwm-notification-copy"><strong>'+esc(statusTitle(n))+'</strong><small>'+esc(timeLabel(n.created_at))+'</small></span>'+(!n.read_at?'<span class="zwm-unread-dot" aria-label="Unread"></span>':'')+'</button>').join(""):'<p class="zwm-notification-empty">'+esc(tr("empty"))+'</p>';
 }catch{}
}
function bellShell(){
 const actions=$(".site-header .nav-actions")||$(".c6-nav-actions")||$(".commerce-header-actions")||$(".nav-actions");
 if(!actions)return;
 let bell=$("#zwmCustomerNotificationBell");
 if(bell&&bell.parentElement!==actions)actions.insertBefore(bell,actions.querySelector("#mounehRewardsButton,#mounehAccountButton,a[href^='/account'],a[href*='/account']")||null);
 if(bell)return;
 bell=document.createElement("button");
 bell.id="zwmCustomerNotificationBell";bell.className="zwm-customer-notification-bell";bell.type="button";bell.setAttribute("aria-label",tr("notifications"));
 bell.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><span id="zwmCustomerNotificationBadge" hidden>0</span>';
 const anchor=actions.querySelector("#mounehRewardsButton,#mounehAccountButton,a[href^='/account'],a[href*='/account']");
 actions.insertBefore(bell,anchor||null);
 let pop=$("#zwmCustomerNotificationPopover");
 if(!pop){
  pop=document.createElement("section");pop.id="zwmCustomerNotificationPopover";pop.className="zwm-notification-popover zwm-customer-notification-popover";pop.hidden=true;
  pop.innerHTML='<header><strong>'+esc(tr("notifications"))+'</strong><button type="button" class="zwm-mark-all" data-customer-mark-all>'+esc(tr("markAll"))+'</button></header><div id="zwmCustomerNotificationList"></div>';
  document.body.appendChild(pop);
  pop.addEventListener("click",e=>{if(e.target.closest("[data-customer-mark-all]")){markAll();return}const item=e.target.closest("[data-customer-notification]");if(!item)return;const n=rows.find(x=>x.id===item.dataset.customerNotification);if(n){markRead(n.id).catch(()=>{});location.href=safeRoute(n.route)}});
 }
 bell.addEventListener("click",e=>{e.stopPropagation();pop.hidden=!pop.hidden;if(!pop.hidden)refreshBell()});
 if(!document.documentElement.dataset.zwmCustomerNotificationDismissBound){
  document.documentElement.dataset.zwmCustomerNotificationDismissBound="1";
  document.addEventListener("click",e=>{const p=$("#zwmCustomerNotificationPopover");if(p&&!p.hidden&&!e.target.closest("#zwmCustomerNotificationPopover")&&!e.target.closest("#zwmCustomerNotificationBell"))p.hidden=true});
 }
 refreshBell();
}
async function testProduction(root){
 const help=$("[data-help]",root),device=await registeredDevice();
 if(!device)throw Error(lang()==="ar"?"فعّل الإشعارات على هذا الجهاز أولاً.":lang()==="fr"?"Activez d’abord les notifications sur cet appareil.":"Enable notifications on this device first.");
 help.textContent=tr("testing");
 const notificationId=await api("rpc/notification_create_customer_test",{method:"POST",body:JSON.stringify({p_subscription_id:device.id})});
 let status=null;
 for(let i=0;i<8;i++){
  await new Promise(x=>setTimeout(x,500));
  status=await api("rpc/notification_test_status",{method:"POST",body:JSON.stringify({p_notification_id:notificationId})}).catch(()=>null);
  if(status&&["sent","dead","no_subscriptions","disabled"].includes(status.status))break;
 }
 if(status?.status==="sent"&&status?.delivery_state==="accepted"){
  help.textContent=tr("delivered");
  await api("notifications?id=eq."+encodeURIComponent(notificationId),{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({read_at:new Date().toISOString()})}).catch(()=>{});
  refreshBell().catch(()=>{});
 }else if(status?.status==="retry")help.textContent=tr("retry");
 else if(status)throw Error("Test push failed: "+(status.error_category||status.last_error||status.status));
 else help.textContent=lang()==="ar"?"تم وضع الاختبار في قائمة الإرسال.":lang()==="fr"?"Test mis en file d’attente.":"Test queued for delivery.";
}
async function renderCard(root){
 const badge=$("[data-state]",root),enable=$("[data-enable]",root),test=$("[data-test]",root),help=$("[data-help]",root);
 const unsupported=!window.Notification||!("PushManager"in window)||!("serviceWorker"in navigator);
 const denied=!unsupported&&Notification.permission==="denied";
 const device=unsupported||denied?null:await registeredDevice();
 badge.classList.toggle("is-on",!!device);
 badge.classList.toggle("is-off",!device);
 badge.textContent=unsupported?tr("unsupported"):denied?tr("blocked"):device?tr("enabled"):tr("off");
 enable.hidden=unsupported||denied||!!device;
 test.disabled=!device;
 test.setAttribute("aria-disabled",String(!device));
 if(/iPhone|iPad/i.test(navigator.userAgent)&&!matchMedia("(display-mode: standalone)").matches&&!device)help.textContent=tr("ios");
 const prefs=await api("notification_preferences?select=*&user_id=eq."+encodeURIComponent(user.id));
 const prefMap=new Map((prefs||[]).map(x=>[x.category,x]));
 root.querySelectorAll("[data-pref]").forEach(input=>{const pref=prefMap.get(input.dataset.pref);input.checked=pref?pref.push_enabled!==false:true});
}
async function cardAction(e){
 const root=e.currentTarget,help=$("[data-help]",root);
 try{
  if(e.target.closest("[data-enable]")){help.textContent="";await subscribe();help.textContent=tr("enabled");await renderCard(root);await refreshBell()}
  if(e.target.closest("[data-test]"))await testProduction(root);
  const t=e.target.closest("[data-pref]");if(t)await api("notification_preferences?user_id=eq."+encodeURIComponent(user.id)+"&category=eq."+encodeURIComponent(t.dataset.pref),{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({push_enabled:t.checked,updated_at:new Date().toISOString()})});
 }catch(err){help.textContent=err?.message||"Notification setup failed"}
}
function cardShell(){
 const host=$('[data-account-panel="profile"]');if(!host||$("#zwmCustomerNotifications"))return;
 const card=document.createElement("section");card.id="zwmCustomerNotifications";card.className="account-card zwm-account-notifications";
 card.innerHTML='<div class="zwm-customer-notification-head"><div><p class="account-eyebrow">'+esc(tr("notifications"))+'</p><h2>'+esc(tr("title"))+'</h2><p>'+esc(tr("copy"))+'</p></div><span class="zwm-customer-notification-state" data-state></span></div><div class="zwm-customer-notification-control"><div><strong>'+esc(tr("order"))+'</strong><small>'+esc(tr("orderHelp"))+'</small></div><label class="zwm-customer-switch"><input type="checkbox" data-pref="order_updates"><span aria-hidden="true"></span></label></div><div class="zwm-customer-notification-control"><div><strong>'+esc(tr("wholesale"))+'</strong><small>'+esc(tr("wholesaleHelp"))+'</small></div><label class="zwm-customer-switch"><input type="checkbox" data-pref="wholesale"><span aria-hidden="true"></span></label></div><div class="zwm-customer-notification-footer"><div class="zwm-notification-actions"><button class="account-primary" type="button" data-enable>'+esc(tr("enable"))+'</button><button type="button" data-test>'+esc(tr("test"))+'</button></div><p class="account-status" data-help></p></div><p class="zwm-customer-notification-note">'+esc(tr("note"))+'</p>';
 host.appendChild(card);card.addEventListener("click",cardAction);renderCard(card);
}
async function boot(){
 const accountPage=document.body.dataset.page==="account";
 await setup();if(!cfg)return;
 user=await me();if(!user)return;
 if(accountPage)await bootstrapPrefs();
 bellShell();if(accountPage)cardShell();
 const obs=new MutationObserver(()=>{bellShell();if(accountPage)cardShell()});obs.observe(document.body,{subtree:true,childList:true});
 window.addEventListener("focus",()=>{refreshBell();const card=$("#zwmCustomerNotifications");if(card)renderCard(card)});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshBell()});
 setInterval(()=>{if(!document.hidden)refreshBell()},30000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();