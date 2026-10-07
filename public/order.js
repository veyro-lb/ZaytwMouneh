(function(){
"use strict";

var AUTH_KEY="zwm:mouneh:session:v1",CLAIMS_KEY="zwm:mouneh:claims:v1",CART_KEY="zwm-cart-v5",LANG_KEY="zwm-lang-v2";
var REQUEST_TIMEOUT_MS=12000,ORDER_STALE_MS=20000,ORDER_POLL_MS=30000;
var state={lang:"en",order:null,ref:"",claim:"",products:[],lastStatus:"",refreshing:false,loaded:false,lastRefreshedAt:0};
var $=function(id){return document.getElementById(id)};
var money=function(v){var value="$"+(Number(v)||0).toFixed(2);return isArabic()?"\u2066"+value+"\u2069":value};
var esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};

function read(k,f){try{var v=localStorage.getItem(k);return v==null?f:JSON.parse(v)}catch{return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function session(){return read(AUTH_KEY,null)}
function config(){return window.ZWM_CMS_CONFIG||{}}
function isArabic(){return state.lang==="ar"}
function isFrench(){return state.lang==="fr"}
function tr(en,ar,fr){if(isArabic())return ar;if(isFrench())return fr!=null?fr:(window.ZWM_FR_TRANSLATE?window.ZWM_FR_TRANSLATE(en):en);return en}

async function rpc(action,p){
  var c=config(),s=session(),headers={"apikey":c.supabasePublishableKey,"Content-Type":"application/json","Prefer":"return=representation"},controller=typeof AbortController==="function"?new AbortController():null,timer=null,r;
  if(s&&s.access_token)headers.Authorization="Bearer "+s.access_token;
  try{
    if(controller)timer=setTimeout(function(){controller.abort()},REQUEST_TIMEOUT_MS);
    r=await fetch(String(c.supabaseUrl||"").replace(/\/$/,"")+"/rest/v1/rpc/zwm_checkout",{method:"POST",headers:headers,body:JSON.stringify({action:action,p:p||{}}),signal:controller?controller.signal:undefined});
  }catch(err){
    throw new Error(err&&err.name==="AbortError"?tr("Order status took too long to load. Please retry.","استغرق تحميل حالة الطلب وقتاً طويلاً. يرجى إعادة المحاولة.","Le statut de la commande a mis trop de temps à charger. Veuillez réessayer."):tr("Order service is unreachable. Check your connection and retry.","تعذّر الاتصال بخدمة الطلب. تحقق من الاتصال وأعد المحاولة.","Le service de commande est inaccessible. Vérifiez votre connexion et réessayez."));
  }finally{if(timer)clearTimeout(timer)}
  var data=await r.json().catch(function(){return {}});
  if(!r.ok)throw new Error(data.message||data.hint||data.details||tr("Order unavailable","تعذّر فتح الطلب.","Commande indisponible"));
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
  var fr={new:"Commande reçue",confirmed:"Confirmée",preparing:"En préparation",out_for_delivery:"En cours de livraison",delivered:"Livrée",cancelled:"Annulée"};
  return (isArabic()?ar:isFrench()?fr:en)[status]||status;
}

function formatUpdated(value){
  var d=new Date(value||Date.now());
  if(!Number.isFinite(d.getTime()))return tr("Updated recently","تم التحديث مؤخراً","Mis à jour récemment");
  try{
    var text=new Intl.DateTimeFormat(isArabic()?"ar-LB":isFrench()?"fr-LB":"en-LB",{
      year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"
    }).format(d);
    return tr("Updated ","آخر تحديث ","Mis à jour ")+text.replace(/,\s*(?=\d{1,2}:)/," · ");
  }catch{
    return tr("Updated ","آخر تحديث ","Mis à jour ")+d.toLocaleString(isArabic()?"ar-LB":isFrench()?"fr-LB":"en-LB");
  }
}

function itemCountLabel(count){
  count=Number(count)||0;
  if(isArabic())return count+" "+(count===1?"قطعة":"قطع");
  if(isFrench())return count+" "+(count===1?"article":"articles");
  return count+" "+(count===1?"item":"items");
}

function paymentLabel(method){
  method=String(method||"cash_on_delivery");
  if(method==="cash_on_delivery")return tr("Cash on Delivery","الدفع عند الاستلام","Paiement à la livraison");
  if(method==="whish"||method==="wish")return "Whish";
  if(method==="omt")return "OMT";
  return method.replace(/_/g," ").replace(/\b\w/g,function(c){return c.toUpperCase()});
}
function paymentStatusLabel(status,method){
  if(String(method||"cash_on_delivery")==="cash_on_delivery"&&(status||"pending")==="pending")return tr("Due on delivery","مستحق عند الاستلام","À payer à la livraison");
  var en={pending:"Payment pending",paid:"Payment received",failed:"Payment failed",refunded:"Refunded",partially_refunded:"Partially refunded",not_required:"No payment required"};
  var ar={pending:"الدفع معلّق",paid:"تم استلام الدفع",failed:"فشل الدفع",refunded:"تم رد المبلغ",partially_refunded:"تم رد جزء من المبلغ",not_required:"لا يتطلب دفعاً"};
  var fr={pending:"Paiement en attente",paid:"Paiement reçu",failed:"Échec du paiement",refunded:"Remboursé",partially_refunded:"Partiellement remboursé",not_required:"Aucun paiement requis"};
  return (isArabic()?ar:isFrench()?fr:en)[status||"pending"]||status||"";
}
function setLang(next){
  state.lang=next==="ar"?"ar":next==="fr"?"fr":"en";
  try{if(window.ZWM_LOCALE&&window.ZWM_LOCALE.set)window.ZWM_LOCALE.set(state.lang);else localStorage.setItem(LANG_KEY,state.lang)}catch{}
  document.documentElement.lang=state.lang;document.documentElement.dir=isArabic()?"rtl":"ltr";
  document.querySelectorAll("[data-commerce-lang]").forEach(function(b){b.classList.toggle("is-active",b.dataset.commerceLang===state.lang)});
  var shopLink=document.querySelector(".commerce-header-actions>a[href='/shop']"),accountLink=document.querySelector(".commerce-header-actions>a[href='/account#orders']");
  if(shopLink)shopLink.textContent=tr("Shop","المتجر","Boutique");
  if(accountLink)accountLink.textContent=tr("My Account","حسابي","Mon compte");
  if(state.order)render();renderErrorCopy()
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
    html+='<div class="order-recipient"><small>'+esc(tr("Recipient","المستلم","Destinataire"))+'</small><strong>'+esc(gift.recipient)+'</strong>'+(gift.recipient_phone?'<span>'+esc(gift.recipient_phone)+'</span>':"")+'</div>';
  }
  html+='<div class="order-address-lines">';
  html+=detailRow(tr("Street / neighborhood","الشارع / الحي","Rue / quartier"),addr.street);
  html+=detailRow(tr("Building / residence","المبنى / السكن","Immeuble / résidence"),addr.building);
  html+=detailRow(tr("Floor / apartment","الطابق / الشقة","Étage / appartement"),addr.floor_apartment);
  html+=detailRow(tr("Nearby landmark","معلم قريب","Point de repère"),addr.landmark);
  html+=detailRow(tr("Delivery instructions","تعليمات التوصيل","Instructions de livraison"),addr.instructions);
  html+='</div>';
  if(!Object.values(addr).some(Boolean)&&!gift.recipient){
    html='<p class="order-muted">'+esc(tr("Delivery details are saved with this order.","تفاصيل التوصيل محفوظة مع الطلب.","Les détails de livraison sont enregistrés avec cette commande."))+'</p>';
  }
  $("deliveryAddress").innerHTML=html;
}

function render(){
  var o=state.order,items=Array.isArray(o.items)?o.items:[],addr=o.delivery_address||{};
  var count=Number(o.item_count)||items.reduce(function(n,i){return n+(Number(i.qty)||1)},0);

  document.body.dataset.orderStatus=o.status||"";
  $("orderEyebrow").textContent=tr("Your order","طلبك","Votre commande");
  $("orderHeading").textContent=new URL(location.href).searchParams.get("new")==="1"
    ?tr("Thank you — your order is in 🌿","شكراً — تم استلام طلبك 🌿","Merci — votre commande est reçue 🌿")
    :tr("Order details","تفاصيل طلبك","Détails de la commande");
  $("orderIntro").textContent=new URL(location.href).searchParams.get("new")==="1"
    ?tr("We received your order. We’ll prepare it and contact you only if needed. You’ll pay in cash when it is delivered.","تم استلام طلبك. سنحضّره ونتواصل معك عند الحاجة فقط. يتم الدفع نقداً عند الاستلام.","Nous avons reçu votre commande. Nous la préparerons et vous contacterons uniquement si nécessaire. Vous paierez en espèces à la livraison.")
    :tr("This page updates automatically as your order moves forward.","تتحدث هذه الصفحة تلقائياً عند انتقال طلبك إلى مرحلة جديدة.","Cette page se met à jour automatiquement à mesure que votre commande avance.");
  $("orderNumber").textContent=o.reference||"";

  $("statusTitle").textContent=label(o.status);
  $("statusLabel").textContent=tr("Current status","الحالة الحالية","Statut actuel");
  $("statusUpdated").textContent=formatUpdated(o.updated_at||o.submitted_at);
  $("statusUpdated").title=new Date(o.updated_at||o.submitted_at).toLocaleString(isArabic()?"ar-LB":isFrench()?"fr-LB":"en-LB");
  renderTimeline(o);

  $("itemsTitle").textContent=tr("Order","الطلب","Commande");
  $("itemsMeta").textContent=itemCountLabel(count);
  $("orderItems").innerHTML=items.map(function(i){
    var qty=Math.max(1,Number(i.qty)||1);
    var name=isArabic()?(i.name_ar||i.name):(i.name||i.name_en||i.product_id||"");
    var size=isArabic()?(i.size_ar||i.size):(i.size||i.size_en||i.variant_name||"");
    var meta=[];
    if(size)meta.push(size);
    meta.push(tr("Qty ","الكمية ","Qté ")+qty);
    var rowTotal=i.subtotal!=null?i.subtotal:(Number(i.unit_price)||0)*qty;
    return '<div class="order-detail-item"><div class="order-item-copy"><strong>'+esc(name)+'</strong><small>'+esc(meta.join(" · "))+'</small></div><strong class="order-item-price">'+money(rowTotal)+'</strong></div>';
  }).join("");

  $("deliveryTitle").textContent=tr("Delivery","التوصيل","Livraison");
  $("deliveryArea").textContent=addr.area||o.delivery_area||o.area||"";
  renderDelivery(o);
  $("orderNote").textContent=o.notes?tr("Order note: ","ملاحظة الطلب: ","Note de commande : ")+o.notes:"";
  $("orderNote").hidden=!o.notes;

  $("paymentTitle").textContent=tr("Payment & total","الدفع والإجمالي","Paiement et total");
  $("payMethodLabel").textContent=tr("Payment method","طريقة الدفع","Mode de paiement");
  $("payMethod").textContent=paymentLabel(o.payment_method);
  $("payStatusLabel").textContent=tr("Payment status","حالة الدفع","Statut du paiement");
  $("payStatus").textContent=paymentStatusLabel(o.payment_status,o.payment_method);
  $("payStatus").className="order-payment-status payment-"+String(o.payment_status||"pending");
  $("subLabel").textContent=tr("Subtotal","الإجمالي الفرعي","Sous-total");
  $("rewardLabel").textContent=tr("Reward","المكافأة","Récompense");
  $("delLabel").textContent=tr("Delivery","التوصيل","Livraison");
  $("totalLabel").textContent=tr("Total","الإجمالي","Total");
  $("orderSubtotal").textContent=money(o.subtotal!=null?o.subtotal:Number(o.total)-Number(o.delivery_fee||0)+Number(o.reward_discount||0));
  $("orderReward").textContent="-"+money(o.reward_discount||0);
  $("orderRewardRow").hidden=Number(o.reward_discount||0)<=0;
  $("orderDeliveryFee").textContent=Number(o.delivery_fee||0)===0?tr("Free","مجاني","Gratuite"):money(o.delivery_fee);
  $("orderTotal").textContent=money(o.total);

  $("rewardsTitle").textContent=tr("Mouneh Points","نقاط المونة","Points Mouneh");
  var rewardsState=o.rewards_state||(
    o.status==="cancelled"?"none":
    (Number(o.points_awarded||0)>0?"earned":
    (o.status==="delivered"&&o.payment_status!=="paid"?"waiting_payment":
    (o.status!=="delivered"&&o.payment_status==="paid"?"waiting_delivery":"pending")))
  );
  var rewardCopy={
    earned:tr("Delivery and payment are both confirmed. These points are now earned.","تم تأكيد التسليم واستلام الدفع، وتمت إضافة النقاط.","La livraison et le paiement sont confirmés. Ces points sont maintenant acquis."),
    waiting_payment:tr("Delivered, but points are waiting for payment to be confirmed received.","تم التسليم، لكن النقاط تنتظر تأكيد استلام الدفع من الإدارة.","Commande livrée ; les points attendent la confirmation du paiement reçu."),
    waiting_delivery:tr("Payment received. Points will be added after delivery is confirmed.","تم استلام الدفع. ستُضاف النقاط بعد تأكيد التسليم.","Paiement reçu. Les points seront ajoutés après confirmation de la livraison."),
    pending:tr("Points are added only after both delivery and payment are confirmed.","تُضاف النقاط فقط بعد تأكيد التسليم واستلام الدفع.","Les points sont ajoutés après confirmation de la livraison et du paiement."),
    none:tr("This order does not earn points.","هذا الطلب لا يكسب نقاطاً.","Cette commande ne rapporte pas de points.")
  };
  $("rewardsCopy").textContent=rewardCopy[rewardsState]||rewardCopy.pending;
  $("orderPoints").textContent=rewardsState==="earned"
    ?("+"+Number(o.points_awarded||0)+" 🌿")
    :(rewardsState==="none"
      ?"0 🌿"
      :(Number(o.pending_points||0)>0?"~"+Number(o.pending_points)+" 🌿":tr("Points pending 🌿","نقاط معلّقة 🌿","Points en attente 🌿")));

  $("actionsTitle").textContent=tr("What next?","ماذا بعد؟","Et ensuite ?");
  $("actionsCopy").textContent=tr("Track this order here, keep shopping, or contact us if you need help.","تابع الطلب هنا، تسوّق من جديد، أو تواصل معنا إذا احتجت مساعدة.","Suivez cette commande ici, continuez vos achats ou contactez-nous si vous avez besoin d’aide.");
  $("viewOrders").textContent=tr("View my orders","عرض طلباتي","Voir mes commandes");
  $("continueShopping").textContent=tr("Continue shopping","متابعة التسوق","Continuer mes achats");
  $("cancelOrderButton").textContent=tr("Cancel order","إلغاء الطلب","Annuler la commande");
  $("reorderButton").textContent=tr("Order again","اطلبه مرة أخرى","Commander à nouveau");
  $("cancelOrderButton").hidden=!o.can_cancel;
  $("reorderButton").hidden=o.status!=="delivered";

  var phone=String(o.support_phone||"96181581230").replace(/\D/g,"");
  var msg=tr("Hi, I need help with order ","مرحباً، أحتاج مساعدة بخصوص الطلب ","Bonjour, j’ai besoin d’aide concernant la commande ")+o.reference+".";
  $("orderSupport").href="https://wa.me/"+phone+"?text="+encodeURIComponent(msg);
  $("orderSupport").textContent=tr("Need help? WhatsApp us","تحتاج مساعدة؟ تواصل عبر واتساب","Besoin d’aide ? Contactez-nous sur WhatsApp");

  $("orderLoading").hidden=true;
  $("orderError").hidden=true;
  $("orderContent").hidden=false;
}

function renderErrorCopy(){
  var box=$("orderError");if(!box)return;
  var h=box.querySelector("h2"),p=box.querySelector("p"),a=box.querySelector("a");
  if(h)h.textContent=tr("We couldn’t open this order.","تعذّر فتح هذا الطلب.","Impossible d’ouvrir cette commande.");
  if(p)p.textContent=tr(
    "For privacy, orders are only visible to the signed-in account that owns them or to the browser that placed a guest order.",
    "لحماية الخصوصية، يظهر الطلب فقط للحساب الذي يملكه أو للمتصفح الذي أجرى طلب الضيف.",
    "Pour protéger votre vie privée, la commande n’est visible que par le compte qui la possède ou par le navigateur ayant passé la commande en invité."
  );
  if(a)a.textContent=tr("Sign in","تسجيل الدخول","Se connecter");
}
async function refresh(force){
  if(state.refreshing)return;
  if(!force&&state.loaded&&Date.now()-state.lastRefreshedAt<ORDER_STALE_MS)return;
  state.refreshing=true;
  try{
    var previous=state.lastStatus||state.order&&state.order.status||"";
    var next=await rpc("detail",{reference:state.ref,claim_token:state.claim});
    state.order=next;
    state.lastStatus=next&&next.status||"";
    state.loaded=true;
    state.lastRefreshedAt=Date.now();
    render();
    if(previous&&state.lastStatus&&previous!==state.lastStatus){
      $("orderActionStatus").textContent=tr("Order status updated to ","تم تحديث حالة طلبك إلى: ","Statut de la commande mis à jour : ")+label(state.lastStatus)+(isArabic()?"":".");
    }
  }catch(err){
    if(!state.loaded&&!state.order){
      $("orderLoading").hidden=true;
      $("orderContent").hidden=true;
      $("orderError").hidden=false;
      renderErrorCopy();
    }else{
      $("orderActionStatus").textContent=tr("Couldn’t check the latest update right now. We’ll retry automatically.","تعذّر التحقق من آخر تحديث حالياً. سنحاول تلقائياً مرة أخرى.","Impossible de vérifier la dernière mise à jour pour le moment. Une nouvelle tentative sera effectuée automatiquement.");
    }
  }finally{
    state.refreshing=false;
  }
}

async function cancel(){
  if(!state.order||!state.order.can_cancel)return;
  if(!confirm(tr("Cancel this order?","هل تريد إلغاء هذا الطلب؟","Annuler cette commande ?")))return;
  $("cancelOrderButton").disabled=true;
  $("orderActionStatus").textContent=tr("Cancelling…","جارٍ الإلغاء…","Annulation…");
  try{
    state.order=await rpc("cancel",{reference:state.ref,claim_token:state.claim,reason:"Customer requested"});
    state.lastStatus=state.order.status||"";
    $("orderActionStatus").textContent=tr("Order cancelled.","تم إلغاء الطلب.","Commande annulée.");
    render();
  }catch(e){
    console.warn("Order cancellation failed",e);
    $("orderActionStatus").textContent=tr("We couldn’t cancel the order right now. Please try again.","تعذّر إلغاء الطلب حالياً. حاول مجدداً.","Impossible d’annuler la commande pour le moment. Réessayez.");
    await refresh(true);
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
    :isFrench()
      ?(added+" article"+(added===1?"":"s")+" ajouté"+(added===1?"":"s")+" au panier"+(missing?" · "+missing+" indisponible"+(missing===1?"":"s"):"")+".")
      :(added+" item"+(added===1?"":"s")+" added to cart"+(missing?" · "+missing+" no longer available":"")+".");
  if(added)setTimeout(function(){location.href="/shop?open=cart"},550);
}

async function init(){
  var u=new URL(location.href);
  state.ref=u.searchParams.get("ref")||"";
  state.claim=claimFor(state.ref);
  state.lang=(function(){try{var l=window.ZWM_LOCALE&&window.ZWM_LOCALE.get?window.ZWM_LOCALE.get():localStorage.getItem(LANG_KEY);return l==="ar"?"ar":l==="fr"?"fr":"en"}catch{return "en"}})();

  document.querySelectorAll("[data-commerce-lang]").forEach(function(b){
    b.addEventListener("click",function(){setLang(b.dataset.commerceLang)});
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

  var resume=function(){if(!document.hidden)refresh(false)};
  setInterval(resume,ORDER_POLL_MS);
  window.addEventListener("focus",resume);
  window.addEventListener("online",function(){refresh(true)});
  window.addEventListener("pageshow",resume);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)resume()});
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();