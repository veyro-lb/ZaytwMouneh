
(function(){
"use strict";
var AUTH_KEY="zwm:mouneh:session:v1",CLAIMS_KEY="zwm:mouneh:claims:v1",CART_KEY="zwm-cart-v5",LANG_KEY="zwm-lang-v2";
var state={lang:"en",order:null,ref:"",claim:"",products:[]};
var $=function(id){return document.getElementById(id)},money=function(v){return "$"+(Number(v)||0).toFixed(2)},esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
function read(k,f){try{var v=localStorage.getItem(k);return v==null?f:JSON.parse(v)}catch{return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function session(){return read(AUTH_KEY,null)}
function config(){return window.ZWM_CMS_CONFIG||{}}
async function rpc(action,p){
  var c=config(),s=session(),headers={"apikey":c.supabasePublishableKey,"Content-Type":"application/json","Prefer":"return=representation"};if(s&&s.access_token)headers.Authorization="Bearer "+s.access_token;
  var r=await fetch(String(c.supabaseUrl||"").replace(/\/$/,"")+"/rest/v1/rpc/zwm_checkout",{method:"POST",headers:headers,body:JSON.stringify({action:action,p:p||{}})});var data=await r.json().catch(function(){return {}});if(!r.ok)throw new Error(data.message||"Order unavailable");return data
}
async function loadOverrides(){
  var base=[];try{base=typeof PRODUCTS_DATA!=="undefined"?JSON.parse(JSON.stringify(PRODUCTS_DATA)):[]}catch{}
  var map=new Map(base.map(function(p){return [p.id,p]})),c=config();
  try{var r=await fetch(String(c.supabaseUrl).replace(/\/$/,"")+"/rest/v1/product_overrides?select=product_id,action,payload",{headers:{"apikey":c.supabasePublishableKey}});if(r.ok){(await r.json()).forEach(function(o){var p=map.get(o.product_id)||{id:o.product_id};if(o.action==="hide")p.__hidden=true;else if(o.payload)p=Object.assign({},p,o.payload);map.set(o.product_id,p)})}}catch{}
  state.products=Array.from(map.values())
}
function product(id){return state.products.find(function(p){return p.id===id})}
function variant(p,id){return p&&Array.isArray(p.variants)?p.variants.find(function(v){return v.id===id}):null}
function available(p){return p&&!p.__hidden&&!["hidden","draft"].includes(p.status)&&String(p.availability||"in_stock")==="in_stock"}
function label(status){
  var en={new:"Order received",confirmed:"Confirmed",preparing:"Preparing",out_for_delivery:"Out for delivery",delivered:"Delivered",cancelled:"Cancelled"};
  var ar={new:"تم استلام الطلب",confirmed:"تم التأكيد",preparing:"قيد التحضير",out_for_delivery:"خرج للتوصيل",delivered:"تم التسليم",cancelled:"ملغي"};return (state.lang==="ar"?ar:en)[status]||status
}
function setLang(next){state.lang=next==="ar"?"ar":"en";try{localStorage.setItem(LANG_KEY,state.lang)}catch{}document.documentElement.lang=state.lang;document.documentElement.dir=state.lang==="ar"?"rtl":"ltr";document.querySelectorAll("[data-commerce-lang]").forEach(function(b){b.classList.toggle("is-active",b.dataset.commerceLang===state.lang)});if(state.order)render()}
function claimFor(ref){var claims=read(CLAIMS_KEY,[])||[],x=claims.find(function(i){return i.reference===ref});return x&&x.claim_token||""}
function renderTimeline(o){
  var statuses=["new","confirmed","preparing","out_for_delivery","delivered"],current=statuses.indexOf(o.status),cancel=o.status==="cancelled";
  $("orderTimeline").innerHTML=statuses.map(function(s,i){var cls=cancel?(i===0?"is-done":""):(i<current?"is-done":i===current?"is-current":"");return '<div class="order-stage '+cls+'"><i></i><span>'+esc(label(s))+'</span></div>'}).join("");
  if(cancel)$("orderTimeline").insertAdjacentHTML("beforeend",'<div class="order-stage is-current"><i></i><span>'+esc(label("cancelled"))+'</span></div>')
}
function render(){
  var o=state.order,ar=state.lang==="ar",items=Array.isArray(o.items)?o.items:[],addr=o.delivery_address||{};
  $("orderEyebrow").textContent=ar?"طلبك":"Your order";
  $("orderHeading").textContent=new URL(location.href).searchParams.get("new")==="1"?(ar?"شكراً — تم استلام طلبك 🌿":"Thank you — your order is in 🌿"):(ar?"تفاصيل الطلب":"Order details");
  $("orderIntro").textContent=ar?"تتحدث هذه الصفحة تلقائياً مع تقدّم الطلب.":"This page updates automatically as your order moves forward.";
  $("orderNumber").textContent=o.reference;$("statusTitle").textContent=label(o.status);$("statusLabel").textContent=ar?"الحالة الحالية":"Current status";
  $("statusUpdated").textContent=ar?"آخر تحديث "+new Date(o.updated_at||o.submitted_at).toLocaleString("ar-LB"):"Updated "+new Date(o.updated_at||o.submitted_at).toLocaleString("en-LB");
  renderTimeline(o);
  $("itemsTitle").textContent=ar?"الطلب":"Order";$("itemsMeta").textContent=items.reduce(function(n,i){return n+(Number(i.qty)||1)},0)+" "+(ar?"قطعة":"items");
  $("orderItems").innerHTML=items.map(function(i){return '<div class="order-detail-item"><div><strong>'+esc(ar?(i.name_ar||i.name):(i.name||i.name_en||i.product_id))+'</strong><small>'+esc(i.size||i.variant_name||"")+" · "+(ar?"الكمية ":"Qty ")+(Number(i.qty)||1)+'</small></div><strong>'+money(i.subtotal!=null?i.subtotal:(Number(i.unit_price)||0)*(Number(i.qty)||1))+'</strong></div>'}).join("");
  $("deliveryTitle").textContent=ar?"التوصيل":"Delivery";$("deliveryArea").textContent=addr.area||o.area||"";
  var gift=o.kind==="gift",extra=o.extra||{};
  $("deliveryAddress").innerHTML=(gift&&extra.recipient?'<p class="checkout-help"><strong>'+esc((ar?"المستلم: ":"Recipient: ")+extra.recipient)+'</strong>'+(extra.recipient_phone?' · '+esc(extra.recipient_phone):'')+'</p>':'')+'<strong>'+esc([addr.street,addr.building,addr.floor_apartment].filter(Boolean).join(" · "))+'</strong>'+(addr.landmark?'<p class="checkout-help">'+esc((ar?"معلم قريب: ":"Landmark: ")+addr.landmark)+'</p>':'')+(addr.instructions?'<p class="checkout-help">'+esc((ar?"تعليمات: ":"Instructions: ")+addr.instructions)+'</p>':'');
  $("orderNote").textContent=o.notes?(ar?"ملاحظة الطلب: ":"Order note: ")+o.notes:"";
  $("paymentTitle").textContent=ar?"الدفع والمجموع":"Payment & total";$("payMethodLabel").textContent=ar?"الدفع":"Payment";$("payMethod").textContent=ar?"الدفع عند الاستلام":"Cash on Delivery";
  $("subLabel").textContent=ar?"المجموع الفرعي":"Subtotal";$("rewardLabel").textContent=ar?"المكافأة":"Reward";$("delLabel").textContent=ar?"التوصيل":"Delivery";$("totalLabel").textContent=ar?"المجموع":"Total";
  $("orderSubtotal").textContent=money(o.subtotal!=null?o.subtotal:Number(o.total)-Number(o.delivery_fee||0)+Number(o.reward_discount||0));$("orderReward").textContent="-"+money(o.reward_discount||0);$("orderRewardRow").hidden=Number(o.reward_discount||0)<=0;$("orderDeliveryFee").textContent=Number(o.delivery_fee||0)===0?(ar?"مجاني":"Free"):money(o.delivery_fee);$("orderTotal").textContent=money(o.total);
  $("rewardsTitle").textContent=ar?"نقاط المونة":"Mouneh Points";$("rewardsCopy").textContent=o.status==="delivered"?(ar?"تم تثبيت نقاط هذا الطلب.":"Points from this order are finalized."):(o.status==="cancelled"?(ar?"الطلب الملغي لا يكسب نقاطاً.":"Cancelled orders do not earn points."):(ar?"تبقى النقاط معلّقة حتى التسليم.":"Points stay pending until delivery."));
  $("orderPoints").textContent=o.status==="delivered"?("+"+Number(o.points_awarded||0)+" 🌿"):(o.status==="cancelled"?"0 🌿":(ar?"نقاط معلّقة 🌿":"Points pending 🌿"));
  $("actionsTitle").textContent=ar?"ماذا بعد؟":"What next?";$("actionsCopy").textContent=ar?"تابع التسوق أو راقب الطلب هنا أو تواصل معنا عند الحاجة.":"Keep shopping, track the order here, or contact us if you need help.";
  $("viewOrders").textContent=ar?"عرض طلباتي":"View my orders";$("continueShopping").textContent=ar?"متابعة التسوق":"Continue shopping";$("cancelOrderButton").textContent=ar?"إلغاء الطلب":"Cancel order";$("reorderButton").textContent=ar?"اطلبه مرة أخرى":"Order again";
  $("cancelOrderButton").hidden=!o.can_cancel;$("reorderButton").hidden=o.status!=="delivered";
  var phone=String(o.support_phone||"96181581230").replace(/\D/g,""),msg=ar?"مرحباً، أحتاج مساعدة بخصوص الطلب "+o.reference+".":"Hi, I need help with order "+o.reference+".";
  $("orderSupport").href="https://wa.me/"+phone+"?text="+encodeURIComponent(msg);$("orderSupport").textContent=ar?"تحتاج مساعدة؟ واتساب":"Need help? WhatsApp us";
  $("orderLoading").hidden=true;$("orderError").hidden=true;$("orderContent").hidden=false
}
async function refresh(){
  try{state.order=await rpc("detail",{reference:state.ref,claim_token:state.claim});render()}catch{$("orderLoading").hidden=true;$("orderContent").hidden=true;$("orderError").hidden=false}
}
async function cancel(){
  if(!confirm(state.lang==="ar"?"هل تريد إلغاء هذا الطلب؟":"Cancel this order?"))return;$("cancelOrderButton").disabled=true;$("orderActionStatus").textContent=state.lang==="ar"?"جارٍ الإلغاء…":"Cancelling…";
  try{state.order=await rpc("cancel",{reference:state.ref,claim_token:state.claim,reason:"Customer requested"});$("orderActionStatus").textContent=state.lang==="ar"?"تم إلغاء الطلب.":"Order cancelled.";render()}catch(e){$("orderActionStatus").textContent=e.message}finally{$("cancelOrderButton").disabled=false}
}
async function reorder(){
  await loadOverrides();var o=state.order,items=Array.isArray(o.items)?o.items:[],cart=read(CART_KEY,{})||{},added=0,missing=0;
  items.forEach(function(i){var p=product(i.product_id),v=variant(p,i.variant_id);if(!p||!v||!available(p)){missing++;return}var key=p.id+"::"+v.id;cart[key]={productId:p.id,variantId:v.id,qty:Math.max(1,Number(i.qty)||1)};added++});
  write(CART_KEY,cart);$("orderActionStatus").textContent=(state.lang==="ar"?(added+" منتج أضيف إلى السلة"+(missing?" · "+missing+" لم يعد متوفراً":"")):(added+" item"+(added===1?"":"s")+" added to cart"+(missing?" · "+missing+" no longer available":"")))+".";if(added)setTimeout(function(){location.href="/shop.html?open=cart"},650)
}
async function init(){
  var u=new URL(location.href);state.ref=u.searchParams.get("ref")||"";state.claim=claimFor(state.ref);state.lang=(function(){try{return localStorage.getItem(LANG_KEY)==="ar"?"ar":"en"}catch{return "en"}})();
  document.querySelectorAll("[data-commerce-lang]").forEach(function(b){b.addEventListener("click",function(){setLang(b.dataset.commerceLang)})});setLang(state.lang);
  if(!state.ref){$("orderLoading").hidden=true;$("orderError").hidden=false;return}
  await refresh();$("cancelOrderButton").addEventListener("click",cancel);$("reorderButton").addEventListener("click",reorder);
  setInterval(function(){if(!document.hidden)refresh()},15000);window.addEventListener("focus",refresh)
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init()
})();
