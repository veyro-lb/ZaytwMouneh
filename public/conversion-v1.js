(function(){
"use strict";
var currentProduct="";
function q(s,r){return (r||document).querySelector(s)}
function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function locale(){try{if(window.ZWM_LOCALE&&window.ZWM_LOCALE.get)return window.ZWM_LOCALE.get();if(localStorage.getItem("zwm:french:v1")==="1")return "fr";return localStorage.getItem("zwm-lang-v2")==="ar"?"ar":"en"}catch(e){return "en"}}
function tr(en,ar,fr){var l=locale();return l==="ar"?ar:l==="fr"?fr:en}
function modalLink(){
 var modal=q("#productModal"),actions=modal&&q(".product-modal-actions",modal);if(!actions||!currentProduct)return;
 var a=q("[data-c6-full-product]",modal);
 if(!a){a=document.createElement("a");a.className="c6-button is-secondary c6-modal-link";a.dataset.c6FullProduct="1";actions.insertAdjacentElement("afterend",a)}
 a.href="/product/"+encodeURIComponent(currentProduct);
 a.textContent=tr("View full product page","عرض صفحة المنتج الكاملة","Voir la fiche produit");
}
function bindProductLinks(){
 document.addEventListener("click",function(e){
  var card=e.target.closest&&e.target.closest("[data-product]");
  if(card&&card.dataset.product){currentProduct=card.dataset.product;setTimeout(modalLink,0)}
  var related=e.target.closest&&e.target.closest("[data-related]");
  if(related&&related.dataset.related){currentProduct=related.dataset.related;setTimeout(modalLink,0)}
 });
 var modal=q("#productModal");if(modal)new MutationObserver(function(){if(modal.getAttribute("aria-hidden")==="false")modalLink()}).observe(modal,{attributes:true,attributeFilter:["aria-hidden"]});
}
function injectShopTrust(){
 if(document.body.dataset.page!=="shop"||q("#c6ShopTrust"))return;
 var anchor=q(".catalogue-intro-card")||q("#shop .shop-head");if(!anchor)return;
 var wrap=document.createElement("div");wrap.id="c6ShopTrust";wrap.className="c6-trust-strip";
 wrap.innerHTML=
  '<div class="c6-trust-card"><strong>'+esc(tr("Permanent product pages","صفحات دائمة للمنتجات","Fiches produit permanentes"))+'</strong><small>'+esc(tr("Open a dedicated page for current sizes, prices, verified reviews and supplied product facts.","افتح صفحة مخصصة للأحجام والأسعار الحالية والمراجعات الموثقة ومعلومات المنتج المتوفرة.","Ouvrez une fiche dédiée avec formats, prix, avis vérifiés et informations disponibles."))+'</small></div>'+
  '<div class="c6-trust-card"><strong>'+esc(tr("Cash on Delivery","الدفع عند الاستلام","Paiement à la livraison"))+'</strong><small>'+esc(tr("The current checkout is configured for payment when the order arrives.","الدفع الحالي في الموقع مضبوط عند استلام الطلب.","Le paiement actuel est configuré à la réception de la commande."))+'</small></div>'+
  '<div class="c6-trust-card"><strong>'+esc(tr("Delivery calculated from real settings","التوصيل من الإعدادات الفعلية","Livraison selon les réglages réels"))+'</strong><small>'+esc(tr("Fees and ETA appear only when configured for the entered area.","لا تظهر الرسوم والمدة إلا عندما تكون مضبوطة فعلياً للمنطقة.","Les frais et délais ne s’affichent que s’ils sont réellement configurés pour la zone."))+'</small></div>';
 anchor.insertAdjacentElement("afterend",wrap);
}
function tomorrow(){
 var d=new Date();d.setDate(d.getDate()+1);var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return y+"-"+m+"-"+day;
}
function injectGiftTools(){
 if(document.body.dataset.page!=="gift"||q("#c6GiftTools"))return;
 var form=q("#giftForm"),send=q("#giftSend",form);if(!form||!send)return;
 var box=document.createElement("section");box.id="c6GiftTools";box.className="c6-gift-tools";
 box.innerHTML=
  '<div class="c6-gift-tools-head"><div><h3>'+esc(tr("Schedule the gift","حدّد موعد الهدية","Planifier le cadeau"))+'</h3><p>'+esc(tr("Choose a requested delivery date. The final delivery time is confirmed after the order, so no delivery window is invented here.","اختر تاريخ التوصيل المطلوب. يتم تأكيد وقت التوصيل النهائي بعد الطلب، لذلك لا نعرض موعداً غير مؤكّد.","Choisissez une date de livraison souhaitée. L’heure finale est confirmée après la commande; aucun créneau n’est inventé."))+'</p></div></div>'+
  '<div class="c6-gift-grid"><label class="c6-field"><span>'+esc(tr("Requested delivery date","تاريخ التوصيل المطلوب","Date de livraison souhaitée"))+'</span><input id="c6GiftDeliveryDate" type="date" min="'+tomorrow()+'"></label><label class="c6-field"><span>'+esc(tr("Delivery timing note","ملاحظة حول وقت التوصيل","Note sur l’horaire"))+'</span><input id="c6GiftDeliveryNote" type="text" maxlength="180" placeholder="'+esc(tr("Optional — e.g. morning preferred","اختياري — مثلاً يفضّل صباحاً","Facultatif — ex. matin de préférence"))+'"></label></div>'+
  '<div class="c6-corporate"><div><strong>'+esc(tr("Corporate & bulk gifting","هدايا الشركات والكميات","Cadeaux d’entreprise et commandes en volume"))+'</strong><small>'+esc(tr("For teams, clients or events, start a structured WhatsApp inquiry with quantity, budget and target date.","للفِرق والعملاء والمناسبات، ابدأ طلباً منظماً عبر واتساب مع الكمية والميزانية والتاريخ.","Pour équipes, clients ou événements, lancez une demande structurée sur WhatsApp avec quantité, budget et date."))+'</small></div><button type="button" class="c6-button is-secondary" id="c6CorporateGift">'+esc(tr("Corporate inquiry","استفسار للشركات","Demande entreprise"))+'</button></div>';
 send.parentNode.insertBefore(box,send);
 q("#c6CorporateGift").addEventListener("click",openCorporate);
}
async function contactNumber(){
 try{
  if(window.ZWM_CMS_CONFIG&&window.ZWM_CMS_CONFIG.supabaseUrl){
   var c=window.ZWM_CMS_CONFIG,r=await fetch(String(c.supabaseUrl).replace(/\/$/,"")+"/rest/v1/site_settings?select=value&key=eq.contact",{headers:{"apikey":c.supabasePublishableKey}});
   if(r.ok){var rows=await r.json(),n=rows&&rows[0]&&rows[0].value&&rows[0].value.whatsapp;if(n)return String(n).replace(/\D/g,"")}
  }
 }catch(e){}
 return "96181581230";
}
async function openCorporate(){
 var count=prompt(tr("Approximate number of gifts","العدد التقريبي للهدايا","Nombre approximatif de cadeaux"),"");
 if(count===null)return;
 var budget=prompt(tr("Budget per gift or total budget","ميزانية الهدية أو الميزانية الإجمالية","Budget par cadeau ou budget total"),"");
 if(budget===null)return;
 var date=prompt(tr("Target delivery date (optional)","تاريخ التوصيل المستهدف (اختياري)","Date de livraison visée (facultatif)"),"");
 if(date===null)return;
 var number=await contactNumber();
 var text=tr(
  "Corporate gifting inquiry\nApprox. gift count: "+count+"\nBudget: "+budget+"\nTarget date: "+date+"\nPlease help me plan a bulk gift order.",
  "استفسار هدايا شركات\nالعدد التقريبي: "+count+"\nالميزانية: "+budget+"\nالتاريخ المستهدف: "+date+"\nأرغب بالمساعدة لتجهيز طلب هدايا بالكميات.",
  "Demande cadeaux d’entreprise\nNombre approximatif : "+count+"\nBudget : "+budget+"\nDate visée : "+date+"\nJe souhaite préparer une commande de cadeaux en volume."
 );
 window.open("https://wa.me/"+number+"?text="+encodeURIComponent(text),"_blank","noopener");
}
function rewardsState(){try{return window.ZWM_REWARDS&&window.ZWM_REWARDS.getState?window.ZWM_REWARDS.getState():{}}catch(e){return {}}}
function injectAccountReorder(){
 if(document.body.dataset.page!=="account")return;
 var panel=q('[data-account-panel="orders"]'),orders=(rewardsState().dashboard||{}).orders||[];if(!panel||!orders.length)return;
 var rows=qa(".account-row",panel);
 rows.forEach(function(row,index){
  var order=orders[index];if(!order||order.status!=="delivered"||!Array.isArray(order.items)||!order.items.length)return;
  if(q("[data-c6-reorder]",row))return;
  var b=document.createElement("button");b.type="button";b.className="c6-button is-secondary c6-reorder";b.dataset.c6Reorder=String(index);b.textContent=tr("Buy again","أعد الطلب","Acheter à nouveau");row.appendChild(b);
 });
}
function reorderAccountOrder(index){
 var orders=(rewardsState().dashboard||{}).orders||[],order=orders[Number(index)];if(!order||!Array.isArray(order.items))return;
 var cart={};try{cart=JSON.parse(localStorage.getItem("zwm-cart-v5")||"{}")||{}}catch(e){}
 var added=0;
 order.items.forEach(function(item){
  var pid=String(item.product_id||"").trim(),vid=String(item.variant_id||"").trim(),qty=Math.max(1,Number(item.qty)||1);if(!pid||!vid)return;
  var key=pid+"::"+vid,old=cart[key]&&Number(cart[key].qty)||0;cart[key]={productId:pid,variantId:vid,qty:Math.min(99,old+qty)};added++;
 });
 if(!added)return;
 try{localStorage.setItem("zwm-cart-v5",JSON.stringify(cart))}catch(e){}
 location.href="/shop.html?open=cart&source=buy-again";
}
function refreshFrench(){
 if(locale()==="fr"&&window.ZWM_APPLY_FRENCH)try{window.ZWM_APPLY_FRENCH(document)}catch(e){}
}
function init(){
 bindProductLinks();injectShopTrust();injectGiftTools();injectAccountReorder();refreshFrench();
 document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-c6-reorder]");if(b){e.preventDefault();reorderAccountOrder(b.dataset.c6Reorder)}});
 var observer=new MutationObserver(function(){injectShopTrust();injectGiftTools();injectAccountReorder();modalLink()});
 observer.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
