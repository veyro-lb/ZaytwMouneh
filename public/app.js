
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
function uiIcon(name,active=false){
  if(name==="heart")return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5S4 16 2.6 10.8C1.7 7.5 3.8 4.5 7 4.5c2 0 3.6 1 5 2.7 1.4-1.7 3-2.7 5-2.7 3.2 0 5.3 3 4.4 6.3C20 16 12 20.5 12 20.5Z" ${active?'fill="currentColor"':'fill="none"'} stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
  if(name==="eye")return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-5.6 9.5-5.6S21.5 12 21.5 12 18.1 17.6 12 17.6 2.5 12 2.5 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
  return "";
}
function productPhotoMarkup(p,cls="product-image"){
  const source=window.ZWM_PRODUCT_PHOTOS?.sourceFor(p.id);
  if(!source)return "";
  const posX=Math.max(0,Math.min(100,Number(source.positionX??50)));
  const posY=Math.max(0,Math.min(100,Number(source.positionY??50)));
  const zoom=Math.max(100,Math.min(180,Number(source.zoom??100)));
  const framingStyle=`--zwm-photo-position:${posX}% ${posY}%;--zwm-photo-scale:${zoom/100};`;
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
function productVisualMarkup(p,cls="product-image"){
  const photo=productPhotoMarkup(p,cls);
  if(photo)return photo;
  return productPlaceholderMarkup(p,cls);
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
const WA="96181581230";
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
    en:["Date-based pantry products with natural sweetness and a soft, dense texture.","Use in fillings, desserts, energy bites or as a naturally sweet ingredient."],
    ar:["منتجات من التمر بطعم حلو طبيعي وقوام غني.","تُستخدم في الحشوات والحلويات ولقيمات الطاقة أو كمكوّن للتحلية."]
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
    en:["Fruits and pantry ingredients preserved by drying for concentrated flavour and longer keeping.","Snack on them or add them to breakfast, baking, desserts and savoury dishes."],
    ar:["فواكه ومكونات مونة محفوظة بالتجفيف لنكهة مركزة وحفظ أطول.","تُؤكل كوجبة خفيفة أو تُضاف إلى الفطور والخبز والحلويات والأطباق المالحة."]
  },
  "Flour":{
    en:["Milled grain or nut flour used as a base ingredient in baking and cooking.","Use for dough, bread, batters, pastries and recipes suited to each flour."],
    ar:["طحين من الحبوب أو المكسرات يُستخدم أساساً في الخَبز والطبخ.","يُستخدم للعجين والخبز والمعجنات والوصفات المناسبة لكل نوع."]
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
    en:["Honey and bee-derived pantry products with naturally rich flavour.","Serve at breakfast, stir into drinks, pair with cheese or use in desserts and dressings."],
    ar:["عسل ومنتجات من خلية النحل بنكهة طبيعية غنية.","يُقدّم مع الفطور أو المشروبات والجبنة أو في الحلويات والتتبيلات."]
  },
  "Molasses":{
    en:["Concentrated fruit molasses with deep sweet-tart flavour.","Use in dressings, marinades, sauces and classic Lebanese sweet-sour pairings."],
    ar:["دبس فاكهة مركز بطعم غني يجمع الحلاوة والحموضة.","يُستخدم في التتبيلات والصلصات والماريناد والوصفات اللبنانية الحلوة الحامضة."]
  },
  "Mouneh":{
    en:["Traditional preserved pantry foods prepared to carry seasonal ingredients through the year.","Serve at breakfast or mezze, spread, cook with or add to home-style meals depending on the item."],
    ar:["أصناف مونة تقليدية تحفظ خيرات الموسم طوال السنة.","تُقدّم على الفطور أو المازة أو تُستخدم في الطبخ بحسب الصنف."]
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
    en:["Extra virgin olive oil — a central ingredient of the Lebanese pantry.","Drizzle, dress, dip, marinate or cook with it."],
    ar:["زيت زيتون بكر ممتاز، من أساسيات المونة اللبنانية.","يُستخدم للتغميس والتتبيل والماريناد والطبخ."]
  },
  "Olives":{
    en:["Green or black olives prepared for the table.","Serve with breakfast, mezze, cheeses, salads and shared platters."],
    ar:["زيتون أخضر أو أسود محضّر للمائدة.","يُقدّم مع الفطور والمازة والأجبان والسلطات."]
  },
  "Pickles":{
    en:["Vegetables preserved in brine for acidity, crunch and long keeping.","Serve beside sandwiches, grilled foods, mezze and hearty meals."],
    ar:["خضار محفوظة بالمحلول الملحي لطعم حامض وقوام مقرمش.","تُقدّم مع السندويشات والمشاوي والمازة والوجبات الدسمة."]
  },
  "Pulses":{
    en:["Dried legumes such as lentils, beans, chickpeas and lupini beans.","Cook in soups, stews, salads, dips and traditional home dishes."],
    ar:["بقوليات مجففة مثل العدس والفاصوليا والحمص والترمس.","تُطبخ في الحساء واليخنات والسلطات والغموس والأطباق البيتية."]
  },
  "Soap":{
    en:["Traditional-inspired soap from the shop’s care collection.","Use for everyday washing according to the soap type and your preference."],
    ar:["صابون من مجموعة العناية بطابع تقليدي.","يُستخدم للتنظيف اليومي بحسب نوع الصابون وتفضيلك."]
  },
  "Spices":{
    en:["Whole, ground or blended spices for building aroma and flavour.","Season rice, meat, chicken, fish, vegetables, marinades and traditional dishes."],
    ar:["بهارات كاملة أو مطحونة أو خلطات لإضافة النكهة والرائحة.","تُستخدم مع الأرز واللحوم والدجاج والسمك والخضار والماريناد."]
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
    announcementOrder:"Order on WhatsApp",
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
    aboutEyebrow:"Our story & mission",
    aboutTitle:'More than a shelf.<br><em>Memory kept within reach.</em>',
    aboutLetterKicker:"A note from our pantry",
    aboutP1:"Since 2006, Zayt w Mouneh has kept the Lebanese pantry close to everyday life: grains, herbs, mouneh, honey, oil, spices and the ingredients that make a table feel familiar.",
    aboutP2:"Most of our pantry selection comes from the Bekaa. Our olive oil comes from Koura, our honey from Mount Lebanon, and our debes from the Chouf. We present that provenance plainly, without making claims we cannot verify.",
    value1Title:"Origin",value1Copy:"Respect where ingredients come from.",
    value2Title:"Craft",value2Copy:"Preserve the patience behind pantry traditions.",
    value3Title:"Care",value3Copy:"Make every choice clear, useful and welcoming.",
    signKicker:"Zayt w Mouneh · since 2006",signTitle:"A pantry worth<br>coming back to.",signCopy:"Old-market warmth, modern clarity, and Lebanese pantry character — all in one place.",signCta:"Enter the pantry <b>↘</b>",
    shopEyebrow:"Current product catalogue",shopTitle:'Names, sizes and<br><em>prices — clearly.</em>',shopNote:"Choose a category, search a product, select the exact pack size, then add it to your pantry list. Prices below come from the supplied retail price list.",
    searchPlaceholder:"Search zaatar, lentils, honey, grains, spices…",categorySelectLabel:"Category",resultLabel:"products",
    emptyTitle:"Nothing found.",emptyCopy:"Try a different spelling or another category.",clearFilters:"Clear filters",loadMore:"Load more products",
    orderEyebrow:"Simple ordering",orderTitle:'From shelf to<br><em>WhatsApp.</em>',orderIntroCopy:"No complicated checkout. Build your pantry list here, then send one clear message.",
    step1Title:"Choose",step1Copy:"Open a product and pick the exact size you want.",
    step2Title:"Review",step2Copy:"Check quantities, prices and your estimated total.",
    step3Title:"Send",step3Copy:"WhatsApp opens with your complete order ready to review.",
    contactEyebrow:"Contact & orders",contactTitle:'Bring the pantry <em>home.</em>',contactCopy:"Questions, availability, delivery or a custom pantry list — reach us directly.",
    phone:"Phone",whatsapp:"WhatsApp",instagram:"Instagram",location:"Location",lebanon:"Lebanon",
    footerCopy:"A pantry of Lebanese memory, curated with care.",footerCatalogue:"Catalogue",footerAbout:"About",
    cartEyebrow:"Your pantry list",cartTitle:"My pantry",cartSaved:"Saved on this device",cartEmptyTitle:"Your pantry is empty.",cartEmptyCopy:"Add products from the catalogue and they’ll appear here.",browseProducts:"Browse products",
    total:"Estimated total",orderDetailsTitle:"Order details",orderDetailsNote:"Sent only when you press WhatsApp",
    yourName:"Your name",namePlaceholder:"Name",area:"Area / location",areaPlaceholder:"e.g. Baabda",notes:"Order notes",notesPlaceholder:"Delivery notes, substitutions, anything we should know…",
    sendOrder:"Send order on WhatsApp <span>↗</span>",priceNote:"Prices are shown from the supplied retail list; final availability is confirmed on WhatsApp.",
    what:"What it is",use:"Use it for",nutritionLabel:"Nutrition note",nutritionBadge:"Nutritious choice",chooseSize:"Choose size",add:"Add to pantry",update:"Update pantry",view:"View",from:"From",sizeOptions:"size options",
    remove:"Remove",details:"View details",qty:"Qty",unitPrice:"Unit",subtotal:"Subtotal",
    standard:"Standard",added:"Added to cart",updated:"Cart updated",removed:"Removed",
    categoryAll:"All categories",
    cartProducts:(n)=>`${n} ${n===1?"product":"products"}`,
    cartItems:(n)=>`${n} ${n===1?"item":"items"}`,
    orderHello:"Hello Zayt w Mouneh 👋",
    orderIntro:"I would like to place an order:",
    customer:"Name",orderArea:"Area / location",orderNotes:"Notes",orderTotal:"Estimated total",
    orderConfirm:"Please confirm availability and the final order total. Thank you!"
  },
  ar:{
    skipLink:"الانتقال إلى المنتجات",
    announcementText:"مونة لبنانية أصيلة · منذ 2006",
    announcementOrder:"اطلب عبر واتساب",
    brand:"زيت ومونة",
    navHome:"الرئيسية",navShop:"المتجر",navCategories:"الأقسام",navAbout:"قصتنا",navContact:"تواصل",
    cartLabel:"السلة",
    heroEyebrow:"متجذّرون في التراث اللبناني",
    heroTitle:'مونة تحفظ<br><em>ذاكرة لبنان.</em>',
    heroLede:"أساسيات مونة لبنانية أصيلة مختارة بعناية، مع توصيل إلى مختلف المناطق في لبنان.",
    heroExplore:"تسوّق المونة <span>↙</span>",
    heroWhatsApp:"أرسل هدية",
    heroVariantLabel:"خياراً مسعّراً",heroCategoryLabel:"قسماً",heroSinceLabel:"منذ",
    scene1Kicker:"من المونة · 01",scene1Title:"عسل ينساب ببطء.",scene1Copy:"تفصيل واحد من مونة أوسع تضم الحبوب والأعشاب والزيوت والمخللات والمزيد.",
    scene2Kicker:"من المونة · 02",scene2Title:"عدس وحبوب للبيت.",scene2Copy:"مكونات يومية دافئة ومفيدة للطبخ الحقيقي في البيت.",
    scene3Kicker:"من المونة · 03",scene3Title:"قمح وموسم وحصاد.",scene3Copy:"صورة هادئة عن الأرض والمواسم والموائد التي تعيش فيها المونة.",
    heroScript:"مختارة بعناية",
    categoriesEyebrow:"تسوّق حسب القسم",
    categoriesTitle:"ماذا تبحث عنه؟",
    categoriesCopy:"اختر قسماً من المونة أدناه، أو ابحث في كامل المنتجات إذا كنت تعرف ما تحتاجه.",
    aboutEyebrow:"قصتنا ورسالتنا",
    aboutTitle:'أكثر من رفّ.<br><em>ذاكرة تبقى في متناول اليد.</em>',
    aboutLetterKicker:"رسالة من مونة البيت",
    aboutP1:"منذ 2006، تحافظ زيت ومونة على أساسيات المونة اللبنانية قريبة من الحياة اليومية: الحبوب والأعشاب والمونة والعسل والزيت والبهارات وكل ما يجعل المائدة مألوفة.",
    aboutP2:"معظم منتجات المونة لدينا من البقاع. زيت الزيتون من الكورة، والعسل من جبل لبنان، والدبس من الشوف. نعرض هذه المعلومات بوضوح ومن دون ادعاءات لا نستطيع التحقق منها.",
    value1Title:"المصدر",value1Copy:"نحترم أصل المكونات ومن أين تأتي.",
    value2Title:"الحرفة",value2Copy:"نحافظ على الصبر والخبرة خلف تقاليد المونة.",
    value3Title:"العناية",value3Copy:"نجعل كل اختيار واضحاً ومفيداً ومرحّباً.",
    signKicker:"زيت ومونة · منذ 2006",signTitle:"مونة تستحق<br>أن تعود إليها.",signCopy:"دفء السوق القديم، وضوح عصري، وروح المونة اللبنانية في مكان واحد.",signCta:"ادخل إلى المونة <b>↙</b>",
    shopEyebrow:"لائحة المنتجات الحالية",shopTitle:'الأسماء والأحجام<br><em>والأسعار بوضوح.</em>',shopNote:"اختر القسم وابحث عن المنتج وحدّد الحجم المطلوب ثم أضفه إلى لائحة المونة. الأسعار أدناه مأخوذة من لائحة أسعار البيع المرفقة.",
    searchPlaceholder:"ابحث عن زعتر، عدس، عسل، حبوب، بهارات…",categorySelectLabel:"القسم",resultLabel:"منتج",
    emptyTitle:"لا توجد نتائج.",emptyCopy:"جرّب اسماً آخر أو قسماً مختلفاً.",clearFilters:"إلغاء الفلاتر",loadMore:"عرض المزيد",
    orderEyebrow:"طلب بسيط",orderTitle:'من الرفّ إلى<br><em>واتساب.</em>',orderIntroCopy:"من دون خطوات معقّدة. جهّز لائحة المونة هنا ثم أرسلها برسالة واحدة واضحة.",
    step1Title:"اختر",step1Copy:"افتح المنتج وحدّد الحجم الذي تريده.",
    step2Title:"راجع",step2Copy:"تأكد من الكميات والأسعار والمجموع التقديري.",
    step3Title:"أرسل",step3Copy:"يفتح واتساب مع الطلب كاملاً وجاهزاً للمراجعة.",
    contactEyebrow:"التواصل والطلبات",contactTitle:'خذ المونة <em>إلى البيت.</em>',contactCopy:"للاستفسار عن التوفر أو التوصيل أو تجهيز لائحة خاصة، تواصل معنا مباشرة.",
    phone:"الهاتف",whatsapp:"واتساب",instagram:"إنستغرام",location:"الموقع",lebanon:"لبنان",
    footerCopy:"مونة من ذاكرة لبنان، مختارة بعناية.",footerCatalogue:"المنتجات",footerAbout:"من نحن",
    cartEyebrow:"لائحة المونة",cartTitle:"السلة",cartSaved:"محفوظة على هذا الجهاز",cartEmptyTitle:"السلة فارغة.",cartEmptyCopy:"أضف منتجات من المتجر وستظهر هنا.",browseProducts:"تصفّح المنتجات",
    total:"المجموع التقديري",orderDetailsTitle:"تفاصيل الطلب",orderDetailsNote:"لا تُرسل إلا عند الضغط على واتساب",
    yourName:"الاسم",namePlaceholder:"اسمك",area:"المنطقة / الموقع",areaPlaceholder:"مثلاً بعبدا",notes:"ملاحظات الطلب",notesPlaceholder:"ملاحظات التوصيل أو الاستبدال أو أي تفاصيل إضافية…",
    sendOrder:"إرسال الطلب عبر واتساب <span>↗</span>",priceNote:"الأسعار مأخوذة من لائحة البيع المرفقة؛ يتم تأكيد التوفر والمجموع النهائي عبر واتساب.",
    what:"ما هو",use:"كيف يُستخدم",nutritionLabel:"ملاحظة غذائية",nutritionBadge:"خيار مُغذٍ",chooseSize:"اختر الحجم",add:"أضف إلى السلة",update:"حدّث السلة",view:"عرض",from:"ابتداءً من",sizeOptions:"خيارات أحجام",
    remove:"حذف",details:"عرض التفاصيل",qty:"الكمية",unitPrice:"السعر",subtotal:"المجموع",
    standard:"قياس واحد",added:"تمت الإضافة إلى السلة",updated:"تم تحديث السلة",removed:"تم الحذف",
    categoryAll:"كل الأقسام",
    cartProducts:(n)=>`${n} ${n===1?"منتج":"منتجات"}`,
    cartItems:(n)=>`${n} ${n===1?"قطعة":"قطع"}`,
    orderHello:"مرحباً زيت ومونة 👋",
    orderIntro:"أرغب في طلب:",
    customer:"الاسم",orderArea:"المنطقة / الموقع",orderNotes:"الملاحظات",orderTotal:"المجموع التقديري",
    orderConfirm:"يرجى تأكيد التوفر والمجموع النهائي للطلب. شكراً!"
  }
};

