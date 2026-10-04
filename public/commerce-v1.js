
(function(){
"use strict";
var VERSION="20261004-nativecheckout1";
var CONFIG="/admin-config.js?v="+VERSION;
var AUTH_KEY="zwm:mouneh:session:v1";
var lang=function(){try{return localStorage.getItem("zwm-lang-v2")==="ar"?"ar":"en"}catch{return document.documentElement.lang==="ar"?"ar":"en"}};
var tr=function(en,ar){return lang()==="ar"?ar:en};
var esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var scheduled=false,addressMode=(location.hash||"")==="#addresses",addressRows=[],editingAddress="";
function cfg(){return window.ZWM_CMS_CONFIG||{}}
function session(){try{return JSON.parse(localStorage.getItem(AUTH_KEY)||"null")}catch{return null}}
async function ensureConfig(){if(window.ZWM_CMS_CONFIG)return;await new Promise(function(resolve){var s=document.createElement("script");s.src=CONFIG;s.onload=resolve;s.onerror=resolve;document.head.appendChild(s)})}
async function rpc(name,body){
  await ensureConfig();var c=cfg(),s=session(),headers={"apikey":c.supabasePublishableKey,"Content-Type":"application/json","Prefer":"return=representation"};
  if(s&&s.access_token)headers.Authorization="Bearer "+s.access_token;
  var r=await fetch(String(c.supabaseUrl||"").replace(/\/$/,"")+"/rest/v1/rpc/"+name,{method:"POST",headers:headers,body:JSON.stringify(body||{})});
  var data=await r.json().catch(function(){return {}});
  if(!r.ok)throw new Error(data.message||data.hint||data.details||tr("Request failed.","تعذّر تنفيذ الطلب."));
  return data
}
function injectStyle(){
  if(document.querySelector('link[href*="commerce-v1.css"]'))return;
  var l=document.createElement("link");l.rel="stylesheet";l.href="/commerce-v1.css?v="+VERSION;document.head.appendChild(l)
}
// DOM observers must settle; do not replace unchanged text on every frame.
var markupCache=new WeakMap();
function setText(el,text){if(el.textContent!==text)el.textContent=text}
function setMarkup(el,html){
  var cached=markupCache.get(el);
  if(cached&&cached.html===html&&cached.text===el.textContent)return;
  el.innerHTML=html;
  markupCache.set(el,{html:html,text:el.textContent});
}
function updateOrderCopy(){
  var announcement=document.getElementById("announcementOrder");
  if(announcement){setText(announcement,tr("Shop online","تسوّق أونلاين"));announcement.href="/shop.html#shop";announcement.removeAttribute("target")}
  var title=document.getElementById("orderTitle"),intro=document.getElementById("orderIntroCopy"),s3=document.getElementById("step3Title"),s3c=document.getElementById("step3Copy");
  if(title)setMarkup(title,tr("From shelf to<br><em>your door.</em>","من الرف إلى<br><em>باب بيتك.</em>"));
  if(intro)setText(intro,tr("Build your pantry, review everything, then place the order directly on the website.","حضّر سلتك وراجعها ثم أرسل الطلب مباشرة عبر الموقع."));
  if(s3)setText(s3,tr("Checkout","الدفع والطلب"));
  if(s3c)setText(s3c,tr("Enter delivery details, review the final total and place your order securely.","أدخل تفاصيل التوصيل وراجع المجموع النهائي ثم أرسل طلبك بأمان."));
  document.querySelectorAll(".footer-delivery").forEach(function(el){setMarkup(el,'<span class="only-en">Website checkout · WhatsApp support available</span><span class="only-ar" lang="ar">طلب مباشر عبر الموقع · واتساب متاح للمساعدة</span>')})
}
function updateGift(){
  var form=document.getElementById("giftForm"),btn=document.getElementById("giftSend"),note=document.getElementById("giftNote");if(!form)return;
  if(btn)setMarkup(btn,'<span class="only-en">Continue to secure checkout</span><span class="only-ar" lang="ar">المتابعة لإتمام الطلب بأمان</span><b>→</b>');
  if(note)setText(note,tr("Gift details, delivery and the final total are confirmed in website checkout. WhatsApp is available only if you need help.","يتم تأكيد تفاصيل الهدية والتوصيل والمجموع النهائي عبر إتمام الطلب في الموقع. واتساب متاح للمساعدة فقط."));
}
function updateCart(){
  var form=document.getElementById("orderForm");if(!form)return;
  form.classList.add("native-cart-form");
  var heading=document.getElementById("orderDetailsTitle"),note=document.getElementById("orderDetailsNote"),btn=document.getElementById("sendOrderButton"),price=document.getElementById("priceNote");
  if(heading)setText(heading,tr("Ready for checkout","جاهز لإتمام الطلب"));
  if(note)setText(note,tr("Delivery, rewards and final total are confirmed at checkout.","يتم تأكيد التوصيل والمكافآت والمجموع النهائي عند إتمام الطلب."));
  if(btn){setMarkup(btn,tr("Checkout <span>→</span>","إتمام الطلب <span>←</span>"));btn.setAttribute("aria-label",tr("Go to checkout","الانتقال لإتمام الطلب"))}
  if(price)setText(price,tr("Final prices and availability are rechecked securely before your order is created.","يتم التحقق من الأسعار والتوفر بأمان قبل إنشاء الطلب."));
}
function decorateOrders(){
  if(document.body.dataset.page!=="account")return;
  document.querySelectorAll('[data-account-panel="orders"] .account-row').forEach(function(row){
    if(row.dataset.nativeOrder==="1")return;
    var strong=row.querySelector("strong"),ref=strong&&String(strong.textContent||"").trim();
    if(!ref||ref.indexOf("ZW")!==0)return;
    row.dataset.nativeOrder="1";row.classList.add("account-order-row-native");
    var a=document.createElement("a");a.className="native-order-open";a.href="/order.html?ref="+encodeURIComponent(ref);a.textContent=tr("View details","عرض التفاصيل");row.appendChild(a)
  })
}
async function loadAddresses(){
  try{addressRows=await rpc("mouneh_addresses",{action:"list",p:{}})||[]}catch(e){addressRows=[]}
  renderAddressPanel()
}
function addressForm(row){
  row=row||{};
  return '<form id="nativeAddressForm" class="account-form native-address-grid">'+
    '<input type="hidden" name="id" value="'+esc(row.id||"")+'">'+
    '<label>'+tr("Label","التسمية")+'<input name="label" maxlength="40" required value="'+esc(row.label||"")+'" placeholder="'+tr("Home","المنزل")+'"></label>'+
    '<label>'+tr("Area / City","المنطقة / المدينة")+'<input name="area" maxlength="180" required value="'+esc(row.area||"")+'"></label>'+
    '<label class="full">'+tr("Street / Neighborhood","الشارع / الحي")+'<input name="street" maxlength="250" required value="'+esc(row.street||row.address||"")+'"></label>'+
    '<label>'+tr("Building / Residence","المبنى / السكن")+'<input name="building" maxlength="160" value="'+esc(row.building||"")+'"></label>'+
    '<label>'+tr("Floor / Apartment","الطابق / الشقة")+'<input name="floor_apartment" maxlength="120" value="'+esc(row.floor_apartment||"")+'"></label>'+
    '<label class="full">'+tr("Nearby landmark","معلم قريب")+'<input name="landmark" maxlength="220" value="'+esc(row.landmark||"")+'"></label>'+
    '<label class="full">'+tr("Delivery instructions","تعليمات التوصيل")+'<input name="delivery_notes" maxlength="500" value="'+esc(row.delivery_notes||"")+'"></label>'+
    '<label class="full"><span><input name="is_default" type="checkbox" '+(row.is_default?"checked":"")+'> '+tr("Use as my default address","استخدمه كعنوان افتراضي")+'</span></label>'+
    '<div class="full account-actions"><button class="account-primary" type="submit">'+tr(row.id?"Save address":"Add address",row.id?"حفظ العنوان":"إضافة العنوان")+'</button>'+(row.id?'<button type="button" data-address-cancel>'+tr("Cancel","إلغاء")+'</button>':'')+'</div>'+
    '<p class="account-status full" id="nativeAddressStatus"></p></form>'
}
function renderAddressPanel(){
  if(!addressMode)return;
  var content=document.querySelector(".account-content");if(!content)return;
  var panel=document.getElementById("nativeAddressesPanel");
  if(!panel){panel=document.createElement("section");panel.id="nativeAddressesPanel";panel.className="account-panel account-native-addresses";content.appendChild(panel)}
  var stamp=JSON.stringify([lang(),editingAddress,addressRows]);
  if(panel.dataset.renderStamp===stamp)return;
  panel.dataset.renderStamp=stamp;
  var edit=addressRows.find(function(x){return x.id===editingAddress});
  panel.innerHTML='<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Saved addresses","العناوين المحفوظة")+'</h2><p>'+tr("Save the Lebanon-style delivery details you use most often. Old orders keep their original address snapshot.","احفظ تفاصيل التوصيل التي تستخدمها عادة. تبقى الطلبات القديمة محتفظة بعنوانها الأصلي.")+'</p></div></div>'+addressForm(edit)+'</article>'+
    '<article class="account-card"><div class="account-section-title"><div><h2>'+tr("Your addresses","عناوينك")+'</h2></div></div><div class="account-list">'+
    (addressRows.length?addressRows.map(function(a){return '<div class="native-address-card '+(a.is_default?"is-default":"")+'"><div class="native-address-card-head"><div><strong>'+esc(a.label||tr("Address","عنوان"))+'</strong><small>'+esc([a.area,a.street||a.address,a.building,a.floor_apartment].filter(Boolean).join(" · "))+'</small></div>'+(a.is_default?'<span class="account-pill">'+tr("Default","افتراضي")+'</span>':'')+'</div>'+(a.landmark?'<small>'+tr("Landmark: ","معلم: ")+esc(a.landmark)+'</small>':'')+(a.delivery_notes?'<small>'+tr("Instructions: ","تعليمات: ")+esc(a.delivery_notes)+'</small>':'')+'<div class="native-address-actions"><button type="button" data-address-edit="'+esc(a.id)+'">'+tr("Edit","تعديل")+'</button>'+(!a.is_default?'<button type="button" data-address-default="'+esc(a.id)+'">'+tr("Make default","جعله افتراضياً")+'</button>':'')+'<button type="button" data-address-delete="'+esc(a.id)+'">'+tr("Delete","حذف")+'</button></div></div>'}).join(""):'<p>'+tr("No saved addresses yet.","لا توجد عناوين محفوظة بعد.")+'</p>')+
    '</div></article>'
}
function enhanceAddresses(){
  if(document.body.dataset.page!=="account"||!window.ZWM_REWARDS||!window.ZWM_REWARDS.getState().member)return;
  var tabs=document.querySelector(".account-tabs"),content=document.querySelector(".account-content");if(!tabs||!content)return;
  var button=tabs.querySelector("[data-native-address-tab]");
  if(!button){button=document.createElement("button");button.type="button";button.dataset.nativeAddressTab="1";button.innerHTML='<span class="account-tab-icon">⌖</span><span>'+tr("Addresses","العناوين")+'</span>';tabs.insertBefore(button,tabs.querySelector('[data-account-tab="referrals"]')||null)}
  button.classList.toggle("is-active",addressMode);button.setAttribute("aria-selected",String(addressMode));
  if(addressMode){
    tabs.querySelectorAll("[data-account-tab]").forEach(function(b){b.classList.remove("is-active");b.setAttribute("aria-selected","false")});
    content.querySelectorAll("[data-account-panel]").forEach(function(p){p.hidden=true});
    renderAddressPanel()
  }
}
function enhance(){
  scheduled=false;injectStyle();updateOrderCopy();updateGift();updateCart();decorateOrders();enhanceAddresses()
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhance)}
document.addEventListener("submit",function(e){
  if(e.target&&e.target.id==="orderForm"){e.preventDefault();e.stopImmediatePropagation();window.ZWM_CMS&&window.ZWM_CMS.track&&window.ZWM_CMS.track("checkout_started",{source:"cart"});location.href="/checkout.html";return}
  if(e.target&&e.target.id==="giftForm"){
    e.preventDefault();e.stopImmediatePropagation();
    var selected={};try{selected=JSON.parse(localStorage.getItem("zwm-gift-items-v1")||"{}")||{}}catch{}
    if(!Object.keys(selected).length){return}
    var meta={
      recipient:(document.getElementById("giftRecipient")||{}).value||"",
      occasion:(document.getElementById("giftOccasion")||{}).selectedOptions?.[0]?.textContent||"",
      packing:(document.getElementById("giftPackaging")||{}).selectedOptions?.[0]?.textContent||"",
      area:(document.getElementById("giftArea")||{}).value||"",
      message:(document.getElementById("giftMessage")||{}).value||"",
      sender:(document.getElementById("giftSender")||{}).value||"",
      theme:(document.getElementById("giftTheme")||{}).value||"",
      card_language:(document.getElementById("giftCardLanguage")||{}).value||"",
      hide_prices:(document.getElementById("giftHidePrices")||{}).checked!==false
    };
    try{sessionStorage.setItem("zwm:native-gift:meta:v1",JSON.stringify(meta))}catch{}
    window.ZWM_CMS&&window.ZWM_CMS.track&&window.ZWM_CMS.track("checkout_started",{source:"gift_builder"});
    location.href="/checkout.html?kind=gift";
  }
},true);
document.addEventListener("click",async function(e){
  var cart=e.target.closest&&e.target.closest("#cartButton,[data-open-cart]");if(cart)window.ZWM_CMS&&window.ZWM_CMS.track&&window.ZWM_CMS.track("cart_opened",{source:"navigation"});
  var addrTab=e.target.closest&&e.target.closest("[data-native-address-tab]");if(addrTab){e.preventDefault();e.stopPropagation();addressMode=true;location.hash="addresses";enhanceAddresses();await loadAddresses();return}
  var nativeTab=e.target.closest&&e.target.closest("[data-account-tab]");if(nativeTab){addressMode=false;document.getElementById("nativeAddressesPanel")&&document.getElementById("nativeAddressesPanel").remove()}
  var cancel=e.target.closest&&e.target.closest("[data-address-cancel]");if(cancel){editingAddress="";renderAddressPanel();return}
  var edit=e.target.closest&&e.target.closest("[data-address-edit]");if(edit){editingAddress=edit.dataset.addressEdit;renderAddressPanel();return}
  var def=e.target.closest&&e.target.closest("[data-address-default]");if(def){def.disabled=true;try{addressRows=await rpc("mouneh_addresses",{action:"default",p:{id:def.dataset.addressDefault}})||addressRows;renderAddressPanel()}catch(err){alert(err.message)}return}
  var del=e.target.closest&&e.target.closest("[data-address-delete]");if(del){if(!confirm(tr("Delete this saved address?","حذف هذا العنوان المحفوظ؟")))return;del.disabled=true;try{addressRows=await rpc("mouneh_addresses",{action:"delete",p:{id:del.dataset.addressDelete}})||addressRows;editingAddress="";renderAddressPanel()}catch(err){alert(err.message)}return}
},true);
document.addEventListener("submit",async function(e){
  if(!e.target||e.target.id!=="nativeAddressForm")return;
  e.preventDefault();e.stopPropagation();var f=e.target,st=document.getElementById("nativeAddressStatus"),btn=f.querySelector('button[type="submit"]');btn.disabled=true;if(st)st.textContent=tr("Saving…","جارٍ الحفظ…");
  try{var d=new FormData(f);var p={id:d.get("id")||undefined,label:d.get("label"),area:d.get("area"),street:d.get("street"),building:d.get("building"),floor_apartment:d.get("floor_apartment"),landmark:d.get("landmark"),delivery_notes:d.get("delivery_notes"),is_default:d.get("is_default")==="on"};addressRows=await rpc("mouneh_addresses",{action:"upsert",p:p})||[];editingAddress="";renderAddressPanel()}
  catch(err){if(st)st.textContent=err.message}
  finally{if(btn&&btn.isConnected)btn.disabled=false}
},true);
window.addEventListener("hashchange",function(){addressMode=location.hash==="#addresses";schedule();if(addressMode)loadAddresses()});
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["lang","dir"]});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){schedule();if(addressMode)setTimeout(loadAddresses,800)},{once:true});else{schedule();if(addressMode)setTimeout(loadAddresses,800)}
})();
