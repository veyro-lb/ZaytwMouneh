(function(){
"use strict";
const SESSION_KEY="zwm:mouneh:session:v1",CLAIMS_KEY="zwm:mouneh:claims:v1";
const S={context:null,requests:[],active:null,files:[],busy:false,clientRequestId:null,accessToken:null,lastHistoryLoad:0};
const REQUEST_TIMEOUT_MS=15000,HISTORY_STALE_MS=120000;
const $=(s,r)=> (r||document).querySelector(s), $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
const ar=()=>document.documentElement.lang==="ar"||document.documentElement.dir==="rtl";
const fr=()=>document.documentElement.lang==="fr";
const tr=(en,aa,ff)=>ar()?aa:(fr()?(ff||en):en);
const locale=()=>fr()?"fr":ar()?"ar":"en";
const route=path=>{try{return window.ZWM_LOCALE?.localePath?window.ZWM_LOCALE.localePath(path,locale()):path}catch{return path}};
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const read=(k,f)=>{try{const v=localStorage.getItem(k);return v==null?f:JSON.parse(v)}catch{return f}};
const session=()=>read(SESSION_KEY,null);
const claimFor=ref=>{const rows=read(CLAIMS_KEY,[]);const x=Array.isArray(rows)?rows.find(r=>r&&r.reference===ref):null;return x&&x.claim_token||""};
const money=v=>"$"+(Number(v)||0).toFixed(2);
const date=v=>{try{return new Date(v).toLocaleDateString(ar()?"ar-LB":fr()?"fr-LB":"en-LB",{year:"numeric",month:"short",day:"numeric"})}catch{return ""}};
const statusLabel=s=>({submitted:tr("Submitted","تم الإرسال","Envoyée"),under_review:tr("Under review","قيد المراجعة","En cours d’examen"),awaiting_customer:tr("More information needed","معلومات إضافية مطلوبة","Informations requises"),return_authorized:tr("Return authorized","تمت الموافقة على الإرجاع","Retour autorisé"),received:tr("Received","تم الاستلام","Reçu"),approved:tr("Approved","تمت الموافقة","Approuvée"),rejected:tr("Rejected","مرفوض","Refusée"),resolution_in_progress:tr("Resolution in progress","الحل قيد التنفيذ","Solution en cours"),completed:tr("Completed","مكتمل","Terminée"),cancelled:tr("Cancelled","ملغي","Annulée")}[s]||s||"");
const refundStatusLabel=s=>({not_required:tr("Not required","غير مطلوب","Non requis"),pending:tr("Pending","قيد الانتظار","En attente"),processing:tr("Processing","قيد المعالجة","En cours"),completed:tr("Completed","مكتمل","Terminé"),failed:tr("Needs attention","يحتاج إلى متابعة","À vérifier"),cancelled:tr("Cancelled","ملغي","Annulé")}[s]||String(s||"").replace(/_/g," "));
const reasonLabel=s=>({damaged:tr("Item arrived damaged","وصل المنتج متضرراً","Article endommagé"),leaking_broken:tr("Item is leaking / broken","المنتج يسرّب أو مكسور","Article cassé / fuite"),wrong_product:tr("Wrong product received","تم استلام منتج خاطئ","Mauvais produit reçu"),missing_item:tr("Product is missing","منتج ناقص","Produit manquant"),quality_safety:tr("Product quality / safety issue","مشكلة جودة أو سلامة","Problème de qualité / sécurité"),unopened_return:tr("Return / exchange an unopened item","إرجاع / استبدال منتج غير مفتوح","Retour / échange d’un article non ouvert"),other:tr("Other genuine product problem","مشكلة فعلية أخرى في المنتج","Autre problème réel avec un produit")}[s]||s||"");
async function timedFetch(url,options){const controller=typeof AbortController==="function"?new AbortController():null,timer=controller?setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS):null;try{return await fetch(url,{...(options||{}),signal:controller?controller.signal:undefined})}catch(err){throw new Error(err?.name==="AbortError"?tr("The request took too long. Please retry.","استغرق الطلب وقتاً طويلاً. حاول مجدداً.","La demande a pris trop de temps. Réessayez."):tr("Could not reach the service. Check your connection and retry.","تعذّر الاتصال بالخدمة. تحقق من اتصالك وحاول مجدداً.","Impossible de joindre le service. Vérifiez votre connexion et réessayez."))}finally{if(timer)clearTimeout(timer)}}

async function config(){
 if(window.ZWM_CMS_CONFIG?.supabaseUrl)return window.ZWM_CMS_CONFIG;
 await new Promise(resolve=>{const s=document.createElement("script");s.src="/admin-config.js?v=20261007-returns1";s.onload=resolve;s.onerror=resolve;document.head.appendChild(s)});
 return window.ZWM_CMS_CONFIG||{};
}
async function rpc(action,p,needsAuth=false,retry=true){
 const c=await config(),sess=session();
 if(needsAuth&&(!sess||!sess.access_token))throw new Error(tr("Please sign in first.","يرجى تسجيل الدخول أولاً.","Veuillez vous connecter."));
 const h={apikey:c.supabasePublishableKey,"Content-Type":"application/json"}; if(sess?.access_token)h.Authorization="Bearer "+sess.access_token;
 const r=await timedFetch(c.supabaseUrl.replace(/\/$/,"")+"/rest/v1/rpc/zwm_returns",{method:"POST",headers:h,body:JSON.stringify({action,p:p||{}})});
 const d=await r.json().catch(()=>({}));
 if(r.status===401&&retry&&sess?.access_token){
  const refreshed=await window.ZWM_REWARDS?.auth?.refreshSession?.();
  if(refreshed?.access_token)return rpc(action,p,needsAuth,false);
  throw new Error(tr("Your session expired. Please sign in again.","انتهت صلاحية جلستك. يرجى تسجيل الدخول مجدداً.","Votre session a expiré. Veuillez vous reconnecter."));
 }
 if(!r.ok)throw new Error(d.message||d.hint||tr("Could not complete this request.","تعذّر إكمال الطلب.","Impossible de terminer la demande.")); return d;
}
async function verifyOrder(reference,contact){
 const c=await config(),sess=session();
 const h={apikey:c.supabasePublishableKey,"Content-Type":"application/json"};
 if(sess?.access_token)h.Authorization="Bearer "+sess.access_token;
 const r=await timedFetch(c.supabaseUrl.replace(/\/$/,"")+"/functions/v1/return-order-verify",{method:"POST",headers:h,body:JSON.stringify({reference,contact})});
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(d.error||tr("We could not verify those order details.","تعذّر التحقق من بيانات الطلب.","Nous n’avons pas pu vérifier ces informations."));
 return d;
}
async function uploadEvidence(requestId,file){
 const c=await config(),sess=session(); if(!sess?.access_token)throw new Error(tr("Sign in to attach photos securely.","سجّل الدخول لإرفاق الصور بأمان.","Connectez-vous pour joindre des photos en toute sécurité."));
 const fd=new FormData();fd.append("request_id",requestId);fd.append("file",file,file.name);
 const r=await timedFetch(c.supabaseUrl.replace(/\/$/,"")+"/functions/v1/return-evidence-upload",{method:"POST",headers:{apikey:c.supabasePublishableKey,Authorization:"Bearer "+sess.access_token},body:fd});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||tr("Photo upload failed.","فشل رفع الصورة.","Échec de l’envoi de la photo."));return d;
}
function ensureCss(){if(!$('link[data-returns-css]')){const l=document.createElement("link");l.rel="stylesheet";l.href="/returns-v1.css?v=20261007-returnslocales1";l.dataset.returnsCss="1";document.head.appendChild(l)}}
function ensureModal(){
 if($("#zwmReturnModal"))return;
 const d=document.createElement("div");d.id="zwmReturnModal";d.className="zwm-return-backdrop";d.hidden=true;
 d.innerHTML='<section class="zwm-return-modal" role="dialog" aria-modal="true" aria-labelledby="zwmReturnTitle"><header><div><small>'+esc(tr("Order support","مساعدة الطلب","Assistance commande"))+'</small><h2 id="zwmReturnTitle">'+esc(tr("Get help with this order","الحصول على مساعدة بخصوص هذا الطلب","Obtenir de l’aide pour cette commande"))+'</h2></div><button type="button" data-return-close aria-label="'+esc(tr("Close","إغلاق","Fermer"))+'">×</button></header><div class="zwm-return-body" id="zwmReturnBody"></div></section>';
 document.body.appendChild(d);d.addEventListener("click",e=>{if(e.target===d||e.target.closest("[data-return-close]"))closeModal()});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!d.hidden)closeModal()});
}
function openModal(){ensureModal();$("#zwmReturnModal").hidden=false;document.body.classList.add("zwm-return-open")}
function closeModal(){const d=$("#zwmReturnModal");if(d)d.hidden=true;document.body.classList.remove("zwm-return-open")}
function itemLabel(i){return esc(i.product_name)+(i.variant_name?' <small>'+esc(i.variant_name)+'</small>':'')}
function withinPolicyWindow(ctx){
  const timestamp=Date.parse(ctx?.delivered_at||"");
  return ctx?.status==="delivered" && Number.isFinite(timestamp) && timestamp<=Date.now() && Date.now()-timestamp<=24*60*60*1000;
}
function policyContactHtml(){
  return '<div class="zwm-return-warning"><strong>'+esc(tr("Need help with a product problem?","تحتاج مساعدة بخصوص مشكلة في منتج؟","Besoin d’aide pour un problème produit ?"))+'</strong><p>'+esc(tr("The online reporting window is 24 hours after delivery. If this time has passed or the delivery date looks incorrect, please contact us. Your legal consumer rights are unaffected.","مهلة الإبلاغ عبر الموقع هي 24 ساعة من التسليم. إذا انقضت المدة أو كان موعد التسليم غير صحيح، يرجى التواصل معنا. حقوق المستهلك القانونية محفوظة.","Le délai de signalement en ligne est de 24 heures après livraison. S’il est dépassé ou si la date de livraison est incorrecte, contactez-nous. Vos droits légaux restent protégés."))+'</p><p><a href="'+route("/contact")+'">'+esc(tr("Contact us","تواصل معنا","Nous contacter"))+'</a> · <a href="https://wa.me/96170381412" target="_blank" rel="noopener">WhatsApp +961 70 381 412</a></p></div>';
}
function renderWizard(ctx){
 openModal();S.context=ctx;S.files=[];S.clientRequestId=crypto.randomUUID();
 const b=$("#zwmReturnBody");
 if(!withinPolicyWindow(ctx)){b.innerHTML=policyContactHtml();return;}
 b.innerHTML='<p class="zwm-return-intro">'+esc(tr("Only genuine product or order problems are eligible. Tell us what is wrong within 24 hours of delivery.","يُقبل الإرجاع فقط عند وجود مشكلة فعلية في المنتج أو الطلب. أبلغ عن المشكلة خلال 24 ساعة من التسليم.","Seuls les vrais problèmes de produit ou de commande sont éligibles. Signalez le problème dans les 24 heures après livraison."))+'</p>'+
 '<form id="zwmReturnForm" class="zwm-return-form">'+
 '<fieldset><legend>1. '+esc(tr("Select affected product(s)","اختر المنتج أو المنتجات المتأثرة","Sélectionnez le ou les produits concernés"))+'</legend><div class="zwm-return-items">'+(ctx.items||[]).map(i=>'<label class="zwm-return-item"><input type="checkbox" data-return-item value="'+i.line_index+'"><span><strong>'+itemLabel(i)+'</strong><small>'+esc(tr("Purchased","تم الشراء","Acheté"))+': '+i.purchased_quantity+' · '+money(i.allocated_net_amount)+'</small></span><input type="number" data-return-qty="'+i.line_index+'" min="1" max="'+i.purchased_quantity+'" value="1" aria-label="'+esc(tr("Affected quantity","الكمية المتأثرة","Quantité concernée"))+'"></label>').join("")+'</div></fieldset>'+
 '<fieldset><legend>2. '+esc(tr("What happened?","ماذا حدث؟","Que s’est-il passé ?"))+'</legend><label class="zwm-field"><span>'+esc(tr("Issue","المشكلة","Problème"))+'</span><select id="zwmReturnReason" required><option value="">'+esc(tr("Select an issue","اختر المشكلة","Sélectionnez un problème"))+'</option><option value="damaged">'+esc(reasonLabel("damaged"))+'</option><option value="leaking_broken">'+esc(reasonLabel("leaking_broken"))+'</option><option value="wrong_product">'+esc(reasonLabel("wrong_product"))+'</option><option value="missing_item">'+esc(reasonLabel("missing_item"))+'</option><option value="quality_safety">'+esc(reasonLabel("quality_safety"))+'</option><option value="other">'+esc(reasonLabel("other"))+'</option></select></label><div id="zwmReasonNote" class="zwm-reason-note"></div></fieldset>'+
 '<fieldset><legend>3. '+esc(tr("Details","التفاصيل","Détails"))+'</legend><label class="zwm-field"><span>'+esc(tr("Tell us what seems wrong","اشرح لنا ما المشكلة","Expliquez le problème"))+'</span><textarea id="zwmReturnDescription" rows="5" maxlength="3000" required></textarea></label><label class="zwm-field" id="zwmDiscoveryWrap" hidden><span>'+esc(tr("When did you notice the issue?","متى لاحظت المشكلة؟","Quand avez-vous remarqué le problème ?"))+'</span><input type="date" id="zwmDiscoveredAt"></label><label class="zwm-field"><span>'+esc(tr("Preferred resolution","الحل المفضل","Solution souhaitée"))+'</span><select id="zwmPreferred"><option value="">'+esc(tr("Let the team recommend the best option","دع الفريق يقترح الحل المناسب","Laisser l’équipe proposer la meilleure solution"))+'</option><option value="replacement">'+esc(tr("Replacement","استبدال بنفس المنتج","Remplacement"))+'</option><option value="exchange">'+esc(tr("Exchange","تبديل","Échange"))+'</option><option value="partial_refund">'+esc(tr("Partial refund","استرداد جزئي","Remboursement partiel"))+'</option><option value="full_affected_item_refund">'+esc(tr("Refund of affected item(s)","استرداد قيمة المنتج المتأثر","Remboursement des articles concernés"))+'</option></select></label></fieldset>'+
 '<fieldset><legend>4. '+esc(tr("Evidence (when appropriate)","الصور الداعمة عند الحاجة","Photos justificatives si nécessaire"))+'</legend><p>'+esc(tr("Please keep the affected product and original packaging until review, unless keeping it would be unsafe or impractical.","يرجى الاحتفاظ بالمنتج المتأثر وعبوته الأصلية حتى تتم المراجعة، إلا إذا كان الاحتفاظ به غير آمن أو غير عملي.","Conservez le produit concerné et son emballage jusqu’à l’examen, sauf si cela est dangereux ou impraticable."))+'</p><label class="zwm-upload"><span>'+esc(tr("Add up to 4 photos","أضف حتى 4 صور","Ajouter jusqu’à 4 photos"))+'</span><input id="zwmEvidenceFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple '+(session()?.access_token?'':'disabled')+'></label><small id="zwmEvidenceHelp">'+esc(session()?.access_token?tr("JPEG, PNG or WebP · max 5 MB each.","JPEG أو PNG أو WebP · حد أقصى 5 ميغابايت للصورة.","JPEG, PNG ou WebP · 5 Mo max par image."):tr("You can submit now. Sign in from My Account to attach photos securely.","يمكنك إرسال الطلب الآن. سجّل الدخول من حسابي لإرفاق الصور بأمان.","Vous pouvez envoyer la demande maintenant. Connectez-vous pour joindre des photos en toute sécurité."))+'</small></fieldset>'+
 '<div class="zwm-return-review"><strong>5. '+esc(tr("Review & submit","المراجعة والإرسال","Vérifier et envoyer"))+'</strong><p>'+esc(tr("Submitting a request starts a review; it does not confirm a refund or exchange. We’ll review the information and update you with the available resolution.","إرسال الطلب يبدأ المراجعة ولا يعني تأكيد استرداد أو استبدال. سنراجع المعلومات ونطلعك على الحل المتاح.","L’envoi d’une demande déclenche un examen ; il ne confirme pas un remboursement ou un échange. Nous examinerons les informations et vous indiquerons la solution disponible."))+'</p><a href="'+route("/returns-policy")+'" target="_blank" rel="noopener">'+esc(tr("Returns & Product Issues Policy","سياسة الإرجاع ومشاكل المنتجات","Politique de retours et problèmes produits"))+'</a></div><p class="zwm-return-error" id="zwmReturnError" role="alert"></p><button class="zwm-return-submit" type="submit">'+esc(tr("Submit request","إرسال الطلب","Envoyer la demande"))+'</button></form>';
 const form=$("#zwmReturnForm");$("#zwmReturnReason").addEventListener("change",updateReasonUi);$("#zwmEvidenceFiles").addEventListener("change",e=>{S.files=Array.from(e.target.files||[]).slice(0,4);$("#zwmEvidenceHelp").textContent=S.files.length?S.files.length+" "+tr("photo(s) selected","صور محددة","photo(s) sélectionnée(s)"):""});form.addEventListener("submit",submitRequest);
}
function updateReasonUi(){const v=$("#zwmReturnReason").value;$("#zwmDiscoveryWrap").hidden=v!=="quality_safety";const note=$("#zwmReasonNote");note.textContent=v?tr("Please report within 24 hours of delivery. For anything later, contact us directly.","يرجى الإبلاغ خلال 24 ساعة من التسليم. بعد ذلك تواصل معنا مباشرةً.","Signalez le problème dans les 24 heures suivant la livraison. Passé ce délai, contactez-nous directement."):"";}