const EXTRA_UI={
  en:{
    navGift:"Make a gift",menuLabel:"Menu",menuHeading:"Explore Zayt w Mouneh",menuSubheading:"Everything has its own place.",menuLocation:"Sebline · Directions",
    trustEyebrow:"Why shop with us",trustTitle:"Old pantry values. Clear modern service.",
    trustSinceTitle:"Since 2006",trustSinceCopy:"A long-running Lebanese pantry built around mouneh, everyday staples and careful selection.",
    trustDeliveryTitle:"Delivery all over Lebanon",trustDeliveryCopy:"We deliver across Lebanon. Availability, timing and delivery details are confirmed directly on WhatsApp.",
    trustPriceTitle:"Clear sizes & prices",trustPriceCopy:"Choose the exact listed pack size and see the retail price before sending your order.",
    trustWhatsAppTitle:"Direct WhatsApp ordering",trustWhatsAppCopy:"Your full pantry list, quantities and estimated total are prepared into one clear message.",
    favorites:"Saved",favorite:"Save",favorited:"Saved",favoritesEmpty:"You have no saved products yet.",
    recentEyebrow:"Recently viewed",recentTitle:"Pick up where you left off.",clearRecent:"Clear",
    giftEyebrow:"Make a gift",giftTitle:"Build a pantry gift, your way.",
    giftCopy:"Choose anything from the shop, then turn your current pantry list into a packed gift for someone. Add the recipient, occasion and a message; we’ll confirm presentation, availability and delivery on WhatsApp.",
    giftPerk1:"Choose any products",giftPerk2:"Packed as a gift",giftPerk3:"Delivery across Lebanon",
    giftBrowse:"Browse the shop ↗",giftBuilderLabel:"Your gift basket",giftEmpty:"Choose products above and they’ll appear here.",giftProductsLabel:"Choose what goes inside",giftProductsHint:"Search or browse the full catalogue and add any product directly to this gift.",giftProductPlaceholder:"Search any product for the gift…",giftUseCart:"Add my cart items",giftSelectedTitle:"Inside the gift",giftClear:"Clear",giftAdd:"Add",giftRemove:"Remove",giftAllCategories:"All categories",giftMore:"Show more products",
    giftRecipient:"Recipient name",giftRecipientPlaceholder:"Who is the gift for?",giftOccasion:"Occasion",giftPackaging:"Packing style",giftArea:"Delivery area",giftAreaPlaceholder:"Area in Lebanon",
    giftMessage:"Gift message",giftMessagePlaceholder:"Write a short note for the recipient…",giftSender:"Your name",giftSenderPlaceholder:"Your name",
    giftSend:"Send gift request on WhatsApp ↗",giftNote:"Gift packing, final availability and delivery details are confirmed on WhatsApp before the order is final.",
    giftOccasions:["Birthday","Thank you","Visit / hosting","Holiday","Just because","Other"],
    giftPackings:["Classic pantry gift","Celebration gift","Custom arrangement"],
    giftNeedItems:"Choose at least one product for the gift first.",
    socialEyebrow:"From our pantry",socialTitle:"See what’s happening at the shop.",socialCopy:"Follow Zayt w Mouneh for pantry ideas, shop updates and everyday mouneh inspiration.",
    footerDelivery:"Delivery all over Lebanon · Orders confirmed on WhatsApp",footerExploreTitle:"Explore",footerGift:"Make a gift",footerContactTitle:"Contact",
    mobileReview:"Review & WhatsApp",
    related:"You may also like",
    badgeMulti:"Multiple sizes",badgeTraditional:"Traditional mouneh",badgeClassic:"Lebanese classic",badgeBaking:"Baking staple",badgeBreakfast:"Breakfast pantry",
    contactCopy:"Questions, availability, gift orders or delivery anywhere in Lebanon — reach us directly.",locationValue:"JC9Q+Q7X · Sebline, Lebanon",contactHoursLabel:"Opening hours",contactHoursValue:"Mon–Sat 9:00–20:00 · Sun 12:00–20:00",footerLocation:"Sebline · Get directions",
    searchNoSuggestions:"No close matches yet"
  },
  ar:{
    navGift:"حضّر هدية",menuLabel:"القائمة",menuHeading:"استكشف زيت ومونة",menuSubheading:"كل شيء في مكانه.",menuLocation:"سبلين · الاتجاهات",
    trustEyebrow:"لماذا زيت ومونة",trustTitle:"قيم المونة القديمة. خدمة واضحة وعصرية.",
    trustSinceTitle:"منذ 2006",trustSinceCopy:"مونة لبنانية عريقة تجمع أساسيات البيت والأصناف التقليدية والاختيار بعناية.",
    trustDeliveryTitle:"توصيل إلى كل لبنان",trustDeliveryCopy:"نوصّل إلى جميع المناطق في لبنان. يتم تأكيد التوفر والوقت وتفاصيل التوصيل مباشرة عبر واتساب.",
    trustPriceTitle:"أحجام وأسعار واضحة",trustPriceCopy:"اختر الحجم المدرج وشاهد سعر البيع قبل إرسال الطلب.",
    trustWhatsAppTitle:"طلب مباشر عبر واتساب",trustWhatsAppCopy:"نجهّز لائحة المونة كاملة مع الكميات والمجموع التقديري في رسالة واضحة واحدة.",
    favorites:"المحفوظات",favorite:"حفظ",favorited:"محفوظ",favoritesEmpty:"لا توجد منتجات محفوظة بعد.",
    recentEyebrow:"شوهدت مؤخراً",recentTitle:"تابع من حيث توقفت.",clearRecent:"مسح",
    giftEyebrow:"حضّر هدية",giftTitle:"حضّر هدية مونة على ذوقك.",
    giftCopy:"اختر أي منتجات من المتجر، ثم حوّل لائحة المونة الحالية إلى هدية مغلّفة لشخص تحبه. أضف اسم المستلم والمناسبة والرسالة، ونؤكد التغليف والتوفر والتوصيل عبر واتساب.",
    giftPerk1:"اختر أي منتجات",giftPerk2:"تغليف كهدية",giftPerk3:"توصيل إلى كل لبنان",
    giftBrowse:"تصفّح المتجر ↗",giftBuilderLabel:"سلة الهدية",giftEmpty:"اختر المنتجات أعلاه وستظهر هنا.",giftProductsLabel:"اختر ما تريد داخل الهدية",giftProductsHint:"ابحث أو تصفّح كامل المنتجات وأضف أي صنف مباشرة إلى الهدية.",giftProductPlaceholder:"ابحث عن أي منتج للهدية…",giftUseCart:"أضف منتجات سلتي",giftSelectedTitle:"داخل الهدية",giftClear:"مسح",giftAdd:"أضف",giftRemove:"حذف",giftAllCategories:"كل الأقسام",giftMore:"عرض المزيد",
    giftRecipient:"اسم المستلم",giftRecipientPlaceholder:"لمن الهدية؟",giftOccasion:"المناسبة",giftPackaging:"طريقة التغليف",giftArea:"منطقة التوصيل",giftAreaPlaceholder:"أي منطقة في لبنان",
    giftMessage:"رسالة الهدية",giftMessagePlaceholder:"اكتب رسالة قصيرة للمستلم…",giftSender:"اسمك",giftSenderPlaceholder:"اسمك",
    giftSend:"إرسال طلب الهدية عبر واتساب ↗",giftNote:"يتم تأكيد التغليف والتوفر وتفاصيل التوصيل عبر واتساب قبل تثبيت الطلب.",
    giftOccasions:["عيد ميلاد","شكر","زيارة / ضيافة","مناسبة أو عيد","من دون مناسبة","أخرى"],
    giftPackings:["هدية مونة كلاسيكية","تغليف احتفالي","تنسيق مخصص"],
    giftNeedItems:"اختر منتجاً واحداً على الأقل للهدية أولاً.",
    socialEyebrow:"من مونة المحل",socialTitle:"تابع أخبار المونة والمتجر.",socialCopy:"تابع زيت ومونة على إنستغرام لأفكار المونة وتحديثات المحل وإلهام يومي.",
    footerDelivery:"توصيل إلى كل لبنان · تأكيد الطلب عبر واتساب",footerExploreTitle:"استكشف",footerGift:"حضّر هدية",footerContactTitle:"تواصل",
    mobileReview:"راجع واطلب عبر واتساب",
    related:"قد يعجبك أيضاً",
    badgeMulti:"عدة أحجام",badgeTraditional:"مونة تقليدية",badgeClassic:"كلاسيكي لبناني",badgeBaking:"أساسي للخَبز",badgeBreakfast:"من مونة الفطور",
    contactCopy:"للاستفسار عن التوفر أو الهدايا أو التوصيل إلى أي منطقة في لبنان، تواصل معنا مباشرة.",locationValue:"JC9Q+Q7X · سبلين، لبنان",contactHoursLabel:"ساعات العمل",contactHoursValue:"الإثنين–السبت 9:00–20:00 · الأحد 12:00–20:00",footerLocation:"سبلين · الاتجاهات",
    searchNoSuggestions:"لا توجد نتائج قريبة بعد"
  }
};

