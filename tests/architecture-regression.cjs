"use strict";
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const release=JSON.parse(read("public/release.json")).release;
assert.match(release,/^\d{8}-[a-z0-9-]+$/);
assert.match(read("wrangler.toml"),/directory\s*=\s*"\.\/public"/);

const forbidden=[".nojekyll","_headers","index.html","shop.html","gift.html","about.html","contact.html","recipes.html","styles.css","premium.css","premium.js","app.js","products-data.js","product-photos.js","robots.txt","sitemap.xml","gift-v3.css","gift-v4.css","assets"];
for(const entry of forbidden)assert.equal(fs.existsSync(path.join(root,entry)),false,"obsolete root storefront copy: "+entry);
assert.equal(fs.existsSync(path.join(root,"public/premium.js")),false,"unused legacy public/premium.js must stay removed");

const htmlFiles=fs.readdirSync(path.join(root,"public")).filter(n=>n.endsWith(".html")&&n!=="admin.html");
for(const name of htmlFiles){
  const html=read("public/"+name);
  const marker=html.match(/<meta\s+name=["']zwm-release["']\s+content=["']([^"']+)["']/i);
  assert.ok(marker,name+" must declare zwm-release");
  assert.equal(marker[1],release,name+" release marker must match release.json");
  assert.ok(html.includes("storefront-release.js?v="+release),name+" must load current storefront-release");
  if(html.includes("storefront-shell.css")){
    const styles=[...html.matchAll(/<link\\b[^>]*rel=["\']stylesheet["\'][^>]*>/gi)].map(m=>m[0]);
    assert.ok(styles.at(-1)?.includes("storefront-shell.css"),name+" canonical storefront shell must be the final stylesheet");
  }
}
for(const name of ["product.html","checkout.html","order.html"]){
  const html=read("public/"+name);
  for(const route of ["/terms","/privacy","/returns","/contact"])assert.ok(html.includes('href="'+route+'"'),name+" missing "+route);
}
for(const name of ["index.html","shop.html","account.html","checkout.html","product.html","returns.html","wholesale.html"]){
  const html=read("public/"+name);
  if(html.includes("site-runtime-v9.js"))assert.ok(html.includes("site-runtime-v9.js?v="+release),name+" runtime cache token drift");
  if(html.includes("mouneh-rewards-v8.js"))assert.ok(html.includes("mouneh-rewards-v8.js?v="+release),name+" rewards cache token drift");
}
const runtime=read("public/site-runtime-v9.js");
assert.ok(runtime.includes('const CONFIG_SRC = "/admin-config.js";'));
assert.ok(runtime.includes("RUNTIME_ASSET_VERSION"));
assert.doesNotMatch(runtime,/mouneh-rewards-v8\.js\?v=2026100[0-6]/);
assert.doesNotMatch(read("public/storefront-release.js"),/location\.(reload|replace)\s*\(/);

const productJs=read("public/product-page-v1.js");
assert.ok(productJs.includes('robots.content="index,follow,max-image-preview:large"'));
assert.ok(productJs.includes('"@type":"Product"'));
assert.ok(productJs.includes('var rawAvailability=String(p.availability||"").trim()'));
assert.ok(/<loc>[^<]+\/product\//.test(read("public/sitemap.xml")));
assert.match(read("public/_headers"),/\/storefront-release\.js\s+Cache-Control: no-store/);
console.log("Architecture regression passed for "+htmlFiles.length+" customer HTML pages; release "+release+".");
