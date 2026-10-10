
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function safeStorageGet(key,fallback=null){
  try{
    const value=window.localStorage.getItem(key);
    return value===null?fallback:value;
  }catch{
    return fallback;
  }
}
function safeStorageSet(key,value){
  try{
    window.localStorage.setItem(key,value);
    return true;
  }catch{
    return false;
  }
}
function acceptSingleTap(el,ms=280){
  if(!el)return true;
  const now=Date.now();
  const until=Number(el.dataset.zwmTapLock||0);
  if(now<until)return false;
  el.dataset.zwmTapLock=String(now+ms);
  return true;
}
function uiIcon(name,active=false){
  if(name==="heart")return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5S4 16 2.6 10.8C1.7 7.5 3.8 4.5 7 4.5c2 0 3.6 1 5 2.7 1.4-1.7 3-2.7 5-2.7 3.2 0 5.3 3 4.4 6.3C20 16 12 20.5 12 20.5Z" ${active?'fill="currentColor"':'fill="none"'} stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
  if(name==="eye")return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-5.6 9.5-5.6S21.5 12 21.5 12 18.1 17.6 12 17.6 2.5 12 2.5 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
  return "";
}
function productPhotoMarkup(p,cls="product-image",variantId){
  const source=window.ZWM_PRODUCT_PHOTOS?.sourceFor(p.id,variantId);
  if(!source)return "";
  const posX=Math.max(0,Math.min(100,Number(source.positionX??50)));
  const posY=Math.max(0,Math.min(100,Number(source.positionY??50)));
  const zoom=Math.max(100,Math.min(180,Number(source.zoom??100)));
  const rotation=Number(source.rotation)||0;
  const fit=source.fit==="contain"?"contain":"cover";
  const framingStyle=`--zwm-photo-position:${posX}% ${posY}%;--zwm-photo-scale:${zoom/100};--zwm-photo-rotation:${rotation}deg;--zwm-photo-fit:${fit};`;
  return `<img class="${escapeHtml(cls)} product-photo-original" src="${escapeHtml(source.url)}" width="${source.width}" height="${source.height}" data-photo-width="${source.width}" data-photo-height="${source.height}" data-photo-quality="${escapeHtml(source.quality||"original-supplied")}" style="${framingStyle}" alt="${escapeHtml(currentName(p))}" loading="lazy" decoding="async">`;
}
function renderStaticProductPhotos(root=document){
  root.querySelectorAll("[data-product-photo]").forEach(slot=>{
    const p=productById(slot.dataset.productPhoto);
    if(!p)return;
    slot.innerHTML=productVisualMarkup(p,"decorative-product-image");
    slot.classList.add("has-product-photo");
  });
}
function productPlaceholderMarkup(p,cls="product-image"){
  return `<span class="${escapeHtml(cls)} product-photo-placeholder" role="img" aria-label="${escapeHtml(currentName(p))}"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M19 18h26l-2.5 34h-21L19 18Z"/><path d="M23 18V12h18v6"/><path d="M27 33c5-6 12-8 18-7-2 7-7 12-15 13"/><path d="M31 39v8"/></svg><small>${escapeHtml(categoryName(p.category))}</small></span>`;
}
function productVisualMarkup(p,cls="product-image",variantId){
  const photo=productPhotoMarkup(p,cls,variantId);
  if(photo)return photo;
  return productPlaceholderMarkup(p,cls);
}

function productAvailability(p){
  const value=String(p?.availability||"in_stock").trim().toLowerCase();
  return ["in_stock","low_stock","seasonal","available_on_request","out_of_stock","coming_soon"].includes(value)?value:"in_stock";
}
function productCanOrder(p){
  return productAvailability(p)==="in_stock";
}
function availabilityLabel(p){
  const value=productAvailability(p);
  const labels=lang==="ar"
    ?{in_stock:"متوفر",low_stock:"مخزون منخفض",seasonal:"موسمي",available_on_request:"متوفر عند الطلب",out_of_stock:"غير متوفر",coming_soon:"قريباً"}
    :lang==="fr"?{in_stock:"En stock",low_stock:"Stock limité",seasonal:"Saisonnier",available_on_request:"Sur demande",out_of_stock:"Épuisé",coming_soon:"Bientôt disponible"}
    :{in_stock:"In stock",low_stock:"Low stock",seasonal:"Seasonal",available_on_request:"Available on request",out_of_stock:"Out of stock",coming_soon:"Coming soon"};
  return labels[value]||labels.in_stock;
}

window.addEventListener("zwm-product-photos-ready",()=>{
  renderStaticProductPhotos();
  renderProducts();
  renderCategories();
  renderFeaturedProducts();
  renderRecent();
  renderGiftPickerResults();
  if(currentModalProduct)renderModal(currentModalProduct.id,currentModalVariant?.id);
});
const WA="96170381412";
function liveCmsSettings(){
  try{
    const connected=window.ZWM_CMS?.getSettings?.();
    if(connected&&typeof connected==="object")return connected;
    return JSON.parse(localStorage.getItem("zwm:cms:settings:v1")||"{}")||{};
  }catch{return {}}
}
function currentWhatsAppNumber(){
  const value=String(liveCmsSettings()?.contact?.whatsapp||"").replace(/\D/g,"");
  return !value||value==="96181581230"?WA:value;
}
function deliveryQuoteFor(subtotal,area=""){
  if(window.ZWM_CMS?.deliveryQuote)return window.ZWM_CMS.deliveryQuote(subtotal,area);
  const delivery=liveCmsSettings()?.delivery||{};
  const amount=Math.max(0,Number(subtotal)||0);
  const freeAbove=Math.max(0,Number(delivery.freeAbove)||0)||50;
  const minimum=Math.max(0,Number(delivery.minimum)||0);
  const zones=Array.isArray(delivery.zones)?delivery.zones:[];
  const normalized=String(area||"").trim().toLowerCase();
  const zone=normalized?zones.find(z=>{
    const key=String(z?.area||"").trim().toLowerCase();
    return key&&(normalized.includes(key)||key.includes(normalized));
  }):null;
  const baseFee=Math.max(0,Number(zone?.fee ?? delivery.fee)||0);
  return {fee:freeAbove>0&&amount>=freeAbove?0:baseFee,freeAbove,minimum,eta:String(zone?.eta||delivery.eta||"").trim(),zone:zone||null};
}
const CART_KEY="zwm-cart-v5";
const LANG_KEY="zwm-lang-v2";
const WELCOME_KEY="zwm-welcome-seen-v3";
const FAV_KEY="zwm-favorites-v1";
const RECENT_KEY="zwm-recent-v1";
const GIFT_KEY="zwm-gift-items-v1";
const PAGE_SIZE=24;
const MOBILE_PAGE_SIZE=12;
function catalogPageSize(){return window.matchMedia&&window.matchMedia("(max-width:760px)").matches?MOBILE_PAGE_SIZE:PAGE_SIZE;}
const FEATURED_IDS=["zaatar-baladi-extra","extra-virgin-olive-oil","flower-honey","kishek-zayt-w-mouneh","debes-el-remen","zaytoun-akhdar-beqaa","burglur-asmar-kheshen","semaq"];
const GIFT_PRESETS=[
  {id:"breakfast",titleEn:"Lebanese Breakfast Box",titleAr:"صندوق الفطور اللبناني",copyEn:"Za’atar, honey, olive oil and a pantry touch for an easy Lebanese breakfast.",copyAr:"زعتر وعسل وزيت زيتون ولمسة من المونة لفطور لبناني جاهز.",items:["zaatar-baladi-extra","flower-honey","extra-virgin-olive-oil"]},
  {id:"mouneh",titleEn:"The Mouneh Box",titleAr:"صندوق المونة",copyEn:"Kishk, olives, bulgur and pomegranate molasses — four pantry staples with character.",copyAr:"كشك وزيتون وبرغل ودبس رمان — أربع أساسيات من المونة بطابع لبناني.",items:["kishek-zayt-w-mouneh","zaytoun-akhdar-beqaa","burglur-asmar-kheshen","debes-el-remen"]},
  {id:"taste",titleEn:"A Taste of Lebanon",titleAr:"نكهة من لبنان",copyEn:"A generous mix of olive oil, honey, za’atar and sumac for gifting or hosting.",copyAr:"تشكيلة سخية من زيت الزيتون والعسل والزعتر والسماق للهدية أو الضيافة.",items:["extra-virgin-olive-oil","wild-thistle-honey","zaatar-baladi-extra","semaq"]}
];

const CATEGORY_ORDER=[
  "Condiments","Dates","Debsy Carob","Distillates + Syrups","Dried Foods","Flour","Grains","Herbs","Honey","Molasses","Mouneh","Nuts + Seeds","Oils","Olive Oil","Olives","Pickles","Pulses","Soap","Spices","Sweets + Candy","Vinegars"
];

const CATEGORY_AR={
  "Condiments":"مستلزمات المطبخ",
  "Dates":"تمر",
  "Debsy Carob":"دبسي خروب",
  "Distillates + Syrups":"مقطرات وشرابات",
  "Dried Foods":"أطعمة مجففة",
  "Flour":"طحين",
  "Grains":"حبوب",
  "Herbs":"أعشاب",
  "Honey":"عسل",
  "Molasses":"دبس",
  "Mouneh":"مونة",
  "Nuts + Seeds":"مكسرات وبذور",
  "Oils":"زيوت",
  "Olive Oil":"زيت زيتون",
  "Olives":"زيتون",
  "Pickles":"مخللات",
  "Pulses":"بقوليات",
  "Soap":"صابون",
  "Spices":"بهارات",
  "Sweets + Candy":"حلويات وسكاكر",
  "Vinegars":"خل"
};

const CATEGORY_INFO={
  "Condiments":{
    en:["Pantry basics for seasoning, baking and everyday kitchen preparation.","Use according to the ingredient for baking, seasoning, sweetening or food preparation."],
    ar:["أساسيات للمطبخ تُستخدم في التتبيل والخبز والتحضير اليومي.","تُستخدم بحسب الصنف في الخَبز أو التتبيل أو التحلية أو التحضير."]
  },
  "Dates":{
    en:["This category generally includes date-based pantry products, which vary by format and formulation.","Common uses include fillings, desserts, snacks and recipes where date flavour is wanted."],
    ar:["تضم هذه الفئة عموماً منتجات أساسها التمر، وتختلف الصيغة والمكونات بحسب الصنف.","من الاستخدامات الشائعة الحشوات والحلويات والوجبات الخفيفة والوصفات التي يُراد فيها طعم التمر."]
  },
  "Debsy Carob":{
    en:["Carob-focused snacks, spreads and sweets from the Debsy range.","Enjoy as a snack, dessert component or sweet pantry treat."],
    ar:["وجبات خفيفة وحلويات ومنتجات أساسها الخروب من مجموعة دبسي.","تُؤكل كوجبة خفيفة أو تُستخدم في الحلويات أو كتحلية من المونة."]
  },
  "Distillates + Syrups":{
    en:["Traditional floral waters, distillates and syrups for drinks and desserts.","Use in cold drinks, desserts, sweets and traditional recipes."],
    ar:["مياه زهرية ومقطرات وشرابات تقليدية للمشروبات والحلويات.","تُستخدم في المشروبات الباردة والحلويات والوصفات التقليدية."]
  },
  "Dried Foods":{
    en:["Dried fruits and pantry ingredients are commonly used for concentrated flavour and texture.","Snack on them or add them to breakfast, baking, desserts and savoury dishes."],
    ar:["فواكه ومكونات مونة مجففة تُستخدم عادةً للنكهة المركزة والقوام.","تُؤكل كوجبة خفيفة أو تُضاف إلى الفطور والخبز والحلويات والأطباق المالحة."]
  },
  "Flour":{
    en:["Flours are milled pantry ingredients used in baking and cooking; the source ingredient varies by product.","Use for dough, bread, batters, pastries and recipes suited to each flour."],
    ar:["الطحين مكوّن مطحون للمطبخ والخَبز، ويختلف المكوّن الأساسي بحسب المنتج.","يُستخدم للعجين والخبز والمعجنات والوصفات المناسبة لكل نوع."]
  },
  "Grains":{
    en:["Rice, wheat and grain staples for filling everyday meals.","Cook as a side, pilaf, soup ingredient, salad base or family meal staple."],
    ar:["أرز وقمح وحبوب أساسية للوجبات اليومية.","تُطبخ كطبق جانبي أو مع الأرز والحساء والسلطات والوجبات العائلية."]
  },
  "Herbs":{
    en:["Dried leaves, flowers and herbal ingredients with aromatic or infusion uses.","Brew as an infusion when appropriate, or add to cooking for aroma and flavour."],
    ar:["أوراق وزهور وأعشاب مجففة تُستخدم للعطر أو للنقع.","تُنقع كمشروب عند ملاءمة الصنف أو تُضاف إلى الطبخ للنكهة والرائحة."]
  },
  "Honey":{
    en:["This category includes honey and other bee-related pantry products; floral source, blend and composition vary by item.","Common uses include breakfast, drinks, cheese pairings, desserts and dressings, depending on the product."],
    ar:["تضم هذه الفئة العسل ومنتجات أخرى مرتبطة بخلية النحل، ويختلف مصدر الرحيق والخلطة والتركيب بحسب الصنف.","من الاستخدامات الشائعة الفطور والمشروبات والجبنة والحلويات والتتبيلات بحسب المنتج."]
  },
  "Molasses":{
    en:["Concentrated fruit molasses with deep sweet-tart flavour.","Use in dressings, marinades, sauces and classic Lebanese sweet-sour pairings."],
    ar:["دبس فاكهة مركز بطعم غني يجمع الحلاوة والحموضة.","يُستخدم في التتبيلات والصلصات والماريناد والوصفات اللبنانية الحلوة الحامضة."]
  },
  "Mouneh":{
    en:["Mouneh is a broad Lebanese pantry tradition of preserved and seasonal foods; the exact preparation varies by item.","Serve at breakfast or mezze, spread, cook with or add to home-style meals depending on the item."],
    ar:["المونة تقليد لبناني واسع للأطعمة المحفوظة والموسمية، وتختلف طريقة التحضير بحسب الصنف.","تُقدّم على الفطور أو المازة أو تُستخدم في الطبخ بحسب الصنف."]
  },
  "Nuts + Seeds":{
    en:["Whole, cut or roasted nuts and seeds for snacking and pantry use.","Snack on them, bake with them, garnish salads or add to breakfast and sweets."],
    ar:["مكسرات وبذور كاملة أو مقطعة أو محمصة للتسالي والمطبخ.","تُؤكل كتسالي أو تُستخدم في الخَبز والسلطات والفطور والحلويات."]
  },
  "Oils":{
    en:["Plant, seed or botanical oils from the shop’s oil collection.","Uses vary by oil; choose the bottle size you need and ask us if you want guidance."],
    ar:["زيوت نباتية وزيوت بذور من مجموعة الزيوت في المتجر.","تختلف الاستخدامات بحسب الزيت؛ اختر الحجم المناسب واسألنا عند الحاجة."]
  },
  "Olive Oil":{
    en:["Olive oil is a central ingredient of the Lebanese pantry; grade and production details vary by product.","Drizzle, dress, dip, marinate or cook with it."],
    ar:["زيت الزيتون من أساسيات المونة اللبنانية، وتختلف الدرجة وتفاصيل الإنتاج بحسب المنتج.","يُستخدم للتغميس والتتبيل والماريناد والطبخ."]
  },
  "Olives":{
    en:["Green or black olives prepared for the table.","Serve with breakfast, mezze, cheeses, salads and shared platters."],
    ar:["زيتون أخضر أو أسود محضّر للمائدة.","يُقدّم مع الفطور والمازة والأجبان والسلطات."]
  },
  "Pickles":{
    en:["Pickles are preserved vegetables; the exact pickling method and ingredients vary by product.","Serve beside sandwiches, grilled foods, mezze and hearty meals."],
    ar:["المخللات خضار محفوظة، وتختلف طريقة التخليل والمكونات بحسب المنتج.","تُقدّم مع السندويشات والمشاوي والمازة والوجبات الدسمة."]
  },
  "Pulses":{
    en:["Dried legumes such as lentils, beans, chickpeas and lupini beans.","Cook in soups, stews, salads, dips and traditional home dishes."],
    ar:["بقوليات مجففة مثل العدس والفاصوليا والحمص والترمس.","تُطبخ في الحساء واليخنات والسلطات والغموس والأطباق البيتية."]
  },
  "Soap":{
    en:["This category includes soaps for everyday washing; ingredients and intended use vary by item.","Use according to the soap type, package directions and your preference."],
    ar:["تضم هذه الفئة صابوناً للاستخدام اليومي، وتختلف المكونات والاستعمال المقصود بحسب الصنف.","يُستخدم بحسب نوع الصابون وتعليمات العبوة وتفضيلك."]
  },
  "Spices":{
    en:["Spices may be whole, ground or blended; the exact composition is product-specific.","Season rice, meat, chicken, fish, vegetables, marinades and traditional dishes."],
    ar:["قد تكون البهارات كاملة أو مطحونة أو خلطات، وتكون التركيبة الدقيقة خاصة بكل منتج.","تُستخدم مع الأرز واللحوم والدجاج والسمك والخضار والماريناد."]
  },
  "Sweets + Candy":{
    en:["Small sweets and candy for sharing or a quick treat.","Enjoy as a snack or serve with coffee and gatherings."],
    ar:["حلويات وسكاكر صغيرة للمشاركة أو كتحلية سريعة.","تُقدّم كتسالي أو مع القهوة والضيافة."]
  },
  "Vinegars":{
    en:["Fruit vinegar or verjuice used to add acidity and brightness.","Use in salads, dressings, marinades, sauces and preserved dishes."],
    ar:["خل فواكه أو حصرم لإضافة الحموضة والانتعاش إلى الأكل.","يُستخدم في السلطات والتتبيلات والماريناد والصلصات والمخللات."]
  }
};

