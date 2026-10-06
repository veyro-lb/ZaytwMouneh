(function(){
"use strict";

var AUTH_KEY="zwm:mouneh:session:v1",CLAIMS_KEY="zwm:mouneh:claims:v1",CART_KEY="zwm-cart-v5";
var state={lang:"en",order:null,ref:"",claim:"",products:[],lastStatus:"",refreshing:false,loaded:false};
var $=function(id){return document.getElementById(id)};
var money=function(v){var value="$"+(Number(v)||0).toFixed(2);return isArabic()?"\u2066"+value+"\u2069":value};
var esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};

function read(k,f){try{var v=localStorage.getItem(k);return v==null?f:JSON.parse(v)}catch{return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function session(){return read(AUTH_KEY,null)}
function config(){return window.ZWM_CMS_CONFIG||{}}
function activeLocale(){try{var code=window.ZWM_LOCALE&&window.ZWM_LOCALE.get?window.ZWM_LOCALE.get():localStorage.getItem("zwm-locale-v3");return code==="ar"||code==="fr"?code:"en"}catch{return"en"}}
function isArabic(){return state.lang==="ar"}
function frText(value){var text=String(value==null?"":value);try{return window.ZWM_LOCALE&&window.ZWM_LOCALE.translate?window.ZWM_LOCALE.translate(text,"fr"):window.ZWM_FR_TRANSLATE?window.ZWM_FR_TRANSLATE(text):text}catch{return text}}
function tx(en,ar,fr){if(state.lang==="ar")return ar;if(state.lang==="fr")return fr!=null?fr:frText(en);return en}

async function rpc(action,p){
  var c=config(),s=session(),headers={"apikey":c.supabasePublishableKey,"Content-Type":"application/json","Prefer":"return=representation"};
  if(s&&s.access_token)headers.Authorization="Bearer "+s.access_token;
  var r=await fetch(String(c.supabaseUrl||"").replace(/\/$/,"")+"/rest/v1/rpc/zwm_checkout",{
    method:"POST",
    headers:headers,
    body:JSON.stringify({action:action,p:p||{}})
  });
  var data=await r.json().catch(function(){return {}});
  if(!r.ok)throw new Error(data.message||data.hint||data.details||(tx("Order unavailable","تعذّر فتح الطلب.")));
  return data;
}

async function loadOverrides(){
  var base=[];
  try{base=typeof PRODUCTS_DATA!=="undefined"?JSON.parse(JSON.stringify(PRODUCTS_DATA)):[]}catch{}
  var map=new Map(base.map(function(p){return [p.id,p]})),c=config();
  try{
    var r=await fetch(String(c.supabaseUrl).replace(/\/$/,"")+"/rest/v1/product_overrides?select=product_id,action,payload",{headers:{"apikey":c.supabasePublishableKey}});
    if(r.ok){
      (await r.json()).forEach(function(o){
        var p=map.get(o.product_id)||{id:o.product_id};
        if(o.action==="hide")p.__hidden=true;
        else if(o.payload)p=Object.assign({},p,o.payload);
        map.set(o.product_id,p);
      });
    }
  }catch{}
  state.products=Array.from(map.values());
}

function product(id){return state.products.find(function(p){return p.id===id})}
function variant(p,id){return p&&Array.isArray(p.variants)?p.variants.find(function(v){return v.id===id}):null}
function available(p){return p&&!p.__hidden&&!["hidden","draft"].includes(p.status)&&String(p.availability||"in_stock")==="in_stock"}

function label(status){
  var en={new:"Order received",confirmed:"Confirmed",preparing:"Preparing",out_for_delivery:"Out for delivery",delivered:"Delivered",cancelled:"Cancelled"};
  var ar={new:"تم استلام الطلب",confirmed:"تم التأكيد",preparing:"قيد التحضير",out_for_delivery:"خرج للتوصيل",delivered:"تم التسليم",cancelled:"ملغى"};
  var fr={new:"Commande reçue",confirmed:"Confirmée",preparing:"En préparation",out_for_delivery:"En livraison",delivered:"Livrée",cancelled:"Annulée"};
  return (state.lang==="ar"?ar:state.lang==="fr"?fr:en)[status]||status;
}

function formatUpdated(value){
  var d=new Date(value||Date.now());
  if(!Number.isFinite(d.getTime()))return tx("Updated recently","تم التحديث مؤخراً");
  try{
    var text=new Intl.DateTimeFormat(tx("en-LB","ar-LB"),{
      year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"
    }).format(d);
    return (tx("Updated ","آخر تحديث "))+text.replace(/,\s*(?=\d{1,2}:)/," · ");
  }catch{
    return (tx("Updated ","آخر تحديث "))+d.toLocaleString(tx("en-LB","ar-LB"));
  }
}

function itemCountLabel(count){
  count=Number(count)||0;
  if(isArabic())return count+" "+(count===1?"قطعة":"قطع");
  if(state.lang==="fr")return count+" "+(count===1?"article":"articles");
  return count+" "+(count===1?"item":"items");
}

function paymentLabel(method){
  method=String(method||"cash_on_delivery");
  if(method==="cash_on_delivery")return tx("Cash on Delivery","الدفع عند الاستلام");
  if(method==="whish"||method==="wish")return "Whish";
  if(method==="omt")return "OMT";
  return method.replace(/_/g," ").replace(/\b\w/g,function(c){return c.toUpperCase()});
}
function paymentStatusLabel(status){
  var en={pending:"Payment pending",paid:"Payment received",failed:"Payment failed",refunded:"Refunded",partially_refunded:"Partially refunded",not_required:"No payment required"};
  var ar={pending:"الدفع معلّق",paid:"تم استلام الدفع",failed:"فشل الدفع",refunded:"تم رد المبلغ",partially_refunded:"تم رد جزء من المبلغ",not_required:"لا يتطلب دفعاً"};
  var fr={pending:"Paiement en attente",paid:"Paiement reçu",failed:"Échec du paiement",refunded:"Remboursé",partially_refunded:"Partiellement remboursé",not_required:"Aucun paiement requis"};
  return (state.lang==="ar"?ar:state.lang==="fr"?fr:en)[status||"pending"]||status||"";
}

function setLang(next){
  state.lang=next==="ar"?"ar":next==="fr"?"fr":"en";
  try{if(window.ZWM_LOCALE&&window.ZWM_LOCALE.set)window.ZWM_LOCALE.set(state.lang,{navigate:false});else localStorage.setItem("zwm-locale-v3",state.lang)}catch{}
  document.documentElement.lang=state.lang;
  document.documentElement.dir=isArabic()?"rtl":"ltr";
  document.querySelectorAll("[data-commerce-lang]").forEach(function(b){b.classList.toggle("is-active",b.dataset.commerceLang===state.lang)});
  var shopLink=document.querySelector(".commerce-header-actions>a[href='/shop.html']");
  var accountLink=document.querySelector(".commerce-header-actions>a[href='/account#orders']");
  if(shopLink)shopLink.textContent=tx("Shop","المتجر");
  if(accountLink)accountLink.textContent=tx("My Account","حسابي");
  if(state.order)render();
  renderErrorCopy();
}
function claimFor(ref){
  var claims=read(CLAIMS_KEY,[])||[],x=claims.find(function(i){return i.reference===ref});
  return x&&x.claim_token||"";
}

function renderTimeline(o){
  var statuses=["new","confirmed","preparing","out_for_delivery","delivered"];
  var current=statuses.indexOf(o.status),cancel=o.status==="cancelled";
  $("orderTimeline").innerHTML=statuses.map(function(s,i){
    var cls=cancel?(i===0?"is-done":""):(i<current?"is-done":i===current?"is-current":"");
    var currentAttr=!cancel&&i===current?' aria-current="step"':"";
    return '<div class="order-stage '+cls+'"'+currentAttr+'><i aria-hidden="true"></i><span>'+esc(label(s))+'</span></div>';
  }).join("");
  if(cancel){
    $("orderTimeline").insertAdjacentHTML("beforeend",'<div class="order-stage is-current is-cancelled-stage" aria-current="step"><i aria-hidden="true"></i><span>'+esc(label("cancelled"))+'</span></div>');
  }
}

function detailRow(labelText,value){
  if(!value)return "";
  return '<div class="order-address-row"><small>'+esc(labelText)+'</small><strong>'+esc(value)+'</strong></div>';
}

function renderDelivery(o){
  var addr=o.delivery_address||{},gift=o.gift||o.extra||{};
  var html="";
  if(o.kind==="gift"&&gift.recipient){
    html+='<div class="order-recipient"><small>'+esc(tx("Recipient","المستلم"))+'</small><strong>'+esc(gift.recipient)+'</strong>'+(gift.recipient_phone?'<span>'+esc(gift.recipient_phone)+'</span>':"")+'</div>';
  }
  html+='<div class="order-address-lines">';
  html+=detailRow(tx("Street / neighborhood","الشارع / الحي"),addr.street);
  html+=detailRow(tx("Building / residence","المبنى / السكن"),addr.building);
  html+=detailRow(tx("Floor / apartment","الطابق / الشقة"),addr.floor_apartment);
  html+=detailRow(tx("Nearby landmark","معلم قريب"),addr.landmark);
  html+=detailRow(tx("Delivery instructions","تعليمات التوصيل"),addr.instructions);
  html+='</div>';
  if(!Object.values(addr).some(Boolean)&&!gift.recipient){
    html='<p class="order-muted">'+esc(tx("Delivery details are saved with this order.","تفاصيل التوصيل محفوظة مع الطلب."))+'</p>';
  }
  $("deliveryAddress").innerHTML=html;
}

function render(){
  var o=state.order,items=Array.isArray(o.items)?o.items:[],addr=o.delivery_address||{};
  var count=Number(o.item_count)||items.reduce(function(n,i){return n+(Number(i.qty)||1)},0);

  document.body.dataset.orderStatus=o.status||"";
  $("orderEyebrow").textContent=tx("Your order","طلبك");
  $("orderHeading").textContent=new URL(location.href).searchParams.get("new")==="1"
    ?(tx("Thank you — your order is in 🌿","شكراً — تم استلام طلبك 🌿"))
    :(tx("Order details","تفاصيل طلبك"));
  $("orderIntro").textContent=isArabic()
    ?"تتحدث هذه الصفحة تلقائياً عند انتقال طلبك إلى مرحلة جديدة."
    :"This page updates automatically as your order moves forward.";
  $("orderNumber").textContent=o.reference||"";

  $("statusTitle").textContent=label(o.status);
  $("statusLabel").textContent=tx("Current status","الحالة الحالية");
  $("statusUpdated").textContent=formatUpdated(o.updated_at||o.submitted_at);
  $("statusUpdated").title=new Date(o.updated_at||o.submitted_at).toLocaleString(tx("en-LB","ar-LB"));
  renderTimeline(o);

  $("itemsTitle").textContent=tx("Order","الطلب");
  $("itemsMeta").textContent=itemCountLabel(count);
  $("orderItems").innerHTML=items.map(function(i){
    var qty=Math.max(1,Number(i.qty)||1);
    var name=isArabic()?(i.name_ar||i.name):state.lang==="fr"?frText(i.name_fr||i.name||i.name_en||i.product_id||""):(i.name||i.name_en||i.product_id||"");
    var size=isArabic()?(i.size_ar||i.size):state.lang==="fr"?frText(i.size_fr||i.size||i.size_en||i.variant_name||""):(i.size||i.size_en||i.variant_name||"");
    var meta=[];
    if(size)meta.push(size);
    meta.push((tx("Qty ","الكمية "))+qty);
    var rowTotal=i.subtotal!=null?i.subtotal:(Number(i.unit_price)||0)*qty;
    return '<div class="order-detail-item"><div class="order-item-copy"><strong>'+esc(name)+'</strong><small>'+esc(meta.join(" · "))+'</small></div><strong class="order-item-price">'+money(rowTotal)+'</strong></div>';
  }).join("");

  $("deliveryTitle").textContent=tx("Delivery","التوصيل");
  $("deliveryArea").textContent=addr.area||o.delivery_area||o.area||"";
  renderDelivery(o);
  $("orderNote").textContent=o.notes?(tx("Order note: ","ملاحظة الطلب: "))+o.notes:"";
  $("orderNote").hidden=!o.notes;

  $("paymentTitle").textContent=tx("Payment & total","الدفع والإجمالي");
  $("payMethodLabel").textContent=tx("Payment method","طريقة الدفع");
  $("payMethod").textContent=paymentLabel(o.payment_method);
  $("payStatusLabel").textContent=tx("Payment status","حالة الدفع");
  $("payStatus").textContent=paymentStatusLabel(o.payment_status);
  $("payStatus").className="order-payment-status payment-"+String(o.payment_status||"pending");
  $("subLabel").textContent=tx("Subtotal","الإجمالي الفرعي");
  $("rewardLabel").textContent=tx("Reward","المكافأة");
  $("delLabel").textContent=tx("Delivery","التوصيل");
  $("totalLabel").textContent=tx("Total","الإجمالي");
  $("orderSubtotal").textContent=money(o.subtotal!=null?o.subtotal:Number(o.total)-Number(o.delivery_fee||0)+Number(o.reward_discount||0));
  $("orderReward").textContent="-"+money(o.reward_discount||0);
  $("orderRewardRow").hidden=Number(o.reward_discount||0)<=0;
  $("orderDeliveryFee").textContent=Number(o.delivery_fee||0)===0?(tx("Free","مجاني")):money(o.delivery_fee);
  $("orderTotal").textContent=money(o.total);

  $("rewardsTitle").textContent=tx("Mouneh Points","نقاط المونة");
  var rewardsState=o.rewards_state||(
    o.status==="cancelled"?"none":
    (Number(o.points_awarded||0)>0?"earned":
    (o.status==="delivered"&&o.payment_status!=="paid"?"waiting_payment":
    (o.status!=="delivered"&&o.payment_status==="paid"?"waiting_delivery":"pending")))
  );
  var rewardCopy={
    earned:tx("Delivery and payment are both confirmed. These points are now earned.","تم تأكيد التسليم واستلام الدفع، وتمت إضافة النقاط."),
    waiting_payment:tx("Delivered, but points are waiting for payment to be confirmed received.","تم التسليم، لكن النقاط تنتظر تأكيد استلام الدفع من الإدارة."),
    waiting_delivery:tx("Payment received. Points will be added after delivery is confirmed.","تم استلام الدفع. ستُضاف النقاط بعد تأكيد التسليم."),
    pending:tx("Points are added only after both delivery and payment are confirmed.","تُضاف النقاط فقط بعد تأكيد التسليم واستلام الدفع."),
    none:tx("This order does not earn points.","هذا الطلب لا يكسب نقاطاً.")
  };
  $("rewardsCopy").textContent=rewardCopy[rewardsState]||rewardCopy.pending;
  $("orderPoints").textContent=rewardsState==="earned"
    ?("+"+Number(o.points_awarded||0)+" 🌿")
    :(rewardsState==="none"
      ?"0 🌿"
      :(Number(o.pending_points||0)>0?"~"+Number(o.pending_points)+" 🌿":(tx("Points pending 🌿","نقاط معلّقة 🌿"))));

  $("actionsTitle").textContent=tx("What next?","ماذا بعد؟");
  $("actionsCopy").textContent=isArabic()
    ?"تابع الطلب هنا، تسوّق من جديد، أو تواصل معنا إذا احتجت مساعدة."
    :"Track this order here, keep shopping, or contact us if you need help.";
  $("viewOrders").textContent=tx("View my orders","عرض طلباتي");
  $("continueShopping").textContent=tx("Continue shopping","متابعة التسوق");
  $("cancelOrderButton").textContent=tx("Cancel order","إلغاء الطلب");
  $("reorderButton").textContent=tx("Order again","اطلبه مرة أخرى");
  $("cancelOrderButton").hidden=!o.can_cancel;
  $("reorderButton").hidden=o.status!=="delivered";

  var phone=String(o.support_phone||"96181581230").replace(/\D/g,"");
  var msg=tx("Hi, I need help with order ","مرحباً، أحتاج مساعدة بخصوص الطلب ")+o.reference+".";
  $("orderSupport").href="https://wa.me/"+phone+"?text="+encodeURIComponent(msg);
  $("orderSupport").textContent=tx("Need help? WhatsApp us","تحتاج مساعدة؟ تواصل عبر واتساب");

  $("orderLoading").hidden=true;
  $("orderError").hidden=true;
  $("orderContent").hidden=false;
}

function renderErrorCopy(){
  var box=$("orderError");
  if(!box)return;
  var h=box.querySelector("h2"),p=box.querySelector("p"),a=box.querySelector("a");
  if(h)h.textContent=tx("We couldn’t open this order.","تعذّر فتح هذا الطلب.");
  if(p)p.textContent=isArabic()
    ?"لحماية الخصوصية، يظهر الطلب فقط للحساب الذي يملكه أو للمتصفح الذي أجرى طلب الضيف."
    :"For privacy, orders are only visible to the signed-in account that owns them or to the browser that placed a guest order.";
  if(a)a.textContent=tx("Sign in","تسجيل الدخول");
}

async function refresh(){
  if(state.refreshing)return;
  state.refreshing=true;
  try{
    var previous=state.lastStatus||state.order&&state.order.status||"";
    var next=await rpc("detail",{reference:state.ref,claim_token:state.claim});
    state.order=next;
    state.lastStatus=next&&next.status||"";
    state.loaded=true;
    render();
    if(previous&&state.lastStatus&&previous!==state.lastStatus){
      $("orderActionStatus").textContent=isArabic()
        ?"تم تحديث حالة طلبك إلى: "+label(state.lastStatus)
        :"Order status updated to "+label(state.lastStatus)+".";
    }
  }catch(err){
    if(!state.loaded&&!state.order){
      $("orderLoading").hidden=true;
      $("orderContent").hidden=true;
      $("orderError").hidden=false;
      renderErrorCopy();
    }else{
      $("orderActionStatus").textContent=isArabic()
        ?"تعذّر التحقق من آخر تحديث حالياً. سنحاول تلقائياً مرة أخرى."
        :"Couldn’t check the latest update right now. We’ll retry automatically.";
    }
  }finally{
    state.refreshing=false;
  }
}

async function cancel(){
  if(!state.order||!state.order.can_cancel)return;
  if(!confirm(tx("Cancel this order?","هل تريد إلغاء هذا الطلب؟")))return;
  $("cancelOrderButton").disabled=true;
  $("orderActionStatus").textContent=tx("Cancelling…","جارٍ الإلغاء…");
  try{
    state.order=await rpc("cancel",{reference:state.ref,claim_token:state.claim,reason:"Customer requested"});
    state.lastStatus=state.order.status||"";
    $("orderActionStatus").textContent=tx("Order cancelled.","تم إلغاء الطلب.");
    render();
  }catch(e){
    $("orderActionStatus").textContent=e.message||String(e);
    await refresh();
  }finally{
    $("cancelOrderButton").disabled=false;
  }
}

async function reorder(){
  await loadOverrides();
  var o=state.order,items=Array.isArray(o.items)?o.items:[],cart=read(CART_KEY,{})||{},added=0,missing=0;
  items.forEach(function(i){
    var p=product(i.product_id),v=variant(p,i.variant_id);
    if(!p||!v||!available(p)){missing++;return}
    var key=p.id+"::"+v.id;
    cart[key]={productId:p.id,variantId:v.id,qty:Math.max(1,Number(i.qty)||1)};
    added++;
  });
  write(CART_KEY,cart);
  $("orderActionStatus").textContent=isArabic()
    ?(added+" منتج أضيف إلى السلة"+(missing?" · "+missing+" لم يعد متوفراً":"")+".")
    :(added+" item"+(added===1?"":"s")+" added to cart"+(missing?" · "+missing+" no longer available":"")+".");
  if(added)setTimeout(function(){location.href="/shop.html?open=cart"},550);
}

async function init(){
  var u=new URL(location.href);
  state.ref=u.searchParams.get("ref")||"";
  state.claim=claimFor(state.ref);
  state.lang=activeLocale();

  document.querySelectorAll("[data-commerce-lang]").forEach(function(b){
    b.addEventListener("click",function(){if(window.ZWM_LOCALE&&window.ZWM_LOCALE.set)window.ZWM_LOCALE.set(b.dataset.commerceLang);else setLang(b.dataset.commerceLang)});
  });
  setLang(state.lang);

  if(!state.ref){
    $("orderLoading").hidden=true;
    $("orderError").hidden=false;
    renderErrorCopy();
    return;
  }

  await refresh();
  $("cancelOrderButton").addEventListener("click",cancel);
  $("reorderButton").addEventListener("click",reorder);

  setInterval(function(){if(!document.hidden)refresh()},5000);
  window.addEventListener("focus",refresh);
  window.addEventListener("online",refresh);
  window.addEventListener("pageshow",refresh);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)refresh()});
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();