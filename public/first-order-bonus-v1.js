(() => {
  'use strict';
  const KEY='zwm:first-order-reward:seen:v1';
  const page=document.body.dataset.page;
  if(!['home','shop','product','about','recipes','gift'].includes(page))return;
  let card=null,shown=false,closed=false,observer=null,timer=null;
  const copy={
    en:{label:'A little welcome gift',headline:'Your first order deserves a little extra.',points:'+20',unit:'Mouneh Points',body:'Earn 20 bonus Mouneh Points on your first paid and delivered website order.',cta:'Shop my first order',details:'Join Mouneh Points before ordering. Your 20-point first-order bonus arrives after payment and delivery are confirmed. Once per customer, phone and email. Cancelled or refunded orders do not qualify.',join:'Join Mouneh Points',terms:'Offer details',close:'Dismiss welcome offer'},
    ar:{label:'هدية صغيرة لترحيب كبير',headline:'أول طلب إلك، ومعه هدية منّا.',points:'+20',unit:'نقطة مونة',body:'احصل على 20 نقطة مونة مكافأة على أول طلب من موقعنا بعد تأكيد الدفع والتسليم.',cta:'تسوّق وابدأ أول طلب',details:'انضم لنقاط المونة قبل الطلب. تُضاف مكافأة الـ20 نقطة بعد تأكيد الدفع والتسليم، مرة واحدة لكل عميل ورقم هاتف وبريد إلكتروني. الطلبات الملغاة أو المستردة لا تتأهل.',join:'انضم لنقاط المونة',terms:'تفاصيل العرض',close:'إغلاق عرض الترحيب'},
    fr:{label:'Un petit cadeau de bienvenue',headline:'Votre première commande mérite un petit plus.',points:'+20',unit:'points Mouneh',body:'Gagnez 20 points Mouneh bonus sur votre première commande payée et livrée sur notre site.',cta:'Faire ma première commande',details:'Rejoignez Mouneh Points avant de commander. Bonus de 20 points après confirmation du paiement et de la livraison. Une fois par client, téléphone et e-mail. Commandes annulées ou remboursées exclues.',join:'Rejoindre Mouneh Points',terms:'Détails de l’offre',close:'Fermer l’offre de bienvenue'}
  };
  const language=()=>window.ZWM_LOCALE?.get?.()||document.documentElement.lang||'en';
  const text=()=>copy[language()]||copy.en;
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function seen(){try{return localStorage.getItem(KEY)==='1'}catch{return false}}
  function memberHasOrdered(){const s=window.ZWM_REWARDS?.getState?.();return !!s?.dashboard?.orders?.length;}
  function busy(){return document.hidden||document.body.classList.contains('welcome-open')||!!document.querySelector('#languageWelcome:not([hidden]),#ghCampaignPopup:not([hidden]),[role="dialog"][aria-modal="true"]:not([hidden])')&&Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]:not([hidden])')).some(e=>e.getAttribute('aria-hidden')!=='true'&&!e.closest('[hidden]')&&getComputedStyle(e).display!=='none');}
  function render(){
    if(!card)return;
    const t=text(),lang=language();
    card.lang=lang;card.dir=lang==='ar'?'rtl':'ltr';
    card.innerHTML='<button class="fob-close" type="button" aria-label="'+esc(t.close)+'">×</button><div class="fob-heading"><img src="/assets/logo.svg" width="44" height="44" alt="Zayt W Mouneh"><span>'+esc(t.label)+'</span></div><div class="fob-reward"><strong dir="ltr">'+t.points+'</strong><span>'+esc(t.unit)+'</span><i aria-hidden="true">🌿</i></div><h2 id="fobTitle">'+esc(t.headline)+'</h2><p>'+esc(t.body)+'</p><a class="fob-shop" href="/'+(lang==='ar'?'ar/':lang==='fr'?'fr/':'')+'shop#shop">'+esc(t.cta)+' <span aria-hidden="true">'+(lang==='ar'?'←':'→')+'</span></a><button class="fob-join" type="button">'+esc(t.join)+'</button><details><summary>'+esc(t.terms)+'</summary><p>'+esc(t.details)+'</p><a href="/'+(lang==='ar'?'ar/':lang==='fr'?'fr/':'')+'terms#'+(lang==='ar'?'terms-rewards-ar':'terms-rewards')+'">'+esc(t.terms)+'</a></details>';
    card.querySelector('.fob-close').addEventListener('click',dismiss);
    card.querySelector('.fob-shop').addEventListener('click',dismiss);
    card.querySelector('.fob-join').addEventListener('click',()=>{dismiss();if(window.ZWM_REWARDS?.openSignUp)window.ZWM_REWARDS.openSignUp();else location.href='/'+(lang==='ar'?'ar/':lang==='fr'?'fr/':'')+'account';});
  }
  function dismiss(){closed=true;if(card){if(card.contains(document.activeElement)){document.activeElement.blur();}card.remove();card=null;}observer?.disconnect();clearTimeout(timer);}
  function check(){
    clearTimeout(timer);
    if(closed)return;
    if(memberHasOrdered()){dismiss();return;}
    if(card){const hidden=busy();if(card.hidden!==hidden)card.hidden=hidden;return;}
    if(shown||seen())return;
    if(busy())return;
    timer=setTimeout(()=>{
      if(closed||seen()||busy()||memberHasOrdered())return;
      shown=true;try{localStorage.setItem(KEY,'1')}catch{}
      card=document.createElement('aside');card.className='fob-card';card.setAttribute('aria-labelledby','fobTitle');
      render();document.body.appendChild(card);
      // Non-modal notification: browsing and keyboard focus remain uninterrupted.
    },900);
  }
  observer=new MutationObserver(check);observer.observe(document.body,{attributes:true,subtree:true,attributeFilter:['hidden','aria-hidden','class']});
  document.addEventListener('zwm:account-updated',check);
  document.addEventListener('visibilitychange',check);
  document.addEventListener('zwm:localechange',()=>{render();check();});
  window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue==='1'&&!shown)dismiss()});
  check();
})();