const UI={
  en:{
    skipLink:"Skip to catalogue",
    announcementText:"Authentic Lebanese pantry essentials · Since 2006",
    announcementOrder:"Shop online",
    brand:"Zayt w Mouneh",
    navHome:"Home",navShop:"Shop",navCategories:"Categories",navAbout:"Our Story",navContact:"Contact",
    cartLabel:"My pantry",
    heroEyebrow:"Rooted in Lebanese heritage",
    heroTitle:'A pantry of<br><em>Lebanese memory.</em>',
    heroLede:"Authentic Lebanese pantry essentials, selected with care and delivered across Lebanon.",
    heroExplore:"Shop the pantry <span>↘</span>",
    heroWhatsApp:"Send a gift",
    heroVariantLabel:"pantry products",heroCategoryLabel:"categories",heroSinceLabel:"since",
    scene1Kicker:"Pantry film · 01",scene1Title:"Honey, slow and golden.",scene1Copy:"One texture in a pantry full of grains, herbs, mouneh, oils and more.",
    scene2Kicker:"Pantry film · 02",scene2Title:"Lentils & everyday staples.",scene2Copy:"Warm, useful ingredients for real home cooking.",
    scene3Kicker:"Pantry film · 03",scene3Title:"Wheat, harvest & season.",scene3Copy:"A calm reminder of the ingredients, seasons and tables behind mouneh.",
    heroScript:"Curated with care",
    categoriesEyebrow:"Shop by category",
    categoriesTitle:"What are you looking for?",
    categoriesCopy:"Choose a pantry family below, or search the full catalogue if you already know what you need.",
    aboutEyebrow:"A pantry with roots",
    aboutTitle:'Lebanese pantry essentials.<br><em>Close to home since 2006.</em>',
    aboutLetterKicker:"The short version",
    aboutP1:"Zayt w Mouneh brings together mouneh and everyday Lebanese pantry staples, from grains and herbs to honey, olive oil, spices and more.",
    aboutP2:"The selection includes products associated with the Bekaa, Koura, Mount Lebanon and Chouf — roots we show more fully on the About page.",
    value1Title:"Origin",value1Copy:"Keep source information visible where it is known.",
    value2Title:"Everyday",value2Copy:"A useful pantry for cooking, breakfast and the table.",
    value3Title:"Care",value3Copy:"Keep browsing and ordering clear.",
    signKicker:"Our story · since 2006",signTitle:"See the roots<br>behind the pantry.",signCopy:"Read the fuller story of the selection, its provenance and what Zayt w Mouneh is today.",signCta:"Read our story <b>↘</b>",
    shopEyebrow:"Current product catalogue",shopTitle:'Names, sizes and<br><em>prices — clearly.</em>',shopNote:"Choose a category, search a product, select the exact pack size, then add it to your cart. Prices below come from the supplied retail price list.",
    searchPlaceholder:"Search zaatar, lentils, honey, grains, spices…",categorySelectLabel:"Category",resultLabel:"products",
    emptyTitle:"Nothing found.",emptyCopy:"Try a different spelling or another category.",clearFilters:"Clear filters",loadMore:"Load more products",
    orderEyebrow:"Simple ordering",orderTitle:'From shelf to<br><em>your door.</em>',orderIntroCopy:"Build your cart, review everything, then place the order directly on the website.",
    step1Title:"Choose",step1Copy:"Open a product and pick the exact size you want.",
    step2Title:"Review",step2Copy:"Check quantities, prices and your estimated total.",
    step3Title:"Checkout",step3Copy:"Enter delivery details, review the final total and place your order securely.",
    contactEyebrow:"Contact & orders",contactTitle:'Bring the pantry <em>home.</em>',contactCopy:"Questions, availability, delivery or a custom pantry list — reach us directly.",
    phone:"Phone",whatsapp:"WhatsApp",instagram:"Instagram",location:"Location",lebanon:"Lebanon",
    footerCopy:"A pantry of Lebanese memory, curated with care.",footerCatalogue:"Catalogue",footerAbout:"About",
    cartEyebrow:"Your cart",cartTitle:"Cart",cartSaved:"Saved on this device",cartEmptyTitle:"Your cart is empty.",cartEmptyCopy:"Add products from the catalogue and they’ll appear here.",browseProducts:"Browse products",
    total:"Estimated total",orderDetailsTitle:"Ready for checkout",orderDetailsNote:"Delivery, rewards and the final total are confirmed at checkout.",
    yourName:"Your name",namePlaceholder:"Name",phone:"WhatsApp number (optional)",phonePlaceholder:"e.g. 961 70 123 456",area:"Area / location",areaPlaceholder:"e.g. Baabda",notes:"Order notes",notesPlaceholder:"Delivery notes, substitutions, anything we should know…",
    sendOrder:"Checkout <span>→</span>",priceNote:"Prices and availability are rechecked before the order is created.",
    what:"About this product type",use:"Common uses",nutritionLabel:"Verified product information",nutritionBadge:"Verified product information",chooseSize:"Choose size",add:"Add to cart",update:"Update cart",view:"View",from:"From",sizeOptions:"size options",
    remove:"Remove",details:"View details",qty:"Qty",unitPrice:"Unit",subtotal:"Subtotal",
    standard:"Standard",added:"Added to cart",updated:"Cart updated",removed:"Removed",
    categoryAll:"All categories",
    cartProducts:(n)=>`${n} ${n===1?"product":"products"}`,
    cartItems:(n)=>`${n} ${n===1?"item":"items"}`,
    orderHello:"Hello Zayt w Mouneh 👋",
    orderIntro:"I would like to place an order:",
    customer:"Name",orderPhone:"WhatsApp",orderArea:"Area / location",orderNotes:"Notes",orderTotal:"Estimated total",
    orderConfirm:"Please confirm availability and the final order total. Thank you!"
  },
  ar:{
    skipLink:"الانتقال إلى المنتجات",
    announcementText:"مونة لبنانية أصيلة · منذ 2006",
    announcementOrder:"تسوّق عبر الموقع",
    brand:"زيت ومونة",
    navHome:"الرئيسية",navShop:"المتجر",navCategories:"الأقسام",navAbout:"قصتنا",navContact:"تواصل",
    cartLabel:"السلة",
    heroEyebrow:"متجذّرون في التراث اللبناني",
    heroTitle:'مونة تحفظ<br><em>ذاكرة لبنان.</em>',
    heroLede:"أساسيات مونة لبنانية أصيلة مختارة بعناية، مع توصيل إلى مختلف المناطق في لبنان.",
    heroExplore:"تسوّق المونة <span>↙</span>",
    heroWhatsApp:"أرسل هدية",
    heroVariantLabel:"منتجاً من المونة",heroCategoryLabel:"قسماً",heroSinceLabel:"منذ",
    scene1Kicker:"من المونة · 01",scene1Title:"عسل ينساب ببطء.",scene1Copy:"تفصيل واحد من مونة أوسع تضم الحبوب والأعشاب والزيوت والمخللات والمزيد.",
    scene2Kicker:"من المونة · 02",scene2Title:"عدس وحبوب للبيت.",scene2Copy:"مكونات يومية بسيطة ومفيدة للطبخ البيتي الأصيل.",
    scene3Kicker:"من المونة · 03",scene3Title:"قمح وموسم وحصاد.",scene3Copy:"صورة هادئة عن الأرض والمواسم والموائد التي تعيش فيها المونة.",
    heroScript:"مختارة بعناية",
    categoriesEyebrow:"تسوّق حسب القسم",
    categoriesTitle:"ماذا تبحث عنه؟",
    categoriesCopy:"اختر قسماً من المونة أدناه، أو ابحث في كامل المنتجات إذا كنت تعرف ما تحتاجه.",
    aboutEyebrow:"مونة لها جذور",
    aboutTitle:'أساسيات المونة اللبنانية.<br><em>قريبة من البيت منذ 2006.</em>',
    aboutLetterKicker:"باختصار",
    aboutP1:"تجمع زيت ومونة بين المونة وأساسيات المطبخ اللبناني اليومية، من الحبوب والأعشاب إلى العسل وزيت الزيتون والبهارات وغيرها.",
    aboutP2:"تضم التشكيلة منتجات مرتبطة بالبقاع والكورة وجبل لبنان والشوف — جذور نعرضها بشكل أوسع في صفحة قصتنا.",
    value1Title:"المصدر",value1Copy:"نُبقي معلومات المصدر ظاهرة عندما تكون معروفة.",
    value2Title:"للحياة اليومية",value2Copy:"مونة مفيدة للطبخ والفطور والمائدة.",
    value3Title:"العناية",value3Copy:"نُبقي التصفّح والطلب واضحين.",
    signKicker:"قصتنا · منذ 2006",signTitle:"اكتشف جذور<br>المونة.",signCopy:"اقرأ القصة الأوسع للتشكيلة ومصادرها وما تمثّله زيت ومونة اليوم.",signCta:"اقرأ قصتنا <b>↙</b>",
    shopEyebrow:"لائحة المنتجات الحالية",shopTitle:'الأسماء والأحجام<br><em>والأسعار بوضوح.</em>',shopNote:"اختر القسم وابحث عن المنتج وحدّد الحجم المطلوب ثم أضفه إلى السلة. الأسعار أدناه مأخوذة من لائحة أسعار البيع المرفقة.",
    searchPlaceholder:"ابحث عن زعتر، عدس، عسل، حبوب، بهارات…",categorySelectLabel:"القسم",resultLabel:"منتج",
    emptyTitle:"لا توجد نتائج.",emptyCopy:"جرّب اسماً آخر أو قسماً مختلفاً.",clearFilters:"مسح عوامل التصفية",loadMore:"عرض المزيد",
    orderEyebrow:"طلب بسيط",orderTitle:'من الرفّ إلى<br><em>باب بيتك.</em>',orderIntroCopy:"جهّز سلتك وراجعها ثم أرسل الطلب مباشرة عبر الموقع.",
    step1Title:"اختر",step1Copy:"افتح المنتج وحدّد الحجم الذي تريده.",
    step2Title:"راجع",step2Copy:"تأكد من الكميات والأسعار والمجموع التقديري.",
    step3Title:"إتمام الطلب",step3Copy:"أدخل تفاصيل التوصيل وراجع المجموع النهائي ثم أرسل طلبك بأمان.",
    contactEyebrow:"التواصل والطلبات",contactTitle:'خذ المونة <em>إلى البيت.</em>',contactCopy:"للاستفسار عن التوفر أو التوصيل أو تجهيز لائحة خاصة، تواصل معنا مباشرة.",
    phone:"الهاتف",whatsapp:"واتساب",instagram:"إنستغرام",location:"الموقع",lebanon:"لبنان",
    footerCopy:"مونة من ذاكرة لبنان، مختارة بعناية.",footerCatalogue:"المنتجات",footerAbout:"من نحن",
    cartEyebrow:"سلة التسوق",cartTitle:"السلة",cartSaved:"محفوظة على هذا الجهاز",cartEmptyTitle:"السلة فارغة.",cartEmptyCopy:"أضف منتجات من المتجر وستظهر هنا.",browseProducts:"تصفّح المنتجات",
    total:"المجموع التقديري",orderDetailsTitle:"جاهز لإتمام الطلب",orderDetailsNote:"يتم تأكيد التوصيل والمكافآت والمجموع النهائي عند إتمام الطلب.",
    yourName:"الاسم",namePlaceholder:"اسمك",phone:"رقم واتساب (اختياري)",phonePlaceholder:"مثلاً 961 70 123 456",area:"المنطقة / الموقع",areaPlaceholder:"مثلاً بعبدا",notes:"ملاحظات الطلب",notesPlaceholder:"ملاحظات التوصيل أو الاستبدال أو أي تفاصيل إضافية…",
    sendOrder:"إتمام الطلب <span>←</span>",priceNote:"يتم التحقق من الأسعار والتوفر قبل إنشاء الطلب.",
    what:"عن هذا النوع من المنتجات",use:"استخدامات شائعة",nutritionLabel:"معلومات المنتج الموثّقة",nutritionBadge:"معلومات موثّقة",chooseSize:"اختر الحجم",add:"أضف إلى السلة",update:"حدّث السلة",view:"عرض",from:"ابتداءً من",sizeOptions:"خيارات الحجم",
    remove:"حذف",details:"عرض التفاصيل",qty:"الكمية",unitPrice:"السعر",subtotal:"المجموع",
    standard:"حجم واحد",added:"تمت الإضافة إلى السلة",updated:"تم تحديث السلة",removed:"تم الحذف",
    categoryAll:"كل الأقسام",
    cartProducts:(n)=>`${n} ${n===1?"منتج":"منتجات"}`,
    cartItems:(n)=>`${n} ${n===1?"قطعة":"قطع"}`,
    orderHello:"مرحباً زيت ومونة 👋",
    orderIntro:"أرغب في طلب:",
    customer:"الاسم",orderPhone:"واتساب",orderArea:"المنطقة / الموقع",orderNotes:"الملاحظات",orderTotal:"المجموع التقديري",
    orderConfirm:"يرجى تأكيد التوفر والمجموع النهائي للطلب. شكراً!"
  }
};

const EXTRA_UI={
  en:{
    navGift:"Make a gift",menuLabel:"Menu",menuHeading:"Explore Zayt w Mouneh",menuSubheading:"Everything has its own place.",menuLocation:"Sebline · Directions",
    trustEyebrow:"Why shop with us",trustTitle:"Old pantry values. Clear modern service.",
    trustSinceTitle:"Since 2006",trustSinceCopy:"A long-running Lebanese pantry built around mouneh, everyday staples and careful selection.",
    trustDeliveryTitle:"Delivery across Lebanon",trustDeliveryCopy:"We deliver across Lebanon. Delivery details and the final fee are confirmed at checkout.",
    trustPriceTitle:"Clear sizes & prices",trustPriceCopy:"Choose the exact listed pack size and see the retail price before checkout.",
    trustWhatsAppTitle:"Secure website checkout",trustWhatsAppCopy:"Review items, delivery, rewards and the final total, then place the order directly on the website.",
    favorites:"Saved",favorite:"Save",favorited:"Saved",favoritesEmpty:"You have no saved products yet.",
    recentEyebrow:"Recently viewed",recentTitle:"Pick up where you left off.",clearRecent:"Clear",
    giftEyebrow:"Make a gift",giftTitle:"Build a pantry gift, your way.",
    giftCopy:"Choose anything from the shop, build your gift, add the recipient, occasion, message and presentation preferences, then finish delivery and payment details in secure website checkout.",
    giftPerk1:"Choose any products",giftPerk2:"Presentation preferences",giftPerk3:"Delivery across Lebanon",
    giftBrowse:"Browse the shop ↗",giftBuilderLabel:"Your gift",giftEmpty:"Choose products above and they’ll appear here.",giftProductsLabel:"Choose what goes inside",giftProductsHint:"Search or browse the full catalogue and add any product directly to this gift.",giftProductPlaceholder:"Search any product for the gift…",giftUseCart:"Add my cart items",giftSelectedTitle:"Inside the gift",giftClear:"Clear",giftAdd:"Add",giftRemove:"Remove",giftAllCategories:"All categories",giftMore:"Show more products",
    giftRecipient:"Recipient name",giftRecipientPlaceholder:"Who is the gift for?",giftOccasion:"Occasion",giftPackaging:"Packing preference",giftArea:"Delivery area",giftAreaPlaceholder:"Area in Lebanon",
    giftMessage:"Gift message",giftMessagePlaceholder:"Write a short note for the recipient…",giftSender:"Your name",giftSenderPlaceholder:"Your name",
    giftSend:"Continue to secure checkout →",giftNote:"Gift preferences are carried into checkout. Delivery and the final total are confirmed there; WhatsApp is only for help.",
    giftOccasions:["Birthday","Thank you","Visit / hosting","Holiday","Just because","Other"],
    giftPackings:["Classic pantry gift","Celebration gift","Custom arrangement"],
    giftNeedItems:"Choose at least one product for the gift first.",
    socialEyebrow:"From our pantry",socialTitle:"See what’s happening at the shop.",socialCopy:"Follow Zayt w Mouneh for pantry ideas, shop updates and everyday mouneh inspiration.",
    footerDelivery:"Delivery across Lebanon · Secure website checkout",footerExploreTitle:"Explore",footerGift:"Make a gift",footerContactTitle:"Contact",
    mobileReview:"Review & checkout",
    related:"You may also like",
    badgeMulti:"Multiple sizes",badgeTraditional:"Traditional mouneh",badgeClassic:"Lebanese classic",badgeBaking:"Baking staple",badgeBreakfast:"Breakfast pantry",
    contactCopy:"Questions, availability, gift orders or delivery across Lebanon — reach us directly.",locationValue:"JC9Q+Q7X · Sebline, Lebanon",contactHoursLabel:"Opening hours",contactHoursValue:"Mon–Sat 9:00–20:00 · Sun 12:00–20:00",footerLocation:"Sebline · Get directions",
    searchNoSuggestions:"No close matches yet"
  },
  ar:{
    navGift:"حضّر هدية",menuLabel:"القائمة",menuHeading:"استكشف زيت ومونة",menuSubheading:"كل شيء في مكانه.",menuLocation:"سبلين · الاتجاهات",
    trustEyebrow:"لماذا زيت ومونة",trustTitle:"قيم المونة الأصيلة. خدمة واضحة وعصرية.",
    trustSinceTitle:"منذ 2006",trustSinceCopy:"مونة لبنانية عريقة تجمع أساسيات البيت والأصناف التقليدية، مختارة بعناية.",
    trustDeliveryTitle:"توصيل إلى مختلف المناطق في لبنان",trustDeliveryCopy:"نوصّل إلى مختلف المناطق في لبنان. يتم تأكيد تفاصيل التوصيل والرسوم النهائية عند إتمام الطلب.",
    trustPriceTitle:"أحجام وأسعار واضحة",trustPriceCopy:"اختر الحجم المدرج وشاهد سعر البيع قبل إتمام الطلب.",
    trustWhatsAppTitle:"إتمام طلب آمن عبر الموقع",trustWhatsAppCopy:"راجع المنتجات والتوصيل والمكافآت والمجموع النهائي ثم أرسل الطلب مباشرة عبر الموقع.",
    favorites:"المحفوظات",favorite:"حفظ",favorited:"محفوظ",favoritesEmpty:"لا توجد منتجات محفوظة بعد.",
    recentEyebrow:"المنتجات التي شاهدتها مؤخراً",recentTitle:"تابع من حيث توقفت.",clearRecent:"مسح",
    giftEyebrow:"حضّر هدية",giftTitle:"حضّر هدية مونة على ذوقك.",
    giftCopy:"اختر أي منتجات من المتجر وحضّر هديتك، ثم أضف المستلم والمناسبة والرسالة وتفضيلات التقديم، وأكمل تفاصيل التوصيل والدفع بأمان عبر الموقع.",
    giftPerk1:"اختر أي منتجات",giftPerk2:"تفضيلات تقديم الهدية",giftPerk3:"توصيل إلى جميع أنحاء لبنان",
    giftBrowse:"تصفّح المتجر ↗",giftBuilderLabel:"هديتك",giftEmpty:"اختر المنتجات أعلاه وستظهر هنا.",giftProductsLabel:"اختر ما تريد داخل الهدية",giftProductsHint:"ابحث أو تصفّح كامل المنتجات وأضف أي صنف مباشرة إلى الهدية.",giftProductPlaceholder:"ابحث عن أي منتج للهدية…",giftUseCart:"أضف منتجات سلتي",giftSelectedTitle:"داخل الهدية",giftClear:"مسح",giftAdd:"أضف",giftRemove:"حذف",giftAllCategories:"كل الأقسام",giftMore:"عرض المزيد",
    giftRecipient:"اسم المستلم",giftRecipientPlaceholder:"لمن الهدية؟",giftOccasion:"المناسبة",giftPackaging:"تفضيل التغليف",giftArea:"منطقة التوصيل",giftAreaPlaceholder:"أي منطقة في لبنان",
    giftMessage:"رسالة الهدية",giftMessagePlaceholder:"اكتب رسالة قصيرة للمستلم…",giftSender:"اسمك",giftSenderPlaceholder:"اسمك",
    giftSend:"المتابعة لإتمام الطلب بأمان ←",giftNote:"تنتقل تفضيلات الهدية إلى إتمام الطلب. يتم تأكيد التوصيل والمجموع النهائي هناك، وواتساب للمساعدة فقط.",
    giftOccasions:["عيد ميلاد","شكر","زيارة / ضيافة","مناسبة أو عيد","من دون مناسبة","أخرى"],
    giftPackings:["هدية مونة كلاسيكية","تغليف احتفالي","تنسيق مخصص"],
    giftNeedItems:"اختر منتجاً واحداً على الأقل للهدية أولاً.",
    socialEyebrow:"من مونة المحل",socialTitle:"تابع أخبار المونة والمتجر.",socialCopy:"تابع زيت ومونة على إنستغرام لأفكار المونة وتحديثات المحل وإلهام يومي.",
    footerDelivery:"توصيل إلى مختلف المناطق في لبنان · إتمام الطلب بأمان عبر الموقع",footerExploreTitle:"استكشف",footerGift:"حضّر هدية",footerContactTitle:"تواصل",
    mobileReview:"راجع وأكمل الطلب",
    related:"قد يعجبك أيضاً",
    badgeMulti:"عدة أحجام",badgeTraditional:"مونة تقليدية",badgeClassic:"كلاسيكي لبناني",badgeBaking:"أساسي للخَبز",badgeBreakfast:"من مونة الفطور",
    contactCopy:"للاستفسار عن التوفر أو الهدايا أو التوصيل إلى أي منطقة في لبنان، تواصل معنا مباشرة.",locationValue:"JC9Q+Q7X · سبلين، لبنان",contactHoursLabel:"ساعات العمل",contactHoursValue:"الاثنين–السبت 9:00–20:00 · الأحد 12:00–20:00",footerLocation:"سبلين · الاتجاهات",
    searchNoSuggestions:"لا توجد نتائج قريبة بعد"
  }
};

