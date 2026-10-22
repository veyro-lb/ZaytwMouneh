/* Homepage quick-shop: all purchasable catalogue products, genuine variants/prices,
   native cart and normal checkout. No separate order storage or fabricated offers. */
(function(){
  "use strict";
  const root=document.getElementById("instant-shop");
  if(!root||root.dataset.instantBound)return;
  root.dataset.instantBound="1";
  const $=selector=>root.querySelector(selector);
  const preferred=["extra-virgin-olive-oil","labneh-mkaazleh-naanaa","makdous-el-beqaa-seda","carob-molasses-glass-jar","kabees-meete","flower-honey","semaq","zaytoun-akhdar-baladi"];
  const labels={
    en:{
      eyebrow:"Your pantry, your way",title:"Good food. One easy order.",description:"Choose your favourites, pick the right size and add them straight to your basket.",
      full:"Explore the full shop ↗",cash:"Cash on Delivery",fees:"Clear sizes & prices",delivery:"Delivery across Lebanon",
      all:"All products",budget:"Under $10",results:"Choose your favourites — prices shown for each size",size:"Choose size",add:"+ Add",added:"✓ Added",unavailable:"Unavailable",
      cart:"Your basket",empty:"Choose something you love to get started.",remaining:"away from free delivery",unlocked:"Free delivery unlocked ✓",
      shipping:"Delivery fee confirmed at checkout",review:"Review basket →",checkout:"Checkout now ↗",
      load:"Show more products",bonusTitle:"A little thank-you for your first order",bonus:"Join Mouneh Points before ordering and earn 20 bonus points after your first paid and delivered order.",bonusLink:"How it works ↗",noItems:"No matching available products right now.",view:"Quick view",minus:"Decrease quantity",plus:"Increase quantity",error:"Could not add the item. Please try again."
    },
    ar:{
      eyebrow:"مونتك على ذوقك",title:"كل شي بتحبّه… بطلب واحد.",description:"اختار منتجاتك والأحجام اللي بتناسبك، وضيفها عالسلّة دغري.",
      full:"تصفّح كل المنتجات ↖",cash:"الدفع عند الاستلام",fees:"أحجام وأسعار واضحة",delivery:"توصيل لكل لبنان",
      all:"كل المنتجات",budget:"أقل من ١٠$",results:"اختار اللي بتحبّه — السعر واضح لكل حجم",size:"اختار الحجم",add:"+ ضيف",added:"✓ انضاف",unavailable:"غير متوفر",
      cart:"سلّة المونة",empty:"ضيف شغلة بتحبّها وبلّش.",remaining:"للتوصيل المجاني",unlocked:"صار التوصيل مجاني ✓",
      shipping:"رسوم التوصيل النهائية بتظهر عند إتمام الطلب",review:"راجع السلّة ←",checkout:"كمّل الطلب ↖",
      load:"عرض منتجات إضافية",bonusTitle:"هديّة صغيرة على أول طلب",bonus:"اشترك بنقاط المونة قبل الطلب وخد ٢٠ نقطة إضافية بعد دفع وتسليم أول طلب إلك.",bonusLink:"تفاصيل المكافأة ↖",noItems:"ما في منتجات متوفرة بهالقسم حالياً.",view:"نظرة سريعة",minus:"تقليل الكمية",plus:"زيادة الكمية",error:"تعذّرت إضافة المنتج. جرّب مرّة تانية."
    },
    fr:{
      eyebrow:"Votre épicerie, à votre façon",title:"Le goût du Liban. Une commande simple.",description:"Choisissez vos produits, vos formats et ajoutez-les directement au panier.",
      full:"Voir tous les produits ↗",cash:"Paiement à la livraison",fees:"Formats et prix transparents",delivery:"Livraison au Liban",
      all:"Tous les produits",budget:"Moins de 10 $",results:"Choisissez vos produits — prix selon le format",size:"Choisir le format",add:"+ Ajouter",added:"✓ Ajouté",unavailable:"Indisponible",
      cart:"Votre panier",empty:"Choisissez un produit pour commencer.",remaining:"avant la livraison gratuite",unlocked:"Livraison gratuite débloquée ✓",
      shipping:"Frais de livraison confirmés au paiement",review:"Voir le panier →",checkout:"Commander ↗",
      load:"Voir plus de produits",bonusTitle:"Un merci pour votre première commande",bonus:"Rejoignez Mouneh Points avant de commander et obtenez 20 points bonus après paiement et livraison de votre première commande.",bonusLink:"Conditions de l’offre ↗",noItems:"Aucun produit disponible pour le moment.",view:"Aperçu rapide",minus:"Diminuer la quantité",plus:"Augmenter la quantité",error:"Impossible d’ajouter le produit. Veuillez réessayer."
    }
  };
  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const money=n=>"$"+(Math.round((Number(n)||0)*100)/100).toFixed(2);
  let filter="all",visible=8,selected=new Map(),locale="",data=[];
  const api=()=>window.ZWM_INSTANT_SHOP;
  const language=()=>api()?.locale?.()||document.documentElement.lang||"en";
  const copy=()=>labels[language()]||labels.en;
  const productOrder=p=>{const n=preferred.indexOf(p.id);return n<0?preferred.length: n};
  const minPrice=p=>Math.min(...p.variants.map(v=>v.price));
  function getData(){
    try{data=api()?.products?.()||[]}catch{data=[]}
    data.sort((a,b)=>productOrder(a)-productOrder(b));
  }
  function activeItems(){
    const available=data.filter(p=>!window.ZWM_PANTRY_TOOLS||window.ZWM_PANTRY_TOOLS.matches(p));
    if(filter==="all")return available;
    if(filter==="budget")return available.map(p=>({...p,variants:p.variants.filter(v=>v.price<10)})).filter(p=>p.variants.length);
    return available.filter(p=>p.category===filter);
  }
  function renderCopy(){
    const c=copy();
    const ids={
      "[data-iq-eyebrow]":c.eyebrow,"[data-iq-description]":c.description,
      "[data-iq-full]":c.full,"[data-iq-cash]":c.cash,"[data-iq-fees]":c.fees,
      "[data-iq-delivery]":c.delivery,"[data-iq-results]":c.results,"[data-iq-bonus-title]":c.bonusTitle,
      "[data-iq-bonus-copy]":c.bonus,"[data-iq-bonus-link]":c.bonusLink,
      "[data-iq-review]":c.review,"[data-iq-checkout]":c.checkout
    };
    Object.entries(ids).forEach(([selector,text])=>{const el=$(selector);if(el)el.textContent=text});
    const title=$("[data-iq-title]");
    if(title)title.innerHTML=language()==="ar"?"كل شي بتحبّه… <em>بطلب واحد.</em>":language()==="fr"?"Le goût du Liban. <em>Une commande simple.</em>":"Good food. <em>One easy order.</em>";
    root.dir=language()==="ar"?"rtl":"ltr";
    const accountLink=$("[data-iq-bonus-link]");
    if(accountLink)accountLink.href=(language()==="ar"?"/ar":language()==="fr"?"/fr":"")+"/terms#terms-rewards";
  }
  function renderFilters(){
    const c=copy();
    const wanted=["Olive Oil","Mouneh","Honey","Spices","Olives","Pickles","Nuts + Seeds","Grains","Legumes"];
    const distinct=new Map(data.map(p=>[p.category,p.categoryLabel]));
    const order=[...wanted.filter(x=>distinct.has(x)),...Array.from(distinct.keys()).filter(x=>!wanted.includes(x))];
    const choices=[["all",c.all],["budget",c.budget],...order.map(key=>[key,distinct.get(key)])];
    const area=$("[data-iq-filters]");
    const scroll=area.scrollLeft;
    area.innerHTML=choices.map(([key,label])=>'<button class="iq-filter" type="button" data-iq-filter="'+esc(key)+'" aria-pressed="'+String(filter===key)+'">'+esc(label)+'</button>').join("");
    area.scrollLeft=scroll;
  }
  function selectedVariant(product){
    const chosen=product.variants.find(v=>v.id===selected.get(product.id));
    if(chosen)return chosen;
    const best=product.variants.slice().sort((a,b)=>a.price-b.price)[0];
    selected.set(product.id,best.id);
    return best;
  }
  function cardMarkup(p){
    const v=selectedVariant(p);
    const img=p.imageFor?.(v.id);
    const fallback=p.category==="Olive Oil"?"🫒":p.category==="Honey"?"🍯":p.category==="Spices"?"🌿":"🫙";
    const photo=img?'<img src="'+esc(img)+'" width="240" height="240" alt="'+esc(p.name)+'" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="iq-placeholder" hidden aria-hidden="true">'+fallback+'</span>':
      '<span class="iq-placeholder" aria-hidden="true">'+fallback+'</span>';
    const options=p.variants.map(x=>'<option value="'+esc(x.id)+'"'+(x.id===v.id?" selected":"")+'>'+esc(x.label)+' · '+esc(money(x.price))+'</option>').join("");
    const permalink=(language()==="ar"?"/ar":language()==="fr"?"/fr":"")+"/product/"+encodeURIComponent(p.id);
    return '<article class="iq-card" data-iq-product="'+esc(p.id)+'"><div class="iq-art">'+photo+
      (p.id==="extra-virgin-olive-oil"?'<span class="iq-tag">2026 HARVEST</span>':"")+
      '<button class="iq-view" type="button" data-iq-view="'+esc(p.id)+'" aria-label="'+esc(copy().view+' — '+p.name)+'">'+esc(copy().view)+'</button></div><div class="iq-card-body"><span class="iq-category">'+esc(p.categoryLabel)+'</span>'+
      '<a class="iq-name" href="'+esc(permalink)+'">'+esc(p.name)+'</a><div class="iq-card-foot">'+
      '<select class="iq-select" data-iq-select aria-label="'+esc(copy().size+' — '+p.name)+'">'+options+'</select>'+
      '<div class="iq-card-purchase"><strong class="iq-price" dir="ltr">'+esc(money(v.price))+'</strong>'+
      '<button class="iq-add" type="button" data-iq-add="'+esc(p.id)+'">'+esc(copy().add)+'</button>'+
      '<div class="iq-quantity" hidden><button type="button" data-iq-delta="-1" aria-label="'+esc(copy().minus+' — '+p.name)+'">−</button><span data-iq-quantity aria-live="polite">0</span><button type="button" data-iq-delta="1" aria-label="'+esc(copy().plus+' — '+p.name)+'">+</button></div></div></div></div></article>';
  }
  function renderProducts(){
    const items=activeItems();
    const c=copy();
    const grid=$("[data-iq-grid]");
    const current=items.slice(0,visible);
    grid.innerHTML=current.length?current.map(cardMarkup).join(""):'<div class="iq-no-results">'+esc(c.noItems)+'</div>';
    syncQuantities();
    const more=$("[data-iq-more]");
    more.hidden=items.length<=visible;
    more.textContent=c.load+(items.length>visible?" · "+(items.length-visible):"");
    $("[data-iq-results]").textContent=c.results;
  }
  function syncQuantities(){
    root.querySelectorAll("[data-iq-product]").forEach(card=>{
      const qty=api()?.quantity?.(card.dataset.iqProduct,card.querySelector("[data-iq-select]").value)||0;
      card.querySelector("[data-iq-quantity]").textContent=String(qty);
      card.querySelector(".iq-quantity").hidden=!qty;
      card.querySelector("[data-iq-add]").hidden=qty>0;
      card.querySelector('[data-iq-delta="1"]').disabled=qty>=99;
    });
  }
  function updateBasket(){
    syncQuantities();
    const c=copy();
    const summary=api()?.cart?.()||{count:0,subtotal:0,freeAbove:0,canCheckout:false};
    const price=money(summary.subtotal);
    $("[data-iq-review]").disabled=summary.count===0;
    $("[data-iq-cart-total]").textContent=c.cart+" · "+price;
    $("[data-iq-cart-count]").textContent=String(summary.count);
    const threshold=Number(summary.freeAbove)||0;
    const progress=$("[data-iq-progress]");
    const note=$("[data-iq-progress-note]");
    if(threshold>0){
      const remaining=Math.max(0,threshold-summary.subtotal);
      note.textContent=summary.count===0?c.empty:remaining>0?(language()==="ar"?"باقي "+money(remaining)+" "+c.remaining:money(remaining)+" "+c.remaining):c.unlocked;
      progress.parentElement.hidden=false;
      progress.parentElement.setAttribute("aria-valuenow",String(Math.round(Math.min(100,summary.subtotal/threshold*100))));
      progress.hidden=false;
      progress.style.width=Math.max(0,Math.min(100,summary.subtotal/threshold*100))+"%";
    }else{
      note.textContent=summary.count===0?c.empty:c.shipping;
      progress.hidden=true;
      progress.parentElement.hidden=true;
    }
    const checkout=$("[data-iq-checkout]");
    checkout.hidden=!summary.canCheckout;
    const cartBtn=$("[data-iq-review]");
    cartBtn.textContent=c.review;
  }
  function renderAll(){
    getData();
    locale=language();
    renderCopy();
    renderFilters();
    renderProducts();
    updateBasket();
  }
  $("[data-iq-filters]").addEventListener("click",event=>{
    const btn=event.target.closest("[data-iq-filter]");
    if(!btn)return;
    filter=btn.dataset.iqFilter;
    visible=8;
    renderFilters();renderProducts();
    Array.from(root.querySelectorAll("[data-iq-filter]")).find(btn=>btn.dataset.iqFilter===filter)?.focus({preventScroll:true});
  });
  $("[data-iq-grid]").addEventListener("change",event=>{
    const select=event.target.closest("[data-iq-select]");
    if(!select)return;
    const card=select.closest("[data-iq-product]"),p=data.find(x=>x.id===card.dataset.iqProduct);
    if(!p)return;
    const v=p.variants.find(x=>x.id===select.value);
    if(!v)return;
    selected.set(p.id,v.id);
    card.querySelector(".iq-price").textContent=money(v.price);
    syncQuantities();
    const image=card.querySelector(".iq-art img");
    const src=p.imageFor?.(v.id);
    if(image&&src){image.src=src;image.hidden=false;const fallback=image.nextElementSibling;if(fallback)fallback.hidden=true}
  });
  $("[data-iq-grid]").addEventListener("click",event=>{
    const view=event.target.closest("[data-iq-view]");
    if(view){const card=view.closest("[data-iq-product]");api()?.view?.(card.dataset.iqProduct,card.querySelector("[data-iq-select]").value,view);return}
    const step=event.target.closest("[data-iq-delta]");
    if(step){
      const card=step.closest("[data-iq-product]"),add=card.querySelector("[data-iq-add]");
      if(api()?.changeQuantity?.(card.dataset.iqProduct,card.querySelector("[data-iq-select]").value,Number(step.dataset.iqDelta))){
        updateBasket();if(!add.hidden)add.focus({preventScroll:true});
      }
      return;
    }
    const btn=event.target.closest("[data-iq-add]");
    if(!btn)return;
    const card=btn.closest("[data-iq-product]");
    const p=data.find(x=>x.id===card.dataset.iqProduct);
    const variant=p?.variants.find(v=>v.id===card.querySelector("[data-iq-select]").value);
    if(!p||!variant)return;
    const saved=api()?.add?.(p.id,variant.id,btn);
    if(saved){
      btn.classList.add("iq-added");
      btn.textContent=copy().added;
      updateBasket();
      setTimeout(()=>{if(btn.isConnected){btn.classList.remove("iq-added");btn.textContent=copy().add}},1050);
    }else{
      const status=$("[data-iq-live-status]");
      status.textContent=copy().error;
    }
  });
  $("[data-iq-more]").addEventListener("click",()=>{visible+=8;renderProducts()});
  $("[data-iq-review]").addEventListener("click",()=>api()?.openCart?.());
  window.addEventListener("zwm:cart-rendered",()=>{
    if(language()!==locale)renderAll();
    else updateBasket();
  });
  document.addEventListener("zwm:tastechange",()=>{visible=8;renderProducts()});
  window.addEventListener("zwm:catalog-cache-updated",()=>setTimeout(renderAll,0));
  document.addEventListener("zwm:localechange",()=>setTimeout(renderAll,0));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",renderAll,{once:true});else renderAll();
})();
