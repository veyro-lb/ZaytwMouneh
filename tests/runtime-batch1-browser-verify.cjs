const assert=require("node:assert/strict");
const http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const root=path.join(process.cwd(),"public");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".json":"application/json; charset=utf-8",".webp":"image/webp",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg"};
const server=http.createServer((req,res)=>{const u=new URL(req.url,"http://127.0.0.1");let rel=decodeURIComponent(u.pathname).replace(/^\/+/, "");if(!rel)rel="index.html";if(!path.extname(rel))rel+=".html";const target=path.resolve(root,rel);if(!target.startsWith(root+path.sep)||!fs.existsSync(target)){res.writeHead(404);return res.end("Not found")}res.writeHead(200,{"content-type":mime[path.extname(target)]||"application/octet-stream","cache-control":"no-store"});fs.createReadStream(target).pipe(res)});
const routes=["/account.html","/checkout.html","/returns.html","/order.html"];
const viewports=[["360",360,800],["390",390,844],["desktop",1280,900]];
const locales=["en","ar","fr"];
(async()=>{await new Promise(r=>server.listen(0,"127.0.0.1",r));const base="http://127.0.0.1:"+server.address().port,browser=await chromium.launch({headless:true});try{
 for(const [vp,w,h] of viewports){const ctx=await browser.newContext({viewport:{width:w,height:h}}),page=await ctx.newPage();
  await page.route("**/*",route=>{const u=new URL(route.request().url());if(u.origin===base)return route.continue();if(u.pathname.includes("/rest/v1/")||u.pathname.includes("/auth/v1/")||u.pathname.includes("/functions/v1/"))return route.fulfill({status:200,contentType:"application/json",body:"{}"});return route.fulfill({status:204,body:""})});
  for(const pathName of routes)for(const lang of locales){const errors=[];page.removeAllListeners("pageerror");page.removeAllListeners("console");page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.type()==="error")errors.push(m.text())});await page.goto(base+pathName,{waitUntil:"domcontentloaded"});await page.evaluate(l=>{document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";try{localStorage.setItem("zwm-lang-v2",l)}catch{}document.dispatchEvent(new CustomEvent("zwm:localechange"))},lang);await page.waitForTimeout(180);const s=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-window.innerWidth,dir:document.documentElement.dir,main:!!(document.querySelector("main")||document.body)}));assert(s.main,vp+" "+pathName+" "+lang+" missing main");assert(s.overflow<=1,vp+" "+pathName+" "+lang+" overflow "+s.overflow);assert.equal(s.dir,lang==="ar"?"rtl":"ltr",vp+" "+pathName+" "+lang+" direction mismatch");assert.deepEqual(errors,[],vp+" "+pathName+" "+lang+" browser errors: "+errors.join(" | "));}
  await ctx.close();
 }
 console.log("Runtime browser verification passed: account/checkout/returns/order at 360, 390, desktop in EN/AR/FR.");
}finally{await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