/* French cart, navigation and gift labels must be available to all storefront actions. */
const UI_FR_OVERRIDES={
  "skipLink": "Aller au catalogue",
  "announcementText": "Épicerie libanaise authentique · Depuis 2006",
  "announcementOrder": "Acheter en ligne",
  "navHome": "Accueil",
  "navShop": "Boutique",
  "navCategories": "Catégories",
  "navAbout": "Notre histoire",
  "navContact": "Contact",
  "cartLabel": "Mon panier",
  "searchPlaceholder": "Rechercher zaatar, lentilles, miel, céréales, épices…",
  "categorySelectLabel": "Catégorie",
  "resultLabel": "produits",
  "categoryAll": "Toutes les catégories",
  "emptyTitle": "Aucun résultat.",
  "emptyCopy": "Essayez un autre nom ou une autre catégorie.",
  "clearFilters": "Effacer les filtres",
  "loadMore": "Voir plus de produits",
  "shopEyebrow": "Catalogue actuel",
  "shopNote": "Choisissez une catégorie, cherchez un produit et sélectionnez le format souhaité avant de l’ajouter au panier.",
  "cartEyebrow": "Votre panier",
  "cartTitle": "Panier",
  "cartSaved": "Enregistré sur cet appareil",
  "cartEmptyTitle": "Votre panier est vide.",
  "cartEmptyCopy": "Ajoutez des produits depuis la boutique : ils apparaîtront ici.",
  "browseProducts": "Voir les produits",
  "total": "Total estimé",
  "orderDetailsTitle": "Prêt à commander",
  "orderDetailsNote": "Les frais de livraison, les récompenses et le total définitif seront confirmés à la commande.",
  "yourName": "Votre nom",
  "namePlaceholder": "Nom",
  "phone": "Numéro WhatsApp (facultatif)",
  "phonePlaceholder": "ex. 961 70 123 456",
  "area": "Région / localisation",
  "areaPlaceholder": "ex. Baabda",
  "notes": "Notes de commande",
  "notesPlaceholder": "Livraison, remplacement de produits, précisions…",
  "sendOrder": "Passer commande <span>→</span>",
  "priceNote": "Les prix et la disponibilité sont vérifiés avant la création de la commande.",
  "what": "À propos de cette catégorie de produits",
  "use": "Utilisations courantes",
  "nutritionLabel": "Informations vérifiées sur le produit",
  "nutritionBadge": "Informations vérifiées",
  "chooseSize": "Choisir le format",
  "add": "Ajouter au panier",
  "update": "Actualiser le panier",
  "view": "Voir",
  "from": "À partir de",
  "sizeOptions": "formats disponibles",
  "remove": "Retirer",
  "details": "Voir les détails",
  "qty": "Qté",
  "unitPrice": "Prix unitaire",
  "subtotal": "Sous-total",
  "standard": "Format standard",
  "added": "Ajouté au panier",
  "updated": "Panier actualisé",
  "removed": "Retiré",
  "orderHello": "Bonjour Zayt w Mouneh 👋",
  "orderIntro": "Je souhaite passer commande :",
  "customer": "Nom",
  "orderPhone": "WhatsApp",
  "orderArea": "Région / localisation",
  "orderNotes": "Notes",
  "orderTotal": "Total estimé",
  "orderConfirm": "Merci de confirmer la disponibilité et le montant final de la commande."
};
UI_FR_OVERRIDES.cartProducts=n=>n+" "+(n===1?"produit":"produits");
UI_FR_OVERRIDES.cartItems=n=>n+" "+(n===1?"article":"articles");
const EXTRA_FR_OVERRIDES={
  "navGift": "Offrir un cadeau",
  "menuLabel": "Menu",
  "menuHeading": "Découvrez Zayt w Mouneh",
  "menuSubheading": "Chaque chose à sa place.",
  "menuLocation": "Sebline · Itinéraire",
  "favorites": "Favoris",
  "favorite": "Ajouter aux favoris",
  "favorited": "Enregistré",
  "favoritesEmpty": "Aucun produit favori pour le moment.",
  "recentEyebrow": "Consultés récemment",
  "recentTitle": "Reprenez votre découverte.",
  "clearRecent": "Effacer",
  "giftEyebrow": "Créer un cadeau",
  "giftTitle": "Composez votre coffret gourmand libanais.",
  "giftCopy": "Choisissez des produits, préparez votre cadeau et indiquez destinataire, occasion et message avant de valider la livraison et le paiement.",
  "giftPerk1": "Tous les produits au choix",
  "giftPerk2": "Présentation personnalisée",
  "giftPerk3": "Livraison dans tout le Liban",
  "giftBrowse": "Parcourir la boutique ↗",
  "giftBuilderLabel": "Votre cadeau",
  "giftEmpty": "Sélectionnez des produits ci-dessus pour les ajouter ici.",
  "giftProductsLabel": "Choisissez les produits",
  "giftProductsHint": "Recherchez dans tout le catalogue et ajoutez les produits de votre choix au cadeau.",
  "giftProductPlaceholder": "Rechercher un produit pour le cadeau…",
  "giftUseCart": "Ajouter les articles du panier",
  "giftSelectedTitle": "Contenu du cadeau",
  "giftClear": "Effacer",
  "giftAdd": "Ajouter",
  "giftRemove": "Retirer",
  "giftAllCategories": "Toutes les catégories",
  "giftMore": "Voir plus de produits",
  "giftRecipient": "Nom du destinataire",
  "giftRecipientPlaceholder": "À qui est destiné le cadeau ?",
  "giftOccasion": "Occasion",
  "giftPackaging": "Présentation souhaitée",
  "giftArea": "Zone de livraison",
  "giftAreaPlaceholder": "Région au Liban",
  "giftMessage": "Message cadeau",
  "giftMessagePlaceholder": "Écrivez un petit mot…",
  "giftSender": "Votre nom",
  "giftSenderPlaceholder": "Votre nom",
  "giftSend": "Continuer vers le paiement sécurisé →",
  "giftNote": "Les préférences du cadeau sont transmises à la commande. Le montant final et la livraison seront confirmés au paiement.",
  "giftOccasions": [
    "Anniversaire",
    "Remerciement",
    "Visite / invitation",
    "Fête",
    "Juste pour le plaisir",
    "Autre"
  ],
  "giftPackings": [
    "Coffret mouneh classique",
    "Emballage festif",
    "Présentation personnalisée"
  ],
  "giftNeedItems": "Choisissez au moins un produit pour votre cadeau.",
  "footerDelivery": "Livraison dans tout le Liban · Paiement sécurisé sur le site",
  "footerExploreTitle": "Découvrir",
  "footerGift": "Offrir un cadeau",
  "footerContactTitle": "Contact",
  "mobileReview": "Vérifier et commander",
  "related": "Vous aimerez aussi",
  "badgeMulti": "Plusieurs formats",
  "badgeTraditional": "Mouneh traditionnelle",
  "badgeClassic": "Classique libanais",
  "badgeBaking": "Pour la pâtisserie",
  "badgeBreakfast": "Petit-déjeuner",
  "searchNoSuggestions": "Aucune suggestion proche"
};
function frenchStorefrontLabels(base,overrides){
  return new Proxy(base,{get:function(target,key){
    if(Object.prototype.hasOwnProperty.call(overrides,key))return overrides[key];
    var value=target[key];
    if(typeof value==="string"&&typeof window.ZWM_FR_TRANSLATE==="function")return window.ZWM_FR_TRANSLATE(value);
    if(Array.isArray(value)&&typeof window.ZWM_FR_TRANSLATE==="function")return value.map(function(v){return typeof v==="string"?window.ZWM_FR_TRANSLATE(v):v});
    return value;
  }});
}
UI.fr=frenchStorefrontLabels(UI.en,UI_FR_OVERRIDES);
EXTRA_UI.fr=frenchStorefrontLabels(EXTRA_UI.en,EXTRA_FR_OVERRIDES);

const PAGE_I18N={
  home:{
    en:{title:"Zayt w Mouneh | Lebanese Pantry & Mouneh",description:"Authentic Lebanese pantry essentials, mouneh and gifts since 2006, with clear prices and delivery across Lebanon.",skip:"Skip to catalogue"},
    ar:{title:"زيت ومونة | مونة لبنانية أصيلة",description:"مونة لبنانية أصيلة وهدايا منذ 2006، مع أسعار واضحة وتوصيل إلى مختلف المناطق في لبنان.",skip:"الانتقال إلى المنتجات"}
  },
  shop:{
    en:{title:"Shop Lebanese Pantry Essentials | Zayt w Mouneh",description:"Browse 300+ Lebanese pantry products with clear sizes, prices, favourites and secure website checkout.",skip:"Skip to catalogue"},
    ar:{title:"تسوّق المونة اللبنانية | زيت ومونة",description:"تصفّح أكثر من 300 منتج من المونة اللبنانية مع أحجام وأسعار واضحة ومفضّلات وإتمام طلب آمن عبر الموقع.",skip:"الانتقال إلى المنتجات"}
  },
  about:{
    en:{title:"Our Story & Provenance | Zayt w Mouneh",description:"Learn about Zayt w Mouneh since 2006 and the origins behind the pantry: Bekaa, Koura, Mount Lebanon and Chouf.",skip:"Skip to our story"},
    ar:{title:"قصتنا ومصادر المونة | زيت ومونة",description:"تعرّف إلى قصة زيت ومونة منذ 2006 وإلى مصادر المونة من البقاع والكورة وجبل لبنان والشوف.",skip:"الانتقال إلى قصتنا"}
  },
  contact:{
    en:{title:"Contact, Delivery & Visit | Zayt w Mouneh",description:"Contact Zayt w Mouneh in Sebline and learn about secure website ordering and delivery across Lebanon.",skip:"Skip to contact"},
    ar:{title:"التواصل والتوصيل والزيارة | زيت ومونة",description:"تواصل مع زيت ومونة في سبلين وتعرّف إلى الطلب الآمن عبر الموقع وتفاصيل التوصيل في لبنان.",skip:"الانتقال إلى التواصل"}
  },
  gift:{
    en:{title:"Lebanese Pantry Gifts | Zayt w Mouneh",description:"Choose a ready-made Lebanese pantry gift or build your own from the catalogue, with delivery across Lebanon.",skip:"Skip to gift builder"},
    ar:{title:"هدايا من المونة اللبنانية | زيت ومونة",description:"اختر هدية جاهزة من المونة اللبنانية أو حضّر هديتك من كامل المنتجات مع توصيل إلى مختلف المناطق في لبنان.",skip:"الانتقال إلى تجهيز الهدية"}
  },
  recipes:{
    en:{title:"Lebanese Pantry Recipes | Zayt w Mouneh",description:"Lebanese pantry recipe ideas from Zayt w Mouneh — build mujadara, manoushe, fattoush and other pantry bundles from the current catalogue.",skip:"Skip to recipes"},
    ar:{title:"وصفات من المونة اللبنانية | زيت ومونة",description:"أفكار وصفات لبنانية من زيت ومونة، مع مكونات المونة للمجدّرة والمنقوشة والفتوش وغيرها من كامل المنتجات الحالية.",skip:"الانتقال إلى الوصفات"}
  },
  terms:{
    en:{title:"Terms of Service | Zayt w Mouneh",description:"Terms governing Zayt w Mouneh website use, orders, delivery, accounts, gifts and Mouneh Points.",skip:"Skip to terms"},
    ar:{title:"شروط الخدمة | زيت ومونة",description:"شروط استخدام موقع زيت ومونة والطلبات والتوصيل والحسابات والهدايا وبرنامج نقاط المونة.",skip:"الانتقال إلى شروط الخدمة"}
  },
  privacy:{
    en:{title:"Privacy Policy | Zayt w Mouneh",description:"How Zayt w Mouneh collects, uses, protects and shares customer, account, order and Mouneh Points information.",skip:"Skip to privacy policy"},
    ar:{title:"سياسة الخصوصية | زيت ومونة",description:"كيفية جمع زيت ومونة لبيانات العملاء والحسابات والطلبات ونقاط المونة واستخدامها وحمايتها ومشاركتها.",skip:"الانتقال إلى سياسة الخصوصية"}
  }
};

/* Complete French SEO, accessibility and catalogue category copy. */
const PAGE_FR_COPY={
  "home": {
    "title": "Zayt w Mouneh | Épicerie libanaise et mouneh",
    "description": "Épicerie libanaise authentique, mouneh et cadeaux depuis 2006, avec des prix transparents et une livraison dans tout le Liban.",
    "skip": "Aller au catalogue"
  },
  "shop": {
    "title": "Acheter des produits d’épicerie libanaise | Zayt w Mouneh",
    "description": "Découvrez plus de 300 produits d’épicerie libanaise avec formats et prix clairement indiqués, favoris et commande sécurisée.",
    "skip": "Aller au catalogue"
  },
  "about": {
    "title": "Notre histoire et nos origines | Zayt w Mouneh",
    "description": "Découvrez l’histoire de Zayt w Mouneh depuis 2006 et les origines de nos produits : Bekaa, Koura, Mont-Liban et Chouf.",
    "skip": "Aller à notre histoire"
  },
  "contact": {
    "title": "Contact, livraison et visite | Zayt w Mouneh",
    "description": "Contactez Zayt w Mouneh à Sebline et découvrez la commande sécurisée et la livraison dans tout le Liban.",
    "skip": "Aller à la page contact"
  },
  "gift": {
    "title": "Cadeaux d’épicerie libanaise | Zayt w Mouneh",
    "description": "Choisissez un cadeau de mouneh libanaise prêt à offrir ou composez le vôtre avec nos produits, livrés partout au Liban.",
    "skip": "Aller au configurateur de cadeaux"
  },
  "recipes": {
    "title": "30 recettes libanaises | Zayt w Mouneh",
    "description": "Découvrez 30 recettes libanaises détaillées en français, arabe et anglais et ajoutez les ingrédients de notre épicerie directement à votre panier.",
    "skip": "Aller aux recettes"
  },
  "terms": {
    "title": "Conditions d’utilisation | Zayt w Mouneh",
    "description": "Les conditions d’utilisation du site Zayt w Mouneh, des commandes, livraisons, comptes, cadeaux et points de fidélité.",
    "skip": "Aller aux conditions d’utilisation"
  },
  "privacy": {
    "title": "Politique de confidentialité | Zayt w Mouneh",
    "description": "Comment Zayt w Mouneh collecte, utilise, protège et partage les informations relatives aux clients, comptes, commandes et points de fidélité.",
    "skip": "Aller à la politique de confidentialité"
  }
};
Object.keys(PAGE_FR_COPY).forEach(function(page){if(PAGE_I18N[page])PAGE_I18N[page].fr=PAGE_FR_COPY[page]});
const CATEGORY_FR={
  "Condiments": "Condiments et aides culinaires",
  "Dates": "Dattes",
  "Debsy Carob": "Produits à la caroube",
  "Distillates + Syrups": "Eaux florales et sirops",
  "Dried Foods": "Aliments séchés",
  "Flour": "Farines",
  "Grains": "Céréales",
  "Herbs": "Herbes",
  "Honey": "Miels",
  "Molasses": "Mélasses",
  "Mouneh": "Mouneh et conserves",
  "Nuts + Seeds": "Fruits secs et graines",
  "Oils": "Huiles",
  "Olive Oil": "Huiles d’olive",
  "Olives": "Olives",
  "Pickles": "Légumes marinés",
  "Pulses": "Légumineuses",
  "Soap": "Savons",
  "Spices": "Épices",
  "Sweets + Candy": "Confiseries",
  "Vinegars": "Vinaigres"
};

let lang=window.ZWM_LOCALE?.get?.()||(safeStorageGet(LANG_KEY)==="ar"?"ar":"en");
let activeCategory="All";
let query="";
let visibleLimit=catalogPageSize();
let cart=loadCart();
let draftQty={};
let cardVariant={};
let currentModalProduct=null;
let currentModalVariant=null;
let currentModalTrigger=null;
let quickViewOpening=false;
let sceneIndex=0;
let sceneTimer=null;
let toastTimer=null;
let languageFrame=null;
let favorites=loadFavorites();
let recentViews=loadRecent();
let giftItems=loadGiftItems();
let giftVisibleLimit=Number.POSITIVE_INFINITY;
let giftCategory="All";
let favoritesOnly=false;
const CURRENT_PAGE=document.body?.dataset.page||"home";
let heroVisible=true;

/* Owner dashboard product overrides: keep an immutable canonical baseline so live CMS
   refreshes can be applied repeatedly without accumulating stale mutations. */
const BASE_PRODUCTS=JSON.parse(JSON.stringify(PRODUCTS_DATA));
function applyCachedOwnerCatalog(){
  try{
    PRODUCTS_DATA.splice(0,PRODUCTS_DATA.length,...JSON.parse(JSON.stringify(BASE_PRODUCTS)));
    const rows=JSON.parse(localStorage.getItem("zwm:cms:product-overrides:v1")||"[]");
    if(!Array.isArray(rows)||!rows.length)return;
    const index=new Map(PRODUCTS_DATA.map((p,i)=>[p.id,i]));
    const hidden=new Set();
    rows.forEach(row=>{
      const id=String(row?.product_id||"");
      if(!id)return;
      const payload=row?.payload&&typeof row.payload==="object"?row.payload:{};
      const status=payload.status||(row.action==="hide"?"hidden":"live");
      if(status==="hidden"||status==="draft"){hidden.add(id);return;}
      const at=index.get(id);
      const merged={...(Number.isInteger(at)?PRODUCTS_DATA[at]:{}),...payload,id};
      if(Array.isArray(payload.variants))merged.variants=payload.variants;
      if(Number.isInteger(at))PRODUCTS_DATA[at]=merged;
      else{index.set(id,PRODUCTS_DATA.length);PRODUCTS_DATA.push(merged);}
      if(window.ZWM_PRODUCT_PHOTOS?.map){
        if(payload.photoRemoved){
          delete window.ZWM_PRODUCT_PHOTOS.map[id];
        }else if(payload.image?.url){
          window.ZWM_PRODUCT_PHOTOS.map[id]={
            url:payload.image.url,
            width:Number(payload.image.width)||1200,
            height:Number(payload.image.height)||1200,
            positionX:Math.max(0,Math.min(100,Number(payload.image.positionX??50))),
            positionY:Math.max(0,Math.min(100,Number(payload.image.positionY??50))),
            zoom:Math.max(100,Math.min(180,Number(payload.image.zoom??100))),
            rotation:Number(payload.image.rotation)||0,
            fit:payload.image.fit==="contain"?"contain":"cover",
            quality:"owner-dashboard"
          };
        }
      }
    });
    for(let i=PRODUCTS_DATA.length-1;i>=0;i--)if(hidden.has(PRODUCTS_DATA[i]?.id))PRODUCTS_DATA.splice(i,1);
  }catch(error){console.warn("Owner catalogue cache ignored:",error);}
}
applyCachedOwnerCatalog();

/* Include owner-created categories in the storefront once they contain products.
   Arabic labels are read from the public settings cache when available. */
try{
  const cachedSettings=JSON.parse(localStorage.getItem("zwm:cms:settings:v1")||"{}");
  const customCategories=Array.isArray(cachedSettings?.product_categories?.items)?cachedSettings.product_categories.items:[];
  for(const item of customCategories){
    const en=String(item?.en||"").trim();
    const ar=String(item?.ar||"").trim();
    if(en&&!CATEGORY_ORDER.includes(en))CATEGORY_ORDER.push(en);
    if(en&&ar&&!CATEGORY_AR[en])CATEGORY_AR[en]=ar;
  }
}catch{}
for(const product of PRODUCTS_DATA){
  const category=String(product?.category||"").trim();
  if(category&&!CATEGORY_ORDER.includes(category))CATEGORY_ORDER.push(category);
}

