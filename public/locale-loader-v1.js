(function(){
"use strict";
if(window.__ZWM_LOCALE_LOADER_V1__)return;
window.__ZWM_LOCALE_LOADER_V1__=true;

var LOCALE_KEY="zwm-locale-v3";
var LANG_KEY="zwm-lang-v2";
var ADMIN_LANG_KEY="zwm:admin-lang:v1";
var FR_KEY="zwm:french:v1";
var WELCOME_KEY="zwm-welcome-seen-v3";
var HEAVY_SRC="/fr-runtime-v1.js?v=20261006-perf1";

function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function del(k){try{localStorage.removeItem(k)}catch(e){}}
function normalize(code){return code==="ar"||code==="fr"?code:"en"}
function pathLocale(){var m=location.pathname.match(/^\/(ar|fr)(?:\/|$)/);return m?m[1]:null}
function current(){
  var route=pathLocale();
  if(route)return route;
  var canonical=get(LOCALE_KEY);
  if(canonical==="en"||canonical==="ar"||canonical==="fr")return canonical;
  if(get(FR_KEY)==="1")return "fr";
  return get(LANG_KEY)==="ar"||get(ADMIN_LANG_KEY)==="ar"?"ar":"en";
}
function sync(code){
  var next=normalize(code);
  set(LOCALE_KEY,next);
  if(next==="fr"){set(FR_KEY,"1");set(LANG_KEY,"en");set(ADMIN_LANG_KEY,"en")}
  else{del(FR_KEY);set(LANG_KEY,next);set(ADMIN_LANG_KEY,next)}
  document.documentElement.lang=next;
  document.documentElement.dir=next==="ar"?"rtl":"ltr";
  return next;
}
var initial=sync(current());
window.ZWM_LOCALE={
  get:current,set:sync,is:function(code){return current()===normalize(code)},
  t:function(en,ar,fr){var l=current();return l==="ar"?(ar==null?en:ar):l==="fr"?(fr==null?en:fr):en},
  translate:function(value){return String(value==null?"":value)}
};
if(initial==="fr"){
  document.documentElement.classList.add("zwm-fr-loading");
  var early=document.createElement("style");
  early.id="zwmFrenchLoadingGuard";
  early.textContent="html.zwm-fr-loading body{visibility:hidden!important}";
  (document.head||document.documentElement).appendChild(early);
}
function addStyles(){
  if(document.getElementById("zwmLocaleLoaderStyles"))return;
  var st=document.createElement("style");st.id="zwmLocaleLoaderStyles";
  st.textContent=".fr-language-ready{position:relative;overflow:visible!important}.fr-language-ready>button:not(.fr-globe-toggle),.fr-language-ready [data-lang]:not(.fr-menu-choice),.fr-language-ready [data-commerce-lang]:not(.fr-menu-choice),.fr-language-ready [data-admin-lang]:not(.fr-menu-choice),.fr-language-ready [data-mobile-lang]:not(.fr-menu-choice){display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;height:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important}.fr-language-ready>.fr-globe-toggle{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;width:auto!important;height:36px!important;min-height:36px!important;padding:0 11px!important;border-radius:999px!important;line-height:1!important;cursor:pointer;white-space:nowrap!important}.fr-globe-toggle svg{width:18px;height:18px;display:block;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}.fr-globe-label{font:inherit;font-size:13px;font-weight:700;line-height:1}.fr-globe-menu{display:none!important;position:absolute;top:calc(100% + 8px);right:0;z-index:99999;min-width:142px;padding:6px;border:1px solid rgba(0,0,0,.12);border-radius:12px;background:#fff;color:#1f2b24;box-shadow:0 12px 30px rgba(0,0,0,.14)}.fr-globe-menu.is-open{display:grid!important;gap:3px}.fr-globe-menu button{display:block!important;width:100%!important;text-align:left!important;padding:9px 10px!important;border:0!important;border-radius:8px!important;background:transparent!important;color:inherit!important;cursor:pointer!important;font:inherit!important;line-height:1.2!important;white-space:nowrap!important}.fr-globe-menu button[dir=rtl]{text-align:right!important}.fr-globe-menu button:hover,.fr-globe-menu button:focus-visible{background:rgba(0,0,0,.05)!important}.fr-globe-menu button.is-active{font-weight:700!important;background:rgba(0,0,0,.07)!important}html[dir=rtl] .fr-globe-menu{right:auto;left:0}.mobile-menu-language-buttons.fr-language-ready{overflow:visible!important}.mobile-menu-language-buttons .fr-globe-menu{top:auto!important;bottom:calc(100% + 8px)!important;right:0!important;left:auto!important}.mobile-menu-language-buttons>.fr-globe-toggle{height:40px!important;min-height:40px!important;padding:0 11px!important}.mobile-menu-language-buttons .fr-globe-label{font-size:12px!important}.mobile-menu-language-buttons .fr-globe-menu button{min-height:40px!important}@media(max-width:390px){.mobile-menu-language-buttons>.fr-globe-toggle{height:38px!important;min-height:38px!important;padding:0 9px!important;gap:6px!important}.mobile-menu-language-buttons .fr-globe-toggle svg{width:17px;height:17px}}html[dir=rtl] .mobile-menu-language-buttons .fr-globe-menu{right:auto!important;left:0!important}";
  (document.head||document.documentElement).appendChild(st);
}
function controlCopy(){
  var locale=current();
  if(locale==="fr")return {label:"Langue",aria:"Changer de langue",title:"Changer de langue"};
  if(locale==="ar")return {label:"لغة",aria:"تغيير اللغة",title:"تغيير اللغة"};
  return {label:"Lang",aria:"Change language",title:"Change language"};
}
function choice(code,label){
  var b=document.createElement("button");b.type="button";b.dataset.frSet=code;b.textContent=label;b.className="fr-menu-choice";
  b.setAttribute("lang",code);b.setAttribute("dir",code==="ar"?"rtl":"ltr");if(current()===code)b.classList.add("is-active");return b;
}
function hideNative(group){
  group.querySelectorAll("[data-lang],[data-commerce-lang],[data-admin-lang],[data-mobile-lang]").forEach(function(b){
    if(b.classList.contains("fr-menu-choice"))return;
    b.hidden=true;b.setAttribute("aria-hidden","true");b.setAttribute("tabindex","-1");b.style.setProperty("display","none","important");
  });
}
function prepareGroup(group){
  if(!group)return;group.dataset.frReady="1";group.classList.add("fr-language-ready");
  var globe=group.querySelector(":scope > .fr-globe-toggle"),menu=group.querySelector(":scope > .fr-globe-menu");
  if(!globe||!menu){
    group.querySelectorAll(":scope > .fr-globe-toggle,:scope > .fr-globe-menu").forEach(function(n){n.remove()});
    var copy=controlCopy();globe=document.createElement("button");globe.type="button";globe.className="fr-globe-toggle";globe.dataset.frMenuToggle="1";
    globe.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"></path></svg><span class="fr-globe-label" aria-hidden="true">'+copy.label+"</span>";
    globe.setAttribute("aria-expanded","false");group.appendChild(globe);
    menu=document.createElement("div");menu.className="fr-globe-menu";menu.setAttribute("role","menu");
    menu.appendChild(choice("en","English"));menu.appendChild(choice("ar","العربية"));menu.appendChild(choice("fr","Français"));group.appendChild(menu);
  }
  var cp=controlCopy(),label=globe.querySelector(".fr-globe-label");if(label)label.textContent=cp.label;
  globe.setAttribute("aria-label",cp.aria);globe.setAttribute("title",cp.title);hideNative(group);
}
function ensureControls(){
  addStyles();document.querySelectorAll(".language-switch,.commerce-lang,.admin-language-switch,.topbar-language-toggle,.mobile-menu-language-buttons").forEach(prepareGroup);
  var wrap=document.querySelector(".welcome-language-options");
  if(wrap&&!wrap.querySelector("[data-fr-welcome]")){
    var b=document.createElement("button");b.type="button";b.className="welcome-language-button";b.dataset.frWelcome="1";b.setAttribute("aria-label","Continuer en français");
    b.innerHTML='<span class="welcome-lang-monogram">FR</span><span class="welcome-lang-copy"><strong>Français</strong><small>Continuer en français</small></span><b class="welcome-lang-arrow" aria-hidden="true">→</b>';wrap.appendChild(b);
  }
}
function switchLocale(code,welcome){if(welcome)set(WELCOME_KEY,"1");sync(code);location.reload()}
document.addEventListener("click",function(e){
  var toggle=e.target.closest&&e.target.closest("[data-fr-menu-toggle]");
  if(toggle){e.preventDefault();e.stopImmediatePropagation();var menu=toggle.parentElement&&toggle.parentElement.querySelector(".fr-globe-menu");
    if(menu){var open=!menu.classList.contains("is-open");document.querySelectorAll(".fr-globe-menu.is-open").forEach(function(x){x.classList.remove("is-open")});menu.classList.toggle("is-open",open);toggle.setAttribute("aria-expanded",open?"true":"false")}return}
  var custom=e.target.closest&&e.target.closest("[data-fr-set]");if(custom){e.preventDefault();e.stopImmediatePropagation();switchLocale(custom.dataset.frSet,false);return}
  var welcome=e.target.closest&&e.target.closest("[data-fr-welcome]");if(welcome){e.preventDefault();e.stopImmediatePropagation();switchLocale("fr",true);return}
},true);
document.addEventListener("keydown",function(e){if(e.key!=="Escape")return;document.querySelectorAll(".fr-globe-menu.is-open").forEach(function(menu){menu.classList.remove("is-open");var t=menu.parentElement&&menu.parentElement.querySelector("[data-fr-menu-toggle]");if(t){t.setAttribute("aria-expanded","false");t.focus({preventScroll:true})}})});
function scheduleControls(){ensureControls();setTimeout(ensureControls,120);setTimeout(ensureControls,700);setTimeout(ensureControls,1600)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",scheduleControls,{once:true});else scheduleControls();
function revealFrench(){requestAnimationFrame(function(){document.documentElement.classList.remove("zwm-fr-loading");var guard=document.getElementById("zwmFrenchLoadingGuard");if(guard)guard.remove()})}
function loadFrenchRuntime(){
  if(initial!=="fr")return;if(document.querySelector('script[src*="fr-runtime-v1.js"]'))return;
  var s=document.createElement("script");s.src=HEAVY_SRC;s.async=false;s.dataset.zwmFrenchRuntime="1";
  s.onload=function(){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",revealFrench,{once:true});else revealFrench()};s.onerror=revealFrench;
  (document.head||document.documentElement).appendChild(s);
}
loadFrenchRuntime();
})();