const PAGE_I18N={
  home:{
    en:{title:"Zayt w Mouneh | Lebanese Pantry & Mouneh",description:"Authentic Lebanese pantry essentials, mouneh and gifts since 2006, with clear prices and delivery across Lebanon.",skip:"Skip to catalogue"},
    ar:{title:"زيت ومونة | مونة لبنانية أصيلة",description:"مونة لبنانية أصيلة وهدايا منذ 2006، مع أسعار واضحة وتوصيل إلى مختلف المناطق في لبنان.",skip:"الانتقال إلى المنتجات"}
  },
  shop:{
    en:{title:"Shop Lebanese Pantry Essentials | Zayt w Mouneh",description:"Browse 300+ Lebanese pantry products with clear sizes and prices, origin information, favourites and direct WhatsApp ordering.",skip:"Skip to catalogue"},
    ar:{title:"تسوّق المونة اللبنانية | زيت ومونة",description:"تصفّح أكثر من 300 منتج من المونة اللبنانية مع أحجام وأسعار واضحة ومعلومات المصدر والطلب المباشر عبر واتساب.",skip:"الانتقال إلى المنتجات"}
  },
  about:{
    en:{title:"Our Story & Provenance | Zayt w Mouneh",description:"Learn about Zayt w Mouneh since 2006 and the origins behind the pantry: Bekaa, Koura, Mount Lebanon and Chouf.",skip:"Skip to our story"},
    ar:{title:"قصتنا ومصادر المونة | زيت ومونة",description:"تعرّف إلى قصة زيت ومونة منذ 2006 وإلى مصادر المونة من البقاع والكورة وجبل لبنان والشوف.",skip:"الانتقال إلى قصتنا"}
  },
  contact:{
    en:{title:"Contact, Delivery & Visit | Zayt w Mouneh",description:"Contact Zayt w Mouneh in Sebline, order on WhatsApp, and understand delivery and ordering across Lebanon.",skip:"Skip to contact"},
    ar:{title:"التواصل والتوصيل والزيارة | زيت ومونة",description:"تواصل مع زيت ومونة في سبلين، اطلب عبر واتساب، وتعرّف إلى تفاصيل التوصيل والطلب في لبنان.",skip:"الانتقال إلى التواصل"}
  },
  gift:{
    en:{title:"Lebanese Pantry Gifts | Zayt w Mouneh",description:"Choose a ready-made Lebanese pantry gift or build your own from the catalogue, with delivery across Lebanon.",skip:"Skip to gift builder"},
    ar:{title:"هدايا من المونة اللبنانية | زيت ومونة",description:"اختر هدية جاهزة من المونة اللبنانية أو حضّر هديتك من كامل المنتجات مع توصيل إلى مختلف المناطق في لبنان.",skip:"الانتقال إلى تجهيز الهدية"}
  },
  recipes:{
    en:{title:"Lebanese Pantry Recipes | Zayt w Mouneh",description:"Lebanese pantry recipe ideas from Zayt w Mouneh — build mujadara, manoushe, fattoush and other pantry bundles from the current catalogue.",skip:"Skip to recipes"},
    ar:{title:"وصفات من المونة اللبنانية | زيت ومونة",description:"أفكار وصفات لبنانية من زيت ومونة، مع مكونات المونة للمجدّرة والمنقوشة والفتوش وغيرها من كامل المنتجات الحالية.",skip:"الانتقال إلى الوصفات"}
  }
};