let CATEGORY_COUNTS={};
let DISPLAY_NAME_COUNTS={};
let TOTAL_VARIANTS=0;
function refreshCatalogDerivedData(){
  for(const product of PRODUCTS_DATA){
    const category=String(product?.category||"").trim();
    if(category&&!CATEGORY_ORDER.includes(category))CATEGORY_ORDER.push(category);
  }
  CATEGORY_COUNTS=Object.fromEntries(CATEGORY_ORDER.map(cat=>[cat,PRODUCTS_DATA.filter(p=>p.category===cat).length]));
  DISPLAY_NAME_COUNTS=PRODUCTS_DATA.reduce((acc,p)=>{
    const key=String(p.nameEn||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
    acc[key]=(acc[key]||0)+1;
    return acc;
  },{});
  TOTAL_VARIANTS=PRODUCTS_DATA.reduce((sum,p)=>sum+(Array.isArray(p.variants)?p.variants.length:0),0);
}
refreshCatalogDerivedData();
function repeatedListingNote(p){
  const key=String(p.nameEn||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  return DISPLAY_NAME_COUNTS[key]>1?(p.original||""):"";
}

function money(n){const value=`$${Number(n).toFixed(2)}`;return lang==="ar"?`\u2066${value}\u2069`:value}
function currentName(p){
  if(lang==="ar")return plainArabic(p.nameAr||p.nameEn||p.id);
  if(lang==="fr"){
    if(p.nameFr)return p.nameFr;
    try{if(window.ZWM_FR_TRANSLATE)return window.ZWM_FR_TRANSLATE(p.nameEn||p.id)}catch{}
  }
  return p.nameEn||p.nameAr||p.id;
}
function currentSize(v){
  if(lang==="ar")return plainArabic(v?.sizeAr||v?.sizeEn||"");
  if(lang==="fr")return v?.sizeFr||v?.sizeEn||v?.sizeAr||"";
  return v?.sizeEn||v?.sizeAr||"";
}
function categoryName(cat){return lang==="ar"?(CATEGORY_AR[cat]||cat):lang==="fr"?(CATEGORY_FR[cat]||cat):cat}
const VERIFIED_PRODUCT_KEYS={
  origin:{en:["originEn","origin","sourceEn","source"],ar:["originAr","sourceAr","originEn","origin","sourceEn","source"],fr:["originFr","sourceFr","originEn","origin","sourceEn","source"]},
  ingredients:{en:["ingredientsEn","ingredients"],ar:["ingredientsAr","ingredientsEn","ingredients"],fr:["ingredientsFr","ingredientsEn","ingredients"]},
  allergens:{en:["allergensEn","allergens"],ar:["allergensAr","allergensEn","allergens"],fr:["allergensFr","allergensEn","allergens"]},
  storage:{en:["storageEn","storage"],ar:["storageAr","storageEn","storage"],fr:["storageFr","storageEn","storage"]},
  details:{en:["descriptionEn","detailsEn","description","details"],ar:["descriptionAr","detailsAr","descriptionEn","detailsEn","description","details"],fr:["descriptionFr","detailsFr","descriptionEn","detailsEn","description","details"]},
  nutrition:{en:["nutritionEn","nutrition"],ar:["nutritionAr","nutritionEn","nutrition"],fr:["nutritionFr","nutritionEn","nutrition"]}
};
function verifiedProductValue(p,key){
  const locale=lang==="ar"?"ar":lang==="fr"?"fr":"en";
  const fields=VERIFIED_PRODUCT_KEYS[key]?.[locale]||[];
  for(const field of fields){
    const value=p?.[field];
    if(Array.isArray(value)){
      const clean=value.map(item=>String(item??"").trim()).filter(Boolean);
      if(clean.length)return clean.join(" · ");
      continue;
    }
    if(value&&typeof value==="object")continue;
    const text=String(value??"").trim();
    if(text)return text;
  }
  return "";
}
function verifiedProductFacts(p){
  const locale=lang==="ar"?"ar":lang==="fr"?"fr":"en";
  const labels={
    en:{origin:"Origin",ingredients:"Ingredients",allergens:"Allergens",storage:"Storage",details:"Product-specific details",nutrition:"Nutrition"},
    ar:{origin:"المنشأ",ingredients:"المكونات",allergens:"مسببات الحساسية",storage:"الحفظ",details:"تفاصيل خاصة بالمنتج",nutrition:"معلومات غذائية"},
    fr:{origin:"Origine",ingredients:"Ingrédients",allergens:"Allergènes",storage:"Conservation",details:"Détails spécifiques au produit",nutrition:"Informations nutritionnelles"}
  }[locale];
  return ["origin","ingredients","allergens","storage","details","nutrition"].map(key=>{
    const value=verifiedProductValue(p,key);
    return value?{key,label:labels[key],value}:null;
  }).filter(Boolean);
}
function originKeyFor(p){
  const source=normalize(verifiedProductValue(p,"origin"));
  if(!source)return "";
  if(source.includes("chouf")||source.includes("الشوف"))return "Chouf";
  if(source.includes("koura")||source.includes("الكورة"))return "Koura";
  if(source.includes("mount lebanon")||source.includes("mont liban")||source.includes("جبل لبنان"))return "Mount Lebanon";
  if(source.includes("beqaa")||source.includes("bekaa")||source.includes("البقاع"))return "Bekaa";
  return "";
}
function originFor(p){
  const value=verifiedProductValue(p,"origin");
  if(!value)return "";
  const label=lang==="ar"?"المنشأ":lang==="fr"?"Origine":"Origin";
  return label+" · "+(lang==="ar"?plainArabic(value):value);
}
function plainArabic(s){
  return String(s||"")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g,"")
    .replace(/\s+/g," ")
    .trim();
}
function normalize(s){
  return String(s||"")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[\u064B-\u065F\u0670]/g,"")
    .replace(/[أإآٱ]/g,"ا")
    .replace(/ى/g,"ي")
    .replace(/ة/g,"ه")
    .replace(/ؤ/g,"و")
    .replace(/ئ/g,"ي");
}
function arabiziNormalize(s){
  return normalize(s)
    .replace(/7['’]/g,"kh")
    .replace(/3/g,"a")
    .replace(/5/g,"kh")
    .replace(/7/g,"h")
    .replace(/8/g,"gh")
    .replace(/9/g,"s")
    .replace(/6/g,"t")
    .replace(/2/g,"a");
}
function smartNormalize(s){
  return arabiziNormalize(s)
    .replace(/[^a-z0-9\u0600-\u06ff]+/g," ")
    .replace(/\s+/g," ")
    .trim();
}
function levenshtein(a,b){
  a=Array.from(a);b=Array.from(b);
  const row=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    let prev=row[0];row[0]=i;
    for(let j=1;j<=b.length;j++){
      const old=row[j];
      row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));
      prev=old;
    }
  }
  return row[b.length];
}
function searchAliasTerms(q){
  const aliases={
    "hummus":"chickpea hommos hommos humus","hommos":"chickpea hummus humus","humus":"chickpea hummus",
    "aadas":"lentil lentils adas","adas":"lentil lentils aadas","zaatar":"zaatar thyme","zatar":"zaatar thyme",
    "kamoun":"cumin","cumin":"kamoun","debs":"molasses dibs","dibs":"molasses debs","zeit":"oil zayt","zayt":"oil zeit",
    "toum":"garlic thoum","thoum":"garlic toum","somak":"sumac","sumak":"sumac","sumac":"somak sumak",
    "teen":"fig figs","tin":"fig figs","freekeh":"freek","freek":"freekeh","burghol":"bulgur","borghol":"bulgur"
  };
  return aliases[q]||"";
}
function productSearchText(p){
  const infoEn=CATEGORY_INFO[p.category]?.en?.join(" ")||"";
  const infoAr=CATEGORY_INFO[p.category]?.ar?.join(" ")||"";
  let nameFr=p.nameFr||"";
  if(!nameFr){try{nameFr=window.ZWM_FR_TRANSLATE?window.ZWM_FR_TRANSLATE(p.nameEn):""}catch{}}
  const searchAliases=Array.isArray(p.searchAliases)?p.searchAliases.join(" "):"";
  return smartNormalize([p.nameEn,plainArabic(p.nameAr),nameFr,p.original,searchAliases,p.category,CATEGORY_AR[p.category]||"",infoEn,infoAr].join(" "));
}
function fuzzyTokenMatch(qToken,hayTokens){
  let best=99;
  for(const token of hayTokens){
    if(token===qToken)return 0;
    if(token.startsWith(qToken)||qToken.startsWith(token))best=Math.min(best,0.25);
    if(token.includes(qToken)||qToken.includes(token))best=Math.min(best,0.5);
    if(qToken.length>=3&&token.length>=3){
      const d=levenshtein(qToken,token);
      const allowed=qToken.length<=4?1:Math.max(1,Math.floor(qToken.length*.28));
      if(d<=allowed)best=Math.min(best,d);
    }
  }
  return best;
}
function searchScore(p,rawQuery){
  const q=smartNormalize(rawQuery);
  if(!q)return 1;
  const hay=productSearchText(p);
  if(hay.includes(q))return 100;
  const alias=searchAliasTerms(q);
  const queryTokens=(q+" "+alias).trim().split(/\s+/).filter(Boolean);
  const hayTokens=hay.split(/\s+/).filter(Boolean);
  let total=0,matched=0;
  for(const qt of queryTokens){
    const d=fuzzyTokenMatch(qt,hayTokens);
    if(d<99){matched++;total+=d}
  }
  const originalTokens=q.split(/\s+/).filter(Boolean);
  const originalMatched=originalTokens.filter(qt=>fuzzyTokenMatch(qt,hayTokens)<99).length;
  if(originalMatched<originalTokens.length)return 0;
  return 70+matched*4-total;
}
function productById(id){const canonical=window.ZWM_PRODUCT_ALIASES?.[id]||id;return PRODUCTS_DATA.find(p=>p.id===canonical)}
function variantById(p,id){return p?.variants.find(v=>v.id===id)||p?.variants[0]}
function defaultVariant(p){return p.variants[0]}
// The 4 L tin is visible for inquiry only until an owner-priced catalogue variant exists.
const HARVEST_4L_ID="extra-virgin-olive-oil-4-l";
function viewVariants(p){
  const existing=p?.variants||[];
  if(p?.id!=="extra-virgin-olive-oil"||existing.some(v=>v.id===HARVEST_4L_ID))return existing;
  const four={id:HARVEST_4L_ID,sizeEn:"4 L",sizeAr:"4 لتر",sizeFr:"4 L",price:null,quoteOnly:true};
  const copy=existing.slice();
  const after=copy.findIndex(v=>v.id==="extra-virgin-olive-oil-1-l");
  copy.splice(after<0?0:after+1,0,four);
  return copy;
}
function viewVariantById(p,id){return viewVariants(p).find(v=>v.id===id)||defaultVariant(p)}
function harvestQuotePrice(){return lang==="ar"?"السعر عند الاستفسار":lang==="fr"?"Prix sur demande":"Price on request"}
function harvestQuoteAction(){return lang==="ar"?"اسأل عن سعر ٤ لتر":lang==="fr"?"Demander le prix du 4 L":"Ask for 4 L price"}
function harvestQuoteUrl(){return "https://wa.me/96170381412?text="+encodeURIComponent("Hello, I would like the price and availability of the 2026 harvest extra virgin olive oil 4 L tin.")}
function viewPrice(v){return v?.quoteOnly?harvestQuotePrice():money(v?.price)}
function cardVariantFor(p){return viewVariantById(p,cardVariant[p.id])||defaultVariant(p)}
function qtyFor(key){return Math.max(1,Number(draftQty[key]||1))}
function cartKey(productId,variantId){return `${productId}::${variantId}`}

function loadCart(){
  try{
    const raw=JSON.parse(safeStorageGet(CART_KEY)||"{}");
    const valid={};
    for(const [key,item] of Object.entries(raw||{})){
      const p=productById(item.productId);
      const v=variantById(p,item.variantId);
      if(p&&v) valid[key]={productId:p.id,variantId:v.id,qty:Math.max(1,Number(item.qty)||1)};
    }
    return valid;
  }catch{return{}}
}
function saveCart(){safeStorageSet(CART_KEY,JSON.stringify(cart))}
function loadGiftItems(){
  try{
    const raw=JSON.parse(safeStorageGet(GIFT_KEY)||"{}"),valid={};
    for(const [key,item] of Object.entries(raw||{})){
      const p=productById(item.productId),v=variantById(p,item.variantId);
      if(p&&v)valid[key]={productId:p.id,variantId:v.id,qty:Math.max(1,Number(item.qty)||1)};
    }
    return valid;
  }catch{return{}}
}
function saveGiftItems(){safeStorageSet(GIFT_KEY,JSON.stringify(giftItems))}
function giftRows(){
  return Object.entries(giftItems).map(([key,item])=>{
    const p=productById(item.productId),v=variantById(p,item.variantId);
    return p&&v&&productCanOrder(p)?{key,p,v,qty:item.qty}:null;
  }).filter(Boolean);
}
function addGiftItem(productId,variantId,qty=1){
  const p=productById(productId);if(!p)return;
  if(!productCanOrder(p)){toast(availabilityLabel(p));return;}
  const v=variantById(p,variantId)||defaultVariant(p),key=cartKey(p.id,v.id);
  if(giftItems[key])giftItems[key].qty+=Math.max(1,Number(qty)||1);
  else giftItems[key]={productId:p.id,variantId:v.id,qty:Math.max(1,Number(qty)||1)};
  saveGiftItems();renderGiftSummary();renderGiftPickerResults();
}
function removeGiftItem(key){delete giftItems[key];saveGiftItems();renderGiftSummary();renderGiftPickerResults()}
function changeGiftQty(key,delta){
  if(!giftItems[key])return;
  giftItems[key].qty=Math.max(1,giftItems[key].qty+delta);
  saveGiftItems();renderGiftSummary();
}
function changeGiftVariant(oldKey,productId,variantId){
  const old=giftItems[oldKey];if(!old)return;
  const p=productById(productId),v=variantById(p,variantId);if(!p||!v)return;
  delete giftItems[oldKey];
  const newKey=cartKey(p.id,v.id);
  if(giftItems[newKey])giftItems[newKey].qty+=old.qty;
  else giftItems[newKey]={productId:p.id,variantId:v.id,qty:old.qty};
  saveGiftItems();renderGiftSummary();renderGiftPickerResults();
}
function loadFavorites(){
  try{return new Set(JSON.parse(safeStorageGet(FAV_KEY)||"[]"))}catch{return new Set()}
}
function saveFavorites(){safeStorageSet(FAV_KEY,JSON.stringify([...favorites]))}
function loadRecent(){
  try{return (JSON.parse(safeStorageGet(RECENT_KEY)||"[]")||[]).filter(id=>productById(id)).slice(0,10)}catch{return[]}
}
function saveRecent(){safeStorageSet(RECENT_KEY,JSON.stringify(recentViews))}
function toggleFavorite(id){
  if(favorites.has(id))favorites.delete(id);else favorites.add(id);
  saveFavorites();
  renderProducts();
  renderRecent();
  renderFavoritesCount();
  if(currentModalProduct?.id===id)renderModal(id,currentModalVariant?.id);
}
function addRecent(id){
  recentViews=[id,...recentViews.filter(x=>x!==id)].slice(0,10);
  saveRecent();
  renderRecent();
}
function renderFavoritesCount(){
  const el=$("#favoritesCount");if(el)el.textContent=favorites.size;
  const btn=$("#favoritesOnly");if(btn){btn.classList.toggle("is-active",favoritesOnly);btn.setAttribute("aria-pressed",String(favoritesOnly))}
}
function badgesFor(p){
  const t=EXTRA_UI[lang],n=p.nameEn.toLowerCase(),badges=[];
  if(FEATURED_IDS.includes(p.id))badges.push(lang==="ar"?"شائع":"Popular");
  if(p.variants.length>1)badges.push(t.badgeMulti);
  if(["Mouneh","Pickles","Olives"].includes(p.category))badges.push(t.badgeTraditional);
  if(/zaatar|sumac|olive oil|labneh|makdous|molasses/.test(n))badges.push(t.badgeClassic);
  if(p.category==="Flour"||/baking powder|yeast|vanilla/.test(n))badges.push(t.badgeBaking);
  if(/honey|jam|labneh|zaatar|olive|molasses/.test(n))badges.push(t.badgeBreakfast);
  return [...new Set(badges)].slice(0,2);
}

function infoFor(p){
  const base=CATEGORY_INFO[p.category]||CATEGORY_INFO["Condiments"];
  let enWhat=base.en[0],enUse=base.en[1],arWhat=base.ar[0],arUse=base.ar[1];
  const n=p.nameEn.toLowerCase();
  if(n.includes("cumin")){
    enWhat="Cumin is a warm, earthy spice available whole or ground.";
    enUse="Use in meat, rice, legumes, soups, marinades and spice blends.";
    arWhat="الكمون بهار دافئ وترابي النكهة، ويتوفر حباً أو مطحوناً.";
    arUse="يُستخدم مع اللحوم والأرز والبقوليات والحساء والماريناد وخلطات البهار.";
  }else if(n.includes("cardamom")){
    enWhat="Cardamom is a fragrant spice with citrusy, floral warmth.";
    enUse="Use in coffee, tea, rice, sweets and selected savoury dishes.";
    arWhat="الهيل بهار عطري بنفحات حمضية وزهرية دافئة.";
    arUse="يُستخدم في القهوة والشاي والأرز والحلويات وبعض الأطباق المالحة.";
  }else if(n.includes("cinnamon")){
    enWhat="Cinnamon is a sweet-warm aromatic spice, available ground or as sticks.";
    enUse="Use in desserts, warm drinks, rice, stews and baking.";
    arWhat="القرفة بهار عطري دافئ وحلو، متوفر مطحوناً أو عيداناً.";
    arUse="تُستخدم في الحلويات والمشروبات الساخنة والأرز واليخنات والخَبز.";
  }else if(n.includes("sumac")){
    enWhat="Sumac is a deep red spice with a bright, tangy flavour.";
    enUse="Sprinkle over salads, onions, grilled foods, fattoush and mezze.";
    arWhat="السماق بهار أحمر داكن بطعم حامض ومنعش.";
    arUse="يُرش على السلطات والبصل والمشاوي والفتوش والمازة.";
  }else if(n.includes("za'atar")||n.includes("za’atar")||n.includes("zaatar")){
    enWhat="Za’atar is a Levantine herb-and-spice pantry staple; the blend varies by style.";
    enUse="Mix with olive oil for manakish, or serve with labneh, eggs, breads and salads.";
    arWhat="الزعتر من أساسيات المونة الشامية، وتختلف الخلطة بحسب النوع.";
    arUse="يُخلط مع زيت الزيتون للمناقيش أو يُقدّم مع اللبنة والبيض والخبز والسلطات.";
  }else if(n.includes("lentil")){
    enWhat="Lentils are dried pulses commonly used in quick-cooking everyday dishes.";
    enUse="Cook in soups, mujadara-style dishes, stews and salads.";
    arWhat="العدس من البقوليات المجففة ويُستخدم عادةً في أطباق يومية سريعة الطبخ.";
    arUse="يُستخدم في الشوربات والمجدرة واليخنات والسلطات.";
  }else if(n.includes("chickpea")){
    enWhat="Chickpeas are dried pulses with a nutty flavour and creamy texture when cooked.";
    enUse="Use for hummus, stews, salads, soups and roasted snacks.";
    arWhat="الحمص من البقوليات المجففة بطعم جوزي وقوام كريمي بعد الطبخ.";
    arUse="يُستخدم للحمص واليخنات والسلطات والشوربات أو للتحميص.";
  }else if(n.includes("bulgur")){
    enWhat="Bulgur is parboiled, dried cracked wheat, offered in different grinds.";
    enUse="Use for tabbouleh, kibbeh, pilafs, stuffing and grain salads.";
    arWhat="البرغل قمح مسلوق ومجفف ومجروش، ويتوفر بدرجات خشونة مختلفة.";
    arUse="يُستخدم في التبولة والكبة والبرغل المفلفل والحشوات وسلطات الحبوب.";
  }else if(n.includes("olive oil")){
    enWhat="Olive oil is a Lebanese pantry staple; grade and production details vary by product.";
    enUse="Use for dipping, dressings, mezze, marinades and cooking.";
    arWhat="زيت الزيتون من أساسيات المونة اللبنانية، وتختلف الدرجة وتفاصيل الإنتاج بحسب المنتج.";
    arUse="يُستخدم للتغميس والتتبيلات والمازة والماريناد والطبخ.";
  }else if(n.includes("honey")){
    enWhat="Honey is a naturally sweet bee-made pantry food; flavour varies by floral source and blend.";
    enUse="Use at breakfast, in drinks, dressings, desserts or alongside cheese.";
    arWhat="العسل غذاء طبيعي حلو من النحل، وتختلف نكهته بحسب مصدر الرحيق والخلطة.";
    arUse="يُستخدم مع الفطور والمشروبات والتتبيلات والحلويات أو مع الجبنة.";
  }else if(n.includes("molasses")){
    enWhat="Fruit molasses is a concentrated syrup; exact ingredients and production method vary by product.";
    enUse="Use in dressings, marinades, sauces and Lebanese sweet-sour pairings.";
    arWhat="دبس الفاكهة شراب مركز، وتختلف المكونات وطريقة الإنتاج الدقيقة بحسب المنتج.";
    arUse="يُستخدم في التتبيلات والماريناد والصلصات والوصفات اللبنانية الحلوة الحامضة.";
  }else if(n.includes("jam")){
    enWhat="Jams and preserves are spreadable fruit- or flower-based pantry foods; exact ingredients and preparation vary by product.";
    enUse="Serve with bread, labneh, breakfast plates, pastries or desserts.";
    arWhat="المربيات أصناف قابلة للدهن من الفاكهة أو الورد، وتختلف المكونات وطريقة التحضير بحسب المنتج.";
    arUse="يُقدّم مع الخبز واللبنة والفطور والمعجنات والحلويات.";
  }else if(n.includes("labneh")){
    enWhat="Labneh is strained yogurt. Labneh balls are a common mouneh format; exact ingredients and preservation method vary by product.";
    enUse="Serve with olive oil, bread, breakfast, mezze and herbs.";
    arWhat="اللبنة لبن مصفّى، وكرات اللبنة من أشكال المونة الشائعة؛ وتختلف المكونات وطريقة الحفظ بحسب المنتج.";
    arUse="تُقدّم مع زيت الزيتون والخبز والفطور والمازة والأعشاب.";
  }else if(n.includes("makdous")){
    enWhat="Makdous is a traditional preserved stuffed eggplant preparation.";
    enUse="Serve at breakfast or mezze with bread, vegetables and olive oil.";
    arWhat="المكدوس باذنجان محشي ومحفوظ على الطريقة التقليدية.";
    arUse="يُقدّم على الفطور أو المازة مع الخبز والخضار وزيت الزيتون.";
  }else if(n.includes("vinegar")||n.includes("verjuice")){
    enWhat="Vinegar and verjuice are acidic pantry ingredients; the exact base and preparation vary by item.";
    enUse="Use in dressings, marinades, sauces and preserved foods.";
    arWhat="الخل والحصرم من المكونات الحامضة للمطبخ، ويختلف المصدر وطريقة التحضير بحسب الصنف.";
    arUse="يُستخدم في التتبيلات والماريناد والصلصات والمونة.";
  }
  return lang==="ar"?{what:arWhat,use:arUse}:{what:enWhat,use:enUse};
}

