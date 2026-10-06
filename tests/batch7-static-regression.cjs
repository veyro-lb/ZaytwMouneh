const fs=require("node:fs");
const assert=require("node:assert/strict");
const path=require("node:path");
const pub=path.join(process.cwd(),"public");
const read=name=>fs.readFileSync(path.join(pub,name),"utf8");
const origin="https://zaytwmouneh.veyro-202.workers.dev";
const count=(s,re)=>(s.match(re)||[]).length;

const customerPages=[
 "index.html","shop.html","gift.html","recipes.html","about.html","contact.html",
 "account.html","checkout.html","order.html","product.html","wholesale.html",
 "privacy.html","privacy-policy.html","privacy-and-data.html",
 "terms.html","terms-of-service.html","terms-and-rewards.html"
];
const indexed=[
 ["index.html","/"],["shop.html","/shop"],["gift.html","/gift"],["recipes.html","/recipes"],
 ["about.html","/about"],["contact.html","/contact"],["wholesale.html","/wholesale"],["privacy.html","/privacy"],["terms.html","/terms"]
];

for(const file of customerPages){
 const html=read(file);
 assert(html.includes("seo-a11y-v1.js"),file+" missing Batch 7 SEO/a11y runtime");
 assert(html.includes("seo-a11y-v1.css"),file+" missing Batch 7 accessibility CSS");
 assert.equal(count(html,/preload=["']auto["']/gi),0,file+" still eagerly preloads video");
 assert.equal(count(html,/href=["'][^"']*\.html(?:[?#][^"']*)?["']/gi),0,file+" contains .html internal link");
 const ids=Array.from(html.matchAll(/\bid=["']([^"']+)["']/gi),m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,file+" contains duplicate IDs");
 for(const img of html.match(/<img\b[^>]*>/gi)||[])assert(/\balt\s*=/.test(img),file+" has image without alt");
}
for(const [file,route] of indexed){
 const html=read(file);
 assert.equal(count(html,/<h1\b/gi),1,file+" must have exactly one semantic H1");
 assert(/<meta\s+name=["']description["'][^>]+content=["'][^"']+/i.test(html),file+" missing description");
 const canonical=html.match(/<link\s+rel=["']canonical["'][^>]+href=["']([^"']+)/i);
 assert(canonical,file+" missing canonical");
 assert.equal(canonical[1],origin+route,file+" canonical is not clean");
 assert.equal(count(html,/hreflang=/gi),4,file+" must expose en/ar/fr/x-default hreflang");
 assert(/property=["']og:image["']/i.test(html),file+" missing og:image");
 assert(/name=["']twitter:card["'][^>]+content=["']summary_large_image/i.test(html),file+" missing Twitter card");
 assert(!/name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html),file+" unexpectedly noindex");
}
for(const file of ["account.html","checkout.html","order.html"]){
 assert(/name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(read(file)),file+" must stay noindex");
}
const productHtml=read("product.html");
assert(/name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(productHtml),"generic product shell must be noindex");
assert(!/rel=["']canonical["'][^>]+product\.html/i.test(productHtml),"generic product shell must not canonicalize to product.html");

const productJs=read("product-page-v1.js");
assert(productJs.includes('robots.content="index,follow,max-image-preview:large"'),"resolved product must become indexable");
for(const lang of ["en-LB","ar-LB","fr-LB","x-default"])assert(productJs.includes('setAlternate("'+lang+'"'),"product missing "+lang+" alternate");
assert(productJs.includes("productPath(p.id,state.locale)"),"product localized URL state missing");
assert(productJs.includes('"@type":"Product"'),"Product structured data missing");

const recipes=read("recipes.html");
assert(recipes.includes('"name":"Lebanese Pantry Recipes | Zayt w Mouneh"'),"recipe structured-data name regression");
assert(!recipes.includes('"name":"about | Zayt w Mouneh"'),"recipe structured data still says About");

const conversion=read("conversion-v1.js");
assert(conversion.includes("function productPath(id)"),"locale-aware product link missing");
assert(!conversion.includes("View full product page"),"Quick View full-product CTA must stay removed");
assert(conversion.includes('if(a)a.remove()'),"Quick View legacy full-product CTA cleanup missing");
assert(!conversion.includes("injectAccountReorder();modalLink()"),"Quick View self-triggering body observer regression returned");

const app=read("app.js");
assert(app.includes('function money(n){const value=`$${Number(n).toFixed(2)}`'),"Storefront prices must keep the dollar symbol");
const appLines=app.split(/\r?\n/).map(line=>line.trim());
assert(!appLines.some(line=>/^\$\("\[data-modal-variant\]"\)\.forEach/.test(line)),"Quick View single-element forEach crash returned");
assert(appLines.some(line=>/^\$\$\("\[data-modal-variant\]"\)\.forEach/.test(line)),"Quick View variant listeners missing");
for(const token of ["function cleanupQuickView","function fallbackQuickView","function trapQuickViewFocus","quickViewRequiredNodes","renderModal(p.id,v.id)===false"]){
 assert(app.includes(token),"Quick View lifecycle guard missing: "+token);
}

const css=read("premium.css");
assert(css.includes("body.modal-open .cart-backdrop"),"Quick View backdrop layer hotfix missing");
assert(css.includes("body.modal-open .product-modal"),"Quick View modal layer hotfix missing");
assert(css.includes("100dvh"),"Quick View mobile dynamic viewport bound missing");

const robots=read("robots.txt");
assert(robots.includes("Disallow: /admin"),"robots must block clean admin route");
assert(robots.includes(origin+"/sitemap.xml"),"robots sitemap URL missing");

const sitemap=read("sitemap.xml");
assert(sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'),"sitemap hreflang namespace missing");
assert.equal(count(sitemap,/<url>/g),1023,"sitemap URL count must cover 332 products + 9 public pages across 3 locales");
assert.equal(count(sitemap,/hreflang="en-LB"/g),1023,"sitemap English alternates incomplete");
assert.equal(count(sitemap,/hreflang="ar-LB"/g),1023,"sitemap Arabic alternates incomplete");
assert.equal(count(sitemap,/hreflang="fr-LB"/g),1023,"sitemap French alternates incomplete");
for(const id of ["baking-powder","secar-nabat","extra-virgin-olive-oil"]){
 for(const prefix of ["","/ar","/fr"])assert(sitemap.includes(origin+prefix+"/product/"+id),"sitemap missing "+prefix+"/product/"+id);
}

const redirects=read("_redirects");
for(const route of ["/product/*","/ar/product/*","/fr/product/*","/ar/:page","/fr/:page"])assert(redirects.includes(route),"redirect/rewrite missing "+route);

const headers=read("_headers");
assert(headers.includes("Cache-Control: public, max-age=86400, stale-while-revalidate=604800"),"JS/CSS cache policy missing");
assert(headers.includes("Cache-Control: public, max-age=2592000, immutable"),"asset immutable cache policy missing");
assert(headers.includes("X-Content-Type-Options: nosniff"),"security headers missing");

console.log("Batch 7 static production regression passed:",customerPages.length,"customer shells, 1023 sitemap URLs, Quick View guards, SEO/a11y/cache rules.");
