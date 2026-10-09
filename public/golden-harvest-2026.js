/* Golden Harvest 2026 — isolated, preview-gated seasonal launch.
   Main homepage hero and all existing collections remain intact.
   Preview on the branch with ?harvestPreview=1; force popup for QA with &harvestPopup=1.
   Set ENABLED=true only when the owner approves the planned public launch. */
(function(){
  "use strict";
  var ENABLED=false;
  var params=new URLSearchParams(location.search);
  var PREVIEW=params.get("harvestPreview")==="1";
  if(!ENABLED&&!PREVIEW)return;
  var page=document.body&&document.body.dataset.page;
  if(page!=="home"&&page!=="shop")return;
  var PHOTO="/assets/harvest-2026/";
  var OIL_ID="extra-virgin-olive-oil";
  var POPUP_KEY="zwm-golden-harvest-2026-popup-seen-v1";
  var SHOW_POPUP_AGAIN=params.get("harvestPopup")==="1"&&PREVIEW;
  var SIZES=[
    {size:"4",id:"extra-virgin-olive-oil-4-l",file:"4l.webp"},
    {size:"8.77",id:"extra-virgin-olive-oil-8-77-l",file:"8-77l.webp"},
    {size:"17.54",id:"extra-virgin-olive-oil-17-54-l",file:"17-54l.webp"}
  ];
  var COPY={
    en:{
      kicker:"SEASONAL PICKS · HARVEST 2026",
      title:"Fresh From the Harvest",
      description:"Discover our 2026 Lebanese cold-pressed extra virgin olive oil.",
      badge:"JUST ARRIVED · 2026 HARVEST",
      smallBadge:"2026 HARVEST",
      price:"Price",add:"Add to cart",inquire:"Ask about availability",
      unavailable:"Price and online ordering not yet available for this size.",
      viewAll:"See all olive oil sizes",notes:"Lebanese olive oil · Fresh harvest · Three featured sizes",
      imageAlt:"Zayt w Mouneh olive oil tin",
      popupKicker:"ZAYT W MOUNEH · 2026 OLIVE HARVEST",
      popupTitle:"The 2026 Harvest<br><em>Has Arrived</em>",
      popupSubtitle:"The olive oil of the season has arrived.",
      popupDescription:"Discover our Lebanese extra virgin olive oil, cold-pressed for the 2026 season. Find the right tin for your table.",
      popupDiscover:"Discover the Harvest",popupContinue:"Continue to Website",popupClose:"Close harvest announcement",
      popupFilm:"2026 olive harvest announcement film",
      announcement:"🫒 THE 2026 HARVEST HAS ARRIVED",announcementLink:"Explore the harvest",
      shopTitle:"The 2026 harvest is here",shopText:"See our three featured olive oil tins, then choose the right size for your table.",
      shopCta:"Explore Seasonal Picks",shopAll:"Shop all olive oil"
    },
    ar:{
      kicker:"مختارات الموسم · موسم الزيتون ٢٠٢٦",
      title:"زيت السنة وصل",
      description:"زيت زيتون بكر ممتاز معصور على البارد، من موسم الزيتون ٢٠٢٦.",
      badge:"وصل جديد · موسم ٢٠٢٦",
      smallBadge:"موسم ٢٠٢٦",
      price:"السعر",add:"أضف إلى السلة",inquire:"استفسر عن التوفّر",
      unavailable:"السعر والطلب عبر الموقع غير متاحين لهذا الحجم حالياً.",
      viewAll:"تصفّح كل أحجام زيت الزيتون",notes:"زيت زيتون بكر ممتاز معصور على البارد · موسم الزيتون ٢٠٢٦ · ثلاثة أحجام",
      imageAlt:"صفيحة زيت زيتون من زيت ومونة",
      popupKicker:"زيت ومونة · موسم الزيتون ٢٠٢٦",
      popupTitle:"زيت السنة <em>وصل</em>",
      popupSubtitle:"زيت السنة وصل",
      popupDescription:"زيت زيتون بكر ممتاز معصور على البارد، من موسم الزيتون ٢٠٢٦. اكتشفوا صفائح الزيت واختاروا الحجم المناسب لسفرتكم.",
      popupDiscover:"اكتشفوا زيت الموسم",popupContinue:"المتابعة إلى الموقع",popupClose:"إغلاق إعلان موسم الزيتون",
      popupFilm:"فيديو موسم الزيتون ٢٠٢٦",
      announcement:"🫒 زيت السنة وصل — موسم الزيتون ٢٠٢٦",announcementLink:"اكتشفوا زيت الموسم",
      shopTitle:"زيت السنة وصل",shopText:"زيت زيتون بكر ممتاز معصور على البارد من موسم الزيتون ٢٠٢٦، متوفّر بثلاثة أحجام مميّزة لسفرتكم.",
      shopCta:"اكتشفوا مختارات الموسم",shopAll:"كل أحجام زيت الزيتون"
    },
    fr:{
      kicker:"SÉLECTIONS DE SAISON · RÉCOLTE 2026",
      title:"La récolte 2026 est arrivée",
      description:"Découvrez notre huile d’olive vierge extra libanaise, pressée à froid, de la saison 2026.",
      badge:"NOUVEAU · RÉCOLTE 2026",
      smallBadge:"RÉCOLTE 2026",
      price:"Prix",add:"Ajouter au panier",inquire:"Demander la disponibilité",
      unavailable:"Prix et commande en ligne indisponibles pour ce format actuellement.",
      viewAll:"Voir tous les formats d’huile d’olive",notes:"Huile d’olive libanaise · Nouvelle récolte · Trois formats",
      imageAlt:"Bidon d’huile d’olive Zayt w Mouneh",
      popupKicker:"ZAYT W MOUNEH · RÉCOLTE DES OLIVES 2026",
      popupTitle:"La récolte 2026<br><em>est arrivée</em>",
      popupSubtitle:"L’huile d’olive de la saison est arrivée.",
      popupDescription:"Découvrez notre huile d’olive vierge extra libanaise, pressée à froid, de la saison 2026. Choisissez le bidon idéal pour votre table.",
      popupDiscover:"Découvrir la récolte",popupContinue:"Continuer vers le site",popupClose:"Fermer l’annonce de la récolte",
      popupFilm:"Film de la récolte des olives 2026",
      announcement:"🫒 LA RÉCOLTE 2026 EST ARRIVÉE",announcementLink:"Découvrir la récolte",
      shopTitle:"La récolte 2026 est arrivée",shopText:"Découvrez nos trois bidons d’huile d’olive de la nouvelle récolte, et choisissez le format adapté à votre table.",
      shopCta:"Découvrir les sélections de saison",shopAll:"Toutes les huiles d’olive"
    }
  };
  function language(){var l=document.documentElement.lang;return l==="ar"?"ar":l==="fr"?"fr":"en"}
  function tr(){return COPY[language()]}
  function dir(){return language()==="ar"?"rtl":"ltr"}
  function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
  function formatUSD(value){return new Intl.NumberFormat(language()==="fr"?"fr-LB":"en-LB",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(value)}
  function reduceMotion(){return !!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)}
  function getFlag(){try{return localStorage.getItem(POPUP_KEY)==="1"}catch(e){return Boolean(window.__ZWM_GH_POPUP_SEEN__)}}
  function setFlag(){try{localStorage.setItem(POPUP_KEY,"1")}catch(e){window.__ZWM_GH_POPUP_SEEN__=true}}
  function catalogueProduct(){try{return typeof PRODUCTS_DATA!=="undefined"&&Array.isArray(PRODUCTS_DATA)?PRODUCTS_DATA.find(function(p){return p.id===OIL_ID}):null}catch(e){return null}}
  function variantFor(size){
    var p=catalogueProduct();
    if(!p||!Array.isArray(p.variants))return null;
    return p.variants.find(function(v){
      return v.id===size.id&&String(v.sizeEn||"").replace(/\s+/g,"").toLowerCase()===size.size.toLowerCase()+"l"&&
        Number.isFinite(Number(v.price))&&Number(v.price)>=0;
    })||null;
  }
  function offer(size){
    var v=variantFor(size);
    if(!v)return null;
    // Prices always come directly from the current catalogue; the cart bridge only
    // determines whether the existing storefront can safely accept an order.
    var api=window.ZWM_HARVEST_CART;
    var linked=api&&typeof api.offer==="function"?api.offer(OIL_ID,v.id):null;
    return {price:linked&&Number.isFinite(Number(linked.price))?Number(linked.price):Number(v.price),
      available:!!(linked&&linked.available&&typeof api.add==="function")};
  }
  function imageFallback(img){img.addEventListener("error",function(){img.hidden=true;var note=document.createElement("span");note.className="gh-image-fallback";note.textContent=tr().imageAlt;img.parentNode.appendChild(note)},{once:true})}
  function card(size){
    var t=tr(),v=variantFor(size),o=offer(size),orderable=!!(o&&o.available);
    return '<article class="gh-pick-card" data-gh-size="'+esc(size.size)+'">'+
      '<span class="gh-pick-badge">'+esc(t.smallBadge)+'</span>'+
      '<div class="gh-pick-figure"><img src="'+PHOTO+size.file+'" loading="lazy" decoding="async" width="640" height="800" alt="'+esc(t.imageAlt+" — "+size.size+" L")+'"></div>'+
      '<div class="gh-pick-information"><h3 class="gh-pick-capacity" dir="ltr">'+esc(size.size)+' L</h3>'+
      (o?'<p class="gh-pick-price"><span class="gh-sr-only">'+esc(t.price)+': </span>'+esc(formatUSD(o.price))+'</p>':
          '<p class="gh-pick-price-gh-unset">'+esc(t.unavailable)+'</p>')+
      (orderable?
        '<button class="gh-pick-buy" type="button" data-gh-add="'+esc(size.id)+'">'+esc(t.add)+' <span aria-hidden="true">↗</span></button>':
        '<a class="gh-pick-inquire" href="/contact">'+esc(t.inquire)+' <span aria-hidden="true">↗</span></a>')+
      '</div></article>';
  }
  function collectionMarkup(){
    var t=tr();
    return '<section class="zwm-gh gh-picks" lang="'+language()+'" dir="'+dir()+'" id="harvest-picks" aria-labelledby="ghPicksTitle">'+
      '<div class="gh-shell"><header class="gh-picks-intro">'+
      '<div class="gh-picks-arrival"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M18 3c-3 1-7 5-9 11M6 9c3 1 5 4 6 7M9 14l-2 6M14 8l6 1" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/><path d="M16 4c4-2 5 1 3 4-2 2-4 2-5 1M5 8c-2 3-1 5 2 6 2 1 3 0 4-1" stroke="currentColor" stroke-width="1.3" fill="none"/></svg>'+
      '<span>'+esc(t.badge)+'</span></div>'+
      '<span class="gh-picks-kicker">'+esc(t.kicker)+'</span>'+
      '<h2 id="ghPicksTitle">'+esc(t.title)+'</h2>'+
      '<p>'+esc(t.description)+'</p>'+
      '<div class="gh-picks-divider" aria-hidden="true"><i></i><span>✦</span><i></i></div>'+
      '</header>'+
      '<div class="gh-picks-grid">'+SIZES.map(card).join("")+'</div>'+
      '<div class="gh-picks-footer"><p>'+esc(t.notes)+'</p><a href="/shop?category=Olive%20Oil#shop">'+esc(t.viewAll)+' <span aria-hidden="true">↗</span></a></div></div></section>';
  }
  function renderPicks(){
    var anchor=document.querySelector("body[data-page='home'] #featured");
    if(!anchor)return;
    var stage=document.getElementById("ghPicksStage");
    if(!stage){stage=document.createElement("div");stage.id="ghPicksStage";anchor.parentNode.insertBefore(stage,anchor)}
    stage.innerHTML=collectionMarkup();
    stage.querySelectorAll(".gh-pick-figure img").forEach(imageFallback);
    revealCards(stage);
  }
  var revealObserver=null;
  function revealCards(stage){
    if(revealObserver){revealObserver.disconnect();revealObserver=null}
    var cards=stage.querySelectorAll(".gh-pick-card");
    if(reduceMotion()||!("IntersectionObserver" in window)){cards.forEach(function(card){card.classList.add("gh-visible")});return}
    revealObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add("gh-visible");revealObserver.unobserve(entry.target)}});
    },{threshold:.08,rootMargin:"0px 0px 50px 0px"});
    cards.forEach(function(card){revealObserver.observe(card)});
  }
  function setupCart(){
    var stage=document.getElementById("ghPicksStage");if(!stage)return;
    stage.addEventListener("click",function(event){
      var btn=event.target.closest("[data-gh-add]");
      if(!btn||!stage.contains(btn))return;
      event.preventDefault();
      if(btn.disabled)return;
      var size=SIZES.find(function(s){return s.id===btn.dataset.ghAdd});
      var o=size&&offer(size);
      var api=window.ZWM_HARVEST_CART;
      if(!o||!o.available||!api||typeof api.add!=="function"){renderPicks();return}
      btn.disabled=true;
      try{
        if(!api.add(OIL_ID,size.id)){renderPicks();return}
        btn.classList.add("gh-pick-added");
      }finally{setTimeout(function(){if(btn.isConnected)btn.disabled=false},450)}
    });
  }
  var popup,previousFocus,film,modalReady=false,welcomeObserver=null;
  function popupMarkup(){
    var t=tr();
    return '<div class="gh-popup-backdrop" data-gh-close="backdrop"></div>'+
      '<section class="gh-popup-panel" role="dialog" aria-modal="true" aria-labelledby="ghPopupTitle" aria-describedby="ghPopupDescription" lang="'+language()+'" dir="'+dir()+'">'+
        '<video class="gh-popup-video" id="ghPopupFilm" aria-label="'+esc(t.popupFilm)+'" muted playsinline loop preload="none" poster="'+PHOTO+'hero-poster.jpg" aria-hidden="true">'+
          '<source src="'+PHOTO+'harvest-film.mp4" type="video/mp4"></video>'+
        '<div class="gh-popup-shade" aria-hidden="true"></div>'+
        '<button class="gh-popup-dismiss" type="button" data-gh-close="button" aria-label="'+esc(t.popupClose)+'">×</button>'+
        '<div class="gh-popup-content">'+
          '<img class="gh-popup-logo" src="/assets/logo.svg" alt="Zayt w Mouneh" width="94" height="94">'+
          '<span class="gh-popup-kicker">'+esc(t.popupKicker)+'</span>'+
          '<h2 id="ghPopupTitle">'+t.popupTitle+'</h2>'+
          '<p class="gh-popup-subtitle">'+esc(t.popupSubtitle)+'</p>'+
          '<p id="ghPopupDescription" class="gh-popup-description">'+esc(t.popupDescription)+'</p>'+
          '<div class="gh-popup-actions"><button class="gh-popup-discover" type="button" data-gh-discover>'+
             esc(t.popupDiscover)+' <span aria-hidden="true">↗</span></button>'+
             '<button class="gh-popup-continue" type="button" data-gh-close="continue">'+esc(t.popupContinue)+'</button></div>'+
        '</div>'+
        '<span class="gh-popup-film-label" aria-hidden="true">'+esc(t.smallBadge)+'</span>'+
      '</section>';
  }
  function closePopup(shouldScroll){
    if(!popup||popup.hidden)return;
    popup.hidden=true;
    popup.classList.remove("gh-is-open");
    document.body.classList.remove("gh-popup-open");
    setFlag();
    if(film){film.pause();film.removeAttribute("autoplay")}
    if(shouldScroll){
      var target=document.getElementById("harvest-picks");
      if(target){target.scrollIntoView({behavior:reduceMotion()?"auto":"smooth",block:"start"});target.setAttribute("tabindex","-1");target.focus({preventScroll:true})}
    }else{
      var restore=previousFocus&&previousFocus.isConnected&&!previousFocus.closest("#languageWelcome")?previousFocus:
        document.querySelector(".home-pantry-hero h1, main h1, main");
      if(restore){if(!restore.hasAttribute("tabindex")&&!/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(restore.tagName))restore.setAttribute("tabindex","-1");restore.focus({preventScroll:true})}
    }
  }
  function popupKeydown(event){
    if(!popup||popup.hidden)return;
    if(event.key==="Escape"){event.preventDefault();closePopup(false);return}
    if(event.key!=="Tab")return;
    var focusables=Array.from(popup.querySelectorAll('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')).filter(function(el){return el.getClientRects().length>0});
    if(!focusables.length)return;
    var first=focusables[0],last=focusables[focusables.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }
  function updatePopupText(){
    if(!popup||popup.hidden)return;
    var isActive=document.activeElement&&popup.contains(document.activeElement);
    var focusKey=isActive?(document.activeElement.dataset.ghClose|| (document.activeElement.hasAttribute("data-gh-discover")?"discover":"")):"";
    if(film)film.pause();
    popup.innerHTML=popupMarkup();
    film=popup.querySelector("#ghPopupFilm");
    setupPopupFilm();
    var focused=focusKey==="discover"?popup.querySelector("[data-gh-discover]"):popup.querySelector('[data-gh-close="'+focusKey+'"]');
    if(focused)focused.focus({preventScroll:true});
  }
  function setupPopupFilm(){
    if(!film)return;
    film.muted=true;film.defaultMuted=true;film.playsInline=true;
    if(reduceMotion())return;
    film.preload="metadata";
    var play=film.play();if(play&&play.catch)play.catch(function(){});
  }
  function openPopup(){
    if(!popup||!popup.hidden)return;
    if(document.body.classList.contains("welcome-open"))return;
    previousFocus=document.activeElement;
    popup.hidden=false;
    popup.classList.add("gh-is-open");
    popup.innerHTML=popupMarkup();
    film=popup.querySelector("#ghPopupFilm");
    document.body.classList.add("gh-popup-open");
    setupPopupFilm();
    var first=popup.querySelector("[data-gh-discover]");
    if(first)first.focus({preventScroll:true});
  }
  function startPopupAfterLanguageWelcome(){
    if(page!=="home"||getFlag()&&!SHOW_POPUP_AGAIN)return;
    var welcome=document.getElementById("languageWelcome");
    function ready(){
      if(welcome&&(!welcome.hidden||document.body.classList.contains("welcome-open")))return false;
      openPopup();return true;
    }
    if(ready())return;
    if(welcome&&"MutationObserver" in window){
      welcomeObserver=new MutationObserver(function(){if(ready()){welcomeObserver.disconnect();welcomeObserver=null}});
      welcomeObserver.observe(welcome,{attributes:true,attributeFilter:["hidden","class","aria-hidden"]});
    }
  }
  function setupPopup(){
    if(page!=="home"||modalReady)return;
    modalReady=true;
    popup=document.createElement("div");
    popup.id="ghCampaignPopup";
    popup.className="gh-popup";
    popup.hidden=true;
    document.body.appendChild(popup);
    popup.addEventListener("click",function(event){
      if(event.target.closest("[data-gh-discover]")){closePopup(true);return}
      if(event.target.closest("[data-gh-close]"))closePopup(false);
    });
    document.addEventListener("keydown",popupKeydown);
    document.addEventListener("visibilitychange",function(){
      if(!film||!popup||popup.hidden)return;
      if(document.hidden)film.pause();
      else if(!reduceMotion()){var p=film.play();if(p&&p.catch)p.catch(function(){})}
    });
    startPopupAfterLanguageWelcome();
  }
  function renderShop(){
    var section=document.querySelector("body[data-page='shop'] .seasonal-story");
    if(!section)return;
    var card=section.querySelector(".seasonal-story-card");if(!card)return;
    var t=tr();
    card.classList.add("zwm-gh","gh-shop-spotlight");
    card.lang=language();card.dir=dir();
    card.innerHTML='<div class="gh-shop-spotlight-copy"><span class="gh-picks-kicker">'+esc(t.kicker)+'</span>'+
      '<h2>'+esc(t.shopTitle)+'</h2><p>'+esc(t.shopText)+'</p>'+
      '<a class="gh-shop-cta" href="/'+(PREVIEW?"?harvestPreview=1":"")+'#harvest-picks">'+esc(t.shopCta)+' ↗</a>'+
      ' <a class="gh-shop-all" href="/shop?category=Olive%20Oil#shop">'+esc(t.shopAll)+' ↗</a></div>'+
      '<img class="gh-shop-spotlight-image" loading="lazy" decoding="async" src="'+PHOTO+'17-54l.webp" alt="'+esc(t.imageAlt+" — 17.54 L")+'">';
  }
  var announcementBusy=false;
  function announcement(){
    var label=document.getElementById("announcementText");
    var action=document.getElementById("announcementOrder");
    if(!label||!action)return;
    var t=tr(),value=t.announcement;
    if(label.textContent!==value){announcementBusy=true;label.textContent=value;announcementBusy=false}
    action.textContent=t.announcementLink;
    action.href="/"+(PREVIEW?"?harvestPreview=1":"")+"#harvest-picks";
    label.closest(".announcement")?.classList.add("gh-announcement");
  }
  function init(){
    if(document.body.dataset.page!=="home"&&document.body.dataset.page!=="shop")return;
    document.body.classList.add("zwm-harvest-active");
    if(page==="home"){renderPicks();setupCart();setupPopup()}
    else renderShop();
    announcement();
    var oldLang=language();
    if("MutationObserver" in window)new MutationObserver(function(){
      var next=language();if(next===oldLang)return;oldLang=next;
      if(page==="home"){renderPicks();updatePopupText()}else renderShop();
      announcement();
    }).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
    document.addEventListener("zwm:localechange",function(){
      if(language()===oldLang)return;oldLang=language();
      if(page==="home"){renderPicks();updatePopupText()}else renderShop();
      announcement();
    });
    window.addEventListener("zwm:catalog-cache-updated",function(){if(page==="home")renderPicks()});
    var text=document.getElementById("announcementText");
    if(text&&"MutationObserver" in window)new MutationObserver(function(){if(!announcementBusy)announcement()}).observe(text,{childList:true,characterData:true,subtree:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();