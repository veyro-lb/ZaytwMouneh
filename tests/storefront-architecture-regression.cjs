const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};

const toml=read("wrangler.toml");
const jsonc=read("wrangler.jsonc");
must(/directory\s*=\s*"\.\/public"/.test(toml),"wrangler.toml must serve ./public");
must(/"directory"\s*:\s*"\.\/public"/.test(jsonc),"wrangler.jsonc must serve ./public");
must(read("README.md").includes("only production storefront source is `public/`"),"README must identify public/ as production");
must(read("docs/PRODUCTION-STOREFRONT.md").includes("PRODUCTION STOREFRONT = `public/`"),"source-of-truth documentation missing");

const release=JSON.parse(read("public/release.json"));
must(typeof release.release==="string"&&release.release.length>8,"release.json must contain a meaningful release");
const releaseJs=read("public/storefront-release.js");
must(releaseJs.includes('fetch("/release.json?t="'),"release client must read release.json");
must(releaseJs.includes("window.ZWM_RELEASE_PAGE=pageRelease"),"release client must retain page diagnostic marker");
must(releaseJs.includes("window.ZWM_RELEASE=latest"),"release client must expose authoritative latest release");
must(!/location\.(reload|replace)\s*\(/.test(releaseJs),"release client must never force reload/replace");

const site=read("public/site-runtime-v9.js");
must(!site.includes("20261004-toolkit10"),"site runtime pins obsolete admin-config cache key");
must(!site.includes("20261004-mobileauth3"),"site runtime pins obsolete rewards cache key");
must(site.includes('const CONFIG_SRC = "/admin-config.js";'),"admin config fallback must use canonical URL");
must(site.includes('rewardsScript.src="/mouneh-rewards-v8.js";'),"rewards fallback must use canonical URL");

const headers=read("public/_headers");
for(const asset of ["site-runtime-v9.js","storefront-release.js","locale-loader-v1.js","mouneh-rewards-v8.js","products-data.js","app.js","premium-v2.js","styles.css","premium.css","storefront-shell.css","commerce-v1.css"]){
  must(headers.includes("/"+asset+"\n  Cache-Control: public, max-age=0, must-revalidate"),asset+" must revalidate");
}
must(/\/assets\/\*\n\s+Cache-Control: public, max-age=2592000, immutable/.test(headers),"media assets should remain long-lived immutable");

const pages={};
for(const name of ["product","checkout","order","account","returns","wholesale"])pages[name]=read("public/"+name+".html");
for(const [name,html] of Object.entries(pages)){
  must(html.includes("locale-loader-v1.js"),name+" must load locale bootstrap");
  must(html.includes("storefront-release.js"),name+" must load release discovery");
}
for(const name of ["account","returns","wholesale"])must(pages[name].includes("site-header"),name+" must use canonical storefront header");
for(const name of ["checkout","order"]){
  must(pages[name].includes("commerce-header"),name+" must use focused commerce header");
  must(pages[name].includes("commerce-footer"),name+" must use focused commerce footer");
  for(const href of ["/returns","/terms","/privacy"])must(pages[name].includes('href="'+href+'"'),name+" missing "+href+" legal navigation");
}
must(pages.product.includes("c6-product-header")&&pages.product.includes("c6-footer"),"product focused shell missing");
for(const href of ["/account","/returns","/terms","/privacy"])must(pages.product.includes('href="'+href+'"'),"product shell missing "+href);
must(pages.product.includes('content="index,follow,max-image-preview:large"'),"real product page must be indexable");

const productJs=read("public/product-page-v1.js");
must(productJs.includes('robots.content="noindex,follow"'),"missing product route must revert to noindex");
must(productJs.includes('"@type":"Product"'),"product schema missing");
must(productJs.includes('"@type":"Offer"'),"product Offer schema missing");
must(productJs.includes('Number(v.price).toFixed(2)'),"product schema price must derive from catalogue data");

const premium=read("public/premium-v2.js");
must(!premium.includes('loading="eager"'),"premium/collection helper imagery must not force eager loading");
must((premium.match(/loading="lazy"/g)||[]).length>=3,"premium image helpers should be lazy");

const workflow=read(".github/workflows/production-regression.yml");
must(workflow.includes("fetch-depth: 0"),"CI needs full history for source-of-truth diff guard");
must(workflow.includes("Guard production source of truth"),"CI source-of-truth guard missing");
must(fs.existsSync(path.join(root,"scripts/guard-source-of-truth.cjs")),"source-of-truth guard script missing");

console.log("storefront architecture regression checks passed");
