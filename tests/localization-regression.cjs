const fs=require("fs"),assert=require("assert");
const read=p=>fs.readFileSync(p,"utf8");
const loader=read("public/locale-loader-v1.js"),fr=read("public/fr-runtime-v1.js"),account=read("public/account.js"),app=read("public/app.js"),checkout=read("public/checkout.js"),wholesale=read("public/wholesale-v1.js");
assert(loader.includes("var route=pathLocale();"),"URL locale must be checked first");
assert(loader.includes("localePath:localePath,navigate:navigate,text:text"),"Canonical locale API missing");
assert(loader.includes('document.documentElement.dir=next==="ar"?"rtl":"ltr"'),"Arabic direction missing");
assert(loader.includes("HEAVY_SRC"),"French runtime must stay lazy-loaded");
assert(!fr.includes("observer.observe(document.documentElement,{subtree:true"),"Broad French DOM observer must be removed");
assert(!account.includes("requestFrenchTranslation("),"Account must not request post-render French translation");
assert(account.includes('document.addEventListener("zwm:localechange"'),"Account must react to locale changes");
assert(app.includes('next==="fr"?"fr":"en"'),"App must recognize French");
assert(checkout.includes("T.fr=Object.fromEntries"),"Checkout must render French dictionary values");
assert(wholesale.includes("window.ZWM_LOCALE?.get"),"Wholesale must use canonical locale API");
for(const p of ["public/index.html","public/shop.html","public/account.html","public/checkout.html","public/gift.html","public/recipes.html","public/wholesale.html","public/product.html"]){const html=read(p);assert(html.includes("locale-loader-v1.js"),p+" must load locale loader");assert(!html.includes('src="/fr-runtime-v1.js'),p+" must not eagerly load French runtime");}
console.log("localization regression: ok");
