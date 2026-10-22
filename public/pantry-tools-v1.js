/* Budget selections and curated taste filters; shared native cart, no separate storage. */
(function(){
 'use strict';
 const tasteIds={
  spicy:['debes-el-fleyfleh-har','kabes-har','bhar-aswad-har','har-kheshen','har-neeme'],
  sweet:['carob-molasses-glass-jar','carob-molasses-plastic-jar','debes-el-enab','flower-honey','cedar-honey','oak-honey','wild-thistle-honey','avocado-orange-blossom-honey','aasal-bshahdo','maraba-el-meshmosh','mraba-el-fraise','mraba-el-karaz','mraba-el-tin-mamrout','mraba-el-tin-yebes','mraba-el-tout','mraba-el-ward','mraba-el-yaqtin','mraba-sfarjel'],
  tangy:['semaq','loumi','loumi-mathoun','debes-el-remen','hamod-el-hosrum-beqaa','hamod-el-hosrum-koura','honey-vingar','khal-el-enab','khal-el-tefeh'],
  crunchy:['crunchy-seeds','joz-farashe','raw-peeled-peanuts','snoubar']
 };
 const texts={
 en:{title:'A pantry that fits your budget.',intro:'Choose a product budget. Preview your selection before adding it to your basket.',budget:'Shop by budget',taste:'Choose your taste',all:'All tastes',spicy:'Spicy',sweet:'Sweet',tangy:'Tangy',crunchy:'Crunchy',hint:'Filter the products below by their known flavour or texture.',preview:'Your suggested selection',add:'Add selection to basket',another:'Try another mix',remove:'Remove',total:'Products total',delivery:'Delivery is calculated separately at checkout. Adds to your current basket.',empty:'No available selection fits this budget right now.',success:'Selection added. You can adjust quantities in your basket.',error:'The selection changed or could not be saved. Please review and try again.',review:'Review basket',remaining:'Budget left',loading:'Loading current products…'},
 ar:{title:'مونة على قدّ ميزانيتك.',intro:'اختار ميزانية المنتجات، وشوف التشكيلة قبل ما تضيفها عالسلّة.',budget:'تسوّق حسب الميزانية',taste:'اختار ع ذوقك',all:'كل النكهات',spicy:'حار',sweet:'حلو',tangy:'حامض',crunchy:'مقرمش',hint:'صفّي المنتجات المعروضة حسب النكهة أو القوام المعروف.',preview:'التشكيلة المقترحة إلك',add:'ضيف التشكيلة عالسلّة',another:'جرّب تشكيلة تانية',remove:'إزالة',total:'مجموع المنتجات',delivery:'التوصيل بينحسب بشكل منفصل عند إتمام الطلب. بتنضاف لسلّتك الحالية.',empty:'ما في تشكيلة متوفّرة ضمن هالميزانية حالياً.',success:'انضافت التشكيلة. فيك تعدّل الكميات بالسلّة.',error:'تغيّرت التشكيلة أو تعذّر حفظها. راجعها وجرّب من جديد.',review:'راجع السلّة',remaining:'باقي من الميزانية',loading:'عم نحمّل المنتجات الحالية…'},
 fr:{title:'Une sélection adaptée à votre budget.',intro:'Choisissez un budget produits et vérifiez la sélection avant de l’ajouter au panier.',budget:'Selon votre budget',taste:'Selon vos goûts',all:'Tous les goûts',spicy:'Épicé',sweet:'Sucré',tangy:'Acidulé',crunchy:'Croquant',hint:'Filtrez les produits ci-dessous selon leur saveur ou texture connue.',preview:'Votre sélection proposée',add:'Ajouter la sélection',another:'Essayer un autre assortiment',remove:'Retirer',total:'Total des produits',delivery:'Livraison calculée séparément au paiement. Ajout à votre panier actuel.',empty:'Aucune sélection disponible dans ce budget pour le moment.',success:'Sélection ajoutée. Modifiez les quantités dans votre panier.',error:'La sélection a changé ou n’a pas pu être enregistrée. Vérifiez et réessayez.',review:'Voir le panier',remaining:'Budget restant',loading:'Chargement des produits…'}
 };
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=n=>'$'+(n/100).toFixed(2);
 const api=()=>window.ZWM_INSTANT_SHOP;
 const lang=()=>api()?.locale?.()||document.documentElement.lang||'en';
 const t=()=>texts[lang()]||texts.en;
 let taste='all',budget=25,rotation=0,rows=[],mount=null,lastLocale='',committing=false,lastAddedAt=0;
 const matches=p=>taste==='all'||tasteIds[taste]?.includes(p.id);
 window.ZWM_PANTRY_TOOLS={matches,resetTaste(){taste='all';renderTaste();document.dispatchEvent(new Event('zwm:tastechange'))}};
 function products(){return api()?.products?.()||[]}
 function options(){
  const preferred=['zaatar-baladi-extra','extra-virgin-olive-oil','semaq','carob-molasses-glass-jar','kabees-khyar','debes-el-remen','flower-honey'];
  return products().filter(p=>(['Olive Oil','Mouneh','Grains','Pulses','Spices','Molasses','Pickles','Olives','Nuts + Seeds','Dates','Vinegars'].includes(p.category)||p.category==='Honey'&&tasteIds.sweet.includes(p.id))).map(p=>({p,v:p.variants.filter(v=>v.price>0).slice().sort((a,b)=>a.price-b.price)[0]})).filter(x=>x.v).sort((a,b)=>{
   const ai=preferred.indexOf(a.p.id),bi=preferred.indexOf(b.p.id);
   return (ai<0?100:ai)-(bi<0?100:bi)||a.p.id.localeCompare(b.p.id);
  });
 }
 function suggest(){
  const source=options(),picked=[],categories=new Set();let total=0;
  const candidates=source.slice(rotation%Math.max(1,source.length)).concat(source.slice(0,rotation%Math.max(1,source.length)));
  for(const x of candidates){
   const cents=Math.round(x.v.price*100);
   if(picked.length>=5)break;
   if(total+cents>budget*100||categories.has(x.p.category))continue;
   picked.push({id:x.p.id,variantId:x.v.id,cents});total+=cents;categories.add(x.p.category);
  }
  rows=picked;renderPreview();
 }
 function renderTaste(){
  if(!mount)return;
  const c=t(),area=mount.querySelector('[data-pt-tastes]');
  area.innerHTML=['all','spicy','sweet','tangy','crunchy'].map(key=>'<button type="button" data-pt-taste="'+key+'" aria-pressed="'+(taste===key)+'">'+esc(c[key])+'</button>').join('');
 }
 function renderPreview(){
  if(!mount)return;
  const c=t(),live=products();
  // Re-resolve every size and price after owner updates. Never retain stale offers.
  rows=rows.map(row=>{const p=live.find(p=>p.id===row.id),v=p?.variants.find(v=>v.id===row.variantId);return v&&v.price>0?{...row,p,v,cents:Math.round(v.price*100)}:null}).filter(Boolean);
  if(rows.reduce((sum,r)=>sum+r.cents,0)>budget*100)rows=[];
  const total=rows.reduce((sum,r)=>sum+r.cents,0);
  mount.querySelector('[data-pt-items]').innerHTML=rows.length?rows.map(row=>'<li>'+(row.p.imageFor?.(row.variantId)?'<img src="'+esc(row.p.imageFor(row.variantId))+'" width="48" height="48" loading="lazy" alt="">':'')+'<div><strong>'+esc(row.p.name)+'</strong><small>'+esc(row.v.label)+' · '+money(row.cents)+'</small></div><button type="button" data-pt-remove="'+esc(row.id)+'" aria-label="'+esc(c.remove+' — '+row.p.name)+'">'+esc(c.remove)+'</button></li>').join(''):'<li>'+esc(live.length?c.empty:c.loading)+'</li>';
  mount.querySelector('[data-pt-total]').textContent=c.total+' · '+money(total);
  mount.querySelector('[data-pt-left]').textContent=c.remaining+' · '+money(budget*100-total);
  mount.querySelector('[data-pt-add]').disabled=!rows.length||committing;
 }
 function render(){
  if(!mount)return;
  const c=t();lastLocale=lang();mount.dir=lang()==='ar'?'rtl':'ltr';
  mount.querySelector('[data-pt-title]').textContent=c.title;
  mount.querySelector('[data-pt-intro]').textContent=c.intro;
  mount.querySelector('[data-pt-budget-label]').textContent=c.budget;
  mount.querySelector('[data-pt-preview-label]').textContent=c.preview;
  mount.querySelector('[data-pt-delivery]').textContent=c.delivery;
  mount.querySelector('[data-pt-taste-label]').textContent=c.taste;
  mount.querySelector('[data-pt-hint]').textContent=c.hint;
  mount.querySelector('[data-pt-another]').textContent=c.another;
  mount.querySelector('[data-pt-add]').textContent=c.add;
  mount.querySelector('[data-pt-review]').textContent=c.review;
  mount.querySelectorAll('[data-pt-budget]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.ptBudget)===budget)));
  renderTaste();renderPreview();
 }
 function init(){
  const home=document.querySelector('#instant-shop .iq-filters'),shop=document.querySelector('.catalog-toolbar');
  if(!home&&!shop)return;
  const host=document.createElement('section');host.className='pantry-tools';host.setAttribute('aria-labelledby','pantryToolsTitle');
  host.innerHTML='<details class="pt-budget"><summary><span data-pt-budget-label></span><span aria-hidden="true">$15 / $25 / $50 ＋</span></summary><div class="pt-budget-body"><h3 id="pantryToolsTitle" data-pt-title></h3><p data-pt-intro></p><div class="pt-options" role="group" data-pt-budgets><button type="button" data-pt-budget="15">$15</button><button type="button" data-pt-budget="25">$25</button><button type="button" data-pt-budget="50">$50</button></div><h4 data-pt-preview-label></h4><ul class="pt-items" data-pt-items></ul><div class="pt-totals"><strong data-pt-total></strong><span data-pt-left></span></div><p class="pt-note" data-pt-delivery></p><div class="pt-actions"><button type="button" data-pt-add></button><button type="button" data-pt-another></button><button type="button" data-pt-review></button></div><p class="pt-status" role="status" data-pt-status></p></div></details><div class="pt-taste"><strong data-pt-taste-label></strong><div class="pt-options" data-pt-tastes role="group"></div><p class="pt-note" data-pt-hint></p></div>';
  if(home)home.before(host);else shop.after(host);mount=host;
  host.addEventListener('click',e=>{
   const tasteBtn=e.target.closest('[data-pt-taste]');
   if(tasteBtn){taste=tasteBtn.dataset.ptTaste;host.querySelectorAll('[data-pt-taste]').forEach(b=>b.setAttribute('aria-pressed',String(b===tasteBtn)));window.renderProducts?.();document.dispatchEvent(new Event('zwm:tastechange'));return}
   const budgetBtn=e.target.closest('[data-pt-budget]');
   if(budgetBtn){budget=Number(budgetBtn.dataset.ptBudget);rotation=0;suggest();render();host.querySelector('[data-pt-status]').textContent='';return}
   const remove=e.target.closest('[data-pt-remove]');
   if(remove){rows=rows.filter(r=>r.id!==remove.dataset.ptRemove);renderPreview();host.querySelector(rows.length?'[data-pt-add]':'[data-pt-another]').focus({preventScroll:true});return}
   if(e.target.closest('[data-pt-another]')){rotation++;suggest();host.querySelector('[data-pt-status]').textContent='';return}
   if(e.target.closest('[data-pt-review]')){api()?.openCart?.();return}
   if(e.target.closest('[data-pt-add]')){
    if(committing||Date.now()-lastAddedAt<800)return;
    committing=true;renderPreview();
    const saved=api()?.addBundle?.(rows.map(r=>({productId:r.id,variantId:r.variantId,price:r.cents/100})),budget);
    if(saved)lastAddedAt=Date.now();
    committing=false;renderPreview();host.querySelector('[data-pt-status]').textContent=saved?t().success:t().error;
   }
  });
  suggest();render();
  window.addEventListener('zwm:cart-rendered',()=>{if(lang()!==lastLocale)render()});
  window.addEventListener('zwm:catalog-cache-updated',()=>{renderPreview();render()});
  document.addEventListener('zwm:localechange',()=>setTimeout(render,0));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else init();
})();
