/* ZWM shop-only price ceiling and product photo enlargement. No checkout/cache interception. */
(function(){
  "use strict";
  if(window.__ZWM_SHOP_EXTRAS_V1__)return;
  window.__ZWM_SHOP_EXTRAS_V1__=true;

  var params=new URL(location.href).searchParams;
  function parseCeiling(value){
    if(value===null||value==="")return null;
    var n=Number(value);
    return Number.isFinite(n)&&n>=0?Math.floor(n):null;
  }
  var ceiling=parseCeiling(params.get("maxPrice"));
  var renderTimer=0,initialized=false,viewer=null,lastTrigger=null;
  function products(){return typeof PRODUCTS_DATA!=="undefined"&&Array.isArray(PRODUCTS_DATA)?PRODUCTS_DATA:[]}
  function lowestPrice(p){
    var vals=(p&&Array.isArray(p.variants)?p.variants:[]).map(function(v){return Number(v.price)}).filter(Number.isFinite);
    return vals.length?Math.min.apply(null,vals):Infinity;
  }
  function catalogMaximum(){
    var vals=products().map(lowestPrice).filter(Number.isFinite);
    return Math.max(1,Math.ceil(vals.length?Math.max.apply(null,vals):1));
  }
  function language(){return document.documentElement.lang==="ar"?"ar":document.documentElement.lang==="fr"?"fr":"en"}
  function copy(en,ar,fr){return language()==="ar"?ar:language()==="fr"?fr:en}
  function usd(n){
    return "$"+Number(n).toLocaleString("en-US",{maximumFractionDigits:0});
  }
  function allowsPrice(p){return ceiling===null||lowestPrice(p)<=ceiling}
  window.ZWM_CATALOGUE_ENHANCEMENTS={allowsPrice:allowsPrice};

  function updateBudget(){
    var input=document.getElementById("zwmPriceCeiling");
    var output=document.getElementById("zwmPriceValue");
    var label=document.getElementById("zwmPriceLabel");
    var hint=document.getElementById("zwmPriceHint");
    var reset=document.getElementById("zwmPriceReset");
    if(!input||!output)return;
    var max=catalogMaximum();
    if(ceiling!==null&&ceiling>=max)ceiling=null;
    input.max=String(max);
    input.value=String(ceiling===null?max:Math.min(max,ceiling));
    var selected=ceiling===null?copy("All prices","كل الأسعار","Tous les prix"):copy("Up to ","حتى ","Jusqu’à ")+usd(ceiling);
    output.textContent=selected;
    input.setAttribute("aria-valuetext",selected);
    if(label)label.textContent=copy("Maximum starting price","السعر الابتدائي الأقصى","Prix de départ maximal");
    if(hint)hint.textContent=copy("Based on the lowest-priced pack","بحسب سعر العبوة الأقل","Selon le format le moins cher");
    if(reset){reset.textContent=copy("Clear price","إزالة حدّ السعر","Effacer le prix");reset.disabled=ceiling===null}
  }
  function syncUrl(){
    if(!history.replaceState)return;
    var url=new URL(location.href);
    if(ceiling===null)url.searchParams.delete("maxPrice");
    else url.searchParams.set("maxPrice",String(ceiling));
    history.replaceState(history.state,"",url.pathname+url.search+url.hash);
  }
  function rerender(){
    if(typeof window.renderProducts==="function")window.renderProducts();
  }
  function applyPrice(){
    if(renderTimer){clearTimeout(renderTimer);renderTimer=0}
    var input=document.getElementById("zwmPriceCeiling");
    if(!input)return;
    var max=catalogMaximum(),next=Math.min(max,Math.max(0,Math.floor(Number(input.value)||0)));
    ceiling=next>=max?null:next;
    updateBudget();
    syncUrl();
    rerender();
  }
  function resetPrice(shouldRender){
    if(renderTimer){clearTimeout(renderTimer);renderTimer=0}
    ceiling=null;updateBudget();syncUrl();
    if(shouldRender)rerender();
  }
  function createZoom(){
    var visual=document.querySelector("#productModal .product-modal-visual");
    if(!visual||document.getElementById("zwmProductZoom"))return;
    var button=document.createElement("button");
    button.type="button";button.id="zwmProductZoom";button.className="zwm-zoom-trigger";
    button.textContent=copy("Enlarge image","تكبير الصورة","Agrandir l’image");
    button.hidden=true;visual.appendChild(button);
    viewer=document.createElement("dialog");
    viewer.className="zwm-product-lightbox";
    viewer.id="zwmProductLightbox";
    viewer.setAttribute("aria-labelledby","zwmZoomTitle");
    viewer.innerHTML='<button type="button" class="zwm-zoom-close" aria-label="Close enlarged image">×</button><img alt=""><p class="zwm-zoom-title" id="zwmZoomTitle"></p>';
    document.body.appendChild(viewer);
    var close=viewer.querySelector("button");
    close.addEventListener("click",function(){if(viewer.open)viewer.close()});
    viewer.addEventListener("click",function(event){if(event.target===viewer&&viewer.open)viewer.close()});
    viewer.addEventListener("close",function(){
      if(lastTrigger&&lastTrigger.isConnected)lastTrigger.focus({preventScroll:true});
      lastTrigger=null;
    });
    button.addEventListener("click",function(){
      var source=document.querySelector("#productModalMark img");
      if(!source||!source.getAttribute("src")||typeof viewer.showModal!=="function")return;
      var image=viewer.querySelector("img"),title=document.querySelector("#productModalTitle");
      image.src=source.currentSrc||source.getAttribute("src");
      image.alt=source.alt||title&&title.textContent||"";
      viewer.querySelector("#zwmZoomTitle").textContent=title?title.textContent:"";
      close.setAttribute("aria-label",copy("Close enlarged image","إغلاق الصورة المكبرة","Fermer l’image agrandie"));
      lastTrigger=button;viewer.showModal();close.focus();
    });
    // Native dialog owns keyboard focus while open; prevent the quick-view Tab trap and Escape handler.
    document.addEventListener("keydown",function(event){
      if(!viewer||!viewer.open)return;
      if(event.key==="Escape"){
        event.preventDefault();event.stopImmediatePropagation();viewer.close();
      }else if(event.key==="Tab"){
        event.stopImmediatePropagation();
      }
    },true);
    updateZoom();
    var mark=document.getElementById("productModalMark");
    if(mark&&typeof MutationObserver!=="undefined"){
      new MutationObserver(updateZoom).observe(mark,{childList:true,subtree:false});
    }
  }
  function updateZoom(){
    var button=document.getElementById("zwmProductZoom");
    if(!button)return;
    var image=document.querySelector("#productModalMark img");
    button.hidden=!image;
    button.textContent=copy("Enlarge image","تكبير الصورة","Agrandir l’image");
    button.setAttribute("aria-label",button.textContent);
  }
  function init(){
    if(initialized||document.body.dataset.page!=="shop")return;
    initialized=true;
    var input=document.getElementById("zwmPriceCeiling");
    if(input){
      input.addEventListener("input",function(){
        if(renderTimer)clearTimeout(renderTimer);
        var value=Math.max(0,Math.floor(Number(input.value)||0));
        var max=catalogMaximum();
        var output=document.getElementById("zwmPriceValue");
        var selected=value>=max?copy("All prices","كل الأسعار","Tous les prix"):copy("Up to ","حتى ","Jusqu’à ")+usd(value);
        if(output)output.textContent=selected;
        input.setAttribute("aria-valuetext",selected);
        renderTimer=setTimeout(applyPrice,130);
      });
      input.addEventListener("change",applyPrice);
      document.getElementById("zwmPriceReset").addEventListener("click",function(){resetPrice(true)});
      var clear=document.getElementById("clearSearch");
      if(clear)clear.addEventListener("click",function(){resetPrice(false)},true);
      updateBudget();
      rerender();
      window.addEventListener("zwm:catalog-cache-updated",function(){updateBudget();rerender()});
      document.addEventListener("zwm:localechange",function(){updateBudget();updateZoom()});
    }
    createZoom();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