function applyPageMetadata(){
  const copy=(PAGE_I18N[CURRENT_PAGE]||PAGE_I18N.home)[lang];
  if(!copy)return;
  document.title=copy.title;
  const md=document.querySelector('meta[name="description"]');if(md)md.content=copy.description;
  const ogTitle=document.querySelector('meta[property="og:title"]');if(ogTitle)ogTitle.content=copy.title;
  const ogDesc=document.querySelector('meta[property="og:description"]');if(ogDesc)ogDesc.content=copy.description;
  const ogLocale=document.querySelector('meta[property="og:locale"]');if(ogLocale)ogLocale.content=lang==="ar"?"ar_LB":lang==="fr"?"fr_LB":"en_LB";
  const skip=$("#skipLink");if(skip)skip.textContent=copy.skip;
}

function applyAccessibleLanguage(){
  const ar=lang==="ar";
  const aria=(selector,en,arText)=>{const el=document.querySelector(selector);if(el)el.setAttribute("aria-label",ar?arText:lang==="fr"&&typeof window.ZWM_FR_TRANSLATE==="function"?window.ZWM_FR_TRANSLATE(en):en)};
  aria(".nav","Primary navigation","التنقل الرئيسي");
  aria(".brand","Zayt w Mouneh home","الصفحة الرئيسية لزيت ومونة");
  const brandLogo=document.querySelector(".brand-logo img");if(brandLogo)brandLogo.alt=ar?"شعار زيت ومونة":"Zayt w Mouneh logo";
  const navToggle=$("#navToggle");
  if(navToggle)navToggle.setAttribute("aria-label",navToggle.getAttribute("aria-expanded")==="true"?(ar?"إغلاق القائمة":"Close menu"):(ar?"فتح القائمة":"Open menu"));
  aria(".nav-search","Search the pantry","ابحث في المونة");
  aria(".nav-instagram","Instagram","إنستغرام");
  aria("#languageSwitch","Language","اللغة");
  aria("#cartButton","Open cart","فتح السلة");
  aria("#cartDrawer","Shopping cart","سلة المشتريات");
  aria("#cartClose","Close cart","إغلاق السلة");
  aria("#productModalClose","Close product details","إغلاق تفاصيل المنتج");
  aria("#modalQtyMinus","Decrease quantity","تقليل الكمية");
  aria("#modalQtyPlus","Increase quantity","زيادة الكمية");
  aria("#categories","Shop by category","تسوّق حسب القسم");
  aria(".hero-trust-points","Why Zayt w Mouneh","لماذا زيت ومونة");
  aria(".hanging-sign-stage","Hanging wooden pantry sign","لافتة المونة الخشبية");
  aria("#categoryQuickGrid","All product categories","كل أقسام المنتجات");
  aria("#categorySelect","Filter catalogue by category","تصفية المنتجات حسب القسم");
  aria(".catalogue-head-meta","Catalogue overview","ملخص المنتجات");
  aria(".shop-trust-ribbon","Shopping benefits","مزايا التسوق");
  aria(".pantry-scenes","Pantry films","مشاهد من المونة");
  aria(".scene-controls","Choose hero film","اختر مشهد المونة");
  const sceneLabels=ar?["عرض مشهد العسل","عرض مشهد العدس","عرض مشهد القمح"]:["Show honey film","Show lentil film","Show wheat film"];
  $$("[data-scene-dot]").forEach((btn,i)=>btn.setAttribute("aria-label",sceneLabels[i]||sceneLabels[0]));
  aria(".gift-v4-hero-card","How gifting works","كيف تعمل الهدية");
  aria("#giftCategorySelect","Browse gift products by category","تصفّح منتجات الهدية حسب القسم");
  const menuInstagram=document.querySelector('.menu-utility-link[href*="instagram"] span');if(menuInstagram)menuInstagram.textContent=ar?"إنستغرام":"Instagram";
  const footerWhatsApp=document.querySelector('footer a[href^="https://wa.me"]');if(footerWhatsApp)footerWhatsApp.textContent=ar?"واتساب":"WhatsApp";
  const socialInstagram=document.querySelector('#socialBand a[href*="instagram"] span');if(socialInstagram)socialInstagram.textContent=ar?"إنستغرام":"Instagram";
  if($("#toastText")&&!$("#toast").classList.contains("is-visible"))$("#toastText").textContent=ar?"تمت الإضافة إلى السلة":"Added to cart";
  if($("#productModalAdd")&&!currentModalProduct)$("#productModalAdd").textContent=UI[lang].add;
}

function renderGiftPresentationOptions(){
  const theme=$("#giftTheme"),card=$("#giftCardLanguage");
  if(theme){
    const current=theme.value||"Olive green";
    const labels=lang==="ar"
      ?{"Olive green":"أخضر زيتوني","Natural linen":"كتان طبيعي","Warm gold":"ذهبي دافئ"}
      :{"Olive green":"Olive green","Natural linen":"Natural linen","Warm gold":"Warm gold"};
    theme.innerHTML=Object.entries(labels).map(([value,label])=>`<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("");
    theme.value=current;
  }
  if(card){
    const current=card.value||"English";
    const labels=lang==="ar"
      ?{"English":"الإنجليزية","Arabic":"العربية","Bilingual":"ثنائية اللغة"}
      :{"English":"English","Arabic":"Arabic","Bilingual":"English + العربية"};
    card.innerHTML=Object.entries(labels).map(([value,label])=>`<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("");
    card.value=current;
  }
}

function syncLanguageVisibility(){
  const showArabic=lang==="ar";
  $$(".only-en, .only-ar").forEach(el=>{
    const shouldHide=showArabic?el.classList.contains("only-en"):el.classList.contains("only-ar");
    if(shouldHide){
      el.style.setProperty("display","none","important");
      el.setAttribute("aria-hidden","true");
      el.dataset.langVisibilityGuard="1";
    }else{
      el.style.setProperty("display","revert","important");
      delete el.dataset.langVisibilityGuard;
      el.removeAttribute("aria-hidden");
    }
  });
}

function applyLanguage(next,{immediate=false}={}){
  lang=next==="ar"?"ar":next==="fr"?"fr":"en";
  if(window.ZWM_LOCALE?.set)window.ZWM_LOCALE.set(lang);else safeStorageSet(LANG_KEY,lang==="ar"?"ar":"en");
  const t=lang==="fr"?new Proxy(UI.en,{get:(target,key)=>typeof target[key]==="string"&&window.ZWM_FR_TRANSLATE?window.ZWM_FR_TRANSLATE(target[key]):target[key]}):UI[lang];
  $$("[data-lang]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.lang===lang));

  const commitLanguage=()=>{
    document.documentElement.classList.add("lang-switching");
    document.documentElement.lang=lang;
    document.documentElement.dir=lang==="ar"?"rtl":"ltr";
    syncLanguageVisibility();
    applyPageMetadata();
    applyAccessibleLanguage();

  const textMap={
    skipLink:"skipLink",announcementText:"announcementText",announcementOrder:"announcementOrder",brandWordmark:"brand",
    navHome:"navHome",navShop:"navShop",navCategories:"navCategories",navAbout:"navAbout",navContact:"navContact",cartLabel:"cartLabel",
    heroEyebrow:"heroEyebrow",heroLede:"heroLede",heroWhatsApp:"heroWhatsApp",heroVariantLabel:"heroVariantLabel",heroCategoryLabel:"heroCategoryLabel",heroSinceLabel:"heroSinceLabel",
    scene1Kicker:"scene1Kicker",scene1Title:"scene1Title",scene1Copy:"scene1Copy",scene2Kicker:"scene2Kicker",scene2Title:"scene2Title",scene2Copy:"scene2Copy",scene3Kicker:"scene3Kicker",scene3Title:"scene3Title",scene3Copy:"scene3Copy",heroScript:"heroScript",
    categoriesEyebrow:"categoriesEyebrow",categoriesCopy:"categoriesCopy",aboutEyebrow:"aboutEyebrow",aboutLetterKicker:"aboutLetterKicker",aboutP1:"aboutP1",aboutP2:"aboutP2",
    value1Title:"value1Title",value1Copy:"value1Copy",value2Title:"value2Title",value2Copy:"value2Copy",value3Title:"value3Title",value3Copy:"value3Copy",signKicker:"signKicker",signCopy:"signCopy",
    shopEyebrow:"shopEyebrow",shopNote:"shopNote",categorySelectLabel:"categorySelectLabel",resultLabel:"resultLabel",emptyTitle:"emptyTitle",emptyCopy:"emptyCopy",
    orderEyebrow:"orderEyebrow",orderIntroCopy:"orderIntroCopy",step1Title:"step1Title",step1Copy:"step1Copy",step2Title:"step2Title",step2Copy:"step2Copy",step3Title:"step3Title",step3Copy:"step3Copy",
    contactEyebrow:"contactEyebrow",contactCopy:"contactCopy",contactPhoneLabel:"phone",contactWaLabel:"whatsapp",contactIgLabel:"instagram",contactLocationLabel:"location",contactLocationValue:"lebanon",
    footerBrand:"brand",footerCopy:"footerCopy",footerCatalogue:"footerCatalogue",footerAbout:"footerAbout",copyrightBrand:"brand",
    cartEyebrow:"cartEyebrow",cartTitle:"cartTitle",cartEmptyTitle:"cartEmptyTitle",cartEmptyCopy:"cartEmptyCopy",cartTotalLabel:"total",
    orderDetailsTitle:"orderDetailsTitle",orderDetailsNote:"orderDetailsNote",customerNameLabel:"yourName",customerPhoneLabel:"phone",customerAreaLabel:"area",orderNotesLabel:"notes",priceNote:"priceNote",
    whatLabel:"what",useLabel:"use",nutritionLabel:"nutritionLabel",chooseSizeLabel:"chooseSize"
  };
  Object.entries(textMap).forEach(([id,key])=>{const el=$("#"+id);if(el&&t[key]!==undefined)el.textContent=t[key]});

  const htmlMap={heroTitle:"heroTitle",heroExplore:"heroExplore",categoriesTitle:"categoriesTitle",aboutTitle:"aboutTitle",signTitle:"signTitle",signCta:"signCta",shopTitle:"shopTitle",orderTitle:"orderTitle",contactTitle:"contactTitle",sendOrderButton:"sendOrder"};
  Object.entries(htmlMap).forEach(([id,key])=>{const el=$("#"+id);if(el&&t[key]!==undefined)el.innerHTML=t[key]});

  if($("#productSearch"))$("#productSearch").placeholder=t.searchPlaceholder;
  if($("#customerName"))$("#customerName").placeholder=t.namePlaceholder;
  if($("#customerPhone"))$("#customerPhone").placeholder=t.phonePlaceholder;
  if($("#customerArea"))$("#customerArea").placeholder=t.areaPlaceholder;
  if($("#orderNotes"))$("#orderNotes").placeholder=t.notesPlaceholder;
  if($("#clearSearch"))$("#clearSearch").textContent=t.clearFilters;
  if($("#loadMore"))$("#loadMore").textContent=t.loadMore;
  if($("#cartBrowse"))$("#cartBrowse").textContent=t.browseProducts;

    renderCategories();
  renderCategorySelect();
  renderProducts();
  renderCart();
    if(currentModalProduct) renderModal(currentModalProduct.id,currentModalVariant?.id);
    applyExtraLanguage();
    renderSearchSuggestions();
    clearTimeout(window.__zwmLangTimer);window.__zwmLangTimer=setTimeout(()=>document.documentElement.classList.remove("lang-switching"),320);
  };

  if(languageFrame)cancelAnimationFrame(languageFrame);
  if(immediate){
    commitLanguage();
  }else{
    languageFrame=requestAnimationFrame(()=>{
      languageFrame=null;
      commitLanguage();
    });
  }
}

function renderCategories(){
  const grid=$("#categoryGrid");
  if(grid){
    const homeCats=["Mouneh","Honey","Olive Oil","Molasses","Olives","Pickles","Grains","Spices"];
    const cats=CURRENT_PAGE==="home"?homeCats:CATEGORY_ORDER;

    grid.innerHTML=cats.map((cat,index)=>{
      const count=CATEGORY_COUNTS[cat]||0;
      const info=CATEGORY_INFO[cat]?.[lang]||["",""];
      const href=CURRENT_PAGE==="shop"?`?category=${encodeURIComponent(cat)}#shop`:`shop.html?category=${encodeURIComponent(cat)}#shop`;
      return `<a class="category-card reveal" href="${href}" data-cat="${escapeHtml(cat)}">
        <div class="category-card-top"><span class="category-index">${String(index+1).padStart(2,"0")}</span><span class="category-count">${count} ${lang==="ar"?"منتج":"products"}</span></div>
        <div class="category-card-main">
          <div class="category-name">${escapeHtml(categoryName(cat))}</div>
          <p class="category-blurb">${escapeHtml(info[0])}</p>
        </div>
        <div class="category-card-bottom"><span class="text-link">${lang==="ar"?"عرض المنتجات":"View products"}</span><div class="category-arrow">${lang==="ar"?"↙":"↘"}</div></div>
      </a>`;
    }).join("");
  }

  const quick=$("#categoryQuickGrid");
  if(quick&&CURRENT_PAGE==="shop"){
    const cats=CATEGORY_ORDER.slice();
    quick.innerHTML=cats.map((cat,index)=>{
      const count=CATEGORY_COUNTS[cat]||0;
      const href=`?category=${encodeURIComponent(cat)}#shop`;
      const representative=PRODUCTS_DATA.find(p=>p.category===cat);
      const visual=representative?productVisualMarkup(representative,"category-quick-image"):`<span class="category-quick-fallback">✦</span>`;
      return `<a class="category-quick-card" href="${href}" data-cat="${escapeHtml(cat)}">
        <span class="category-quick-visual">${visual}</span>
        <span class="category-quick-index">${String(index+1).padStart(2,"0")}</span>
        <span class="category-quick-name">${escapeHtml(categoryName(cat))}</span>
        <span class="category-quick-meta">${count} ${lang==="ar"?"منتج":"products"} <b>${lang==="ar"?"←":"→"}</b></span>
      </a>`;
    }).join("");

    const quickLabel=$("#categoryQuickLabel");
    const quickCopy=$("#categoryQuickCopy");
    const allCount=$("#categoryAllCount");
    const browse=$("#browseAllProducts");
    const search=$("#focusProductSearch");
    if(quickLabel)quickLabel.textContent=lang==="ar"?"كل الأقسام":"All categories";
    if(quickCopy)quickCopy.textContent=lang==="ar"?"اختر قسماً وانتقل مباشرة إلى منتجاته.":"Choose a pantry family and jump straight to its products.";
    if(allCount)allCount.textContent=lang==="ar"?`${CATEGORY_ORDER.length} قسماً`:`${CATEGORY_ORDER.length} categories`;
    if(browse)browse.innerHTML=lang==="ar"?"عرض كل المنتجات <span>↙</span>":"Browse all products <span>↘</span>";
    if(search)search.textContent=lang==="ar"?"ابحث عن منتج":"Search products";
    syncCategoryQuickState();
  }
}

function syncCategoryQuickState(){
  if(CURRENT_PAGE!=="shop")return;
  document.querySelectorAll("#categoryQuickGrid [data-cat]").forEach(card=>{
    const selected=activeCategory!=="All"&&card.dataset.cat===activeCategory;
    card.classList.toggle("is-active",selected);
    if(selected)card.setAttribute("aria-current","true");
    else card.removeAttribute("aria-current");
  });
}

function syncShopFilterUrl(){
  if(CURRENT_PAGE!=="shop"||!history.replaceState)return;
  const url=new URL(location.href);
  if(activeCategory==="All")url.searchParams.delete("category");
  else url.searchParams.set("category",activeCategory);
  const q=query.trim();
  if(q)url.searchParams.set("q",q);
  else url.searchParams.delete("q");
  url.hash="shop";
  history.replaceState(null,"",url.pathname+url.search+url.hash);
}

function activateShopCategory(cat,{scroll=true}={}){
  const valid=cat==="All"||CATEGORY_ORDER.includes(cat);
  if(CURRENT_PAGE!=="shop"||!valid)return;
  activeCategory=cat;
  query="";
  favoritesOnly=false;
  visibleLimit=catalogPageSize();
  const search=$("#productSearch");
  if(search)search.value="";
  renderCategorySelect();
  renderProducts();
  renderFavoritesCount();
  renderSearchSuggestions();
  syncCategoryQuickState();
  syncShopFilterUrl();
  if(scroll){
    const shopSection=$("#shop");
    if(shopSection)shopSection.scrollIntoView({behavior:"smooth",block:"start"});
  }
}

function renderCategorySelect(){
  const select=$("#categorySelect");
  if(!select)return;
  const options=[{key:"All",label:UI[lang].categoryAll,count:PRODUCTS_DATA.length},...CATEGORY_ORDER.map(cat=>({key:cat,label:categoryName(cat),count:CATEGORY_COUNTS[cat]||0}))];
  select.innerHTML=options.map(o=>`<option value="${escapeHtml(o.key)}">${escapeHtml(o.label)} · ${o.count}</option>`).join("");
  select.value=activeCategory;
}

function filteredProducts(){
  const q=query.trim();
  const rows=PRODUCTS_DATA
    .map((p,index)=>({p,index,score:q?searchScore(p,q):1}))
    .filter(({p,score})=>{
      const catOk=activeCategory==="All"||p.category===activeCategory;
      const favOk=!favoritesOnly||favorites.has(p.id);
      const budgetOk=!window.ZWM_CATALOGUE_ENHANCEMENTS||window.ZWM_CATALOGUE_ENHANCEMENTS.allowsPrice(p);
      return catOk&&favOk&&budgetOk&&(!q||score>0);
    });
  rows.sort((a,b)=>q?b.score-a.score:a.index-b.index);
  return rows.map(x=>x.p);
}

function productPriceSummary(p){
  const prices=p.variants.map(v=>Number(v.price));
  const min=Math.min(...prices);
  const max=Math.max(...prices);
  return {min,max,same:min===max};
}

function renderProducts(){
  const grid=$("#productGrid");
  if(!grid)return;
  const t=UI[lang];
  const filtered=filteredProducts();
  const shown=filtered.slice(0,visibleLimit);
  const resultCount=$("#resultCount");if(resultCount)resultCount.textContent=filtered.length;

  grid.innerHTML=shown.map((p,index)=>{
    const info=infoFor(p);
    const badges=badgesFor(p);
    const isFav=favorites.has(p.id);
    const selected=cardVariantFor(p);
    const q=qtyFor("card:"+p.id);
    const ps=productPriceSummary(p);
    const listingNote=lang==="en"?repeatedListingNote(p):"";
    const availability=productAvailability(p);
    const canOrder=availability==="in_stock";
    const variants=viewVariants(p);
    const sizeOptions=variants.length>1
      ? `<select class="card-variant-select" data-card-variant="${p.id}" aria-label="${escapeHtml(t.chooseSize)}">${variants.map(v=>`<option value="${escapeHtml(v.id)}"${v.id===selected.id?" selected":""}>${escapeHtml(currentSize(v))} · ${escapeHtml(viewPrice(v))}</option>`).join("")}</select>`
      : `<div class="single-size">${escapeHtml(currentSize(selected))}</div>`;

    return `<article class="product-card product-card-animated" style="--card-i:${index%8}" data-product="${escapeHtml(p.id)}">
      <div class="product-top">
        <div class="product-visual">${productVisualMarkup(p,"product-image",selected.id)}<span class="quick-view-hint">${lang==="ar"?"عرض سريع ↗":"Quick view ↗"}</span></div>
        <div class="product-top-actions">
          <button class="product-favorite ${isFav?"is-active":""}" type="button" data-fav="${escapeHtml(p.id)}" aria-pressed="${isFav}" aria-label="${escapeHtml(EXTRA_UI[lang].favorite)}">${uiIcon("heart",isFav)}</button>
          <button class="product-view" type="button" data-view="${escapeHtml(p.id)}" aria-label="${escapeHtml(t.view+" "+currentName(p))}">${uiIcon("eye")}</button>
        </div>
      </div>
      <div class="product-badges">${badges.map(b=>`<span>${escapeHtml(b)}</span>`).join("")}<span class="availability-chip availability-${availability}">${escapeHtml(availabilityLabel(p))}</span></div>
      <p class="product-category">${escapeHtml(categoryName(p.category))}</p>\n      ${originFor(p)?`<p class="product-origin">${escapeHtml(originFor(p))}</p>`:""}\n      ${listingNote?`<p class="product-listing-note">${escapeHtml(listingNote)}</p>`:""}\n      <h3 class="product-name"><a href="${escapeHtml((lang==="ar"?"/ar":lang==="fr"?"/fr":"")+quickViewProductUrl(p.id))}" aria-label="${escapeHtml(currentName(p))}">${escapeHtml(currentName(p))}</a></h3>
      <p class="product-description"><strong>${escapeHtml(t.what)}:</strong> ${escapeHtml(info.what)}</p>
      <p class="product-use"><strong>${escapeHtml(t.use)}:</strong> ${escapeHtml(info.use)}</p>
      <div class="product-price-row">
        <div class="product-price"><small>${p.variants.length>1&&p.id!=="extra-virgin-olive-oil"?escapeHtml(t.from):""}</small><strong class="money">${escapeHtml(p.id==="extra-virgin-olive-oil"?viewPrice(selected):money(ps.min))}</strong></div>
        <div class="product-size-summary">${p.variants.length>1?`${variants.length} ${escapeHtml(t.sizeOptions)}`:escapeHtml(currentSize(selected))}</div>
      </div>
      <div class="product-actions">
        ${sizeOptions}
        <div class="product-buy-row">
          <div class="card-qty">
            <button type="button" data-card-q="-1" data-id="${escapeHtml(p.id)}" ${canOrder&&!selected.quoteOnly?"":"disabled"} aria-label="${escapeHtml(lang==="ar"?"تقليل الكمية":"Decrease quantity")}">−</button>
            <span data-card-qty="${escapeHtml(p.id)}">${q}</span>
            <button type="button" data-card-q="1" data-id="${escapeHtml(p.id)}" ${canOrder&&!selected.quoteOnly?"":"disabled"} aria-label="${escapeHtml(lang==="ar"?"زيادة الكمية":"Increase quantity")}">+</button>
          </div>
          <button class="add-button" type="button" data-add="${escapeHtml(p.id)}" ${canOrder||selected.quoteOnly?"":"disabled"}>${escapeHtml(selected.quoteOnly?harvestQuoteAction():canOrder?t.add:availabilityLabel(p))}</button>
        </div>
      </div>
    </article>`;
  }).join("");

  const empty=$("#catalogEmpty");if(empty)empty.hidden=filtered.length>0;
  const more=$("#loadMore");
  if(more&&more.parentElement){
    const remaining=Math.max(0,filtered.length-visibleLimit);
    more.parentElement.hidden=filtered.length===0||remaining===0;
    if(remaining>0){
      const next=Math.min(catalogPageSize(),remaining);
      more.textContent=lang==="ar"
        ? `عرض ${next} إضافية · بقي ${remaining}`
        : `Load ${next} more · ${remaining} left`;
      more.setAttribute("aria-label",more.textContent);
    }
  }

  $$("[data-fav]").forEach(btn=>btn.addEventListener("click",e=>{e.stopPropagation();if(!acceptSingleTap(btn,300))return;toggleFavorite(btn.dataset.fav)}));
  $$("[data-card-variant]").forEach(sel=>sel.addEventListener("change",e=>{
    e.stopPropagation();
    cardVariant[sel.dataset.cardVariant]=sel.value;
    const p=productById(sel.dataset.cardVariant);
    if(p?.id==="extra-virgin-olive-oil"){
      const visual=sel.closest(".product-card")?.querySelector(".product-visual .product-image");
      if(visual)visual.outerHTML=productVisualMarkup(p,"product-image",sel.value);
      const price=sel.closest(".product-card")?.querySelector(".product-price .money");
      const variant=viewVariantById(p,sel.value);
      if(price&&variant)price.textContent=viewPrice(viewVariantById(p,sel.value));
      const card=sel.closest(".product-card");
      const button=card?.querySelector("[data-add]");
      if(button){button.disabled=!variant?.quoteOnly&&!productCanOrder(p);button.textContent=variant?.quoteOnly?harvestQuoteAction():productCanOrder(p)?t.add:availabilityLabel(p);}
      card?.querySelectorAll("[data-card-q]").forEach(btn=>{btn.disabled=!!variant?.quoteOnly||!productCanOrder(p)});
    }
  }));
  $$("[data-card-q]").forEach(btn=>btn.addEventListener("click",e=>{
    e.stopPropagation();
    const key="card:"+btn.dataset.id;
    draftQty[key]=Math.max(1,qtyFor(key)+Number(btn.dataset.cardQ));
    const display=$(`[data-card-qty="${cssEscape(btn.dataset.id)}"]`);
    if(display)display.textContent=draftQty[key];
  }));
  $$("[data-add]").forEach(btn=>btn.addEventListener("click",e=>{
    e.stopPropagation();
    if(!acceptSingleTap(btn,320))return;
    const p=productById(btn.dataset.add);
    if(!p)return;
    const chosen=cardVariantFor(p);
    if(chosen?.quoteOnly){location.href=harvestQuoteUrl();return}
    addToCart(p,chosen,qtyFor("card:"+p.id));
    animateAddToCart(btn,p);
  }));
  $$("[data-view]").forEach(btn=>btn.addEventListener("click",e=>{e.stopPropagation();if(!acceptSingleTap(btn,260))return;openProduct(btn.dataset.view,btn)}));
  $$("[data-product]").forEach(card=>{
    card.addEventListener("click",e=>{if(!e.target.closest("button,select"))openProduct(card.dataset.product,card)});
    card.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&!e.target.closest("button,select")){e.preventDefault();openProduct(card.dataset.product,card)}});
  });
}

