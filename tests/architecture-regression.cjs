const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const root=process.cwd(),pub=path.join(root,"public"),src=path.join(root,"src");
const rootDuplicates=[".nojekyll","_headers","about.html","app.js","contact.html","gift-v3.css","gift-v4.css","gift.html","index.html","premium.css","premium.js","product-photos.js","products-data.js","recipes.html","robots.txt","shop.html","sitemap.xml","styles.css","assets"];
for(const name of rootDuplicates)assert(!fs.existsSync(path.join(root,name)),"stale root storefront duplicate returned: "+name);
for(const name of ["site-runtime-v7.js","site-runtime-v8.js","mouneh-rewards-v7.js","mouneh-rewards-v7.css","premium.js","gift-v3.css"])assert(!fs.existsSync(path.join(pub,name)),"retired deploy generation returned: "+name);
const publicPages=fs.readdirSync(pub).filter(n=>n.endsWith(".html")).sort();
const sourcePages=fs.readdirSync(path.join(src,"pages")).filter(n=>n.endsWith(".html")).sort();
assert.deepEqual(sourcePages,publicPages,"every public HTML page must have one canonical source page");
for(const file of sourcePages){
 const source=fs.readFileSync(path.join(src,"pages",file),"utf8");
 assert(!/\?v=20\d{6}/.test(source),file+" contains a manual date cache token");
 assert(source.includes("/asset-versions.js"),file+" must bootstrap automatic asset versioning");
}
for(const file of ["index.html","shop.html","gift.html","recipes.html","about.html","contact.html"])assert(fs.readFileSync(path.join(src,"pages",file),"utf8").includes("{{> storefront-header}}"),file+" must use the shared storefront header");
for(const file of ["privacy.html","terms.html","privacy-policy.html","terms-of-service.html","terms-and-rewards.html"])assert(fs.readFileSync(path.join(src,"pages",file),"utf8").includes("{{> legal-header}}"),file+" must use the legal header variant");
assert(fs.readFileSync(path.join(src,"pages","product.html"),"utf8").includes('class="c6-product-header"'),"product specialized shell changed");
assert(fs.readFileSync(path.join(src,"pages","checkout.html"),"utf8").includes('class="commerce-header"'),"checkout specialized shell changed");
assert(fs.readFileSync(path.join(src,"pages","order.html"),"utf8").includes('class="commerce-header"'),"order specialized shell changed");
const manifest=fs.readFileSync(path.join(pub,"asset-versions.js"),"utf8");
assert(manifest.includes("ZWM_ASSET_URL"),"asset resolver missing");
const release=JSON.parse(fs.readFileSync(path.join(pub,"release.json"),"utf8"));
assert(/^[0-9a-f]{12}$/.test(release.release),"release fingerprint must be content-addressed");
for(const file of publicPages){
 const html=fs.readFileSync(path.join(pub,file),"utf8");
 assert(!html.includes("{{>"),file+" has unresolved partial");
 assert(/asset-versions\.js\?v=[0-9a-f]{12}/.test(html),file+" manifest is not content-versioned");
}
for(const file of ["site-runtime-v9.js","locale-loader-v1.js","app.js","admin-config.js","customer-orders-v1.js","commerce-v1.js","product-page-v1.js","mouneh-rewards-v8.js","customer-notifications-v1.js","admin.js","premium-v2.js"]){
 const code=fs.readFileSync(path.join(pub,file),"utf8");
 assert(!/\.(?:js|css|webmanifest)\?v=20\d{6}/.test(code),file+" still has manual date cache busting");
}
console.log("architecture regression: canonical source tree, shared shells and automatic asset versioning verified");
