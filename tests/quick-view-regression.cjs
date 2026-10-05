const {JSDOM}=require("jsdom");
const fs=require("node:fs");
const assert=require("node:assert/strict");
const read=p=>fs.readFileSync("public/"+p,"utf8");
const wait=ms=>new Promise(r=>setTimeout(r,ms));

function mediaMatches(query,width){
  const max=query.match(/max-width:\s*(\d+)px/); if(max&&width>+max[1])return false;
  const min=query.match(/min-width:\s*(\d+)px/); if(min&&width<+min[1])return false;
  return true;
}
function setup(width,locale){
  let html=read("shop.html").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"");
  const dom=new JSDOM(html,{url:"https://store.example/shop",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window,d=w.document;
  Object.defineProperty(w,"innerWidth",{configurable:true,value:width});
  Object.defineProperty(w,"innerHeight",{configurable:true,value:800});
  w.requestAnimationFrame=fn=>w.setTimeout(()=>fn(Date.now()),0);
  w.cancelAnimationFrame=id=>w.clearTimeout(id);
  w.matchMedia=q=>({matches:mediaMatches(q,width),media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
  w.IntersectionObserver=class{constructor(cb){this.cb=cb}observe(el){this.cb([{target:el,isIntersecting:true}],this)}unobserve(){}disconnect(){}};
  w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
  w.HTMLElement.prototype.scrollIntoView=function(){};
  if(w.HTMLMediaElement){w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){}}
  if(!w.CSS)w.CSS={}; if(!w.CSS.escape)w.CSS.escape=s=>String(s).replace(/[^a-zA-Z0-9_-]/g,"\\$&");
  w.fetch=async()=>({ok:true,status:200,json:async()=>[],text:async()=>""});
  w.navigator.share=undefined;
  w.navigator.clipboard={writeText:async()=>{}};
  if(locale==="ar"){w.localStorage.setItem("zwm-lang-v2","ar");w.localStorage.setItem("zwm-locale-v3","ar")}
  else if(locale==="fr"){w.localStorage.setItem("zwm-lang-v2","en");w.localStorage.setItem("zwm:french:v1","1");w.localStorage.setItem("zwm-locale-v3","fr")}
  else{w.localStorage.setItem("zwm-lang-v2","en");w.localStorage.setItem("zwm-locale-v3","en")}
  const errors=[];w.console.error=(...a)=>errors.push(a.map(String).join(" "));
  w.eval(read("products-data.js"));
  w.eval(read("product-photos.js"));
  w.eval(read("app.js"));
  w.eval(read("fr-runtime-v1.js"));
  w.eval(read("conversion-v1.js"));
  d.dispatchEvent(new w.Event("DOMContentLoaded",{bubbles:true}));
  return {dom,w,d,errors};
}
async function assertOpen(ctx,button,label){
  const {w,d,errors}=ctx;
  button.click(); await wait(35);
  const modal=d.getElementById("productModal"),backdrop=d.getElementById("cartBackdrop");
  assert(modal.classList.contains("is-open"),label+" modal not visible");
  assert.equal(modal.getAttribute("aria-hidden"),"false",label+" aria-hidden");
  assert(d.body.classList.contains("modal-open"),label+" body not locked");
  assert(!backdrop.hidden&&backdrop.classList.contains("is-visible"),label+" backdrop not visible");
  assert(d.getElementById("productModalTitle").textContent.trim(),label+" title empty");
  assert(new URL(w.location.href).searchParams.get("product"),label+" product URL state missing");
  assert.equal(errors.length,0,label+" console errors: "+errors.join(" | "));
}
async function closeByButton(ctx,label){
  const {d}=ctx; d.getElementById("productModalClose").click(); await wait(340);
  assert(!d.body.classList.contains("modal-open"),label+" body still locked");
  assert(!d.getElementById("productModal").classList.contains("is-open"),label+" modal still open");
  assert.equal(d.getElementById("productModal").getAttribute("aria-hidden"),"true",label+" modal aria not reset");
  assert(!new URL(ctx.w.location.href).searchParams.get("product"),label+" product URL state not cleared");
}
async function exercise(width,locale){
  const ctx=setup(width,locale),{dom,w,d,errors}=ctx;
  try{
    await wait(80);
    let views=Array.from(d.querySelectorAll("[data-view]"));
    assert(views.length>2,width+" "+locale+" product cards missing");
    // First product + repeat open/close cycle.
    for(let i=0;i<10;i++){
      views=Array.from(d.querySelectorAll("[data-view]"));
      const b=views[i%Math.min(views.length,5)];
      await assertOpen(ctx,b,width+" "+locale+" repeat "+i);
      if(i===0){
        const add=d.getElementById("productModalAdd");
        if(!add.disabled){add.click();await wait(10);assert(+d.getElementById("cartCount").textContent>=1,"add to cart failed")}
      }
      await closeByButton(ctx,width+" "+locale+" repeat "+i);
    }
    // Escape.
    views=Array.from(d.querySelectorAll("[data-view]"));
    await assertOpen(ctx,views[0],width+" "+locale+" escape");
    d.dispatchEvent(new w.KeyboardEvent("keydown",{key:"Escape",bubbles:true}));await wait(340);
    assert(!d.body.classList.contains("modal-open"),"Escape left body locked");
    // Backdrop click.
    await assertOpen(ctx,Array.from(d.querySelectorAll("[data-view]"))[1],width+" "+locale+" backdrop");
    d.getElementById("cartBackdrop").click();await wait(340);
    assert(!d.body.classList.contains("modal-open"),"backdrop left body locked");
    // Search then Quick View.
    const search=d.getElementById("productSearch");search.value="sugar";search.dispatchEvent(new w.Event("input",{bubbles:true}));await wait(30);
    views=Array.from(d.querySelectorAll("[data-view]"));assert(views.length,"search returned no Quick View");
    await assertOpen(ctx,views[0],width+" "+locale+" search");await closeByButton(ctx,"search");
    // Category filter then Quick View.
    search.value="";search.dispatchEvent(new w.Event("input",{bubbles:true}));await wait(20);
    const select=d.getElementById("categorySelect");
    const option=Array.from(select.options).find(o=>o.value&&o.value!=="All");
    assert(option,"category option missing");select.value=option.value;select.dispatchEvent(new w.Event("change",{bubbles:true}));await wait(30);
    views=Array.from(d.querySelectorAll("[data-view]"));assert(views.length,"filter returned no Quick View");
    await assertOpen(ctx,views[0],width+" "+locale+" filter");await closeByButton(ctx,"filter");
    // Load farther into catalogue and open a later card.
    select.value="All";select.dispatchEvent(new w.Event("change",{bubbles:true}));await wait(20);
    for(let i=0;i<8;i++){const more=d.getElementById("loadMore");if(more&&!more.hidden)more.click()}
    await wait(40);views=Array.from(d.querySelectorAll("[data-view]"));
    await assertOpen(ctx,views[views.length-1],width+" "+locale+" far");await closeByButton(ctx,"far");
    // Find a multi-variant product by searching a known multi-size item.
    search.value="sugar";search.dispatchEvent(new w.Event("input",{bubbles:true}));await wait(30);
    let multi=null;
    for(const b of Array.from(d.querySelectorAll("[data-view]"))){
      b.click();await wait(20);
      const opts=d.querySelectorAll("[data-modal-variant]");
      if(opts.length>1){multi={b,opts:Array.from(opts)};break}
      d.getElementById("productModalClose").click();await wait(340);
    }
    assert(multi,"multi-variant Quick View not found");
    multi.opts[1].click();await wait(15);
    assert(d.querySelectorAll("[data-modal-variant].is-active").length===1,"variant selection failed");
    await closeByButton(ctx,"multi");
    assert.equal(errors.length,0,width+" "+locale+" console errors: "+errors.join(" | "));
    console.log(width+"px "+locale+": Quick View lifecycle/search/filter/variants/repeat cycles passed");
  } finally {dom.window.close()}
}
(async()=>{
  for(const width of [320,360,390,412,430,768,1280]){
    for(const locale of ["en","ar","fr"])await exercise(width,locale);
  }
})().catch(e=>{console.error(e);process.exitCode=1});
