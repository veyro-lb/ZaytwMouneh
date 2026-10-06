(function(){
"use strict";
if(window.__ZWM_LOCALE_V4__)return;
window.__ZWM_LOCALE_V4__=true;

var KEY="zwm-locale-v3";
var LEGACY_FR="zwm:french:v1";
var LEGACY_KEYS=["zwm-lang-v2","zwm-language","zwm:lang"];
var SUPPORTED=["en","ar","fr"];
var listeners=new Set();
var namespaces=Object.create(null);
var frenchTranslator=null;

var CORE={
  en:{
    common:{language:"Language",close:"Close",loading:"Loading…",error:"Something went wrong.",retry:"Retry"},
    status:{
      order:{new:"Order received",confirmed:"Confirmed",preparing:"Preparing",out_for_delivery:"Out for delivery",delivered:"Delivered",cancelled:"Cancelled"},
      payment:{pending:"Payment pending",paid:"Payment received",failed:"Payment failed",refunded:"Refunded",partially_refunded:"Partially refunded",not_required:"No payment required"},
      wholesale:{new:"Request received",contacted:"Contacted",needs_information:"Needs information",quote_preparing:"Quote in preparation",quote_sent:"Quote sent",negotiating:"In discussion",approved:"Approved",converted:"Completed",lost:"Closed",archived:"Archived"}
    }
  },
  ar:{
    common:{language:"اللغة",close:"إغلاق",loading:"جارٍ التحميل…",error:"حدث خطأ.",retry:"إعادة المحاولة"},
    status:{
      order:{new:"تم استلام الطلب",confirmed:"تم التأكيد",preparing:"قيد التحضير",out_for_delivery:"خرج للتوصيل",delivered:"تم التسليم",cancelled:"ملغى"},
      payment:{pending:"الدفع معلّق",paid:"تم استلام الدفع",failed:"فشل الدفع",refunded:"تم رد المبلغ",partially_refunded:"تم رد جزء من المبلغ",not_required:"لا يتطلب دفعاً"},
      wholesale:{new:"تم استلام الطلب",contacted:"تم التواصل",needs_information:"يحتاج معلومات إضافية",quote_preparing:"يتم تحضير العرض",quote_sent:"تم إرسال العرض",negotiating:"قيد المناقشة",approved:"تمت الموافقة",converted:"مكتمل",lost:"مغلق",archived:"مؤرشف"}
    }
  },
  fr:{
    common:{language:"Langue",close:"Fermer",loading:"Chargement…",error:"Un problème est survenu.",retry:"Réessayer"},
    status:{
      order:{new:"Commande reçue",confirmed:"Confirmée",preparing:"En préparation",out_for_delivery:"En livraison",delivered:"Livrée",cancelled:"Annulée"},
      payment:{pending:"Paiement en attente",paid:"Paiement reçu",failed:"Échec du paiement",refunded:"Remboursé",partially_refunded:"Partiellement remboursé",not_required:"Aucun paiement requis"},
      wholesale:{new:"Demande reçue",contacted:"Contact effectué",needs_information:"Informations requises",quote_preparing:"Devis en préparation",quote_sent:"Devis envoyé",negotiating:"En discussion",approved:"Approuvée",converted:"Finalisée",lost:"Clôturée",archived:"Archivée"}
    }
  }
};
namespaces.core=CORE;

function storageGet(key){try{return localStorage.getItem(key)}catch(e){return null}}
function storageSet(key,value){try{localStorage.setItem(key,value)}catch(e){}}
function storageDel(key){try{localStorage.removeItem(key)}catch(e){}}
function normalize(code){return SUPPORTED.indexOf(code)>=0?code:"en"}
function localeFromPath(path){
  var m=String(path||location.pathname||"/").match(/^\/(ar|fr)(?:\/|$)/);
  return m?m[1]:null;
}
function inferLegacy(){
  if(storageGet(LEGACY_FR)==="1")return "fr";
  for(var i=0;i<LEGACY_KEYS.length;i++){
    var v=storageGet(LEGACY_KEYS[i]);
    if(v==="ar")return "ar";
    if(v==="fr")return "fr";
  }
  return "en";
}
function readStored(){
  var v=storageGet(KEY);
  return SUPPORTED.indexOf(v)>=0?v:null;
}
function initialLocale(){
  return localeFromPath(location.pathname)||readStored()||inferLegacy();
}
var active=normalize(initialLocale());

function applyDocument(code){
  var root=document.documentElement;
  if(!root)return;
  if(root.lang!==code)root.lang=code;
  var dir=code==="ar"?"rtl":"ltr";
  if(root.dir!==dir)root.dir=dir;
}
function persist(code){
  storageSet(KEY,code);
  storageDel(LEGACY_FR);
  LEGACY_KEYS.forEach(storageDel);
}
function stripLocale(pathname){
  var p=String(pathname||"/").replace(/^\/(ar|fr)(?=\/|$)/,"")||"/";
  if(p==="/index.html"||p==="/index")p="/";
  var aliases={
    "/shop.html":"/shop","/gift.html":"/gift","/recipes.html":"/recipes",
    "/about.html":"/about","/contact.html":"/contact","/wholesale.html":"/wholesale",
    "/privacy.html":"/privacy","/privacy-policy.html":"/privacy","/privacy-and-data.html":"/privacy",
    "/terms.html":"/terms","/terms-of-service.html":"/terms","/terms-and-rewards.html":"/terms",
    "/account.html":"/account","/checkout.html":"/checkout","/order.html":"/order","/product.html":"/product"
  };
  return aliases[p]||p;
}
function localePath(input,code){
  var next=normalize(code==null?active:code);
  var raw=String(input==null?(location.pathname+location.search+location.hash):input);
  var u;
  try{u=new URL(raw,location.origin)}catch(e){u=new URL("/",location.origin)}
  var path=stripLocale(u.pathname);
  if(next==="ar"||next==="fr")path="/"+next+(path==="/"?"/":path);
  return path+(u.search||"")+(u.hash||"");
}
function getDirection(code){return normalize(code==null?active:code)==="ar"?"rtl":"ltr"}
function emit(previous){
  var detail={locale:active,previous:previous,direction:getDirection(active)};
  try{window.dispatchEvent(new CustomEvent("zwm:locale-change",{detail:detail}))}catch(e){}
  listeners.forEach(function(cb){try{cb(detail)}catch(e){console.error(e)}});
}
function setLocale(code,options){
  var next=normalize(code);
  var opts=options||{};
  var previous=active;
  active=next;
  persist(next);
  applyDocument(next);
  if(previous!==next)emit(previous);
  if(opts.navigate===false)return next;
  var target=localePath(location.pathname+location.search+location.hash,next);
  var current=location.pathname+location.search+location.hash;
  if(target!==current){
    if(opts.replace)location.replace(target);else location.assign(target);
  }else if(opts.reload===true)location.reload();
  return next;
}
function onLocaleChange(cb){
  if(typeof cb!=="function")return function(){};
  listeners.add(cb);
  return function(){listeners.delete(cb)};
}
function register(namespace,dictionaries){
  if(!namespace||!dictionaries||typeof dictionaries!=="object")return false;
  namespaces[String(namespace)]=dictionaries;
  return true;
}
function pathValue(obj,path){
  var parts=String(path||"").split(".");
  var value=obj;
  for(var i=0;i<parts.length;i++){
    if(value==null)return undefined;
    value=value[parts[i]];
  }
  return value;
}
function interpolate(value,params){
  var text=String(value==null?"":value);
  if(!params||typeof params!=="object")return text;
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g,function(_,key){
    return Object.prototype.hasOwnProperty.call(params,key)?String(params[key]):"{"+key+"}";
  });
}
function t(key,params){
  var raw=String(key||"");
  var dot=raw.indexOf(".");
  var namespace=dot>0&&namespaces[raw.slice(0,dot)]?raw.slice(0,dot):"core";
  var localKey=namespace==="core"?raw:(raw.slice(dot+1));
  if(namespace==="core"&&raw.indexOf("core.")===0)localKey=raw.slice(5);
  var dict=namespaces[namespace]||{};
  var value=pathValue(dict[active],localKey);
  if(value==null)value=pathValue(dict.en,localKey);
  if(value==null)return "";
  return interpolate(value,params);
}
function registerFrenchTranslator(fn){
  if(typeof fn==="function")frenchTranslator=fn;
  return !!frenchTranslator;
}
function translate(value,code){
  var text=String(value==null?"":value);
  var target=normalize(code==null?active:code);
  if(target!=="fr"||!frenchTranslator)return text;
  try{return frenchTranslator(text)}catch(e){return text}
}
function formatNumber(value,options,code){
  var locale=normalize(code==null?active:code);
  try{return new Intl.NumberFormat(locale+"-LB",options||{}).format(value)}catch(e){return String(value)}
}
function formatDate(value,options,code){
  var locale=normalize(code==null?active:code);
  var d=value instanceof Date?value:new Date(value);
  if(!Number.isFinite(d.getTime()))return "";
  try{return new Intl.DateTimeFormat(locale+"-LB",options||{}).format(d)}catch(e){return d.toLocaleString()}
}
function plural(value,forms,code){
  var locale=normalize(code==null?active:code);
  var category="other";
  try{category=new Intl.PluralRules(locale).select(Number(value)||0)}catch(e){}
  return forms&&Object.prototype.hasOwnProperty.call(forms,category)?forms[category]:(forms&&forms.other)||"";
}

persist(active);
applyDocument(active);

window.ZWM_LOCALE=Object.freeze({
  key:KEY,
  supported:SUPPORTED.slice(),
  get:function(){return active},
  set:setLocale,
  is:function(code){return active===normalize(code)},
  getDirection:getDirection,
  localePath:localePath,
  stripLocale:stripLocale,
  onLocaleChange:onLocaleChange,
  register:register,
  registerFrenchTranslator:registerFrenchTranslator,
  t:t,
  translate:translate,
  formatNumber:formatNumber,
  formatDate:formatDate,
  plural:plural
});
})();