let lang=safeStorageGet(LANG_KEY)==="ar"?"ar":"en";
let activeCategory="All";
let query="";
let visibleLimit=catalogPageSize();
let cart=loadCart();
let draftQty={};
let cardVariant={};
let currentModalProduct=null;
let currentModalVariant=null;
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

/* Owner dashboard product overrides: apply the last verified public cache before catalogue stats/rendering. */
(function applyCachedOwnerCatalog(){
  try{
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
            quality:"owner-dashboard"
          };
        }
      }
    });
    for(let i=PRODUCTS_DATA.length-1;i>=0;i--)if(hidden.has(PRODUCTS_DATA[i]?.id))PRODUCTS_DATA.splice(i,1);
  }catch(error){console.warn("Owner catalogue cache ignored:",error);}
})();

const CATEGORY_COUNTS=Object.fromEntries(CATEGORY_ORDER.map(cat=>[cat,PRODUCTS_DATA.filter(p=>p.category===cat).length]));
const DISPLAY_NAME_COUNTS=PRODUCTS_DATA.reduce((acc,p)=>{
  const key=String(p.nameEn||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  acc[key]=(acc[key]||0)+1;
  return acc;
},{});
function repeatedListingNote(p){
  const key=String(p.nameEn||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  return DISPLAY_NAME_COUNTS[key]>1?(p.original||""):"";
}
const TOTAL_VARIANTS=PRODUCTS_DATA.reduce((sum,p)=>sum+p.variants.length,0);

function money(n){return `$${Number(n).toFixed(2)}`}
function currentName(p){return lang==="ar"?plainArabic(p.nameAr):p.nameEn}
function categoryName(cat){return lang==="ar"?(CATEGORY_AR[cat]||cat):cat}
function originKeyFor(p){
  const source=normalize([p.nameEn,p.original].join(" "));
  if(source.includes("chouf"))return "Chouf";
  if(source.includes("koura"))return "Koura";
  if(source.includes("beqaa")||source.includes("bekaa"))return "Bekaa";
  if(p.category==="Olive Oil")return "Koura";
  if(p.category==="Honey")return "Mount Lebanon";
  if(p.category==="Molasses"||source.includes("molasses"))return "Chouf";
  return "Bekaa";
}
function originFor(p){
  const key=originKeyFor(p);
  const isDebes=p.category==="Molasses"||normalize([p.nameEn,p.original].join(" ")).includes("molasses");
  if(lang==="ar"){
    const labels={"Bekaa":"البقاع","Koura":"الكورة","Mount Lebanon":"جبل لبنان","Chouf":"الشوف"};
    return `${isDebes?"مصدر الدبس":"المصدر"} · ${labels[key]||key}`;
  }
  return `${isDebes?"Debes source":"Source"} · ${key}, Lebanon`;
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
  return smartNormalize([p.nameEn,plainArabic(p.nameAr),p.original,p.category,CATEGORY_AR[p.category]||"",infoEn,infoAr].join(" "));
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
function cardVariantFor(p){return variantById(p,cardVariant[p.id])||defaultVariant(p)}
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
    return p&&v?{key,p,v,qty:item.qty}:null;
  }).filter(Boolean);
}
function addGiftItem(productId,variantId,qty=1){
  const p=productById(productId);if(!p)return;
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
    enWhat="Lentils are dried pulses valued for quick cooking, protein and earthy flavour.";
    enUse="Cook in soups, mujadara-style dishes, stews and salads.";
    arWhat="العدس من البقوليات المجففة، سريع الطبخ وغني ومناسب للوجبات اليومية.";
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
    enWhat="Extra virgin olive oil is a central ingredient of the Lebanese pantry.";
    enUse="Use for dipping, dressings, mezze, marinades and cooking.";
    arWhat="زيت الزيتون البكر الممتاز من أساسيات المونة اللبنانية.";
    arUse="يُستخدم للتغميس والتتبيلات والمازة والماريناد والطبخ.";
  }else if(n.includes("honey")){
    enWhat="Honey is a naturally sweet bee-made pantry food; flavour varies by floral source and blend.";
    enUse="Use at breakfast, in drinks, dressings, desserts or alongside cheese.";
    arWhat="العسل غذاء طبيعي حلو من النحل، وتختلف نكهته بحسب مصدر الرحيق والخلطة.";
    arUse="يُستخدم مع الفطور والمشروبات والتتبيلات والحلويات أو مع الجبنة.";
  }else if(n.includes("molasses")){
    enWhat="Fruit molasses is concentrated fruit juice cooked down to a thick, intense syrup.";
    enUse="Use in dressings, marinades, sauces and Lebanese sweet-sour pairings.";
    arWhat="الدبس عصير فاكهة مركز يُطبخ حتى يصبح كثيفاً وغني النكهة.";
    arUse="يُستخدم في التتبيلات والماريناد والصلصات والوصفات اللبنانية الحلوة الحامضة.";
  }else if(n.includes("jam")){
    enWhat="A fruit or flower preserve cooked into a spreadable pantry staple.";
    enUse="Serve with bread, labneh, breakfast plates, pastries or desserts.";
    arWhat="مربّى من الفاكهة أو الورد محضّر ليكون قابلاً للدهن والحفظ.";
    arUse="يُقدّم مع الخبز واللبنة والفطور والمعجنات والحلويات.";
  }else if(n.includes("labneh")){
    enWhat="Labneh is strained yogurt; these mouneh-style balls are preserved for a rich, tangy bite.";
    enUse="Serve with olive oil, bread, breakfast, mezze and herbs.";
    arWhat="اللبنة لبن مصفّى، وتُحفظ هنا على شكل كرات مونة بطعم غني وحامض لطيف.";
    arUse="تُقدّم مع زيت الزيتون والخبز والفطور والمازة والأعشاب.";
  }else if(n.includes("makdous")){
    enWhat="Makdous is a traditional preserved stuffed eggplant preparation.";
    enUse="Serve at breakfast or mezze with bread, vegetables and olive oil.";
    arWhat="المكدوس باذنجان محشي ومحفوظ على الطريقة التقليدية.";
    arUse="يُقدّم على الفطور أو المازة مع الخبز والخضار وزيت الزيتون.";
  }else if(n.includes("vinegar")||n.includes("verjuice")){
    enWhat="A bright acidic pantry ingredient made from fruit vinegar or unripe grape juice.";
    enUse="Use in dressings, marinades, sauces and preserved foods.";
    arWhat="مكوّن حامض ومنعش من خل الفاكهة أو عصير العنب غير الناضج.";
    arUse="يُستخدم في التتبيلات والماريناد والصلصات والمونة.";
  }
  return lang==="ar"?{what:arWhat,use:arUse}:{what:enWhat,use:enUse};
}

