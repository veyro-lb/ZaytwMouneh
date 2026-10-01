
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const WA="96181581230";
const CART_KEY="zwm-cart-v5";
const LANG_KEY="zwm-lang-v2";
const WELCOME_KEY="zwm-welcome-seen-v1";
const PAGE_SIZE=24;

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
    navShop:"Shop",navCategories:"Categories",navAbout:"About & mission",navContact:"Contact",
    cartLabel:"Cart",
    heroEyebrow:"Rooted in Lebanese heritage",
    heroTitle:'A pantry of<br><em>Lebanese memory.</em>',
    heroLede:"Authentic pantry essentials, thoughtfully curated — with current pack sizes and prices ready to browse.",
    heroExplore:"Explore the pantry <span>↘</span>",
    heroWhatsApp:"WhatsApp us",
    heroVariantLabel:"priced options",heroCategoryLabel:"categories",heroSinceLabel:"since",
    scene1Kicker:"Pantry film · 01",scene1Title:"Honey, slow and golden.",scene1Copy:"One texture in a pantry full of grains, herbs, mouneh, oils and more.",
    scene2Kicker:"Pantry film · 02",scene2Title:"Lentils & everyday staples.",scene2Copy:"Warm, useful ingredients for real home cooking.",
    scene3Kicker:"Pantry film · 03",scene3Title:"Wheat, harvest & season.",scene3Copy:"A calm reminder of the ingredients, seasons and tables behind mouneh.",
    heroScript:"Curated with care",
    categoriesEyebrow:"The pantry, chapter by chapter",
    categoriesTitle:'Twenty-one ways<br>to bring home <em>mouneh.</em>',
    categoriesCopy:"Every category is part of the same inheritance — harvested, preserved, offered and passed from one generation to the next.",
    aboutEyebrow:"Our story & mission",
    aboutTitle:'More than a shelf.<br><em>Memory kept within reach.</em>',
    aboutLetterKicker:"A note from our pantry",
    aboutP1:"Since 2006, Zayt w Mouneh has grown from one simple thought: that the Lebanese pantry is more than a shelf — it is memory kept within reach. It lives in the fragrance of herbs drying in summer light, in olives resting in brine, in olive oil pressed from the grove, and in jars prepared patiently for the colder months. It is found in dates, carob and molasses; in grains, flour and pulses; in honey, nuts and seeds; in condiments, syrups and vinegars; in pickles, spices and dried foods; in sweets and candy shared at the table, and even in the simple soap that carries the scent of home. Each category is a small chapter of the same inheritance — harvested, preserved, offered, and passed from one generation to the next.",
    aboutP2:"Our mission is to keep that inheritance alive in a way that belongs to today: to choose authentic Lebanese pantry essentials with respect for origin, craft and flavour; to present them with clarity and care; and to make the generosity of mouneh easy to bring home. We want every jar, herb, grain and drop of oil to feel familiar — a quiet connection to the land, to the seasons, and to the tables that taught us that food is most meaningful when it is prepared with patience and shared with others.",
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
    cartEyebrow:"Your pantry list",cartTitle:"Cart",cartSaved:"Saved on this device",cartEmptyTitle:"Your cart is empty.",cartEmptyCopy:"Add products from the catalogue and they’ll appear here.",browseProducts:"Browse products",
    total:"Estimated total",orderDetailsTitle:"Order details",orderDetailsNote:"Sent only when you press WhatsApp",
    yourName:"Your name",namePlaceholder:"Name",area:"Area / location",areaPlaceholder:"e.g. Baabda",notes:"Order notes",notesPlaceholder:"Delivery notes, substitutions, anything we should know…",
    sendOrder:"Send order on WhatsApp <span>↗</span>",priceNote:"Prices are shown from the supplied retail list; final availability is confirmed on WhatsApp.",
    what:"What it is",use:"Use it for",nutritionLabel:"Nutrition note",nutritionBadge:"Nutritious choice",chooseSize:"Choose size",add:"Add to cart",update:"Update cart",view:"View",from:"From",sizeOptions:"size options",
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
    navShop:"المتجر",navCategories:"الأقسام",navAbout:"من نحن ورسالتنا",navContact:"تواصل معنا",
    cartLabel:"السلة",
    heroEyebrow:"متجذّرون في التراث اللبناني",
    heroTitle:'مونة تحفظ<br><em>ذاكرة لبنان.</em>',
    heroLede:"أساسيات مونة أصيلة مختارة بعناية، مع الأحجام والأسعار الحالية لتتسوّق بوضوح وسهولة.",
    heroExplore:"استكشف المونة <span>↙</span>",
    heroWhatsApp:"راسلنا على واتساب",
    heroVariantLabel:"خياراً مسعّراً",heroCategoryLabel:"قسماً",heroSinceLabel:"منذ",
    scene1Kicker:"من المونة · 01",scene1Title:"عسل ينساب ببطء.",scene1Copy:"تفصيل واحد من مونة أوسع تضم الحبوب والأعشاب والزيوت والمخللات والمزيد.",
    scene2Kicker:"من المونة · 02",scene2Title:"عدس وحبوب للبيت.",scene2Copy:"مكونات يومية دافئة ومفيدة للطبخ الحقيقي في البيت.",
    scene3Kicker:"من المونة · 03",scene3Title:"قمح وموسم وحصاد.",scene3Copy:"صورة هادئة عن الأرض والمواسم والموائد التي تعيش فيها المونة.",
    heroScript:"مختارة بعناية",
    categoriesEyebrow:"المونة، فصلاً بعد فصل",
    categoriesTitle:'واحد وعشرون قسماً<br>من <em>المونة.</em>',
    categoriesCopy:"كل قسم هو فصل من الإرث نفسه — يُحصد ويُحفظ ويُقدّم وينتقل من جيل إلى جيل.",
    aboutEyebrow:"قصتنا ورسالتنا",
    aboutTitle:'أكثر من رفّ.<br><em>ذاكرة تبقى في متناول اليد.</em>',
    aboutLetterKicker:"رسالة من مونة البيت",
    aboutP1:"منذ عام 2006، انطلقت زيت ومونة من فكرة بسيطة: أن المونة اللبنانية أكثر من مجرد رفّ — بل ذاكرة تبقى في متناول اليد. تعيش في رائحة الأعشاب التي تجف تحت ضوء الصيف، وفي الزيتون الذي يستريح في الماء المملّح، وفي زيت الزيتون المعصور من البساتين، وفي المرطبانات التي تُحضّر بصبر للأشهر الباردة. نجدها في التمر والخروب والدبس؛ في الحبوب والطحين والبقوليات؛ في العسل والمكسرات والبذور؛ في مستلزمات المطبخ والشرابات والخل؛ في المخللات والبهارات والأطعمة المجففة؛ في الحلويات والسكاكر التي نتشاركها على المائدة، وحتى في قطعة الصابون البسيطة التي تحمل رائحة البيت. كل قسم فصل صغير من الإرث نفسه — يُحصد ويُحفظ ويُقدّم وينتقل من جيل إلى جيل.",
    aboutP2:"رسالتنا أن نبقي هذا الإرث حيّاً بطريقة تنتمي إلى يومنا: أن نختار أساسيات المونة اللبنانية الأصيلة باحترام للمصدر والحرفة والنكهة، وأن نقدّمها بوضوح وعناية، وأن نجعل كرم المونة سهلاً ليصل إلى كل بيت. نريد لكل مرطبان وعشبة وحبة وقطرة زيت أن تبدو مألوفة — صلة هادئة بالأرض، وبالمواسم، وبالموائد التي علّمتنا أن الطعام يكتسب معناه الأكبر عندما يُحضّر بصبر ويُشارك مع الآخرين.",
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

