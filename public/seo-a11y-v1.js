(function(){
"use strict";
if(window.__ZWM_SEO_A11Y_V1__)return;
window.__ZWM_SEO_A11Y_V1__=true;

var ORIGIN="https://zaytwmouneh.com";
var LOCALE_KEY="zwm-locale-v3";
var LANG_KEY="zwm-lang-v2";
var FR_KEY="zwm:french:v1";
var DEFAULT_IMAGE=ORIGIN+"/assets/products/originals/extra-virgin-olive-oil.jpg";
var INDEXABLE={"/":1,"/shop":1,"/gift":1,"/recipes":1,"/about":1,"/contact":1,"/wholesale":1,"/privacy":1,"/terms":1};
var CLEAN_ALIASES={
  "/index.html":"/","/index":"/",
  "/shop.html":"/shop","/gift.html":"/gift","/recipes.html":"/recipes",
  "/about.html":"/about","/contact.html":"/contact","/wholesale.html":"/wholesale",
  "/privacy.html":"/privacy","/privacy-policy.html":"/privacy","/privacy-and-data.html":"/privacy",
  "/terms.html":"/terms","/terms-of-service.html":"/terms","/terms-and-rewards.html":"/terms",
  "/account.html":"/account","/checkout.html":"/checkout","/order.html":"/order"
};
function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function del(k){try{localStorage.removeItem(k)}catch(e){}}
function localeFromPath(){
  var m=location.pathname.match(/^\/(ar|fr)(?:\/|$)/);
  return m?m[1]:null;
}
function syncLocale(code){
  if(code!=="ar"&&code!=="fr"&&code!=="en")return;
  set(LOCALE_KEY,code);
  if(code==="fr"){set(FR_KEY,"1");set(LANG_KEY,"en")}
  else{del(FR_KEY);set(LANG_KEY,code)}
  document.documentElement.lang=code;
  document.documentElement.dir=code==="ar"?"rtl":"ltr";
}
var routeLocale=localeFromPath();
if(routeLocale)syncLocale(routeLocale);

function activeLocale(){
  if(window.ZWM_LOCALE&&typeof window.ZWM_LOCALE.get==="function"){
    var z=window.ZWM_LOCALE.get(); if(z==="ar"||z==="fr")return z;
  }
  var p=localeFromPath(); if(p)return p;
  var stored=get(LOCALE_KEY); if(stored==="ar"||stored==="fr")return stored;
  return document.documentElement.lang==="ar"?"ar":"en";
}
function stripLocale(path){
  path=path||"/";
  return path.replace(/^\/(ar|fr)(?=\/|$)/,"")||"/";
}
function cleanPath(path){
  path=stripLocale(path||"/");
  if(CLEAN_ALIASES[path])return CLEAN_ALIASES[path];
  if(path.length>1&&path.endsWith("/"))path=path.slice(0,-1);
  return path||"/";
}
function localizedPath(path,locale){
  path=cleanPath(path);
  if(locale==="ar"||locale==="fr")return "/"+locale+(path==="/"?"/":path);
  return path;
}
function canonicalPath(locale){
  var path=cleanPath(location.pathname);
  if(/^\/product\/[^/]+$/.test(path))return localizedPath(path,locale);
  if(INDEXABLE[path])return localizedPath(path,locale);
  return path;
}
function upsertMeta(selector,attrs){
  var el=document.head.querySelector(selector);
  if(!el){el=document.createElement("meta");document.head.appendChild(el)}
  Object.keys(attrs).forEach(function(k){el.setAttribute(k,attrs[k])});
  return el;
}
function upsertLink(hreflang,href){
  var selector='link[rel="alternate"][hreflang="'+hreflang+'"]';
  var el=document.head.querySelector(selector);
  if(!el){el=document.createElement("link");el.rel="alternate";el.hreflang=hreflang;document.head.appendChild(el)}
  el.href=href;
}
function updateSeo(){
  var locale=activeLocale();
  var path=canonicalPath(locale);
  var canonical=ORIGIN+path;
  var can=document.head.querySelector('link[rel="canonical"]');
  if(!can){can=document.createElement("link");can.rel="canonical";document.head.appendChild(can)}
  can.href=canonical;
  var basePath=cleanPath(location.pathname);
  if(INDEXABLE[basePath]||/^\/product\/[^/]+$/.test(basePath)){
    upsertLink("en-LB",ORIGIN+localizedPath(basePath,"en"));
    upsertLink("ar-LB",ORIGIN+localizedPath(basePath,"ar"));
    upsertLink("fr-LB",ORIGIN+localizedPath(basePath,"fr"));
    upsertLink("x-default",ORIGIN+localizedPath(basePath,"en"));
  }
  var desc=document.head.querySelector('meta[name="description"]');
  var title=(document.title||"Zayt w Mouneh").trim();
  var description=desc?desc.content:"Authentic Lebanese pantry essentials, mouneh and gifts with delivery across Lebanon.";
  upsertMeta('meta[property="og:title"]',{property:"og:title",content:title});
  upsertMeta('meta[property="og:description"]',{property:"og:description",content:description});
  upsertMeta('meta[property="og:type"]',{property:"og:type",content:/^\/product\//.test(basePath)?"product":"website"});
  upsertMeta('meta[property="og:url"]',{property:"og:url",content:canonical});
  upsertMeta('meta[property="og:locale"]',{property:"og:locale",content:locale==="ar"?"ar_LB":locale==="fr"?"fr_LB":"en_LB"});
  if(basePath.indexOf("/product/")!==0){
  upsertMeta('meta[property="og:image"]',{property:"og:image",content:DEFAULT_IMAGE});
  upsertMeta('meta[property="og:image:width"]',{property:"og:image:width",content:"1024"});
  upsertMeta('meta[property="og:image:height"]',{property:"og:image:height",content:"1536"});
  upsertMeta('meta[property="og:image:alt"]',{property:"og:image:alt",content:"Zayt w Mouneh Lebanese pantry"});
  upsertMeta('meta[name="twitter:card"]',{name:"twitter:card",content:"summary_large_image"});
  upsertMeta('meta[name="twitter:title"]',{name:"twitter:title",content:title});
  upsertMeta('meta[name="twitter:description"]',{name:"twitter:description",content:description});
  upsertMeta('meta[name="twitter:image"]',{name:"twitter:image",content:DEFAULT_IMAGE});
  }
}
function normalizeInternalLinks(root){
  var locale=activeLocale();
  (root||document).querySelectorAll("a[href]").forEach(function(a){
    var raw=a.getAttribute("href");
    if(!raw||raw[0]==="#"||/^(mailto:|tel:|sms:|whatsapp:|javascript:|data:)/i.test(raw))return;
    var u;try{u=new URL(raw,location.origin)}catch(e){return}
    if(u.origin!==location.origin)return;
    var path=cleanPath(u.pathname);
    if(/^\/admin(?:\.html)?$/.test(path))return;
    var localizable=INDEXABLE[path]||/^\/(product\/[^/]+|account|checkout|order)$/.test(path);
    if(localizable)u.pathname=localizedPath(path,locale);
    else u.pathname=path;
    a.setAttribute("href",u.pathname+u.search+u.hash);
  });
}
function wholesaleLabel(locale,shortLabel){
  if(locale==="ar")return shortLabel?"الجملة والأعمال":"طلبات الجملة والأعمال";
  if(locale==="fr")return shortLabel?"Grossiste & Pro":"Commandes en gros & professionnelles";
  return shortLabel?"Wholesale & Business":"Wholesale & Business Orders";
}
function ensureWholesaleLinks(){
  if(cleanPath(location.pathname)==="/wholesale")return;
  var locale=activeLocale();
  var nav=document.getElementById("navLinks");
  if(nav){
    var navLink=nav.querySelector("[data-wholesale-link]");
    if(!navLink){
      navLink=document.createElement("a");
      navLink.setAttribute("data-wholesale-link","nav");
      navLink.className="nav-wholesale-link";
      navLink.innerHTML='<span>07</span><strong data-wholesale-label></strong><b>↗</b>';
      var utility=nav.querySelector(".menu-utility");
      if(utility)nav.insertBefore(navLink,utility);else nav.appendChild(navLink);
    }
    navLink.href=localizedPath("/wholesale",locale);
    var navLabel=navLink.querySelector("[data-wholesale-label]");
    if(navLabel)navLabel.textContent=wholesaleLabel(locale,true);
    else navLink.textContent=wholesaleLabel(locale,true);
  }
  var footer=document.querySelector(".footer-column");
  if(footer){
    var foot=footer.querySelector("[data-wholesale-footer]");
    if(!foot){
      foot=document.createElement("a");
      foot.setAttribute("data-wholesale-footer","1");
      footer.appendChild(foot);
    }
    foot.href=localizedPath("/wholesale",locale);
    foot.textContent=wholesaleLabel(locale,false);
  }
}
function ensureSkipLink(){
  var main=document.querySelector("main");
  if(!main)return;
  if(!main.id)main.id="main-content";
  var link=document.getElementById("skipLink")||document.querySelector(".zwm-skip-link");
  if(!link){
    link=document.createElement("a");
    link.className="zwm-skip-link";
    link.href="#"+main.id;
    link.textContent=activeLocale()==="ar"?"الانتقال إلى المحتوى":activeLocale()==="fr"?"Aller au contenu":"Skip to content";
    document.body.insertBefore(link,document.body.firstChild);
  }else{
    link.classList.add("zwm-skip-link");
    link.href="#"+main.id;
  }
}
function tuneMedia(){
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData=navigator.connection&&navigator.connection.saveData;
  document.querySelectorAll("img").forEach(function(img,i){
    if(!img.hasAttribute("decoding"))img.setAttribute("decoding","async");
    if(i>2&&!img.closest(".site-header,.commerce-header,.c6-product-header,.hero,.page-intro")&&!img.hasAttribute("loading"))img.setAttribute("loading","lazy");
  });
  document.querySelectorAll("video").forEach(function(video){
    if(video.getAttribute("preload")==="auto"&&(saveData||innerWidth<768))video.setAttribute("preload","metadata");
    if(reduce&&video.autoplay){video.autoplay=false;try{video.pause()}catch(e){}}
  });
}
function installDialogFocus(){
  var activeDialog=null,returnFocus=null,raf=0;
  var cart=document.getElementById("cartDrawer");
  if(cart){
    cart.setAttribute("role","dialog");
    cart.setAttribute("aria-modal","true");
    if(document.getElementById("cartTitle"))cart.setAttribute("aria-labelledby","cartTitle");
  }
  function visible(dialog){
    if(!dialog||dialog.hidden||dialog.closest("[hidden]"))return false;
    var host=dialog.closest('[aria-hidden="true"]');if(host)return false;
    var style=getComputedStyle(dialog);return style.display!=="none"&&style.visibility!=="hidden"&&dialog.getClientRects().length>0;
  }
  function current(){
    var dialogs=Array.prototype.slice.call(document.querySelectorAll('[role="dialog"][aria-modal="true"]')).filter(visible);
    return dialogs.length?dialogs[dialogs.length-1]:null;
  }
  function focusable(dialog){
    return Array.prototype.slice.call(dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')).filter(function(el){
      return !el.hidden&&!el.closest("[hidden]")&&getComputedStyle(el).visibility!=="hidden"&&el.getClientRects().length>0;
    });
  }
  function refresh(){
    raf=0;var next=current();
    if(next===activeDialog)return;
    var prior=activeDialog,restore=returnFocus;
    activeDialog=next;
    if(next){
      if(!prior||!prior.contains(document.activeElement))returnFocus=document.activeElement;
      var targets=focusable(next),target=targets[0]||next;
      if(!targets.length&&!next.hasAttribute("tabindex"))next.setAttribute("tabindex","-1");
      setTimeout(function(){if(activeDialog===next&&!next.contains(document.activeElement))try{target.focus({preventScroll:true})}catch(e){target.focus()}},0);
    }else if(prior&&restore&&restore.isConnected){
      setTimeout(function(){try{restore.focus({preventScroll:true})}catch(e){try{restore.focus()}catch(x){}}},0);
      returnFocus=null;
    }
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(refresh)}
  document.addEventListener("keydown",function(e){
    refresh();
    if(!activeDialog||e.key!=="Tab")return;
    var items=focusable(activeDialog);
    if(!items.length){e.preventDefault();activeDialog.focus();return}
    var first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  },true);
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["aria-hidden","hidden","class","open"]});
  schedule();
}
function syncUrlToLocale(code){
  if(code!=="ar"&&code!=="fr"&&code!=="en")return;
  var path=cleanPath(location.pathname);
  var next=localizedPath(path,code);
  if(next!==location.pathname)history.replaceState(history.state,"",next+location.search+location.hash);
  updateSeo();ensureWholesaleLinks();normalizeInternalLinks(document);
}
document.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest("[data-lang],[data-commerce-lang],[data-c6-lang]");
  if(!b)return;
  var code=b.getAttribute("data-lang")||b.getAttribute("data-commerce-lang")||b.getAttribute("data-c6-lang");
  setTimeout(function(){syncUrlToLocale(code)},80);
},true);
document.addEventListener("zwm:seo-refresh",function(){updateSeo();ensureWholesaleLinks();normalizeInternalLinks(document)});
document.addEventListener("DOMContentLoaded",function(){
  ensureSkipLink();ensureWholesaleLinks();normalizeInternalLinks(document);tuneMedia();updateSeo();installDialogFocus();
  var mo=new MutationObserver(function(list){
    var relevant=list.some(function(m){return m.type==="childList"||m.type==="attributes"});
    if(relevant){clearTimeout(mo._t);mo._t=setTimeout(function(){normalizeInternalLinks(document);updateSeo()},120)}
  });
  mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["lang","dir"]});
  setTimeout(function(){mo.disconnect()},12000);
});
})();