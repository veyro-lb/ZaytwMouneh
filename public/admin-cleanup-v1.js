/* Owner Data Management: safe, deliberate deletion controls. */
(() => {
 "use strict";
 const cfg = window.ZWM_CMS_CONFIG || {};
 const $ = id => document.getElementById(id);
 const KEY = "zwm:owner-session:v3";
 const tr = (en, ar, fr=en) => {
   let lang="en";
   try {lang=localStorage.getItem("zwm:admin-lang:v1")==="ar"?"ar":document.documentElement.lang==="fr"?"fr":"en";} catch {}
   return lang==="ar"?ar:lang==="fr"?fr:en;
 };
 const state={accounts:[],returns:[],loading:false,busy:false};
 function session(){try{return JSON.parse(sessionStorage.getItem(KEY)||"null")}catch{return null}}
 function notify(message,error=false){
   const root=$("toastStack");
   if(!root)return window.alert(message);
   const item=document.createElement("div");
   item.className="admin-toast"+(error?" is-error":"");
   item.textContent=message;root.append(item);setTimeout(()=>item.remove(),4600);
 }
 async function api(path,body,edge=false){
   const s=session();if(!s?.access_token)throw Error(tr("Sign in again first.","سجّل الدخول مجدداً."));
   const base=String(cfg.supabaseUrl||"").replace(/\/$/,"");
   if(!base)throw Error("Connection unavailable");
   const r=await fetch(base+(edge?"/functions/v1/":"/rest/v1/rpc/")+path,{
     method:"POST",headers:{apikey:cfg.supabasePublishableKey,
       Authorization:"Bearer "+s.access_token,"Content-Type":"application/json"},
     body:JSON.stringify(body||{})
   });
   const d=await r.json().catch(()=>({}));
   if(!r.ok||edge&&d.ok===false)throw Error(d.error||d.message||d.details||tr("Operation failed.","تعذّر تنفيذ العملية."));
   return d;
 }
 const mk=(tag,cls,copy)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(copy!=null)el.textContent=copy;return el;};
 function button(label,cb,danger=false){
   const b=mk("button",danger?"zwm-cleanup-danger":"zwm-cleanup-link",label);
   b.type="button";b.addEventListener("click",cb);return b;
 }
 function showPanel(){
   const grid=document.querySelector('[data-view-panel="settings"] .settings-grid');
   if(grid&&!$("zwmCleanupPanel")){
     const panel=mk("article","panel zwm-cleanup-panel");panel.id="zwmCleanupPanel";panel.dataset.noI18n="1";
     const title=mk("div","zwm-cleanup-title");
     title.append(mk("h3","",tr("Data management","إدارة البيانات","Gestion des données")),
       mk("p","",tr("Owner-only controls. Delete individual records after confirming; paid/refunded records and return evidence receive additional protection.",
        "أدوات مخصّصة للمالك. احذف السجلات فردياً بعد التأكيد. تخضع السجلات المالية وأدلة المرتجعات لحماية إضافية.",
        "Outils réservés au propriétaire. Confirmation obligatoire ; les données financières et les preuves sont protégées.")));
     panel.append(title);
     const links=mk("div","zwm-cleanup-actions");
     links.append(
       button(tr("Orders & history","الطلبات والسجل","Commandes et historique"),()=>document.querySelector('[data-view="orders"]')?.click()),
       button(tr("Wholesale requests","طلبات الجملة","Demandes de gros"),()=>document.querySelector('[data-view="wholesale"]')?.click()),
       button(tr("Refresh accounts & returns","تحديث الحسابات والمرتجعات","Actualiser les comptes et retours"),load)
     );
     panel.append(links);
     const a=mk("div","zwm-cleanup-block");
     a.append(mk("h4","",tr("Customer accounts","حسابات العملاء","Comptes clients")));
     const ac=mk("div","zwm-cleanup-list");ac.id="zwmCleanupAccounts";a.append(ac);
     const r=mk("div","zwm-cleanup-block");
     r.append(mk("h4","",tr("Return requests","طلبات الإرجاع","Demandes de retour")));
     const rc=mk("div","zwm-cleanup-list");rc.id="zwmCleanupReturns";r.append(rc);
     const h=mk("div","zwm-cleanup-block");
     h.append(mk("h4","",tr("History controls","التحكّم بالسجل","Gestion de l'historique")));
     const hp=mk("p","zwm-cleanup-help",tr("Clear live dashboard activity or website analytics separately. A private recovery snapshot is retained.",
       "امسح نشاط لوحة الإدارة أو إحصاءات الموقع كلٌ على حدة. تبقى نسخة استرداد خاصة محفوظة.",
       "Effacez l’activité ou les statistiques séparément. Une sauvegarde privée est conservée."));
     const hb=mk("div","zwm-cleanup-actions");
     hb.append(
       button(tr("Clear activity history","مسح سجل النشاط","Effacer l’activité"),()=>remove("activity","all","CLEAR ACTIVITY"),true),
       button(tr("Clear website analytics","مسح إحصاءات الموقع","Effacer les statistiques"),()=>remove("analytics","all","CLEAR ANALYTICS"),true)
     );h.append(hp,hb);
     panel.append(a,r,h);grid.append(panel);
   }
   const section=document.querySelector('[data-view-panel="orders"] #orderModal .order-detail-content');
   if(section&&!$("zwmDeleteOrder")){
     const article=mk("article","order-detail-section zwm-cleanup-order");
     article.dataset.noI18n="1";
     article.append(mk("h3","",tr("Delete this order","حذف هذا الطلب","Supprimer cette commande")));
     article.append(mk("p","zwm-cleanup-help",tr("For test or duplicate orders only. Linked return requests and order-related rewards entries will also be removed; financial and evidence records are protected.",
       "للطلبات التجريبية أو المكررة فقط. تُزال أيضاً المرتجعات والنقاط المرتبطة بالطلب، مع حماية السجلات المالية والأدلة.",
       "Réservé aux commandes test ou doublons. Les retours et points liés sont aussi supprimés.")));
     const b=button(tr("Delete order permanently","حذف الطلب نهائياً","Supprimer définitivement"),()=>{
       const ref=$("orderDetailCode")?.textContent?.trim();
       if(ref&&ref!=="—")remove("order",ref,"DELETE "+ref);
     },true);b.id="zwmDeleteOrder";article.append(b);section.append(article);
   }
   const activity=document.querySelector('[data-view-panel="activity"] .section-intro');
   if(activity&&!$("zwmActivityClear")){
     const b=button(tr("Clear activity","مسح النشاط","Effacer l’activité"),()=>remove("activity","all","CLEAR ACTIVITY"),true);
     b.id="zwmActivityClear";activity.append(b);
   }
   const analytics=document.querySelector('[data-view-panel="analytics"] .analytics-head');
   if(analytics&&!$("zwmAnalyticsClear")){
     const b=button(tr("Clear tracking data","مسح بيانات التتبع","Effacer les statistiques"),()=>remove("analytics","all","CLEAR ANALYTICS"),true);
     b.id="zwmAnalyticsClear";analytics.append(b);
   }
 }
 function render(){
   const a=$("zwmCleanupAccounts"),r=$("zwmCleanupReturns");if(!a||!r)return;
   a.replaceChildren();r.replaceChildren();
   if(!state.accounts.length)a.append(mk("p","zwm-cleanup-empty",tr("No customer accounts found.","لا توجد حسابات عملاء.")));
   for(const x of state.accounts){
     const row=mk("div","zwm-cleanup-record");
     const meta=mk("div","zwm-cleanup-meta");
     meta.append(mk("strong","",x.email||x.id),mk("small","",x.confirmed?tr("Verified","موثّق"):tr("Not verified","غير موثّق")));
     row.append(meta,button(tr("Delete account","حذف الحساب"),()=>remove("account",x.id,"DELETE "+(x.email||x.id),x.email||x.id),true));
     a.append(row);
   }
   if(!state.returns.length)r.append(mk("p","zwm-cleanup-empty",tr("No return requests found.","لا توجد طلبات إرجاع.")));
   for(const x of state.returns){
     const row=mk("div","zwm-cleanup-record"),meta=mk("div","zwm-cleanup-meta");
     meta.append(mk("strong","",x.reference||x.id),mk("small","",String(x.status||"")+" · "+String(x.order||"")));
     row.append(meta,button(tr("Delete request","حذف الطلب"),()=>remove("return",x.id,"DELETE "+x.id,x.reference),true));
     r.append(row);
   }
 }
 async function load(){
   if(state.loading||!session()?.access_token)return;
   state.loading=true;
   try{
     const d=await api("zwm_admin_cleanup_inventory",{});
     state.accounts=Array.isArray(d.accounts)?d.accounts:[];
     state.returns=Array.isArray(d.returns)?d.returns:[];
     showPanel();render();
   }catch(err){notify(err.message||tr("Could not load deletion controls.","تعذّر تحميل أدوات الحذف."),true)}
   finally{state.loading=false;}
 }
 async function remove(kind,id,phrase,display){
   if(state.busy)return;
   const warning=kind==="account"
     ?tr("This removes the customer's sign-in, points, vouchers and saved addresses; past orders are preserved.","سيُحذف حساب العميل ونقاطه وقسائمه وعناوينه، مع إبقاء الطلبات السابقة.")
     :kind==="order"
     ?tr("This permanently removes the order, linked return requests and order-linked reward history.","سيُحذف الطلب والمرتجعات وسجل النقاط المرتبط به نهائياً.")
     :kind==="return"
     ?tr("This permanently removes the return request and its timeline.","سيُحذف طلب الإرجاع وسجله نهائياً.")
     :tr("This clears the live dashboard history; a private recovery copy is retained.","سيُمسح السجل المباشر مع الاحتفاظ بنسخة استرداد خاصة.");
   if(!window.confirm(warning+"\n"+(display||id)))return;
   const typed=window.prompt(tr('To confirm, type exactly:','للتأكيد، اكتب بالضبط:')+"\n"+phrase);
   if(typed===null)return;
   if(typed.trim()!==phrase){notify(tr("Confirmation did not match. Nothing was deleted.","نص التأكيد غير مطابق. لم يُحذف شيء."),true);return;}
   state.busy=true;
   try {
     const response=kind==="account"
       ?await api("admin-remove-customer",{user_id:id},true)
       :await api("zwm_admin_remove_record",{p_kind:kind,p_id:id,p_confirmation:phrase});
     if(response===false)throw Error(tr("Record was already removed. Refresh the page.","السجل محذوف بالفعل. حدّث الصفحة."));
     notify(tr("Deletion completed.","اكتمل الحذف."));
     if(kind==="order"){$("closeOrderModal")?.click();$("zwmDeleteOrder")?.blur();}
     if(kind==="activity"||kind==="analytics"||kind==="order")$("refreshButton")?.click();
     await load();
   } catch(err){notify(err.message||tr("Deletion failed.","فشل الحذف."),true);}
   finally{state.busy=false;}
 }
 const styles=`
 .zwm-cleanup-panel{grid-column:1/-1}
 .zwm-cleanup-title h3{margin:0 0 5px;font-size:23px;font-family:"DM Serif Display",serif}
 .zwm-cleanup-title p,.zwm-cleanup-help{font-size:12px;line-height:1.6;color:var(--muted)}
 .zwm-cleanup-actions{display:flex;flex-wrap:wrap;gap:9px;margin:14px 0}
 .zwm-cleanup-link,.zwm-cleanup-danger{border:1px solid #c6d3c5;padding:9px 13px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;background:#fff;color:#19442c;max-width:100%;text-align:center}
 .zwm-cleanup-danger{border-color:#d9b6b2;background:#fff6f5;color:#8a302d}
 .zwm-cleanup-link:hover,.zwm-cleanup-danger:hover{filter:brightness(.96)}
 .zwm-cleanup-block{border-top:1px solid #e6e8e2;padding-top:18px;margin-top:18px}
 .zwm-cleanup-block h4{margin:0 0 10px;font-size:16px}
 .zwm-cleanup-list{display:grid;gap:8px}
 .zwm-cleanup-record{display:flex;gap:12px;align-items:center;justify-content:space-between;border:1px solid #e8eae6;border-radius:11px;padding:10px 12px;min-width:0}
 .zwm-cleanup-meta{display:grid;gap:4px;min-width:0}
 .zwm-cleanup-meta strong{font-size:13px;overflow-wrap:anywhere}
 .zwm-cleanup-meta small,.zwm-cleanup-empty{font-size:11px;color:var(--muted)}
 .zwm-cleanup-order{border:1px solid #e5cbc5}
 .zwm-cleanup-order h3{margin-top:0}
 [dir="rtl"] .zwm-cleanup-record{text-align:right}
 @media(max-width:600px){.zwm-cleanup-actions{flex-direction:column}.zwm-cleanup-record{align-items:flex-start;flex-direction:column}.zwm-cleanup-record button{width:100%}}
 `;
 function init(){
   if(!$("zwmCleanupStyle")){const s=mk("style");s.id="zwmCleanupStyle";s.textContent=styles;document.head.append(s)}
   showPanel();
   if($("adminApp")&&!$("adminApp").hidden)load();
   window.addEventListener("zwm:owner-ready",load);
   document.addEventListener("zwm:admin-language",()=>{showPanel();render()});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