let lang=localStorage.getItem(LANG_KEY)==="ar"?"ar":"en";
let activeCategory="All";
let query="";
let visibleLimit=PAGE_SIZE;
let cart=loadCart();
let draftQty={};
let cardVariant={};
let currentModalProduct=null;
let currentModalVariant=null;
let sceneIndex=0;
let sceneTimer=null;
let toastTimer=null;

const CATEGORY_COUNTS=Object.fromEntries(CATEGORY_ORDER.map(cat=>[cat,PRODUCTS_DATA.filter(p=>p.category===cat).length]));
const TOTAL_VARIANTS=PRODUCTS_DATA.reduce((sum,p)=>sum+p.variants.length,0);

function money(n){return `$${Number(n).toFixed(2)}`}
function currentName(p){return lang==="ar"?plainArabic(p.nameAr):p.nameEn}
function categoryName(cat){return lang==="ar"?(CATEGORY_AR[cat]||cat):cat}
function plainArabic(s){
  return String(s||"")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g,"")
    .replace(/\s+/g," ")
    .trim();
}
function normalize(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function productById(id){return PRODUCTS_DATA.find(p=>p.id===id)}
function variantById(p,id){return p?.variants.find(v=>v.id===id)||p?.variants[0]}
function defaultVariant(p){return p.variants[0]}
function cardVariantFor(p){return variantById(p,cardVariant[p.id])||defaultVariant(p)}
function qtyFor(key){return Math.max(1,Number(draftQty[key]||1))}
function cartKey(productId,variantId){return `${productId}::${variantId}`}

function loadCart(){
  try{
    const raw=JSON.parse(localStorage.getItem(CART_KEY)||"{}");
    const valid={};
    for(const [key,item] of Object.entries(raw||{})){
      const p=productById(item.productId);
      const v=variantById(p,item.variantId);
      if(p&&v) valid[key]={productId:p.id,variantId:v.id,qty:Math.max(1,Number(item.qty)||1)};
    }
    return valid;
  }catch{return{}}
}
function saveCart(){localStorage.setItem(CART_KEY,JSON.stringify(cart))}

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

function applyLanguage(next){
  lang=next==="ar"?"ar":"en";
  localStorage.setItem(LANG_KEY,lang);
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  const t=UI[lang];

  const textMap={
    skipLink:"skipLink",announcementText:"announcementText",announcementOrder:"announcementOrder",brandWordmark:"brand",
    navShop:"navShop",navCategories:"navCategories",navAbout:"navAbout",navContact:"navContact",cartLabel:"cartLabel",
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

  $("#productSearch").placeholder=t.searchPlaceholder;
  $("#customerName").placeholder=t.namePlaceholder;
  $("#customerArea").placeholder=t.areaPlaceholder;
  $("#orderNotes").placeholder=t.notesPlaceholder;
  $("#clearSearch").textContent=t.clearFilters;
  $("#loadMore").textContent=t.loadMore;
  $("#cartBrowse").textContent=t.browseProducts;

  $$("[data-lang]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.lang===lang));
  renderCategories();
  renderCategorySelect();
  renderProducts();
  renderCart();
  if(currentModalProduct) renderModal(currentModalProduct.id,currentModalVariant?.id);
}

function renderCategories(){
  $("#categoryGrid").innerHTML=CATEGORY_ORDER.map((cat,index)=>{
    const count=CATEGORY_COUNTS[cat]||0;
    const info=CATEGORY_INFO[cat]?.[lang]||["",""];
    return `<a class="category-card reveal" href="#shop" data-cat="${escapeHtml(cat)}">
      <div class="category-card-top"><span class="category-index">${String(index+1).padStart(2,"0")}</span><span class="category-count">${count} ${lang==="ar"?"منتج":"products"}</span></div>
      <div>
        <div class="category-name">${escapeHtml(categoryName(cat))}</div>
        <p class="category-blurb">${escapeHtml(info[0])}</p>
      </div>
      <div class="category-card-bottom"><span class="text-link">${lang==="ar"?"استكشف":"Explore"}</span><div class="category-arrow">${lang==="ar"?"↙":"↘"}</div></div>
    </a>`;
  }).join("");
  $$("[data-cat]").forEach(a=>a.addEventListener("click",()=>{
    activeCategory=a.dataset.cat;
    query="";
    visibleLimit=PAGE_SIZE;
    $("#productSearch").value="";
    renderCategorySelect();
    renderProducts();
  }));
}

function renderCategorySelect(){
  const select=$("#categorySelect");
  const options=[{key:"All",label:UI[lang].categoryAll,count:PRODUCTS_DATA.length},...CATEGORY_ORDER.map(cat=>({key:cat,label:categoryName(cat),count:CATEGORY_COUNTS[cat]||0}))];
  select.innerHTML=options.map(o=>`<option value="${escapeHtml(o.key)}">${escapeHtml(o.label)} · ${o.count}</option>`).join("");
  select.value=activeCategory;
}

function filteredProducts(){
  const q=normalize(query.trim());
  return PRODUCTS_DATA.filter(p=>{
    const catOk=activeCategory==="All"||p.category===activeCategory;
    if(!catOk)return false;
    if(!q)return true;
    const infoEn=CATEGORY_INFO[p.category]?.en?.join(" ")||"";
    const infoAr=CATEGORY_INFO[p.category]?.ar?.join(" ")||"";
    return normalize([p.nameEn,plainArabic(p.nameAr),p.original,p.category,CATEGORY_AR[p.category]||"",infoEn,infoAr].join(" ")).includes(q);
  });
}

function productPriceSummary(p){
  const prices=p.variants.map(v=>Number(v.price));
  const min=Math.min(...prices);
  const max=Math.max(...prices);
  return {min,max,same:min===max};
}

function renderProducts(){
  const t=UI[lang];
  const filtered=filteredProducts();
  const shown=filtered.slice(0,visibleLimit);
  $("#resultCount").textContent=filtered.length;

  $("#productGrid").innerHTML=shown.map(p=>{
    const info=infoFor(p);
    const health=healthNoteFor(p);
    const selected=cardVariantFor(p);
    const q=qtyFor("card:"+p.id);
    const ps=productPriceSummary(p);
    const sizeOptions=p.variants.length>1
      ? `<select class="card-variant-select" data-card-variant="${p.id}" aria-label="${escapeHtml(t.chooseSize)}">${p.variants.map(v=>`<option value="${escapeHtml(v.id)}"${v.id===selected.id?" selected":""}>${escapeHtml(lang==="ar"?v.sizeAr:v.sizeEn)} · ${money(v.price)}</option>`).join("")}</select>`
      : `<div class="single-size">${escapeHtml(lang==="ar"?selected.sizeAr:selected.sizeEn)}</div>`;

    return `<article class="product-card" data-product="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="${escapeHtml(t.view+" "+currentName(p))}">
      <div class="product-top">
        <div class="product-visual"><span class="product-monogram">${escapeHtml(initials(currentName(p)))}</span></div>
        <button class="product-view" type="button" data-view="${escapeHtml(p.id)}">${escapeHtml(t.view)}</button>
      </div>
      <p class="product-category">${escapeHtml(categoryName(p.category))}</p>
      <h3 class="product-name">${escapeHtml(currentName(p))}</h3>
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
            <button type="button" data-card-q="-1" data-id="${escapeHtml(p.id)}" aria-label="Decrease quantity">−</button>
            <span data-card-qty="${escapeHtml(p.id)}">${q}</span>
            <button type="button" data-card-q="1" data-id="${escapeHtml(p.id)}" aria-label="Increase quantity">+</button>
          </div>
          <button class="add-button" type="button" data-add="${escapeHtml(p.id)}">${escapeHtml(t.add)}</button>
        </div>
      </div>
    </article>`;
  }).join("");

  $("#catalogEmpty").hidden=filtered.length>0;
  $("#loadMore").parentElement.hidden=filtered.length===0||visibleLimit>=filtered.length;

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

  $("#cartItems").innerHTML=rows.map(({key,p,v,qty})=>`
    <article class="cart-item">
      <div>
        <h3>${escapeHtml(currentName(p))}</h3>
        <p class="cart-item-meta">${escapeHtml(categoryName(p.category))} · ${escapeHtml(lang==="ar"?v.sizeAr:v.sizeEn)}</p>
        <p class="cart-item-price">${money(v.price)} × ${qty}</p>
      </div>
      <div class="qty-control">
        <button type="button" data-cart-q="-1" data-key="${escapeHtml(key)}">−</button>
        <span>${qty}</span>
        <button type="button" data-cart-q="1" data-key="${escapeHtml(key)}">+</button>
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

function openProduct(id){
  const p=productById(id);
  if(!p)return;
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
  const t=UI[lang],info=infoFor(p),health=healthNoteFor(p);
  $("#productModalMark").textContent=initials(currentName(p));
  $("#productModalCategory").textContent=categoryName(p.category);
  $("#productModalTitle").textContent=currentName(p);
  $("#productModalOriginal").textContent=lang==="en"&&normalize(p.nameEn)!==normalize(p.original)?`Catalogue name: ${p.original}`:"";
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
  backdropMaybeOff();
}

function order(){
  const rows=cartRows();
  if(!rows.length)return;
  const t=UI[lang];
  const total=rows.reduce((s,r)=>s+r.qty*Number(r.v.price),0);
  const name=$("#customerName").value.trim()||"—";
  const area=$("#customerArea").value.trim()||"—";
  const notes=$("#orderNotes").value.trim()||"—";
  const lines=[
    t.orderHello,"",t.orderIntro,"",
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
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(lines.join("\n"))}`,"_blank","noopener,noreferrer");
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

function showScene(i,manual=false){
  const scenes=$$("[data-scene]"),dots=$$("[data-scene-dot]");
  if(!scenes.length)return;
  sceneIndex=(i+scenes.length)%scenes.length;
  scenes.forEach((scene,n)=>{
    const activeNow=n===sceneIndex;
    scene.classList.toggle("is-active",activeNow);
    const video=scene.querySelector("video");
    if(video){
      if(activeNow){
        const play=video.play();
        if(play&&play.catch)play.catch(()=>{});
      }else video.pause();
    }
  });
  dots.forEach((dot,n)=>dot.classList.toggle("is-active",n===sceneIndex));
  if(manual)startScenes();
}
function startScenes(){
  clearInterval(sceneTimer);
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  sceneTimer=setInterval(()=>showScene(sceneIndex+1),6500);
}

function openLanguageWelcome(){
  const modal=$("#languageWelcome");
  if(!modal||localStorage.getItem(WELCOME_KEY)==="1")return;
  modal.hidden=false;
  document.body.classList.add("welcome-open");
  requestAnimationFrame(()=>modal.classList.add("is-open"));
  const first=modal.querySelector("[data-welcome-lang]");
  setTimeout(()=>first?.focus(),120);
}
function chooseWelcomeLanguage(next){
  localStorage.setItem(WELCOME_KEY,"1");
  applyLanguage(next);
  const modal=$("#languageWelcome");
  if(!modal)return;
  modal.classList.remove("is-open");
  document.body.classList.remove("welcome-open");
  setTimeout(()=>{modal.hidden=true},320);
}

function setupNav(){
  const t=$("#navToggle"),n=$("#navLinks");
  t.addEventListener("click",()=>{
    const open=n.classList.toggle("is-open");
    document.body.classList.toggle("menu-open",open);
    t.setAttribute("aria-expanded",String(open));
  });
  $$("#navLinks a").forEach(a=>a.addEventListener("click",()=>{
    n.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    t.setAttribute("aria-expanded","false");
  }));
}

function setupProgress(){
  const update=()=>{
    const d=document.documentElement,max=d.scrollHeight-innerHeight;
    $("#pageProgress").style.width=`${max?scrollY/max*100:0}%`;
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
  $("#heroVariantCount").textContent=TOTAL_VARIANTS;
  $("#heroCategoryCount").textContent=CATEGORY_ORDER.length;
  $("#year").textContent=new Date().getFullYear();

  applyLanguage(lang);
  showScene(0);
  startScenes();
  setupNav();
  setupProgress();

  $("#productSearch").addEventListener("input",e=>{query=e.target.value;visibleLimit=PAGE_SIZE;renderProducts()});
  $("#categorySelect").addEventListener("change",e=>{activeCategory=e.target.value;visibleLimit=PAGE_SIZE;renderProducts()});
  $("#loadMore").addEventListener("click",()=>{visibleLimit+=PAGE_SIZE;renderProducts()});
  $("#clearSearch").addEventListener("click",()=>{query="";activeCategory="All";visibleLimit=PAGE_SIZE;$("#productSearch").value="";renderCategorySelect();renderProducts()});

  $("[data-lang]").forEach(btn=>btn.addEventListener("click",()=>applyLanguage(btn.dataset.lang)));
  $("[data-welcome-lang]").forEach(btn=>btn.addEventListener("click",()=>chooseWelcomeLanguage(btn.dataset.welcomeLang)));

  $("#cartButton").addEventListener("click",openCart);
  $("#cartClose").addEventListener("click",closeCart);
  $("#cartBackdrop").addEventListener("click",()=>{closeCart();closeProduct()});
  $("#cartBrowse").addEventListener("click",()=>{closeCart();location.hash="shop"});
  $("#orderForm").addEventListener("submit",e=>{e.preventDefault();order()});

  $("#productModalClose").addEventListener("click",closeProduct);
  $("#modalQtyMinus").addEventListener("click",()=>{draftQty.modal=Math.max(1,qtyFor("modal")-1);$("#productModalQty").textContent=draftQty.modal});
  $("#modalQtyPlus").addEventListener("click",()=>{draftQty.modal=qtyFor("modal")+1;$("#productModalQty").textContent=draftQty.modal});
  $("#productModalAdd").addEventListener("click",()=>{if(currentModalProduct&&currentModalVariant)addToCart(currentModalProduct,currentModalVariant,qtyFor("modal"))});

  $$("[data-scene-dot]").forEach(btn=>btn.addEventListener("click",()=>showScene(Number(btn.dataset.sceneDot),true)));

  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){closeCart();closeProduct()}
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#productSearch").focus();location.hash="shop"}
  });

  addEventListener("storage",e=>{
    if(e.key===CART_KEY){cart=loadCart();renderCart()}
    if(e.key===LANG_KEY){applyLanguage(e.newValue==="ar"?"ar":"en")}
  });

  openLanguageWelcome();
}

document.addEventListener("DOMContentLoaded",init);