function healthNoteFor(p){
  const n=p.nameEn.toLowerCase();
  const pulseMatch=/(lentil|aadas|chickpea|humus|hummus|fasol|bean|foul|pea|bazela|termos|lupin)/.test(n);
  const wholeGrainMatch=/(bulgur|freek|barley|brown rice|quinoa|kinwa|oat|shoufen|whole wheat|kameh)/.test(n);
  const nutSeedMatch=/(almond|loz|walnut|joz |pecan|cashew|kajo|pistach|fustuq|chia|shea seed|sesame|somsom|flax|ketan|pumpkin seed|yaqtin|sunflower seed|dwar el shames|pine nut|snoubar|blackseed|habet el barakeh)/.test(n);
  const flourMatch=/(whole wheat flour|almond flour|barley flour|oat flour|shoufen flour)/.test(n);

  if(p.category==="Pulses"&&pulseMatch){
    return lang==="ar"
      ? {badge:"خيار مُغذٍ",text:"البقوليات مثل العدس والحمص والفاصوليا مصدر نباتي للبروتين والألياف، ويمكن أن تكون جزءاً ممتازاً من وجبة متوازنة."}
      : {badge:"Nutritious choice",text:"Pulses such as lentils, chickpeas and beans naturally provide plant protein and fiber, making them a strong choice in a balanced meal."};
  }
  if(wholeGrainMatch){
    return lang==="ar"
      ? {badge:"خيار مُغذٍ",text:"الحبوب الكاملة مثل البرغل والفريكة والشعير والشوفان والكينوا والأرز الأسمر يمكن أن تضيف الألياف ومغذيات مفيدة إلى نظام غذائي متوازن."}
      : {badge:"Nutritious choice",text:"Whole-grain staples such as bulgur, freekeh, barley, oats, quinoa and brown rice can contribute fiber and useful nutrients as part of a balanced diet."};
  }
  if(p.category==="Nuts + Seeds"&&nutSeedMatch){
    return lang==="ar"
      ? {badge:"خيار مُغذٍ",text:"المكسرات والبذور أطعمة كثيفة بالعناصر الغذائية وتوفّر عادةً دهوناً غير مشبعة وبروتيناً نباتياً وأليافاً."}
      : {badge:"Nutritious choice",text:"Nuts and seeds are nutrient-dense foods that commonly provide unsaturated fats, plant protein and fiber."};
  }
  if(n.includes("extra virgin olive oil")){
    return lang==="ar"
      ? {badge:"خيار مُغذٍ",text:"زيت الزيتون البكر الممتاز غني بالدهون الأحادية غير المشبعة ويُستخدم تقليدياً ضمن نمط الأكل المتوسطي."}
      : {badge:"Nutritious choice",text:"Extra virgin olive oil is rich in monounsaturated fat and is a classic ingredient in Mediterranean-style eating."};
  }
  if(n.includes("tahini")){
    return lang==="ar"
      ? {badge:"خيار مُغذٍ",text:"الطحينة مصنوعة من السمسم وتوفّر طبيعياً دهوناً غير مشبعة وبروتيناً ومعادن."}
      : {badge:"Nutritious choice",text:"Tahini is sesame-based and naturally provides unsaturated fats, plant protein and minerals."};
  }
  if(flourMatch){
    return lang==="ar"
      ? {badge:"خيار مُغذٍ",text:"هذا النوع من الطحين الكامل أو طحين المكسرات يمكن أن يوفّر أليافاً أو بروتيناً أكثر من الطحين الأبيض المكرر، بحسب الصنف."}
      : {badge:"Nutritious choice",text:"This whole-grain or nut-based flour can provide more fiber or protein than standard refined white flour, depending on the type."};
  }
  return null;
}

function applyPageMetadata(){
  const copy=(PAGE_I18N[CURRENT_PAGE]||PAGE_I18N.home)[lang];
  if(!copy)return;
  document.title=copy.title;
  const md=document.querySelector('meta[name="description"]');if(md)md.content=copy.description;
  const ogTitle=document.querySelector('meta[property="og:title"]');if(ogTitle)ogTitle.content=copy.title;
  const ogDesc=document.querySelector('meta[property="og:description"]');if(ogDesc)ogDesc.content=copy.description;
  const ogLocale=document.querySelector('meta[property="og:locale"]');if(ogLocale)ogLocale.content=lang==="ar"?"ar_LB":"en_LB";
  const skip=$("#skipLink");if(skip)skip.textContent=copy.skip;
}

function applyAccessibleLanguage(){
  const ar=lang==="ar";
  const aria=(selector,en,arText)=>{const el=document.querySelector(selector);if(el)el.setAttribute("aria-label",ar?arText:en)};
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
      if(el.dataset.langVisibilityGuard==="1"){
        el.style.removeProperty("display");
        delete el.dataset.langVisibilityGuard;
      }
      el.removeAttribute("aria-hidden");
    }
  });
}

