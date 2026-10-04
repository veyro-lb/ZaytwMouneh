(() => {
  "use strict";
  const CONFIG_SRC = "admin-config.js?v=20261004-toolkit10";
  const PRODUCT_CACHE = "zwm:cms:product-overrides:v1";
  const SETTINGS_CACHE = "zwm:cms:settings:v1";
  const SESSION_KEY = "zwm:analytics:session:v1";
  const RELOAD_KEY = "zwm:cms:last-reload:v1";
  const PREVIEW_RELOAD_KEY = "zwm:cms:preview-last-reload:v1";
  const ADMIN_SYNC_KEY = "zwm:cms:admin-sync:v1";
  const PREVIEW_MODE = new URLSearchParams(location.search).get("zwm_admin_preview")==="1";
  let previewSettings=null;
  let refreshInFlight=null;
  const persistentChromeRefs={};

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
    const request={
      ...options,
      headers:{
        apikey:c.supabasePublishableKey,
        "Content-Type":"application/json",
        ...(options.headers||{})
      }
    };
    if(!request.method||String(request.method).toUpperCase()==="GET")request.cache="no-store";
    return fetch(c.supabaseUrl.replace(/\/$/,"")+"/rest/v1/"+path,request);
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
    const stored=localStorage.getItem("zwm-lang-v2")||localStorage.getItem("zwm-language")||localStorage.getItem("zwm:lang");
    if(stored==="ar")return "ar";
    if(stored==="en")return "en";
    return document.documentElement.lang==="ar"||document.documentElement.dir==="rtl"?"ar":"en";
  }
  function applySettings(settings=readSettings()){
    const announcement=settings.announcement||{};
    const announcementEl=document.getElementById("announcementText");
    if(announcementEl){
      const text=currentLang()==="ar"?(announcement.ar||announcement.en):(announcement.en||announcement.ar);
      announcementEl.textContent=text||"";
      const bar=announcementEl.closest(".announcement");
      if(bar)bar.hidden=announcement.enabled===false||!text;
    }

    const contact=settings.contact||{};
    const number=String(contact.whatsapp||"").replace(/\D/g,"");
    if(number){
      const displayNumber=number.startsWith("961")&&number.length>=10
        ?"+961 "+number.slice(3,5)+" "+number.slice(5,8)+" "+number.slice(8)
        :"+"+number;
      document.querySelectorAll('a[href*="wa.me/"],a[href*="api.whatsapp.com"]').forEach(a=>{
        try{
          const url=new URL(a.href,location.href);
          if(url.hostname.includes("wa.me")) url.pathname="/"+number;
          else if(url.hostname.includes("whatsapp.com")) url.searchParams.set("phone",number);
          a.href=url.toString();
          const strong=a.querySelector("strong");
          if(strong&&/\+?\d[\d\s()-]{6,}/.test(strong.textContent||""))strong.textContent=displayNumber;
        }catch{}
      });
    }
    applyPromo(settings.promo||{});
    applyDelivery(settings.delivery||{});
  }

  function applyPromo(promo){
    let box=document.getElementById("zwmCmsPromo");
    const now=Date.now();
    const starts=promo.startsAt?new Date(promo.startsAt).getTime():null;
    const ends=promo.endsAt?new Date(promo.endsAt).getTime():null;
    const inWindow=(!starts||now>=starts)&&(!ends||now<=ends);
    if(!promo.enabled||!inWindow){if(box)box.remove();return}
    const title=currentLang()==="ar"?(promo.titleAr||promo.titleEn):(promo.titleEn||promo.titleAr);
    const body=currentLang()==="ar"?(promo.bodyAr||promo.bodyEn):(promo.bodyEn||promo.bodyAr);
    if(!title&&!body)return;
    const dismissed=sessionStorage.getItem("zwm:promo:dismissed:v1");
    if(!PREVIEW_MODE&&dismissed==="1")return;
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

  const DEFAULT_FREE_DELIVERY_THRESHOLD=50;

  function deliveryQuote(subtotal=0,area="",delivery=(previewSettings||readSettings()).delivery||{}){
    const amount=Math.max(0,Number(subtotal)||0);
    const configuredFreeAbove=Math.max(0,Number(delivery.freeAbove)||0);
    const freeAbove=configuredFreeAbove>0?configuredFreeAbove:DEFAULT_FREE_DELIVERY_THRESHOLD;
    const minimum=Math.max(0,Number(delivery.minimum)||0);
    const zones=Array.isArray(delivery.zones)?delivery.zones:[];
    const normalized=String(area||"").trim().toLowerCase();
    const zone=normalized?zones.find(z=>{
      const key=String(z?.area||"").trim().toLowerCase();
      return key&&(normalized.includes(key)||key.includes(normalized));
    }):null;
    const baseFee=Math.max(0,Number(zone?.fee ?? delivery.fee)||0);
    const fee=freeAbove>0&&amount>=freeAbove?0:baseFee;
    return {fee,freeAbove,minimum,eta:String(zone?.eta||delivery.eta||"").trim(),zone:zone||null};
  }

  function ensureDeliveryProgressStyles(){
    if(document.getElementById("zwmDeliveryProgressStyles"))return;
    const style=document.createElement("style");
    style.id="zwmDeliveryProgressStyles";
    style.textContent=`
      .zwm-delivery-progress{margin:8px 0 10px;padding:12px 13px;border:1px solid rgba(32,91,51,.17);border-radius:15px;background:linear-gradient(135deg,#f8fbf5 0%,#eef5e9 100%);color:#24372a;box-shadow:0 7px 22px rgba(35,73,44,.06)}
      .zwm-delivery-progress.is-unlocked{border-color:rgba(32,112,57,.32);background:linear-gradient(135deg,#eff8ec 0%,#e5f3df 100%)}
      .zwm-delivery-progress-top{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center}
      .zwm-delivery-progress-icon{display:grid;place-items:center;width:31px;height:31px;border-radius:10px;background:#fff;border:1px solid rgba(32,91,51,.12);font-size:16px;box-shadow:0 3px 10px rgba(35,73,44,.05)}
      .zwm-delivery-progress-copy{min-width:0}
      .zwm-delivery-progress-copy strong{display:block;font-size:12.5px;line-height:1.25;color:#183e24;font-weight:800}
      .zwm-delivery-progress-copy small{display:block;margin-top:2px;font-size:10.5px;line-height:1.35;color:#68756c}
      .zwm-delivery-progress-value{font-size:10.5px;line-height:1;font-weight:800;color:#1f6935;background:#fff;border:1px solid rgba(32,91,51,.13);border-radius:999px;padding:6px 7px;white-space:nowrap}
      .zwm-delivery-progress-track{position:relative;height:7px;margin-top:10px;border-radius:999px;background:rgba(31,91,49,.12);overflow:hidden}
      .zwm-delivery-progress-fill{display:block;height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#6c9347,#1d6b37);transition:width .3s ease}
      .zwm-delivery-progress.is-unlocked .zwm-delivery-progress-fill{background:linear-gradient(90deg,#2e7c45,#155b2d)}
      .zwm-delivery-progress-meta{margin-top:7px;font-size:10px;line-height:1.45;color:#667169}
      .zwm-delivery-progress-meta:empty{display:none}
      html[dir="rtl"] .zwm-delivery-progress{text-align:right}
      @media(max-width:600px){.zwm-delivery-progress{padding:11px 12px;border-radius:14px}.zwm-delivery-progress-copy strong{font-size:12px}.zwm-delivery-progress-copy small{font-size:10px}}
      @media(prefers-reduced-motion:reduce){.zwm-delivery-progress-fill{transition:none}}
    `;
    document.head.appendChild(style);
  }

  function renderDeliverySummary(subtotal){
    const form=document.getElementById("orderForm");
    if(!form)return;
    ensureDeliveryProgressStyles();

    let box=document.getElementById("zwmDeliverySummary");
    if(!box){
      box=document.createElement("section");
      box.id="zwmDeliverySummary";
      box.className="zwm-delivery-progress";
      box.setAttribute("role","note");
      box.innerHTML='<div class="zwm-delivery-progress-top"><span class="zwm-delivery-progress-icon" aria-hidden="true">🚚</span><div class="zwm-delivery-progress-copy"><strong id="zwmDeliveryProgressTitle"></strong><small id="zwmDeliveryProgressSub"></small></div><b class="zwm-delivery-progress-value" id="zwmDeliveryProgressValue"></b></div><div class="zwm-delivery-progress-track" id="zwmDeliveryProgressTrack" role="progressbar" aria-valuemin="0" aria-valuemax="50" aria-valuenow="0"><span class="zwm-delivery-progress-fill" id="zwmDeliveryProgressFill"></span></div><div class="zwm-delivery-progress-meta" id="zwmDeliveryProgressMeta"></div>';
      const totalRow=form.querySelector(".cart-total-row");
      if(totalRow?.parentNode)totalRow.parentNode.insertBefore(box,totalRow.nextSibling);
      else form.prepend(box);
    }

    box.hidden=false;
    const settings=(previewSettings||readSettings()).delivery||{};
    const parsedSubtotal=Number.isFinite(Number(subtotal))?Number(subtotal):Number(String(document.getElementById("cartTotal")?.textContent||"0").replace(/[^0-9.]/g,""))||0;
    const areaInput=document.getElementById("customerArea");
    if(areaInput&&!areaInput.dataset.zwmDeliveryBound){
      areaInput.dataset.zwmDeliveryBound="1";
      areaInput.addEventListener("input",()=>renderDeliverySummary());
    }

    const q=deliveryQuote(parsedSubtotal,areaInput?.value||"",settings);
    const ar=currentLang()==="ar";
    const threshold=q.freeAbove||DEFAULT_FREE_DELIVERY_THRESHOLD;
    const remaining=Math.max(0,threshold-parsedSubtotal);
    const unlocked=parsedSubtotal>=threshold;
    const progress=Math.max(0,Math.min(100,(parsedSubtotal/threshold)*100));

    const title=document.getElementById("zwmDeliveryProgressTitle");
    const sub=document.getElementById("zwmDeliveryProgressSub");
    const value=document.getElementById("zwmDeliveryProgressValue");
    const track=document.getElementById("zwmDeliveryProgressTrack");
    const fill=document.getElementById("zwmDeliveryProgressFill");
    const meta=document.getElementById("zwmDeliveryProgressMeta");

    box.dir=ar?"rtl":"ltr";
    box.classList.toggle("is-unlocked",unlocked);
    if(title)title.textContent=unlocked
      ?(ar?"أصبح التوصيل مجانياً ✓":"Free delivery unlocked ✓")
      :(ar?"باقي $"+remaining.toFixed(2)+" فقط للتوصيل المجاني":"Only $"+remaining.toFixed(2)+" away from free delivery");
    if(sub)sub.textContent=ar
      ?"توصيل مجاني للطلبات بقيمة $"+threshold.toFixed(2)+" أو أكثر"
      :"Free delivery on orders of $"+threshold.toFixed(2)+" or more";
    if(value)value.textContent=unlocked?(ar?"مجاني":"FREE"):Math.round(progress)+"%";
    if(track){
      track.setAttribute("aria-valuemax",String(threshold));
      track.setAttribute("aria-valuenow",String(Math.min(parsedSubtotal,threshold).toFixed(2)));
      track.setAttribute("aria-label",ar?"التقدم نحو التوصيل المجاني":"Progress toward free delivery");
    }
    if(fill)fill.style.width=progress+"%";

    const parts=[];
    if(q.zone?.area)parts.push((ar?"المنطقة":"Area")+": "+q.zone.area);
    if(q.minimum>0)parts.push((ar?"الحد الأدنى للطلب":"Minimum order")+": $"+q.minimum.toFixed(2));
    if(!unlocked&&q.fee>0)parts.push((ar?"رسوم التوصيل":"Delivery")+": $"+q.fee.toFixed(2));
    if(!unlocked&&q.fee===0)parts.push(ar?"رسوم التوصيل للطلبات الأقل من $50 تُؤكّد حسب المنطقة عبر واتساب":"Delivery below $50 is confirmed by area on WhatsApp");
    if(q.eta)parts.push((ar?"الوقت المتوقع":"Estimated delivery")+": "+q.eta);
    if(meta)meta.textContent=parts.join(" · ");
  }

  function applyDelivery(){
    renderDeliverySummary();
  }

  async function refreshCms(){
    if(refreshInFlight)return refreshInFlight;
    refreshInFlight=(async()=>{
      const c=config(),t=c.tables||{};
      const [overrides,settingsRows]=await Promise.all([
        getRows(t.products||"product_overrides","select=product_id,action,payload,updated_at&order=updated_at.desc"),
        getRows(t.settings||"site_settings","select=key,value,updated_at")
      ]);
      const previous=safeParse(localStorage.getItem(PRODUCT_CACHE),[]);
      const prevSig=hash(previous),nextSig=hash(overrides);
      localStorage.setItem(PRODUCT_CACHE,JSON.stringify(overrides));
      const settings=cacheSettings(settingsRows);
      applySettings(previewSettings||settings);
      if(prevSig!==nextSig){
        const sig=nextSig;
        const reloadKey=PREVIEW_MODE?PREVIEW_RELOAD_KEY:RELOAD_KEY;
        if(sessionStorage.getItem(reloadKey)!==sig){
          sessionStorage.setItem(reloadKey,sig);
          location.reload();
        }
      }
      return settings;
    })();
    try{return await refreshInFlight}finally{refreshInFlight=null}
  }

  const SESSION_TIMEOUT_MS=30*60*1000;
  function newSessionId(){
    return crypto.randomUUID?.()||("s-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2));
  }
  function sessionId(){
    const now=Date.now();
    let record=null;
    const raw=localStorage.getItem(SESSION_KEY);
    if(raw){
      try{
        const parsed=JSON.parse(raw);
        if(parsed&&typeof parsed==="object"&&parsed.id)record=parsed;
        else if(typeof parsed==="string")record={id:parsed,last:now};
      }catch{
        if(raw.length<=80)record={id:raw,last:0};
      }
    }
    if(!record?.id||!Number.isFinite(Number(record.last))||now-Number(record.last)>SESSION_TIMEOUT_MS){
      record={id:newSessionId(),last:now};
    }else{
      record.last=now;
    }
    try{localStorage.setItem(SESSION_KEY,JSON.stringify(record))}catch{}
    return String(record.id).slice(0,80);
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
    const c=config();if(PREVIEW_MODE||!enabled()||c.analytics?.enabled===false)return;
    const row={event_name:eventName,page_path:(location.pathname+location.search).slice(0,300),session_id:sessionId(),referrer_host:referrerHost(),meta:eventMeta(meta)};
    api(encodeURIComponent(c.tables?.events||"site_events"),{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(row)}).catch(()=>{});
  }

  function recordOrder(order){
    const c=config();
    if(PREVIEW_MODE||!enabled()||!order?.reference||!Array.isArray(order.items)||!order.items.length)return Promise.resolve(false);
    const row={
      reference:String(order.reference).slice(0,40),
      kind:order.kind==="gift"?"gift":"order",
      status:"new",
      customer_name:String(order.customer_name||"").slice(0,120),
      customer_phone:String(order.customer_phone||"").slice(0,40),
      area:String(order.area||"").slice(0,180),
      notes:String(order.notes||"").slice(0,800),
      items:order.items.slice(0,100).map(item=>({
        product_id:String(item.product_id||"").slice(0,160),
        name:String(item.name||"").slice(0,180),
        size:String(item.size||"").slice(0,100),
        qty:Math.max(1,Math.min(999,Number(item.qty)||1)),
        unit_price:Math.max(0,Number(item.unit_price)||0),
        subtotal:Math.max(0,Number(item.subtotal)||0)
      })),
      total:Math.max(0,Number(order.total)||0),
      currency:"USD",
      language:order.language==="ar"?"ar":"en",
      extra:order.extra&&typeof order.extra==="object"?order.extra:{},
      submitted_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    };
    track("whatsapp_click",{source:row.kind==="gift"?"gift_order":"cart_order"});
    return api(encodeURIComponent(c.tables?.orders||"orders"),{
      method:"POST",
      keepalive:true,
      headers:{Prefer:"return=minimal"},
      body:JSON.stringify(row)
    }).then(r=>r.ok||r.status===409).catch(()=>false);
  }

  window.ZWM_CMS={recordOrder,track,getSettings:()=>previewSettings||readSettings(),deliveryQuote,renderDeliverySummary,refresh:refreshCms};

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

  function applyPreviewLanguage(lang){
    const next=lang==="ar"?"ar":"en";
    const key="zwm-lang-v2";
    const previous=localStorage.getItem(key);
    if(typeof window.applyLanguage==="function"){
      window.applyLanguage(next,{immediate:true});
      if(previous===null)localStorage.removeItem(key);else localStorage.setItem(key,previous);
    }else{
      document.documentElement.lang=next;
      document.documentElement.dir=next==="ar"?"rtl":"ltr";
    }
  }

  if(PREVIEW_MODE){
    window.addEventListener("message",event=>{
      if(event.origin!==location.origin||event.data?.type!=="zwm-admin-preview")return;
      previewSettings=event.data.settings&&typeof event.data.settings==="object"?event.data.settings:{};
      applyPreviewLanguage(event.data.lang);
      applySettings(previewSettings);
    });
  }

  function rememberPersistentShell(){
    const header=document.querySelector(".site-header");
    const nav=header?.querySelector(".nav");
    const footer=document.querySelector("footer.footer");
    if(header&&!persistentChromeRefs.header)persistentChromeRefs.header=header;
    if(nav&&!persistentChromeRefs.nav)persistentChromeRefs.nav=nav;
    if(footer&&!persistentChromeRefs.footer)persistentChromeRefs.footer=footer;
    const n=persistentChromeRefs.nav||nav;
    if(n){
      if(!persistentChromeRefs.brand)persistentChromeRefs.brand=n.querySelector(".brand");
      if(!persistentChromeRefs.navToggle)persistentChromeRefs.navToggle=n.querySelector("#navToggle");
      if(!persistentChromeRefs.navLinks)persistentChromeRefs.navLinks=n.querySelector("#navLinks");
      if(!persistentChromeRefs.navActions)persistentChromeRefs.navActions=n.querySelector(".nav-actions");
      const actions=persistentChromeRefs.navActions||n.querySelector(".nav-actions");
      if(actions){
        if(!persistentChromeRefs.search)persistentChromeRefs.search=actions.querySelector(".nav-search");
        if(!persistentChromeRefs.instagram)persistentChromeRefs.instagram=actions.querySelector(".nav-instagram");
        if(!persistentChromeRefs.language)persistentChromeRefs.language=actions.querySelector("#languageSwitch");
        if(!persistentChromeRefs.points)persistentChromeRefs.points=actions.querySelector("#mounehRewardsButton");
        if(!persistentChromeRefs.account)persistentChromeRefs.account=actions.querySelector("#mounehAccountButton");
        if(!persistentChromeRefs.cart)persistentChromeRefs.cart=actions.querySelector("#cartButton");
      }
      const links=persistentChromeRefs.navLinks||n.querySelector("#navLinks");
      if(links&&!persistentChromeRefs.primaryLinks){
        persistentChromeRefs.primaryLinks=Array.from(links.children).filter(el=>el.matches?.("a[href]"));
        persistentChromeRefs.menuHeading=links.querySelector(".menu-heading");
        persistentChromeRefs.menuUtility=links.querySelector(".menu-utility");
      }
    }
  }

  function restorePersistentShell(){
    rememberPersistentShell();
    const header=persistentChromeRefs.header;
    if(header&&!document.contains(header)){
      const main=document.querySelector("main");
      document.body.insertBefore(header,main||document.body.firstChild);
    }
    const footer=persistentChromeRefs.footer;
    if(footer&&!document.contains(footer)){
      const before=document.querySelector("#cartBackdrop,.cart-backdrop,.cart-drawer,.product-modal");
      document.body.insertBefore(footer,before||null);
    }
    const nav=persistentChromeRefs.nav;
    const headerNow=persistentChromeRefs.header;
    if(nav&&headerNow&&!document.contains(nav))headerNow.appendChild(nav);
    if(nav){
      const brand=persistentChromeRefs.brand;
      const toggle=persistentChromeRefs.navToggle;
      const links=persistentChromeRefs.navLinks;
      const actions=persistentChromeRefs.navActions;
      if(brand&&!document.contains(brand))nav.prepend(brand);
      if(toggle&&!document.contains(toggle))nav.insertBefore(toggle,links&&document.contains(links)?links:(actions&&document.contains(actions)?actions:null));
      if(links&&!document.contains(links))nav.insertBefore(links,actions&&document.contains(actions)?actions:null);
      if(actions&&!document.contains(actions))nav.appendChild(actions);
      if(links&&document.contains(links)){
        const utility=persistentChromeRefs.menuUtility;
        (persistentChromeRefs.primaryLinks||[]).forEach(link=>{
          if(!document.contains(link))links.insertBefore(link,utility&&document.contains(utility)?utility:null);
        });
        const heading=persistentChromeRefs.menuHeading;
        if(heading&&!document.contains(heading))links.prepend(heading);
        if(utility&&!document.contains(utility))links.appendChild(utility);
      }
      if(actions&&document.contains(actions)){
        const ordered=[persistentChromeRefs.search,persistentChromeRefs.instagram,persistentChromeRefs.language,persistentChromeRefs.points,persistentChromeRefs.account,persistentChromeRefs.cart].filter(Boolean);
        ordered.forEach(el=>{if(!document.contains(el))actions.appendChild(el)});
        const currentKnown=Array.from(actions.children).filter(el=>ordered.includes(el));
        const orderMatches=currentKnown.length===ordered.length&&ordered.every((el,index)=>currentKnown[index]===el);
        if(!orderMatches)ordered.forEach(el=>actions.appendChild(el));
      }
    }
  }

  function ensureLegalFooter(){
    restorePersistentShell();
    const footer=document.querySelector("footer.footer");
    if(!footer)return null;
    footer.querySelectorAll('.footer-column a[href*="privacy.html"],.footer-column a[href*="terms.html"],.premium-recipes-footer').forEach(link=>link.remove());
    const grid=footer.querySelector(".footer-grid,.footer-inner")||footer;
    let bar=footer.querySelector("[data-footer-legal]");
    if(!bar){
      bar=document.createElement("div");
      bar.className="footer-legal-bar";
      bar.setAttribute("data-footer-legal","");
      const copyright=grid.querySelector(".copyright");
      if(copyright)grid.insertBefore(bar,copyright);else grid.appendChild(bar);
    }
    const ensureLink=(kind,href,en,arText)=>{
      let link=bar.querySelector('[data-legal-link="'+kind+'"]')||bar.querySelector('a[href="'+href+'"],a[href="'+href.replace(/^\//,"")+'"]');
      if(!link){
        link=document.createElement("a");
        link.className="footer-legal-button";
        link.href=href;
        bar.appendChild(link);
      }
      link.classList.add("footer-legal-button");
      link.setAttribute("data-legal-link",kind);
      link.setAttribute("href",href);
      link.removeAttribute("hidden");
      link.style.setProperty("display","inline-flex","important");
      link.style.setProperty("visibility","visible","important");
      link.style.setProperty("opacity","1","important");
      link.style.setProperty("pointer-events","auto","important");
      if(!link.querySelector(".only-en")||!link.querySelector(".only-ar")){
        link.innerHTML='<span class="only-en">'+en+'</span><span class="only-ar" lang="ar">'+arText+'</span>';
      }
      return link;
    };
    let label=bar.querySelector(".footer-legal-label");
    if(!label){
      label=document.createElement("strong");
      label.className="footer-legal-label";
      label.innerHTML='<span class="only-en">Legal & Rewards</span><span class="only-ar" lang="ar">القانون والمكافآت</span>';
      bar.prepend(label);
    }
    ensureLink("privacy","/privacy.html?rev=20261004-legal5","Privacy Policy","سياسة الخصوصية");
    ensureLink("terms","/terms.html?rev=20261004-legal5","Terms of Service","شروط الخدمة");
    ensureLink("rewards","/terms.html?rev=20261004-legal5#terms-rewards","Mouneh Points Rules 🌿","قواعد نقاط المونة 🌿");
    bar.removeAttribute("hidden");
    bar.style.setProperty("display","flex","important");
    bar.style.setProperty("visibility","visible","important");
    bar.style.setProperty("opacity","1","important");
    return bar;
  }

  function ensureFreshLegalPage(){
    const page=document.body?.dataset?.page;
    if(page!=="terms"&&page!=="privacy")return;
    const current=new URL(location.href);
    const rev=current.searchParams.get("rev");
    if(page==="terms"){
      const rewards=document.getElementById("terms-rewards");
      const complete=!!(rewards&&rewards.querySelector(".legal-rule-grid")&&rewards.querySelector(".legal-reward-table")&&/What counts toward points/i.test(rewards.textContent||""));
      if(!complete){
        if(rev!=="20261004-legal5"){
          location.replace("/terms.html?rev=20261004-legal5#terms-rewards");
          return;
        }
        current.searchParams.set("fresh",Date.now().toString(36));
        location.replace(current.pathname+"?"+current.searchParams.toString()+"#terms-rewards");
        return;
      }
    }
    if(page==="privacy"){
      const rewards=document.getElementById("privacy-rewards");
      const complete=!!(rewards&&/Mouneh Points data and automated calculations/i.test(rewards.textContent||""));
      if(!complete){
        if(rev!=="20261004-legal5"){
          location.replace("/privacy.html?rev=20261004-legal5#privacy-rewards");
          return;
        }
        current.searchParams.set("fresh",Date.now().toString(36));
        location.replace(current.pathname+"?"+current.searchParams.toString()+"#privacy-rewards");
        return;
      }
    }
  }

  function ensurePersistentChrome(){
    ensureFreshLegalPage();
    restorePersistentShell();
    const nav=document.querySelector(".site-header .nav-actions");
    if(nav){
      const cart=nav.querySelector("#cartButton");

      let switcher=document.getElementById("languageSwitch")||persistentChromeRefs.language;
      if(!switcher){
        switcher=document.createElement("div");
        switcher.id="languageSwitch";
        switcher.className="language-switch";
        switcher.setAttribute("aria-label","Language");
        switcher.innerHTML='<button type="button" data-lang="en">EN</button><button type="button" data-lang="ar">عربي</button>';
        nav.insertBefore(switcher,cart||null);
      }else if(switcher.parentElement!==nav){
        nav.insertBefore(switcher,cart||null);
      }
      switcher.removeAttribute("hidden");
      switcher.style.setProperty("display","flex","important");
      switcher.style.setProperty("visibility","visible","important");
      switcher.style.setProperty("opacity","1","important");
      switcher.querySelectorAll("[data-lang]").forEach(btn=>{
        btn.removeAttribute("hidden");
        btn.style.setProperty("display","flex","important");
        btn.style.setProperty("visibility","visible","important");
        btn.style.setProperty("opacity","1","important");
        btn.style.setProperty("pointer-events","auto","important");
      });

      let account=document.getElementById("mounehAccountButton")||persistentChromeRefs.account;
      if(!account){
        account=document.createElement("a");
        account.id="mounehAccountButton";
        account.className="mouneh-account-nav";
        account.href="account.html?auth=signin";
        account.setAttribute("aria-label",document.documentElement.lang==="ar"?"تسجيل الدخول أو فتح حسابي":"Sign in or open My Account");
        account.innerHTML='<span class="mr-account-nav-avatar is-guest" aria-hidden="true"></span><span class="mr-account-nav-copy">'+(document.documentElement.lang==="ar"?"دخول":"Sign in")+'</span>';
        nav.insertBefore(account,cart||null);
        persistentChromeRefs.account=account;
      }else if(account.parentElement!==nav){
        nav.insertBefore(account,cart||null);
      }
      account.classList.add("mouneh-account-nav");
      account.removeAttribute("hidden");
      account.style.setProperty("display","inline-flex","important");
      account.style.setProperty("visibility","visible","important");
      account.style.setProperty("opacity","1","important");
      account.style.setProperty("pointer-events","auto","important");
      account.style.setProperty("flex-shrink","0","important");
      const guestAvatar=account.querySelector(".mr-account-nav-avatar.is-guest");
      if(guestAvatar){
        const accountCopy=account.querySelector(".mr-account-nav-copy");
        const guestText=document.documentElement.lang==="ar"?"دخول":"Sign in";
        if(accountCopy&&accountCopy.textContent!==guestText)accountCopy.textContent=guestText;
        account.href="account.html?auth=signin";
        account.setAttribute("aria-label",document.documentElement.lang==="ar"?"تسجيل الدخول أو فتح حسابي":"Sign in or open My Account");
      }

      let points=document.getElementById("mounehRewardsButton")||persistentChromeRefs.points;
      if(!points){
        points=document.createElement("button");
        points.type="button";
        points.id="mounehRewardsButton";
        points.className="mouneh-points-nav is-compact";
        points.setAttribute("data-mr-open","");
        points.innerHTML='<span class="mr-nav-leaf" aria-hidden="true">🌿</span><span class="mr-nav-copy">Mouneh Points</span><b id="mounehPointsBadge">—</b>';
        nav.insertBefore(points,account||cart||null);
        persistentChromeRefs.points=points;
      }else if(points.parentElement!==nav||(account&&points.nextElementSibling!==account)){
        nav.insertBefore(points,account||cart||null);
      }
      points.classList.add("mouneh-points-nav","is-compact");
      points.removeAttribute("hidden");
      points.setAttribute("data-mr-open","");
      points.setAttribute("aria-label",document.documentElement.lang==="ar"?"فتح نقاط المونة":"Open Mouneh Points");
      points.style.setProperty("display","inline-flex","important");
      points.style.setProperty("visibility","visible","important");
      points.style.setProperty("opacity","1","important");
      points.style.setProperty("pointer-events","auto","important");
      points.style.setProperty("flex-shrink","0","important");
      const copy=points.querySelector(".mr-nav-copy");
      if(copy){copy.textContent=document.documentElement.lang==="ar"?"نقاط المونة":"Mouneh Points";copy.style.setProperty("display","none","important");}
      let badge=points.querySelector("#mounehPointsBadge");
      if(!badge){badge=document.createElement("b");badge.id="mounehPointsBadge";badge.textContent="—";points.appendChild(badge)}
      badge.hidden=false;
      badge.style.setProperty("display","inline","important");
      const stableActions=[persistentChromeRefs.search,persistentChromeRefs.instagram,persistentChromeRefs.account,persistentChromeRefs.cart].filter(Boolean);
      stableActions.forEach(el=>{
        el.removeAttribute("hidden");
        el.style.setProperty("visibility","visible","important");
        el.style.setProperty("opacity","1","important");
        el.style.setProperty("pointer-events","auto","important");
      });
      const stableCart=persistentChromeRefs.cart;
      if(stableCart){stableCart.removeAttribute("hidden");stableCart.style.setProperty("flex-shrink","0","important");}

      if(!points.dataset.zwmPersistentBound){
        points.dataset.zwmPersistentBound="1";
        points.addEventListener("click",()=>{
          if(points.dataset.mrBound)return;
          if(window.ZWM_REWARDS?.open){window.ZWM_REWARDS.open();return}
          if(window.__ZWM_REWARDS_RETRY_LOADING)return;
          window.__ZWM_REWARDS_RETRY_LOADING=true;
          const retry=document.createElement("script");
          retry.src="mouneh-rewards-v3.js?v=20261004-account4";
          retry.async=true;
          retry.dataset.mounehRewardsRetry="1";
          retry.addEventListener("load",()=>{window.__ZWM_REWARDS_RETRY_LOADING=false;window.ZWM_REWARDS?.open?.()},{once:true});
          retry.addEventListener("error",()=>{window.__ZWM_REWARDS_RETRY_LOADING=false},{once:true});
          document.head.appendChild(retry);
        });
      }
    }
    ensureLegalFooter();
  }

  function bindPersistentChrome(){
    if(window.__ZWM_PERSISTENT_CHROME_BOUND)return;
    window.__ZWM_PERSISTENT_CHROME_BOUND=true;
    let queued=false;
    const check=()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;ensurePersistentChrome()});
    };
    new MutationObserver(check).observe(document.body,{childList:true,subtree:true});
    window.addEventListener("pageshow",event=>{
      ensureFreshLegalPage();
      check();
    });
    window.addEventListener("resize",check,{passive:true});
    window.addEventListener("orientationchange",check,{passive:true});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)check()});
    document.addEventListener("click",event=>{
      const btn=event.target.closest("#languageSwitch [data-lang]");
      if(!btn)return;
      const next=btn.dataset.lang==="ar"?"ar":"en";
      setTimeout(()=>{
        if(document.documentElement.lang===next)return;
        if(typeof window.applyLanguage==="function")window.applyLanguage(next,{immediate:true});
        else{
          try{localStorage.setItem("zwm-lang-v2",next)}catch{}
          document.documentElement.lang=next;
          document.documentElement.dir=next==="ar"?"rtl":"ltr";
          document.querySelectorAll(".only-en").forEach(el=>el.style.setProperty("display",next==="ar"?"none":"revert","important"));
          document.querySelectorAll(".only-ar").forEach(el=>el.style.setProperty("display",next==="ar"?"revert":"none","important"));
          document.querySelectorAll("[data-lang]").forEach(el=>el.classList.toggle("is-active",el.dataset.lang===next));
          ensurePersistentChrome();
        }
      },60);
    });
    check();
  }

  async function init(){
    ensurePersistentChrome();
    bindPersistentChrome();
    try{await loadScript(CONFIG_SRC)}catch{return}
    if(!enabled())return;
    if(!PREVIEW_MODE&&!document.querySelector("script[data-mouneh-rewards]")){
      const rewardsScript=document.createElement("script");
      rewardsScript.src="mouneh-rewards-v3.js?v=20261004-account4";
      rewardsScript.async=true;
      rewardsScript.dataset.mounehRewards="1";
      document.head.appendChild(rewardsScript);
    }
    applySettings(readSettings());
    ensurePersistentChrome();
    bindPersistentChrome();
    if(!PREVIEW_MODE)bindAnalytics();
    document.addEventListener("click",e=>{if(e.target.closest("[data-lang],#languageSwitch,.language-switch"))setTimeout(()=>applySettings(previewSettings||readSettings()),80)},{passive:true});
    refreshCms().catch(()=>{});
    if(PREVIEW_MODE){
      try{parent.postMessage({type:"zwm-preview-ready"},location.origin)}catch{}
      return;
    }
    const requestSync=()=>{if(document.visibilityState!=="hidden")refreshCms().catch(()=>{})};
    window.addEventListener("focus",requestSync);
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")requestSync()});
    window.addEventListener("storage",event=>{if(event.key===ADMIN_SYNC_KEY)requestSync()});
    setInterval(requestSync,15000);
  }
  init();
})();
