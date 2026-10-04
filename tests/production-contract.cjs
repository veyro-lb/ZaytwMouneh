const fs=require("node:fs");
const assert=require("node:assert/strict");
const read=p=>fs.readFileSync(p,"utf8");

const headers=read("public/_headers");
assert.match(headers,/\/\*\.js[\s\S]*max-age=31536000, immutable/);
assert.match(headers,/\/\*\.css[\s\S]*max-age=31536000, immutable/);
assert.match(headers,/\/account\*[\s\S]*no-store/);
assert.match(headers,/Content-Security-Policy:/);
assert.match(headers,/X-Frame-Options: DENY/);

const redirects=read("public/_redirects");
for(const line of ["/terms /terms-and-rewards 301","/privacy /privacy-and-data 301","/account.html /account 301","/checkout.html /checkout 301"]) assert(redirects.includes(line),line);

const index=JSON.parse(read("public/product-index.json"));
assert.equal(index.products.length,328,"product index must include all 328 shopper-facing products");
const ids=new Set(index.products.map(p=>p.id));
assert.equal(ids.size,index.products.length,"product IDs must be unique");

const sitemap=read("public/sitemap.xml");
for(const id of ids) assert(sitemap.includes("/products/"+id),"missing sitemap product "+id);

const wrangler=JSON.parse(read("wrangler.jsonc"));
assert.equal(wrangler.main,"./worker.js");
assert.equal(wrangler.assets.directory,"./public");
assert.equal(wrangler.assets.binding,"ASSETS");
assert(wrangler.assets.run_worker_first.includes("/products/*"));
assert.equal(wrangler.assets.not_found_handling,"404-page");
assert(fs.existsSync("public/404.html"),"custom 404 must exist");

const worker=read("worker.js");
assert(worker.includes('"@type":"Product"'));
assert(worker.includes("/product-index.json"));
assert(worker.includes("/products/"));

const canonicalFiles=["public/index.html","public/shop.html","public/gift.html","public/contact.html","public/terms-and-rewards.html","public/privacy-and-data.html","public/app.js","public/premium.js","public/fr-runtime-v1.js"];
const joined=canonicalFiles.map(read).join("\n");
for(const stale of ["Packing, availability and delivery are confirmed on WhatsApp.","Confirm on WhatsApp","The fee is confirmed on WhatsApp","The available payment method is confirmed with the final order on WhatsApp.","sending a WhatsApp request","opening a pre-filled WhatsApp message","Availability confirmed on WhatsApp","Secure website checkout","secure website checkout"]) assert(!joined.includes(stale),"stale commerce copy: "+stale);
assert(read("public/fr-runtime-v1.js").includes("Availability verified with your order"),"French runtime must cover corrected availability copy");

for(const legacy of ["index.html","shop.html","gift.html","about.html","contact.html","recipes.html","app.js","styles.css","products-data.js","product-photos.js","premium.js","wrangler.toml","sitemap.xml","robots.txt","_headers"]) assert(!fs.existsSync(legacy),"legacy root storefront file must be removed: "+legacy);

assert(!read("public/auth-return.js").includes('ACCOUNT_PATH="/account.html"'));
console.log("production contract passed: "+index.products.length+" products, "+ids.size+" unique IDs");