function applyLanguage(next,{immediate=false}={}){
  lang=next==="ar"?"ar":"en";
  safeStorageSet(LANG_KEY,lang);
  const t=UI[lang];
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
    orderDetailsTitle:"orderDetailsTitle",orderDetailsNote:"orderDetailsNote",customerNameLabel:"yourName",customerAreaLabel:"area",orderNotesLabel:"notes",priceNote:"priceNote",
    whatLabel:"what",useLabel:"use",nutritionLabel:"nutritionLabel",chooseSizeLabel:"chooseSize"
  };
  Object.entries(textMap).forEach(([id,key])=>{const el=$("#"+id);if(el&&t[key]!==undefined)el.textContent=t[key]});

  const htmlMap={heroTitle:"heroTitle",heroExplore:"heroExplore",categoriesTitle:"categoriesTitle",aboutTitle:"aboutTitle",signTitle:"signTitle",signCta:"signCta",shopTitle:"shopTitle",orderTitle:"orderTitle",contactTitle:"contactTitle",sendOrderButton:"sendOrder"};
  Object.entries(htmlMap).forEach(([id,key])=>{const el=$("#"+id);if(el&&t[key]!==undefined)el.innerHTML=t[key]});

  if($("#productSearch"))$("#productSearch").placeholder=t.searchPlaceholder;
  if($("#customerName"))$("#customerName").placeholder=t.namePlaceholder;
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
      return catOk&&favOk&&(!q||score>0);
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
    const health=healthNoteFor(p);
    const badges=badgesFor(p);
    const isFav=favorites.has(p.id);
    const selected=cardVariantFor(p);
    const q=qtyFor("card:"+p.id);
    const ps=productPriceSummary(p);
    const listingNote=lang==="en"?repeatedListingNote(p):"";
    const sizeOptions=p.variants.length>1
      ? `<select class="card-variant-select" data-card-variant="${p.id}" aria-label="${escapeHtml(t.chooseSize)}">${p.variants.map(v=>`<option value="${escapeHtml(v.id)}"${v.id===selected.id?" selected":""}>${escapeHtml(lang==="ar"?v.sizeAr:v.sizeEn)} · ${money(v.price)}</option>`).join("")}</select>`
      : `<div class="single-size">${escapeHtml(lang==="ar"?selected.sizeAr:selected.sizeEn)}</div>`;

    return `<article class="product-card product-card-animated" style="--card-i:${index%8}" data-product="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="${escapeHtml(t.view+" "+currentName(p))}">
      <div class="product-top">
        <div class="product-visual">${productVisualMarkup(p)}<span class="quick-view-hint">${lang==="ar"?"عرض سريع ↗":"Quick view ↗"}</span></div>
        <div class="product-top-actions">
          <button class="product-favorite ${isFav?"is-active":""}" type="button" data-fav="${escapeHtml(p.id)}" aria-pressed="${isFav}" aria-label="${escapeHtml(EXTRA_UI[lang].favorite)}">${uiIcon("heart",isFav)}</button>
          <button class="product-view" type="button" data-view="${escapeHtml(p.id)}" aria-label="${escapeHtml(t.view+" "+currentName(p))}">${uiIcon("eye")}</button>
        </div>
      </div>
      ${badges.length?`<div class="product-badges">${badges.map(b=>`<span>${escapeHtml(b)}</span>`).join("")}</div>`:""}
      <p class="product-category">${escapeHtml(categoryName(p.category))}</p>\n      <p class="product-origin">${escapeHtml(originFor(p))}</p>\n      ${listingNote?`<p class="product-listing-note">${escapeHtml(listingNote)}</p>`:""}\n      <h3 class="product-name">${escapeHtml(currentName(p))}</h3>
      <p class="product-description">${escapeHtml(info.what)}</p>
      <p class="product-use"><strong>${escapeHtml(t.use)}:</strong> ${escapeHtml(info.use)}</p>
      ${health?`<div class="product-health"><span>✦ ${escapeHtml(health.badge)}</span><p>${escapeHtml(health.text)}</p></div>`:""}
      <div class="product-price-row">
        <div class="product-price"><small>${p.variants.length>1?escapeHtml(t.from):""}</small><strong class="money">${money(ps.min)}</strong></div>
        <div class="product-size-summary">${p.variants.length>1?`${p.variants.length} ${escapeHtml(t.sizeOptions)}`:escapeHtml(lang==="ar"?selected.sizeAr:selected.sizeEn)}</div>
      </div>
      <div class="product-actions">
        ${sizeOptions}
        <div class="product-buy-row">
          <div class="card-qty">
            <button type="button" data-card-q="-1" data-id="${escapeHtml(p.id)}" aria-label="${escapeHtml(lang==="ar"?"تقليل الكمية":"Decrease quantity")}">−</button>
            <span data-card-qty="${escapeHtml(p.id)}">${q}</span>
            <button type="button" data-card-q="1" data-id="${escapeHtml(p.id)}" aria-label="${escapeHtml(lang==="ar"?"زيادة الكمية":"Increase quantity")}">+</button>
          </div>
          <button class="add-button" type="button" data-add="${escapeHtml(p.id)}">${escapeHtml(t.add)}</button>
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

  $$("[data-fav]").forEach(btn=>btn.addEventListener("click",e=>{e.stopPropagation();toggleFavorite(btn.dataset.fav)}));
  $$("[data-card-variant]").forEach(sel=>sel.addEventListener("change",e=>{
    e.stopPropagation();
    cardVariant[sel.dataset.cardVariant]=sel.value;
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
    const p=productById(btn.dataset.add);
    if(!p)return;
    addToCart(p,cardVariantFor(p),qtyFor("card:"+p.id));
    animateAddToCart(btn,p);
  }));
  $$("[data-view]").forEach(btn=>btn.addEventListener("click",e=>{e.stopPropagation();openProduct(btn.dataset.view)}));
  $$("[data-product]").forEach(card=>{
    card.addEventListener("click",e=>{if(!e.target.closest("button,select"))openProduct(card.dataset.product)});
    card.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&!e.target.closest("button,select")){e.preventDefault();openProduct(card.dataset.product)}});
  });
}

function addToCart(p,v,qty){
  const key=cartKey(p.id,v.id);
  cart[key]={productId:p.id,variantId:v.id,qty:Math.max(1,Number(qty)||1)};
  saveCart();
  renderCart();
  toast(`${currentName(p)} · ${lang==="ar"?v.sizeAr:v.sizeEn} — ${UI[lang].added}`);
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
  const totalQty=rows.reduce((s,r)=>s+r.qty,0);
  const total=rows.reduce((s,r)=>s+r.qty*Number(r.v.price),0);
  $("#cartCount").textContent=totalQty;
  $("#drawerCount").textContent=totalQty;
  $("#cartSubline").textContent=rows.length?`${t.cartProducts(rows.length)} · ${t.cartItems(totalQty)} · ${t.cartSaved}`:t.cartSaved;
  $("#cartEmpty").hidden=rows.length>0;
  $("#orderForm").hidden=rows.length===0;
  $("#cartTotal").textContent=money(total);
  renderGiftSummary();
  renderMobileOrderBar();

  $("#cartItems").innerHTML=rows.map(({key,p,v,qty})=>`
    <article class="cart-item">
      <div>
        <h3>${escapeHtml(currentName(p))}</h3>
        <p class="cart-item-meta">${escapeHtml(categoryName(p.category))} · ${escapeHtml(lang==="ar"?v.sizeAr:v.sizeEn)}</p>
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
  $$("[data-cart-view]").forEach(btn=>btn.addEventListener("click",()=>openProduct(btn.dataset.cartView)));
}

function syncProductUrl(id){
  if(CURRENT_PAGE!=="shop"||!history.replaceState)return;
  const url=new URL(location.href);
  if(id)url.searchParams.set("product",id);else url.searchParams.delete("product");
  history.replaceState({product:id||null},"",url.pathname+url.search+url.hash);
}
function openProduct(id){
  const p=productById(id);
  if(!p)return;
  syncProductUrl(id);
  addRecent(id);
  closeCart();
  currentModalProduct=p;
  currentModalVariant=cardVariantFor(p);
  draftQty["modal"]=1;
  renderModal(p.id,currentModalVariant.id);
  document.body.classList.add("modal-open");
  backdropOn();
  $("#productModal").classList.add("is-open");
  $("#productModal").setAttribute("aria-hidden","false");
}

function renderModal(productId,variantId){
  const p=productById(productId);
  if(!p)return;
  const v=variantById(p,variantId)||defaultVariant(p);
  currentModalProduct=p;
  currentModalVariant=v;
  const t=UI[lang],info=infoFor(p),health=healthNoteFor(p),badges=badgesFor(p);
  $("#productModalMark").innerHTML=productVisualMarkup(p,"product-modal-image");
  $("#productModalCategory").textContent=categoryName(p.category);
  $("#productModalTitle").textContent=currentName(p);
  $("#productModalOriginal").textContent=lang==="en"&&normalize(p.nameEn)!==normalize(p.original)?`Catalogue name: ${p.original}`:"";
  $("#modalBadges").innerHTML=badges.map(b=>`<span>${escapeHtml(b)}</span>`).join("");
  const fav=$("#modalFavorite");
  if(fav){const saved=favorites.has(p.id);fav.classList.toggle("is-active",saved);fav.setAttribute("aria-pressed",String(saved));fav.innerHTML=`${uiIcon("heart",saved)} <span id="modalFavoriteLabel">${escapeHtml(saved?EXTRA_UI[lang].favorited:EXTRA_UI[lang].favorite)}</span>`;}
  if($("#relatedLabel"))$("#relatedLabel").textContent=EXTRA_UI[lang].related;
  const origin=$("#productOrigin");if(origin)origin.textContent=originFor(p);
  $("#relatedProducts").innerHTML=PRODUCTS_DATA.filter(x=>x.category===p.category&&x.id!==p.id).slice(0,4).map(x=>`<button type="button" data-related="${escapeHtml(x.id)}"><span>${escapeHtml(currentName(x))}</span><strong>${money(productPriceSummary(x).min)}</strong></button>`).join("");
  $$("[data-related]").forEach(btn=>btn.addEventListener("click",()=>openProduct(btn.dataset.related)));
  $("#productModalDescription").textContent=info.what;
  $("#productModalUse").textContent=info.use;
  $("#nutritionPanel").hidden=!health;
  $("#productNutrition").textContent=health?health.text:"";
  $("#modalPrice").textContent=money(v.price);
  $("#productModalQty").textContent=qtyFor("modal");
  $("#productModalAdd").textContent=t.add;
  $("#variantOptions").innerHTML=p.variants.map(option=>`<button type="button" class="variant-option ${option.id===v.id?"is-active":""}" data-modal-variant="${escapeHtml(option.id)}">${escapeHtml(lang==="ar"?option.sizeAr:option.sizeEn)} · ${money(option.price)}</button>`).join("");
  $$("[data-modal-variant]").forEach(btn=>btn.addEventListener("click",()=>{
    currentModalVariant=variantById(p,btn.dataset.modalVariant);
    renderModal(p.id,currentModalVariant.id);
  }));
}

