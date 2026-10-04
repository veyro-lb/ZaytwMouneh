
(function(){
"use strict";
var CART_KEY="zwm-cart-v5",GIFT_KEY="zwm-gift-items-v1",GIFT_META_KEY="zwm:native-gift:meta:v1",LANG_KEY="zwm-lang-v2",AUTH_KEY="zwm:mouneh:session:v1",CLAIMS_KEY="zwm:mouneh:claims:v1",WALLET_KEY="zwm:mouneh:selected-wallet:v1",REQUEST_KEY="zwm:native-checkout:request:v1";
var state={lang:"en",kind:"order",giftMeta:{},config:null,products:[],cart:{},rows:[],dashboard:null,addresses:[],authUser:null,walletId:"",busy:false};
var T={
en:{backCart:"← Back to cart",account:"My Account",eyebrow:"Secure website order",title:"Checkout",intro:"Confirm your details once, see the complete total, and place your Zayt w Mouneh order directly on the website.",emptyTitle:"Your pantry is empty.",emptyCopy:"Add products before starting checkout.",startShopping:"Start shopping",customerTitle:"Customer",customerHelp:"We only collect what is needed to fulfil your order.",name:"Full name",phone:"Phone / WhatsApp",email:"Email (optional for guests)",recipientName:"Recipient name",recipientPhone:"Recipient phone",giftDeliveryHelp:"Use the recipient contact if the driver should call them directly.",deliveryTitle:"Delivery",deliveryHelp:"Use the details a local driver would need in Lebanon.",savedAddress:"Deliver to a saved address",anotherAddress:"Use another",area:"Area / City",street:"Street / Neighborhood",building:"Building / Residence",floor:"Floor / Apartment",landmark:"Nearby landmark",instructions:"Delivery instructions",saveAddress:"Save this address to my account",rewardsTitle:"Rewards",rewardsHelp:"Mouneh Points are finalized only after successful delivery.",paymentTitle:"Payment",paymentHelp:"More payment methods can be added later without changing your order history.",cod:"Cash on Delivery",codHelp:"Pay when your order arrives.",notesTitle:"Order note",notesHelp:"Optional — tell us anything useful for this delivery.",notes:"Anything we should know?",reviewTitle:"Review & place order",reviewHelp:"Your final total is re-calculated securely on the server before the order is created.",summaryTitle:"Order summary",subtotal:"Subtotal",reward:"Reward",delivery:"Delivery",total:"Total",placeOrder:"Place Order",needHelp:"Need help?",whatsappSupport:"Chat with us on WhatsApp",terms:'I agree to the <a href="/terms-and-rewards.html" target="_blank" rel="noopener">Terms of Service</a>, <a href="/privacy-and-data.html" target="_blank" rel="noopener">Privacy Policy</a> and applicable order/delivery terms.'},
ar:{backCart:"العودة للسلة →",account:"حسابي",eyebrow:"طلب آمن عبر الموقع",title:"إتمام الطلب",intro:"أكّد بياناتك مرة واحدة، شاهد المجموع الكامل، وأرسل طلب زيت ومونة مباشرة عبر الموقع.",emptyTitle:"سلتك فارغة.",emptyCopy:"أضف منتجات قبل بدء إتمام الطلب.",startShopping:"ابدأ التسوق",customerTitle:"العميل",customerHelp:"نجمع فقط البيانات اللازمة لتنفيذ الطلب.",name:"الاسم الكامل",phone:"رقم الهاتف / واتساب",email:"البريد الإلكتروني (اختياري للضيف)",recipientName:"اسم المستلم",recipientPhone:"هاتف المستلم",giftDeliveryHelp:"استخدم رقم المستلم إذا كان على السائق الاتصال به مباشرة.",deliveryTitle:"التوصيل",deliveryHelp:"استخدم التفاصيل التي يحتاجها سائق التوصيل في لبنان.",savedAddress:"التوصيل إلى عنوان محفوظ",anotherAddress:"استخدام عنوان آخر",area:"المنطقة / المدينة",street:"الشارع / الحي",building:"المبنى / السكن",floor:"الطابق / الشقة",landmark:"معلم قريب",instructions:"تعليمات التوصيل",saveAddress:"حفظ هذا العنوان في حسابي",rewardsTitle:"المكافآت",rewardsHelp:"تتثبت نقاط المونة فقط بعد نجاح التسليم.",paymentTitle:"الدفع",paymentHelp:"يمكن إضافة طرق دفع أخرى لاحقاً من دون تغيير سجل طلباتك.",cod:"الدفع عند الاستلام",codHelp:"ادفع عند وصول طلبك.",notesTitle:"ملاحظة الطلب",notesHelp:"اختياري — أخبرنا بما يفيد في هذا التوصيل.",notes:"هل هناك شيء يجب أن نعرفه؟",reviewTitle:"المراجعة وإرسال الطلب",reviewHelp:"يعاد احتساب المجموع النهائي بأمان على الخادم قبل إنشاء الطلب.",summaryTitle:"ملخص الطلب",subtotal:"المجموع الفرعي",reward:"المكافأة",delivery:"التوصيل",total:"المجموع",placeOrder:"إرسال الطلب",needHelp:"تحتاج مساعدة؟",whatsappSupport:"تواصل معنا عبر واتساب",terms:'أوافق على <a href="/terms-and-rewards.html" target="_blank" rel="noopener">شروط الخدمة</a> و<a href="/privacy-and-data.html" target="_blank" rel="noopener">سياسة الخصوصية</a> وشروط الطلب والتوصيل المطبقة.'}
};
var $=function(id){return document.getElementById(id)};
var esc=function(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var money=function(v){return "$"+(Number(v)||0).toFixed(2)};
function read(key,fallback){try{var v=localStorage.getItem(key);return v==null?fallback:JSON.parse(v)}catch{return fallback}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function remove(key){try{localStorage.removeItem(key)}catch{}}
function session(){return read(AUTH_KEY,null)}
function uuid(){return crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(c){var r=Math.random()*16|0,v=c==="x"?r:(r&3|8);return v.toString(16)})}
function token(){var a=new Uint8Array(32);crypto.getRandomValues(a);return Array.from(a,function(n){return n.toString(16).padStart(2,"0")}).join("")}
function productBase(){try{return typeof PRODUCTS_DATA!=="undefined"?JSON.parse(JSON.stringify(PRODUCTS_DATA)):[]}catch{return []}}
function config(){return window.ZWM_CMS_CONFIG||{}}
async function rpc(name,body,retry){
  var c=config(),s=session(),headers={"apikey":c.supabasePublishableKey,"Content-Type":"application/json","Prefer":"return=representation"};
  if(s&&s.access_token)headers.Authorization="Bearer "+s.access_token;
  var r=await fetch(String(c.supabaseUrl||"").replace(/\/$/,"")+"/rest/v1/rpc/"+name,{method:"POST",headers:headers,body:JSON.stringify(body||{})});
  var data=await r.json().catch(function(){return {}});
  if(r.status===401&&retry!==false){await new Promise(function(res){setTimeout(res,500)});return rpc(name,body,false)}
  if(!r.ok)throw new Error(data.message||data.hint||data.details||"Request failed");
  return data
}
async function authUser(){
  var s=session(),c=config();if(!s||!s.access_token)return null;
  try{var r=await fetch(String(c.supabaseUrl).replace(/\/$/,"")+"/auth/v1/user",{headers:{"apikey":c.supabasePublishableKey,"Authorization":"Bearer "+s.access_token}});if(!r.ok)return null;return await r.json()}catch{return null}
}
async function loadOverrides(){
  var c=config(),base=productBase(),map=new Map(base.map(function(p){return [p.id,p]}));
  try{
    var r=await fetch(String(c.supabaseUrl).replace(/\/$/,"")+"/rest/v1/product_overrides?select=product_id,action,payload",{headers:{"apikey":c.supabasePublishableKey}});
    if(r.ok){var rows=await r.json();rows.forEach(function(o){var p=map.get(o.product_id)||{id:o.product_id};if(o.action==="hide"){p.__hidden=true}else if(o.payload&&typeof o.payload==="object"){p=Object.assign({},p,o.payload);p.__hidden=o.action==="hide"}map.set(o.product_id,p)})}
  }catch{}
  state.products=Array.from(map.values())
}
function product(id){return state.products.find(function(p){return p.id===id})}
function variant(p,id){return p&&Array.isArray(p.variants)?p.variants.find(function(v){return v.id===id}):null}
function availability(p){return p&& !p.__hidden && !["hidden","draft"].includes(p.status) && String(p.availability||"in_stock")==="in_stock"}
function rebuildRows(){
  state.cart=read(state.kind==="gift"?GIFT_KEY:CART_KEY,{})||{};
  state.rows=Object.keys(state.cart).map(function(key){var it=state.cart[key],p=product(it.productId),v=variant(p,it.variantId);return p&&v?{key:key,item:it,p:p,v:v,qty:Math.max(1,Number(it.qty)||1),available:availability(p)}:null}).filter(Boolean)
}
function subtotal(){return state.rows.reduce(function(sum,r){return sum+Number(r.v.price||0)*r.qty},0)}
function currentWallet(){
  var wallet=state.dashboard&&Array.isArray(state.dashboard.wallet)?state.dashboard.wallet:[];
  var sub=subtotal();
  return wallet.find(function(w){return w.id===state.walletId&&w.status==="available"&&sub>=Number(w.minimum||0)})||null
}
function rewardDiscount(){var w=currentWallet();return w?Math.min(subtotal(),Number(w.value)||0):0}
function deliverySettings(){return state.config&&state.config.delivery||{}}
function activeZones(){var z=deliverySettings().zones;return Array.isArray(z)?z.filter(function(x){return x&&x.active!==false}):[]}
function selectedZone(){
  var zones=activeZones(),value=$("checkoutZone")&&$("checkoutZone").value;if(!zones.length||!value)return null;
  return zones.find(function(z){return String(z.id||z.area||z.name_en||"")===value})||null
}
function quote(){
  var d=deliverySettings(),z=selectedZone()||{},sub=subtotal(),disc=rewardDiscount(),available=d.enabled!==false,basis=(z.eligibility_basis||d.eligibilityBasis)==="after_discount"?"after_discount":"before_discount";
  var eligible=basis==="after_discount"?Math.max(0,sub-disc):sub;
  var fee=Math.max(0,Number(z.fee!=null?z.fee:d.fee)||0);
  var threshold=Math.max(0,Number(z.free_delivery_threshold!=null?z.free_delivery_threshold:(z.freeAbove!=null?z.freeAbove:d.freeAbove))||50);
  var minimum=Math.max(0,Number(z.minimum_order!=null?z.minimum_order:(z.minimum!=null?z.minimum:d.minimum))||0);
  var freeEnabled=z.free_enabled!=null?z.free_enabled:(d.freeEnabled!==false);
  if(freeEnabled&&threshold>0&&eligible>=threshold)fee=0;
  return {available:available,fee:fee,threshold:threshold,minimum:minimum,eligible:eligible,free:available&&freeEnabled&&threshold>0&&eligible>=threshold}
}
function setLang(next){
  state.lang=next==="ar"?"ar":"en";try{localStorage.setItem(LANG_KEY,state.lang)}catch{}
  document.documentElement.lang=state.lang;document.documentElement.dir=state.lang==="ar"?"rtl":"ltr";
  document.querySelectorAll("[data-commerce-lang]").forEach(function(b){b.classList.toggle("is-active",b.dataset.commerceLang===state.lang)});
  var t=T[state.lang];document.querySelectorAll("[data-i18n]").forEach(function(el){var k=el.dataset.i18n;if(t[k]!=null)el.textContent=t[k]});
  document.querySelectorAll("[data-i18n-html]").forEach(function(el){var k=el.dataset.i18nHtml;if(t[k]!=null)el.innerHTML=t[k]});
  renderAll()
}
function phoneSupport(){
  var number="96181581230";
  try{var settings=window.ZWM_CMS&&window.ZWM_CMS.getSettings&&window.ZWM_CMS.getSettings();number=String(settings&&settings.contact&&settings.contact.whatsapp||number).replace(/\D/g,"")}catch{}
  $("checkoutSupport").href="https://wa.me/"+number+"?text="+encodeURIComponent(state.lang==="ar"?"مرحباً، أحتاج مساعدة لإتمام طلبي عبر الموقع.":"Hi, I need help completing my website order.")
}
function renderIdentity(){
  var box=$("checkoutIdentity"),m=state.dashboard&&state.dashboard.member;
  if(m){
    box.innerHTML='<div class="checkout-identity"><span>🌿</span><div><strong>'+esc(state.lang==="ar"?"مسجّل الدخول باسم "+(m.name||""):"Signed in as "+(m.name||""))+'</strong><small>'+esc(state.lang==="ar"?"سيُربط الطلب بحسابك ونقاط المونة.":"This order will be linked to your account and Mouneh Points.")+'</small></div></div>';
    if(!$("checkoutName").value)$("checkoutName").value=m.name||"";
    if(!$("checkoutPhone").value)$("checkoutPhone").value=m.phone||"";
    if(!$("checkoutEmail").value)$("checkoutEmail").value=state.authUser&&state.authUser.email||"";
    $("saveAddressWrap").hidden=false
  }else{
    box.innerHTML='<div class="checkout-identity"><span>🌿</span><div><strong>'+esc(state.lang==="ar"?"يمكنك الطلب كضيف.":"Guest checkout is available.")+'</strong><small>'+esc(state.lang==="ar"?"سجّل الدخول لكسب النقاط وحفظ العناوين وتتبع الطلبات بسهولة أكبر.":"Sign in to earn points, save addresses and track orders more easily.")+'</small></div></div>'
  }
}
function renderZones(){
  var zones=activeZones(),select=$("checkoutZone"),selectWrap=$("zoneSelectWrap"),areaWrap=$("areaInputWrap");
  if(zones.length){
    selectWrap.hidden=false;areaWrap.hidden=true;
    var old=select.value;
    select.innerHTML='<option value="">'+esc(state.lang==="ar"?"اختر المنطقة":"Choose area")+'</option>'+zones.map(function(z){var id=String(z.id||z.area||z.name_en||"");var name=state.lang==="ar"?(z.name_ar||z.area||z.name_en):(z.name_en||z.area||z.name_ar);return '<option value="'+esc(id)+'">'+esc(name||id)+'</option>'}).join("");
    if(zones.some(function(z){return String(z.id||z.area||z.name_en||"")===old}))select.value=old
  }else{selectWrap.hidden=true;areaWrap.hidden=false}
}
function renderAddresses(){
  var wrap=$("savedAddressWrap"),sel=$("savedAddressSelect");if(!state.dashboard||!state.addresses.length){wrap.hidden=true;return}
  wrap.hidden=false;var current=sel.value;sel.innerHTML='<option value="">'+esc(state.lang==="ar"?"اختر عنواناً محفوظاً":"Choose saved address")+'</option>'+state.addresses.map(function(a){return '<option value="'+esc(a.id)+'">'+esc((a.label||"Address")+" · "+(a.area||""))+'</option>'}).join("");if(state.addresses.some(function(a){return a.id===current}))sel.value=current
}
function renderRewards(){
  var box=$("checkoutRewards"),m=state.dashboard&&state.dashboard.member,sub=subtotal();
  if(!m){
    var base=Number(state.publicRewards&&state.publicRewards.config&&state.publicRewards.config.base_rate||1),estimate=Math.floor(sub*base);
    box.innerHTML='<div class="reward-guest"><div><strong>'+esc(state.lang==="ar"?"اكسب تقريباً "+estimate+" 🌿 نقطة":"Earn about "+estimate+" 🌿 Mouneh Points")+'</strong><small>'+esc(state.lang==="ar"?"سجّل الدخول قبل إرسال الطلب لربطه بحسابك.":"Sign in before placing the order to link it to your account.")+'</small></div><a href="/account?auth=signin">'+esc(state.lang==="ar"?"تسجيل الدخول":"Sign in")+'</a></div>';return
  }
  var wallet=(state.dashboard.wallet||[]).filter(function(w){return w.status==="available"&&sub>=Number(w.minimum||0)}),tier=m.tier==="golden"?1.5:m.tier==="olive"?1.25:1,base=Number(state.publicRewards&&state.publicRewards.config&&state.publicRewards.config.base_rate||1),estimate=Math.floor(sub*base*tier);
  if(state.walletId&&!wallet.some(function(w){return w.id===state.walletId})){state.walletId="";remove(WALLET_KEY)}
  box.innerHTML='<div class="reward-balance"><div><strong>'+esc(Number(m.balance||0).toLocaleString()+" 🌿 "+(state.lang==="ar"?"نقطة":"points"))+'</strong><small>'+esc(state.lang==="ar"?"حوالي "+estimate+" نقطة بعد التسليم":"About "+estimate+" points after delivery")+'</small></div><a href="/account#points">'+esc(state.lang==="ar"?"المحفظة":"Wallet")+'</a></div>'+
    (wallet.length?'<label class="commerce-field"><span>'+esc(state.lang==="ar"?"استخدم قسيمة مكافأة":"Use a reward voucher")+'</span><select id="checkoutWallet"><option value="">'+esc(state.lang==="ar"?"بدون قسيمة":"No voucher")+'</option>'+wallet.map(function(w){return '<option value="'+esc(w.id)+'" '+(w.id===state.walletId?"selected":"")+">"+esc(money(w.value)+" "+(state.lang==="ar"?"خصم · حد أدنى ":"off · min ")+money(w.minimum))+"</option>"}).join("")+'</select></label>':'<small class="checkout-help">'+esc(state.lang==="ar"?"لا توجد قسيمة متاحة لهذه السلة حالياً.":"No reward voucher is available for this basket yet.")+'</small>');
  var select=$("checkoutWallet");if(select)select.onchange=function(){state.walletId=select.value;if(state.walletId)write(WALLET_KEY,state.walletId);else remove(WALLET_KEY);renderSummary()}
}
function renderSummary(){
  var box=$("summaryItems"),sub=subtotal(),disc=rewardDiscount(),q=quote(),total=Math.max(0,sub-disc)+q.fee,qty=state.rows.reduce(function(n,r){return n+r.qty},0);
  $("summaryCount").textContent=qty+" "+(state.lang==="ar"?"قطعة":"item"+(qty===1?"":"s"));
  box.innerHTML=state.rows.map(function(r){var name=state.lang==="ar"?(r.p.nameAr||r.p.nameEn):(r.p.nameEn||r.p.nameAr),size=state.lang==="ar"?(r.v.sizeAr||r.v.sizeEn):(r.v.sizeEn||r.v.sizeAr);return '<div class="summary-item"><div><strong>'+esc(name)+'</strong><small>'+esc(size)+" · "+(state.lang==="ar"?"الكمية ":"Qty ")+r.qty+(r.available?"":(" · "+(state.lang==="ar"?"غير متوفر":"Unavailable")))+'</small></div><b>'+money(Number(r.v.price)*r.qty)+'</b></div>'}).join("");
  $("summarySubtotal").textContent=money(sub);$("summaryRewardRow").hidden=disc<=0;$("summaryReward").textContent="-"+money(disc);$("summaryDelivery").textContent=q.fee===0?(state.lang==="ar"?"مجاني":"Free"):money(q.fee);$("summaryTotal").textContent=money(total);
  var remain=Math.max(0,q.threshold-q.eligible),pct=q.threshold>0?Math.min(100,q.eligible/q.threshold*100):100;
  $("freeDeliveryBox").innerHTML='<strong>'+esc(!q.available?(state.lang==="ar"?"التوصيل متوقف مؤقتاً":"Delivery is temporarily paused"):q.free?(state.lang==="ar"?"حصلت على التوصيل المجاني ✓":"You unlocked FREE delivery ✓"):(state.lang==="ar"?"أضف "+money(remain)+" للتوصيل المجاني":"Add "+money(remain)+" more for FREE delivery 🚚"))+'</strong><div class="free-delivery-track"><span style="width:'+pct+'%"></span></div>'+(q.minimum>0?'<small>'+esc((state.lang==="ar"?"الحد الأدنى للطلب ":"Minimum order ")+money(q.minimum))+'</small>':'');
  var btn=$("placeOrderButton");btn.textContent=(state.lang==="ar"?"إرسال الطلب — ":"Place Order — ")+money(total);btn.disabled=state.busy||!q.available||!state.rows.length||state.rows.some(function(r){return !r.available})
}
function renderGiftFields(){
  var box=$("giftCheckoutFields");if(!box)return;
  box.hidden=state.kind!=="gift";
  if(state.kind==="gift"){
    $("checkoutRecipientName").required=true;
    if(!$("checkoutRecipientName").value)$("checkoutRecipientName").value=state.giftMeta.recipient||"";
    if(!$("checkoutName").value)$("checkoutName").value=state.giftMeta.sender||"";
    if(!$("checkoutArea").value)$("checkoutArea").value=state.giftMeta.area||"";
    var intro=document.querySelector(".commerce-intro h1");if(intro)intro.textContent=state.lang==="ar"?"إتمام طلب الهدية":"Gift checkout";
  }
}
function renderAll(){if(!$("nativeCheckoutForm")||!state.rows.length)return;renderIdentity();renderGiftFields();renderZones();renderAddresses();renderRewards();renderSummary();phoneSupport()}
function addressPayload(){
  var z=selectedZone(),area=z?(z.name_en||z.area||z.name_ar||$("checkoutZone").value):$("checkoutArea").value.trim();
  return {zone_id:z?String(z.id||z.area||z.name_en||""):"",area:area,street:$("checkoutStreet").value.trim(),building:$("checkoutBuilding").value.trim(),floor_apartment:$("checkoutFloor").value.trim(),landmark:$("checkoutLandmark").value.trim(),instructions:$("checkoutInstructions").value.trim(),recipient_name:state.kind==="gift"?$("checkoutRecipientName").value.trim():"",recipient_phone:state.kind==="gift"?$("checkoutRecipientPhone").value.trim():""}
}
function fillAddress(a){
  if(!a)return;$("checkoutArea").value=a.area||"";$("checkoutStreet").value=a.street||a.address||"";$("checkoutBuilding").value=a.building||"";$("checkoutFloor").value=a.floor_apartment||"";$("checkoutLandmark").value=a.landmark||"";$("checkoutInstructions").value=a.delivery_notes||"";
  var zones=activeZones(),match=zones.find(function(z){return String(z.id||z.area||z.name_en||"")===String(a.area||"")||String(z.area||z.name_en||"").toLowerCase()===String(a.area||"").toLowerCase()});if(match)$("checkoutZone").value=String(match.id||match.area||match.name_en||"");renderSummary()
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
function friendlyError(err){
  var msg=String(err&&err.message||err||"");if(state.lang!=="ar")return msg;
  var map=[["Please accept","يرجى الموافقة على الشروط وسياسة الخصوصية."],["full name","يرجى إدخال الاسم الكامل."],["valid phone","يرجى إدخال رقم هاتف صحيح."],["delivery area","يرجى إدخال منطقة التوصيل."],["street or neighborhood","يرجى إدخال الشارع أو الحي."],["building or residence","يرجى إدخال المبنى أو السكن."],["no longer available","أحد المنتجات لم يعد متوفراً. راجع السلة."],["Prices changed","تغيّر سعر أحد المنتجات. راجع السلة قبل الطلب."],["Minimum order","لم تصل السلة إلى الحد الأدنى للطلب."],["Reward unavailable","المكافأة لم تعد متاحة لهذه السلة."],["unavailable in this area","التوصيل غير متاح حالياً في هذه المنطقة."]];for(var i=0;i<map.length;i++)if(msg.toLowerCase().includes(map[i][0].toLowerCase()))return map[i][1];return msg
}
async function maybeSaveAddress(){
  if(!state.dashboard||!$("saveAddress").checked)return;
  var d=addressPayload();await rpc("mouneh_addresses",{action:"upsert",p:{label:state.lang==="ar"?"المنزل":"Home",area:d.area,street:d.street,building:d.building,floor_apartment:d.floor_apartment,landmark:d.landmark,delivery_notes:d.instructions,is_default:state.addresses.length===0}})
}
async function submit(e){
  e.preventDefault();if(state.busy)return;var form=$("nativeCheckoutForm");if(!form.reportValidity())return;
  var d=addressPayload(),zones=activeZones();if(zones.length&&!$("checkoutZone").value){$("checkoutStatus").textContent=state.lang==="ar"?"اختر منطقة التوصيل.":"Please choose a delivery area.";return}
  var q=quote();if(!q.available){$("checkoutStatus").textContent=state.lang==="ar"?"التوصيل متوقف مؤقتاً. تواصل معنا للمساعدة.":"Delivery is temporarily paused. Contact us for help.";return}if(q.minimum>0&&q.eligible<q.minimum){$("checkoutStatus").textContent=(state.lang==="ar"?"الحد الأدنى للطلب هو ":"Minimum order is ")+money(q.minimum)+".";return}
  if(state.rows.some(function(r){return !r.available})){$("checkoutStatus").textContent=state.lang==="ar"?"هناك منتج غير متوفر. عد إلى السلة لمراجعته.":"One item is no longer available. Return to your cart to review it.";return}
  state.busy=true;renderSummary();var btn=$("placeOrderButton"),old=btn.textContent;btn.textContent=state.lang==="ar"?"جارٍ إرسال الطلب…":"Placing order…";$("checkoutStatus").textContent="";
  try{
    try{await maybeSaveAddress()}catch{}
    var a=checkoutAttempt(),payload={kind:state.kind,checkout_version:1,request_id:a.request_id,claim_token:a.claim_token,customer_name:$("checkoutName").value.trim(),customer_phone:$("checkoutPhone").value.trim(),customer_email:$("checkoutEmail").value.trim(),area:d.area,delivery:d,notes:$("checkoutNotes").value.trim()||(state.kind==="gift"?(state.giftMeta.message||""):""),language:state.lang,payment_method:"cash_on_delivery",terms_accepted:$("checkoutTerms").checked,terms_version:state.config.terms_version||"2026-10-04-native-commerce-v1",wallet_id:state.walletId||undefined,items:state.rows.map(function(r){return {product_id:r.p.id,variant_id:r.v.id,qty:r.qty,unit_price:Number(r.v.price),subtotal:Number(r.v.price)*r.qty}}),extra:Object.assign({products_subtotal:subtotal()},state.kind==="gift"?{source:"gift_builder",recipient:d.recipient_name,recipient_phone:d.recipient_phone,occasion:state.giftMeta.occasion||"",packing:state.giftMeta.packing||"",theme:state.giftMeta.theme||"",card_language:state.giftMeta.card_language||"",hide_prices:state.giftMeta.hide_prices!==false,gift_message:state.giftMeta.message||""}:{}),session_id:(window.ZWM_CMS&&window.ZWM_CMS.sessionId&&window.ZWM_CMS.sessionId())||""};
    var result;try{result=await rpc("zwm_checkout",{action:"submit",p:payload})}catch(err){if(/fetch|network/i.test(String(err.message||"")))result=await rpc("zwm_checkout",{action:"submit",p:payload});else throw err}
    if(!result||!result.reference)throw new Error(state.lang==="ar"?"تعذّر إنشاء الطلب.":"Could not create the order.");
    if(result.claim_token)saveClaim(result.reference,result.claim_token);
    remove(state.kind==="gift"?GIFT_KEY:CART_KEY);remove(WALLET_KEY);try{sessionStorage.removeItem(REQUEST_KEY);sessionStorage.removeItem(GIFT_META_KEY)}catch{}
    location.replace("/order.html?ref="+encodeURIComponent(result.reference)+"&new=1")
  }catch(err){$("checkoutStatus").textContent=friendlyError(err);state.busy=false;renderSummary();btn.textContent=old}
}
async function init(){
  state.kind=new URL(location.href).searchParams.get("kind")==="gift"?"gift":"order";try{state.giftMeta=JSON.parse(sessionStorage.getItem(GIFT_META_KEY)||"{}")||{}}catch{state.giftMeta={}}
  state.lang=(function(){try{return localStorage.getItem(LANG_KEY)==="ar"?"ar":"en"}catch{return "en"}})();
  setLang(state.lang);
  state.cart=read(CART_KEY,{})||{};
  await Promise.all([loadOverrides(),rpc("zwm_checkout",{action:"config",p:{}}).then(function(x){state.config=x}),rpc("mouneh_api",{action:"public",p:{}}).then(function(x){state.publicRewards=x;}).catch(function(){state.publicRewards={config:{base_rate:1}}}),authUser().then(function(x){state.authUser=x})]);
  rebuildRows();
  if(!state.rows.length){$("nativeCheckoutForm").hidden=true;$("checkoutEmpty").hidden=false;return}
  if(session()){
    try{state.dashboard=await rpc("mouneh_api",{action:"dashboard",p:{}})}catch{}
    if(state.dashboard){try{state.addresses=await rpc("mouneh_addresses",{action:"list",p:{}})||[]}catch{}}
  }
  state.walletId=String(read(WALLET_KEY,"")||"");
  renderAll();
  window.ZWM_CMS&&window.ZWM_CMS.track&&window.ZWM_CMS.track("checkout_started",{items:state.rows.length,signed_in:!!state.dashboard});
  document.querySelectorAll("[data-commerce-lang]").forEach(function(b){b.addEventListener("click",function(){setLang(b.dataset.commerceLang)})});
  $("nativeCheckoutForm").addEventListener("submit",submit);
  $("savedAddressSelect").addEventListener("change",function(){var a=state.addresses.find(function(x){return x.id===$("savedAddressSelect").value});fillAddress(a)});
  $("clearSavedAddress").addEventListener("click",function(){$("savedAddressSelect").value="";["checkoutArea","checkoutStreet","checkoutBuilding","checkoutFloor","checkoutLandmark","checkoutInstructions"].forEach(function(id){$(id).value=""});renderSummary()});
  ["checkoutZone","checkoutArea","checkoutStreet","checkoutBuilding"].forEach(function(id){var el=$(id);if(el)el.addEventListener("input",renderSummary)});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init()
})();
