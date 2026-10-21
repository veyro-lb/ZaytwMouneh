const assert=require("node:assert/strict");
const http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const {chromium,webkit}=require("playwright");
const root=path.join(process.cwd(),"public");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".json":"application/json; charset=utf-8",".webp":"image/webp",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".woff2":"font/woff2"};
const server=http.createServer((req,res)=>{const u=new URL(req.url,"http://127.0.0.1");let rel=decodeURIComponent(u.pathname).replace(/^\/+/, "");if(!rel)rel="index.html";if(!path.extname(rel))rel+=".html";const target=path.resolve(root,rel);if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||fs.statSync(target).isDirectory()){res.writeHead(404,{"content-type":"text/plain"});res.end("Not found");return}res.writeHead(200,{"content-type":mime[path.extname(target)]||"application/octet-stream","cache-control":"no-store"});fs.createReadStream(target).pipe(res)});
const listen=()=>new Promise(r=>server.listen(0,"127.0.0.1",r)),close=()=>new Promise(r=>server.close(r));
const routes=fs.readdirSync(root).filter(name=>name.endsWith(".html")&&name!=="admin.html").map(name=>"/"+name);
routes.push("/product.html?product=baking-powder");
if(process.env.ZWM_ROUTES){const chosen=process.env.ZWM_ROUTES.split(",");for(let i=routes.length-1;i>=0;i--)if(!chosen.includes(routes[i]))routes.splice(i,1);}
let viewports=[["360x800",360,800],["390x844",390,844],["430x932",430,932],["tablet",768,1024],["desktop",1280,900]];
if(process.env.ZWM_VIEWPORTS)viewports=viewports.filter(x=>process.env.ZWM_VIEWPORTS.split(",").includes(x[0]));
async function prep(page,base){
 await page.route("**/*",route=>{
  const u=new URL(route.request().url());
  if(u.origin===base)return route.continue();
  if(route.request().resourceType()==="stylesheet")return route.fulfill({status:200,contentType:"text/css",body:""});
  if(u.pathname.includes("/rest/v1/")){
   const body=u.pathname.endsWith("/rpc/zwm_checkout")
    ?JSON.stringify({delivery:{enabled:true,fee:5,zones:[]},payment_methods:[{code:"cash_on_delivery",active:true}]})
    :u.pathname.includes("/rpc/")?JSON.stringify({config:{base_rate:1}}):"[]";
   return route.fulfill({status:200,contentType:"application/json",body});
  }
  return route.fulfill({status:204,body:""});
 });
}
(async()=>{
 await listen();const base="http://127.0.0.1:"+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [360,1280])for(const locale of ['en','ar','fr']){
   const context=await browser.newContext({viewport:{width,height:900}});
   await context.addInitScript(lang=>{
    localStorage.setItem('zwm-welcome-seen-v3','1');
    sessionStorage.setItem('zwm-golden-harvest-2026-popup-seen-v1','1');
    localStorage.setItem('zwm-locale-v3',lang);
    localStorage.setItem('zwm-lang-v2',lang==='ar'?'ar':'en');
    localStorage.setItem('zwm:french:v1',lang==='fr'?'1':'0');
   },locale);
   const page=await context.newPage();await prep(page,base);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
   const card=page.locator('[data-iq-product="extra-virgin-olive-oil"]');
   await card.waitFor();
   await card.locator('[data-iq-add]').click();
   assert.equal(await card.locator('[data-iq-quantity]').textContent(),'1');
   await card.locator('[data-iq-delta="1"]').click();
   assert.equal(await card.locator('[data-iq-quantity]').textContent(),'2');
   await card.locator('[data-iq-delta="-1"]').click();
   assert.equal(await page.locator('[data-iq-cart-count]').textContent(),'1');
   const select=card.locator('[data-iq-select]');
   await select.selectOption({index:1});
   const variant=await select.inputValue();
   await card.locator('[data-iq-view]').click();
   await page.locator('#productModal.is-open').waitFor();
   assert.equal(await page.locator('[data-modal-variant].is-active').getAttribute('data-modal-variant'),variant);
   await page.keyboard.press('Escape');
   await page.locator('[data-iq-filter="budget"]').click();
   assert(await page.locator('[data-iq-select] option').evaluateAll(options=>options.every(o=>Number(o.textContent.split('·').pop().replace(/[^0-9.]/g,''))<10)));
   await page.locator('[data-iq-filter="all"]').click();
   await page.locator('[data-iq-more]').click();
   assert.equal(await page.locator('.iq-card').count(),16);
   assert(await page.locator('#instant-shop').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&el.scrollWidth<=el.clientWidth+1}));
   fs.mkdirSync('browser-artifacts',{recursive:true});
   await page.locator('#instant-shop').screenshot({path:'browser-artifacts/instant-shop-'+width+'-'+locale+'.png'});
   await page.locator('[data-iq-review]').click();
   await page.locator('body.cart-open').waitFor();
   assert.equal(await page.locator('#cartCount').textContent(),'1');
   assert.deepEqual(errors,[]);
   console.log(width+' '+locale+': homepage shopping, quick view, filters, quantity, basket and layout passed');
   await context.close();
  }
 }finally{await browser.close();await close()}
})().catch(e=>{console.error(e);process.exitCode=1});
