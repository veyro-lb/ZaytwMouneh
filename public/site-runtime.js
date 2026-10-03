(() => {
  "use strict";
  const CONFIG_SRC = "admin-config.js?v=20261004-1";
  const PRODUCT_CACHE = "zwm:cms:product-overrides:v1";
  const SETTINGS_CACHE = "zwm:cms:settings:v1";
  const SESSION_KEY = "zwm:analytics:session:v1";
  const RELOAD_KEY = "zwm:cms:last-reload:v1";

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement("script");s.src=src;s.async=true;
      s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }
  function safeParse(raw,fallback){try{return JSON.parse(raw)||fallback}catch{return fallback}}
  function config(){return window.ZWM_CMS_CONFIG||{}}
  function enabled(){const c=config();return !!(c.enabled&&c.supabaseUrl&&c.supabasePublishableKey)}
  function api(path,options={}){
    const c=config();
    return fetch(c.supabaseUrl.replace(/\/$/,"")+"/rest/v1/"+path,{
      ...options,
      headers:{
        apikey:c.supabasePublishableKey,
        "Content-Type":"application/json",
        ...(options.headers||{})
      }
    });
  }
  async function getRows(table,query="select=*"){
    const r=await api(encodeURIComponent(table)+"?"+query);
    if(!r.ok)throw new Error("CMS request failed");
    return r.json();
  }
  function hash(value){
    let h=2166136261;
    const s=JSON.stringify(value);
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
    return (h>>>0).toString(36);
  }

  function cacheSettings(rows){
    const obj=Object.fromEntries((rows||[]).map(r=>[r.key,r.value]));
    localStorage.setItem(SETTINGS_CACHE,JSON.stringify(obj));
    return obj;
  }
  function readSettings(){return safeParse(localStorage.getItem(SETTINGS_CACHE),{})}

  function currentLang(){
    const stored=localStorage.getItem("zwm-language")||localStorage.getItem("zwm:lang");
    if(stored==="ar")return "ar";
    return document.documentElement.lang==="ar"||document.documentElement.dir==="rtl"?"ar":"en";
  }
  function applySettings(settings=readSettings()){
    const announcement=settings.announcement||{};
    const announcementEl=document.getElementById("announcementText");
    if(announcementEl){
      const text=currentLang()==="ar"?(announcement.ar||announcement.en):(announcement.en||announcement.ar);
      if(text)announcementEl.textContent=text;
      const bar=announcementEl.closest(".announcement");
      if(bar)bar.hidden=announcement.enabled===false;
    }

    const contact=settings.contact||{};
    const number=String(contact.whatsapp||"").replace(/\D/g,"");
    if(number){
      document.querySelectorAll('a[href*="wa.me/"],a[href*="api.whatsapp.com"]').forEach(a=>{
        try{
          const url=new URL(a.href,location.href);
          if(url.hostname.includes("wa.me")) url.pathname="/"+number;
          else if(url.hostname.includes("whatsapp.com")) url.searchParams.set("phone",number);
          a.href=url.toString();
        }catch{}
      });
    }
    applyPromo(settings.promo||{});
  }

  function applyPromo(promo){
    let box=document.getElementById("zwmCmsPromo");
    if(!promo.enabled){if(box)box.remove();return}
    const title=currentLang()==="ar"?(promo.titleAr||promo.titleEn):(promo.titleEn||promo.titleAr);
    const body=currentLang()==="ar"?(promo.bodyAr||promo.bodyEn):(promo.bodyEn||promo.bodyAr);
    if(!title&&!body)return;
    const dismissed=sessionStorage.getItem("zwm:promo:dismissed:v1");
    if(dismissed==="1")return;
    if(!box){
      box=document.createElement("aside");box.id="zwmCmsPromo";
      Object.assign(box.style,{position:"fixed",left:"16px",right:"16px",bottom:"16px",zIndex:"45",maxWidth:"620px",margin:"0 auto",padding:"14px 48px 14px 16px",borderRadius:"16px",background:"#123d23",color:"#fff",boxShadow:"0 16px 45px rgba(0,0,0,.18)",fontFamily:"DM Sans, sans-serif"});
      box.innerHTML='<button type="button" aria-label="Dismiss" style="position:absolute;right:12px;top:10px;border:0;background:transparent;color:#fff;font-size:20px;cursor:pointer">×</button><strong style="display:block;font-size:13px;margin-bottom:3px"></strong><span style="display:block;font-size:11px;line-height:1.45;color:#d8e3da"></span>';
      box.querySelector("button").addEventListener("click",()=>{sessionStorage.setItem("zwm:promo:dismissed:v1","1");box.remove()});
      document.body.appendChild(box);
    }
    box.dir=currentLang()==="ar"?"rtl":"ltr";
    box.querySelector("strong").textContent=title||"";
    box.querySelector("span").textContent=body||"";
  }

  async function refreshCms(){
    const c=config(),t=c.tables||{};
    const [overrides,settingsRows]=await Promise.all([
      getRows(t.products||"product_overrides","select=product_id,action,payload,updated_at&order=updated_at.desc"),
      getRows(t.settings||"site_settings","select=key,value,updated_at")
    ]);
    const previous=safeParse(localStorage.getItem(PRODUCT_CACHE),[]);
    const prevSig=hash(previous),nextSig=hash(overrides);
    localStorage.setItem(PRODUCT_CACHE,JSON.stringify(overrides));
    const settings=cacheSettings(settingsRows);
    applySettings(settings);
    if(prevSig!==nextSig){
      const sig=nextSig;
      if(sessionStorage.getItem(RELOAD_KEY)!==sig){
        sessionStorage.setItem(RELOAD_KEY,sig);
        location.reload();
      }
    }
  }

  function sessionId(){
    let id=localStorage.getItem(SESSION_KEY);
    if(!id){id=crypto.randomUUID?.()||("s-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2));localStorage.setItem(SESSION_KEY,id)}
    return id.slice(0,80);
  }
  function referrerHost(){
    if(!document.referrer)return "";
    try{return new URL(document.referrer).hostname.slice(0,180)}catch{return ""}
  }
  function eventMeta(meta={}){
    const out={};
    for(const [k,v] of Object.entries(meta)){
      if(["product_id","category","query_length","source"].includes(k)&&["string","number","boolean"].includes(typeof v))out[k]=typeof v==="string"?v.slice(0,160):v;
    }
    return out;
  }
  function track(eventName,meta={}){
    const c=config();if(!enabled()||c.analytics?.enabled===false)return;
    const row={event_name:eventName,page_path:(location.pathname+location.search).slice(0,300),session_id:sessionId(),referrer_host:referrerHost(),meta:eventMeta(meta)};
    api(encodeURIComponent(c.tables?.events||"site_events"),{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(row)}).catch(()=>{});
  }

  function bindAnalytics(){
    track("page_view",{source:"site"});
    document.addEventListener("click",e=>{
      const a=e.target.closest("a");
      if(a&&/wa\.me|whatsapp\.com/i.test(a.href||""))track("whatsapp_click",{source:"link"});
      const add=e.target.closest("#productModalAdd,[data-add-to-cart],[data-add-product],.add-to-cart");
      if(add){
        const card=add.closest("[data-product-id],[data-product]");
        const id=card?.dataset.productId||card?.dataset.product||document.querySelector("[data-current-product]")?.dataset.currentProduct||"";
        track("add_to_cart",id?{product_id:id}:{});
      }
      const product=e.target.closest("[data-product-id]");
      if(product?.dataset.productId)track("product_view",{product_id:product.dataset.productId});
    },{passive:true});
    let timer;
    document.addEventListener("input",e=>{
      if(e.target.matches('input[type="search"],#searchInput,#catalogSearch,#productSearch')){
        clearTimeout(timer);
        timer=setTimeout(()=>{const q=e.target.value.trim();if(q.length>=2)track("search",{query_length:q.length})},700);
      }
    },{passive:true});
  }

  async function init(){
    try{await loadScript(CONFIG_SRC)}catch{return}
    if(!enabled())return;
    applySettings(readSettings());
    bindAnalytics();
    document.addEventListener("click",e=>{if(e.target.closest("[data-lang],#languageSwitch,.language-switch"))setTimeout(()=>applySettings(),80)},{passive:true});
    refreshCms().catch(()=>{});
  }
  init();
})();
