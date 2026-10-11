(() => {
  'use strict';
  const LEGACY_KEY='zwm:first-order-reward:seen:v1';
  const KEY='zwm:first-order-reward:history:v2';
  const VISIT_KEY='zwm:first-order-reward:visit:v2';
  const COOLDOWN=7*24*60*60*1000;
  const PREVIEW=new URL(location.href).searchParams.get('welcome')==='points';
  const page=document.body.dataset.page;
  if(!['home','shop','product','about','recipes','gift'].includes(page))return;
  let card=null,shown=false,closed=false,observer=null,timer=null;
  const copy={
    en:{label:'A little welcome gift',headline:'Your first order, our little thank-you.',points:'+20',unit:'Mouneh Points',body:'Fill your pantry. Earn 20 bonus points on your first paid and delivered website order.',cta:'Shop my first order',details:'Join Mouneh Points before ordering. Your 20-point first-order bonus arrives after payment and delivery are confirmed. Once per customer, phone and email. Cancelled or refunded orders do not qualify.',join:'Join Mouneh Points',terms:'Offer details',close:'Dismiss welcome offer'},
    ar:{label:'هدية ترحيب منّا إلك',headline:'أول طلب إلك… وهديّته علينا.',points:'+20',unit:'نقطة مونة',body:'عبّي بيتك بالمونة، وخُد 20 نقطة مكافأة على أول طلب من الموقع بعد الدفع والتسليم.',cta:'تسوّق وابدأ أول طلب',details:'انضم لنقاط المونة قبل الطلب. تُضاف مكافأة الـ20 نقطة بعد تأكيد الدفع والتسليم، مرة واحدة لكل عميل ورقم هاتف وبريد إلكتروني. الطلبات الملغاة أو المستردة لا تتأهل.',join:'انضم لنقاط المونة',terms:'تفاصيل العرض',close:'إغلاق عرض الترحيب'},
    fr:{label:'Un cadeau de bienvenue',headline:'Votre première commande, notre petit merci.',points:'+20',unit:'points Mouneh',body:'Faites le plein de mouneh : 20 points bonus sur votre première commande payée et livrée sur notre site.',cta:'Faire ma première commande',details:'Rejoignez Mouneh Points avant de commander. Bonus de 20 points après confirmation du paiement et de la livraison. Une fois par client, téléphone et e-mail. Commandes annulées ou remboursées exclues.',join:'Rejoindre Mouneh Points',terms:'Détails de l’offre',close:'Fermer l’offre de bienvenue'}
  };
  const language=()=>window.ZWM_LOCALE?.get?.()||document.documentElement.lang||'en';
  const text=()=>copy[language()]||copy.en;
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function readHistory(){
    let saved=null;
    try{saved=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
    if(!saved){try{saved=JSON.parse(sessionStorage.getItem(KEY)||'null')}catch{}}
    if(saved&&typeof saved==='object')return {count:Math.max(0,Number(saved.count)||0),lastShown:Number(saved.lastShown)||0,dismissed:saved.dismissed===true};
    let legacy=false;try{legacy=localStorage.getItem(LEGACY_KEY)==='1'}catch{}
    const initial={count:legacy?1:0,lastShown:legacy?Date.now():0,dismissed:false};
    if(legacy)saveHistory(initial);
    return initial;
  }
  function saveHistory(value){
    try{localStorage.setItem(KEY,JSON.stringify(value))}catch{}
    try{sessionStorage.setItem(KEY,JSON.stringify(value))}catch{}
  }
  function seen(){
    const h=readHistory();
    if(h.dismissed||h.count>=2)return true;
    try{if(sessionStorage.getItem(VISIT_KEY)==='1')return true}catch{}
    return !PREVIEW&&h.lastShown>0&&Date.now()-h.lastShown<COOLDOWN;
  }
  function recordAppearance(){
    const h=readHistory();saveHistory({...h,count:h.count+1,lastShown:Date.now()});
    try{sessionStorage.setItem(VISIT_KEY,'1')}catch{}
    if(PREVIEW){try{const url=new URL(location.href);url.searchParams.delete('welcome');history.replaceState(history.state,'',url.pathname+url.search+url.hash)}catch{}}
  }
  function memberHasOrdered(){if(PREVIEW)return false;const s=window.ZWM_REWARDS?.getState?.();return !!s?.dashboard?.orders?.length;}
  function busy(){
    if(document.hidden||document.body.classList.contains('welcome-open'))return true;
    return Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]')).some(dialog=>{
      // Closed Quick View keeps its inner dialog mounted. Inspect the whole
      // ancestor chain so a hidden shell does not block the welcome forever.
      if(dialog.closest('[hidden],[aria-hidden="true"],[inert]'))return false;
      for(let node=dialog;node&&node!==document.body;node=node.parentElement){
        const style=getComputedStyle(node);
        if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')return false;
      }
      return true;
    });
  }
  function render(){
    if(!card)return;
    const t=text(),lang=language();
    card.lang=lang;card.dir=lang==='ar'?'rtl':'ltr';
    card.innerHTML='<button class="fob-close" type="button" aria-label="'+esc(t.close)+'">×</button><div class="fob-heading"><img src="/assets/logo.svg" width="44" height="44" alt="Zayt W Mouneh"><span>'+esc(t.label)+'</span></div><div class="fob-reward"><strong dir="ltr">'+t.points+'</strong><span>'+esc(t.unit)+'</span><span class="fob-points-icon" aria-hidden="true">🌿</span></div><h2 id="fobTitle">'+esc(t.headline)+'</h2><p>'+esc(t.body)+'</p><a class="fob-shop" href="/'+(lang==='ar'?'ar/':lang==='fr'?'fr/':'')+'shop#shop">'+esc(t.cta)+' <span aria-hidden="true">'+(lang==='ar'?'←':'→')+'</span></a><div class="fob-footer"><button class="fob-join" type="button">'+esc(t.join)+'</button><details><summary>'+esc(t.terms)+'</summary><p>'+esc(t.details)+'</p><a href="/'+(lang==='ar'?'ar/':lang==='fr'?'fr/':'')+'terms#'+(lang==='ar'?'terms-rewards-ar':'terms-rewards')+'">'+esc(t.terms)+'</a></details></div>';
    card.querySelector('.fob-close').addEventListener('click',()=>dismiss(true));
    card.querySelector('.fob-shop').addEventListener('click',()=>dismiss(true));
    card.querySelector('.fob-join').addEventListener('click',()=>{dismiss();if(window.ZWM_REWARDS?.openSignUp)window.ZWM_REWARDS.openSignUp();else location.href='/'+(lang==='ar'?'ar/':lang==='fr'?'fr/':'')+'account';});
  }
  function dismiss(permanent=true){
    if(permanent&&shown)saveHistory({...readHistory(),dismissed:true});
    closed=true;
    if(card){if(card.contains(document.activeElement))document.activeElement.blur();card.remove();card=null;}
    observer?.disconnect();clearTimeout(timer);
  }
  function check(){
    if(closed)return;
    if(memberHasOrdered()){dismiss(false);return;}
    if(card){if(busy())dismiss(false);return;}
    if(shown||seen())return;
    if(busy()||timer)return;
    timer=setTimeout(()=>{
      timer=null;
      if(closed||seen()||busy()||memberHasOrdered())return;
      shown=true;recordAppearance();
      card=document.createElement('aside');card.className='fob-card';card.setAttribute('aria-labelledby','fobTitle');
      render();document.body.appendChild(card);
      // Non-modal notification: browsing and keyboard focus remain uninterrupted.
    },900);
  }
  observer=new MutationObserver(check);observer.observe(document.body,{attributes:true,subtree:true,attributeFilter:['hidden','aria-hidden','class']});
  document.addEventListener('zwm:account-updated',check);
  document.addEventListener('visibilitychange',check);
  document.addEventListener('zwm:localechange',()=>{render();check();});
  window.addEventListener('storage',e=>{if(e.key===KEY&&seen())dismiss(false)});
  check();
})();
