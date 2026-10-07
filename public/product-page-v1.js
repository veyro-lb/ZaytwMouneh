(function(){
"use strict";
var CART_KEY="zwm-cart-v5";
var CONFIG_SRC="/admin-config.js?v=20261005-batch6";
var RECIPES=[
 {id:"mujadara",en:"Mujadara",ar:"مجدّرة",fr:"Moujadara",copyEn:"Lentils and rice pantry bundle.",copyAr:"حزمة مونة للعدس والأرز.",copyFr:"Assortiment de mouneh pour lentilles et riz.",productIds:["aadas-aarid","american-rice","kamoun-neeme","extra-virgin-olive-oil"]},
 {id:"manoushe",en:"Za’atar manoushe",ar:"منقوشة زعتر",fr:"Man’ouché au zaatar",copyEn:"Za’atar, olive oil, flour and yeast pantry bundle.",copyAr:"حزمة الزعتر وزيت الزيتون والطحين والخميرة.",copyFr:"Zaatar, huile d’olive, farine et levure.",productIds:["zaatar-manakish","extra-virgin-olive-oil","all-use-flour","yeast"]},
 {id:"fattoush",en:"Fattoush",ar:"فتّوش",fr:"Fattouche",copyEn:"Sumac, pomegranate molasses and olive oil pantry bundle.",copyAr:"حزمة السماق ودبس الرمان وزيت الزيتون.",copyFr:"Sumac, mélasse de grenade et huile d’olive.",productIds:["semaq","debes-el-remen","extra-virgin-olive-oil"]},
 {id:"hummus",en:"Hummus",ar:"حمّص بطحينة",fr:"Houmous",copyEn:"Chickpeas, tahini, olive oil and cumin pantry bundle.",copyAr:"حزمة الحمص والطحينة وزيت الزيتون والكمون.",copyFr:"Pois chiches, tahini, huile d’olive et cumin.",productIds:["humus-baladi","tahini","extra-virgin-olive-oil","kamoun-neeme"]},
 {id:"tabbouleh",en:"Tabbouleh",ar:"تبّولة",fr:"Taboulé",copyEn:"Fine bulgur, olive oil and sea salt pantry bundle.",copyAr:"حزمة البرغل الناعم وزيت الزيتون والملح البحري.",copyFr:"Boulgour fin, huile d’olive et sel marin.",productIds:["burglur-asmar-neeme","extra-virgin-olive-oil","sea-salt"]},
 {id:"kibbeh",en:"Kibbeh",ar:"كبّة",fr:"Kebbé",copyEn:"Fine bulgur and kibbeh spice pantry bundle.",copyAr:"حزمة البرغل الناعم ودقّة الكبة.",copyFr:"Boulgour fin et épices à kebbé.",productIds:["burglur-asmar-neeme","daqet-el-kebbe-nehme","sabaa-bharat","extra-virgin-olive-oil"]}
];
var COPY={
 en:{
  language:"Language",shop:"Shop",gifts:"Gifts",recipes:"Recipes",about:"About",account:"Account",terms:"Terms",privacy:"Privacy",back:"Shop",pantry:"My pantry",
  category:"Pantry product",size:"Choose size",qty:"Quantity",add:"Add to pantry",unavailable:"Not currently orderable",
  verified:"Verified purchase reviews",verifiedCopy:"Only reviews tied to delivered purchases are shown here.",noReviews:"No verified reviews yet.",
  facts:"Product details",factsNote:"Product facts are shown only where Zayt w Mouneh has supplied or configured them. Missing facts are not guessed.",
  origin:"Origin",ingredients:"Ingredients",storage:"Storage",allergens:"Allergens",details:"Details",
  payment:"Accepted payment",delivery:"Delivery estimate",deliveryPlaceholder:"Enter your area",estimate:"Check",deliveryUnknown:"Enter your area at checkout to see the delivery amount currently applied to your order. Delivery timing may not be available for every area.",
  freeAbove:"Free delivery threshold",eta:"Estimated delivery",fee:"Delivery fee",free:"Free",
  related:"Related products",relatedCopy:"More products from the same catalogue category.",
  recipe:"Related recipes",recipeCopy:"Recipes that use this exact pantry item.",viewRecipe:"Open recipes",
  bundle:"Smart pantry bundle",bundleRecipe:"Add the pantry ingredients for this recipe in one click. Fresh ingredients are not added.",bundleCategory:"A transparent same-category set using current catalogue products; no discount is assumed.",addBundle:"Add bundle to pantry",
  alertTitle:"Back-in-stock alert",alertCopy:"Join the request list for this product. Contact details stay private and are not shown publicly.",email:"Email",whatsapp:"WhatsApp",contact:"Contact",notify:"Save alert request",saved:"Alert request saved.",duplicate:"You are already on the pending list for this product.",error:"Could not save the request. Please try again.",
  verifiedCustomer:"Verified customer",share:"Share",copied:"Link copied",added:"Added to your pantry.",notFound:"Product not found",notFoundCopy:"This product link may be outdated or the item may no longer be in the active catalogue.",allProducts:"Browse all products",
  in_stock:"In stock",low_stock:"Low stock",seasonal:"Seasonal",available_on_request:"Available on request",out_of_stock:"Out of stock",coming_soon:"Coming soon",
  paymentCod:"Cash on Delivery",paymentNote:"Pay when your order arrives.",from:"From"
 },
 ar:{
  language:"اللغة",shop:"المتجر",gifts:"الهدايا",recipes:"الوصفات",about:"من نحن",account:"الحساب",terms:"الشروط",privacy:"الخصوصية",back:"المتجر",pantry:"سلّتي",
  category:"منتج من المونة",size:"اختر الحجم",qty:"الكمية",add:"أضف إلى السلة",unavailable:"غير متاح للطلب حالياً",
  verified:"مراجعات شراء موثّقة",verifiedCopy:"تظهر هنا فقط المراجعات المرتبطة بطلبات تم تسليمها.",noReviews:"لا توجد مراجعات موثّقة بعد.",
  facts:"تفاصيل المنتج",factsNote:"لا نعرض إلا معلومات المنتج التي وفّرتها أو أعدّتها زيت ومونة. لا يتم تخمين المعلومات الناقصة.",
  origin:"المنشأ",ingredients:"المكونات",storage:"الحفظ",allergens:"مسببات الحساسية",details:"التفاصيل",
  payment:"طرق الدفع المقبولة",delivery:"تقدير التوصيل",deliveryPlaceholder:"اكتب منطقتك",estimate:"تحقق",deliveryUnknown:"أدخل منطقتك عند إتمام الطلب لعرض قيمة التوصيل المطبّقة حالياً على طلبك. قد لا يتوفر وقت توصيل مقدّر لكل منطقة.",
  freeAbove:"حد التوصيل المجاني",eta:"مدة التوصيل المتوقعة",fee:"رسم التوصيل",free:"مجاني",
  related:"منتجات مرتبطة",relatedCopy:"منتجات أخرى من الفئة نفسها في الكتالوج.",
  recipe:"وصفات مرتبطة",recipeCopy:"وصفات تستخدم هذا المنتج تحديداً.",viewRecipe:"افتح الوصفات",
  bundle:"حزمة مونة ذكية",bundleRecipe:"أضف مكونات المونة لهذه الوصفة بنقرة واحدة. لا تتم إضافة المكونات الطازجة.",bundleCategory:"تشكيلة واضحة من الفئة نفسها باستخدام منتجات وأسعار الكتالوج الحالية، من دون افتراض أي خصم.",addBundle:"أضف الحزمة إلى السلة",
  alertTitle:"تنبيه عند عودة التوفر",alertCopy:"سجّل طلب تنبيه لهذا المنتج. تبقى بيانات التواصل خاصة ولا تظهر للعامة.",email:"البريد الإلكتروني",whatsapp:"واتساب",contact:"بيانات التواصل",notify:"احفظ طلب التنبيه",saved:"تم حفظ طلب التنبيه.",duplicate:"أنت مسجّل بالفعل في قائمة الانتظار لهذا المنتج.",error:"تعذّر حفظ الطلب. حاول مرة أخرى.",
  verifiedCustomer:"عميل شراء موثّق",share:"مشاركة",copied:"تم نسخ الرابط",added:"تمت الإضافة إلى السلة.",notFound:"المنتج غير موجود",notFoundCopy:"قد يكون رابط المنتج قديماً أو أن المنتج لم يعد ضمن الكتالوج النشط.",allProducts:"تصفّح كل المنتجات",
  in_stock:"متوفر",low_stock:"مخزون منخفض",seasonal:"موسمي",available_on_request:"متوفر عند الطلب",out_of_stock:"غير متوفر",coming_soon:"قريباً",
  paymentCod:"الدفع عند الاستلام",paymentNote:"ادفع عند وصول طلبك.",from:"ابتداءً من"
 },
 fr:{
  language:"Langue",shop:"Boutique",gifts:"Cadeaux",recipes:"Recettes",about:"À propos",account:"Compte",terms:"Conditions",privacy:"Confidentialité",back:"Boutique",pantry:"Mon panier",
  category:"Produit de la mouneh",size:"Choisir le format",qty:"Quantité",add:"Ajouter au panier",unavailable:"Non commandable actuellement",
  verified:"Avis d’achat vérifié",verifiedCopy:"Seuls les avis liés à des commandes livrées sont affichés ici.",noReviews:"Aucun avis vérifié pour le moment.",
  facts:"Détails du produit",factsNote:"Les informations produit ne sont affichées que lorsqu’elles ont été fournies ou configurées par Zayt w Mouneh. Rien n’est inventé.",
  origin:"Origine",ingredients:"Ingrédients",storage:"Conservation",allergens:"Allergènes",details:"Détails",
  payment:"Paiement accepté",delivery:"Estimation de livraison",deliveryPlaceholder:"Saisissez votre zone",estimate:"Vérifier",deliveryUnknown:"Indiquez votre zone lors du paiement pour voir le montant de livraison actuellement appliqué à votre commande. Un délai de livraison peut ne pas être disponible pour toutes les zones.",
  freeAbove:"Seuil de livraison gratuite",eta:"Délai estimé",fee:"Frais de livraison",free:"Gratuite",
  related:"Produits associés",relatedCopy:"Autres produits de la même catégorie du catalogue.",
  recipe:"Recettes associées",recipeCopy:"Recettes utilisant exactement ce produit.",viewRecipe:"Voir les recettes",
  bundle:"Assortiment intelligent",bundleRecipe:"Ajoutez en un clic les ingrédients de mouneh de cette recette. Les produits frais ne sont pas ajoutés.",bundleCategory:"Assortiment transparent de la même catégorie, basé sur le catalogue actuel, sans remise supposée.",addBundle:"Ajouter l’assortiment",
  alertTitle:"Alerte retour en stock",alertCopy:"Inscrivez une demande d’alerte pour ce produit. Vos coordonnées restent privées.",email:"E-mail",whatsapp:"WhatsApp",contact:"Coordonnée",notify:"Enregistrer l’alerte",saved:"Demande d’alerte enregistrée.",duplicate:"Vous êtes déjà sur la liste d’attente pour ce produit.",error:"Impossible d’enregistrer la demande. Réessayez.",
  verifiedCustomer:"Client vérifié",share:"Partager",copied:"Lien copié",added:"Ajouté au panier.",notFound:"Produit introuvable",notFoundCopy:"Ce lien produit peut être ancien ou l’article peut ne plus figurer au catalogue actif.",allProducts:"Voir tous les produits",
  in_stock:"En stock",low_stock:"Stock faible",seasonal:"Saisonnier",available_on_request:"Disponible sur demande",out_of_stock:"Rupture de stock",coming_soon:"Bientôt disponible",
  paymentCod:"Paiement à la livraison",paymentNote:"Payez à la réception de votre commande.",from:"À partir de"
 }
};
var state={locale:"en",product:null,settings:{},reviews:[],selectedVariant:null,qty:1,products:[]};
function qs(s,r){return (r||document).querySelector(s)}
function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function money(v){return "$"+Number(v||0).toFixed(2)}
function locale(){
 try{
  if(window.ZWM_LOCALE&&window.ZWM_LOCALE.get)return window.ZWM_LOCALE.get();
  return localStorage.getItem("zwm-locale-v3")|| (localStorage.getItem("zwm-lang-v2")==="ar"?"ar":"en");
 }catch(e){return "en"}
}
function t(k){return (COPY[state.locale]&&COPY[state.locale][k])||COPY.en[k]||k}
function localePrefix(code){return code==="ar"?"/ar":code==="fr"?"/fr":""}
function productPath(id,code){return localePrefix(code||state.locale||locale())+"/product/"+encodeURIComponent(id)}
function productUrl(id,code){return location.origin+productPath(id,code)}
function setLocale(code){
 code=code==="ar"?"ar":code==="fr"?"fr":"en";
 try{
  if(window.ZWM_LOCALE&&window.ZWM_LOCALE.set)window.ZWM_LOCALE.set(code);
  else{
   localStorage.setItem("zwm-lang-v2",code==="ar"?"ar":"en");
   if(code==="fr")localStorage.setItem("zwm:french:v1","1");else localStorage.removeItem("zwm:french:v1");
  }
 }catch(e){}
 if(state.product){location.assign(productPath(state.product.id,code)+(location.hash||""));return}
 location.reload();
}
function productName(p){
 if(state.locale==="ar")return p.nameAr||p.nameEn||p.id;
 if(state.locale==="fr"){
  if(p.nameFr)return p.nameFr;
  if(window.ZWM_FR_TRANSLATE)return window.ZWM_FR_TRANSLATE(p.nameEn||p.id);
 }
 return p.nameEn||p.nameAr||p.id;
}
function sizeName(v){
 if(state.locale==="ar")return v.sizeAr||v.sizeEn||"";
 if(state.locale==="fr"&&v.sizeFr)return v.sizeFr;
 return v.sizeEn||v.sizeAr||"";
}
function valueFor(p,key){
 var keys={
  origin:{en:["originEn","origin","sourceEn","source"],ar:["originAr","sourceAr","origin","source"],fr:["originFr","sourceFr","originEn","origin","sourceEn","source"]},
  ingredients:{en:["ingredientsEn","ingredients"],ar:["ingredientsAr","ingredients"],fr:["ingredientsFr","ingredientsEn","ingredients"]},
  storage:{en:["storageEn","storage"],ar:["storageAr","storage"],fr:["storageFr","storageEn","storage"]},
  allergens:{en:["allergensEn","allergens"],ar:["allergensAr","allergens"],fr:["allergensFr","allergensEn","allergens"]},
  details:{en:["descriptionEn","detailsEn","description","details"],ar:["descriptionAr","detailsAr","description","details"],fr:["descriptionFr","detailsFr","descriptionEn","detailsEn","description","details"]}
 };
 var list=(keys[key]&&keys[key][state.locale])||[];
 for(var i=0;i<list.length;i++){
  var v=p[list[i]];
  if(Array.isArray(v)&&v.length)return v.join(" · ");
  if(v&&typeof v==="object")continue;
  if(String(v||"").trim())return String(v).trim();
 }
 return "";
}
function availability(p){
 var v=String(p.availability||"in_stock").trim().toLowerCase();
 return ["in_stock","low_stock","seasonal","available_on_request","out_of_stock","coming_soon"].indexOf(v)>=0?v:"in_stock";
}
function isOrderable(p){return availability(p)==="in_stock"}
function slug(){
 var path=location.pathname.replace(/\/+$/,"");
 var m=path.match(/\/product\/([^/]+)$/);
 if(m)return decodeURIComponent(m[1]);
 return new URL(location.href).searchParams.get("slug")||new URL(location.href).searchParams.get("product")||"";
}
async function ensureConfig(){
 if(window.ZWM_CMS_CONFIG)return window.ZWM_CMS_CONFIG;
 await new Promise(function(resolve){var s=document.createElement("script");s.src=CONFIG_SRC;s.onload=resolve;s.onerror=resolve;document.head.appendChild(s)});
 return window.ZWM_CMS_CONFIG||{};
}
async function rest(path,options){
 var c=await ensureConfig();
 if(!c.supabaseUrl||!c.supabasePublishableKey)throw new Error("Store service unavailable");
 var opts=options||{};opts.headers=Object.assign({"apikey":c.supabasePublishableKey,"Content-Type":"application/json"},opts.headers||{});
 var r=await fetch(String(c.supabaseUrl).replace(/\/$/,"")+"/rest/v1/"+path,opts);
 if(!r.ok){var body="";try{body=await r.text()}catch(e){};var err=new Error(body||("Request failed "+r.status));err.status=r.status;throw err}
 if(r.status===204)return null;
 var tx=await r.text();return tx?JSON.parse(tx):null;
}
async function loadData(){
 state.locale=locale();document.documentElement.lang=state.locale;document.documentElement.dir=state.locale==="ar"?"rtl":"ltr";
 state.products=typeof PRODUCTS_DATA!=="undefined"?JSON.parse(JSON.stringify(PRODUCTS_DATA)):[];
 var requestedId=slug();
 var id=(window.ZWM_PRODUCT_ALIASES&&window.ZWM_PRODUCT_ALIASES[requestedId])||requestedId;
 try{
  var overrides=await rest("product_overrides?select=product_id,action,payload");
  var byOverride=new Map((overrides||[]).map(function(row){return [row.product_id,row]}));
  state.products=state.products.map(function(p){
   var row=byOverride.get(p.id);if(!row)return p;
   if(row.action==="hide")return null;
   return Object.assign({},p,row.payload||{}, {id:p.id});
  }).filter(Boolean);
 }catch(e){}
 var base=state.products.find(function(p){return p.id===id});
 if(!base){renderNotFound();return}
 state.product=base;
 state.selectedVariant=(base.variants||[])[0]||null;
 try{
  var settings=await rest("site_settings?select=key,value&key=in.(commerce,delivery,contact)");
  (settings||[]).forEach(function(row){state.settings[row.key]=row.value||{}});
 }catch(e){}
 try{state.reviews=await rest("storefront_reviews?select=id,product_id,rating,body,created_at,verified_purchase&product_id=eq."+encodeURIComponent(id)+"&verified_purchase=eq.true&order=created_at.desc&limit=50")||[]}catch(e){state.reviews=[]}
 render();
}
function canonical(){
 return productUrl(state.product.id,state.locale);
}
function setMeta(selector,attrs){
 var el=qs(selector);
 if(!el){el=document.createElement("meta");document.head.appendChild(el)}
 Object.keys(attrs).forEach(function(k){el.setAttribute(k,attrs[k])});
 return el;
}
function setAlternate(hreflang,href){
 var el=qs('link[rel="alternate"][hreflang="'+hreflang+'"]');
 if(!el){el=document.createElement("link");el.rel="alternate";el.hreflang=hreflang;document.head.appendChild(el)}
 el.href=href;
}
function updateSeo(){
 var p=state.product,name=productName(p),variants=p.variants||[],min=variants.length?Math.min.apply(null,variants.map(function(v){return Number(v.price)||0})):0;
 var title=name+" | Zayt w Mouneh";
 var desc=state.locale==="ar"?"تسوّق "+name+" من زيت ومونة. الأحجام والأسعار الحالية من الكتالوج.":state.locale==="fr"?"Achetez "+name+" chez Zayt w Mouneh. Formats et prix actuels du catalogue.":"Shop "+name+" at Zayt w Mouneh. Current catalogue sizes and prices.";
 document.title=title;
 var md=qs('meta[name="description"]');if(md)md.content=desc;
 var robots=qs('meta[name="robots"]');if(robots)robots.content="index,follow,max-image-preview:large";
 var can=qs('link[rel="canonical"]');if(can)can.href=canonical();
 else{can=document.createElement("link");can.rel="canonical";can.href=canonical();document.head.appendChild(can)}
 history.replaceState({},title,productPath(p.id,state.locale)+(location.hash||""));
 setAlternate("en-LB",productUrl(p.id,"en"));
 setAlternate("ar-LB",productUrl(p.id,"ar"));
 setAlternate("fr-LB",productUrl(p.id,"fr"));
 setAlternate("x-default",productUrl(p.id,"en"));
 setMeta('meta[property="og:title"]',{property:"og:title",content:title});
 setMeta('meta[property="og:description"]',{property:"og:description",content:desc});
 setMeta('meta[property="og:type"]',{property:"og:type",content:"product"});
 setMeta('meta[property="og:url"]',{property:"og:url",content:canonical()});
 setMeta('meta[property="og:locale"]',{property:"og:locale",content:state.locale==="ar"?"ar_LB":state.locale==="fr"?"fr_LB":"en_LB"});
 setMeta('meta[name="twitter:card"]',{name:"twitter:card",content:"summary_large_image"});
 setMeta('meta[name="twitter:title"]',{name:"twitter:title",content:title});
 setMeta('meta[name="twitter:description"]',{name:"twitter:description",content:desc});
 var ld={"@context":"https://schema.org","@type":"Product","name":name,"sku":p.id,"category":p.category||undefined,"url":canonical()};
 var photo=window.ZWM_PRODUCT_PHOTOS&&window.ZWM_PRODUCT_PHOTOS.sourceFor?window.ZWM_PRODUCT_PHOTOS.sourceFor(p.id):null;
 if(photo&&photo.url){
  var photoUrl=new URL(photo.url,location.origin).href;ld.image=[photoUrl];
  var ogImage=setMeta('meta[property="og:image"]',{property:"og:image",content:photoUrl});ogImage.setAttribute("data-zwm-product-image","1");
  if(photo.width)setMeta('meta[property="og:image:width"]',{property:"og:image:width",content:String(photo.width)});
  if(photo.height)setMeta('meta[property="og:image:height"]',{property:"og:image:height",content:String(photo.height)});
  setMeta('meta[property="og:image:alt"]',{property:"og:image:alt",content:name});
  setMeta('meta[name="twitter:image"]',{name:"twitter:image",content:photoUrl});
 }
 if(variants.length){
  var av=availability(p);
  ld.offers=variants.map(function(v){
   var offer={"@type":"Offer","priceCurrency":"USD","price":Number(v.price).toFixed(2),"url":canonical()};
   if(av==="in_stock")offer.availability="https://schema.org/InStock";
   else if(av==="low_stock")offer.availability="https://schema.org/LimitedAvailability";
   else if(av==="out_of_stock")offer.availability="https://schema.org/OutOfStock";
   return offer;
  });
 }
 if(state.reviews.length){
  var avg=state.reviews.reduce(function(s,r){return s+Number(r.rating||0)},0)/state.reviews.length;
  ld.aggregateRating={"@type":"AggregateRating","ratingValue":avg.toFixed(1),"reviewCount":state.reviews.length};
  ld.review=state.reviews.slice(0,10).map(function(r){return {"@type":"Review","author":{"@type":"Person","name":t("verifiedCustomer")},"reviewRating":{"@type":"Rating","ratingValue":r.rating,"bestRating":5},"reviewBody":r.body,"datePublished":String(r.created_at||"").slice(0,10)}});
 }
 var script=qs("#c6ProductSchema");if(!script){script=document.createElement("script");script.type="application/ld+json";script.id="c6ProductSchema";document.head.appendChild(script)}script.textContent=JSON.stringify(ld);
 document.dispatchEvent(new CustomEvent("zwm:seo-refresh"));
}
function photoMarkup(p){
 var source=window.ZWM_PRODUCT_PHOTOS&&window.ZWM_PRODUCT_PHOTOS.sourceFor?window.ZWM_PRODUCT_PHOTOS.sourceFor(p.id):null;
 if(source&&source.url)return '<img src="'+esc(source.url)+'" width="'+esc(source.width||700)+'" height="'+esc(source.height||700)+'" alt="'+esc(productName(p))+'">';
 return '<div class="c6-product-placeholder" aria-hidden="true">'+esc((productName(p)||"ZW").slice(0,2).toUpperCase())+'</div>';
}
function factsMarkup(p){
 var fields=[["origin",t("origin")],["ingredients",t("ingredients")],["storage",t("storage")],["allergens",t("allergens")],["details",t("details")]];
 var rows=fields.map(function(x){var v=valueFor(p,x[0]);return v?'<div class="c6-info-card"><span>'+esc(x[1])+'</span><p>'+esc(v)+'</p></div>':""}).join("");
 if(!rows)return '<p class="c6-data-note">'+esc(t("factsNote"))+'</p>';
 return '<div class="c6-info-grid">'+rows+'</div><p class="c6-data-note">'+esc(t("factsNote"))+'</p>';
}
function paymentMarkup(){
 var methods=(state.settings.commerce&&state.settings.commerce.payment_methods)||[];
 methods=methods.filter(function(m){return m&&m.enabled!==false});
 if(!methods.length)methods=[{id:"cash_on_delivery",label_en:t("paymentCod"),label_ar:t("paymentCod"),label_fr:t("paymentCod")}];
 return methods.map(function(m){var label=state.locale==="ar"?(m.label_ar||m.label_en):state.locale==="fr"?(m.label_fr||m.label_en):(m.label_en||m.id);return '<strong>'+esc(label)+'</strong>'}).join("");
}
function deliveryMarkup(){
 var d=state.settings.delivery||{},freeAbove=Number(d.freeAbove)||0;
 return '<div class="c6-service-card"><strong>'+esc(t("delivery"))+'</strong><p id="c6DeliveryResult">'+esc(t("deliveryUnknown"))+'</p><div class="c6-estimator"><input id="c6Area" type="text" aria-label="'+esc(t("deliveryPlaceholder"))+'" placeholder="'+esc(t("deliveryPlaceholder"))+'" autocomplete="address-level2"><button class="c6-button is-secondary" type="button" id="c6Estimate">'+esc(t("estimate"))+'</button></div>'+(freeAbove>0?'<p>'+esc(t("freeAbove"))+': <b>'+money(freeAbove)+'</b></p>':"")+'</div>';
}
function variantsMarkup(p){
 var vars=p.variants||[];
 if(!vars.length)return "";
 return vars.map(function(v,i){return '<option value="'+esc(v.id)+'"'+(i===0?" selected":"")+'>'+esc(sizeName(v))+' · '+money(v.price)+'</option>'}).join("");
}
function relatedProducts(){
 var p=state.product,rows=state.products.filter(function(x){return x.id!==p.id&&x.category===p.category}).slice(0,4);
 if(!rows.length)return "";
 return '<section class="c6-section is-soft"><div class="c6-shell"><div class="c6-section-head"><div><p class="c6-eyebrow">'+esc(t("related"))+'</p><h2>'+esc(t("related"))+'</h2><p>'+esc(t("relatedCopy"))+'</p></div></div><div class="c6-related-grid">'+rows.map(function(x){var min=(x.variants||[]).length?Math.min.apply(null,x.variants.map(function(v){return Number(v.price)||0})):0;return '<a class="c6-related-card" href="'+productPath(x.id,state.locale)+'">'+photoMarkup(x)+'<strong>'+esc(productName(x))+'</strong><small>'+esc(t("from"))+' '+money(min)+'</small></a>'}).join("")+'</div></div></section>';
}
function recipeRows(){
 var id=state.product.id;return RECIPES.filter(function(r){return r.productIds.indexOf(id)>=0});
}
function recipeMarkup(){
 var rows=recipeRows();if(!rows.length)return "";
 return '<section class="c6-section"><div class="c6-shell"><div class="c6-section-head"><div><p class="c6-eyebrow">'+esc(t("recipe"))+'</p><h2>'+esc(t("recipe"))+'</h2><p>'+esc(t("recipeCopy"))+'</p></div></div><div class="c6-recipe-grid">'+rows.map(function(r){var name=state.locale==="ar"?r.ar:state.locale==="fr"?r.fr:r.en;var copy=state.locale==="ar"?r.copyAr:state.locale==="fr"?r.copyFr:r.copyEn;return '<article class="c6-recipe-card"><h3>'+esc(name)+'</h3><p>'+esc(copy)+'</p><a href="'+localePrefix(state.locale)+'/recipes#recipes">'+esc(t("viewRecipe"))+' →</a></article>'}).join("")+'</div></div></section>';
}
function bundleData(){
 var rec=recipeRows()[0];
 if(rec){
  var products=rec.productIds.map(function(id){return state.products.find(function(p){return p.id===id})}).filter(function(p){return !!p&&isOrderable(p)&&cheapest(p)});
  return {type:"recipe",products:products,title:(state.locale==="ar"?rec.ar:state.locale==="fr"?rec.fr:rec.en)};
 }
 var same=state.products.filter(function(x){return x.category===state.product.category&&x.id!==state.product.id&&isOrderable(x)&&cheapest(x)}).slice(0,2);
 var lead=isOrderable(state.product)&&cheapest(state.product)?[state.product]:[];
 return {type:"category",products:lead.concat(same),title:state.product.category||t("bundle")};
}
function bundleMarkup(){
 var b=bundleData();if(b.products.length<2)return "";
 var total=b.products.reduce(function(s,p){var vs=p.variants||[];if(!vs.length)return s;return s+Math.min.apply(null,vs.map(function(v){return Number(v.price)||0}))},0);
 return '<section class="c6-section"><div class="c6-shell"><div class="c6-bundle"><p class="c6-eyebrow">'+esc(t("bundle"))+'</p><h2>'+esc(b.title)+'</h2><p>'+esc(b.type==="recipe"?t("bundleRecipe"):t("bundleCategory"))+'</p><div class="c6-bundle-items">'+b.products.map(function(p){return '<span>'+esc(productName(p))+'</span>'}).join("")+'</div><button class="c6-button" id="c6AddBundle" type="button">'+esc(t("addBundle"))+' · '+money(total)+'</button></div></div></section>';
}
function reviewsMarkup(){
 var rows=state.reviews||[];
 if(!rows.length)return '<section class="c6-section is-soft"><div class="c6-shell"><div class="c6-section-head"><div><p class="c6-eyebrow">'+esc(t("verified"))+'</p><h2>'+esc(t("verified"))+'</h2><p>'+esc(t("verifiedCopy"))+'</p></div></div><p>'+esc(t("noReviews"))+'</p></div></section>';
 var avg=rows.reduce(function(s,r){return s+Number(r.rating||0)},0)/rows.length;
 return '<section class="c6-section is-soft"><div class="c6-shell"><div class="c6-section-head"><div><p class="c6-eyebrow">'+esc(t("verified"))+'</p><h2>'+esc(t("verified"))+'</h2><p>'+esc(t("verifiedCopy"))+'</p></div><div class="c6-reviews-summary"><span class="c6-rating-number">'+avg.toFixed(1)+'</span><div><div class="c6-stars">★★★★★</div><small>'+rows.length+' '+esc(t("verified"))+'</small></div></div></div><div class="c6-review-list">'+rows.map(function(r){var date="";try{date=new Date(r.created_at).toLocaleDateString(state.locale==="ar"?"ar-LB":state.locale==="fr"?"fr-LB":"en-LB")}catch(e){};return '<article class="c6-review"><div class="c6-review-top"><strong>'+esc(t("verifiedCustomer"))+' · '+esc(String(r.rating))+'/5</strong><small>'+esc(date)+'</small></div><p>'+esc(r.body)+'</p></article>'}).join("")+'</div></div></section>';
}
function alertMarkup(p){
 var a=availability(p);if(a!=="out_of_stock"&&a!=="coming_soon")return "";
 if(state.settings.commerce&&state.settings.commerce.back_in_stock_enabled===false)return "";
 return '<div class="c6-alert"><strong>'+esc(t("alertTitle"))+'</strong><p>'+esc(t("alertCopy"))+'</p><form id="c6AlertForm"><select name="channel" aria-label="'+esc(t("contact"))+'"><option value="email">'+esc(t("email"))+'</option><option value="whatsapp">'+esc(t("whatsapp"))+'</option></select><input name="contact" required aria-label="'+esc(t("contact"))+'" placeholder="'+esc(t("contact"))+'" maxlength="254"><button class="c6-button" type="submit">'+esc(t("notify"))+'</button></form><span id="c6AlertStatus" class="c6-status" role="status"></span></div>';
}
function render(){
 var p=state.product;if(!p)return;
 updateSeo();
 var min=(p.variants||[]).length?Math.min.apply(null,p.variants.map(function(v){return Number(v.price)||0})):0;
 var av=availability(p),badgeClass=av==="out_of_stock"||av==="coming_soon"?" is-unavailable":av==="low_stock"?" is-low":"";
 qs("#c6ProductRoot").innerHTML=
 '<main class="c6-product-main"><div class="c6-shell"><nav class="c6-breadcrumb"><a href="'+localePrefix(state.locale)+'/shop">'+esc(t("back"))+'</a><span>›</span><span>'+esc(productName(p))+'</span></nav><div class="c6-product-grid"><div class="c6-product-visual">'+photoMarkup(p)+'</div><div class="c6-product-copy"><p class="c6-eyebrow">'+esc(p.category||t("category"))+'</p><h1 class="c6-product-title">'+esc(productName(p))+'</h1>'+(p.original?'<p class="c6-original">'+esc(p.original)+'</p>':"")+'<div class="c6-badges"><span class="c6-badge'+badgeClass+'">'+esc(t(av))+'</span></div><div class="c6-price">'+esc(t("from"))+' '+money(min)+'</div><div class="c6-purchase-box"><div class="c6-purchase-row"><label class="c6-field"><span>'+esc(t("size"))+'</span><select id="c6Variant">'+variantsMarkup(p)+'</select></label><label class="c6-field"><span>'+esc(t("qty"))+'</span><input id="c6Qty" type="number" min="1" max="99" value="1"></label></div><div class="c6-purchase-actions"><button class="c6-button" id="c6Add" type="button"'+(isOrderable(p)?"":" disabled")+'>'+esc(isOrderable(p)?t("add"):t("unavailable"))+'</button><button class="c6-button is-secondary" id="c6Share" type="button">'+esc(t("share"))+'</button></div>'+alertMarkup(p)+'</div><div style="margin-top:25px"><p class="c6-eyebrow">'+esc(t("facts"))+'</p>'+factsMarkup(p)+'</div><div class="c6-service-grid"><div class="c6-service-card"><strong>'+esc(t("payment"))+'</strong><div style="margin-top:7px">'+paymentMarkup()+'</div><p>'+esc(t("paymentNote"))+'</p></div>'+deliveryMarkup()+'</div></div></div></div></main>'+
 bundleMarkup()+recipeMarkup()+relatedProducts()+reviewsMarkup();
 bind();
 updateCartCount();
}
function renderNotFound(){
 state.locale=locale();document.documentElement.lang=state.locale;document.documentElement.dir=state.locale==="ar"?"rtl":"ltr";
 qs("#c6ProductRoot").innerHTML='<main class="c6-product-main"><div class="c6-shell"><div class="c6-purchase-box" style="max-width:720px;margin:70px auto;text-align:center"><h1 class="c6-product-title">'+esc(t("notFound"))+'</h1><p>'+esc(t("notFoundCopy"))+'</p><a class="c6-button" href="'+localePrefix(state.locale)+'/shop">'+esc(t("allProducts"))+'</a></div></div></main>';
}
function readCart(){try{return JSON.parse(localStorage.getItem(CART_KEY)||"{}")||{}}catch(e){return {}}}
function writeCart(cart){try{localStorage.setItem(CART_KEY,JSON.stringify(cart));window.dispatchEvent(new Event("zwm:cart-updated"))}catch(e){}}
function addProduct(p,v,qty){
 if(!p||!v)return false;
 var cart=readCart(),key=p.id+"::"+v.id,old=cart[key]&&Number(cart[key].qty)||0;
 cart[key]={productId:p.id,variantId:v.id,qty:Math.min(99,Math.max(1,old+Math.max(1,Number(qty)||1)))};
 writeCart(cart);updateCartCount();return true;
}
function updateCartCount(){
 var cart=readCart(),n=Object.keys(cart).reduce(function(s,k){return s+(Number(cart[k].qty)||0)},0),el=qs("#c6CartCount");if(el)el.textContent=String(n);
}
function cheapest(p){return (p.variants||[]).slice().sort(function(a,b){return Number(a.price)-Number(b.price)})[0]||null}
function toast(msg){var el=qs("#c6Toast");if(!el)return;el.textContent=msg;el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(function(){el.hidden=true},2200)}
function estimateDelivery(){
 var out=qs("#c6DeliveryResult"),area=(qs("#c6Area")||{}).value||"",d=state.settings.delivery||{},zones=Array.isArray(d.zones)?d.zones:[];
 if(!area.trim()||(!zones.length&&d.fee==null&&d.eta==null)){out.textContent=t("deliveryUnknown");return}
 var amount=state.selectedVariant?Number(state.selectedVariant.price)*state.qty:0,normalized=area.trim().toLowerCase();
 var zone=zones.find(function(z){var key=String(z.area||"").trim().toLowerCase();return key&&(normalized.indexOf(key)>=0||key.indexOf(normalized)>=0)});
 if(zones.length&&!zone){out.textContent=t("deliveryUnknown");return}
 var fee=Number((zone&&zone.fee)!=null?zone.fee:d.fee)||0,freeAbove=Number(d.freeAbove)||0;if(freeAbove>0&&amount>=freeAbove)fee=0;
 var eta=String((zone&&zone.eta)||d.eta||"").trim(),parts=[t("fee")+": "+(fee===0?t("free"):money(fee))];if(eta)parts.push(t("eta")+": "+eta);out.textContent=parts.join(" · ");
}
async function submitAlert(e){
 e.preventDefault();var form=e.currentTarget,status=qs("#c6AlertStatus"),data=new FormData(form),channel=String(data.get("channel")||"email"),contact=String(data.get("contact")||"").trim();
 status.textContent="";
 if(!contact)return;
 var btn=form.querySelector("button");btn.disabled=true;
 try{
  await rest("back_in_stock_requests",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({product_id:state.product.id,channel:channel,contact_value:contact,locale:state.locale,status:"pending",source:"product_page"})});
  status.textContent=t("saved");form.reset();
 }catch(err){status.textContent=err&&err.status===409?t("duplicate"):t("error")}
 finally{btn.disabled=false}
}
function bind(){
 var sel=qs("#c6Variant");if(sel){sel.addEventListener("change",function(){state.selectedVariant=(state.product.variants||[]).find(function(v){return v.id===sel.value})||state.selectedVariant})}
 var qty=qs("#c6Qty");if(qty){qty.addEventListener("change",function(){state.qty=Math.max(1,Math.min(99,Number(qty.value)||1));qty.value=state.qty})}
 var add=qs("#c6Add");if(add)add.addEventListener("click",function(){if(isOrderable(state.product)&&addProduct(state.product,state.selectedVariant,state.qty))toast(t("added"))});
 var share=qs("#c6Share");if(share)share.addEventListener("click",async function(){var url=canonical();try{if(navigator.share){await navigator.share({title:productName(state.product),url:url})}else{await navigator.clipboard.writeText(url);toast(t("copied"))}}catch(e){}});
 var est=qs("#c6Estimate");if(est)est.addEventListener("click",estimateDelivery);
 var alert=qs("#c6AlertForm");if(alert)alert.addEventListener("submit",submitAlert);
 var bundle=qs("#c6AddBundle");if(bundle)bundle.addEventListener("click",function(){var b=bundleData(),added=0;b.products.forEach(function(p){if(isOrderable(p)){var v=cheapest(p);if(v&&addProduct(p,v,1))added++}});if(added)toast(t("added"))});
}
function bindHeader(){
 var btn=qs("#c6LanguageButton"),menu=qs("#c6LanguageMenu");if(btn&&menu){btn.addEventListener("click",function(){menu.hidden=!menu.hidden;btn.setAttribute("aria-expanded",String(!menu.hidden))});qsa("[data-c6-lang]",menu).forEach(function(b){b.addEventListener("click",function(){setLocale(b.dataset.c6Lang)})});document.addEventListener("click",function(e){if(!e.target.closest(".c6-lang"))menu.hidden=true})}
 var labels={en:"Language",ar:"اللغة",fr:"Langue"};var l=qs("#c6LanguageLabel");if(l)l.textContent=labels[locale()]||labels.en;
 qsa("[data-c6-copy]").forEach(function(el){var key=el.dataset.c6Copy;if(key)el.textContent=t(key)});
 updateCartCount();
}
function init(){bindHeader();loadData()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