async function submitRequest(e){
 e.preventDefault();if(S.busy)return;const err=$("#zwmReturnError");err.textContent="";
 const selected=$$("[data-return-item]:checked");if(!selected.length){err.textContent=tr("Select at least one affected product.","اختر منتجاً متأثراً واحداً على الأقل.","Sélectionnez au moins un produit concerné.");return}
 const reason=$("#zwmReturnReason").value;if(!reason){err.textContent=tr("Select the issue.","اختر نوع المشكلة.","Sélectionnez le problème.");return}
 if(!withinPolicyWindow(S.context)){err.textContent=tr("The 24-hour reporting window has passed. Please contact us.","انتهت مهلة الإبلاغ البالغة 24 ساعة. يرجى التواصل معنا.","Le délai de 24 heures est dépassé. Veuillez nous contacter.");return}
 const items=selected.map(x=>({line_index:Number(x.value),quantity:Number($('[data-return-qty="'+x.value+'"]')?.value||1)}));
 S.busy=true;const btn=$(".zwm-return-submit");btn.disabled=true;btn.textContent=tr("Submitting…","جارٍ الإرسال…","Envoi…");
 try{
   const req=await rpc("submit",{reference:S.context.reference,claim_token:S.accessToken||claimFor(S.context.reference),client_request_id:S.clientRequestId||(S.clientRequestId=crypto.randomUUID()),reason_code:reason,description:$("#zwmReturnDescription").value,discovered_at:$("#zwmDiscoveredAt").value||null,requested_resolution:$("#zwmPreferred").value||null,items,unopened:false,unused:false,seal_intact:false,packaging_intact:false});
   const failed=[];for(const f of S.files){try{await uploadEvidence(req.id,f)}catch(x){failed.push(f.name)}}
   const signedIn=!!session()?.access_token;
   $("#zwmReturnBody").innerHTML='<div class="zwm-return-success"><span>✓</span><h3>'+esc(tr("Request submitted","تم إرسال الطلب","Demande envoyée"))+'</h3><strong>'+esc(req.request_number)+'</strong><p>'+esc(signedIn?tr("You can monitor this request from your account.","يمكنك متابعة هذا الطلب من حسابك.","Vous pouvez suivre cette demande depuis votre compte."):tr("This request stays linked to the original order. Close this window to keep the order page open and check its status there.","يبقى هذا الطلب مرتبطاً بالطلب الأصلي. أغلق هذه النافذة لمتابعة حالته من صفحة الطلب.","Cette demande reste liée à la commande d’origine. Fermez cette fenêtre pour suivre son statut depuis la page de commande."))+'</p>'+(failed.length?'<p class="zwm-return-warning">'+esc(tr("The request was saved, but some photos could not be uploaded. You can add information later after signing in.","تم حفظ الطلب، لكن تعذر رفع بعض الصور. يمكنك إضافة المعلومات لاحقاً بعد تسجيل الدخول.","La demande est enregistrée, mais certaines photos n’ont pas pu être envoyées. Vous pourrez ajouter des informations après connexion."))+'</p>':'')+'<div>'+(signedIn?'<a class="zwm-return-submit" href="'+route("/account")+'#orders">'+esc(tr("View my requests","عرض طلباتي","Voir mes demandes"))+'</a>':'')+'<button type="button" data-return-close>'+esc(tr("Close","إغلاق","Fermer"))+'</button></div></div>';
   loadHistory(true,true);
 }catch(x){err.textContent=x.message||String(x);btn.disabled=false;btn.textContent=tr("Submit request","إرسال الطلب","Envoyer la demande");}finally{S.busy=false}
}
async function openForOrder(ref){try{S.accessToken=null;const ctx=await rpc("order_context",{reference:ref,claim_token:claimFor(ref)});if(ctx.status!=="delivered"||!ctx.eligible_for_help)throw new Error(tr("Returns and product-issue requests become available after the order is marked delivered.","تتوفر طلبات الإرجاع ومشاكل المنتجات بعد تسجيل الطلب كمُسلَّم.","Les demandes de retour ou de problème produit sont disponibles une fois la commande marquée comme livrée."));renderWizard(ctx)}catch(e){ensureModal();openModal();$("#zwmReturnBody").innerHTML='<p class="zwm-return-error">'+esc(e.message)+'</p>'}}
async function mountOrderHelp(){
 if(document.body.dataset.page!=="order"||$("#zwmOrderHelpCard")||document.body.dataset.returnHelpChecked==="1")return;const ref=new URL(location.href).searchParams.get("ref");if(!ref)return;
 const content=$("#orderContent");if(!content||content.hidden)return;document.body.dataset.returnHelpChecked="1";let eligibility;try{eligibility=await rpc("order_context",{reference:ref,claim_token:claimFor(ref)})}catch{return}if(eligibility?.status!=="delivered"||!eligibility?.eligible_for_help)return;S.context=eligibility;const card=document.createElement("section");card.id="zwmOrderHelpCard";card.className="commerce-card zwm-order-help-card";card.innerHTML='<div><small>'+esc(tr("After delivery","بعد التسليم","Après livraison"))+'</small><h2>'+esc(tr("Problem with an item?","هل توجد مشكلة في منتج؟","Un problème avec un article ?"))+'</h2><p>'+esc(tr("Report genuine damage, missing or incorrect items, or quality and safety problems within 24 hours of delivery. For later problems, contact us.","أبلغ عن التلف أو المنتجات الناقصة أو الخاطئة أو مشاكل الجودة والسلامة خلال 24 ساعة من التسليم. بعد ذلك تواصل معنا.","Signalez tout dommage, article manquant ou incorrect ou problème de qualité ou sécurité dans les 24 heures après livraison. Passé ce délai, contactez-nous."))+'</p><a href="'+route("/returns-policy")+'">'+esc(tr("Returns & Product Issues Policy","سياسة الإرجاع ومشاكل المنتجات","Politique de retours"))+'</a></div><button type="button" class="is-primary" data-get-order-help>'+esc(tr("Get Help With This Order","الحصول على مساعدة بخصوص هذا الطلب","Obtenir de l’aide pour cette commande"))+'</button>';
 const existing=Array.isArray(eligibility.requests)?eligibility.requests:[];
 if(existing.length){
   const box=document.createElement("div");box.className="zwm-order-request-list";
   box.innerHTML='<strong>'+esc(tr("Existing request(s)","الطلبات الحالية","Demandes existantes"))+'</strong>'+existing.slice(0,3).map(r=>'<div><span>'+esc(r.request_number)+'</span><b class="zwm-status status-'+esc(r.status)+'">'+esc(statusLabel(r.status))+'</b></div>').join("");
   card.querySelector("div")?.appendChild(box);
 }
 const actions=content.querySelector(".commerce-card:last-of-type");(actions||content).insertAdjacentElement(actions?"beforebegin":"beforeend",card);card.querySelector("[data-get-order-help]").addEventListener("click",()=>openForOrder(ref));
}
async function loadHistory(silent,force=false){if(!session()?.access_token){S.requests=[];S.lastHistoryLoad=0;mountHistory();return}if(!force&&S.lastHistoryLoad&&Date.now()-S.lastHistoryLoad<HISTORY_STALE_MS){mountHistory();return}try{const x=await rpc("list",{},true);S.requests=Array.isArray(x.requests)?x.requests:[];S.lastHistoryLoad=Date.now();mountHistory()}catch(e){if(!silent)console.warn(e)}}
function requestCard(r){const item=(r.items||[]).map(i=>esc(i.product_name)+(i.quantity_requested>1?' ×'+i.quantity_requested:'')).join(" · ");return '<article class="zwm-history-card"><div class="zwm-history-head"><div><small>'+esc(date(r.submitted_at))+'</small><strong>'+esc(r.request_number)+'</strong><span>'+esc(r.order_reference)+'</span></div><span class="zwm-status status-'+esc(r.status)+'">'+esc(statusLabel(r.status))+'</span></div><p>'+esc(reasonLabel(r.reason_code))+(item?' · '+item:'')+'</p>'+(Number(r.approved_refund_total)>0?'<strong>'+esc(tr("Approved refund","الاسترداد المعتمد","Remboursement approuvé"))+': '+money(r.approved_refund_total)+'</strong>':'')+'<button type="button" data-return-detail="'+esc(r.id)+'">'+esc(tr("View request","عرض الطلب","Voir la demande"))+'</button></article>'}
function mountHistory(){
 if(document.body.dataset.page!=="account")return;const panel=$('[data-account-panel="orders"]');if(!panel)return;let root=$("#zwmReturnHistory",panel);if(!root){root=document.createElement("article");root.id="zwmReturnHistory";root.className="account-card zwm-return-history";panel.appendChild(root)}
 root.innerHTML='<div class="account-section-title"><div><h2>'+esc(tr("Returns & Product Issues","الإرجاع ومشاكل المنتجات","Retours et problèmes produits"))+'</h2><p>'+esc(tr("Track requests linked to your orders and the updates shared with you.","تابع الطلبات المرتبطة بمشترياتك والتحديثات التي تتم مشاركتها معك.","Suivez les demandes liées à vos commandes et les mises à jour qui vous sont communiquées."))+'</p></div><a href="'+route("/returns-policy")+'">'+esc(tr("Policy","السياسة","Politique"))+'</a></div><div class="zwm-history-grid">'+(S.requests.length?S.requests.map(requestCard).join(""):'<p class="zwm-empty">'+esc(tr("No return or product-issue requests yet.","لا توجد طلبات إرجاع أو مشاكل منتجات حتى الآن.","Aucune demande de retour ou problème produit."))+'</p>')+'</div>';
 root.querySelectorAll("[data-return-detail]").forEach(b=>b.addEventListener("click",()=>openDetail(b.dataset.returnDetail)));
}
async function openDetail(id){try{const r=await rpc("detail",{request_id:id},true);openModal();const msgs=(r.messages||[]).map(m=>'<div class="zwm-message"><small>'+esc(m.sender_role==="admin"?tr("Zayt w Mouneh","زيت ومونة","Zayt w Mouneh"):tr("You","أنت","Vous"))+' · '+date(m.created_at)+'</small><p>'+esc(m.message)+'</p></div>').join("");$("#zwmReturnBody").innerHTML='<div class="zwm-detail"><div class="zwm-detail-title"><div><small>'+esc(r.order_reference)+'</small><h3>'+esc(r.request_number)+'</h3></div><span class="zwm-status status-'+esc(r.status)+'">'+esc(statusLabel(r.status))+'</span></div><p><strong>'+esc(reasonLabel(r.reason_code))+'</strong></p><p>'+esc(r.customer_description)+'</p>'+(r.customer_visible_resolution?'<div class="zwm-resolution"><strong>'+esc(tr("Resolution","الحل","Solution"))+'</strong><p>'+esc(r.customer_visible_resolution)+'</p></div>':'')+(r.rejection_reason?'<div class="zwm-resolution"><strong>'+esc(tr("Review result","نتيجة المراجعة","Résultat de l’examen"))+'</strong><p>'+esc(r.rejection_reason)+'</p></div>':'')+(Number(r.approved_refund_total)>0?'<div class="zwm-resolution"><strong>'+esc(tr("Approved refund","الاسترداد المعتمد","Remboursement approuvé"))+'</strong><p>'+money(r.approved_refund_total)+' · '+esc(refundStatusLabel(r.refund_status))+'</p></div>':'')+'<div class="zwm-messages">'+msgs+'</div>'+(r.status==="awaiting_customer"?'<form id="zwmReplyForm"><label class="zwm-field"><span>'+esc(tr("Add information","إضافة معلومات","Ajouter des informations"))+'</span><textarea id="zwmReplyText" rows="4" maxlength="3000" required></textarea></label><button class="zwm-return-submit" type="submit">'+esc(tr("Send update","إرسال التحديث","Envoyer"))+'</button><p id="zwmReplyError" class="zwm-return-error"></p></form>':'')+'</div>';const f=$("#zwmReplyForm");if(f)f.addEventListener("submit",async e=>{e.preventDefault();try{await rpc("add_message",{request_id:r.id,message:$("#zwmReplyText").value},true);await loadHistory(true);openDetail(r.id)}catch(x){$("#zwmReplyError").textContent=x.message}})}catch(e){openModal();$("#zwmReturnBody").innerHTML='<p class="zwm-return-error">'+esc(e.message)+'</p>'}}
function mountStandaloneReturnsTab(){
 if(document.body.dataset.page!=="order")return;
 if(document.querySelector("[data-returns-center-link],[data-returns-fallback]"))return;
 const a=document.createElement("a");
 a.href=route("/returns");a.className="zwm-returns-fallback-tab";a.setAttribute("data-returns-fallback","");
 a.textContent=tr("Returns & Issues","الإرجاع والمشاكل","Retours & problèmes");
 document.body.appendChild(a);
}
function mountReturnCenter(){
 if(document.body.dataset.page!=="returns")return;
 const form=$("#returnsLookupForm"),result=$("#returnsLookupResult"),contact=$("#returnsLookupContact"),hint=$("#returnsLookupContactHint");
 if(!form||!result)return;
 if(session()?.access_token&&hint)hint.textContent=tr("If this order belongs to your signed-in account, the order code is enough. Otherwise enter the email or phone used for the order.","إذا كان الطلب تابعاً لحسابك المسجّل، يكفي رمز الطلب. وإلا أدخل البريد الإلكتروني أو رقم الهاتف المستخدم في الطلب.","Si cette commande appartient à votre compte connecté, le code suffit. Sinon, saisissez l’e-mail ou le téléphone utilisé.");
 form.addEventListener("submit",async e=>{
   e.preventDefault();if(S.busy)return;
   const reference=String($("#returnsLookupReference")?.value||"").trim().toUpperCase();
   const contactValue=String(contact?.value||"").trim();
   const error=$("#returnsLookupError"),button=form.querySelector("button[type=submit]");
   if(error)error.textContent="";
   S.busy=true;if(button){button.disabled=true;button.textContent=tr("Verifying…","جارٍ التحقق…","Vérification…")}
   try{
     const verified=await verifyOrder(reference,contactValue);
     S.accessToken=verified.access_token||null;S.context=verified.context||null;
     const ctx=S.context||{},existing=Array.isArray(ctx.requests)?ctx.requests:[],delivered=ctx.status==="delivered"&&ctx.eligible_for_help===true,eligible=delivered&&withinPolicyWindow(ctx);
     result.hidden=false;
     result.innerHTML='<div class="returns-center-result-head"><span aria-hidden="true">✓</span><div><small>'+esc(tr("Order verified","تم التحقق من الطلب","Commande vérifiée"))+'</small><strong>'+esc(ctx.reference||reference)+'</strong></div></div>'+
       '<div class="returns-center-result-grid"><span><small>'+esc(tr("Order status","حالة الطلب","Statut de commande"))+'</small><b>'+esc(String(ctx.status||"").replace(/_/g," "))+'</b></span><span><small>'+esc(tr("Request availability","إمكانية تقديم الطلب","Disponibilité de la demande"))+'</small><b>'+esc(eligible?tr("Within 24 hours","ضمن مهلة 24 ساعة","Dans les 24 heures"):(delivered?tr("Contact us for assistance","تواصل معنا للمساعدة","Contactez-nous"):tr("Available after delivery","متاح بعد التسليم","Disponible après livraison")))+'</b></span></div>'+
       (existing.length?'<div class="returns-center-existing"><strong>'+esc(tr("Existing request(s)","الطلبات الحالية","Demandes existantes"))+'</strong>'+existing.slice(0,5).map(r=>'<div><span>'+esc(r.request_number)+'</span><b class="zwm-status status-'+esc(r.status)+'">'+esc(statusLabel(r.status))+'</b></div>').join("")+'</div>':'')+
       (eligible?'<button type="button" class="zwm-return-submit" id="returnsCenterContinue">'+esc(tr("Report a product problem","أبلغ عن مشكلة في منتج","Signaler un problème produit"))+'</button>':'<p class="zwm-return-warning">'+esc(delivered?tr("The 24-hour window has passed, or the delivery time cannot be verified. Please contact us directly.","انتهت مهلة 24 ساعة أو تعذّر التحقق من وقت التسليم. يرجى التواصل معنا مباشرةً.","Le délai de 24 heures est dépassé ou l’heure de livraison ne peut pas être vérifiée. Contactez-nous directement."):tr("A product-problem request can be started after the order is marked delivered.","يمكن إرسال بلاغ عن مشكلة في المنتج بعد تسجيل الطلب كمُسلَّم.","Vous pouvez signaler un problème produit après la livraison."))+'</p><p><a href="'+route("/contact")+'">'+esc(tr("Contact us","تواصل معنا","Nous contacter"))+'</a> · <a href="https://wa.me/96170381412" target="_blank" rel="noopener">WhatsApp</a></p>');
     $("#returnsCenterContinue")?.addEventListener("click",()=>renderWizard(ctx));
   }catch(x){S.accessToken=null;S.context=null;result.hidden=true;if(error)error.textContent=x.message||String(x)}
   finally{S.busy=false;if(button){button.disabled=false;button.textContent=tr("Verify order","تحقق من الطلب","Vérifier la commande")}}
 });
}
function init(){ensureCss();ensureModal();mountStandaloneReturnsTab();mountReturnCenter();if(document.body.dataset.page==="order"){document.addEventListener("zwm:order-rendered",mountOrderHelp);setTimeout(mountOrderHelp,0)}if(document.body.dataset.page==="account"){const orders=$("[data-account-panel=\"orders\"]");if(orders)new MutationObserver(()=>{if(!$("#zwmReturnHistory",orders))mountHistory()}).observe(orders,{childList:true,subtree:true});setTimeout(()=>loadHistory(false),500);window.addEventListener("focus",()=>loadHistory(true,false));document.addEventListener("zwm:customer-order-changed",()=>loadHistory(true,true))}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
