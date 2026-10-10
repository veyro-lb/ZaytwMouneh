"use strict";
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const release=JSON.parse(read("public/release.json")).release;
assert.match(release,/^\d{8}-[a-z0-9-]+$/);
assert.match(read("wrangler.toml"),/directory\s*=\s*"\.\/public"/);
// The app release marker and storefront shell asset pin have separate purposes.
const storefrontRelease=read("public/storefront-release.js");
const shellAssetVersion=storefrontRelease.match(/const\s+SHELL_ASSET_VERSION\s*=\s*["']([^"']+)["']/);
assert.ok(shellAssetVersion,"storefront-release.js must declare its shell asset pin");
const assetVersion=shellAssetVersion[1];


const forbidden=[".nojekyll","_headers","index.html","shop.html","gift.html","about.html","contact.html","recipes.html","styles.css","premium.css","premium.js","app.js","products-data.js","product-photos.js","robots.txt","sitemap.xml","gift-v3.css","gift-v4.css","assets"];
for(const entry of forbidden)assert.equal(fs.existsSync(path.join(root,entry)),false,"obsolete root storefront copy: "+entry);
assert.equal(fs.existsSync(path.join(root,"public/premium.js")),false,"unused legacy public/premium.js must stay removed");

const htmlFiles=fs.readdirSync(path.join(root,"public")).filter(n=>n.endsWith(".html")&&n!=="admin.html");
for(const name of htmlFiles){
  const html=read("public/"+name);
  const marker=html.match(/<meta\s+name=["']zwm-release["']\s+content=["']([^"']+)["']/i);
  assert.ok(marker,name+" must declare zwm-release");
  assert.equal(marker[1],release,name+" release marker must match release.json");
  assert.ok(html.includes("storefront-release.js?v="+assetVersion),name+" must load current storefront-release asset version");
  if(html.includes("storefront-shell.css")){
    const styles=[...html.matchAll(/<link\b[^>]*rel=["\']stylesheet["\'][^>]*>/gi)].map(m=>m[0]);
    const shellIndex=styles.findIndex(style=>style.includes("storefront-shell.css"));
    assert.ok(shellIndex>=0,name+" missing canonical storefront shell");
    assert.equal(styles.filter(style=>style.includes("storefront-shell.css")).length,1,name+" duplicated canonical storefront shell");
    assert.ok(styles[shellIndex].includes("storefront-shell.css?v="+assetVersion),name+" storefront shell asset pin is stale");
    // The decorative overlay, shop enhancements, and font stylesheet intentionally follow the shell.
    // Reject all other unrecognized CSS additions after the canonical stylesheet.
    for(const style of styles.slice(shellIndex+1)){
      const href=style.match(/href=["']([^"']+)/i)?.[1]||"";
      const allowed=/(?:^|\/)(?:mouneh-decor-v1|shop-extras-v1|about-story-panel-v1|provenance-atlas-v1)\.css(?:[?#]|$)/.test(href) || href.startsWith("https://fonts.googleapis.com/");
      assert.ok(allowed,name+" has an unexpected stylesheet after the canonical shell: "+href);
    }
  }
}
// Guard against accidental Windows-1252 decoding of the Our Story HTML.
const storyHtml=read("public/about.html");
assert.match(storyHtml,/قصتنا/, "Our Story Arabic heading must be UTF-8");
assert.match(storyHtml,/المونة قريبة من البيت/, "Our Story Arabic hero copy must remain readable");
assert.doesNotMatch(storyHtml,/(?:Ø§|Ø¹|Ù„|Ù…|Â·|â€)/u, "Our Story must not contain UTF-8 mojibake");

for(const name of ["product.html","checkout.html","order.html"]){
  const html=read("public/"+name);
  for(const route of ["/terms","/privacy","/returns","/contact"])assert.ok(html.includes('href="'+route+'"'),name+" missing "+route);
}
// The runtime URL has its own asset cache pin (distinct from release.json).
// Ensure it is versioned and consistent across customer entry pages.
const homeRuntimePin=read("public/index.html").match(/site-runtime-v9\\.js\\?v=(\\d{8}-[a-z0-9-]+)/)?.[1];
assert.ok(homeRuntimePin,"homepage runtime must carry a versioned cache token");
for(const name of ["index.html","shop.html","account.html","checkout.html","product.html","returns.html","wholesale.html"]){
  const html=read("public/"+name);
  if(html.includes("site-runtime-v9.js"))assert.ok(html.includes("site-runtime-v9.js?v="+homeRuntimePin),name+" runtime cache token drift");
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
