(function(){
  'use strict';
  var section=document.getElementById('inside-our-shop');
  if(!section)return;
  var track=section.querySelector('.sg-track'),links=Array.from(section.querySelectorAll('[data-sg-photo]'));
  var cover=section.querySelector('[data-sg-cover]'),photos=[cover].concat(links),active=0,lastFocus=null,oldOverflow='';
  var labels={en:{close:'Close photo',prev:'Previous photo',next:'Next photo',gallery:'Shop photo gallery',prevSet:'Previous photos',nextSet:'Next photos',film:'Olive oil being poured at Zayt w Mouneh'},ar:{close:'إغلاق الصورة',prev:'الصورة السابقة',next:'الصورة التالية',gallery:'صور محلّنا',prevSet:'الصور السابقة',nextSet:'الصور التالية',film:'صب زيت الزيتون في محل زيت ومونة'},fr:{close:'Fermer la photo',prev:'Photo précédente',next:'Photo suivante',gallery:'Photos de notre boutique',prevSet:'Photos précédentes',nextSet:'Photos suivantes',film:'Huile d’olive versée chez Zayt w Mouneh'}};
  function lang(){return /^(ar|fr)$/.test(document.documentElement.lang)?document.documentElement.lang:'en'}
  function reduced(){return window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches}
  var dialog=document.createElement('dialog');dialog.className='sg-lightbox';dialog.dataset.noFr='';
  dialog.innerHTML='<button type="button" class="sg-lightbox-close">×</button><button type="button" class="sg-lightbox-prev">‹</button><img alt=""><p id="sgLightboxCaption"></p><p class="sg-lightbox-status" aria-live="polite"></p><button type="button" class="sg-lightbox-next">›</button>';
  dialog.setAttribute('aria-labelledby','sgLightboxCaption');document.body.appendChild(dialog);
  var image=dialog.querySelector('img'),caption=dialog.querySelector('#sgLightboxCaption'),closeButton=dialog.querySelector('.sg-lightbox-close');
  function display(index){
    active=(index+photos.length)%photos.length;
    var photo=photos[active],source=photo.querySelector('img');
    image.src=photo.href;image.alt=source.alt;caption.textContent=active===0?(lang()==='ar'?'من داخل زيت ومونة · سبلين':lang()==='fr'?'Dans Zayt w Mouneh · Sebline':'Inside Zayt w Mouneh · Sebline'):photo.querySelector('figcaption').textContent;
    dialog.querySelector('.sg-lightbox-status').textContent=(active+1)+' / '+photos.length;
  }
  photos.forEach(function(a,index){a.addEventListener('click',function(e){
    if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||typeof dialog.showModal!=='function')return;
    e.preventDefault();lastFocus=a;display(index);oldOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';closeButton.focus();
  })});
  closeButton.addEventListener('click',function(){dialog.close()});
  dialog.addEventListener('click',function(e){if(e.target===dialog)dialog.close()});
  dialog.addEventListener('close',function(){document.body.style.overflow=oldOverflow;if(lastFocus&&lastFocus.isConnected)lastFocus.focus({preventScroll:true})});
  dialog.querySelector('.sg-lightbox-prev').addEventListener('click',function(){display(active-1)});
  dialog.querySelector('.sg-lightbox-next').addEventListener('click',function(){display(active+1)});
  dialog.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();display(active+(e.key==='ArrowRight'?1:-1))}});
  function scroll(direction){track.scrollBy({left:direction*(document.documentElement.dir==='rtl'?-1:1)*track.clientWidth*.8,behavior:reduced()?'auto':'smooth'})}
  section.querySelector('.sg-arrows').hidden=false;
  section.querySelector('[data-sg-prev]').addEventListener('click',function(){scroll(-1)});
  section.querySelector('[data-sg-next]').addEventListener('click',function(){scroll(1)});
  track.addEventListener('keydown',function(e){if(e.target===track&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();var direction=e.key==='ArrowRight'?1:-1;scroll(direction*(document.documentElement.dir==='rtl'?-1:1))}});
  var touchX=null,touchY=null;
  image.addEventListener('touchstart',function(e){touchX=e.changedTouches[0].clientX;touchY=e.changedTouches[0].clientY},{passive:true});
  image.addEventListener('touchend',function(e){if(touchX===null)return;var dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy))display(active+(dx<0?1:-1));touchX=null},{passive:true});
  function localize(){
    var l=lang(),copy=labels[l];
    document.querySelectorAll('.sg-section [data-sg-en],.sg-oil [data-sg-en]').forEach(function(el){el.textContent=el.getAttribute('data-sg-'+l)});
    section.querySelectorAll('[data-sg-alt-en]').forEach(function(el){el.alt=el.getAttribute('data-sg-alt-'+l)});
    track.setAttribute('aria-label',copy.gallery);closeButton.setAttribute('aria-label',copy.close);
    dialog.querySelector('.sg-lightbox-prev').setAttribute('aria-label',copy.prev);dialog.querySelector('.sg-lightbox-next').setAttribute('aria-label',copy.next);
    section.querySelector('[data-sg-prev]').setAttribute('aria-label',copy.prevSet);section.querySelector('[data-sg-next]').setAttribute('aria-label',copy.nextSet);
    if(video)video.setAttribute('aria-label',copy.film);if(dialog.open)display(active);
  }
  var video=document.querySelector('.sg-oil video'),film=document.getElementById('shop-olive-oil-film'),stage=document.getElementById('ghPicksStage');
  // The harvest collection redraws on language changes; keep this independent film beside it.
  function placeFilm(){if(stage&&film&&film.parentNode!==stage)stage.appendChild(film)}
  if(stage&&film){placeFilm();new MutationObserver(placeFilm).observe(stage,{childList:true})}
  if(video){
    if('IntersectionObserver' in window)new IntersectionObserver(function(entries){if(!entries[0].isIntersecting)video.pause()},{threshold:.05}).observe(video);
    document.addEventListener('visibilitychange',function(){if(document.hidden)video.pause()});
  }
  localize();new MutationObserver(localize).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