function closeProduct(){
  if(!$("#productModal"))return;
  currentModalProduct=null;
  currentModalVariant=null;
  document.body.classList.remove("modal-open");
  $("#productModal").classList.remove("is-open");
  $("#productModal").setAttribute("aria-hidden","true");
  syncProductUrl(null);
  backdropMaybeOff();
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
  $$("[data-suggest]").forEach(btn=>btn.addEventListener("mousedown",e=>{e.preventDefault();box.hidden=true;openProduct(btn.dataset.suggest)}));
}

function renderFeaturedProducts(){
  const grid=$("#featuredGrid");if(!grid)return;
  const items=FEATURED_IDS.map(productById).filter(Boolean);
  grid.innerHTML=items.map((p,index)=>{
    const v=defaultVariant(p);
    const ps=productPriceSummary(p);
    return `<article class="featured-product ${index===0?"is-featured-lead":""}" style="--featured-i:${index}" data-featured-view="${escapeHtml(p.id)}">
      <div class="featured-product-media">${productVisualMarkup(p,"featured-product-image")}<span class="featured-product-badge">${lang==="ar"?"مختار":"Featured"}</span></div>
      <div class="featured-product-copy">
        <p>${escapeHtml(categoryName(p.category))}</p>
        <h3>${escapeHtml(currentName(p))}</h3>
        <span class="featured-origin">${escapeHtml(originFor(p))}</span>
        <div class="featured-product-foot"><span><strong>${money(ps.min)}</strong><small>${p.variants.length>1?(lang==="ar"?"من ":"from ")+money(ps.min):escapeHtml(lang==="ar"?v.sizeAr:v.sizeEn)}</small></span><button type="button" data-featured-add="${escapeHtml(p.id)}">${escapeHtml(UI[lang].add)} <b>+</b></button></div>
      </div>
    </article>`;
  }).join("");
  $$("[data-featured-view]").forEach(card=>card.addEventListener("click",e=>{if(!e.target.closest("button"))openProduct(card.dataset.featuredView)}));
  $$("[data-featured-add]").forEach(btn=>btn.addEventListener("click",e=>{e.stopPropagation();const p=productById(btn.dataset.featuredAdd);if(p){addToCart(p,defaultVariant(p),1);animateAddToCart(btn,p)}}));
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
  $$("[data-gift-preset]").forEach(btn=>btn.addEventListener("click",()=>applyGiftPreset(btn.dataset.giftPreset)));
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
  $$("[data-recent-view]").forEach(btn=>btn.addEventListener("click",()=>openProduct(btn.dataset.recentView)));
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
    const v=defaultVariant(p),already=giftRows().some(r=>r.p.id===p.id);
    return `<button type="button" class="gift-result ${already?"is-added":""}" data-gift-add="${escapeHtml(p.id)}">
      <span class="gift-result-mark">${productVisualMarkup(p,"gift-product-image")}</span>
      <span><small>${escapeHtml(categoryName(p.category))}</small><strong>${escapeHtml(currentName(p))}</strong><em>${escapeHtml(lang==="ar"?v.sizeAr:v.sizeEn)} · ${money(v.price)}${p.variants.length>1?` · ${p.variants.length} ${escapeHtml(UI[lang].sizeOptions)}`:""}</em></span>
      <b>${already?"✓":escapeHtml(EXTRA_UI[lang].giftAdd)}</b>
    </button>`;
  }).join("");
  if(!items.length)box.innerHTML=`<p class="gift-no-results">${escapeHtml(UI[lang].emptyCopy)}</p>`;
  if(more){
    more.hidden=giftVisibleLimit>=total;
    more.textContent=EXTRA_UI[lang].giftMore;
  }
  document.querySelectorAll("[data-gift-add]").forEach(btn=>btn.addEventListener("click",()=>{
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
      ${r.p.variants.map(v=>`<option value="${escapeHtml(v.id)}"${v.id===r.v.id?" selected":""}>${escapeHtml(lang==="ar"?v.sizeAr:v.sizeEn)} · ${money(v.price)}</option>`).join("")}
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
function sendGiftOrder(){
  const rows=giftRows(),t=EXTRA_UI[lang],base=UI[lang];
  if(!rows.length){toast(t.giftNeedItems);return}
  const recipient=$("#giftRecipient")?.value.trim()||"—";
  const occasion=t.giftOccasions[Number($("#giftOccasion")?.value)||0];
  const packing=t.giftPackings[Number($("#giftPackaging")?.value)||0];
  const area=$("#giftArea")?.value.trim()||"—";
  const message=$("#giftMessage")?.value.trim()||"—";
  const sender=$("#giftSender")?.value.trim()||"—";
  const theme=$("#giftTheme")?.value||"Olive green";
  const cardLanguage=$("#giftCardLanguage")?.value||"English";
  const themeLabel=lang==="ar"?({"Olive green":"أخضر زيتوني","Natural linen":"كتان طبيعي","Warm gold":"ذهبي دافئ"}[theme]||theme):theme;
  const cardLanguageLabel=lang==="ar"?({"English":"الإنجليزية","Arabic":"العربية","Bilingual":"ثنائية اللغة"}[cardLanguage]||cardLanguage):({"English":"English","Arabic":"Arabic","Bilingual":"English + العربية"}[cardLanguage]||cardLanguage);
  const hidePrices=$("#giftHidePrices")?.checked!==false;
  const total=rows.reduce((sum,row)=>sum+row.qty*Number(row.v.price),0);
  const ref=orderReference("ZW-GIFT");
  const lines=[
    lang==="ar"?"مرحباً زيت ومونة 👋":"Hello Zayt w Mouneh 👋","",
    (lang==="ar"?"رقم الطلب":"Order")+": "+ref,"",
    lang==="ar"?"أرغب بتحضير هذه الهدية:":"I would like to prepare this gift:","",
    ...rows.map((row,i)=>(i+1)+". "+currentName(row.p)+" — "+(lang==="ar"?row.v.sizeAr:row.v.sizeEn)+" — "+base.qty+": "+row.qty+" — "+money(row.v.price*row.qty)),
    "",base.orderTotal+": "+money(total),
    (lang==="ar"?"المستلم":"Recipient")+": "+recipient,
    (lang==="ar"?"المناسبة":"Occasion")+": "+occasion,
    (lang==="ar"?"التغليف":"Packing")+": "+packing,
    (lang==="ar"?"طابع الهدية":"Gift theme")+": "+themeLabel,
    (lang==="ar"?"لغة البطاقة":"Card language")+": "+cardLanguageLabel,
    (lang==="ar"?"إخفاء الأسعار عن المستلم":"Hide prices from recipient")+": "+(hidePrices?(lang==="ar"?"نعم":"Yes"):(lang==="ar"?"لا":"No")),
    (lang==="ar"?"منطقة التوصيل":"Delivery area")+": "+area,
    (lang==="ar"?"رسالة الهدية":"Gift message")+": "+message,
    (lang==="ar"?"المرسل":"Sender")+": "+sender,"",
    lang==="ar"?"يرجى تأكيد التغليف والتوفر والتوصيل والمجموع النهائي. شكراً!":"Please confirm gift packing, availability, delivery and the final total. Thank you!"
  ];
  window.ZWM_CMS?.recordOrder?.({
    reference:ref,
    kind:"gift",
    customer_name:sender==="—"?"":sender,
    area:area==="—"?"":area,
    notes:message==="—"?"":message,
    items:rows.map(row=>({
      product_id:row.p.id,
      name:row.p.nameEn||currentName(row.p),
      size:row.v.sizeEn||row.v.sizeAr||"",
      qty:row.qty,
      unit_price:Number(row.v.price),
      subtotal:Number(row.v.price)*row.qty
    })),
    total,
    language:lang,
    extra:{
      source:"gift_builder",
      recipient:recipient==="—"?"":recipient,
      occasion,
      packing,
      theme,
      card_language:cardLanguage,
      hide_prices:hidePrices
    }
  });
  const url="https://wa.me/"+WA+"?text="+encodeURIComponent(lines.join("\n"));
  const opened=window.open(url,"_blank","noopener,noreferrer");
  if(opened)toast(lang==="ar"?"تم فتح واتساب مع طلب الهدية":"WhatsApp opened with your gift request");
  else window.location.href=url;
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
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden)$$("[data-scene] video").forEach(v=>v.pause());
    else if(heroVisible)showScene(sceneIndex);
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
function order(){
  const rows=cartRows();
  if(!rows.length)return;
  const t=UI[lang];
  const total=rows.reduce((s,r)=>s+r.qty*Number(r.v.price),0);
  const name=$("#customerName").value.trim()||"—";
  const area=$("#customerArea").value.trim()||"—";
  const notes=$("#orderNotes").value.trim()||"—";
  const ref=orderReference("ZW");
  const lines=[
    t.orderHello,"",`${lang==="ar"?"رقم الطلب":"Order"}: ${ref}`,"",t.orderIntro,"",
    ...rows.map((r,i)=>{
      const itemName=currentName(r.p);
      const size=lang==="ar"?r.v.sizeAr:r.v.sizeEn;
      const subtotal=money(r.v.price*r.qty);
      return `${i+1}. ${itemName} — ${size} — ${t.qty}: ${r.qty} — ${money(r.v.price)} — ${t.subtotal}: ${subtotal}`;
    }),
    "",
    `${t.orderTotal}: ${money(total)}`,
    `${t.customer}: ${name}`,
    `${t.orderArea}: ${area}`,
    `${t.orderNotes}: ${notes}`,
    "",
    t.orderConfirm
  ];
  window.ZWM_CMS?.recordOrder?.({
    reference:ref,
    kind:"order",
    customer_name:name==="—"?"":name,
    area:area==="—"?"":area,
    notes:notes==="—"?"":notes,
    items:rows.map(r=>({
      product_id:r.p.id,
      name:r.p.nameEn||currentName(r.p),
      size:r.v.sizeEn||r.v.sizeAr||"",
      qty:r.qty,
      unit_price:Number(r.v.price),
      subtotal:Number(r.v.price)*r.qty
    })),
    total,
    language:lang,
    extra:{source:"cart"}
  });
  const opened=window.open(`https://wa.me/${WA}?text=${encodeURIComponent(lines.join("\n"))}`,"_blank","noopener,noreferrer");
  if(opened)toast(lang==="ar"?"تم فتح واتساب مع طلبك":"WhatsApp opened with your order");
}

function openCart(){
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
  b.hidden=false;
  requestAnimationFrame(()=>b.classList.add("is-visible"));
}
function backdropMaybeOff(){
  if(document.body.classList.contains("cart-open")||document.body.classList.contains("modal-open"))return;
  const b=$("#cartBackdrop");
  b.classList.remove("is-visible");
  setTimeout(()=>{if(!document.body.classList.contains("cart-open")&&!document.body.classList.contains("modal-open"))b.hidden=true},310);
}

function shouldLimitHeroMedia(){
  return Boolean(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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
    video.preload=activeNow?"auto":"metadata";
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
    video.preload=index===0?"auto":"metadata";
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
    lang=next==="ar"?"ar":"en";
    safeStorageSet(LANG_KEY,lang);
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
  const phoneQuery=window.matchMedia?window.matchMedia("(max-width:760px)"):null;
  const isCompact=()=>compactQuery?compactQuery.matches:window.innerWidth<=1080;
  const isPhone=()=>phoneQuery?phoneQuery.matches:window.innerWidth<=760;
  const originalParent=n.parentNode;
  const originalNext=n.nextSibling;
  const mountPhoneMenu=()=>{
    if(!isPhone()||n.parentNode===document.body)return;
    document.body.appendChild(n);
    n.classList.add("is-mobile-portal");
  };
  const restorePhoneMenu=()=>{
    if(!n.classList.contains("is-mobile-portal"))return;
    n.classList.remove("is-mobile-portal");
    if(originalNext&&originalNext.parentNode===originalParent)originalParent.insertBefore(n,originalNext);
    else originalParent.appendChild(n);
  };
  const syncA11y=()=>{
    const open=n.classList.contains("is-open");
    if(isCompact())n.setAttribute("aria-hidden",open?"false":"true");
    else n.removeAttribute("aria-hidden");
  };
  const close=()=>{
    n.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    t.setAttribute("aria-expanded","false");
    t.setAttribute("aria-label",lang==="ar"?"فتح القائمة":"Open menu");
    syncA11y();
    restorePhoneMenu();
  };
  const openMenu=()=>{
    mountPhoneMenu();
    n.classList.add("is-open");
    document.body.classList.add("menu-open");
    t.setAttribute("aria-expanded","true");
    t.setAttribute("aria-label",lang==="ar"?"إغلاق القائمة":"Close menu");
    syncA11y();
  };
  t.addEventListener("click",e=>{
    e.preventDefault();
    e.stopPropagation();
    n.classList.contains("is-open")?close():openMenu();
  });
  n.addEventListener("click",e=>e.stopPropagation());
  document.querySelectorAll("#navLinks a").forEach(a=>a.addEventListener("click",close));
  document.addEventListener("click",()=>{if(n.classList.contains("is-open"))close()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&n.classList.contains("is-open")){close();t.focus({preventScroll:true})}});
  const onViewportChange=()=>{
    if(!isCompact()&&n.classList.contains("is-open"))close();
    else syncA11y();
  };
  if(compactQuery){
    if(typeof compactQuery.addEventListener==="function")compactQuery.addEventListener("change",onViewportChange);
    else if(typeof compactQuery.addListener==="function")compactQuery.addListener(onViewportChange);
  }
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

function toast(message){
  $("#toastText").textContent=message;
  $("#toast").classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$("#toast").classList.remove("is-visible"),1800);
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
  if($("#heroVariantCount"))$("#heroVariantCount").textContent=PRODUCTS_DATA.length;
  if($("#heroCategoryCount"))$("#heroCategoryCount").textContent=CATEGORY_ORDER.length;
  if($("#year"))$("#year").textContent=new Date().getFullYear();

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
  if($("#favoritesOnly"))$("#favoritesOnly").addEventListener("click",()=>{favoritesOnly=!favoritesOnly;visibleLimit=catalogPageSize();renderFavoritesCount();renderProducts()});
  if($("#clearRecent"))$("#clearRecent").addEventListener("click",()=>{recentViews=[];saveRecent();renderRecent()});

  $$("[data-lang]").forEach(btn=>btn.addEventListener("click",()=>applyLanguage(btn.dataset.lang)));
  $$("[data-welcome-lang]").forEach(btn=>btn.addEventListener("click",e=>chooseWelcomeLanguage(btn.dataset.welcomeLang,e)));

  const helpSearch=$("[data-help-search]");
  if(helpSearch)helpSearch.addEventListener("click",e=>{e.preventDefault();const shop=$("#shop");if(shop)shop.scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>{const input=$("#productSearch");if(input){input.focus();input.select()}},420)});

  if($("#cartButton"))$("#cartButton").addEventListener("click",openCart);
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
  if($("#mobileOrderBar"))$("#mobileOrderBar").addEventListener("click",openCart);

  if($("#productModalClose"))$("#productModalClose").addEventListener("click",closeProduct);
  if($("#modalQtyMinus"))$("#modalQtyMinus").addEventListener("click",()=>{draftQty.modal=Math.max(1,qtyFor("modal")-1);$("#productModalQty").textContent=draftQty.modal});
  if($("#modalQtyPlus"))$("#modalQtyPlus").addEventListener("click",()=>{draftQty.modal=qtyFor("modal")+1;$("#productModalQty").textContent=draftQty.modal});
  if($("#productModalAdd"))$("#productModalAdd").addEventListener("click",()=>{if(currentModalProduct&&currentModalVariant){addToCart(currentModalProduct,currentModalVariant,qtyFor("modal"));animateAddToCart($("#productModalAdd"),currentModalProduct)}});
  if($("#modalFavorite"))$("#modalFavorite").addEventListener("click",()=>{if(currentModalProduct)toggleFavorite(currentModalProduct.id)});

  $$("[data-scene-dot]").forEach(btn=>btn.addEventListener("click",()=>showScene(Number(btn.dataset.sceneDot),true)));

  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){closeCart();closeProduct()}
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();if(CURRENT_PAGE==="shop"&&$("#productSearch")){$("#productSearch").focus();location.hash="shop"}else location.href="shop.html#shop"}
  });

  addEventListener("storage",e=>{
    if(e.key===CART_KEY){cart=loadCart();renderCart()}
    if(e.key===LANG_KEY){applyLanguage(e.newValue==="ar"?"ar":"en",{immediate:true})}
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

window.chooseWelcomeLanguage=chooseWelcomeLanguage;
window.applyLanguage=applyLanguage;
window.applyPageMetadata=applyPageMetadata;
document.addEventListener("DOMContentLoaded",init);

/* Load the optional owner CMS/analytics bridge without delaying the storefront. */
(()=>{if(document.querySelector('script[data-zwm-site-runtime]'))return;const s=document.createElement("script");s.src="site-runtime.js?v=20261004-1";s.async=true;s.dataset.zwmSiteRuntime="1";document.head.appendChild(s);})();