function addToCart(p,v,qty){
  if(!v||v.quoteOnly||!p?.variants?.some(row=>row.id===v.id&&row.price!=null&&Number.isFinite(Number(row.price))))return;
  if(!productCanOrder(p)){toast(availabilityLabel(p));return;}
  const key=cartKey(p.id,v.id);
  cart[key]={productId:p.id,variantId:v.id,qty:Math.max(1,Number(qty)||1)};
  saveCart();
  renderCart();
  const cartTotal=cartRows().reduce((sum,row)=>sum+row.qty*Number(row.v.price),0);
  const delivery=deliveryQuoteFor(cartTotal,$("#customerArea")?.value||"");
  const threshold=delivery.freeAbove||50;
  const remaining=Math.max(0,threshold-cartTotal);
  const deliveryCopy=remaining>0
    ?(lang==="ar"?"باقي "+money(remaining)+" للتوصيل المجاني":money(remaining)+" away from free delivery")
    :(lang==="ar"?"التوصيل المجاني أصبح متاحاً ✓":"Free delivery unlocked ✓");
  toast(`${currentName(p)} · ${currentSize(v)} — ${UI[lang].added} · ${deliveryCopy}`,{cartAction:true});
}

function changeCartQty(key,delta){
  if(!cart[key])return;
  cart[key].qty=Math.max(1,cart[key].qty+delta);
  saveCart();
  renderCart();
}

function removeCart(key){
  const item=cart[key];
  const p=item?productById(item.productId):null;
  delete cart[key];
  saveCart();
  renderCart();
  toast(`${p?currentName(p):""} — ${UI[lang].removed}`);
}

function cartRows(){
  return Object.entries(cart).map(([key,item])=>{
    const p=productById(item.productId);
    const v=variantById(p,item.variantId);
    return p&&v?{key,p,v,qty:item.qty}:null;
  }).filter(Boolean);
}

function renderCart(){
  const t=UI[lang];
  const rows=cartRows();
  const unavailable=rows.filter(r=>!productCanOrder(r.p));
  const totalQty=rows.reduce((s,r)=>s+r.qty,0);
  const total=rows.reduce((s,r)=>s+r.qty*Number(r.v.price),0);
  $("#cartCount").textContent=totalQty;
  $("#drawerCount").textContent=totalQty;
  $("#cartSubline").textContent=rows.length?`${t.cartProducts(rows.length)} · ${t.cartItems(totalQty)} · ${t.cartSaved}`:t.cartSaved;
  $("#cartEmpty").hidden=rows.length>0;
  $("#orderForm").hidden=rows.length===0;
  const checkoutButton=$("#sendOrderButton");
  if(checkoutButton){
    checkoutButton.disabled=unavailable.length>0;
    checkoutButton.setAttribute("aria-disabled",String(unavailable.length>0));
    checkoutButton.title=unavailable.length?(lang==="ar"?"راجع المنتجات غير المتوفرة قبل إتمام الطلب.":"Review unavailable items before checkout."):"";
  }
  $("#cartTotal").textContent=money(total);
  window.ZWM_CMS?.renderDeliverySummary?.(total);
  window.ZWM_REWARDS?.refreshCheckout?.(total);
  renderGiftSummary();
  renderMobileOrderBar();

  $("#cartItems").innerHTML=rows.map(({key,p,v,qty})=>`
    <article class="cart-item">
      <div>
        <h3>${escapeHtml(currentName(p))}</h3>
        <p class="cart-item-meta">${escapeHtml(categoryName(p.category))} · ${escapeHtml(currentSize(v))} · ${escapeHtml(availabilityLabel(p))}</p>
        <p class="cart-item-price">${money(v.price)} × ${qty}</p>
      </div>
      <div class="qty-control">
        <button type="button" data-cart-q="-1" data-key="${escapeHtml(key)}" aria-label="${escapeHtml(lang==="ar"?"تقليل الكمية":"Decrease quantity")}">−</button>
        <span>${qty}</span>
        <button type="button" data-cart-q="1" data-key="${escapeHtml(key)}" aria-label="${escapeHtml(lang==="ar"?"زيادة الكمية":"Increase quantity")}">+</button>
      </div>
      <div class="cart-item-footer">
        <button class="product-view" type="button" data-cart-view="${escapeHtml(p.id)}">${escapeHtml(t.details)}</button>
        <span class="cart-line-total">${money(v.price*qty)}</span>
        <button class="cart-remove" type="button" data-remove="${escapeHtml(key)}">${escapeHtml(t.remove)}</button>
      </div>
    </article>
  `).join("");

  $$("[data-cart-q]").forEach(btn=>btn.addEventListener("click",()=>changeCartQty(btn.dataset.key,Number(btn.dataset.cartQ))));
  $$("[data-remove]").forEach(btn=>btn.addEventListener("click",()=>removeCart(btn.dataset.remove)));
  $$("[data-cart-view]").forEach(btn=>btn.addEventListener("click",()=>openProduct(btn.dataset.cartView,btn)));
}

