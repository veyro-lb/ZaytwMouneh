/* Zayt w Mouneh: 30-recipe cookbook. Reuses the storefront's existing cart and catalogue. */
(function(){
  "use strict";
  var recipes=window.ZWM_RECIPE_LIBRARY||[];
  if(document.body.dataset.page!=="recipes"||!recipes.length)return;
  var host=document.querySelector("#recipes .recipe-grid");
  if(!host)return;
  var byId=new Map(recipes.map(function(r){return [r.id,r]}));
  var catalogue=typeof PRODUCTS_DATA!=="undefined"?PRODUCTS_DATA:[];
  var products=new Map(catalogue.map(function(p){return [p.id,p]}));
  var state={query:"",category:"all",selected:new Set(),chosenVariants:{},busy:false};
  var categoryList=["all","Mains","Mezze","Salads","Breakfast","Desserts"];
  var categoriesAr={all:"الكل",Mains:"الأطباق الرئيسية",Mezze:"المازة",Salads:"السلطات",Breakfast:"الفطور والمخبوزات",Desserts:"الحلويات"};
  var categoriesEn={all:"All recipes",Mains:"Main dishes",Mezze:"Mezze",Salads:"Salads",Breakfast:"Breakfast & breads",Desserts:"Desserts"};
  var ui={
    search:["Search recipes or ingredients…","ابحث عن وصفة أو مكوّن…"],
    count:["recipes to explore","وصفة لتكتشفها"],time:["min","دقيقة"],serves:["serves","أشخاص"],
    view:["View recipe","عرض الوصفة"],add:["Add to Pantry","أضف إلى سلّتي"],
    recipe:["The recipe","الوصفة"],ingredients:["Ingredients","المكونات"],
    pantry:["Shop the pantry ingredients","تسوّق مكونات المونة"],
    fresh:["Fresh / from home","مكونات طازجة أو من البيت"],
    steps:["Let's cook","طريقة التحضير"],tips:["Kitchen tip","نصيحة من المطبخ"],
    storage:["Keeping leftovers","حفظ البقايا"],allergens:["Allergen notes","ملاحظات الحساسية"],
    selected:["Estimated pantry bundle total","المجموع التقديري لمكونات المونة"],
    excluded:["Fresh ingredients and any unchecked items are not included.","لا يشمل المكونات الطازجة أو المنتجات غير المحددة."],
    packs:["One retail pack per selected item; recipe amounts can differ from pack sizes.","عبوة بيع واحدة لكل منتج محدد؛ قد تختلف كمية الوصفة عن حجم العبوة."],
    noresults:["No recipes found. Try a different search or category.","لا توجد وصفات مطابقة. جرّب بحثاً أو فئة أخرى."],
    back:["All recipes","جميع الوصفات"],print:["Print recipe","طباعة الوصفة"],
    success:["Added to your pantry","أُضيفت إلى سلّتك"],empty:["Select at least one available pantry item.","اختر منتجاً واحداً متوفراً على الأقل."],
    unavailable:["Not currently available to order","غير متوفر للطلب حالياً"],atHome:["Not included in the pantry bundle","غير مشمول في تشكيلة المونة"],
    cart:["View My Pantry","عرض سلّتي"],prep:["Prep","تحضير"],cook:["Cook","طبخ"],
    choose:["Choose package","اختر العبوة"],all:["All","الكل"]
  };
  var root=document.createElement("div");root.className="zwm-cookbook";root.id="zwmCookbook";
  host.replaceWith(root);document.body.classList.add("zwm-cookbook-ready");
  var lastFocus=null;
  function ar(){return document.documentElement.lang==="ar"||document.documentElement.dir==="rtl"}
  function t(key){return (ui[key]||[key,key])[ar()?1:0]}
  function text(en,arabic){return ar()?(arabic||en):en}
  function escape(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
  function money(v){return "$"+Number(v||0).toFixed(2)}
  function name(p){return typeof currentName==="function"?currentName(p):text(p.nameEn,p.nameAr)}
  function variants(p){return (p.variants||[]).filter(function(v){return Number.isFinite(Number(v.price))&&Number(v.price)>=0}).slice().sort(function(a,b){return Number(a.price)-Number(b.price)})}
  function orderable(p){return p&&variants(p).length>0&&(typeof productCanOrder!=="function"||productCanOrder(p))}
  function recipeRows(r){return r.ingredients.map(function(row,i){return {index:i,amount:text(row[0],row[1]),id:row[2]||null,product:row[2]?products.get(row[2]):null}})}
  function currentVariant(row){var p=row.product;if(!p)return null;var vs=variants(p);return vs.find(function(v){return v.id===state.chosenVariants[p.id]})||vs[0]||null}
  function selectedRows(r){return recipeRows(r).filter(function(row){return row.product&&orderable(row.product)&&state.selected.has(row.index)&&currentVariant(row)})}
  function bundleTotal(r){return selectedRows(r).reduce(function(sum,row){return sum+Number(currentVariant(row).price)},0)}
  function bundleMin(r){return recipeRows(r).filter(function(row){return orderable(row.product)}).reduce(function(s,row){return s+Number(variants(row.product)[0].price)},0)}
  function routeId(){var match=decodeURIComponent(location.hash||"").match(/^#recipe\/([a-z0-9-]+)$/);return match&&byId.has(match[1])?match[1]:null}
  function recipeUrl(id){return location.pathname+(location.search||"")+"#recipe/"+encodeURIComponent(id)}
  function backUrl(){return location.pathname+(location.search||"")+"#recipes"}
  function categoryName(c){return ar()?(categoriesAr[c]||c):(categoriesEn[c]||c)}
  function art(r){return '<div class="zwm-food-art zwm-food-art--'+escape(r.category.toLowerCase())+'" aria-hidden="true"><span>'+escape(r.icon||"🍽️")+'</span><i></i></div>'}
  function card(r){
    return '<article class="zwm-recipe-card">'+
      '<a class="zwm-recipe-card-media" href="'+escape(recipeUrl(r.id))+'" data-open="'+escape(r.id)+'" aria-label="'+escape(t("view")+": "+text(r.titleEn,r.titleAr))+'">'+art(r)+'</a>'+
      '<div class="zwm-recipe-card-body"><span class="zwm-category">'+escape(categoryName(r.category))+'</span>'+
      '<h3>'+escape(text(r.titleEn,r.titleAr))+'</h3><p>'+escape(text(r.introEn,r.introAr))+'</p>'+
      '<div class="zwm-recipe-stats"><span>⏱ '+(r.prep+r.cook)+' '+escape(t("time"))+'</span><span>♧ '+r.serves+' '+escape(t("serves"))+'</span></div>'+
      '<div class="zwm-recipe-card-foot"><a class="zwm-open-link" href="'+escape(recipeUrl(r.id))+'" data-open="'+escape(r.id)+'">'+escape(t("view"))+' ↗</a><button type="button" data-pantry="'+escape(r.id)+'">'+escape(t("add"))+'</button></div></div></article>';
  }
  function renderGrid(){
    var found=recipes.filter(function(r){
      if(state.category!=="all"&&r.category!==state.category)return false;
      var hay=[r.titleEn,r.titleAr,r.introEn,r.introAr].concat(r.ingredients.map(function(x){return x[0]+" "+x[1]})).join(" ").toLowerCase();
      return hay.includes(state.query.toLowerCase().trim());
    });
    var results=root.querySelector("#zwmRecipeResults");
    if(results)results.innerHTML=found.length?found.map(card).join(""):'<p class="zwm-empty">'+escape(t("noresults"))+'</p>';
    var count=root.querySelector("#zwmRecipeCount");
    if(count)count.textContent=String(found.length)+" "+t("count");
    root.querySelectorAll("[data-filter]").forEach(function(btn){var on=btn.dataset.filter===state.category;btn.setAttribute("aria-pressed",String(on));btn.classList.toggle("is-active",on)});
  }
  function renderIndex(){
    state.selected.clear();
    root.innerHTML='<div class="zwm-cookbook-list">'+
      '<div class="zwm-cookbook-intro"><span class="zwm-kicker">'+escape(ar()?"من مطبخنا إلى سفرتك":"From our kitchen to yours")+'</span>'+
      '<h1>'+escape(ar()?"صُنعت بحبّ، وتُشارك بمحبة.":"Made with tradition. Shared with love.")+'</h1>'+
      '<p>'+escape(ar()?"٣٠ وصفة لبنانية من أكل البيت اليومي إلى حلويات المناسبات. اختر الوصفة وجهّز مكونات المونة من متجرنا.":"Discover 30 Lebanese recipes, from everyday comfort dishes to festive family favourites. Choose a dish, then shop the pantry ingredients from our store.")+'</p></div>'+
      '<div class="zwm-cookbook-tools"><label class="zwm-search-label" for="zwmRecipeSearch">'+escape(t("search"))+
      '<input id="zwmRecipeSearch" type="search" value="'+escape(state.query)+'" placeholder="'+escape(t("search"))+'" autocomplete="off"></label>'+
      '<div class="zwm-filters" role="group" aria-label="'+escape(ar()?"فئات الوصفات":"Recipe categories")+'">'+categoryList.map(function(c){return '<button type="button" data-filter="'+c+'" aria-pressed="'+(c===state.category)+'">'+escape(categoryName(c))+'</button>'}).join("")+'</div>'+
      '<p id="zwmRecipeCount" class="zwm-result-count" aria-live="polite"></p></div>'+
      '<div id="zwmRecipeResults" class="zwm-recipe-results"></div></div>';
    renderGrid();
  }
  function ingredient(row){
    if(!row.product||!orderable(row.product))return "";
    var p=row.product,v=currentVariant(row);var checked=state.selected.has(row.index);
    var sizes=variants(p).map(function(x){return '<option value="'+escape(x.id)+'" '+(x.id===v.id?"selected":"")+'>'+escape(ar()?(x.sizeAr||x.sizeEn):(x.sizeEn||x.sizeAr))+' · '+money(x.price)+'</option>'}).join("");
    return '<li class="zwm-shop-row"><label><input type="checkbox" data-item="'+row.index+'" '+(checked?"checked":"")+'><span><strong>'+escape(name(p))+'</strong><small>'+escape(row.amount)+'</small></span></label>'+
      '<select data-package="'+row.index+'" aria-label="'+escape(t("choose")+": "+name(p))+'">'+sizes+'</select></li>';
  }
  function detail(r){
    state.selected=new Set(recipeRows(r).filter(function(x){return orderable(x.product)}).map(function(x){return x.index}));
    var rows=recipeRows(r),fresh=rows.filter(function(row){return !row.product}),unavailable=rows.filter(function(row){return row.product&&!orderable(row.product)}),available=rows.filter(function(row){return orderable(row.product)});
    return '<article class="zwm-cookbook-detail" id="zwmRecipeDetail" tabindex="-1" data-current="'+escape(r.id)+'">'+
      '<div class="zwm-detail-back"><a href="'+escape(backUrl())+'" data-back>← '+escape(t("back"))+'</a><button type="button" data-print>⎙ '+escape(t("print"))+'</button></div>'+
      '<div class="zwm-detail-hero">'+art(r)+'<div class="zwm-detail-hero-copy"><span class="zwm-category">'+escape(categoryName(r.category))+'</span>'+
      '<h1>'+escape(text(r.titleEn,r.titleAr))+'</h1><p>'+escape(text(r.introEn,r.introAr))+'</p>'+
      '<div class="zwm-detail-stats"><span>'+escape(t("prep"))+' <b>'+r.prep+' '+escape(t("time"))+'</b></span><span>'+escape(t("cook"))+' <b>'+r.cook+' '+escape(t("time"))+'</b></span><span>'+escape(t("serves"))+' <b>'+r.serves+'</b></span></div></div></div>'+
      '<div class="zwm-detail-columns"><div class="zwm-detail-main">'+
      '<section class="zwm-cooking-ingredients"><h3>'+escape(t("ingredients"))+'</h3><ul>'+rows.map(function(row){return '<li>'+escape(row.amount)+'</li>'}).join("")+'</ul></section>'+
      '<section class="zwm-recipe-method"><h3>'+escape(t("steps"))+'</h3><ol>'+((ar()?r.stepsAr:r.stepsEn)||[]).map(function(step){return '<li>'+escape(step)+'</li>'}).join("")+'</ol></section>'+
      '<div class="zwm-recipe-note"><h3>✦ '+escape(t("tips"))+'</h3><p>'+escape(text(r.tipEn,r.tipAr))+'</p></div>'+
      '<div class="zwm-recipe-note"><h3>'+escape(t("storage"))+'</h3><p>'+escape(text(r.storageEn,r.storageAr))+'</p></div>'+
      '<div class="zwm-recipe-note"><h3>'+escape(t("allergens"))+'</h3><p>'+escape(text(r.allergensEn,r.allergensAr))+'</p></div></div>'+
      '<aside class="zwm-pantry-panel"><h3>'+escape(t("pantry"))+'</h3>'+
      (available.length?'<ul class="zwm-shop-list">'+available.map(ingredient).join("")+'</ul>':'<p>'+escape(t("unavailable"))+'</p>')+
      '<div class="zwm-bundle-total"><span>'+escape(t("selected"))+'</span><strong id="zwmBundleAmount">'+money(bundleTotal(r))+'</strong></div>'+
      '<p class="zwm-pantry-small">'+escape(t("packs"))+'</p><p class="zwm-pantry-small">'+escape(t("excluded"))+'</p>'+
      '<button type="button" id="zwmAddPantry" data-add-bundle '+(!available.length?"disabled":"")+'>'+escape(t("add"))+'</button>'+
      '<p id="zwmBundleStatus" class="zwm-bundle-status" role="status" aria-live="polite"></p>'+
      '<button class="zwm-view-pantry" type="button" data-view-cart>'+escape(t("cart"))+' →</button>'+
      '<div class="zwm-fresh-panel"><h4>'+escape(t("fresh"))+'</h4><ul>'+fresh.map(function(row){return '<li>'+escape(row.amount)+'</li>'}).join("")+'</ul><p>'+escape(t("atHome"))+'</p></div>'+
      (unavailable.length?'<div class="zwm-fresh-panel"><h4>'+escape(t("unavailable"))+'</h4><ul>'+unavailable.map(function(row){return '<li>'+escape(row.amount)+'</li>'}).join("")+'</ul></div>':'')+'</aside></div></article>';
  }
  function applyStructuredData(r){
    var old=document.getElementById("zwmRecipeStructuredData");if(old)old.remove();
    if(!r)return;
    var el=document.createElement("script");el.type="application/ld+json";el.id="zwmRecipeStructuredData";
    el.textContent=JSON.stringify({"@context":"https://schema.org","@type":"Recipe",name:text(r.titleEn,r.titleAr),description:text(r.introEn,r.introAr),recipeYield:String(r.serves),prepTime:"PT"+r.prep+"M",cookTime:"PT"+r.cook+"M",recipeIngredient:r.ingredients.map(function(x){return text(x[0],x[1])}),recipeInstructions:(ar()?r.stepsAr:r.stepsEn).map(function(s){return {"@type":"HowToStep",text:s}})});
    document.head.appendChild(el);
  }
  function renderRoute(){
    var id=routeId();
    if(id){
      var r=byId.get(id);
      root.innerHTML=detail(r);applyStructuredData(r);
      root.querySelector("#zwmRecipeDetail").focus({preventScroll:true});
      root.scrollIntoView({block:"start",behavior:"auto"});
    }else{
      renderIndex();applyStructuredData(null);
    }
  }
  function refreshPrice(){
    var r=byId.get(routeId());if(!r)return;
    var amount=root.querySelector("#zwmBundleAmount");if(amount)amount.textContent=money(bundleTotal(r));
    var btn=root.querySelector("#zwmAddPantry");if(btn)btn.disabled=!selectedRows(r).length||state.busy;
  }
  function addFromCard(id,button){
    if(state.busy)return;
    var r=byId.get(id);if(!r||typeof addToCart!=="function")return;
    var rows=recipeRows(r).filter(function(row){return orderable(row.product)});
    if(!rows.length){button.textContent=t("unavailable");return}
    state.busy=true;button.disabled=true;
    var added=0;
    try{
      rows.forEach(function(row){
        var p=row.product,v=variants(p)[0];if(!v)return;
        var previous=0;
        if(typeof cart!=="undefined"&&typeof cartKey==="function"){
          var entry=cart[cartKey(p.id,v.id)];previous=entry?Math.max(0,Number(entry.qty)||0):0;
        }
        addToCart(p,v,previous+1);added++;
      });
      button.textContent=t("success")+" ✓";
      button.setAttribute("aria-label",t("success")+" · "+added+" "+(ar()?"منتجات":"items"));
    }catch(e){
      button.textContent=ar()?"تعذّرت الإضافة":"Could not add";
    }finally{
      setTimeout(function(){
        state.busy=false;button.disabled=false;button.textContent=t("add");button.removeAttribute("aria-label");
      },1300);
    }
  }
  function addBundle(){
    if(state.busy)return;
    var r=byId.get(routeId());if(!r)return;
    var rows=selectedRows(r);var status=root.querySelector("#zwmBundleStatus");
    if(!rows.length){if(status)status.textContent=t("empty");return}
    if(typeof addToCart!=="function"){if(status)status.textContent=ar()?"تعذّر الوصول إلى السلّة. حاول مجدداً.":"Cart is unavailable. Please try again.";return}
    state.busy=true;refreshPrice();
    var added=0;
    try{
      rows.forEach(function(row){
        var p=row.product,v=currentVariant(row);
        if(!p||!v||!orderable(p))return;
        var previous=0;
        if(typeof cart!=="undefined"&&typeof cartKey==="function"){
          var entry=cart[cartKey(p.id,v.id)];previous=entry?Math.max(0,Number(entry.qty)||0):0;
        }
        addToCart(p,v,previous+1);added++;
      });
      if(status)status.textContent=t("success")+" · "+added+" "+(ar()?"منتجات":"items")+".";
    }catch(e){
      if(status)status.textContent=ar()?"تعذّر إضافة بعض المنتجات. تحقق من السلّة.":"Some items could not be added. Please check your cart.";
    }finally{
      setTimeout(function(){state.busy=false;refreshPrice()},650);
    }
  }
  root.addEventListener("click",function(e){
    var route=e.target.closest("a[data-open],a[data-back]");
    if(route&&!e.defaultPrevented&&e.button===0&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey){
      e.preventDefault();
      if(route.hasAttribute("data-open"))location.hash="recipe/"+encodeURIComponent(route.dataset.open);
      else location.hash="recipes";
      return;
    }
    var btn=e.target.closest("button");if(!btn)return;
    if(btn.hasAttribute("data-filter")){state.category=btn.dataset.filter;renderGrid();return}
    if(btn.hasAttribute("data-pantry")){
      addFromCard(btn.dataset.pantry,btn);return;
    }
    if(btn.hasAttribute("data-add-bundle")){addBundle();return}
    if(btn.hasAttribute("data-print")){window.print();return}
    if(btn.hasAttribute("data-view-cart")){if(typeof openCart==="function")openCart();else document.querySelector("#cartToggle")?.click()}
  });
  root.addEventListener("input",function(e){if(e.target.id==="zwmRecipeSearch"){state.query=e.target.value;renderGrid()}});
  root.addEventListener("change",function(e){
    var r=byId.get(routeId());if(!r)return;
    if(e.target.hasAttribute("data-item")){var i=Number(e.target.dataset.item);if(e.target.checked)state.selected.add(i);else state.selected.delete(i);refreshPrice()}
    if(e.target.hasAttribute("data-package")){var row=recipeRows(r)[Number(e.target.dataset.package)];if(row&&row.product){state.chosenVariants[row.product.id]=e.target.value;refreshPrice()}}
  });
  window.addEventListener("hashchange",renderRoute);
  var priorLang=document.documentElement.lang,priorDir=document.documentElement.dir;
  new MutationObserver(function(){
    var nextLang=document.documentElement.lang,nextDir=document.documentElement.dir;
    if(priorLang!==nextLang||priorDir!==nextDir){priorLang=nextLang;priorDir=nextDir;renderRoute()}
  }).observe(document.documentElement,{attributes:true,attributeFilter:["lang","dir"]});
  renderRoute();
})();