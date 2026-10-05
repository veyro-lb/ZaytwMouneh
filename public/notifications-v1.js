(function(){
"use strict";
const CFG_URL="/admin-config.js?v=20261005-notify1";
const OWNER_SESSION_KEY="zwm:owner-session:v3";
const CUSTOMER_SESSION_KEY="zwm:mouneh:session:v1";
const VERSION="20261005-notify1";
let cfg=null,client=null,user=null,mode="",channel=null,bc=null,soundLeader=false;
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const locale=()=>{try{if(localStorage.getItem("zwm:french:v1")==="1")return"fr";const l=localStorage.getItem("zwm-lang-v2");return l==="ar"?"ar":"en"}catch{return document.documentElement.lang==="ar"?"ar":document.documentElement.lang==="fr"?"fr":"en"}};
const T={
 en:{notifications:"Notifications",empty:"No notifications yet.",markAll:"Mark all as read",enable:"Enable notifications",enabled:"Notifications enabled",blocked:"Browser blocked notifications",unsupported:"Push notifications aren't available in this browser. You can still see alerts here.",orders:"New orders",wholesale:"Wholesale / Jemle inquiries",payments:"Important payment issues",requests:"Customer requests",low:"Low stock",out:"Out of stock",reviews:"Reviews",routine:"Routine activity",orderUpdates:"Order updates",backStock:"Back-in-stock alerts",points:"Mouneh Points updates",marketing:"Offers & announcements",devices:"Your notification devices",disable:"Disable notifications on this device",remove:"Remove device",test:"Send test notification",phoneHelp:"On iPhone, add Zayt w Mouneh to your Home Screen, open it from there, then tap Enable notifications.",deviceNote:"Your phone or computer controls notification sounds, vibration, Focus and Do Not Disturb.",never:"Never miss a new order",neverCopy:"Receive an alert on this device even when Zayt w Mouneh is closed.",customerTitle:"Order notifications",customerCopy:"Get updates when the status of your order changes.",loading:"Loading notifications…",retry:"Retry",permission:"Permission not yet requested",unavailable:"Temporarily unavailable"},
 ar:{notifications:"الإشعارات",empty:"لا توجد إشعارات بعد.",markAll:"تحديد الكل كمقروء",enable:"تفعيل الإشعارات",enabled:"الإشعارات مفعّلة",blocked:"المتصفح حظر الإشعارات",unsupported:"الإشعارات غير متاحة في هذا المتصفح. يمكنك رؤية جميع التنبيهات هنا.",orders:"الطلبات الجديدة",wholesale:"استفسارات الجملة",payments:"مشاكل الدفع المهمة",requests:"طلبات العملاء",low:"مخزون منخفض",out:"نفاد المخزون",reviews:"التقييمات",routine:"النشاط العادي",orderUpdates:"تحديثات الطلب",backStock:"تنبيهات عودة المخزون",points:"تحديثات نقاط المونة",marketing:"العروض والإعلانات",devices:"أجهزة الإشعارات",disable:"إيقاف الإشعارات على هذا الجهاز",remove:"إزالة الجهاز",test:"إرسال إشعار تجريبي",phoneHelp:"على iPhone، أضف زيت ومونة إلى الشاشة الرئيسية، افتحه منها، ثم اضغط تفعيل الإشعارات.",deviceNote:"الهاتف أو الكمبيوتر هو الذي يتحكم بالصوت والاهتزاز ووضع التركيز وعدم الإزعاج.",never:"لا تفوّت طلباً جديداً",neverCopy:"استلم تنبيهاً على هذا الجهاز حتى عندما تكون زيت ومونة مغلقة.",customerTitle:"إشعارات الطلب",customerCopy:"احصل على تحديثات عند تغيّر حالة طلبك.",loading:"جارٍ تحميل الإشعارات…",retry:"إعادة المحاولة",permission:"لم يتم طلب الإذن بعد",unavailable:"غير متاح مؤقتاً"},
 fr:{notifications:"Notifications",empty:"Aucune notification pour le moment.",markAll:"Tout marquer comme lu",enable:"Activer les notifications",enabled:"Notifications activées",blocked:"Les notifications sont bloquées par le navigateur",unsupported:"Les notifications push ne sont pas disponibles dans ce navigateur. Vous pouvez toujours voir les alertes ici.",orders:"Nouvelles commandes",wholesale:"Demandes de gros / Jemle",payments:"Problèmes de paiement importants",requests:"Demandes clients",low:"Stock faible",out:"Rupture de stock",reviews:"Avis",routine:"Activité courante",orderUpdates:"Mises à jour de commande",backStock:"Alertes de retour en stock",points:"Mises à jour Mouneh Points",marketing:"Offres et annonces",devices:"Vos appareils de notification",disable:"Désactiver les notifications sur cet appareil",remove:"Supprimer l’appareil",test:"Envoyer une notification test",phoneHelp:"Sur iPhone, ajoutez Zayt w Mouneh à l’écran d’accueil, ouvrez-la depuis cet écran, puis touchez Activer les notifications.",deviceNote:"Votre téléphone ou ordinateur contrôle les sons, vibrations, modes Concentration et Ne pas déranger.",never:"Ne manquez jamais une nouvelle commande",neverCopy:"Recevez une alerte sur cet appareil même lorsque Zayt w Mouneh est fermé.",customerTitle:"Notifications de commande",customerCopy:"Recevez une mise à jour lorsque le statut de votre commande change.",loading:"Chargement des notifications…",retry:"Réessayer",permission:"Autorisation pas encore demandée",unavailable:"Temporairement indisponible"}
};
const tr=k=>T[locale()]?.[k]||T.en[k]||k;
function session(){
 const key=mode==="admin"?OWNER_SESSION_KEY:CUSTOMER_SESSION_KEY;
 try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}
}
async function ensureCfg(){
 if(window.ZWM_CMS_CONFIG){cfg=window.ZWM_CMS_CONFIG;return}
 await new Promise(res=>{const s=document.createElement("script");s.src=CFG_URL;s.onload=res;s.onerror=res;document.head.appendChild(s)});
 cfg=window.ZWM_CMS_CONFIG||null;
}
function headers(extra={}){
 const s=session();return {"apikey":cfg.supabasePublishableKey,"Content-Type":"application/json",...(s?.access_token?{"Authorization":"Bearer "+s.access_token}:{}),...extra}
}
async function req(path,opts={}){
 const r=await fetch(cfg.supabaseUrl.replace(/\/$/,"")+"/rest/v1/"+path,{...opts,headers:{...headers(),...(opts.headers||{})}});
 const data=await r.json().catch(()=>null);if(!r.ok)throw new Error(data?.message||data?.hint||"Request failed");return data
}
async function currentUser(){
 const s=session();if(!s?.access_token)return null;
 const r=await fetch(cfg.supabaseUrl.replace(/\/$/,"")+"/auth/v1/user",{headers:headers()});if(!r.ok)return null;return r.json()
}
function b64ToUint8(s){const pad="=".repeat((4-s.length%4)%4),b=(s+pad).replace(/-/g,"+").replace(/_/g,"/"),raw=atob(b);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
function subJson(sub){const j=sub.toJSON();return{endpoint:j.endpoint,p256dh:j.keys?.p256dh||"",auth:j.keys?.auth||""}}
function uaLabel(){const ua=navigator.userAgent||"";if(/iPhone/i.test(ua))return"iPhone";if(/iPad/i.test(ua))return"iPad";if(/Android/i.test(ua))return"Android";if(/Mac/i.test(ua))return"Mac";if(/Windows/i.test(ua))return"Windows PC";return"Browser device"}
async function registration(){if(!("serviceWorker"in navigator))throw new Error(tr("unsupported"));return navigator.serviceWorker.register("/admin-sw.js?v="+VERSION,{scope:"/",updateViaCache:"none"})}
async function ensurePush(){
 if(!("Notification"in window)||!("PushManager"in window))throw new Error(tr("unsupported"));
 if(Notification.permission==="denied")throw new Error(tr("blocked"));
 const perm=Notification.permission==="granted"?"granted":await Notification.requestPermission();
 if(perm!=="granted")throw new Error(perm==="denied"?tr("blocked"):tr("permission"));
 const reg=await registration();await navigator.serviceWorker.ready;
 let sub=await reg.pushManager.getSubscription();
 if(!sub){
   let key=await req("rpc/zwm_push_public_key",{method:"POST",body:"{}"});
   if(!key){await new Promise(r=>setTimeout(r,700));key=await req("rpc/zwm_push_public_key",{method:"POST",body:"{}")}
   if(!key)throw new Error(tr("unavailable"));
   sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToUint8(key)})
 }
 const sj=subJson(sub);
 await req("push_subscriptions?on_conflict=user_id,endpoint",{method:"POST",headers:{"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({user_id:user.id,endpoint:sj.endpoint,p256dh:sj.p256dh,auth:sj.auth,device_label:uaLabel(),user_agent:(navigator.userAgent||"").slice(0,400),locale:locale(),enabled:true,revoked_at:null,last_used_at:new Date().toISOString()})});
 return sub
}
async function disableCurrent(remove=false){
 const reg=await registration(),sub=await reg.pushManager.getSubscription();if(!sub)return;
 if(remove){await req("push_subscriptions?user_id=eq."+encodeURIComponent(user.id)+"&endpoint=eq."+encodeURIComponent(sub.endpoint),{method:"DELETE",headers:{"Prefer":"return=minimal"}})}
 else await req("push_subscriptions?user_id=eq."+encodeURIComponent(user.id)+"&endpoint=eq."+encodeURIComponent(sub.endpoint),{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({enabled:false,revoked_at:new Date().toISOString()})});
 await sub.unsubscribe().catch(()=>{})
}
function copyFor(n){
 const m=n.metadata||{},l=locale(),status=m.status||"";
 const statusMap={
  en:{new:"Order received",confirmed:"Order confirmed",preparing:"Preparing",out_for_delivery:"Out for delivery",delivered:"Delivered",cancelled:"Cancelled"},
  ar:{new:"تم استلام الطلب",confirmed:"تم تأكيد الطلب",preparing:"قيد التحضير",out_for_delivery:"خرج للتوصيل",delivered:"تم التسليم",cancelled:"ملغي"},
  fr:{new:"Commande reçue",confirmed:"Commande confirmée",preparing:"En préparation",out_for_delivery:"En livraison",delivered:"Livrée",cancelled:"Annulée"}
 };
 if(n.notification_type==="ORDER_CREATED")return[l==="ar"?"طلب جديد":"fr"===l?"Nouvelle commande":"New order",m.reference||n.entity_id].join(" · ");
 if(n.notification_type==="WHOLESALE_INQUIRY_CREATED")return l==="ar"?"استفسار جملة جديد":l==="fr"?"Nouvelle demande de gros":"New wholesale inquiry";
 if(n.notification_type==="PAYMENT_ISSUE")return l==="ar"?"مشكلة دفع":l==="fr"?"Problème de paiement":"Payment issue";
 if(n.notification_type==="REVIEW_CREATED")return l==="ar"?"تقييم جديد":l==="fr"?"Nouvel avis":"New review";
 if(n.notification_type==="ORDER_STATUS_CHANGED")return (statusMap[l]||statusMap.en)[status]||tr("notifications");
 return tr("notifications")
}
function timeAgo(v){const s=Math.max(0,(Date.now()-new Date(v).getTime())/1000);if(s<60)return locale()==="ar"?"الآن":locale()==="fr"?"À l’instant":"Now";if(s<3600)return Math.floor(s/60)+(locale()==="ar"?" د":locale()==="fr"?" min":"m");if(s<86400)return Math.floor(s/3600)+(locale()==="ar"?" س":locale()==="fr"?" h":"h");return new Date(v).toLocaleDateString(locale()==="ar"?"ar-LB":locale()==="fr"?"fr-LB":"en-LB")}
async function markRead(id){await req("notifications?id=eq."+encodeURIComponent(id),{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({read_at:new Date().toISOString()})})}
async function markAll(){await req("notifications?user_id=eq."+encodeURIComponent(user.id)+"&read_at=is.null",{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({read_at:new Date().toISOString()})});await refreshNotifications()}
async function getNotifications(limit=30){return req("notifications?select=*&user_id=eq."+encodeURIComponent(user.id)+"&order=created_at.desc&limit="+limit)}
function allowedRoute(route){try{const u=new URL(route,location.origin);if(u.origin!==location.origin)return"/";return u.pathname+u.search+u.hash}catch{return"/"}}
function go(n){markRead(n.id).catch(()=>{});location.href=allowedRoute(n.route||"/")}
async function preferenceRows(){return req("notification_preferences?select=*&user_id=eq."+encodeURIComponent(user.id)+"&order=category")}
async function setPref(cat,value){await req("notification_preferences?user_id=eq."+encodeURIComponent(user.id)+"&category=eq."+encodeURIComponent(cat),{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({push_enabled:value,updated_at:new Date().toISOString()})})}
function permissionState(){
 if(!("Notification"in window)||!("serviceWorker"in navigator)||!("PushManager"in window))return"unsupported";
 if(Notification.permission==="denied")return"blocked";if(Notification.permission==="granted")return"enabled";return"permission"
}
function isIos(){return /iPhone|iPad|iPod/i.test(navigator.userAgent||"")}
function standalone(){return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}
async function currentSubscription(){try{const reg=await registration();return reg.pushManager.getSubscription()}catch{return null}}
async function devices(){return req("push_subscriptions?select=id,endpoint,device_label,enabled,last_used_at,last_success_at,revoked_at&user_id=eq."+encodeURIComponent(user.id)+"&order=updated_at.desc&limit=20")}
async function testPush(){
 const sub=await currentSubscription();if(!sub)throw new Error(tr("permission"));
 const s=session(),r=await fetch(cfg.supabaseUrl.replace(/\/$/,"")+"/functions/v1/notification-push",{method:"POST",headers:{"apikey":cfg.supabasePublishableKey,"Authorization":"Bearer "+s.access_token,"Content-Type":"application/json"},body:JSON.stringify({action:"test",endpoint:sub.endpoint})});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||tr("unavailable"));return d
}
function adminShell(){
 let bell=$("#zwmNotificationBell");if(!bell){
  bell=document.createElement("button");bell.id="zwmNotificationBell";bell.className="icon-button zwm-notification-bell";bell.type="button";bell.setAttribute("aria-label",tr("notifications"));bell.innerHTML='🔔<span id="zwmNotificationBadge" hidden>0</span>';
  const anchor=$(".topbar-right .owner-pill");anchor?.parentNode?.insertBefore(bell,anchor);
  const pop=document.createElement("section");pop.id="zwmNotificationPopover";pop.className="zwm-notification-popover";pop.hidden=true;pop.innerHTML='<header><strong>'+esc(tr("notifications"))+'</strong><button type="button" data-zwm-mark-all>'+esc(tr("markAll"))+'</button></header><div id="zwmNotificationList"><p>'+esc(tr("loading"))+'</p></div>';document.body.appendChild(pop);
  bell.onclick=()=>{pop.hidden=!pop.hidden;if(!pop.hidden)refreshNotifications()};
  pop.addEventListener("click",e=>{const item=e.target.closest("[data-zwm-notification-id]");if(item){const n=window.__zwmNotifications?.find(x=>x.id===item.dataset.zwmNotificationId);if(n)go(n)}if(e.target.closest("[data-zwm-mark-all]"))markAll()});
 }
 let settings=$("[data-view-panel='settings'] .settings-grid");if(settings&&!$("#zwmAdminNotificationSettings")){
   const card=document.createElement("article");card.className="panel zwm-notification-settings";card.id="zwmAdminNotificationSettings";card.innerHTML='<div class="panel-head"><div><p>'+esc(tr("notifications"))+'</p><h3>'+esc(tr("never"))+'</h3></div><span class="status-badge" id="zwmPushStatus">'+esc(tr("permission"))+'</span></div><p class="panel-copy">'+esc(tr("neverCopy"))+'</p><div class="zwm-notification-actions"><button class="button-primary" type="button" data-zwm-enable>'+esc(tr("enable"))+'</button><button class="button-secondary" type="button" data-zwm-test>'+esc(tr("test"))+'</button></div><p class="field-help" data-zwm-push-help></p><div class="zwm-pref-list" data-zwm-pref-list></div><h4>'+esc(tr("devices"))+'</h4><div data-zwm-device-list></div><p class="field-help">'+esc(tr("deviceNote"))+'</p>';settings.prepend(card);
   card.addEventListener("click",settingsClick);
   renderSettings(card)
 }
}
function customerShell(){
 const content=$(".account-content");if(!content)return;
 let card=$("#zwmCustomerNotificationSettings");if(!card){card=document.createElement("section");card.id="zwmCustomerNotificationSettings";card.className="account-card zwm-account-notifications";content.appendChild(card);card.addEventListener("click",settingsClick)}
 card.innerHTML='<div class="account-section-title"><div><p class="account-eyebrow">'+esc(tr("notifications"))+'</p><h2>'+esc(tr("customerTitle"))+'</h2><p>'+esc(tr("customerCopy"))+'</p></div><span class="account-pill" id="zwmPushStatus">'+esc(tr("permission"))+'</span></div><div class="zwm-notification-actions"><button class="account-primary" type="button" data-zwm-enable>'+esc(tr("enable"))+'</button><button type="button" data-zwm-test>'+esc(tr("test"))+'</button></div><p class="account-status" data-zwm-push-help></p><div class="zwm-pref-list" data-zwm-pref-list></div><p class="account-status">'+esc(tr("deviceNote"))+'</p>';
 renderSettings(card)
}
async function settingsClick(e){
 const root=e.currentTarget,help=$("[data-zwm-push-help]",root);try{
  if(e.target.closest("[data-zwm-enable]")){help.textContent="";await ensurePush();help.textContent=tr("enabled");await renderSettings(root)}
  if(e.target.closest("[data-zwm-disable]")){await disableCurrent(false);await renderSettings(root)}
  if(e.target.closest("[data-zwm-remove]")){await disableCurrent(true);await renderSettings(root)}
  if(e.target.closest("[data-zwm-test]")){await testPush();help.textContent=tr("enabled")}
  const toggle=e.target.closest("[data-zwm-pref]");if(toggle){await setPref(toggle.dataset.zwmPref,toggle.checked)}
 }catch(err){help.textContent=err.message||tr("unavailable")}
}
async function renderSettings(root){
 const state=permissionState(),badge=$("#zwmPushStatus",root),help=$("[data-zwm-push-help]",root),enable=$("[data-zwm-enable]",root);
 if(badge)badge.textContent=state==="enabled"?tr("enabled"):state==="blocked"?tr("blocked"):state==="unsupported"?tr("unsupported"):tr("permission");
 if(enable)enable.hidden=state==="enabled"||state==="unsupported"||state==="blocked";
 if(help)help.textContent=isIos()&&!standalone()&&state!=="enabled"?tr("phoneHelp"):state==="unsupported"?tr("unsupported"):"";
 try{
  const prefs=await preferenceRows(),map=mode==="admin"?[
   ["new_orders","orders"],["wholesale_inquiries","wholesale"],["payment_issues","payments"],["customer_requests","requests"],["low_stock","low"],["out_of_stock","out"],["reviews","reviews"],["routine_activity","routine"]
  ]:[["order_updates","orderUpdates"],["back_in_stock","backStock"],["mouneh_points","points"],["marketing","marketing"]];
  const by=new Map(prefs.map(x=>[x.category,x]));
  const list=$("[data-zwm-pref-list]",root);if(list)list.innerHTML=map.map(([cat,key])=>'<label><span>'+esc(tr(key))+'</span><input type="checkbox" data-zwm-pref="'+cat+'" '+(by.get(cat)?.push_enabled?"checked":"")+'></label>').join("");
  if(mode==="admin"){const d=$("[data-zwm-device-list]",root);if(d){const rows=await devices();d.innerHTML=rows.length?rows.map(x=>'<div class="zwm-device-row"><span><strong>'+esc(x.device_label||"Device")+'</strong><small>'+(x.enabled&&!x.revoked_at?esc(tr("enabled")):esc(tr("permission")))+'</small></span></div>').join(""):'<p class="field-help">'+esc(tr("empty"))+'</p>';const sub=await currentSubscription();if(sub)d.insertAdjacentHTML("beforeend",'<div class="zwm-notification-actions"><button class="button-secondary" type="button" data-zwm-disable>'+esc(tr("disable"))+'</button><button class="button-secondary" type="button" data-zwm-remove>'+esc(tr("remove"))+'</button></div>')}}
 }catch(err){if(help&&!help.textContent)help.textContent=err.message||tr("unavailable")}
}
async function refreshNotifications(){
 if(!user)return;const list=$("#zwmNotificationList");try{const rows=await getNotifications(40);window.__zwmNotifications=rows;const unread=rows.filter(x=>!x.read_at).length,b=$("#zwmNotificationBadge");if(b){b.textContent=String(unread);b.hidden=!unread}if(list)list.innerHTML=rows.length?rows.slice(0,25).map(n=>'<button type="button" class="zwm-notification-item '+(!n.read_at?"is-unread":"")+'" data-zwm-notification-id="'+n.id+'"><span>'+esc(copyFor(n))+'</span><small>'+esc(timeAgo(n.created_at))+'</small></button>').join(""):'<p class="zwm-notification-empty">'+esc(tr("empty"))+'</p>'}catch(err){if(list)list.innerHTML='<p class="zwm-notification-empty">'+esc(tr("unavailable"))+' <button type="button" onclick="location.reload()">'+esc(tr("retry"))+'</button></p>'}
}
function realtime(){
 if(!window.supabase||!cfg||!user)return;
 client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{accessToken:async()=>session()?.access_token||"",auth:{persistSession:false,autoRefreshToken:false}});
 channel=client.channel("zwm-notifications-"+user.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:"user_id=eq."+user.id},payload=>{refreshNotifications();if(mode==="admin"&&!document.hidden)inPageAlert(payload.new)}).subscribe()
}
function leader(){
 try{bc=new BroadcastChannel("zwm-notification-tabs");const id=Math.random().toString(36).slice(2),seen=new Map();bc.onmessage=e=>{if(e.data?.kind==="hello")seen.set(e.data.id,Date.now());if(e.data?.kind==="claim"&&e.data.id<id)soundLeader=false};bc.postMessage({kind:"hello",id});setTimeout(()=>{soundLeader=true;bc.postMessage({kind:"claim",id})},80);setInterval(()=>bc.postMessage({kind:"hello",id}),5000)}catch{soundLeader=true}
}
function inPageAlert(n){
 if(!soundLeader)return;let box=$("#zwmLiveToast");if(!box){box=document.createElement("button");box.id="zwmLiveToast";box.type="button";box.className="zwm-live-toast";document.body.appendChild(box)}box.textContent=copyFor(n);box.hidden=false;box.onclick=()=>go(n);setTimeout(()=>{box.hidden=true},5500)
}
function handleDeepLink(){
 if(mode!=="admin")return;const u=new URL(location.href),type=u.searchParams.get("notification"),ref=u.searchParams.get("ref"),id=u.searchParams.get("id");
 if(type==="order"&&ref){const tryOpen=()=>{document.querySelector('[data-view="orders"]')?.click();const btn=[...document.querySelectorAll("[data-view-order]")].find(b=>b.dataset.viewOrder===ref);if(btn){btn.click();return true}return false};if(!tryOpen()){let n=0;const t=setInterval(()=>{if(tryOpen()||++n>30)clearInterval(t)},250)}}
 if(type==="wholesale"&&id){document.querySelector('[data-view="wholesale"]')?.click();const tryLead=()=>{const el=document.querySelector('[data-wholesale-id="'+CSS.escape(id)+'"]');if(el){el.click();return true}return false};if(!tryLead()){let n=0;const t=setInterval(()=>{if(tryLead()||++n>30)clearInterval(t)},250)}}
}
async function boot(){
 mode=document.body.classList.contains("admin-body")?"admin":document.body.dataset.page==="account"?"customer":"";if(!mode)return;
 await ensureCfg();if(!cfg)return;user=await currentUser();if(!user)return;
 if(mode==="admin"){const admins=await req("admin_users?select=user_id&user_id=eq."+encodeURIComponent(user.id)+"&limit=1").catch(()=>[]);if(!admins?.length)return;adminShell();leader()}else customerShell();
 await refreshNotifications();realtime();handleDeepLink();
 const obs=new MutationObserver(()=>{if(mode==="admin")adminShell();else customerShell()});obs.observe(document.body,{subtree:true,childList:true});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshNotifications()})
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();