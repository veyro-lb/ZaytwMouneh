
(function(){
  "use strict";

  var PREMIUM_VERSION="2026.10.02-premium1";
  var LAST_ORDER_KEY="zwm-last-order-v1";
  var ANALYTICS_KEY="zwm-local-events-v1";
  var initialTitle=document.title;
  var initialDescription=(document.querySelector('meta[name="description"]')||{}).content||"";
  var initialOgTitle=(document.querySelector('meta[property="og:title"]')||{}).content||"";
  var initialOgDescription=(document.querySelector('meta[property="og:description"]')||{}).content||"";

  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.from((r||document).querySelectorAll(s))}
  function isAr(){return document.documentElement.lang==="ar"||document.documentElement.dir==="rtl"}
  function txt(en,ar){return isAr()?ar:en}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(ch){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch])})}
  function minPrice(p){return Math.min.apply(null,(p.variants||[]).map(function(v){return Number(v.price)||0}))}
  function cheapestVariant(p){return (p.variants||[]).slice().sort(function(a,b){return Number(a.price)-Number(b.price)})[0]}
  function safeProducts(){return typeof PRODUCTS_DATA!=="undefined"?PRODUCTS_DATA:[]}
  function pname(p){if(typeof currentName==="function")return currentName(p);return isAr()?(p.nameAr||p.nameEn):p.nameEn}
  function pmoney(n){return typeof money==="function"?money(n):("$"+Number(n).toFixed(2))}
  function porigin(p){return typeof originFor==="function"?originFor(p):txt("Source · Lebanon","المصدر · لبنان")}
  function pimage(p){
    if(typeof productImageSrc==="function")return productImageSrc(p);
    return "";
  }

  function track(name,detail){
    var clean={name:name,detail:detail||{},at:new Date().toISOString(),version:PREMIUM_VERSION};
    try{
      window.dataLayer=window.dataLayer||[];
      window.dataLayer.push({event:"zwm_"+name,zwm:clean.detail});
      var rows=JSON.parse(localStorage.getItem(ANALYTICS_KEY)||"[]");
      rows.push(clean);
      localStorage.setItem(ANALYTICS_KEY,JSON.stringify(rows.slice(-80)));
    }catch(e){}
  }

  function toastPremium(message){
    if(typeof toast==="function"){toast(message);return}
    var node=q("#toastText");if(node)node.textContent=message;
  }

  function injectNavigation(){
    var nav=q("#navLinks");
    if(nav&&!nav.querySelector('a[href="recipes.html"]')){
      var gift=nav.querySelector('a[href="gift.html"]');
      if(gift){
        var a=document.createElement("a");
        a.href="recipes.html";
        a.innerHTML='<span>03</span><strong class="premium-recipes-nav">'+esc(txt("Recipes","وصفات"))+'</strong><b>↗</b>';
        gift.after(a);
      }
      Array.from(nav.children).filter(function(x){return x.tagName==="A"}).forEach(function(a,i){
        var s=a.querySelector("span");if(s)s.textContent=String(i+1).padStart(2,"0");
      });
    }
    qa(".footer-column").forEach(function(col){
      if(col.querySelector('a[href="gift.html"]')&&!col.querySelector('a[href="recipes.html"]')){
        var a=document.createElement("a");a.href="recipes.html";a.className="premium-recipes-footer";a.textContent=txt("Recipes & table ideas","وصفات وأفكار للمائدة");
        col.querySelector('a[href="gift.html"]').after(a);
      }
    });
  }

  function seasonalData(){
    var m=new Date().getMonth()+1;
    if(m===9||m===10||m===11)return {
      en:"Autumn pantry · olive season, warm spices and mouneh for the table.",
      ar:"مونة الخريف · موسم الزيتون والبهارات الدافئة ومونة المائدة.",
      labelEn:"Seasonal pantry",labelAr:"مونة الموسم"
    };
    if(m===12||m<=2)return {
      en:"Winter pantry · grains, legumes, honey and warming Lebanese staples.",
      ar:"مونة الشتاء · حبوب وبقوليات وعسل وأساسيات لبنانية دافئة.",
      labelEn:"Winter pantry",labelAr:"مونة الشتاء"
    };
    if(m>=3&&m<=5)return {
      en:"Spring pantry · bright herbs, olive oil and lighter table essentials.",
      ar:"مونة الربيع · أعشاب وزيت زيتون وأساسيات أخف للمائدة.",
      labelEn:"Spring pantry",labelAr:"مونة الربيع"
    };
    return {
      en:"Summer pantry · zaatar, olive oil, syrups and easy mezze essentials.",
      ar:"مونة الصيف · زعتر وزيت زيتون وشرابات وأساسيات المازة.",
      labelEn:"Summer pantry",labelAr:"مونة الصيف"
    };
  }

  function injectSeasonal(){
    var host=q(".hero")||q(".page-intro");if(!host||q(".premium-seasonal",host))return;
    var d=seasonalData(),bar=document.createElement("div");bar.className="premium-seasonal";
    bar.innerHTML='<div><strong>'+esc(isAr()?d.labelAr:d.labelEn)+'</strong><span> · '+esc(isAr()?d.ar:d.en)+'</span></div><a href="shop.html?collection=essentials">'+esc(txt("Shop the season","تسوّق الموسم"))+' ↗</a>';
    host.appendChild(bar);
  }

  var collections=[
    {id:"breakfast",titleEn:"Breakfast in Lebanon",titleAr:"فطور لبناني",copyEn:"Zaatar, olive oil, honey and pantry staples for an easy morning table.",copyAr:"زعتر وزيت زيتون وعسل وأساسيات المونة لفطور لبناني بسيط.",image:"assets/products/olives.webp?v=20261002-collections4"},
    {id:"bekaa",titleEn:"From the Bekaa",titleAr:"من البقاع",copyEn:"A provenance-led edit of grains, pulses, herbs and traditional pantry staples.",copyAr:"تشكيلة بحسب المصدر من الحبوب والبقوليات والأعشاب وأساسيات المونة.",image:"assets/products/rice.webp?v=20261002-collections4"},
    {id:"sweet",titleEn:"Sweet Lebanon",titleAr:"حلاوة لبنان",copyEn:"Honey, molasses, dried fruit and pantry sweets for gifting or sharing.",copyAr:"عسل ودبس وفاكهة مجففة وحلويات للمشاركة أو الهدية.",image:"assets/products/honey.webp?v=20261002-collections4"},
    {id:"sunday",titleEn:"Sunday Table",titleAr:"سفرة الأحد",copyEn:"The grains, spices, oil and mouneh that make a long family lunch feel familiar.",copyAr:"حبوب وبهارات وزيت ومونة لسفرة عائلية طويلة ومألوفة.",image:"assets/products/olive-oil.webp?v=20261002-collections4"}
  ]

  function matchesCollection(p,id){
    var n=((p.nameEn||"")+" "+(p.original||"")+" "+(p.category||"")).toLowerCase();
    if(id==="under20")return minPrice(p)<=20;
    if(id==="bekaa")return typeof originKeyFor==="function"?originKeyFor(p)==="Bekaa":true;
    if(id==="breakfast")return /zaatar|za.?atar|honey|olive oil|labneh|molasses|jam|debes/.test(n);
    if(id==="sweet")return /honey|molasses|debes|jam|date|fig|apricot|raisin|sweet|candy|carob/.test(n);
    if(id==="sunday")return /lentil|rice|bulgur|burghol|olive oil|sumac|semaq|cumin|pepper|mouneh|pickle|olives/.test(n);
    if(id==="essentials")return /zaatar|za.?atar|olive oil|sumac|semaq|lentil|rice|bulgur|honey|molasses|cumin|olives/.test(n);
    return true;
  }

  function collectionById(id){return collections.find(function(c){return c.id===id})}
  function collectionItems(id,limit){
    return safeProducts().filter(function(p){return matchesCollection(p,id)}).slice(0,limit||10);
  }

  function injectCollections(){
    if((document.body.dataset.page||"home")!=="home"||q("#premiumCollections"))return;
    var anchor=q(".categories");if(!anchor)return;
    var sec=document.createElement("section");sec.id="premiumCollections";sec.className="premium-section premium-collections";
    var cards=collections.map(function(c){
      return '<a class="collection-card collection-card--'+esc(c.id)+'" href="shop.html?collection='+encodeURIComponent(c.id)+'"><span class="collection-media" aria-hidden="true"><img src="'+esc(c.image)+'" alt="" loading="lazy" decoding="async"></span><span class="collection-arrow">↗</span><span class="collection-copy"><small>'+esc(txt("Curated collection","تشكيلة مختارة"))+'</small><h3>'+esc(isAr()?c.titleAr:c.titleEn)+'</h3><p>'+esc(isAr()?c.copyAr:c.copyEn)+'</p></span></a>';
    }).join("");
    sec.innerHTML='<div class="shell"><div class="premium-head"><div><p class="premium-kicker">'+esc(txt("Shop by mood","تسوّق حسب المناسبة"))+'</p><h2>'+esc(txt("Collections with a","تشكيلات لها"))+' <em>'+esc(txt("reason.","فكرة."))+'</em></h2></div><p>'+esc(txt("Categories are useful. Collections make the pantry easier to imagine on a real table, for a real meal or as a gift.","التصنيفات مفيدة، لكن التشكيلات تجعل المونة أسهل للتخيّل على سفرة حقيقية أو كهدية."))+'</p></div><div class="collection-grid">'+cards+'</div></div>';
    anchor.after(sec);
  }

  var regionCopy={
    "Bekaa":{
      en:"Most of the pantry comes from the Bekaa: grains, pulses, herbs and everyday mouneh staples.",
      ar:"معظم المونة تأتي من البقاع: الحبوب والبقوليات والأعشاب وأساسيات المونة اليومية."
    },
    "Koura":{
      en:"Koura is highlighted for olive oil, with the specific product name taking precedence whenever a more precise origin is listed.",
      ar:"نبرز الكورة كمصدر لزيت الزيتون، مع اعتماد اسم المنتج إذا ذكر مصدراً أكثر تحديداً."
    },
    "Mount Lebanon":{
      en:"Honey is associated with Mount Lebanon in the brand provenance information.",
      ar:"العسل مرتبط بجبل لبنان ضمن معلومات المصدر الخاصة بالعلامة."
    },
    "Chouf":{
      en:"Debes and molasses are associated with the Chouf in the brand provenance information.",
      ar:"الدبس مرتبط بالشوف ضمن معلومات المصدر الخاصة بالعلامة."
    }
  };

  function regionProducts(region){
    return safeProducts().filter(function(p){
      return typeof originKeyFor==="function"?originKeyFor(p)===region:false;
    }).slice(0,4);
  }

  function renderRegion(region,root){
    qa(".region-pin",root).forEach(function(b){b.classList.toggle("is-active",b.dataset.region===region)});
    var detail=q(".provenance-detail",root),items=regionProducts(region);
    var labels={"Bekaa":["Bekaa","البقاع"],"Koura":["Koura","الكورة"],"Mount Lebanon":["Mount Lebanon","جبل لبنان"],"Chouf":["Chouf","الشوف"]};
    detail.innerHTML='<span class="region-label">'+esc(txt("Origin focus","مصدر مختار"))+'</span><h3>'+esc(isAr()?labels[region][1]:labels[region][0])+'</h3><p>'+esc(isAr()?regionCopy[region].ar:regionCopy[region].en)+'</p><div class="provenance-products">'+items.map(function(p){
      return '<button class="provenance-product" type="button" data-origin-product="'+esc(p.id)+'"><small>'+esc(p.category)+'</small><strong>'+esc(pname(p))+'</strong></button>';
    }).join("")+'</div>';
    qa("[data-origin-product]",detail).forEach(function(btn){btn.addEventListener("click",function(){if(typeof openProduct==="function")openProduct(btn.dataset.originProduct)})});
  }

  function injectProvenance(){
    if(q("#premiumProvenance"))return;
    var page=document.body.dataset.page||"home";
    if(page!=="home"&&page!=="about")return;
    var anchor=page==="about"?q(".provenance-section"):q(".about-section");if(!anchor)return;
    var sec=document.createElement("section");sec.id="premiumProvenance";sec.className="premium-section premium-provenance";
    sec.innerHTML='<div class="shell"><div class="premium-head"><div><p class="premium-kicker">'+esc(txt("A pantry rooted in place","مونة مرتبطة بأرضها"))+'</p><h2>'+esc(txt("Follow the pantry","تتبّع المونة"))+' <em>'+esc(txt("across Lebanon.","في لبنان."))+'</em></h2></div><p>'+esc(txt("Explore the origin information used across the catalogue. We keep it precise and avoid claims that are not verified.","اكتشف معلومات المصدر المستخدمة في الكتالوج. نحافظ عليها دقيقة ونتجنب أي ادعاء غير موثّق."))+'</p></div><div class="provenance-experience"><div class="lebanon-map-card"><div class="lebanon-silhouette" aria-hidden="true"></div><button class="region-pin" data-region="Koura" type="button">'+esc(txt("Koura","الكورة"))+'</button><button class="region-pin" data-region="Mount Lebanon" type="button">'+esc(txt("Mount Lebanon","جبل لبنان"))+'</button><button class="region-pin" data-region="Bekaa" type="button">'+esc(txt("Bekaa","البقاع"))+'</button><button class="region-pin" data-region="Chouf" type="button">'+esc(txt("Chouf","الشوف"))+'</button></div><div class="provenance-detail"></div></div></div>';
    anchor.after(sec);
    qa(".region-pin",sec).forEach(function(btn){btn.addEventListener("click",function(){renderRegion(btn.dataset.region,sec)})});
    renderRegion("Bekaa",sec);
  }

  var recipes=[
    {
      id:"mujadara",
      titleEn:"Mujadara",titleAr:"مجدّرة",
      copyEn:"A Lebanese comfort classic of lentils and rice, finished with deeply caramelized onions.",
      copyAr:"طبق لبناني بيتي من العدس والأرز، يكتمل بالبصل المحمّر على مهل.",
      methodEn:"Simmer the lentils until partly tender. Add rinsed rice, cumin, salt and enough water to finish cooking gently. Slice onions and brown them slowly in olive oil until dark and sweet; fold some through the lentils and rice and pile the rest on top.",
      methodAr:"اسلق العدس حتى يقترب من النضج، ثم أضف الأرز المغسول والكمون والملح والماء واتركه ينضج على نار هادئة. حمّر شرائح البصل ببطء في زيت الزيتون حتى تصبح داكنة وحلوة، اخلط جزءاً منها مع المجدّرة وضع الباقي فوقها.",
      freshEn:"Fresh: onions · optional yogurt or salad",
      freshAr:"طازج: بصل · لبن أو سلطة حسب الرغبة",
      tagsEn:["lentils","rice","cumin","olive oil"],tagsAr:["عدس","أرز","كمون","زيت زيتون"],
      productIds:["aadas-aarid","american-rice","kamoun-neeme","extra-virgin-olive-oil"],
    },
    {
      id:"manoushe",
      titleEn:"Za’atar manoushe",titleAr:"منقوشة زعتر",
      copyEn:"The everyday Lebanese bakery favourite: soft dough topped with za’atar and olive oil.",
      copyAr:"من أشهر مخبوزات الصباح اللبنانية: عجينة طرية مع خلطة الزعتر وزيت الزيتون.",
      methodEn:"Mix flour, yeast, salt and water into a soft dough and let it rise until relaxed. Stir the manakish za’atar with olive oil into a loose paste. Stretch the dough, spread the topping almost to the edge and bake in a very hot oven until the base and rim are golden.",
      methodAr:"اعجن الطحين والخميرة والملح والماء حتى تحصل على عجينة طرية واتركها ترتاح وتتخمّر. اخلط زعتر المناقيش بزيت الزيتون حتى يصبح قابلاً للدهن، افرد العجينة ووزّع الخلطة ثم اخبزها في فرن حار جداً حتى تتحمّر الأطراف والقاع.",
      freshEn:"At home: water · optional tomato, cucumber, mint or labneh",
      freshAr:"في البيت: ماء · ويمكن تقديمها مع بندورة وخيار ونعنع أو لبنة",
      tagsEn:["manakish za’atar","olive oil","flour","yeast"],tagsAr:["زعتر مناقيش","زيت زيتون","طحين","خميرة"],
      productIds:["zaatar-manakish","extra-virgin-olive-oil","all-use-flour","yeast"],
    },
    {
      id:"fattoush",
      titleEn:"Fattoush",titleAr:"فتّوش",
      copyEn:"A crisp Lebanese bread salad with a bright sumac, lemon and pomegranate-molasses dressing.",
      copyAr:"سلطة خبز لبنانية منعشة بتتبيلة السماق والحامض ودبس الرمان.",
      methodEn:"Chop lettuce, tomatoes, cucumber, radish, parsley and mint. Whisk olive oil with lemon juice, sumac, a small spoon of pomegranate molasses and salt. Toss just before serving and add toasted or fried pita at the end so it stays crisp.",
      methodAr:"قطّع الخس والبندورة والخيار والفجل والبقدونس والنعنع. اخلط زيت الزيتون مع عصير الحامض والسماق وملعقة صغيرة من دبس الرمان والملح. قلّب السلطة قبل التقديم مباشرة وأضف الخبز المحمّص أو المقلي في النهاية ليبقى مقرمشاً.",
      freshEn:"Fresh: lettuce · tomato · cucumber · radish · parsley · mint · lemon · pita",
      freshAr:"طازج: خس · بندورة · خيار · فجل · بقدونس · نعنع · حامض · خبز عربي",
      tagsEn:["sumac","pomegranate molasses","olive oil"],tagsAr:["سماق","دبس رمان","زيت زيتون"],
      productIds:["semaq","debes-el-remen","extra-virgin-olive-oil"],
    },
    {
      id:"hummus",
      titleEn:"Hummus",titleAr:"حمّص بطحينة",
      copyEn:"Creamy chickpeas blended with tahini, lemon and garlic — one of the essential Lebanese mezze plates.",
      copyAr:"حمّص كريمي مع الطحينة والحامض والثوم — من أساسيات المازة اللبنانية.",
      methodEn:"Soak and cook the chickpeas until very soft. Blend while warm with tahini, fresh lemon juice, garlic, cumin, salt and a splash of cold water until smooth. Spoon into a plate, make a shallow well and finish with olive oil.",
      methodAr:"انقع الحمص واسلقه حتى يصبح طرياً جداً. اطحنه وهو دافئ مع الطحينة وعصير الحامض الطازج والثوم والكمون والملح وقليل من الماء البارد حتى يصبح ناعماً. قدّمه في طبق وأنهِ الوجه بزيت الزيتون.",
      freshEn:"Fresh: lemon · garlic · optional parsley",
      freshAr:"طازج: حامض · ثوم · بقدونس حسب الرغبة",
      tagsEn:["chickpeas","tahini","olive oil","cumin"],tagsAr:["حمص","طحينة","زيت زيتون","كمون"],
      productIds:["humus-baladi","tahini","extra-virgin-olive-oil","kamoun-neeme"],
    },
    {
      id:"tabbouleh",
      titleEn:"Tabbouleh",titleAr:"تبّولة",
      copyEn:"Parsley first, bulgur second: the bright Lebanese salad with tomato, mint, lemon and olive oil.",
      copyAr:"البقدونس هو الأساس والبرغل لمسة: سلطة لبنانية طازجة مع البندورة والنعنع والحامض وزيت الزيتون.",
      methodEn:"Rinse the fine bulgur and let it soften with a little lemon juice. Finely chop plenty of parsley, tomatoes, mint and spring onion. Toss with the bulgur, olive oil, more lemon juice and salt shortly before serving.",
      methodAr:"اغسل البرغل الناعم واتركه يلين مع قليل من عصير الحامض. افرم كمية وافرة من البقدونس مع البندورة والنعنع والبصل الأخضر فرماً ناعماً. أضف البرغل وزيت الزيتون والمزيد من الحامض والملح وقلّب قبل التقديم.",
      freshEn:"Fresh: lots of parsley · tomato · mint · spring onion · lemon",
      freshAr:"طازج: بقدونس بكمية وافرة · بندورة · نعنع · بصل أخضر · حامض",
      tagsEn:["fine bulgur","olive oil","sea salt"],tagsAr:["برغل ناعم","زيت زيتون","ملح بحري"],
      productIds:["burglur-asmar-neeme","extra-virgin-olive-oil","sea-salt"],
    },
    {
      id:"kibbeh",
      titleEn:"Kibbeh",titleAr:"كبّة",
      copyEn:"Fine bulgur and Lebanese kibbeh spice form the pantry base for one of Lebanon’s best-known dishes.",
      copyAr:"البرغل الناعم ودقّة الكبة هما أساس المونة لأحد أشهر الأطباق اللبنانية.",
      methodEn:"Soak the fine bulgur briefly and squeeze it dry. Work it with lean minced beef or lamb, onion, kibbeh spice and salt until cohesive. Shape and fill for fried kibbeh, or press into a tray with a cooked meat-and-onion filling for kibbeh bil sanieh.",
      methodAr:"انقع البرغل الناعم قليلاً ثم اعصره جيداً. ادعكه مع اللحم الهبرة المفروم والبصل ودقّة الكبة والملح حتى يتماسك. شكّله واحشه للكبة المقلية، أو افرده في صينية مع حشوة اللحم والبصل للكبة بالصينية.",
      freshEn:"Fresh: lean beef or lamb · onion · optional pine nuts",
      freshAr:"طازج: لحم هبرة بقري أو غنم · بصل · صنوبر حسب الرغبة",
      tagsEn:["fine bulgur","kibbeh spice","seven spice","olive oil"],tagsAr:["برغل ناعم","دقّة كبة","سبع بهارات","زيت زيتون"],
      productIds:["burglur-asmar-neeme","daqet-el-kebbe-nehme","sabaa-bharat","extra-virgin-olive-oil"],
    }
  ];

  function recipeProductById(id){
    return safeProducts().find(function(p){return p.id===id})||null;
  }

  function productsForRecipe(recipe){
    var seen={};
    return (recipe.productIds||[]).map(recipeProductById).filter(function(p){
      if(!p||seen[p.id])return false;
      seen[p.id]=1;
      return true;
    });
  }

  function addRecipe(recipeId){
    var recipe=recipes.find(function(r){return r.id===recipeId});if(!recipe)return;
    var items=productsForRecipe(recipe);
    items.forEach(function(p){if(typeof addToCart==="function")addToCart(p,cheapestVariant(p),1)});
    track("recipe_bundle_added",{recipe:recipeId,items:items.map(function(p){return p.id})});
    toastPremium(txt("Pantry ingredients added. Add the fresh ingredients at home.","تمت إضافة مكونات المونة. أضف المكونات الطازجة في البيت."));
  }

  function recipeCards(){
    return recipes.map(function(r,i){
      var items=productsForRecipe(r),total=items.reduce(function(s,p){return s+Number(cheapestVariant(p).price)},0);
      var tags=isAr()?r.tagsAr:r.tagsEn;
      return '<article class="recipe-card" data-recipe="'+esc(r.id)+'"><span class="recipe-no">0'+(i+1)+'</span><h3>'+esc(isAr()?r.titleAr:r.titleEn)+'</h3><p>'+esc(isAr()?r.copyAr:r.copyEn)+'</p><div class="recipe-tags">'+tags.map(function(t){return "<span>"+esc(t)+"</span>"}).join("")+'</div><p class="recipe-fresh">'+esc(isAr()?r.freshAr:r.freshEn)+'</p><div class="recipe-card-footer"><small>'+esc(txt("Pantry items from ","منتجات المونة من "))+pmoney(total)+'</small><button class="recipe-add" type="button" data-recipe-add="'+esc(r.id)+'">'+esc(txt("Add pantry ingredients","أضف مكونات المونة"))+'</button></div></article>';
    }).join("");
  }

  function bindRecipeButtons(root){
    qa("[data-recipe-add]",root||document).forEach(function(btn){
      if(btn.dataset.premiumBound)return;btn.dataset.premiumBound="1";
      btn.addEventListener("click",function(){addRecipe(btn.dataset.recipeAdd)});
    });
  }

  function injectRecipes(){
    var page=document.body.dataset.page||"home";
    if(page==="recipes"){bindRecipeButtons(document);hydrateRecipePage();return}
    if(page!=="home"||q("#premiumRecipes"))return;
    var anchor=q(".home-gift")||q(".order-strip");if(!anchor)return;
    var sec=document.createElement("section");sec.id="premiumRecipes";sec.className="premium-section premium-recipes";
    sec.innerHTML='<div class="shell"><div class="premium-head"><div><p class="premium-kicker">'+esc(txt("Shop by recipe","تسوّق حسب الوصفة"))+'</p><h2>'+esc(txt("Start with the","ابدأ من"))+' <em>'+esc(txt("table.","السفرة."))+'</em></h2></div><p>'+esc(txt("Choose from six familiar Lebanese dishes. Add the exact pantry ingredients in one click, then pick up the fresh ingredients yourself.","اختر من ستة أطباق لبنانية مألوفة. أضف مكونات المونة الصحيحة بضغطة واحدة، ثم جهّز المكونات الطازجة في البيت."))+'</p></div><div class="recipe-grid">'+recipeCards()+'</div><a class="premium-pill" style="margin-top:18px" href="recipes.html">'+esc(txt("See recipe notes","شاهد تفاصيل الوصفات"))+' ↗</a></div>';
    anchor.before(sec);bindRecipeButtons(sec);
  }

  function hydrateRecipePage(){
    qa("[data-recipe-detail]").forEach(function(card){
      var r=recipes.find(function(x){return x.id===card.dataset.recipeDetail});if(!r)return;
      var items=productsForRecipe(r),price=q("[data-recipe-price]",card);
      if(price)price.textContent=pmoney(items.reduce(function(s,p){return s+Number(cheapestVariant(p).price)},0));
      var names=q("[data-recipe-products]",card);
      if(names)names.textContent=items.map(pname).join(" · ");
    });
  }

  function curatedProductMarkup(p){
    var img=pimage(p),media=img?'<img src="'+esc(img)+'" alt="" loading="lazy" decoding="async">':'';
    return '<button class="curated-product" type="button" data-curated-product="'+esc(p.id)+'">'+media+'<span class="curated-product-copy"><small>'+esc(porigin(p))+'</small><strong>'+esc(pname(p))+'</strong><b>'+esc(txt("From ","من "))+pmoney(minPrice(p))+'</b></span></button>';
  }

  function injectShopTools(){
    if((document.body.dataset.page||"")!=="shop"||q("#premiumShopTools"))return;
    var toolbar=q(".catalog-toolbar");if(!toolbar)return;
    var tools=document.createElement("div");tools.id="premiumShopTools";tools.className="premium-shop-tools";
    tools.innerHTML='<div class="premium-shop-tools-top"><div><strong>'+esc(txt("Curated shortcuts","اختصارات مختارة"))+'</strong></div><div class="premium-tool-actions"><button class="premium-tool-button primary" type="button" id="surpriseMe">'+esc(txt("Surprise me by budget","اختر لي حسب الميزانية"))+'</button><button class="premium-tool-button" type="button" id="shareBasket">'+esc(txt("Share basket","شارك السلة"))+'</button><button class="premium-tool-button" type="button" id="reorderLast" hidden>'+esc(txt("Reorder last basket","أعد طلب آخر سلة"))+'</button></div></div><div class="premium-collection-chips">'+collections.slice(0,5).map(function(c){return '<a href="shop.html?collection='+esc(c.id)+'">'+esc(isAr()?c.titleAr:c.titleEn)+'</a>'}).join("")+'</div>';
    toolbar.after(tools);
    q("#surpriseMe",tools).addEventListener("click",openBudgetDialog);
    q("#shareBasket",tools).addEventListener("click",shareBasket);
    var last=loadLastOrder(),re=q("#reorderLast",tools);if(last&&last.items&&last.items.length){re.hidden=false;re.addEventListener("click",reorderLast)}
    renderRequestedCollection();
  }

  function renderRequestedCollection(){
    qa(".curated-rail").forEach(function(x){x.remove()});
    var id=new URLSearchParams(location.search).get("collection");if(!id)return;
    var c=collectionById(id);if(!c)return;
    var host=q("#premiumShopTools");if(!host||q(".curated-rail",host))return;
    var items=collectionItems(id,10),rail=document.createElement("div");rail.className="curated-rail";
    rail.innerHTML='<div class="curated-rail-head"><div><h3>'+esc(isAr()?c.titleAr:c.titleEn)+'</h3><p>'+esc(isAr()?c.copyAr:c.copyEn)+'</p></div><a class="premium-pill" href="shop.html#shop">'+esc(txt("Full catalogue","كل المنتجات"))+'</a></div><div class="curated-product-row">'+items.map(curatedProductMarkup).join("")+'</div>';
    host.after(rail);
    qa("[data-curated-product]",rail).forEach(function(btn){btn.addEventListener("click",function(){if(typeof openProduct==="function")openProduct(btn.dataset.curatedProduct)})});
  }

  function openBudgetDialog(){
    if(q("#premiumBudgetDialog"))return;
    var back=document.createElement("div");back.id="premiumBudgetDialog";back.className="premium-dialog-backdrop";
    back.innerHTML='<div class="premium-dialog" role="dialog" aria-modal="true" aria-labelledby="premiumBudgetTitle"><button class="premium-dialog-close" type="button" aria-label="'+esc(txt("Close","إغلاق"))+'">×</button><p class="premium-kicker">'+esc(txt("A pantry within budget","مونة ضمن الميزانية"))+'</p><h2 id="premiumBudgetTitle">'+esc(txt("Give me a good mix.","اختر لي تشكيلة جميلة."))+'</h2><p>'+esc(txt("We will build a varied pantry bundle from current catalogue prices. You can still edit everything in your cart.","سنجهّز تشكيلة متنوعة بحسب أسعار الكتالوج الحالية، ويمكنك تعديل كل شيء في السلة."))+'</p><div class="budget-options"><button data-budget="15">$15</button><button data-budget="25">$25</button><button data-budget="40">$40</button><button data-budget="60">$60</button></div></div>';
    document.body.appendChild(back);
    function close(){back.remove()}
    back.addEventListener("click",function(e){if(e.target===back)close()});
    q(".premium-dialog-close",back).addEventListener("click",close);
    qa("[data-budget]",back).forEach(function(btn){btn.addEventListener("click",function(){buildPantryBudget(Number(btn.dataset.budget));close()})});
  }

  function buildPantryBudget(budget){
    var wanted=[
      ["zaatar","za'atar","za’atar"],["olive oil"],["lentil"],["sumac","semaq"],["honey"],["rice","bulgur"],["cumin"],["molasses","debes"],["olives"]
    ];
    var candidates=[],seen={};
    wanted.forEach(function(terms){var p=findRecipeProduct(terms);if(p&&!seen[p.id]){seen[p.id]=1;candidates.push(p)}});
    var total=0,chosen=[];
    candidates.forEach(function(p){
      var v=cheapestVariant(p),price=Number(v.price);
      if(price>0&&total+price<=budget*1.04){chosen.push({p:p,v:v});total+=price}
    });
    if(!chosen.length){
      safeProducts().slice().sort(function(a,b){return minPrice(a)-minPrice(b)}).some(function(p){
        var v=cheapestVariant(p);if(Number(v.price)<=budget){chosen.push({p:p,v:v});total=Number(v.price);return true}return false
      });
    }
    chosen.forEach(function(x){if(typeof addToCart==="function")addToCart(x.p,x.v,1)});
    track("budget_bundle_added",{budget:budget,total:Number(total.toFixed(2)),items:chosen.map(function(x){return x.p.id})});
    toastPremium(txt("A varied pantry bundle was added. Edit anything you like in the cart.","تمت إضافة تشكيلة متنوعة. يمكنك تعديل أي شيء في السلة."));
  }

  function basketPayload(){
    if(typeof cartRows!=="function")return[];
    return cartRows().map(function(r){return {p:r.p.id,v:r.v.id,q:r.qty}});
  }
  function encodeBasket(rows){try{return btoa(JSON.stringify(rows))}catch(e){return""}}
  function decodeBasket(value){try{return JSON.parse(atob(value))}catch(e){return[]}}

  async function shareUrl(url,title){
    try{
      if(navigator.share){await navigator.share({title:title,url:url});return true}
      if(navigator.clipboard){await navigator.clipboard.writeText(url);toastPremium(txt("Link copied","تم نسخ الرابط"));return true}
    }catch(e){}
    window.prompt(txt("Copy this link","انسخ هذا الرابط"),url);return false
  }

  function shareBasket(){
    var rows=basketPayload();if(!rows.length){toastPremium(txt("Add something to the basket first.","أضف منتجات إلى السلة أولاً."));return}
    var url=new URL(location.href);url.search="";url.hash="";url.searchParams.set("basket",encodeBasket(rows));
    track("basket_shared",{items:rows.length});
    shareUrl(url.toString(),txt("Zayt w Mouneh pantry basket","سلة زيت ومونة"));
  }

  function maybeSharedBasket(){
    var token=new URLSearchParams(location.search).get("basket");if(!token||q(".shared-basket-banner"))return;
    var rows=decodeBasket(token);if(!Array.isArray(rows)||!rows.length)return;
    var bar=document.createElement("div");bar.className="shared-basket-banner";
    bar.innerHTML='<div><strong>'+esc(txt("Someone shared a pantry basket with you.","تمت مشاركة سلة مونة معك."))+'</strong><p>'+esc(txt(rows.length+" selected items. Nothing is added until you choose to load it.",rows.length+" منتجات مختارة. لن تتم إضافتها قبل موافقتك."))+'</p></div><button type="button">'+esc(txt("Load basket","حمّل السلة"))+'</button>';
    var header=q(".site-header");if(header)header.after(bar);else document.body.prepend(bar);
    q("button",bar).addEventListener("click",function(){
      rows.forEach(function(x){
        var p=typeof productById==="function"?productById(x.p):safeProducts().find(function(y){return y.id===x.p});
        if(!p)return;
        var v=typeof variantById==="function"?variantById(p,x.v):p.variants.find(function(y){return y.id===x.v});
        if(v&&typeof addToCart==="function")addToCart(p,v,Math.max(1,Number(x.q)||1));
      });
      track("shared_basket_loaded",{items:rows.length});bar.remove();toastPremium(txt("Shared basket loaded.","تم تحميل السلة المشتركة."));
    });
  }

  function saveLastOrder(){
    var rows=basketPayload();if(!rows.length)return;
    try{localStorage.setItem(LAST_ORDER_KEY,JSON.stringify({at:new Date().toISOString(),items:rows}))}catch(e){}
  }
  function loadLastOrder(){try{return JSON.parse(localStorage.getItem(LAST_ORDER_KEY)||"null")}catch(e){return null}}
  function reorderLast(){
    var last=loadLastOrder();if(!last||!Array.isArray(last.items))return;
    last.items.forEach(function(x){
      var p=typeof productById==="function"?productById(x.p):null;if(!p)return;
      var v=typeof variantById==="function"?variantById(p,x.v):null;if(v&&typeof addToCart==="function")addToCart(p,v,x.q||1);
    });
    track("last_order_reordered",{items:last.items.length});toastPremium(txt("Last basket added again.","تمت إضافة آخر سلة من جديد."));
  }

  function injectGiftPremium(){
    var form=q("#giftForm");if(!form)return;

    if((document.body.dataset.page||"")==="gift"){
      var actions=q(".nav-actions");
      if(actions&&!q(".gift-nav-search",actions)){
        var search=document.createElement("a");
        search.className="gift-nav-search";
        search.href="shop.html#shop";
        search.setAttribute("aria-label",txt("Search the pantry","ابحث في المونة"));
        search.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>';
        actions.prepend(search);
      }
      var menuUtility=q(".menu-utility");
      if(menuUtility&&!q(".gift-menu-language",menuUtility)){
        var menuLang=document.createElement("div");
        menuLang.className="gift-menu-language";
        menuLang.setAttribute("aria-label",txt("Language","اللغة"));
        menuLang.innerHTML='<button type="button" data-gift-lang="en">EN</button><button type="button" data-gift-lang="ar">عربي</button>';
        menuUtility.prepend(menuLang);
        qa("[data-gift-lang]",menuLang).forEach(function(btn){
          btn.classList.toggle("is-active",(isAr()?"ar":"en")===btn.dataset.giftLang);
          btn.addEventListener("click",function(){
            if(typeof applyLanguage==="function")applyLanguage(btn.dataset.giftLang);
            qa("[data-gift-lang]",menuLang).forEach(function(x){x.classList.toggle("is-active",x.dataset.giftLang===btn.dataset.giftLang)});
          });
        });
      }
    }

    if(q("#giftPremiumControls")){updateGiftPreview();return}
    var head=q(".gift-builder-head",form);
    var box=document.createElement("div");box.id="giftPremiumControls";box.className="gift-premium-controls";
    box.innerHTML=
      '<h3>'+esc(txt("Shape the gift","خصّص الهدية"))+'</h3>'+
      '<p>'+esc(txt("Choose a budget, presentation theme and card language. Every detail stays editable before you send the request.","اختر الميزانية وطابع التغليف ولغة البطاقة. كل التفاصيل قابلة للتعديل قبل إرسال الطلب."))+'</p>'+
      '<div class="gift-budget-row" aria-label="'+esc(txt("Quick gift budgets","ميزانيات سريعة"))+'">'+
        '<button type="button" data-gift-budget="25">$25</button>'+
        '<button type="button" data-gift-budget="40">$40</button>'+
        '<button type="button" data-gift-budget="60">$60</button>'+
        '<button type="button" data-gift-budget="100">$100</button>'+
      '</div>'+
      '<div class="gift-personalize-grid">'+
        '<label>'+esc(txt("Theme","الطابع"))+
          '<select id="premiumRibbon">'+
            '<option value="Olive green">'+esc(txt("Olive green","أخضر زيتوني"))+'</option>'+
            '<option value="Natural linen">'+esc(txt("Natural linen","كتان طبيعي"))+'</option>'+
            '<option value="Warm gold">'+esc(txt("Warm gold","ذهبي دافئ"))+'</option>'+
          '</select>'+
        '</label>'+
        '<label>'+esc(txt("Card language","لغة البطاقة"))+
          '<select id="premiumCardLanguage">'+
            '<option value="English">English</option>'+
            '<option value="Arabic">العربية</option>'+
            '<option value="Bilingual">'+esc(txt("Bilingual","ثنائية اللغة"))+'</option>'+
          '</select>'+
        '</label>'+
        '<label class="gift-hide-row"><input id="premiumHidePrices" type="checkbox" checked><span>'+esc(txt("Hide prices from the recipient","إخفاء الأسعار عن المستلم"))+'</span></label>'+
      '</div>'+
      '<div class="gift-card-preview" id="giftCardPreview" data-theme="Olive green">'+
        '<small>'+esc(txt("Gift card preview","معاينة بطاقة الهدية"))+'</small><strong></strong><p></p>'+
      '</div>';
    if(head)head.after(box);else form.prepend(box);

    qa("[data-gift-budget]",box).forEach(function(btn){
      btn.addEventListener("click",function(){buildGiftBudget(Number(btn.dataset.giftBudget))});
    });
    ["giftRecipient","giftMessage","giftSender","premiumCardLanguage","premiumRibbon"].forEach(function(id){
      var node=q("#"+id);if(node&&!node.dataset.premiumPreviewBound){
        node.dataset.premiumPreviewBound="1";
        node.addEventListener("input",updateGiftPreview);
        node.addEventListener("change",updateGiftPreview);
      }
    });
    updateGiftPreview();

    if(!form.dataset.premiumSubmitBound){
      form.dataset.premiumSubmitBound="1";
      form.addEventListener("submit",function(){
        var msg=q("#giftMessage"),original=msg?msg.value:"";
        var theme=q("#premiumRibbon"),card=q("#premiumCardLanguage"),hide=q("#premiumHidePrices");
        var extras=[
          "",
          txt("Gift presentation preferences:","تفضيلات تجهيز الهدية:"),
          txt("Theme: ","الطابع: ")+(theme?theme.value:"—"),
          txt("Card language: ","لغة البطاقة: ")+(card?card.value:"—"),
          txt("Hide prices from recipient: ","إخفاء الأسعار عن المستلم: ")+(hide&&hide.checked?txt("Yes","نعم"):txt("No","لا"))
        ].join("\n");
        if(msg)msg.value=(original?original+"\n":"")+extras;
        setTimeout(function(){if(msg)msg.value=original},0);
        track("gift_request_started",{hidePrices:!!(hide&&hide.checked),theme:theme?theme.value:"",cardLanguage:card?card.value:""});
      },true);
    }
  }

  function buildGiftBudget(budget){
    if(typeof giftItems==="undefined")return;
    var wanted=[
      ["zaatar","za'atar"],["olive oil"],["honey"],["sumac","semaq"],["molasses","debes"],["lentil"],["nuts","almond","pistach"],["olives"]
    ],candidates=[],seen={},total=0;
    wanted.forEach(function(terms){var p=findRecipeProduct(terms);if(p&&!seen[p.id]){seen[p.id]=1;candidates.push(p)}});
    giftItems={};
    candidates.forEach(function(p){
      var v=cheapestVariant(p),price=Number(v.price);
      if(price>0&&total+price<=budget*1.04){
        var key=typeof cartKey==="function"?cartKey(p.id,v.id):(p.id+"::"+v.id);
        giftItems[key]={productId:p.id,variantId:v.id,qty:1};total+=price;
      }
    });
    if(typeof saveGiftItems==="function")saveGiftItems();
    if(typeof renderGiftSummary==="function")renderGiftSummary();
    if(typeof renderGiftPickerResults==="function")renderGiftPickerResults();
    updateGiftPreview();track("gift_budget_loaded",{budget:budget,total:Number(total.toFixed(2))});
    toastPremium(txt("Gift basket prepared near your budget. Edit anything you like.","تم تجهيز سلة هدية قريبة من ميزانيتك. يمكنك تعديل أي شيء."));
  }

  function updateGiftPreview(){
    var preview=q("#giftCardPreview");if(!preview)return;
    var recipient=(q("#giftRecipient")||{}).value||txt("Someone special","شخص عزيز");
    var message=(q("#giftMessage")||{}).value||txt("A little taste of Lebanon, chosen for you.","نكهة صغيرة من لبنان، مختارة لك.");
    var sender=(q("#giftSender")||{}).value||txt("With care","بمحبة");
    var theme=(q("#premiumRibbon")||{}).value||"Olive green";
    preview.dataset.theme=theme;
    q("strong",preview).textContent=txt("To ","إلى ")+recipient;
    q("p",preview).textContent=message+"\n— "+sender;
  }

  function storageGuidance(p){
    var c=(p.category||"").toLowerCase(),n=(p.nameEn||"").toLowerCase();
    if(/olive oil|oil/.test(c+" "+n))return txt("Keep sealed in a cool, dark place away from direct heat and light.","يُحفظ مغلقاً في مكان بارد ومظلم بعيداً عن الحرارة والضوء المباشر.");
    if(/honey|molasses|syrup|jam/.test(c+" "+n))return txt("Keep sealed in a cool, dry place. Follow the label after opening when present.","يُحفظ مغلقاً في مكان بارد وجاف، واتبع تعليمات الملصق بعد الفتح عند وجودها.");
    if(/flour|grain|pulse|spice|herb|nut|seed|dried|condiment/.test(c+" "+n))return txt("Keep tightly sealed in a cool, dry pantry away from moisture and strong heat.","يُحفظ محكم الإغلاق في مكان بارد وجاف بعيداً عن الرطوبة والحرارة.");
    return txt("Store according to the package label and keep the product sealed between uses.","يُحفظ بحسب تعليمات العبوة مع إبقائه مغلقاً بين الاستخدامات.");
  }

  function pairingText(p){
    var n=((p.nameEn||"")+" "+(p.category||"")).toLowerCase();
    if(/zaatar|za.?atar/.test(n))return txt("Pairs naturally with olive oil, labneh, eggs and warm bread.","يناسب زيت الزيتون واللبنة والبيض والخبز الدافئ.");
    if(/olive oil/.test(n))return txt("Pair with zaatar, olives, labneh, salads and mezze.","يناسب الزعتر والزيتون واللبنة والسلطات والمازة.");
    if(/honey/.test(n))return txt("Try with tahini, yogurt, nuts, toast or warm herbal tea.","جرّبه مع الطحينة أو اللبن أو المكسرات أو الخبز أو شاي الأعشاب.");
    if(/sumac|semaq/.test(n))return txt("Use with fattoush, onions, grilled foods, salads and mezze.","استخدمه مع الفتوش والبصل والمشاوي والسلطات والمازة.");
    if(/lentil|pulse/.test(n))return txt("Build a meal with rice or bulgur, cumin and olive oil.","حضّر وجبة مع الأرز أو البرغل والكمون وزيت الزيتون.");
    return txt("Explore related pantry products below to build a complete table.","استكشف المنتجات المرتبطة أدناه لتجهيز سفرة متكاملة.");
  }

  function productJsonLd(p){
    var image=pimage(p),url=new URL(location.href);url.searchParams.set("product",p.id);
    return {
      "@context":"https://schema.org","@type":"Product",
      name:p.nameEn,alternateName:p.nameAr||undefined,sku:p.id,
      brand:{"@type":"Brand","name":"Zayt w Mouneh"},
      category:p.category,url:url.toString(),image:image?new URL(image,location.href).toString():undefined,
      offers:(p.variants||[]).map(function(v){return {"@type":"Offer","priceCurrency":"USD","price":Number(v.price).toFixed(2),"url":url.toString()+"#"+encodeURIComponent(v.id)}})
    };
  }

  function enhanceModal(productId){
    var p=typeof productById==="function"?productById(productId):safeProducts().find(function(x){return x.id===productId});if(!p)return;
    var copy=q(".product-modal-copy");if(!copy)return;
    var extras=q(".premium-product-extras",copy);
    if(!extras){extras=document.createElement("div");extras.className="premium-product-extras";var actions=q(".product-modal-actions",copy);if(actions)actions.before(extras);else copy.appendChild(extras)}
    var feedbackUrl="https://wa.me/96181581230?text="+encodeURIComponent(txt("Feedback about ","ملاحظات حول ")+p.nameEn+": ");
    extras.innerHTML='<div class="premium-product-extra"><span>'+esc(txt("Storage guidance","طريقة الحفظ"))+'</span><p>'+esc(storageGuidance(p))+'</p></div><div class="premium-product-extra"><span>'+esc(txt("Pairs well with","يناسب"))+'</span><p>'+esc(pairingText(p))+'</p></div><div class="premium-product-extra premium-feedback"><div><span>'+esc(txt("Availability","التوفر"))+'</span><p>'+esc(txt("Final availability is confirmed directly on WhatsApp before the order is final.","يتم تأكيد التوفر النهائي مباشرة عبر واتساب قبل تثبيت الطلب."))+'</p></div><div class="premium-product-toolbar"><button type="button" data-share-product="'+esc(p.id)+'">'+esc(txt("Share product","شارك المنتج"))+'</button><a href="'+esc(feedbackUrl)+'" target="_blank" rel="noopener">'+esc(txt("Send feedback","أرسل ملاحظتك"))+'</a></div></div>';
    q("[data-share-product]",extras).addEventListener("click",function(){
      var url=new URL(location.href);url.searchParams.set("product",p.id);
      track("product_shared",{product:p.id});shareUrl(url.toString(),pname(p));
    });
    var ld=q("#premiumProductSchema");if(!ld){ld=document.createElement("script");ld.type="application/ld+json";ld.id="premiumProductSchema";document.head.appendChild(ld)}
    ld.textContent=JSON.stringify(productJsonLd(p));
    var desc=txt("Shop ","تسوّق ")+pname(p)+" · "+porigin(p)+" · "+txt("sizes and prices from the current Zayt w Mouneh catalogue.","الأحجام والأسعار من كتالوج زيت ومونة الحالي.");
    document.title=pname(p)+" | Zayt w Mouneh";
    var md=q('meta[name="description"]');if(md)md.content=desc;
    var ot=q('meta[property="og:title"]');if(ot)ot.content=pname(p)+" | Zayt w Mouneh";
    var od=q('meta[property="og:description"]');if(od)od.content=desc;
    track("product_viewed",{product:p.id,category:p.category});
  }

  function restoreMeta(){
    document.title=initialTitle;
    var md=q('meta[name="description"]');if(md)md.content=initialDescription;
    var ot=q('meta[property="og:title"]');if(ot)ot.content=initialOgTitle;
    var od=q('meta[property="og:description"]');if(od)od.content=initialOgDescription;
    var ld=q("#premiumProductSchema");if(ld)ld.remove();
  }

  function wrapCommerceFunctions(){
    try{
      if(typeof renderModal==="function"&&!renderModal._premiumWrapped){
        var baseRender=renderModal;
        renderModal=function(productId,variantId){var out=baseRender(productId,variantId);enhanceModal(productId);return out};
        renderModal._premiumWrapped=true;
      }
      if(typeof closeProduct==="function"&&!closeProduct._premiumWrapped){
        var baseClose=closeProduct;
        closeProduct=function(){var out=baseClose();restoreMeta();return out};
        closeProduct._premiumWrapped=true;
      }
      if(typeof currentModalProduct!=="undefined"&&currentModalProduct&&currentModalProduct.id)enhanceModal(currentModalProduct.id);
      if(typeof addToCart==="function"&&!addToCart._premiumWrapped){
        var baseAdd=addToCart;
        addToCart=function(p,v,qty){var out=baseAdd(p,v,qty);track("cart_added",{product:p.id,variant:v.id,qty:Number(qty)||1});return out};
        addToCart._premiumWrapped=true;
      }
    }catch(e){console.warn("Premium commerce hooks unavailable",e)}
  }

  function injectMoments(){
    if((document.body.dataset.page||"home")!=="home"||q("#pantryMoments"))return;
    var anchor=q(".social-band");if(!anchor)return;
    var sec=document.createElement("section");sec.id="pantryMoments";sec.className="premium-section pantry-moments";
    var pics=[
      ["assets/products/olive-oil.webp?v=20261002-0955",txt("Olive oil & the table","زيت الزيتون والسفرة")],
      ["assets/products/zaatar.webp?v=20261002-0955",txt("Zaatar mornings","صباحات الزعتر")],
      ["assets/products/honey.webp?v=20261002-0955",txt("Something sweet","لمسة حلوة")]
    ];
    sec.innerHTML='<div class="shell"><div class="premium-head"><div><p class="premium-kicker">'+esc(txt("Pantry moments","لحظات من المونة"))+'</p><h2>'+esc(txt("Food that feels","مونة تشبه"))+' <em>'+esc(txt("familiar.","البيت."))+'</em></h2></div><p>'+esc(txt("Follow the pantry for seasonal ideas, shop updates and everyday ways to bring Lebanese staples to the table.","تابع المونة لأفكار الموسم وأخبار المحل وطرق يومية لتقديم الأساسيات اللبنانية على السفرة."))+'</p></div><div class="moments-grid">'+pics.map(function(x){return '<a class="moment-card" href="https://instagram.com/zaytwmouneh" target="_blank" rel="noopener"><img src="'+esc(x[0])+'" alt="" loading="lazy"><span>'+esc(x[1])+' ↗</span></a>'}).join("")+'</div><a class="moments-cta" href="https://instagram.com/zaytwmouneh" target="_blank" rel="noopener">@zaytwmouneh · Instagram ↗</a></div>';
    anchor.before(sec);
  }

  function injectAvailabilityNotes(){
    qa(".product-card").forEach(function(card){
      if(card.querySelector(".premium-availability"))return;
      var actions=card.querySelector(".product-actions");if(!actions)return;
      var note=document.createElement("span");note.className="premium-availability";note.textContent=txt("Availability confirmed on WhatsApp","التوفر يُؤكد عبر واتساب");actions.before(note);
    });
  }

  function observeProductGrid(){
    var grid=q(".product-grid");if(!grid)return;
    injectAvailabilityNotes();
    new MutationObserver(function(){injectAvailabilityNotes()}).observe(grid,{childList:true,subtree:false});
  }

  function localBusinessSchema(){
    if(q("#premiumBusinessSchema"))return;
    var data={
      "@context":"https://schema.org","@type":"Store","name":"Zayt w Mouneh",
      "url":"https://zaytwmouneh.veyro-202.workers.dev/",
      "telephone":"+96181581230","currenciesAccepted":"USD",
      "address":{"@type":"PostalAddress","addressLocality":"Sebline","addressCountry":"LB"},
      "sameAs":["https://instagram.com/zaytwmouneh"]
    };
    var s=document.createElement("script");s.type="application/ld+json";s.id="premiumBusinessSchema";s.textContent=JSON.stringify(data);document.head.appendChild(s);
  }

  function bindOrderMemory(){
    var f=q("#orderForm");if(f)f.addEventListener("submit",function(){saveLastOrder();track("whatsapp_order_started",{items:basketPayload().length})},true);
  }

  function refreshLanguage(){
    var seasonal=q(".premium-seasonal");if(seasonal)seasonal.remove();
    injectSeasonal();
    qa(".premium-recipes-nav").forEach(function(x){x.textContent=txt("Recipes","وصفات")});
    qa(".premium-recipes-footer").forEach(function(x){x.textContent=txt("Recipes & table ideas","وصفات وأفكار للمائدة")});
    var sections=["#premiumCollections","#premiumProvenance","#premiumRecipes","#premiumShopTools","#pantryMoments"];
    var any=sections.some(function(sel){return !!q(sel)});
    if(any){
      sections.forEach(function(sel){var n=q(sel);if(n)n.remove()});
      injectCollections();injectProvenance();injectRecipes();injectShopTools();injectMoments();
    }
    var old=q("#giftPremiumControls");
    if(old){
      var oldTheme=(q("#premiumRibbon")||{}).value||"Olive green";
      var oldCard=(q("#premiumCardLanguage")||{}).value||"English";
      var oldHide=q("#premiumHidePrices")?q("#premiumHidePrices").checked:true;
      old.remove();
      injectGiftPremium();
      if(q("#premiumRibbon"))q("#premiumRibbon").value=oldTheme;
      if(q("#premiumCardLanguage"))q("#premiumCardLanguage").value=oldCard;
      if(q("#premiumHidePrices"))q("#premiumHidePrices").checked=oldHide;
    }else{
      injectGiftPremium();
    }
    qa("[data-gift-lang]").forEach(function(x){x.classList.toggle("is-active",x.dataset.giftLang===(isAr()?"ar":"en"))});
    updateGiftPreview();
  }

  function init(){
    document.documentElement.classList.add("premium-ui");
    wrapCommerceFunctions();
    injectNavigation();
    injectSeasonal();
    injectCollections();
    injectProvenance();
    injectRecipes();
    injectShopTools();
    injectGiftPremium();
    injectMoments();
    maybeSharedBasket();
    observeProductGrid();
    localBusinessSchema();
    bindOrderMemory();
    bindRecipeButtons(document);
    qa("[data-lang],[data-welcome-lang]").forEach(function(btn){btn.addEventListener("click",function(){setTimeout(refreshLanguage,40)})});
    new MutationObserver(function(muts){if(muts.some(function(m){return m.attributeName==="lang"||m.attributeName==="dir"}))setTimeout(refreshLanguage,0)}).observe(document.documentElement,{attributes:true,attributeFilter:["lang","dir"]});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();