function syncProductUrl(id){
  if(CURRENT_PAGE!=="shop"||!history.replaceState)return;
  const url=new URL(location.href);
  if(id)url.searchParams.set("product",id);else url.searchParams.delete("product");
  history.replaceState({product:id||null},"",url.pathname+url.search+url.hash);
}
function quickViewRequiredNodes(){
  const ids=["productModal","cartBackdrop","productModalMark","productModalCategory","productModalTitle","productModalOriginal","modalBadges","relatedProducts","productModalDescription","productModalUse","nutritionPanel","productNutrition","modalPrice","productModalQty","productModalAdd","variantOptions","productModalClose"];
  const missing=ids.filter(id=>!document.getElementById(id));
  return {missing,modal:document.getElementById("productModal"),backdrop:document.getElementById("cartBackdrop")};
}
function quickViewProductUrl(id){
  return "/product/"+encodeURIComponent(id);
}
function cleanupQuickView({restoreFocus=true,syncUrl=true}={}){
  const modal=$("#productModal");
  const trigger=currentModalTrigger;
  document.body.classList.remove("modal-open");
  if(modal){
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden","true");
  }
  currentModalProduct=null;
  currentModalVariant=null;
  draftQty["modal"]=1;
  if(syncUrl)syncProductUrl(null);
  backdropMaybeOff();
  currentModalTrigger=null;
  if(restoreFocus&&trigger&&trigger.isConnected&&typeof trigger.focus==="function"){
    requestAnimationFrame(()=>{try{trigger.focus({preventScroll:true})}catch{try{trigger.focus()}catch{}}});
  }
}
function fallbackQuickView(id,error){
  console.error("[ZWM Quick View] Failed to open",id,error);
  cleanupQuickView({restoreFocus:false,syncUrl:true});
  setTimeout(()=>{location.href=quickViewProductUrl(id)},0);
}
function openProduct(id,trigger=null){
  if(quickViewOpening)return;
  const p=productById(id);
  if(!p)return;
  if(document.body.classList.contains("modal-open")&&currentModalProduct?.id===id)return;
  const v=cardVariantFor(p);
  const refs=quickViewRequiredNodes();
  if(!v||refs.missing.length){
    fallbackQuickView(p.id,new Error("Missing Quick View requirements: "+refs.missing.join(", ")+(v?"":"; no valid variant")));
    return;
  }
  quickViewOpening=true;
  const triggerEl=trigger&&trigger.nodeType===1?trigger:(document.activeElement&&document.activeElement!==document.body?document.activeElement:null);
  try{
    window.ZWM_CLOSE_NAV?.();
    closeCart();
    currentModalProduct=p;
    currentModalVariant=v;
    currentModalTrigger=triggerEl;
    draftQty["modal"]=1;
    if(renderModal(p.id,v.id)===false)throw new Error("Quick View render returned no content");
    syncProductUrl(id);
    addRecent(id);
    backdropOn();
    refs.modal.classList.add("is-open");
    refs.modal.setAttribute("aria-hidden","false");
    document.body.classList.add("modal-open");
    requestAnimationFrame(()=>{
      const close=$("#productModalClose");
      if(close&&document.body.classList.contains("modal-open"))close.focus({preventScroll:true});
    });
  }catch(error){
    fallbackQuickView(p.id,error);
  }finally{
    quickViewOpening=false;
  }
}
function trapQuickViewFocus(event){
  if(event.key!=="Tab"||!document.body.classList.contains("modal-open"))return;
  const modal=$("#productModal");
  if(!modal||modal.getAttribute("aria-hidden")==="true")return;
  const items=Array.from(modal.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>!el.hidden&&el.getClientRects().length>0);
  if(!items.length){event.preventDefault();return}
  const first=items[0],last=items[items.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
}

function renderModal(productId,variantId){
  const p=productById(productId);
  if(!p)return false;
  const v=viewVariantById(p,variantId)||defaultVariant(p);
  if(!v)return false;
  currentModalProduct=p;
  currentModalVariant=v;
  const t=UI[lang],info=infoFor(p),facts=verifiedProductFacts(p),badges=badgesFor(p);
  $("#productModalMark").innerHTML=productVisualMarkup(p,"product-modal-image",v.id);
  $("#productModalCategory").textContent=categoryName(p.category);
  $("#productModalTitle").textContent=currentName(p);
  $("#productModalOriginal").textContent=lang==="en"&&normalize(p.nameEn)!==normalize(p.original)?`Catalogue name: ${p.original}`:"";
  $("#modalBadges").innerHTML=badges.map(b=>`<span>${escapeHtml(b)}</span>`).join("");
  const fav=$("#modalFavorite");
  if(fav){const saved=favorites.has(p.id);fav.classList.toggle("is-active",saved);fav.setAttribute("aria-pressed",String(saved));fav.innerHTML=`${uiIcon("heart",saved)} <span id="modalFavoriteLabel">${escapeHtml(saved?EXTRA_UI[lang].favorited:EXTRA_UI[lang].favorite)}</span>`;}
  if($("#relatedLabel"))$("#relatedLabel").textContent=EXTRA_UI[lang].related;
  const origin=$("#productOrigin");if(origin){origin.textContent="";origin.hidden=true;}
  $("#relatedProducts").innerHTML=PRODUCTS_DATA.filter(x=>x.category===p.category&&x.id!==p.id).slice(0,4).map(x=>`<button type="button" data-related="${escapeHtml(x.id)}"><span>${escapeHtml(currentName(x))}</span><strong>${money(productPriceSummary(x).min)}</strong></button>`).join("");
  $$("[data-related]").forEach(btn=>btn.addEventListener("click",()=>openProduct(btn.dataset.related,btn)));
  $("#productModalDescription").textContent=info.what;
  $("#productModalUse").textContent=info.use;
  $("#nutritionPanel").hidden=!facts.length;
  $("#productNutrition").textContent=facts.map(item=>`${item.label}: ${item.value}`).join(" · ");
  $("#modalPrice").textContent=viewPrice(v);
  $("#productModalQty").textContent=qtyFor("modal");
  const modalCanOrder=productCanOrder(p);
  $("#productModalAdd").textContent=v.quoteOnly?harvestQuoteAction():modalCanOrder?t.add:availabilityLabel(p);
  $("#productModalAdd").disabled=!modalCanOrder&&!v.quoteOnly;
  $("#variantOptions").innerHTML=viewVariants(p).map(option=>`<button type="button" class="variant-option ${option.id===v.id?"is-active":""}" data-modal-variant="${escapeHtml(option.id)}">${escapeHtml(currentSize(option))} · ${escapeHtml(viewPrice(option))}</button>`).join("");
  $$("[data-modal-variant]").forEach(btn=>btn.addEventListener("click",()=>{
    const next=viewVariantById(p,btn.dataset.modalVariant);
    if(!next)return;
    currentModalVariant=next;
    renderModal(p.id,currentModalVariant.id);
  }));
  return true;
}

function closeProduct(){
  cleanupQuickView({restoreFocus:true,syncUrl:true});
}


function renderSearchSuggestions(){
  const box=$("#searchSuggestions");
  if(!box)return;
  const q=query.trim();
  if(!q){box.hidden=true;box.innerHTML="";return}
  const results=PRODUCTS_DATA
    .map(p=>({p,score:searchScore(p,q)}))
    .filter(x=>x.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0,6);
  box.innerHTML=results.length?results.map(({p})=>`<button type="button" data-suggest="${escapeHtml(p.id)}"><span><strong>${escapeHtml(currentName(p))}</strong><small>${escapeHtml(categoryName(p.category))}</small></span><b>${money(productPriceSummary(p).min)}</b></button>`).join(""):`<p>${escapeHtml(EXTRA_UI[lang].searchNoSuggestions)}</p>`;
  box.hidden=false;
  $$("[data-suggest]").forEach(btn=>btn.addEventListener("pointerdown",e=>{e.preventDefault();if(!acceptSingleTap(btn,260))return;box.hidden=true;openProduct(btn.dataset.suggest,btn)}));
}

function renderFeaturedProducts(){
  const grid=$("#featuredGrid");if(!grid)return;
  const items=FEATURED_IDS.map(productById).filter(Boolean);
  grid.innerHTML=items.map((p,index)=>{
    const v=defaultVariant(p);
    const ps=productPriceSummary(p);
    const canOrder=productCanOrder(p);
    return `<article class="featured-product ${index===0?"is-featured-lead":""}" style="--featured-i:${index}" data-featured-view="${escapeHtml(p.id)}">
      <div class="featured-product-media">${productVisualMarkup(p,"featured-product-image")}<span class="featured-product-badge">${lang==="ar"?"مختار":"Featured"}</span></div>
      <div class="featured-product-copy">
        <p>${escapeHtml(categoryName(p.category))}</p>
        <h3>${escapeHtml(currentName(p))}</h3>
        ${originFor(p)?`<span class="featured-origin">${escapeHtml(originFor(p))}</span>`:""}
        <div class="featured-product-foot"><span><strong>${money(ps.min)}</strong><small>${p.variants.length>1?(lang==="ar"?"من ":"from ")+money(ps.min):escapeHtml(currentSize(v))}</small></span><button type="button" data-featured-add="${escapeHtml(p.id)}" ${canOrder?"":"disabled"}>${escapeHtml(canOrder?UI[lang].add:availabilityLabel(p))} <b>${canOrder?"+":""}</b></button></div>
      </div>
    </article>`;
  }).join("");
  $$("[data-featured-view]").forEach(card=>card.addEventListener("click",e=>{if(!e.target.closest("button"))openProduct(card.dataset.featuredView,card)}));
  $$("[data-featured-add]").forEach(btn=>btn.addEventListener("click",e=>{e.stopPropagation();if(!acceptSingleTap(btn,320))return;const p=productById(btn.dataset.featuredAdd);if(p){addToCart(p,defaultVariant(p),1);animateAddToCart(btn,p)}}));
}

function renderGiftPresets(){
  const wrap=$("#giftPresetGrid");if(!wrap)return;
  wrap.innerHTML=GIFT_PRESETS.map(preset=>{
    const rows=preset.items.map(productById).filter(Boolean).map(p=>({p,v:defaultVariant(p)}));
    const total=rows.reduce((s,r)=>s+Number(r.v.price),0);
    return `<article class="gift-preset-card">
      <span>${escapeHtml(lang==="ar"?"هدية جاهزة":"Ready-made gift")}</span>
      <h3>${escapeHtml(lang==="ar"?preset.titleAr:preset.titleEn)}</h3>
      <p>${escapeHtml(lang==="ar"?preset.copyAr:preset.copyEn)}</p>
      <small>${rows.map(r=>escapeHtml(currentName(r.p))).join(" · ")}</small>
      <div><strong>${money(total)}</strong><button type="button" data-gift-preset="${escapeHtml(preset.id)}">${escapeHtml(lang==="ar"?"اختر هذه الهدية":"Choose this gift")}</button></div>
    </article>`;
  }).join("");
  $$("[data-gift-preset]").forEach(btn=>btn.addEventListener("click",()=>{if(!acceptSingleTap(btn,320))return;applyGiftPreset(btn.dataset.giftPreset)}));
}
function applyGiftPreset(id){
  const preset=GIFT_PRESETS.find(x=>x.id===id);if(!preset)return;
  giftItems={};
  preset.items.map(productById).filter(Boolean).forEach(p=>{const v=defaultVariant(p);giftItems[cartKey(p.id,v.id)]={productId:p.id,variantId:v.id,qty:1}});
  saveGiftItems();renderGiftSummary();renderGiftPickerResults();
  const form=$("#giftForm");if(form)form.scrollIntoView({behavior:"smooth",block:"start"});
  toast(lang==="ar"?"تم تجهيز الهدية — يمكنك تعديلها الآن":"Gift loaded — you can customize it now");
}

function renderRecent(){
  const section=$("#recentSection"),rail=$("#recentRail");
  if(!section||!rail)return;
  const items=recentViews.map(productById).filter(Boolean);
  section.hidden=!items.length;
  if(!items.length){rail.innerHTML="";return}
  rail.innerHTML=items.map(p=>`<button type="button" class="recent-card" data-recent-view="${escapeHtml(p.id)}"><span class="recent-mark">${productVisualMarkup(p,"recent-product-image")}</span><span><small>${escapeHtml(categoryName(p.category))}</small><strong>${escapeHtml(currentName(p))}</strong></span><b>${money(productPriceSummary(p).min)}</b></button>`).join("");
  $$("[data-recent-view]").forEach(btn=>btn.addEventListener("click",()=>openProduct(btn.dataset.recentView,btn)));
}

function renderGiftOptions(){
  const t=EXTRA_UI[lang],occ=$("#giftOccasion"),pack=$("#giftPackaging");
  if(!occ||!pack)return;
  const occValue=occ.value,packValue=pack.value;
  occ.innerHTML=t.giftOccasions.map((v,i)=>`<option value="${i}">${escapeHtml(v)}</option>`).join("");
  pack.innerHTML=t.giftPackings.map((v,i)=>`<option value="${i}">${escapeHtml(v)}</option>`).join("");
  if([...occ.options].some(o=>o.value===occValue))occ.value=occValue;
  if([...pack.options].some(o=>o.value===packValue))pack.value=packValue;
}
function renderGiftCategorySelect(){
  const select=$("#giftCategorySelect");if(!select)return;
  select.innerHTML=[
    `<option value="All">${escapeHtml(EXTRA_UI[lang].giftAllCategories)} · ${PRODUCTS_DATA.length}</option>`,
    ...CATEGORY_ORDER.map(cat=>`<option value="${escapeHtml(cat)}">${escapeHtml(categoryName(cat))} · ${CATEGORY_COUNTS[cat]||0}</option>`)
  ].join("");
  select.value=giftCategory;
}
function renderGiftPickerResults(){
  const box=$("#giftProductResults"),input=$("#giftProductSearch"),more=$("#giftLoadMore");if(!box||!input)return;
  const q=input.value.trim();
  let items=PRODUCTS_DATA
    .map(p=>({p,score:q?searchScore(p,q):1}))
    .filter(({p,score})=>(giftCategory==="All"||p.category===giftCategory)&&(!q||score>0));
  if(q)items.sort((a,b)=>b.score-a.score);
  const total=items.length;
  items=items.slice(0,giftVisibleLimit);
  box.innerHTML=items.map(({p})=>{
    const v=defaultVariant(p),already=giftRows().some(r=>r.p.id===p.id),canOrder=productCanOrder(p);
    return `<button type="button" class="gift-result ${already?"is-added":""} ${canOrder?"":"is-unavailable"}" data-gift-add="${escapeHtml(p.id)}" ${canOrder?"":"disabled"}>
      <span class="gift-result-mark">${productVisualMarkup(p,"gift-product-image")}</span>
      <span><small>${escapeHtml(categoryName(p.category))}</small><strong>${escapeHtml(currentName(p))}</strong><em>${escapeHtml(currentSize(v))} · ${money(v.price)}${p.variants.length>1?` · ${p.variants.length} ${escapeHtml(UI[lang].sizeOptions)}`:""}</em></span>
      <b>${already?"✓":canOrder?escapeHtml(EXTRA_UI[lang].giftAdd):escapeHtml(availabilityLabel(p))}</b>
    </button>`;
  }).join("");
  if(!items.length)box.innerHTML=`<p class="gift-no-results">${escapeHtml(UI[lang].emptyCopy)}</p>`;
  if(more){
    more.hidden=giftVisibleLimit>=total;
    more.textContent=EXTRA_UI[lang].giftMore;
  }
  document.querySelectorAll("[data-gift-add]").forEach(btn=>btn.addEventListener("click",()=>{
    if(!acceptSingleTap(btn,320))return;
    const p=productById(btn.dataset.giftAdd);if(!p)return;
    addGiftItem(p.id,defaultVariant(p).id,1);
  }));
}
function renderGiftSummary(){
  const rows=giftRows(),summary=$("#giftSummary");if(!summary)return;
  const totalQty=rows.reduce((s,r)=>s+r.qty,0),total=rows.reduce((s,r)=>s+r.qty*Number(r.v.price),0);
  $("#giftBasketCount").textContent=lang==="ar"?`${totalQty} قطعة`:`${totalQty} ${totalQty===1?"item":"items"}`;
  $("#giftBasketTotal").textContent=money(total);
  summary.innerHTML=rows.length?rows.map(r=>`<article class="gift-selected-row">
    <div class="gift-selected-name"><strong>${escapeHtml(currentName(r.p))}</strong><small>${escapeHtml(categoryName(r.p.category))}</small></div>
    <select data-gift-variant="${escapeHtml(r.key)}" data-gift-product="${escapeHtml(r.p.id)}" aria-label="${escapeHtml(UI[lang].chooseSize)}">
      ${r.p.variants.map(v=>`<option value="${escapeHtml(v.id)}"${v.id===r.v.id?" selected":""}>${escapeHtml(currentSize(v))} · ${money(v.price)}</option>`).join("")}
    </select>
    <div class="gift-selected-controls"><button type="button" data-gift-q="-1" data-key="${escapeHtml(r.key)}" aria-label="${escapeHtml(lang==="ar"?"تقليل الكمية":"Decrease quantity")}">−</button><span>${r.qty}</span><button type="button" data-gift-q="1" data-key="${escapeHtml(r.key)}" aria-label="${escapeHtml(lang==="ar"?"زيادة الكمية":"Increase quantity")}">+</button></div>
    <strong class="gift-line-total">${money(r.v.price*r.qty)}</strong>
    <button type="button" class="gift-remove" data-gift-remove="${escapeHtml(r.key)}" aria-label="${escapeHtml(lang==="ar"?"إزالة من الهدية":"Remove from gift")}">×</button>
  </article>`).join(""):`<p id="giftEmpty">${escapeHtml(EXTRA_UI[lang].giftEmpty)}</p>`;
  document.querySelectorAll("[data-gift-q]").forEach(btn=>btn.addEventListener("click",()=>changeGiftQty(btn.dataset.key,Number(btn.dataset.giftQ))));
  document.querySelectorAll("[data-gift-remove]").forEach(btn=>btn.addEventListener("click",()=>removeGiftItem(btn.dataset.giftRemove)));
  document.querySelectorAll("[data-gift-variant]").forEach(sel=>sel.addEventListener("change",()=>changeGiftVariant(sel.dataset.giftVariant,sel.dataset.giftProduct,sel.value)));
}
function useCartForGift(){
  for(const r of cartRows())addGiftItem(r.p.id,r.v.id,r.qty);
  toast(lang==="ar"?"تمت إضافة منتجات السلة إلى الهدية":"Cart items added to the gift");
}
function updateGiftV4Preview(){
  const preview=$("#giftCardPreviewStatic");if(!preview)return;
  const recipient=$("#giftRecipient")?.value.trim()||"";
  const message=$("#giftMessage")?.value.trim()||"";
  const sender=$("#giftSender")?.value.trim()||"";
  const theme=$("#giftTheme")?.value||"Olive green";
  preview.dataset.theme=theme;
  const to=$("#giftPreviewTo"),msg=$("#giftPreviewMessage"),from=$("#giftPreviewSender");
  if(to)to.textContent=recipient?(lang==="ar"?"إلى "+recipient:"To "+recipient):(lang==="ar"?"إلى شخص عزيز":"To someone special");
  if(msg)msg.textContent=message||(lang==="ar"?"نكهة صغيرة من لبنان، مختارة لك.":"A little taste of Lebanon, chosen for you.");
  if(from)from.textContent=sender?(lang==="ar"?"— من "+sender:"— From "+sender):(lang==="ar"?"— بمحبة":"— With care");
}
async function sendGiftOrder(){
  const rows=giftRows(),t=EXTRA_UI[lang];
  if(!rows.length){toast(t.giftNeedItems);return}
  const occasionSelect=$("#giftOccasion");
  const packingSelect=$("#giftPackaging");
  const meta={
    recipient:$("#giftRecipient")?.value.trim()||"",
    occasion:occasionSelect?.selectedOptions?.[0]?.textContent||"",
    packing:packingSelect?.selectedOptions?.[0]?.textContent||"",
    area:$("#giftArea")?.value.trim()||"",
    message:$("#giftMessage")?.value.trim()||"",
    sender:$("#giftSender")?.value.trim()||"",
    theme:$("#giftTheme")?.value||"",
    card_language:$("#giftCardLanguage")?.value||"",
    hide_prices:$("#giftHidePrices")?.checked!==false
  };
  try{sessionStorage.setItem("zwm:native-gift:meta:v1",JSON.stringify(meta))}catch{}
  window.ZWM_CMS?.track?.("checkout_started",{source:"gift_builder"});
  location.href="/checkout.html?kind=gift";
}
function renderMobileOrderBar(){
  const bar=$("#mobileOrderBar");if(!bar)return;
  const rows=cartRows(),qty=rows.reduce((s,r)=>s+r.qty,0),total=rows.reduce((s,r)=>s+r.qty*Number(r.v.price),0);
  bar.hidden=!qty;
  $("#mobileOrderText").textContent=EXTRA_UI[lang].mobileReview;
  $("#mobileOrderMeta").textContent=lang==="ar"?`${qty} قطعة · ${money(total)}`:`${qty} ${qty===1?"item":"items"} · ${money(total)}`;
}

function applyExtraLanguage(){
  const t=EXTRA_UI[lang];
  const text={
    navGift:"navGift",menuLabel:"menuLabel",menuHeading:"menuHeading",menuSubheading:"menuSubheading",menuLocation:"menuLocation",trustEyebrow:"trustEyebrow",trustSinceTitle:"trustSinceTitle",trustSinceCopy:"trustSinceCopy",trustDeliveryTitle:"trustDeliveryTitle",trustDeliveryCopy:"trustDeliveryCopy",
    trustPriceTitle:"trustPriceTitle",trustPriceCopy:"trustPriceCopy",trustWhatsAppTitle:"trustWhatsAppTitle",trustWhatsAppCopy:"trustWhatsAppCopy",
    favoritesFilterLabel:"favorites",recentEyebrow:"recentEyebrow",recentTitle:"recentTitle",clearRecent:"clearRecent",
    giftEyebrow:"giftEyebrow",giftCopy:"giftCopy",giftPerk1:"giftPerk1",giftPerk2:"giftPerk2",giftPerk3:"giftPerk3",giftBuilderLabel:"giftBuilderLabel",giftProductsLabel:"giftProductsLabel",giftProductsHint:"giftProductsHint",giftUseCart:"giftUseCart",giftSelectedTitle:"giftSelectedTitle",giftClear:"giftClear",
    giftRecipientLabel:"giftRecipient",giftOccasionLabel:"giftOccasion",giftPackagingLabel:"giftPackaging",giftAreaLabel:"giftArea",giftMessageLabel:"giftMessage",giftSenderLabel:"giftSender",giftNote:"giftNote",
    socialEyebrow:"socialEyebrow",socialCopy:"socialCopy",footerDelivery:"footerDelivery",footerExploreTitle:"footerExploreTitle",footerGift:"footerGift",footerContactTitle:"footerContactTitle",
    relatedLabel:"related",contactCopy:"contactCopy",contactLocationValue:"locationValue",contactHoursLabel:"contactHoursLabel",contactHoursValue:"contactHoursValue",footerLocation:"footerLocation"
  };
  Object.entries(text).forEach(([id,key])=>{const el=$("#"+id);if(el&&t[key]!==undefined)el.textContent=t[key]});
  const html={trustTitle:"trustTitle",giftTitle:"giftTitle",giftBrowse:"giftBrowse",giftSend:"giftSend",socialTitle:"socialTitle"};
  Object.entries(html).forEach(([id,key])=>{const el=$("#"+id);if(el&&t[key]!==undefined)el.textContent=t[key]});
  if($("#giftProductSearch"))$("#giftProductSearch").placeholder=t.giftProductPlaceholder;
  if($("#giftRecipient"))$("#giftRecipient").placeholder=t.giftRecipientPlaceholder;
  if($("#giftArea"))$("#giftArea").placeholder=t.giftAreaPlaceholder;
  if($("#giftMessage"))$("#giftMessage").placeholder=t.giftMessagePlaceholder;
  if($("#giftSender"))$("#giftSender").placeholder=t.giftSenderPlaceholder;
  renderGiftPresentationOptions();
  renderGiftOptions();
  renderGiftCategorySelect();
  renderGiftPickerResults();
  renderRecent();
  renderGiftSummary();
  renderGiftPresets();
  renderFeaturedProducts();
  renderFavoritesCount();
  renderMobileOrderBar();
  updateGiftV4Preview();
}

function setupMotionReveals(){
  const nodes=$$(".motion-reveal");
  if(!nodes.length)return;
  if(!("IntersectionObserver" in window)){
    nodes.forEach(n=>n.classList.add("is-visible"));
    return;
  }
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.12,rootMargin:"0px 0px -6% 0px"});
  nodes.forEach(n=>observer.observe(n));
}

function setupCountUps(){
  const nodes=$$("[data-count-up]");
  if(!nodes.length)return;
  const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate=node=>{
    if(node.dataset.counted==="1")return;
    node.dataset.counted="1";
    const target=Number(node.dataset.countUp)||0;
    if(reduce){node.textContent=String(target);return}
    const start=performance.now(),duration=720;
    const tick=now=>{
      const t=Math.min(1,(now-start)/duration);
      const eased=1-Math.pow(1-t,3);
      node.textContent=String(Math.round(target*eased));
      if(t<1)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if(!("IntersectionObserver" in window)){nodes.forEach(animate);return}
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){animate(entry.target);observer.unobserve(entry.target)}})
  },{threshold:.65});
  nodes.forEach(n=>observer.observe(n));
}

function setupPointerGlow(){
  if(!window.matchMedia||!window.matchMedia("(pointer:fine)").matches)return;
  $$(".interactive-glow").forEach(el=>{
    el.addEventListener("pointermove",e=>{
      const r=el.getBoundingClientRect();
      el.style.setProperty("--glow-x",((e.clientX-r.left)/r.width*100).toFixed(1)+"%");
      el.style.setProperty("--glow-y",((e.clientY-r.top)/r.height*100).toFixed(1)+"%");
    },{passive:true});
  });
}

function setupHeroParallax(){
  const hero=$(".home-pantry-hero");
  if(!hero||!window.matchMedia||!window.matchMedia("(pointer:fine)").matches)return;
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  let raf=0;
  const move=e=>{
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      const r=hero.getBoundingClientRect();
      const nx=(e.clientX-r.left)/r.width-.5;
      const ny=(e.clientY-r.top)/r.height-.5;
      hero.style.setProperty("--hero-x",(nx*-10).toFixed(2)+"px");
      hero.style.setProperty("--hero-y",(ny*-7).toFixed(2)+"px");
      hero.style.setProperty("--float-x",(nx*12).toFixed(2)+"px");
      hero.style.setProperty("--float-y",(ny*9).toFixed(2)+"px");
    });
  };
  hero.addEventListener("pointermove",move,{passive:true});
  hero.addEventListener("pointerleave",()=>{
    hero.style.setProperty("--hero-x","0px");
    hero.style.setProperty("--hero-y","0px");
    hero.style.setProperty("--float-x","0px");
    hero.style.setProperty("--float-y","0px");
  },{passive:true});
}

function setupStickyCatalogue(){
  const bar=$("[data-sticky-catalogue]");
  if(!bar)return;
  let raf=0;
  const update=()=>{
    raf=0;
    bar.classList.toggle("is-stuck",bar.getBoundingClientRect().top<=112);
  };
  addEventListener("scroll",()=>{if(!raf)raf=requestAnimationFrame(update)},{passive:true});
  addEventListener("resize",update,{passive:true});
  update();
}

function animateAddToCart(source,p){
  const target=$("#cartButton");
  if(!source||!target)return;
  source.classList.add("is-added");
  setTimeout(()=>source.classList.remove("is-added"),650);
  target.classList.remove("cart-bump");
  void target.offsetWidth;
  target.classList.add("cart-bump");
  setTimeout(()=>target.classList.remove("cart-bump"),620);
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
  const fly=document.createElement("span");
  fly.className="cart-fly";
  fly.innerHTML="✦";
  fly.style.left=(a.left+a.width/2-14)+"px";
  fly.style.top=(a.top+a.height/2-14)+"px";
  fly.style.setProperty("--fly-x",(b.left+b.width/2-(a.left+a.width/2))+"px");
  fly.style.setProperty("--fly-y",(b.top+b.height/2-(a.top+a.height/2))+"px");
  fly.setAttribute("aria-hidden","true");
  document.body.appendChild(fly);
  requestAnimationFrame(()=>fly.classList.add("is-flying"));
  setTimeout(()=>fly.remove(),760);
}

function setupPerformance(){
  const hero=$("#heroShowcase");
  if(hero&&"IntersectionObserver" in window){
    new IntersectionObserver(entries=>{
      heroVisible=entries[0]?.isIntersecting??true;
      if(heroVisible)showScene(sceneIndex);
      else $$("[data-scene] video").forEach(v=>v.pause());
    },{threshold:.12}).observe(hero);
  }
  const homeVideo=$("#shopHeroVideo");
  if(homeVideo){
    const limited=shouldLimitHeroMedia();
    if(limited){
      homeVideo.autoplay=false;
      homeVideo.removeAttribute("autoplay");
      homeVideo.preload="none";
      homeVideo.pause();
    }
    if("IntersectionObserver" in window){
      new IntersectionObserver(entries=>{
        const visible=entries[0]?.isIntersecting??true;
        if(!visible||limited)homeVideo.pause();
        else if(!document.hidden){const play=homeVideo.play();if(play&&play.catch)play.catch(()=>{})}
      },{threshold:.08}).observe(homeVideo);
    }
  }
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){
      $$("[data-scene] video").forEach(v=>v.pause());
      if(homeVideo)homeVideo.pause();
    }else{
      if(heroVisible)showScene(sceneIndex);
      if(homeVideo&&!shouldLimitHeroMedia()){const play=homeVideo.play();if(play&&play.catch)play.catch(()=>{})}
    }
  });
}

