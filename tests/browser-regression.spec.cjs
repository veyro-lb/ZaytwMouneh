"use strict";
const {test,expect}=require("@playwright/test");
const BASE="http://127.0.0.1:4173";
const ROUTES=["/index.html","/shop.html","/product.html?product=semaq","/gift.html","/recipes.html","/about.html","/contact.html","/wholesale.html","/account.html","/checkout.html","/order.html","/returns.html","/returns-policy.html","/terms.html","/privacy.html"];
const CRITICAL=["/index.html","/shop.html","/product.html?product=semaq","/account.html","/checkout.html","/returns.html"];
const VIEWPORTS=[
 {name:"320",width:320,height:760},{name:"360",width:360,height:800},{name:"375",width:375,height:812},{name:"390",width:390,height:844},
 {name:"430",width:430,height:932},{name:"tablet",width:768,height:1024},{name:"laptop",width:1024,height:768},{name:"desktop",width:1280,height:900}
];
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>{try{
  localStorage.setItem("zwm-welcome-seen-v3","1");
  localStorage.setItem("zwm-cart-v5",JSON.stringify({"semaq::semaq-250-g":{productId:"semaq",variantId:"semaq-250-g",qty:1}}));
 }catch{}});
});
function watchErrors(page){
 let errors=[];
 page.on("pageerror",err=>errors.push("uncaught: "+err.message));
 page.on("console",msg=>{
  if(msg.type()!=="error")return;
  const value=msg.text();
  if(/Failed to load resource|ERR_|CORS|Access to fetch/i.test(value))return;
  const url=msg.location().url||"";
  if(!url||url.startsWith(BASE))errors.push("console: "+value);
 });
 return {reset(){errors=[]},read(){return errors.slice()}};
}
async function settle(page){await page.waitForLoadState("domcontentloaded");await page.waitForTimeout(180)}
async function inspectPage(page){
 return page.evaluate(()=>{
  const de=document.documentElement,body=document.body,main=document.querySelector("main"),rect=main&&main.getBoundingClientRect();
  return {width:innerWidth,docWidth:de.scrollWidth,bodyWidth:body?body.scrollWidth:0,mainVisible:!!(main&&rect&&rect.width>0&&rect.height>20&&getComputedStyle(main).visibility!=="hidden"&&getComputedStyle(main).display!=="none")};
 });
}
async function setLocale(page,locale){
 await page.goto("/index.html",{waitUntil:"domcontentloaded"});
 await page.evaluate(code=>{
  localStorage.setItem("zwm-locale-v3",code);
  if(code==="fr"){localStorage.setItem("zwm:french:v1","1");localStorage.setItem("zwm-lang-v2","en")}
  else{localStorage.removeItem("zwm:french:v1");localStorage.setItem("zwm-lang-v2",code)}
 },locale);
}
test("Chromium responsive matrix has no horizontal overflow or broken main content",async({page,browserName})=>{
 test.skip(browserName!=="chromium","Chromium owns the full viewport matrix");
 const failures=[],errors=watchErrors(page);
 for(const vp of VIEWPORTS){
  await page.setViewportSize({width:vp.width,height:vp.height});
  for(const route of ROUTES){
   errors.reset();
   const response=await page.goto(route,{waitUntil:"domcontentloaded"});await settle(page);
   const m=await inspectPage(page);
   if(response&&response.status()>=400)failures.push(`${vp.name} ${route}: HTTP ${response.status()}`);
   if(m.docWidth>m.width+1||m.bodyWidth>m.width+1)failures.push(`${vp.name} ${route}: horizontal overflow viewport=${m.width} doc=${m.docWidth} body=${m.bodyWidth}`);
   if(!m.mainVisible)failures.push(`${vp.name} ${route}: main content not visibly rendered`);
   for(const err of errors.read())failures.push(`${vp.name} ${route}: ${err}`);
  }
 }
 expect(failures,failures.join("\n")).toEqual([]);
});
test("phone primary header controls keep meaningful touch boxes",async({page,browserName})=>{
 test.skip(browserName!=="chromium","Chromium owns the detailed touch audit");
 const failures=[];
 const checks=[
  ["/index.html","#navToggle,#cartButton"],
  ["/product.html?product=semaq",".c6-nav-actions button,.c6-nav-actions a"],
  ["/checkout.html",".commerce-header-actions button,.commerce-header-actions a"],
  ["/wholesale.html",".wholesale-langs button,.wholesale-langs .fr-globe-toggle"]
 ];
 for(const width of [320,360,390,430]){
  await page.setViewportSize({width,height:844});
  for(const [route,selector] of checks){
   await page.goto(route,{waitUntil:"domcontentloaded"});await settle(page);
   const bad=await page.locator(selector).evaluateAll(nodes=>nodes.filter(el=>{
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    const visible=r.width>0&&r.height>0&&s.display!=="none"&&s.visibility!=="hidden"&&s.pointerEvents!=="none";
    return visible&&(r.width<43.5||r.height<43.5);
   }).map(el=>({tag:el.tagName,id:el.id,cls:el.className,w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
   if(bad.length)failures.push(`${width} ${route}: ${JSON.stringify(bad)}`);
  }
 }
 expect(failures,failures.join("\n")).toEqual([]);
});
async function exerciseMenu(page,rtl=false){
 await page.setViewportSize({width:390,height:844});
 if(rtl)await setLocale(page,"ar");
 await page.goto("/index.html",{waitUntil:"domcontentloaded"});await settle(page);
 if(rtl)expect(await page.locator("html").getAttribute("dir")).toBe("rtl");
 const toggle=page.locator("#navToggle"),panel=page.locator("#navLinks");
 await toggle.click();
 await expect(toggle).toHaveAttribute("aria-expanded","true");
 await expect(panel).toHaveClass(/is-open/);
 expect(await page.evaluate(()=>document.body.classList.contains("menu-open"))).toBe(true);
 expect(await page.evaluate(()=>getComputedStyle(document.body).overflow)).toBe("hidden");
 let box=await panel.boundingBox();
 expect(box).not.toBeNull();expect(box.x).toBeGreaterThanOrEqual(-1);expect(box.x+box.width).toBeLessThanOrEqual(391);expect(box.y+box.height).toBeLessThanOrEqual(845);
 await page.keyboard.press("Escape");
 await expect(panel).not.toHaveClass(/is-open/);await expect(toggle).toBeFocused();
 expect(await page.evaluate(()=>document.body.classList.contains("menu-open"))).toBe(false);
 await toggle.click();
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(120);
 box=await panel.boundingBox();
 expect(box.x).toBeGreaterThanOrEqual(-1);expect(box.x+box.width).toBeLessThanOrEqual(845);expect(box.y).toBeGreaterThanOrEqual(0);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(120);
 await page.evaluate(()=>{const brand=document.querySelector(".site-header .brand");brand&&brand.addEventListener("click",e=>e.preventDefault(),{once:true})});
 await page.locator(".site-header .brand").click();await expect(panel).not.toHaveClass(/is-open/);
 await toggle.click();
 await page.evaluate(()=>{const link=document.querySelector("#navLinks a[href]");if(link){link.addEventListener("click",e=>e.preventDefault(),{once:true});link.click()}});
 await expect(panel).not.toHaveClass(/is-open/);
 const closed=await page.evaluate(()=>{const p=document.querySelector("#navLinks"),a=p&&p.querySelector("a");return {inert:!!(p&&p.inert),display:p?getComputedStyle(p).display:"",pointer:a?getComputedStyle(a).pointerEvents:""}});
 expect(closed.inert||closed.display==="none"||closed.pointer==="none").toBe(true);
 expect(await page.evaluate(()=>getComputedStyle(document.body).overflow)).not.toBe("hidden");
}
test("storefront menu opens/closes once, locks scroll, survives resize and restores focus",async({page})=>{await exerciseMenu(page,false)});
test("Arabic RTL storefront menu keeps the same interaction contract",async({page})=>{await exerciseMenu(page,true)});
test("Arabic and French smoke coverage stays overflow-free on major pages",async({page})=>{
 const failures=[];await page.setViewportSize({width:390,height:844});
 for(const locale of ["ar","fr"]){
  await setLocale(page,locale);
  for(const route of ROUTES){
   await page.goto(route,{waitUntil:"domcontentloaded"});await settle(page);
   const lang=await page.locator("html").getAttribute("lang"),dir=await page.locator("html").getAttribute("dir");
   if(lang!==locale)failures.push(`${locale} ${route}: html lang=${lang}`);
   if(locale==="ar"&&dir!=="rtl")failures.push(`${locale} ${route}: dir=${dir}`);
   if(locale==="fr"&&dir!=="ltr")failures.push(`${locale} ${route}: dir=${dir}`);
   const m=await inspectPage(page);
   if(m.docWidth>m.width+1||m.bodyWidth>m.width+1)failures.push(`${locale} ${route}: horizontal overflow viewport=${m.width} doc=${m.docWidth} body=${m.bodyWidth}`);
   if(!m.mainVisible)failures.push(`${locale} ${route}: main content not visibly rendered`);
  }
 }
 expect(failures,failures.join("\n")).toEqual([]);
});
test("WebKit 390px smoke covers critical storefront routes",async({page,browserName})=>{
 test.skip(browserName!=="webkit","WebKit-only smoke");
 await page.setViewportSize({width:390,height:844});
 const failures=[],errors=watchErrors(page);
 for(const route of CRITICAL){
  errors.reset();const response=await page.goto(route,{waitUntil:"domcontentloaded"});await settle(page);const m=await inspectPage(page);
  if(response&&response.status()>=400)failures.push(`${route}: HTTP ${response.status()}`);
  if(m.docWidth>m.width+1||m.bodyWidth>m.width+1)failures.push(`${route}: horizontal overflow viewport=${m.width} doc=${m.docWidth} body=${m.bodyWidth}`);
  if(!m.mainVisible)failures.push(`${route}: main content not visibly rendered`);
  for(const err of errors.read())failures.push(`${route}: ${err}`);
 }
 expect(failures,failures.join("\n")).toEqual([]);
});
