const fs=require("node:fs");
const assert=require("node:assert/strict");

const read=(p)=>fs.readFileSync(p,"utf8");
const app=read("public/app.js");
const fr=read("public/fr-runtime-v1.js");
const account=read("public/account.js");
const checkout=read("public/checkout.js");
const checkoutHtml=read("public/checkout.html");
const productsSrc=read("public/products-data.js");
const premium=read("public/premium.js");

function balanced(src,marker,open="{",close="}"){
  const p=src.indexOf(marker);
  assert(p>=0,"Missing marker: "+marker);
  const start=src.indexOf(open,p);
  let depth=0,quote=null,escape=false;
  for(let i=start;i<src.length;i++){
    const ch=src[i];
    if(quote){
      if(escape){escape=false;continue}
      if(ch==="\\"){escape=true;continue}
      if(ch===quote)quote=null;
      continue;
    }
    if(ch==="'"||ch==='"'||ch==="`"){quote=ch;continue}
    if(ch===open)depth++;
    else if(ch===close&&--depth===0)return src.slice(start,i+1);
  }
  throw new Error("Unclosed marker: "+marker);
}
function functionEnd(src,marker){
  const p=src.indexOf(marker);
  assert(p>=0,"Missing function: "+marker);
  const body=balanced(src,marker);
  return src.indexOf(body,p)+body.length;
}

assert(fr.includes('var LOCALE_KEY="zwm-locale-v3"'),"Canonical locale key missing");
assert(fr.includes("window.ZWM_LOCALE=Object.freeze"),"Canonical locale API missing");
assert(!fr.includes('attributeFilter:["aria-label","title","placeholder","alt","content","style","hidden","class"]'),"French observer must not watch its own layout mutations");
assert(!account.includes('$("[data-lang]").forEach'),"Account locale iteration must use querySelectorAll helper");
assert(account.includes('lang==="fr"?"fr":"en"'),"Account setLang must accept French");

const ui=(new Function("return ("+balanced(app,"const UI=")+")"))();
assert.deepEqual(Object.keys(ui.en).sort(),Object.keys(ui.ar).sort(),"Storefront EN/AR UI keys must match");

const T=(new Function("return ("+balanced(checkout,"var T=")+")"))();
assert.deepEqual(Object.keys(T.en).sort(),Object.keys(T.ar).sort(),"Checkout EN/AR keys must match");
const checkoutKeys=[...new Set([...checkoutHtml.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)].map(m=>m[1]))];
for(const key of checkoutKeys){
  assert(key in T.en,"Checkout English missing "+key);
  assert(key in T.ar,"Checkout Arabic missing "+key);
}

const frStart=fr.indexOf("var EXACT=Object.freeze({");
const dynamicStart=fr.indexOf("function dynamicFr(",frStart);
const dynamicEnd=functionEnd(fr,"function dynamicFr(");
const dynamicFr=(new Function("var PRODUCTS_DATA=[];var window={};"+fr.slice(frStart,dynamicEnd)+";return dynamicFr;"))();

const runtimeFiles=["account.js","commerce-v1.js","mouneh-rewards-v8.js","customer-orders-v1.js"];
const naturalSame=new Set(["WhatsApp","Mouneh Points","Zayt w Mouneh","Instagram","Google","Total","Points","points","Olive"]);
for(const name of runtimeFiles){
  const src=read("public/"+name);
  for(const m of src.matchAll(/\btr\(\s*"((?:\\.|[^"])*)"\s*,\s*"((?:\\.|[^"])*)"/g)){
    const en=m[1].replace(/\\"/g,'"').replace(/\\n/g,"\n").trim();
    if(!/[A-Za-z]/.test(en)||naturalSame.has(en))continue;
    assert.notEqual(dynamicFr(en).trim(),en,"French dynamic copy missing in "+name+": "+en);
  }
}

const productMatch=productsSrc.match(/const PRODUCTS_DATA=(\[[\s\S]*?\]);\s*\n/);
assert(productMatch,"PRODUCTS_DATA not found");
let products=JSON.parse(productMatch[1]);
const arFixes=(new Function("return ("+balanced(productsSrc,"const AR_PRODUCT_NAME_FIXES=Object.freeze(")+")"))();
const aliases={"moshmosh-mojafaf":"meshmosh-mojafaf","barly-flour":"barley-flour","bezer-el-kettan":"bezer-al-ketan","zaytoun-akhdar-mehshe-har":"zaytoun-akhdar-mahshe-har"};
products=products.filter(p=>!aliases[p.id]).map(p=>({...p,nameAr:String(arFixes[p.id]||p.nameAr||"").replace(/[\u202A-\u202E\u2066-\u2069]/g,"").replace(/\s+/g," ").trim()}));
assert.equal(products.length,328,"Shopper catalogue must remain 328 products after safe alias merging");
for(const p of products){
  assert(p.nameAr,"Arabic product name missing for "+p.id);
  assert(!/[\u202A-\u202E\u2066-\u2069]/.test(p.nameAr),"Bidi control leaked into "+p.id);
}

const nounStart=fr.indexOf("var NOUN=Object.freeze({");
const productFnStart=fr.indexOf("function productFr(",nounStart);
const productFnEnd=functionEnd(fr,"function productFr(");
const productFr=(new Function(fr.slice(nounStart,productFnEnd)+";return productFr;"))();
const allowedProductSame=new Set(["Carbonate","Bisco Choco","Caramel Craze","Carobella","Cherry Craze","Chocopeas","Craze Control","Crunchy Craze","Debsy Pretzy","Hazelnut Craze","Ricky Ricardo","Tahini","Freekeh","Hibiscus","Elixir","Krikri","Mahleb","Paprika","Sumac","Bonbon","Sabo"]);
for(const p of products){
  const value=productFr(p.nameEn);
  assert(value&&typeof value==="string","French product name missing for "+p.id);
  if(value===p.nameEn)assert(allowedProductSame.has(p.nameEn),"Unexpected untranslated French product: "+p.nameEn);
}

const recipeSame=/^(Fattoush|Kibbeh|cumin|sumac|tahini)$/i;
for(const m of premium.matchAll(/\b(?:titleEn|copyEn|methodEn|freshEn|labelEn|en)\s*:\s*"((?:\\.|[^"])*)"/g)){
  const value=m[1].replace(/\\"/g,'"');
  if(/[A-Za-z]/.test(value)&&!recipeSame.test(value)&&!/^(Bekaa|Koura|Chouf|Mount Lebanon)$/.test(value)){
    assert.notEqual(dynamicFr(value),value,"French recipe/seasonal copy missing: "+value);
  }
}
for(const m of premium.matchAll(/tagsEn\s*:\s*\[([^\]]*)\]/g)){
  for(const q of m[1].matchAll(/"((?:\\.|[^"])*)"/g)){
    const value=q[1];
    if(/[A-Za-z]/.test(value)&&!recipeSame.test(value))assert.notEqual(dynamicFr(value),value,"French recipe tag missing: "+value);
  }
}

const pages=["index.html","shop.html","gift.html","recipes.html","about.html","contact.html","account.html","checkout.html","order.html","terms.html","terms-of-service.html","terms-and-rewards.html","privacy.html","privacy-policy.html","privacy-and-data.html"];
for(const page of pages){
  const html=read("public/"+page);
  assert(html.includes("fr-runtime-v1.js?v="),"French locale runtime missing from "+page);
}

console.log("Localization audit passed: EN/AR parity, French dynamic coverage, 328-product locale integrity, and locale runtime wiring.");