function orderReference(prefix="ZW"){
  const d=new Date();
  const stamp=[String(d.getFullYear()).slice(-2),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0"),String(d.getHours()).padStart(2,"0"),String(d.getMinutes()).padStart(2,"0")].join("");
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes=new Uint8Array(4);
  if(window.crypto?.getRandomValues)window.crypto.getRandomValues(bytes);
  else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
  const suffix=[...bytes].map(n=>alphabet[n%alphabet.length]).join("");
  return `${prefix}-${stamp}-${suffix}`;
}
async function order(){
  const rows=cartRows();
  if(!rows.length)return;
  window.ZWM_CMS?.track?.("checkout_started",{source:"cart"});
  location.href="/checkout.html";
}
function openCart(){
  if(document.body.classList.contains("cart-open"))return;
  window.ZWM_CLOSE_NAV?.();
  closeProduct();
  document.body.classList.add("cart-open");
  backdropOn();
  $("#cartDrawer").classList.add("is-open");
  $("#cartDrawer").setAttribute("aria-hidden","false");
}
function closeCart(){
  document.body.classList.remove("cart-open");
  $("#cartDrawer").classList.remove("is-open");
  $("#cartDrawer").setAttribute("aria-hidden","true");
  backdropMaybeOff();
}
function backdropOn(){
  const b=$("#cartBackdrop");
  if(!b)return;
  b.hidden=false;
  requestAnimationFrame(()=>b.classList.add("is-visible"));
}
function backdropMaybeOff(){
  if(document.body.classList.contains("cart-open")||document.body.classList.contains("modal-open"))return;
  const b=$("#cartBackdrop");
  if(!b)return;
  b.classList.remove("is-visible");
  setTimeout(()=>{if(!document.body.classList.contains("cart-open")&&!document.body.classList.contains("modal-open"))b.hidden=true},310);
}

function shouldLimitHeroMedia(){
  const reducedMotion=Boolean(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const saveData=Boolean(navigator.connection&&navigator.connection.saveData);
  return reducedMotion||saveData;
}
let heroManualPlayback=false;
function showScene(i,manual=false){
  const scenes=$$("[data-scene]"),dots=$$("[data-scene-dot]");
  if(!scenes.length)return;
  const nextIndex=(i+scenes.length)%scenes.length;
  const changed=nextIndex!==sceneIndex;
  sceneIndex=nextIndex;
  if(manual)heroManualPlayback=true;
  const button=$("#scenePlayback");
  scenes.forEach((scene,n)=>{
    const activeNow=n===sceneIndex;
    scene.classList.toggle("is-active",activeNow);
    const video=scene.querySelector("video");
    if(!video)return;
    video.muted=true;
    video.defaultMuted=true;
    video.playsInline=true;
    video.preload=shouldLimitHeroMedia()&&!manual&&!heroManualPlayback?"none":"metadata";
    if(activeNow&&video.readyState===0){try{video.load()}catch{}}
    if(activeNow&&heroVisible&&!document.hidden&&(manual||heroManualPlayback||!shouldLimitHeroMedia())){
      if(changed||video.ended){try{video.currentTime=0}catch{}}
      const play=video.play();
      if(play&&play.catch)play.catch(()=>{if(n===sceneIndex&&button)button.hidden=false;});
    }else video.pause();
  });
  dots.forEach((dot,n)=>{
    dot.classList.toggle("is-active",n===sceneIndex);
    dot.setAttribute("aria-pressed",String(n===sceneIndex));
  });
}
function startScenes(){
  const button=$("#scenePlayback");
  if(button)button.addEventListener("click",()=>showScene(sceneIndex,true));
  $$("[data-scene]").forEach((scene,index)=>{
    const video=scene.querySelector("video");
    if(!video||video.dataset.sequenceBound==="1")return;
    video.dataset.sequenceBound="1";
    video.loop=false;
    video.preload=shouldLimitHeroMedia()?"none":"metadata";
    video.addEventListener("playing",()=>{if(index===sceneIndex&&button)button.hidden=true;});
    video.addEventListener("pause",()=>{if(index===sceneIndex&&button)button.hidden=false;});
    video.addEventListener("error",()=>{if(index===sceneIndex&&button)button.hidden=false;});
    video.addEventListener("ended",()=>{
      if(index===sceneIndex&&heroVisible&&!document.hidden)showScene(index+1);
    });
  });
}
function openLanguageWelcome(){
  const modal=$("#languageWelcome");
  if(!modal)return;
  if(safeStorageGet(WELCOME_KEY)==="1"){
    modal.hidden=true;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden","true");
    document.body.classList.remove("welcome-open");
    return;
  }
  modal.hidden=false;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("welcome-open");
  requestAnimationFrame(()=>{
    const firstChoice=modal.querySelector('[data-welcome-lang="en"]');
    if(firstChoice)firstChoice.focus({preventScroll:true});
  });
}
function chooseWelcomeLanguage(next,event){
  if(event){event.preventDefault?.();event.stopImmediatePropagation?.();}
  safeStorageSet(WELCOME_KEY,"1");
  const modal=$("#languageWelcome");

  if(modal){
    modal.querySelectorAll("[data-welcome-lang]").forEach(btn=>btn.classList.toggle("is-selected",btn.dataset.welcomeLang===next));
    modal.classList.add("is-choosing");
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden","true");
  }
  document.body.classList.remove("welcome-open");

  try{
    applyLanguage(next,{immediate:true});
  }catch(error){
    console.error("Language switch failed:",error);
    lang=next==="ar"?"ar":next==="fr"?"fr":"en";
    if(window.ZWM_LOCALE?.set)window.ZWM_LOCALE.set(lang);else safeStorageSet(LANG_KEY,lang==="ar"?"ar":"en");
    document.documentElement.lang=lang;
    document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  }finally{
    if(modal)setTimeout(()=>{modal.hidden=true;modal.classList.remove("is-choosing");modal.querySelectorAll("[data-welcome-lang]").forEach(btn=>btn.classList.remove("is-selected"))},220);
  }
}

function prewarmLanguageFonts(){
  if(!document.fonts)return;
  document.fonts.load('400 16px "Noto Kufi Arabic"').catch(()=>{});
  document.fonts.load('600 16px "Noto Kufi Arabic"').catch(()=>{});
  document.fonts.load('400 16px "Patrick Hand"').catch(()=>{});
}

function setupNav(){
  const t=$("#navToggle"),n=$("#navLinks");
  if(!t||!n)return;
  const compactQuery=window.matchMedia?window.matchMedia("(max-width:1080px)"):null;
  const isCompact=()=>compactQuery?compactQuery.matches:window.innerWidth<=1080;
  const runtimeOwnsMenu=()=>document.documentElement.dataset.zwmReliableMenuBound==="1";

  const keepCanonicalParent=()=>{
    const nav=document.querySelector(".site-header .nav");
    if(!nav)return;
    if(n.parentNode!==nav){
      const actions=nav.querySelector(".nav-actions");
      n.classList.remove("is-mobile-portal");
      nav.insertBefore(n,actions||null);
    }
  };
  const syncA11y=()=>{
    const open=n.classList.contains("is-open");
    if(isCompact())n.setAttribute("aria-hidden",open?"false":"true");
    else n.removeAttribute("aria-hidden");
  };
  const setOpen=open=>{
    keepCanonicalParent();
    n.classList.toggle("is-open",!!open);
    n.classList.remove("is-mobile-portal");
    document.body.classList.toggle("menu-open",!!open);
    t.setAttribute("aria-expanded",open?"true":"false");
    t.setAttribute("aria-label",open?(lang==="ar"?"إغلاق القائمة":"Close menu"):(lang==="ar"?"فتح القائمة":"Open menu"));
    syncA11y();
  };
  const close=()=>setOpen(false);
  const openMenu=()=>setOpen(true);

  // site-runtime-v9 owns the primary handler when it is available.
  // This direct handler is only a no-portal fallback if the shared runtime fails.
  t.addEventListener("click",e=>{
    if(runtimeOwnsMenu())return;
    e.preventDefault();
    e.stopPropagation();
    if(!acceptSingleTap(t,220))return;
    n.classList.contains("is-open")?close():openMenu();
  });
  if(typeof window.ZWM_CLOSE_NAV!=="function")window.ZWM_CLOSE_NAV=close;

  n.addEventListener("click",e=>{if(!runtimeOwnsMenu())e.stopPropagation()});
  document.querySelectorAll("#navLinks a").forEach(a=>a.addEventListener("click",()=>{if(!runtimeOwnsMenu())close()}));
  document.addEventListener("click",e=>{
    if(runtimeOwnsMenu())return;
    if(n.classList.contains("is-open")&&!e.target.closest("#navLinks,#navToggle"))close();
  });
  document.addEventListener("keydown",e=>{
    if(runtimeOwnsMenu()||e.key!=="Escape"||!n.classList.contains("is-open"))return;
    close();
    t.focus({preventScroll:true});
  });
  const onViewportChange=()=>{
    keepCanonicalParent();
    if(!isCompact()&&n.classList.contains("is-open"))close();
    else syncA11y();
  };
  if(compactQuery){
    if(typeof compactQuery.addEventListener==="function")compactQuery.addEventListener("change",onViewportChange);
    else if(typeof compactQuery.addListener==="function")compactQuery.addListener(onViewportChange);
  }
  keepCanonicalParent();
  syncA11y();
}

function setupProgress(){
  const progress=$("#pageProgress");
  if(!progress)return;
  const update=()=>{
    const d=document.documentElement,max=d.scrollHeight-innerHeight;
    progress.style.width=`${max?scrollY/max*100:0}%`;
  };
  update();
  addEventListener("scroll",update,{passive:true});
}

function toast(message,{cartAction=false}={}){
  const panel=$("#toast"),label=$("#toastText");
  if(!panel||!label)return;
  label.textContent=message;
  if(CURRENT_PAGE==="shop"){
    let action=panel.querySelector(".zwm-toast-cart-action");
    if(cartAction&&!action){
      action=document.createElement("button");
      action.type="button";
      action.className="zwm-toast-cart-action";
      action.addEventListener("click",()=>{
        panel.classList.remove("is-visible","zwm-cart-confirm-toast");
        action.hidden=true;
        openCart();
      });
      panel.appendChild(action);
    }
    if(action){
      action.hidden=!cartAction;
      action.textContent=lang==="ar"?"عرض السلة":lang==="fr"?"Voir le panier":"View cart";
    }
    panel.classList.toggle("zwm-cart-confirm-toast",cartAction);
  }
  panel.classList.add("is-visible");
  clearTimeout(toastTimer);
  const dismiss=()=>{
    panel.classList.remove("is-visible","zwm-cart-confirm-toast");
    const button=panel.querySelector(".zwm-toast-cart-action");
    if(button)button.hidden=true;
  };
  toastTimer=setTimeout(()=>{
    if(cartAction&&panel.contains(document.activeElement)){
      panel.addEventListener("focusout",()=>{if(!panel.contains(document.activeElement))dismiss()},{once:true});
      return;
    }
    dismiss();
  },cartAction?4800:1800);
}
function initials(name){
  const parts=String(name).replace(/[^\p{L}\p{N}\s]/gu,"").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0]||"Z")+(parts[1]?.[0]||parts[0]?.[1]||"W")).toUpperCase();
}
function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}
function cssEscape(value){
  if(window.CSS&&CSS.escape)return CSS.escape(value);
  return String(value).replace(/["\\]/g,"\\$&");
}

function init(){
  if(window.__ZWM_STOREFRONT_BOUND)return;
  window.__ZWM_STOREFRONT_BOUND=true;
  if($("#heroVariantCount"))$("#heroVariantCount").textContent=PRODUCTS_DATA.length;
  if($("#heroCategoryCount"))$("#heroCategoryCount").textContent=CATEGORY_ORDER.length;
  if($("#year"))$("#year").textContent=new Date().getFullYear();
  document.querySelectorAll("[data-footer-year]").forEach(el=>{el.textContent=new Date().getFullYear()});

  const params=new URLSearchParams(location.search);
  const requestedCategory=params.get("category");
  if(requestedCategory&&CATEGORY_ORDER.includes(requestedCategory))activeCategory=requestedCategory;
  const requestedQuery=params.get("q");
  if(requestedQuery){query=requestedQuery;if($("#productSearch"))$("#productSearch").value=requestedQuery;}
  const requestedProduct=params.get("product");
  applyLanguage(lang,{immediate:true});
  renderStaticProductPhotos();
  prewarmLanguageFonts();
  if($("#heroShowcase")){startScenes();showScene(0);}
  setupNav();
  setupProgress();
  setupPerformance();
  setupMotionReveals();
  setupCountUps();
  setupPointerGlow();
  setupHeroParallax();
  setupStickyCatalogue();
  if(requestedProduct&&productById(requestedProduct))openProduct(requestedProduct);

  if(CURRENT_PAGE==="shop"){
    const categories=$("#categories");
    if(categories)categories.addEventListener("click",e=>{
      const categoryTarget=e.target.closest("[data-cat]");
      if(categoryTarget){
        e.preventDefault();
        activateShopCategory(categoryTarget.dataset.cat);
        return;
      }
      const browse=e.target.closest("#browseAllProducts");
      if(browse){
        e.preventDefault();
        activateShopCategory("All");
        return;
      }
      const searchButton=e.target.closest("#focusProductSearch, #categorySearchShortcut");
      if(searchButton){
        e.preventDefault();
        const shopSection=$("#shop");
        if(shopSection)shopSection.scrollIntoView({behavior:"smooth",block:"start"});
        setTimeout(()=>{const input=$("#productSearch");if(input){input.focus();input.select();}},420);
      }
    });
  }

  if($("#productSearch")){
    $("#productSearch").addEventListener("input",e=>{query=e.target.value;if(query.trim())activeCategory="All";visibleLimit=catalogPageSize();renderCategorySelect();renderProducts();renderSearchSuggestions();syncCategoryQuickState();syncShopFilterUrl()});
    $("#productSearch").addEventListener("focus",renderSearchSuggestions);
    $("#productSearch").addEventListener("blur",()=>setTimeout(()=>{const b=$("#searchSuggestions");if(b)b.hidden=true},140));
  }
  if($("#categorySelect"))$("#categorySelect").addEventListener("change",e=>activateShopCategory(e.target.value,{scroll:false}));
  if($("#loadMore"))$("#loadMore").addEventListener("click",()=>{visibleLimit+=catalogPageSize();renderProducts()});
  if($("#clearSearch"))$("#clearSearch").addEventListener("click",()=>activateShopCategory("All",{scroll:false}));
  if($("#favoritesOnly"))$("#favoritesOnly").addEventListener("click",e=>{if(!acceptSingleTap(e.currentTarget,260))return;favoritesOnly=!favoritesOnly;visibleLimit=catalogPageSize();renderFavoritesCount();renderProducts()});
  if($("#clearRecent"))$("#clearRecent").addEventListener("click",()=>{recentViews=[];saveRecent();renderRecent()});

  document.addEventListener("click",e=>{const btn=e.target.closest("[data-lang]");if(!btn)return;if(btn.dataset.lang===lang)return;if(!acceptSingleTap(btn,220))return;applyLanguage(btn.dataset.lang)});
  window.__ZWM_LANGUAGE_SWITCH_BOUND=true;
  $$("[data-welcome-lang]").forEach(btn=>btn.addEventListener("click",e=>chooseWelcomeLanguage(btn.dataset.welcomeLang,e)));

  const helpSearch=$("[data-help-search]");
  if(helpSearch)helpSearch.addEventListener("click",e=>{e.preventDefault();const shop=$("#shop");if(shop)shop.scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>{const input=$("#productSearch");if(input){input.focus();input.select()}},420)});

  if($("#cartButton"))$("#cartButton").addEventListener("click",e=>{if(!acceptSingleTap(e.currentTarget,220))return;openCart()});
  if(params.get("open")==="cart"&&$("#cartDrawer")){
    try{const u=new URL(location.href);u.searchParams.delete("open");history.replaceState(history.state,document.title,u.pathname+(u.search||"")+u.hash)}catch{}
    setTimeout(openCart,0);
  }
  if($("#cartClose"))$("#cartClose").addEventListener("click",closeCart);
  if($("#cartBackdrop"))$("#cartBackdrop").addEventListener("click",()=>{closeCart();closeProduct()});
  if($("#cartBrowse"))$("#cartBrowse").addEventListener("click",()=>{closeCart();location.href="shop.html#shop"});
  if($("#orderForm"))$("#orderForm").addEventListener("submit",e=>{e.preventDefault();order()});
  if($("#giftForm"))$("#giftForm").addEventListener("submit",e=>{e.preventDefault();sendGiftOrder()});
  if($("#giftProductSearch"))$("#giftProductSearch").addEventListener("input",()=>{giftVisibleLimit=Number.POSITIVE_INFINITY;renderGiftPickerResults()});
  if($("#giftCategorySelect"))$("#giftCategorySelect").addEventListener("change",e=>{giftCategory=e.target.value;giftVisibleLimit=Number.POSITIVE_INFINITY;renderGiftPickerResults()});
  
  if($("#giftUseCart"))$("#giftUseCart").addEventListener("click",useCartForGift);
  if($("#giftClear"))$("#giftClear").addEventListener("click",()=>{giftItems={};saveGiftItems();renderGiftSummary();renderGiftPickerResults()});
  ["giftRecipient","giftMessage","giftSender","giftTheme","giftCardLanguage"].forEach(id=>{
    const el=$("#"+id);if(!el)return;
    el.addEventListener("input",updateGiftV4Preview);
    el.addEventListener("change",updateGiftV4Preview);
  });
  if($("#giftHidePrices"))$("#giftHidePrices").addEventListener("change",updateGiftV4Preview);
  if($("#mobileOrderBar"))$("#mobileOrderBar").addEventListener("click",e=>{if(!acceptSingleTap(e.currentTarget,220))return;openCart()});

  if($("#productModalClose"))$("#productModalClose").addEventListener("click",closeProduct);
  if($("#modalQtyMinus"))$("#modalQtyMinus").addEventListener("click",()=>{draftQty.modal=Math.max(1,qtyFor("modal")-1);$("#productModalQty").textContent=draftQty.modal});
  if($("#modalQtyPlus"))$("#modalQtyPlus").addEventListener("click",()=>{draftQty.modal=qtyFor("modal")+1;$("#productModalQty").textContent=draftQty.modal});
  if($("#productModalAdd"))$("#productModalAdd").addEventListener("click",e=>{const btn=e.currentTarget;if(!acceptSingleTap(btn,320))return;if(currentModalProduct&&currentModalVariant){if(currentModalVariant.quoteOnly){location.href=harvestQuoteUrl();return}addToCart(currentModalProduct,currentModalVariant,qtyFor("modal"));animateAddToCart(btn,currentModalProduct)}});
  if($("#modalFavorite"))$("#modalFavorite").addEventListener("click",e=>{if(!acceptSingleTap(e.currentTarget,300))return;if(currentModalProduct)toggleFavorite(currentModalProduct.id)});

  $$("[data-scene-dot]").forEach(btn=>btn.addEventListener("click",()=>showScene(Number(btn.dataset.sceneDot),true)));

  document.addEventListener("keydown",e=>{
    if(e.key==="Tab")trapQuickViewFocus(e);
    if(e.key==="Escape"){closeCart();closeProduct()}
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();if(CURRENT_PAGE==="shop"&&$("#productSearch")){$("#productSearch").focus();location.hash="shop"}else location.href="shop.html#shop"}
  });

  addEventListener("storage",e=>{
    if(e.key===CART_KEY){cart=loadCart();renderCart()}
    if(e.key===LANG_KEY||e.key==="zwm-locale-v3"){applyLanguage(window.ZWM_LOCALE?.get?.()||(e.newValue==="ar"?"ar":e.newValue==="fr"?"fr":"en"),{immediate:true})}
    if(e.key===FAV_KEY){favorites=loadFavorites();renderProducts();renderRecent();renderFavoritesCount()}
    if(e.key===GIFT_KEY){giftItems=loadGiftItems();renderGiftSummary();renderGiftPickerResults()}
  });

  renderRecent();
  renderGiftSummary();
  renderFavoritesCount();
  renderMobileOrderBar();
  updateGiftV4Preview();
  openLanguageWelcome();
}

function syncLiveCatalogFromCache(){
  applyCachedOwnerCatalog();
  refreshCatalogDerivedData();
  cart=loadCart();
  giftItems=loadGiftItems();
  recentViews=recentViews.filter(id=>productById(id));
  favorites=new Set([...favorites].filter(id=>productById(id)));
  if($("#heroVariantCount"))$("#heroVariantCount").textContent=PRODUCTS_DATA.length;
  renderCategories();
  renderCategorySelect();
  renderProducts();
  renderCart();
  renderFeaturedProducts();
  renderGiftSummary();
  renderGiftPickerResults();
  renderRecent();
  renderFavoritesCount();
  renderSearchSuggestions();
  if(currentModalProduct){
    const live=productById(currentModalProduct.id);
    if(live)renderModal(live.id,currentModalVariant?.id);else closeProduct();
  }
}
window.addEventListener("zwm:catalog-cache-updated",syncLiveCatalogFromCache);

window.chooseWelcomeLanguage=chooseWelcomeLanguage;
window.applyLanguage=applyLanguage;
window.applyPageMetadata=applyPageMetadata;
/* Isolated seasonal merchandising API. Uses the normal validated storefront cart.
   It never creates variants, invents prices, or writes cart storage directly. */
window.ZWM_HARVEST_CART={
  offer(productId,variantId){
    const p=productById(productId);
    const v=p?.variants?.find(row=>row.id===variantId);
    if(!p||!v||!Number.isFinite(Number(v.price))||Number(v.price)<0)return null;
    return {price:Number(v.price),available:productCanOrder(p),currency:"USD",sizeEn:v.sizeEn||""};
  },
  add(productId,variantId){
    const p=productById(productId);
    const v=p?.variants?.find(row=>row.id===variantId);
    if(!p||!v||!productCanOrder(p)||!Number.isFinite(Number(v.price))||Number(v.price)<0)return false;
    const key=cartKey(p.id,v.id);
    addToCart(p,v,(cart[key]?.qty||0)+1);
    return true;
  }
};

document.addEventListener("DOMContentLoaded",init);

/* Load exactly one owner CMS/analytics bridge without delaying the storefront.
   Current pages ship site-runtime-v7 directly; this is only a safe fallback. */
(()=>{if(document.querySelector('script[data-zwm-site-runtime],script[src*="site-runtime-v7.js"]'))return;const s=document.createElement("script");s.src="site-runtime-v7.js?v=20261004-shell3";s.async=true;s.dataset.zwmSiteRuntime="1";document.head.appendChild(s);})();
