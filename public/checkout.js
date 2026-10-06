
(function(){
"use strict";
var CART_KEY="zwm-cart-v5",GIFT_KEY="zwm-gift-items-v1",GIFT_META_KEY="zwm:native-gift:meta:v1",LANG_KEY="zwm-lang-v2",AUTH_KEY="zwm:mouneh:session:v1",CLAIMS_KEY="zwm:mouneh:claims:v1",WALLET_KEY="zwm:mouneh:selected-wallet:v1",REQUEST_KEY="zwm:native-checkout:request:v1",AREA_DRAFT_KEY="zwm:native-checkout:area:v1";
var state={lang:"en",kind:"order",giftMeta:{},config:null,products:[],cart:{},rows:[],dashboard:null,addresses:[],authUser:null,walletId:"",busy:false,areaRecord:null,areaText:"",catalogVerified:false,cartIssues:[]};
var T={
en:{backCart:"← Back to cart",account:"My Account",eyebrow:"Website order",title:"Checkout",intro:"Review your items, delivery details and Cash on Delivery total before placing your order.",emptyTitle:"Your pantry is empty.",emptyCopy:"Add products before starting checkout.",startShopping:"Start shopping",customerTitle:"Customer",customerHelp:"We only collect what is needed to fulfil your order.",name:"Full name",phone:"Phone / WhatsApp",email:"Email (optional for guests)",whatsappUpdates:"Send me order status updates on WhatsApp",whatsappUpdatesHelp:"Order updates only — confirmation, preparation, delivery and completion.",recipientName:"Recipient name",recipientPhone:"Recipient phone",giftDeliveryHelp:"Use the recipient contact if the driver should call them directly.",deliveryTitle:"Delivery",deliveryHelp:"Use the details a local driver would need in Lebanon.",savedAddress:"Deliver to a saved address",anotherAddress:"Use another",area:"Area / City",street:"Street / Neighborhood",building:"Building / Residence",floor:"Floor / Apartment",landmark:"Nearby landmark",instructions:"Delivery instructions",saveAddress:"Save this address to my account",rewardsTitle:"Rewards",rewardsHelp:"Mouneh Points are finalized only after delivery and payment are confirmed.",paymentTitle:"Payment",paymentHelp:"Payment is made in cash when your order is delivered.",cod:"Cash on Delivery",codHelp:"Pay the final order total when your delivery arrives.",paymentSummary:"Payment",codDue:"You’ll pay this total in cash when your order is delivered.",notesTitle:"Order note",notesHelp:"Optional — tell us anything useful for this delivery.",notes:"Anything we should know?",reviewTitle:"Review & place order",reviewHelp:"Your final total is re-calculated securely on the server before the order is created.",summaryTitle:"Order summary",subtotal:"Subtotal",reward:"Reward",delivery:"Delivery",total:"Total payable",placeOrder:"Place Order",needHelp:"Need help?",whatsappSupport:"Chat with us on WhatsApp",termsConsent:"I agree to the Terms of Service, Privacy Policy and applicable order/delivery terms.",termsLink:"Open Terms of Service ↗",privacyLink:"Open Privacy Policy ↗",terms:'I agree to the <a href="/terms" target="_blank" rel="noopener">Terms of Service</a>, <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a> and applicable order/delivery terms.'},
ar:{backCart:"العودة للسلة →",account:"حسابي",eyebrow:"طلب عبر الموقع",title:"إتمام الطلب",intro:"راجع المنتجات وتفاصيل التوصيل والمجموع المستحق عند الاستلام قبل إرسال الطلب.",emptyTitle:"سلتك فارغة.",emptyCopy:"أضف منتجات قبل بدء إتمام الطلب.",startShopping:"ابدأ التسوق",customerTitle:"العميل",customerHelp:"نجمع فقط البيانات اللازمة لتنفيذ الطلب.",name:"الاسم الكامل",phone:"رقم الهاتف / واتساب",email:"البريد الإلكتروني (اختياري للضيف)",whatsappUpdates:"أرسل لي تحديثات حالة الطلب عبر واتساب",whatsappUpdatesHelp:"تحديثات خاصة بالطلب فقط — التأكيد والتحضير والتوصيل والإكمال.",recipientName:"اسم المستلم",recipientPhone:"هاتف المستلم",giftDeliveryHelp:"استخدم رقم المستلم إذا كان على السائق الاتصال به مباشرة.",deliveryTitle:"التوصيل",deliveryHelp:"استخدم التفاصيل التي يحتاجها سائق التوصيل في لبنان.",savedAddress:"التوصيل إلى عنوان محفوظ",anotherAddress:"استخدام عنوان آخر",area:"المنطقة / المدينة",street:"الشارع / الحي",building:"المبنى / السكن",floor:"الطابق / الشقة",landmark:"معلم قريب",instructions:"تعليمات التوصيل",saveAddress:"حفظ هذا العنوان في حسابي",rewardsTitle:"المكافآت",rewardsHelp:"تُعتمد نقاط المونة فقط بعد تأكيد التسليم واستلام الدفع.",paymentTitle:"الدفع",paymentHelp:"يتم الدفع نقداً عند استلام طلبك.",cod:"الدفع عند الاستلام",codHelp:"ادفع المجموع النهائي عند وصول طلبك.",paymentSummary:"طريقة الدفع",codDue:"ستدفع هذا المجموع نقداً عند استلام الطلب.",notesTitle:"ملاحظة الطلب",notesHelp:"اختياري — أخبرنا بما يفيد في هذا التوصيل.",notes:"هل هناك شيء يجب أن نعرفه؟",reviewTitle:"المراجعة وإرسال الطلب",reviewHelp:"يُعاد احتساب المجموع النهائي بأمان على الخادم قبل إنشاء الطلب.",summaryTitle:"ملخص الطلب",subtotal:"المجموع الفرعي",reward:"المكافأة",delivery:"التوصيل",total:"المجموع المستحق",placeOrder:"إرسال الطلب",needHelp:"تحتاج مساعدة؟",whatsappSupport:"تواصل معنا عبر واتساب",termsConsent:"أوافق على شروط الخدمة وسياسة الخصوصية وشروط الطلب والتوصيل المطبقة.",termsLink:"فتح شروط الخدمة ↗",privacyLink:"فتح سياسة الخصوصية ↗",terms:'أوافق على <a href="/terms" target="_blank" rel="noopener">شروط الخدمة</a> و<a href="/privacy" target="_blank" rel="noopener">سياسة الخصوصية</a> وشروط الطلب والتوصيل المطبقة.'}
};
T.fr=Object.fromEntries(Object.entries(T.en).map(function(pair){return [pair[0],window.ZWM_FR_TRANSLATE?window.ZWM_FR_TRANSLATE(pair[1]):pair[1]]}));
Object.assign(T.fr,{
backCart:"← Retour au panier",account:"Mon compte",eyebrow:"Commande sur le site",title:"Paiement",intro:"Vérifiez vos articles, l’adresse de livraison et le total à payer à la livraison avant de confirmer.",
emptyTitle:"Votre panier est vide.",emptyCopy:"Ajoutez des produits avant de passer au paiement.",startShopping:"Commencer mes achats",customerTitle:"Client",customerHelp:"Nous recueillons uniquement les informations nécessaires à la préparation et à la livraison.",
name:"Nom complet",phone:"Téléphone / WhatsApp",email:"E-mail (facultatif pour les invités)",whatsappUpdates:"Recevoir les mises à jour de commande sur WhatsApp",whatsappUpdatesHelp:"Uniquement les mises à jour transactionnelles liées à la commande.",
recipientName:"Nom du destinataire",recipientPhone:"Téléphone du destinataire",giftDeliveryHelp:"Utilisez ce numéro si le livreur doit contacter directement le destinataire.",deliveryTitle:"Livraison",deliveryHelp:"Indiquez les détails nécessaires à un livreur local au Liban.",
savedAddress:"Livrer à une adresse enregistrée",anotherAddress:"Utiliser une autre adresse",area:"Zone / Ville",street:"Rue / Quartier",building:"Immeuble / Résidence",floor:"Étage / Appartement",landmark:"Point de repère",instructions:"Instructions de livraison",
saveAddress:"Enregistrer cette adresse dans mon compte",rewardsTitle:"Récompenses",rewardsHelp:"Les Points Mouneh sont finalisés uniquement après confirmation de la livraison et du paiement.",paymentTitle:"Paiement",paymentHelp:"Le paiement se fait en espèces lorsque votre commande est livrée.",
cod:"Paiement à la livraison",codHelp:"Payez le montant final lorsque votre livraison arrive.",paymentSummary:"Paiement",codDue:"Vous paierez ce total en espèces à la livraison.",notesTitle:"Note de commande",notesHelp:"Facultatif — ajoutez toute information utile pour cette livraison.",
notes:"Quelque chose à nous signaler ?",reviewTitle:"Vérifier et commander",reviewHelp:"Le total final est recalculé côté serveur avant la création de la commande.",summaryTitle:"Récapitulatif",subtotal:"Sous-total",reward:"Récompense",delivery:"Livraison",total:"Total à payer",
placeOrder:"Passer la commande",needHelp:"Besoin d’aide ?",whatsappSupport:"Nous contacter sur WhatsApp",termsConsent:"J’accepte les Conditions d’utilisation, la Politique de confidentialité et les conditions applicables à la commande et à la livraison.",termsLink:"Ouvrir les Conditions ↗",privacyLink:"Ouvrir la Politique de confidentialité ↗"
});
var $=function(id){return document.getElementById(id)};
var esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var ltr=function(v){return state.lang==="ar"?"\u2066"+String(v==null?"":v)+"\u2069":String(v==null?"":v)};
function t(en,ar,fr){if(state.lang==="ar")return ar;if(state.lang==="fr")return fr!=null?fr:(window.ZWM_FR_TRANSLATE?window.ZWM_FR_TRANSLATE(en):en);return en}
function normalizePhone(value){var raw=String(value||"").trim(),plus=raw.charAt(0)==="+",digits=raw.replace(/\D/g,"");return (plus?"+":"")+digits}
var money=function(v){return ltr("$"+(Number(v)||0).toFixed(2))};
function read(key,fallback){try{var v=localStorage.getItem(key);return v==null?fallback:JSON.parse(v)}catch{return fallback}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function remove(key){try{localStorage.removeItem(key)}catch{}}
function session(){return read(AUTH_KEY,null)}
function uuid(){return crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(c){var r=Math.random()*16|0,v=c==="x"?r:(r&3|8);return v.toString(16)})}
function token(){var a=new Uint8Array(32);crypto.getRandomValues(a);return Array.from(a,function(n){return n.toString(16).padStart(2,"0")}).join("")}
function productBase(){try{return typeof PRODUCTS_DATA!=="undefined"?JSON.parse(JSON.stringify(PRODUCTS_DATA)):[]}catch{return []}}
function config(){return window.ZWM_CMS_CONFIG||{}}
async function rpc(name,body,retry){
  var c=config(),s=session(),headers={"apikey":c.supabasePublishableKey,"Content-Type":"application/json","Prefer":"return=representation"},controller=typeof AbortController==="function"?new AbortController():null,timer=null,r;
  if(s&&s.access_token)headers.Authorization="Bearer "+s.access_token;
  try{
    if(controller)timer=setTimeout(function(){controller.abort()},20000);
    r=await fetch(String(c.supabaseUrl||"").replace(/\/$/,"")+"/rest/v1/rpc/"+name,{method:"POST",headers:headers,body:JSON.stringify(body||{}),signal:controller?controller.signal:undefined});
  }catch(err){
    var networkError=new Error(err&&err.name==="AbortError"
      ?t("The request took too long. Check your connection and try again.","استغرق الطلب وقتاً طويلاً. تحقق من الاتصال وحاول مجدداً.","La demande a pris trop de temps. Vérifiez votre connexion et réessayez.")
      :t("We could not reach the order service. Check your connection and try again.","تعذّر الاتصال بخدمة الطلبات. تحقق من الاتصال وحاول مجدداً.","Impossible de joindre le service de commande. Vérifiez votre connexion et réessayez."));
    networkError.retryable=true;throw networkError
  }finally{if(timer)clearTimeout(timer)}
  var data=await r.json().catch(function(){return {}});
  if(r.status===401&&retry!==false){await new Promise(function(res){setTimeout(res,500)});return rpc(name,body,false)}
  if(!r.ok){var requestError=new Error(data.message||data.hint||data.details||t("Request failed.","تعذّر تنفيذ الطلب.","La demande a échoué."));requestError.status=r.status;throw requestError}
  return data
}
async function authUser(){
  var s=session(),c=config();if(!s||!s.access_token)return null;
  try{var r=await fetch(String(c.supabaseUrl).replace(/\/$/,"")+"/auth/v1/user",{headers:{"apikey":c.supabasePublishableKey,"Authorization":"Bearer "+s.access_token}});if(!r.ok)return null;return await r.json()}catch{return null}
}
async function loadOverrides(){
  var c=config(),base=productBase(),map=new Map(base.map(function(p){return [p.id,p]}));
  state.catalogVerified=false;
  try{
    var r=await fetch(String(c.supabaseUrl).replace(/\/$/,"")+"/rest/v1/product_overrides?select=product_id,action,payload",{headers:{"apikey":c.supabasePublishableKey}});
    if(!r.ok)throw new Error("Catalogue verification failed");
    var rows=await r.json();
    rows.forEach(function(o){var p=map.get(o.product_id)||{id:o.product_id};if(o.action==="hide"){p.__hidden=true}else if(o.payload&&typeof o.payload==="object"){p=Object.assign({},p,o.payload);p.__hidden=o.action==="hide"}map.set(o.product_id,p)});
    state.catalogVerified=true
  }catch{}
  state.products=Array.from(map.values());
  return state.catalogVerified
}
function product(id){return state.products.find(function(p){return p.id===id})}
function variant(p,id){return p&&Array.isArray(p.variants)?p.variants.find(function(v){return v.id===id}):null}
function availability(p){return p&& !p.__hidden && !["hidden","draft"].includes(p.status) && String(p.availability||"in_stock")==="in_stock"}
function rebuildRows(){
  var keyName=state.kind==="gift"?GIFT_KEY:CART_KEY,raw=null;state.cartIssues=[];
  try{
    raw=localStorage.getItem(keyName);
    state.cart=raw==null?{}:JSON.parse(raw);
    if(!state.cart||typeof state.cart!=="object"||Array.isArray(state.cart))throw new Error("invalid cart")
  }catch{
    state.cart={};state.cartIssues.push("malformed")
  }
  state.rows=Object.keys(state.cart).map(function(key){
    var it=state.cart[key];if(!it||typeof it!=="object"){state.cartIssues.push("malformed_item");return null}
    var p=product(it.productId),v=variant(p,it.variantId),qty=Number(it.qty);
    if(!p||!v){state.cartIssues.push("missing_item");return null}
    if(!Number.isInteger(qty)||qty<1||qty>99){state.cartIssues.push("invalid_quantity");return null}
    return {key:key,item:it,p:p,v:v,qty:qty,available:availability(p)}
  }).filter(Boolean)
}
function roundMoney(v){return Math.round(((Number(v)||0)+Number.EPSILON)*100)/100}
function subtotal(){return roundMoney(state.rows.reduce(function(sum,r){return sum+roundMoney(Number(r.v.price||0)*r.qty)},0))}
function currentWallet(){
  var wallet=state.dashboard&&Array.isArray(state.dashboard.wallet)?state.dashboard.wallet:[];
  var sub=subtotal();
  return wallet.find(function(w){return w.id===state.walletId&&w.status==="available"&&sub>=Number(w.minimum||0)})||null
}
function rewardDiscount(){var w=currentWallet();return w?Math.min(subtotal(),Number(w.value)||0):0}
function deliverySettings(){return state.config&&state.config.delivery||{}}
function activeZones(){var z=deliverySettings().zones;return Array.isArray(z)?z.filter(function(x){return x&&x.active!==false}):[]}
var areaDirectoryPromise=null;
function areaDirectory(){return Array.isArray(window.ZWM_LEBANON_AREAS)?window.ZWM_LEBANON_AREAS:[]}
function ensureAreaDirectory(){
  var ready=areaDirectory();if(ready.length)return Promise.resolve(ready);
  if(areaDirectoryPromise)return areaDirectoryPromise;
  areaDirectoryPromise=new Promise(function(resolve){
    var script=document.createElement("script");
    script.src="/lebanon-areas.js?v=20261004-deliveryarea6";
    script.async=true;
    script.onload=function(){resolve(areaDirectory())};
    script.onerror=function(){areaDirectoryPromise=null;resolve([])};
    document.head.appendChild(script)
  });
  return areaDirectoryPromise
}
function rememberArea(value){
  var v=String(value||"").trim();
  state.areaText=v;
  try{if(v)sessionStorage.setItem(AREA_DRAFT_KEY,v);else sessionStorage.removeItem(AREA_DRAFT_KEY)}catch{}
  return v
}
function readArea(){
  var input=$("checkoutArea"),direct=String(input&&input.value||"").trim();
  if(direct){rememberArea(direct);return direct}
  if(state.areaText)return state.areaText;
  try{var saved=String(sessionStorage.getItem(AREA_DRAFT_KEY)||"").trim();if(saved){state.areaText=saved;return saved}}catch{}
  if(state.areaRecord)return String(state.lang==="ar"?(state.areaRecord.ar||state.areaRecord.en):(state.areaRecord.en||state.areaRecord.ar)||"").trim();
  if(state.kind==="gift"&&state.giftMeta&&state.giftMeta.area)return String(state.giftMeta.area).trim();
  var savedSelect=$("savedAddressSelect"),savedAddress=savedSelect&&state.addresses.find(function(x){return x.id===savedSelect.value});
  if(savedAddress&&savedAddress.area)return String(savedAddress.area).trim();
  return ""
}
function norm(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[ًٌٍَُِّْـ]/g,"").toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g," ").trim()}
function areaDisplay(a){if(!a)return"";var name=state.lang==="ar"?(a.ar||a.en):(a.en||a.ar),district=state.lang==="ar"?(a.districtAr||a.districtEn):(a.districtEn||a.districtAr),gov=state.lang==="ar"?(a.governorateAr||a.governorateEn):(a.governorateEn||a.governorateAr);return [name,district,gov].filter(Boolean).join(" · ")}
function exactArea(value){
  var q=norm(value);if(!q)return null;
  return areaDirectory().find(function(a){return q===norm(a.en)||q===norm(a.ar)||q===norm(areaDisplay(a))})||null
}
function areaTerms(a){return norm([a.en,a.ar,a.districtEn,a.districtAr,a.governorateEn,a.governorateAr].filter(Boolean).join(" "))}
function areaMatches(query){
  var q=norm(query);if(!q)return[];
  var words=q.split(/\s+/).filter(Boolean);
  return areaDirectory().map(function(a){
    var hay=areaTerms(a),en=norm(a.en),ar=norm(a.ar),score=0;
    if(en===q||ar===q)score+=100;
    if(en.startsWith(q)||ar.startsWith(q))score+=45;
    if(hay.includes(q))score+=25;
    if(words.every(function(w){return hay.includes(w)}))score+=15;
    return score?{a:a,score:score}:null
  }).filter(Boolean).sort(function(x,y){return y.score-x.score||String(x.a.en).localeCompare(String(y.a.en))}).slice(0,10).map(function(x){return x.a})
}
function currentAreaRecord(){
  var input=$("checkoutArea"),value=readArea();
  if(state.areaRecord&&(norm(value)===norm(state.areaRecord.en)||norm(value)===norm(state.areaRecord.ar)||norm(value)===norm(areaDisplay(state.areaRecord))))return state.areaRecord;
  state.areaRecord=exactArea(value);return state.areaRecord
}
function matchedDeliveryZone(){
  var zones=activeZones();if(!zones.length)return null;
  var a=currentAreaRecord(),raw=$("checkoutArea")?$("checkoutArea").value.trim():"";
  var terms=[raw];
  if(a)terms.push(a.en,a.ar,a.districtEn,a.districtAr,a.governorateEn,a.governorateAr,a.id);
  var normalized=terms.filter(Boolean).map(norm);
  return zones.find(function(z){
    var candidates=[z.id,z.area,z.name_en,z.name_ar].filter(Boolean).map(norm);
    return candidates.some(function(v){return normalized.includes(v)})
  })||null
}
function selectedZone(){return matchedDeliveryZone()}
function quote(){
  var d=deliverySettings(),zones=activeZones(),matched=selectedZone(),z=matched||{},sub=subtotal(),disc=rewardDiscount();
  var hasArea=!!readArea(),zoneAvailable=!zones.length||!!matched,deliveryEnabled=d.enabled!==false;
  var available=deliveryEnabled&&zoneAvailable,basis=(z.eligibility_basis||d.eligibilityBasis)==="after_discount"?"after_discount":"before_discount";
  var eligible=basis==="after_discount"?Math.max(0,sub-disc):sub;
  var fee=hasArea?Math.max(0,Number(z.fee!=null?z.fee:d.fee)||0):0;
  var threshold=Math.max(0,Number(z.free_delivery_threshold!=null?z.free_delivery_threshold:(z.freeAbove!=null?z.freeAbove:d.freeAbove))||50);
  var minimum=Math.max(0,Number(z.minimum_order!=null?z.minimum_order:(z.minimum!=null?z.minimum:d.minimum))||0);
  var freeEnabled=z.free_enabled!=null?z.free_enabled:(d.freeEnabled!==false);
  if(hasArea&&freeEnabled&&threshold>0&&eligible>=threshold)fee=0;
  return {available:available,deliveryEnabled:deliveryEnabled,zoneAvailable:zoneAvailable,hasArea:hasArea,fee:fee,threshold:threshold,minimum:minimum,eligible:eligible,free:hasArea&&available&&freeEnabled&&threshold>0&&eligible>=threshold}
}
function setLang(next){
  var chosen=state.areaRecord;state.lang=next==="ar"?"ar":next==="fr"?"fr":"en";try{if(window.ZWM_LOCALE?.set)window.ZWM_LOCALE.set(state.lang);else localStorage.setItem(LANG_KEY,state.lang)}catch{}
  document.documentElement.lang=state.lang;document.documentElement.dir=state.lang==="ar"?"rtl":"ltr";if(chosen&&$("checkoutArea"))$("checkoutArea").value=state.lang==="ar"?(chosen.ar||chosen.en):(chosen.en||chosen.ar);
  document.querySelectorAll("[data-commerce-lang]").forEach(function(b){b.classList.toggle("is-active",b.dataset.commerceLang===state.lang)});
  var t=T[state.lang];document.querySelectorAll("[data-i18n]").forEach(function(el){var k=el.dataset.i18n;if(t[k]!=null)el.textContent=t[k]});
  document.querySelectorAll("[data-i18n-html]").forEach(function(el){var k=el.dataset.i18nHtml;if(t[k]!=null)el.innerHTML=t[k]});
  renderAll()
}
function phoneSupport(){
  var number="96181581230";
  try{var settings=window.ZWM_CMS&&window.ZWM_CMS.getSettings&&window.ZWM_CMS.getSettings();number=String(settings&&settings.contact&&settings.contact.whatsapp||number).replace(/\D/g,"")}catch{}
  $("checkoutSupport").href="https://wa.me/"+number+"?text="+encodeURIComponent(t("Hi, I need help completing my website order.","مرحباً، أحتاج مساعدة لإتمام طلبي عبر الموقع.","Bonjour, j’ai besoin d’aide pour finaliser ma commande sur le site."))
}
function renderIdentity(){
  var box=$("checkoutIdentity"),m=state.dashboard&&state.dashboard.member;
  if(m){
    box.innerHTML='<div class="checkout-identity"><span>🌿</span><div><strong>'+esc(t("Signed in as ","مسجّل الدخول باسم ","Connecté en tant que ")+(m.name||""))+'</strong><small>'+esc(t("This order will be linked to your account and Mouneh Points.","سيُربط الطلب بحسابك ونقاط المونة.","Cette commande sera liée à votre compte et à vos Points Mouneh."))+'</small></div></div>';
    if(!$("checkoutName").value)$("checkoutName").value=m.name||"";
    if(!$("checkoutPhone").value)$("checkoutPhone").value=m.phone||"";
    if(!$("checkoutEmail").value)$("checkoutEmail").value=state.authUser&&state.authUser.email||"";
    $("saveAddressWrap").hidden=false
  }else{
    box.innerHTML='<div class="checkout-identity"><span>🌿</span><div><strong>'+esc(t("Guest checkout is available.","يمكنك الطلب كضيف.","La commande en tant qu’invité est disponible."))+'</strong><small>'+esc(t("Sign in to earn points, save addresses and track orders more easily.","سجّل الدخول لكسب النقاط وحفظ العناوين وتتبع الطلبات بسهولة أكبر.","Connectez-vous pour gagner des points, enregistrer des adresses et suivre vos commandes plus facilement."))+'</small></div></div>'
  }
}
function renderAreaMeta(){
  var input=$("checkoutArea"),help=$("areaSearchHelp"),a=currentAreaRecord();if(!input||!help)return;
  input.placeholder=t("Search town, village or area","ابحث عن البلدة أو القرية أو المنطقة","Rechercher une ville, un village ou une zone");
  if(a){
    var district=state.lang==="ar"?(a.districtAr||a.districtEn):(a.districtEn||a.districtAr),gov=state.lang==="ar"?(a.governorateAr||a.governorateEn):(a.governorateEn||a.governorateAr);
    help.textContent=t("Selected: ","تم الاختيار: ","Sélection : ")+[district,gov].filter(Boolean).join(" · ");help.classList.add("is-selected")
  }else{
    help.textContent=t("Start typing your town, village or area. If it is not listed, type the exact area yourself.","ابدأ بكتابة اسم البلدة أو القرية أو المنطقة. إذا لم تجدها في القائمة، اكتب اسم المنطقة الدقيق بنفسك.","Commencez à saisir votre ville, village ou zone. Si elle n’apparaît pas, saisissez le nom exact.");
    help.classList.remove("is-selected")
  }
}
function closeAreaSuggestions(){
  var box=$("areaSuggestions"),input=$("checkoutArea");if(box)box.hidden=true;if(input)input.setAttribute("aria-expanded","false")
}
function renderAreaSuggestions(force){
  var input=$("checkoutArea"),box=$("areaSuggestions");if(!input||!box)return;
  var q=input.value.trim(),rows=areaMatches(q);
  if((!force&&q.length<1)||!rows.length){closeAreaSuggestions();return}
  box.innerHTML=rows.map(function(a){return '<button type="button" class="area-suggestion" role="option" data-area-id="'+esc(a.id)+'"><strong>'+esc(state.lang==="ar"?(a.ar||a.en):(a.en||a.ar))+'</strong><small>'+esc([state.lang==="ar"?(a.districtAr||a.districtEn):(a.districtEn||a.districtAr),state.lang==="ar"?(a.governorateAr||a.governorateEn):(a.governorateEn||a.governorateAr)].filter(Boolean).join(" · "))+'</small></button>'}).join("");
  box.hidden=false;input.setAttribute("aria-expanded","true")
}
function chooseArea(id){
  var a=areaDirectory().find(function(x){return String(x.id)===String(id)});if(!a)return;
  state.areaRecord=a;var value=state.lang==="ar"?(a.ar||a.en):(a.en||a.ar);$("checkoutArea").value=value;rememberArea(value);if($("checkoutStatus"))$("checkoutStatus").textContent="";closeAreaSuggestions();renderAreaMeta();renderSummary()
}
function renderZones(){renderAreaMeta()}
function renderAddresses(){
  var wrap=$("savedAddressWrap"),sel=$("savedAddressSelect");if(!state.dashboard||!state.addresses.length){wrap.hidden=true;return}
  wrap.hidden=false;var current=sel.value;sel.innerHTML='<option value="">'+esc(t("Choose saved address","اختر عنواناً محفوظاً","Choisir une adresse enregistrée"))+'</option>'+state.addresses.map(function(a){return '<option value="'+esc(a.id)+'">'+esc((a.label||t("Address","عنوان","Adresse"))+" · "+(a.area||""))+'</option>'}).join("");if(state.addresses.some(function(a){return a.id===current}))sel.value=current
}
function renderRewards(){
  var box=$("checkoutRewards"),m=state.dashboard&&state.dashboard.member,sub=subtotal();
  if(!m){
    var base=Number(state.publicRewards&&state.publicRewards.config&&state.publicRewards.config.base_rate||1),estimate=Math.floor(sub*base);
    box.innerHTML='<div class="reward-guest"><div><strong>'+esc(t("Earn about ","اكسب تقريباً ","Gagnez environ ")+estimate+t(" 🌿 Mouneh Points"," 🌿 نقطة"," 🌿 Points Mouneh"))+'</strong><small>'+esc(t("Sign in before placing the order to link it to your account.","سجّل الدخول قبل إرسال الطلب لربطه بحسابك.","Connectez-vous avant de commander pour lier la commande à votre compte."))+'</small></div><a href="/account?auth=signin">'+esc(t("Sign in","تسجيل الدخول","Se connecter"))+'</a></div>';return
  }
  var wallet=(state.dashboard.wallet||[]).filter(function(w){return w.status==="available"&&sub>=Number(w.minimum||0)}),tier=m.tier==="golden"?1.5:m.tier==="olive"?1.25:1,base=Number(state.publicRewards&&state.publicRewards.config&&state.publicRewards.config.base_rate||1),estimate=Math.floor(sub*base*tier);
  if(state.walletId&&!wallet.some(function(w){return w.id===state.walletId})){state.walletId="";remove(WALLET_KEY)}
  box.innerHTML='<div class="reward-balance"><div><strong>'+esc(Number(m.balance||0).toLocaleString()+" 🌿 "+t("points","نقطة","points"))+'</strong><small>'+esc(t("About ","حوالي ","Environ ")+estimate+t(" points after delivery"," نقطة بعد التسليم"," points après la livraison"))+'</small></div><a href="/account#points">'+esc(t("Wallet","المحفظة","Portefeuille"))+'</a></div>'+
    (wallet.length?'<label class="commerce-field"><span>'+esc(t("Use a reward voucher","استخدم قسيمة مكافأة","Utiliser un bon de récompense"))+'</span><select id="checkoutWallet"><option value="">'+esc(t("No voucher","بدون قسيمة","Aucun bon"))+'</option>'+wallet.map(function(w){return '<option value="'+esc(w.id)+'" '+(w.id===state.walletId?"selected":"")+">"+esc(money(w.value)+" "+t("off · min ","خصم · حد أدنى ","de réduction · min. ")+money(w.minimum))+"</option>"}).join("")+'</select></label>':'<small class="checkout-help">'+esc(t("No reward voucher is available for this basket yet.","لا توجد قسيمة متاحة لهذه السلة حالياً.","Aucun bon de récompense n’est disponible pour ce panier."))+'</small>');
  var select=$("checkoutWallet");if(select)select.onchange=function(){state.walletId=select.value;if(state.walletId)write(WALLET_KEY,state.walletId);else remove(WALLET_KEY);renderSummary()}
}
function productPhoto(p){
  try{var source=window.ZWM_PRODUCT_PHOTOS&&window.ZWM_PRODUCT_PHOTOS.sourceFor&&window.ZWM_PRODUCT_PHOTOS.sourceFor(p.id);return source&&source.url?source:null}catch{return null}
}
function renderSummary(){
  var box=$("summaryItems"),sub=subtotal(),disc=roundMoney(rewardDiscount()),q=quote(),total=roundMoney(Math.max(0,sub-disc)+q.fee),qty=state.rows.reduce(function(n,r){return n+r.qty},0),issueBox=$("cartIssueBox"),giftBox=$("summaryGift");
  $("summaryCount").textContent=t(qty+" item"+(qty===1?"":"s"),qty+" "+(qty===1?"قطعة":"قطع"),qty+" article"+(qty===1?"":"s"));
  box.innerHTML=state.rows.map(function(r){
    var name=state.lang==="ar"?(r.p.nameAr||r.p.nameEn):(r.p.nameEn||r.p.nameAr),size=state.lang==="ar"?(r.v.sizeAr||r.v.sizeEn):(r.v.sizeEn||r.v.sizeAr),photo=productPhoto(r.p),line=roundMoney(Number(r.v.price)*r.qty),unit=roundMoney(r.v.price);
    return '<div class="summary-item '+(photo?"":"no-photo")+'">'+(photo?'<img class="summary-item-photo" src="'+esc(photo.url)+'" alt="" loading="lazy" decoding="async">':"")+'<div><strong>'+esc(name)+'</strong><small>'+esc(size)+" · "+t("Qty ","الكمية ","Qté ")+r.qty+" · "+money(unit)+" "+t("each","للوحدة","l’unité")+(r.available?"":(" · "+t("Unavailable","غير متوفر","Indisponible")))+'</small></div><b>'+money(line)+'</b></div>'
  }).join("");
  if(issueBox){
    issueBox.hidden=!state.cartIssues.length;
    issueBox.textContent=state.cartIssues.length?t(
      "Your cart changed or contains invalid data. Return to the cart and review it before placing the order.",
      "تغيّرت السلة أو تحتوي على بيانات غير صالحة. عد إلى السلة وراجعها قبل إرسال الطلب.",
      "Votre panier a changé ou contient des données invalides. Revenez au panier et vérifiez-le avant de commander."
    ):""
  }
  if(giftBox){
    var gift=state.kind==="gift"?state.giftMeta||{}:null,parts=[];
    if(gift){
      if(gift.recipient)parts.push("<strong>"+esc(t("Recipient: ","المستلم: ","Destinataire : ")+gift.recipient)+"</strong>");
      if(gift.occasion)parts.push("<small>"+esc(t("Occasion: ","المناسبة: ","Occasion : ")+gift.occasion)+"</small>");
      if(gift.requested_delivery_date)parts.push("<small>"+esc(t("Requested date: ","التاريخ المطلوب: ","Date souhaitée : ")+gift.requested_delivery_date)+"</small>");
      if(gift.message)parts.push("<small>"+esc(t("Gift message: ","رسالة الهدية: ","Message cadeau : ")+gift.message)+"</small>")
    }
    giftBox.hidden=!parts.length;giftBox.innerHTML=parts.join("")
  }
  $("summarySubtotal").textContent=money(sub);
  $("summaryRewardRow").hidden=disc<=0;$("summaryReward").textContent="-"+money(disc);
  $("summaryDelivery").textContent=!q.hasArea?t("Select area","اختر المنطقة","Choisir la zone"):(!q.zoneAvailable?t("Unavailable","غير متاح","Indisponible"):(q.fee===0?t("Free","مجاني","Gratuite"):money(q.fee)));
  $("summaryTotal").textContent=money(total);
  var remain=Math.max(0,q.threshold-q.eligible),pct=q.threshold>0?Math.min(100,q.eligible/q.threshold*100):100,msg="";
  if(!q.deliveryEnabled)msg=t("Delivery is temporarily paused","التوصيل متوقف مؤقتاً","La livraison est temporairement suspendue");
  else if(q.hasArea&&!q.zoneAvailable)msg=t("Delivery is not currently available for this area","التوصيل غير متاح حالياً لهذه المنطقة","La livraison n’est pas disponible pour cette zone");
  else if(q.free)msg=t("You unlocked FREE delivery ✓","حصلت على التوصيل المجاني ✓","Livraison GRATUITE débloquée ✓");
  else msg=t("Add ","أضف ","Ajoutez ")+money(remain)+t(" more for FREE delivery 🚚"," للتوصيل المجاني"," de plus pour la livraison GRATUITE 🚚");
  $("freeDeliveryBox").innerHTML='<strong>'+esc(msg)+'</strong><div class="free-delivery-track"><span style="width:'+pct+'%"></span></div>'+(q.minimum>0?'<small>'+esc(t("Minimum order ","الحد الأدنى للطلب ","Commande minimum ")+money(q.minimum))+'</small>':'');
  var btn=$("placeOrderButton");btn.textContent=t("Place Order — ","إرسال الطلب — ","Commander — ")+money(total);
  btn.disabled=state.busy||!state.catalogVerified||!q.available||!q.hasArea||!state.rows.length||!!state.cartIssues.length||state.rows.some(function(r){return !r.available})
}
function renderGiftFields(){
  var box=$("giftCheckoutFields");if(!box)return;
  box.hidden=state.kind!=="gift";
  if(state.kind==="gift"){
    $("checkoutRecipientName").required=true;
    if(!$("checkoutRecipientName").value)$("checkoutRecipientName").value=state.giftMeta.recipient||"";
    if(!$("checkoutName").value)$("checkoutName").value=state.giftMeta.sender||"";
    if(!$("checkoutArea").value&&state.giftMeta.area){$("checkoutArea").value=state.giftMeta.area;rememberArea(state.giftMeta.area)}
    var intro=document.querySelector(".commerce-intro h1");if(intro)intro.textContent=t("Gift checkout","إتمام طلب الهدية","Paiement du cadeau");
  }
}
function renderAll(){if(!$("nativeCheckoutForm")||!state.rows.length)return;renderIdentity();renderGiftFields();renderZones();renderAddresses();renderRewards();renderSummary();phoneSupport()}
function addressPayload(){
  var z=selectedZone(),a=currentAreaRecord(),area=readArea();if(!area&&a)area=String(a.en||a.ar||"").trim();
  return {zone_id:z?String(z.id||z.area||z.name_en||""):"",area:area,cadastre_id:a?a.id:"",district:a?(a.districtEn||a.districtAr||""):"",governorate:a?(a.governorateEn||a.governorateAr||""):"",street:$("checkoutStreet").value.trim(),building:$("checkoutBuilding").value.trim(),floor_apartment:$("checkoutFloor").value.trim(),landmark:$("checkoutLandmark").value.trim(),instructions:$("checkoutInstructions").value.trim(),latitude:a&&a.lat!=null?a.lat:null,longitude:a&&a.lon!=null?a.lon:null,recipient_name:state.kind==="gift"?$("checkoutRecipientName").value.trim():"",recipient_phone:state.kind==="gift"?$("checkoutRecipientPhone").value.trim():""}
}
function fillAddress(a){
  if(!a)return;$("checkoutArea").value=a.area||"";rememberArea(a.area||"");state.areaRecord=exactArea(a.area||"");$("checkoutStreet").value=a.street||a.address||"";$("checkoutBuilding").value=a.building||"";$("checkoutFloor").value=a.floor_apartment||"";$("checkoutLandmark").value=a.landmark||"";$("checkoutInstructions").value=a.delivery_notes||"";if($("checkoutStatus"))$("checkoutStatus").textContent="";renderAreaMeta();renderSummary()
}
function cartSignature(){return state.rows.map(function(r){return r.p.id+":"+r.v.id+":"+r.qty}).sort().join("|")}
function checkoutAttempt(){
  var saved;try{saved=JSON.parse(sessionStorage.getItem(REQUEST_KEY)||"null")}catch{}
  var sig=cartSignature();if(!saved||saved.sig!==sig){saved={sig:sig,request_id:uuid(),claim_token:token()};try{sessionStorage.setItem(REQUEST_KEY,JSON.stringify(saved))}catch{}}
  return saved
}
function saveClaim(ref,claim){
  if(!claim)return;var claims=read(CLAIMS_KEY,[])||[];if(!claims.some(function(x){return x.reference===ref}))claims.push({reference:ref,claim_token:claim,created_at:new Date().toISOString()});write(CLAIMS_KEY,claims.slice(-20))
}
function clearFieldError(id){
  var el=$(id);if(!el)return;el.removeAttribute("aria-invalid");
  var errorId=id+"Error",err=document.getElementById(errorId);if(err)err.remove();
  var described=String(el.getAttribute("aria-describedby")||"").split(/\s+/).filter(function(x){return x&&x!==errorId});
  if(described.length)el.setAttribute("aria-describedby",described.join(" "));else el.removeAttribute("aria-describedby")
}
function fieldError(id,message){
  var el=$(id);if(!el)return;clearFieldError(id);el.setAttribute("aria-invalid","true");
  var err=document.createElement("small");err.id=id+"Error";err.className="checkout-field-error";err.textContent=message;
  var label=el.closest("label");(label||el.parentElement).appendChild(err);
  var described=String(el.getAttribute("aria-describedby")||"").split(/\s+/).filter(Boolean);if(!described.includes(err.id))described.push(err.id);el.setAttribute("aria-describedby",described.join(" "))
}
function validateCheckout(){
  ["checkoutName","checkoutPhone","checkoutEmail","checkoutRecipientName","checkoutArea","checkoutStreet","checkoutBuilding","checkoutTerms"].forEach(clearFieldError);
  var first="",name=$("checkoutName").value.trim(),phone=$("checkoutPhone").value.trim(),digits=phone.replace(/\D/g,""),email=$("checkoutEmail").value.trim();
  function fail(id,msg){fieldError(id,msg);if(!first)first=id}
  if(name.length<2)fail("checkoutName",t("Enter your full name.","أدخل الاسم الكامل.","Saisissez votre nom complet."));
  if(digits.length<7||digits.length>15)fail("checkoutPhone",t("Enter a valid phone / WhatsApp number.","أدخل رقم هاتف / واتساب صحيحاً.","Saisissez un numéro de téléphone / WhatsApp valide."));
  if(email&&!$("checkoutEmail").checkValidity())fail("checkoutEmail",t("Enter a valid email address or leave this field empty.","أدخل بريداً إلكترونياً صحيحاً أو اترك الحقل فارغاً.","Saisissez une adresse e-mail valide ou laissez ce champ vide."));
  if(state.kind==="gift"&&$("checkoutRecipientName").value.trim().length<2)fail("checkoutRecipientName",t("Enter the recipient’s name.","أدخل اسم المستلم.","Saisissez le nom du destinataire."));
  if(!readArea())fail("checkoutArea",t("Enter your delivery area.","أدخل منطقة التوصيل.","Saisissez votre zone de livraison."));
  if(!$("checkoutStreet").value.trim())fail("checkoutStreet",t("Enter the street or neighborhood.","أدخل الشارع أو الحي.","Saisissez la rue ou le quartier."));
  if(!$("checkoutBuilding").value.trim())fail("checkoutBuilding",t("Enter the building or residence.","أدخل المبنى أو السكن.","Saisissez l’immeuble ou la résidence."));
  if(!$("checkoutTerms").checked)fail("checkoutTerms",t("Accept the Terms and Privacy Policy to place the order.","وافق على الشروط وسياسة الخصوصية لإرسال الطلب.","Acceptez les Conditions et la Politique de confidentialité pour commander."));
  if(first){$(first).focus();return false}return true
}
function friendlyError(err){
  var msg=String(err&&err.message||err||"");if(err&&err.retryable)return msg;
  var low=msg.toLowerCase(),known=[
    ["accept the terms",t("Please accept the Terms of Service and Privacy Policy.","يرجى الموافقة على الشروط وسياسة الخصوصية.","Veuillez accepter les Conditions d’utilisation et la Politique de confidentialité.")],
    ["full name",t("Please enter your full name.","يرجى إدخال الاسم الكامل.","Veuillez saisir votre nom complet.")],
    ["valid phone",t("Please enter a valid phone number.","يرجى إدخال رقم هاتف صحيح.","Veuillez saisir un numéro de téléphone valide.")],
    ["delivery area",t("Please enter your delivery area.","يرجى إدخال منطقة التوصيل.","Veuillez saisir votre zone de livraison.")],
    ["street or neighborhood",t("Please enter your street or neighborhood.","يرجى إدخال الشارع أو الحي.","Veuillez saisir votre rue ou quartier.")],
    ["building or residence",t("Please enter your building or residence.","يرجى إدخال المبنى أو السكن.","Veuillez saisir votre immeuble ou résidence.")],
    ["no longer available",t("One item is no longer available. Review your cart.","أحد المنتجات لم يعد متوفراً. راجع السلة.","Un article n’est plus disponible. Vérifiez votre panier.")],
    ["prices changed",t("A product price changed. Review your cart before ordering.","تغيّر سعر أحد المنتجات. راجع السلة قبل الطلب.","Le prix d’un produit a changé. Vérifiez votre panier avant de commander.")],
    ["minimum order",t("Your basket has not reached the minimum order amount.","لم تصل السلة إلى الحد الأدنى للطلب.","Votre panier n’atteint pas le minimum de commande.")],
    ["reward unavailable",t("The selected reward is no longer available for this basket.","المكافأة لم تعد متاحة لهذه السلة.","La récompense sélectionnée n’est plus disponible pour ce panier.")],
    ["unavailable in this area",t("Delivery is not currently available for this area.","التوصيل غير متاح حالياً في هذه المنطقة.","La livraison n’est pas disponible pour cette zone.")]
  ];
  for(var i=0;i<known.length;i++)if(low.includes(known[i][0]))return known[i][1];
  console.warn("Checkout submission error",err);
  return t("We couldn’t place the order right now. Your cart and details are still here — please try again.","تعذّر إرسال الطلب حالياً. سلتك وبياناتك ما زالت محفوظة — حاول مجدداً.","Impossible de passer la commande pour le moment. Votre panier et vos informations sont conservés — réessayez.")
}
async function maybeSaveAddress(){
  if(!state.dashboard||!$("saveAddress").checked)return;
  var d=addressPayload();await rpc("mouneh_addresses",{action:"upsert",p:{label:t("Home","المنزل","Maison"),area:d.area,street:d.street,building:d.building,floor_apartment:d.floor_apartment,landmark:d.landmark,delivery_notes:d.instructions,is_default:state.addresses.length===0}})
}
async function submit(e){
  e.preventDefault();if(state.busy)return;await ensureAreaDirectory();var form=$("nativeCheckoutForm");if(!validateCheckout())return;
  var d=addressPayload(),zones=activeZones();if(!d.area){$("checkoutStatus").textContent=t("Please select or enter a delivery area.","اختر أو اكتب منطقة التوصيل.","Sélectionnez ou saisissez une zone de livraison.");$("checkoutArea").focus();return}if(zones.length&&!selectedZone()){$("checkoutStatus").textContent=t("Delivery is not currently available for this area. Choose another area or contact us.","التوصيل غير متاح حالياً لهذه المنطقة. اختر منطقة أخرى أو تواصل معنا.","La livraison n’est pas disponible pour cette zone. Choisissez une autre zone ou contactez-nous.");return}
  var q=quote();if(!q.available){$("checkoutStatus").textContent=t("Delivery is temporarily paused. Contact us for help.","التوصيل متوقف مؤقتاً. تواصل معنا للمساعدة.","La livraison est temporairement suspendue. Contactez-nous si besoin.");return}if(q.minimum>0&&q.eligible<q.minimum){$("checkoutStatus").textContent=t("Minimum order is ","الحد الأدنى للطلب هو ","Commande minimum : ")+money(q.minimum)+".";return}
  if(state.rows.some(function(r){return !r.available})){$("checkoutStatus").textContent=t("One item is no longer available. Return to your cart to review it.","هناك منتج غير متوفر. عد إلى السلة لمراجعته.","Un article n’est plus disponible. Revenez au panier pour le vérifier.");return}
  state.busy=true;renderSummary();var btn=$("placeOrderButton"),old=btn.textContent;btn.setAttribute("aria-busy","true");btn.textContent=t("Placing order…","جارٍ إرسال الطلب…","Envoi de la commande…");$("checkoutStatus").textContent="";
  try{
    try{await maybeSaveAddress()}catch{}
    var a=checkoutAttempt(),payload={kind:state.kind,checkout_version:1,request_id:a.request_id,claim_token:a.claim_token,customer_name:$("checkoutName").value.trim(),customer_phone:normalizePhone($("checkoutPhone").value),customer_email:$("checkoutEmail").value.trim(),area:d.area,delivery:d,notes:$("checkoutNotes").value.trim()||(state.kind==="gift"?(state.giftMeta.message||""):""),language:state.lang,payment_method:"cash_on_delivery",terms_accepted:$("checkoutTerms").checked,terms_version:state.config.terms_version||"2026-10-04-native-commerce-v1",wallet_id:state.walletId||undefined,items:state.rows.map(function(r){return {product_id:r.p.id,variant_id:r.v.id,qty:r.qty,unit_price:Number(r.v.price),subtotal:Number(r.v.price)*r.qty}}),extra:Object.assign({products_subtotal:subtotal(),whatsapp_status_opt_in:!!$("checkoutWhatsAppUpdates")?.checked},state.kind==="gift"?{source:"gift_builder",recipient:d.recipient_name,recipient_phone:d.recipient_phone,occasion:state.giftMeta.occasion||"",packing:state.giftMeta.packing||"",theme:state.giftMeta.theme||"",card_language:state.giftMeta.card_language||"",hide_prices:state.giftMeta.hide_prices!==false,gift_message:state.giftMeta.message||"",requested_delivery_date:state.giftMeta.requested_delivery_date||"",requested_delivery_note:state.giftMeta.requested_delivery_note||""}:{}),session_id:(window.ZWM_CMS&&window.ZWM_CMS.sessionId&&window.ZWM_CMS.sessionId())||""};
    var result;try{result=await rpc("zwm_checkout",{action:"submit",p:payload})}catch(err){if(err&&err.retryable)result=await rpc("zwm_checkout",{action:"submit",p:payload});else throw err}
    if(!result||!result.reference)throw new Error(t("Could not create the order.","تعذّر إنشاء الطلب.","Impossible de créer la commande."));
    if(result.claim_token)saveClaim(result.reference,result.claim_token);
    remove(state.kind==="gift"?GIFT_KEY:CART_KEY);remove(WALLET_KEY);try{sessionStorage.removeItem(REQUEST_KEY);sessionStorage.removeItem(GIFT_META_KEY);sessionStorage.removeItem(AREA_DRAFT_KEY)}catch{}
    location.replace("/order?ref="+encodeURIComponent(result.reference)+"&new=1")
  }catch(err){$("checkoutStatus").textContent=friendlyError(err);state.busy=false;btn.removeAttribute("aria-busy");renderSummary();btn.textContent=old}
}
async function init(){
  state.kind=new URL(location.href).searchParams.get("kind")==="gift"?"gift":"order";try{state.giftMeta=JSON.parse(sessionStorage.getItem(GIFT_META_KEY)||"{}")||{}}catch{state.giftMeta={}}
  state.lang=(function(){try{return window.ZWM_LOCALE?.get?.()||"en"}catch{return "en"}})();
  setLang(state.lang);
  state.cart=read(CART_KEY,{})||{};
  await Promise.all([loadOverrides(),rpc("zwm_checkout",{action:"config",p:{}}).then(function(x){state.config=x}),rpc("mouneh_api",{action:"public",p:{}}).then(function(x){state.publicRewards=x;}).catch(function(){state.publicRewards={config:{base_rate:1}}}),authUser().then(function(x){state.authUser=x})]);
  rebuildRows();
  if(!state.rows.length){
    $("nativeCheckoutForm").hidden=true;$("checkoutEmpty").hidden=false;
    if(state.cartIssues.length){
      var h=$("checkoutEmpty").querySelector("h2"),p=$("checkoutEmpty").querySelector("p"),a=$("checkoutEmpty").querySelector("a");
      if(h)h.textContent=t("Your cart needs review.","تحتاج سلتك إلى مراجعة.","Votre panier doit être vérifié.");
      if(p)p.textContent=t("One or more saved cart items are invalid or no longer available. Review the cart before checkout.","عنصر واحد أو أكثر في السلة غير صالح أو لم يعد متوفراً. راجع السلة قبل إتمام الطلب.","Un ou plusieurs articles enregistrés sont invalides ou ne sont plus disponibles. Vérifiez le panier avant le paiement.");
      if(a){a.href="/shop?open=cart";a.textContent=t("Review cart","مراجعة السلة","Vérifier le panier")}
    }
    return
  }
  if(session()){
    try{state.dashboard=await rpc("mouneh_api",{action:"dashboard",p:{}})}catch{}
    if(state.dashboard){try{state.addresses=await rpc("mouneh_addresses",{action:"list",p:{}})||[]}catch{}}
  }
  state.walletId=String(read(WALLET_KEY,"")||"");
  var remembered=readArea();if(remembered&&!$("checkoutArea").value)$("checkoutArea").value=remembered;
  renderAll();
  if(!state.catalogVerified){
    $("checkoutStatus").textContent=t("We couldn't verify the latest prices and availability. Retry before placing the order.","تعذّر التحقق من أحدث الأسعار والتوفر. أعد المحاولة قبل إرسال الطلب.","Impossible de vérifier les derniers prix et disponibilités. Réessayez avant de commander.");
    var retry=document.createElement("button");retry.type="button";retry.className="checkout-retry";retry.textContent=t("Retry","إعادة المحاولة","Réessayer");
    retry.addEventListener("click",async function(){retry.disabled=true;$("checkoutStatus").textContent=t("Checking…","جارٍ التحقق…","Vérification…");await loadOverrides();rebuildRows();renderAll();if(state.catalogVerified){retry.remove();$("checkoutStatus").textContent=""}else{retry.disabled=false;$("checkoutStatus").textContent=t("Verification is still unavailable. Check your connection and try again.","ما زال التحقق غير متاح. تحقق من الاتصال وحاول مجدداً.","La vérification reste indisponible. Vérifiez votre connexion et réessayez.")}});
    $("checkoutStatus").insertAdjacentElement("afterend",retry)
  }
  window.ZWM_CMS&&window.ZWM_CMS.track&&window.ZWM_CMS.track("checkout_started",{items:state.rows.length,signed_in:!!state.dashboard});
  document.querySelectorAll("[data-commerce-lang]").forEach(function(b){b.addEventListener("click",function(){setLang(b.dataset.commerceLang)})});
  $("nativeCheckoutForm").addEventListener("submit",submit);
  $("savedAddressSelect").addEventListener("change",function(){var a=state.addresses.find(function(x){return x.id===$("savedAddressSelect").value});fillAddress(a)});
  $("clearSavedAddress").addEventListener("click",function(){$("savedAddressSelect").value="";state.areaRecord=null;rememberArea("");["checkoutArea","checkoutStreet","checkoutBuilding","checkoutFloor","checkoutLandmark","checkoutInstructions"].forEach(function(id){$(id).value=""});renderAreaMeta();renderSummary()});
  var areaInput=$("checkoutArea"),areaBox=$("areaSuggestions");
  areaInput.addEventListener("input",function(){
    state.areaRecord=null;rememberArea(areaInput.value);renderAreaMeta();renderSummary();$("checkoutStatus").textContent="";
    if(areaInput.value.trim())ensureAreaDirectory().then(function(){renderAreaSuggestions(false)});
    else closeAreaSuggestions()
  });
  areaInput.addEventListener("change",function(){rememberArea(areaInput.value);renderAreaMeta();renderSummary();$("checkoutStatus").textContent=""});
  areaInput.addEventListener("blur",function(){rememberArea(areaInput.value)});
  areaInput.addEventListener("focus",function(){ensureAreaDirectory().then(function(){renderAreaSuggestions(true)})});
  areaInput.addEventListener("keydown",function(e){if(e.key==="Escape")closeAreaSuggestions()});
  if("requestIdleCallback" in window)requestIdleCallback(function(){ensureAreaDirectory()},{timeout:2500});
  else setTimeout(function(){ensureAreaDirectory()},1200);
  areaBox.addEventListener("click",function(e){var b=e.target.closest("[data-area-id]");if(b)chooseArea(b.dataset.areaId)});
  document.addEventListener("click",function(e){if(!e.target.closest(".checkout-area-field"))closeAreaSuggestions()});
  ["checkoutName","checkoutPhone","checkoutEmail","checkoutRecipientName","checkoutArea","checkoutStreet","checkoutBuilding","checkoutTerms"].forEach(function(id){var el=$(id);if(el)el.addEventListener("input",function(){clearFieldError(id);$("checkoutStatus").textContent=""})});
  ["checkoutStreet","checkoutBuilding"].forEach(function(id){var el=$(id);if(el)el.addEventListener("input",function(){renderSummary()})});
}
function showCheckoutLoadError(err){
  var form=$("nativeCheckoutForm"),empty=$("checkoutEmpty");
  if(form)form.hidden=true;
  if(empty){
    empty.hidden=false;
    var h=empty.querySelector("h2"),p=empty.querySelector("p"),a=empty.querySelector("a");
    if(h)h.textContent=t("Checkout couldn't load.","تعذّر تحميل إتمام الطلب.","Impossible de charger le paiement.");
    if(p)p.textContent=t("No order was created. Check your connection and try again.","لم يتم إنشاء أي طلب. تحقق من الاتصال ثم حاول مجدداً.","Aucune commande n’a été créée. Vérifiez votre connexion et réessayez.");
    if(a){a.href=location.pathname+location.search;a.textContent=t("Retry checkout","إعادة المحاولة","Réessayer le paiement")}
  }
  console.error("Checkout initialization failed",err)
}
function start(){init().catch(showCheckoutLoadError)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start()
})();
