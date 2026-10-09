/* Zayt w Mouneh Golden Harvest 2026 — campaign-only code, no checkout or catalogue mutation.
   LAUNCH: change ENABLED to true only after approval and Monday Oct 12 deployment.
   Review on a staging deployment with ?harvestPreview=1 (no changes to public settings).
*/
(function(){
  "use strict";
  var ENABLED=false;
  var PREVIEW=new URLSearchParams(location.search).get("harvestPreview")==="1";
  if(!ENABLED&&!PREVIEW)return;
  if(document.body&&document.body.dataset.page!=="home"&&document.body.dataset.page!=="shop")return;
  var PHOTO="/assets/harvest-2026/";
  var OIL_ID="extra-virgin-olive-oil";
  var SIZES=[
    {size:"4",id:"extra-virgin-olive-oil-4-l",file:"4l.webp"},
    {size:"8.77",id:"extra-virgin-olive-oil-8-77-l",file:"8-77l.webp"},
    {size:"17.54",id:"extra-virgin-olive-oil-17-54-l",file:"17-54l.webp"}
  ];
  var COPY={
    en:{overline:"ZAYT W MOUNEH PRESENTS",title:"THE GOLDEN <em>HARVEST</em>",ar:"زيت السنة وصل",
      desc:"Fresh from the 2026 harvest. Lebanese olive oil, ready for your table.",
      discover:"Discover the 2026 Harvest",pantry:"Browse the pantry",
      choose:"CHOOSE YOUR HARVEST",chooseText:"Fresh 2026 harvest olive oil, available in three featured tin sizes.",
      season:"2026 harvest",chooseSize:"Choose this size",unavailable:"Not yet available to order online",inquire:"Ask about this size",
      note:"Prices and order availability come from the current catalogue. Other olive oil sizes remain available in the shop.",
      storyOverline:"THE OLIVE SEASON",story:"FROM THE OLIVE TREE TO YOUR TABLE",
      storyCopy:"Every olive season brings a familiar moment — the harvest, the golden oil, and the first taste shared around the Lebanese table. Celebrate the arrival of the 2026 harvest with Zayt w Mouneh.",
      table:"THE HARVEST TABLE",tableCopy:"Made for the little rituals we love: Lebanese bread, za’atar, table olives and olive oil around the family table.",
      shopZaatar:"Explore za’atar",shopOlives:"Explore olives",
      announcement:"🫒 Fresh 2026 Olive Oil Harvest Has Arrived",announcementLink:"Discover the collection",
      shopDesc:"A new harvest, three beautifully presented tin sizes. Choose the right size and shop using our existing catalogue.",
      allOil:"Shop all olive oil",shopPromo:"THE GOLDEN HARVEST 2026",shopJump:"Explore featured tins"},
    ar:{overline:"تقدّم لكم زيت ومونة",title:"حصاد <em>الذهب</em> ٢٠٢٦",ar:"زيت السنة وصل",
      desc:"زيت زيتون لبناني طازج من حصاد ٢٠٢٦، صار جاهز لسفرتكم.",
      discover:"اكتشفوا حصاد ٢٠٢٦",pantry:"تصفّحوا كل المونة",
      choose:"اختار حجم زيتك",chooseText:"زيت زيتون من حصاد ٢٠٢٦ الطازج، بثلاثة أحجام مميّزة.",
      season:"حصاد ٢٠٢٦",chooseSize:"اختار هالحجم",unavailable:"غير متاح للطلب على الموقع حالياً",inquire:"اسأل عن هالحجم",
      note:"الأسعار والتوفّر حسب الكتالوج الحالي. باقي أحجام زيت الزيتون موجودة في المتجر.",
      storyOverline:"موسم الزيتون",story:"من شجرة الزيتون لسفرتنا",
      storyCopy:"كل موسم زيتون بيرجّع إلنا لحظة منعرفها: القطاف، والزيت الذهبي، وأول لقمة مع العيلة. احتفلوا معنا بوصول زيت حصاد ٢٠٢٦ من زيت ومونة.",
      table:"سفرة الزيت والمونة",tableCopy:"للّمة اللبنانية الطيّبة: خبز وزعتر وزيتون وزيت زيتون على السفرة.",
      shopZaatar:"اكتشفوا الزعتر",shopOlives:"اكتشفوا الزيتون",
      announcement:"🫒 زيت السنة وصل — حصاد ٢٠٢٦",announcementLink:"اكتشفوا الأحجام",
      shopDesc:"حصاد جديد وثلاثة أحجام من صفائح الزيت. اختاروا الحجم المناسب وتسوقوا من الكتالوج الحالي.",
      allOil:"كل أحجام زيت الزيتون",shopPromo:"حصاد الزيتون ٢٠٢٦",shopJump:"اكتشفوا صفائح الزيت"},
    fr:{overline:"ZAYT W MOUNEH PRÉSENTE",title:"LA RÉCOLTE <em>DORÉE</em>",ar:"زيت السنة وصل",
      desc:"Huile d’olive libanaise fraîche de la récolte 2026, prête pour votre table.",
      discover:"Découvrir la récolte 2026",pantry:"Explorer l’épicerie",
      choose:"CHOISISSEZ VOTRE RÉCOLTE",chooseText:"L’huile d’olive fraîche de 2026 en trois formats de bidons sélectionnés.",
      season:"Récolte 2026",chooseSize:"Choisir ce format",unavailable:"Pas encore commandable en ligne",inquire:"Se renseigner sur ce format",
      note:"Les prix et disponibilités viennent du catalogue actuel. Les autres formats restent accessibles en boutique.",
      storyOverline:"LA SAISON DES OLIVES",story:"DE L’OLIVIER À VOTRE TABLE",
      storyCopy:"Chaque saison des olives ravive un moment familier : la récolte, l’huile dorée et la première dégustation autour d’une table libanaise. Célébrez la récolte 2026 avec Zayt w Mouneh.",
      table:"LA TABLE DE LA RÉCOLTE",tableCopy:"Les plaisirs simples d’une table libanaise : pain, zaatar, olives et huile d’olive à partager.",
      shopZaatar:"Découvrir le zaatar",shopOlives:"Découvrir les olives",
      announcement:"🫒 La récolte d’huile d’olive 2026 est arrivée",announcementLink:"Découvrir la collection",
      shopDesc:"Une nouvelle récolte et trois beaux formats. Choisissez le vôtre dans notre catalogue actuel.",
      allOil:"Toutes les huiles d’olive",shopPromo:"LA RÉCOLTE DORÉE 2026",shopJump:"Voir les bidons"}
  };
  function language(){var s=document.documentElement.lang;return s==="ar"?"ar":s==="fr"?"fr":"en"}
  function t(){return COPY[language()]||COPY.en}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
  function catalog(){try{return typeof PRODUCTS_DATA!=="undefined"&&Array.isArray(PRODUCTS_DATA)?PRODUCTS_DATA:[]}catch(e){return []}}
  function oil(){return catalog().find(function(p){return p.id===OIL_ID})}
  function variantFor(size){
    var p=oil();if(!p||!Array.isArray(p.variants))return null;
    return p.variants.find(function(v){
      var a=String(v.sizeEn||"").replace(/\s+/g,"").toLowerCase();
      return a===size.size.toLowerCase()+"l"&&Number.isFinite(Number(v.price))&&Number(v.price)>=0;
    })||null;
  }
  function available(p){
    var a=String(p&&p.availability||"").toLowerCase();
    return !(/out.of.stock|coming.soon|draft|hidden|discontinued|unavailable/.test(a)||p&&p.status==="hidden");
  }
  function money(n){return "$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}
  function shopUrl(variant){return "/shop?category=Olive%20Oil"+(PREVIEW?"&harvestPreview=1":"")+(variant?"&harvestVariant="+encodeURIComponent(variant):"")+"#shop"}
  function photo(img,fallback){
    img.addEventListener("error",function(){if(img.dataset.ghFallback)return;img.dataset.ghFallback="1";img.src=fallback},{once:true});
  }
  function hero(){
    var c=t();
    return '<section class="zwm-gh zwm-gh-hero" aria-labelledby="ghHeroTitle">'+
      '<div class="gh-film" aria-hidden="true"><video id="ghFilm" muted playsinline preload="none" poster="'+PHOTO+'hero-poster.jpg">'+
      '<source src="'+PHOTO+'harvest-film.mp4" type="video/mp4"></video></div><div class="gh-shade"></div>'+
      '<div class="gh-shell gh-hero-inner"><div class="gh-hero-copy">'+
      '<span class="gh-overline">'+esc(c.overline)+'</span>'+
      '<h1 id="ghHeroTitle">'+c.title+'</h1>'+
      '<p class="gh-ar-line" lang="ar" dir="rtl">'+esc(c.ar)+'</p>'+
      '<p class="gh-desc">'+esc(c.desc)+'</p>'+
      '<a class="gh-action" href="#harvest-collection">'+esc(c.discover)+' <span aria-hidden="true">↗</span></a>'+
      '<a class="gh-subaction" href="/shop#shop">'+esc(c.pantry)+'</a>'+
      '</div></div><span class="gh-hero-caption">LEBANON · HARVEST 2026</span></section>';
  }
  function card(s){
    var c=t(),p=oil(),v=variantFor(s),orderable=!!(p&&v&&available(p));
    var href=orderable?shopUrl(v.id):"/#contact";
    var pic=PHOTO+s.file;
    return '<article class="gh-card" data-size="'+s.size+'">'+
      '<figure class="gh-card-figure"><img src="'+pic+'" loading="lazy" decoding="async" width="640" height="800" alt="'+esc((language()==="ar"?"صفيحة زيت زيتون من زيت ومونة، ":language()==="fr"?"Bidon d’huile d’olive Zayt w Mouneh, ":"Zayt w Mouneh olive oil tin, ")+s.size+" L")+'"></figure>'+
      '<h3 class="gh-capacity" dir="ltr">'+s.size+' L</h3><p class="gh-caption">'+esc(c.season)+'</p>'+
      (orderable?'<p class="gh-price">'+money(v.price)+'</p>':'<p class="gh-unavailable">'+esc(c.unavailable)+'</p>')+
      '<a class="gh-action" href="'+href+'"'+(!orderable?' data-gh-inquire="1"':'')+'>'+
      esc(orderable?c.chooseSize:c.inquire)+' <span aria-hidden="true">↗</span></a></article>';
  }
  function collection(){
    var c=t();
    return '<section class="zwm-gh zwm-gh-collection" id="harvest-collection" aria-labelledby="ghChooseTitle">'+
      '<div class="gh-shell"><div class="gh-section-heading"><span class="gh-overline">'+esc(c.shopPromo)+'</span>'+
      '<h2 id="ghChooseTitle">'+esc(c.choose)+'</h2><p>'+esc(c.chooseText)+'</p></div>'+
      '<div class="gh-tins">'+SIZES.map(card).join("")+'</div>'+
      '<p class="gh-bottom-note">'+esc(c.note)+'</p></div></section>';
  }
  function story(){
    var c=t();
    return '<section class="zwm-gh zwm-gh-story" aria-labelledby="ghStoryTitle"><div class="gh-shell gh-story-grid">'+
      '<figure class="gh-story-photo"><img loading="lazy" decoding="async" width="960" height="540" src="'+PHOTO+'hero-poster.jpg" alt="'+esc(language()==="ar"?"قطاف الزيتون اللبناني ٢٠٢٦":language()==="fr"?"Récolte des olives au Liban, 2026":"Lebanese olive harvest, 2026")+'"></figure>'+
      '<div><span class="gh-overline">'+esc(c.storyOverline)+'</span><h2 id="ghStoryTitle">'+esc(c.story)+'</h2><p>'+esc(c.storyCopy)+'</p></div>'+
      '</div></section>';
  }
  function table(){
    var c=t();
    return '<section class="zwm-gh zwm-gh-table"><div class="gh-shell gh-table-grid"><div>'+
      '<span class="gh-overline">ZAYT W MOUNEH</span><h2>'+esc(c.table)+'</h2><p>'+esc(c.tableCopy)+'</p></div>'+
      '<div class="gh-table-links"><a href="/shop?q=zaatar#shop">'+esc(c.shopZaatar)+' ↗</a>'+
      '<a href="/shop?category=Olives#shop">'+esc(c.shopOlives)+' ↗</a></div>'+
      '</div></section>';
  }
  function manageVideo(){
    var video=document.getElementById("ghFilm");if(!video)return;
    var poster=PHOTO+"hero-poster.jpg";
    var still=new Image();still.onerror=function(){video.poster="/assets/videos/home-pantry.jpg"};still.src=poster;
    var reduced=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
    var observer,visible=true;
    var fallback=false;
    function play(){if(reduced||!visible||document.hidden)return;var promise=video.play();if(promise&&promise.catch)promise.catch(function(){})}
    function switchToFallback(){
      if(fallback)return;fallback=true;video.pause();video.src="/assets/videos/home-pantry.mp4";video.poster="/assets/videos/home-pantry.jpg";if(!reduced)play();
    }
    video.addEventListener("error",switchToFallback);
    video.addEventListener("ended",function(){video.pause()});
    video.muted=true;video.defaultMuted=true;video.playsInline=true;
    if(reduced){video.pause();return}
    if("IntersectionObserver" in window){
      observer=new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;if(visible)play();else video.pause()},{threshold:.08});
      observer.observe(video);
    }
    document.addEventListener("visibilitychange",function(){if(document.hidden)video.pause();else play()});
    video.preload="metadata";video.load();play();
  }
  function renderHome(){
    var old=document.querySelector(".home-pantry-hero");if(!old||!old.parentNode)return;
    if(!document.getElementById("ghHeroTitle")){
      var stage=document.createElement("div");stage.id="ghHomeStage";
      stage.innerHTML=hero()+collection()+story()+table();
      old.insertAdjacentElement("beforebegin",stage);
      old.setAttribute("aria-hidden","true");old.inert=true;
      var oldVideo=document.getElementById("shopHeroVideo");
      if(oldVideo){oldVideo.pause();oldVideo.removeAttribute("autoplay");oldVideo.id="inactiveShopHeroVideo";}
    } else {
      document.getElementById("ghHomeStage").innerHTML=hero()+collection()+story()+table();
    }
    document.querySelectorAll("#ghHomeStage .gh-card-figure img").forEach(function(img){photo(img,"/assets/products/originals/extra-virgin-olive-oil.jpg")});
    var storyImg=document.querySelector("#ghHomeStage .gh-story-photo img");if(storyImg)photo(storyImg,"/assets/videos/home-pantry.jpg");
    manageVideo();
  }
  function renderShop(){
    var section=document.querySelector("body[data-page='shop'] .seasonal-story");
    if(!section)return;
    var c=t(),card=section.querySelector(".seasonal-story-card");
    if(!card)return;
    card.classList.add("zwm-gh");
    card.innerHTML='<div class="zwm-gh-shop-copy"><span class="gh-overline">'+esc(c.shopPromo)+'</span>'+
      '<h2>'+esc(c.choose)+'</h2><p>'+esc(c.shopDesc)+'</p>'+
      '<a class="gh-action" href="/'+(PREVIEW?"?harvestPreview=1":"")+'#harvest-collection">'+esc(c.shopJump)+' ↗</a> '+
      '<a style="color:#f4e3b2;margin-inline-start:18px" href="'+shopUrl("")+'">'+esc(c.allOil)+' ↗</a></div>'+
      '<div class="zwm-gh-shop-photo" role="img" aria-label="Olive oil from Zayt w Mouneh"></div>';
    var main=document.querySelector("body[data-page='shop'] main");
    var categories=main&&main.querySelector(".shop-category-hub");
    if(main&&categories&&section.nextElementSibling!==categories)main.insertBefore(section,categories);
    var featured=new URLSearchParams(location.search).get("harvestVariant");
    if(featured&&!window.__ZWM_HARVEST_VARIANT_OPENED__){
      var p=oil(),v=p&&p.variants&&p.variants.find(function(x){return x.id===featured});
      if(v&&available(p)){
        var sel=document.querySelector('select[data-card-variant="'+OIL_ID+'"]');
        if(sel){sel.value=v.id;sel.dispatchEvent(new Event("change",{bubbles:true}));var btn=document.querySelector('button[data-view="'+OIL_ID+'"]');
          if(btn){window.__ZWM_HARVEST_VARIANT_OPENED__=true;btn.click();}
        }
      }
    }
  }
  var announcementBusy=false;
  function setAnnouncement(){
    var text=document.getElementById("announcementText"),link=document.getElementById("announcementOrder");
    if(!text||!link)return;
    var c=t(),value=c.announcement+" — "+c.announcementLink;
    if(text.textContent!==value){announcementBusy=true;text.textContent=value;announcementBusy=false}
    link.textContent=c.announcementLink;
    link.href="/"+(PREVIEW?"?harvestPreview=1":"")+"#harvest-collection";
  }
  function init(){
    if(!document.body||!["home","shop"].includes(document.body.dataset.page))return;
    document.body.classList.add("zwm-harvest-active");
    if(document.body.dataset.page==="home")renderHome();else renderShop();
    setAnnouncement();
    var text=document.getElementById("announcementText");
    if(text&&"MutationObserver" in window)new MutationObserver(function(){if(!announcementBusy)setAnnouncement()}).observe(text,{childList:true,characterData:true,subtree:true});
    var lc=language();
    if("MutationObserver" in window)new MutationObserver(function(){
      var next=language();if(next===lc)return;lc=next;
      if(document.body.dataset.page==="home")renderHome();else renderShop();
      setAnnouncement();
    }).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
    window.addEventListener("zwm:catalog-cache-updated",function(){
      if(document.body.dataset.page==="home")renderHome();else renderShop();
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();
