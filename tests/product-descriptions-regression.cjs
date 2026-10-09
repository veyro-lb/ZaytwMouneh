"use strict";
// Manual regression: node tests/product-descriptions-regression.cjs
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,"public",p),"utf8");
const ctx={window:{},console};vm.createContext(ctx);
vm.runInContext(read("products-data.js")+"\n"+read("product-descriptions-v1.js")+"\n;globalThis.__products=PRODUCTS_DATA;globalThis.__copy=ZWM_PRODUCT_DESCRIPTIONS_V1;",ctx,{timeout:10000});
const products=ctx.__products,copy=ctx.__copy;
assert.equal(products.length,329,"Canonical catalogue should contain 329 entries");
assert.equal(Object.keys(copy).length,329,"Every canonical product must have a record");
for(const suffix of ["En","Ar","Fr"]){
  const values=products.map(p=>p["description"+suffix]);
  assert(values.every(x=>typeof x==="string"&&x.trim().length>35),"Missing "+suffix+" copy");
  assert.equal(new Set(values).size,329,"Descriptions must be unique in "+suffix);
}
for(const p of products){
  assert(copy[p.id],"Missing "+p.id);
  if(p.category==="Soap"){assert(/external|clean|wash|usage externe|nettoy|تنظيف|خارجي/i.test(p.descriptionEn+" "+p.descriptionFr+" "+p.descriptionAr),p.id+" mislabeled");}
  if(p.category==="Oils")assert(!/for cooking|pour over salads|drizzle on food/i.test(p.descriptionEn),p.id+" unsafe oil use");
}
assert(!products.find(p=>p.id==="sekar-nabet"));
assert(!products.find(p=>p.id==="barly-flour"));
assert(!products.find(p=>p.id==="bezer-el-kettan"));
for(const name of ["index","shop","product","gift"]){
 const html=read(name+".html");
 assert(html.indexOf("products-data.js")<html.indexOf("product-descriptions-v1.js"));
 assert(html.indexOf("product-descriptions-v1.js")<html.lastIndexOf(name==="product"?"product-page-v1.js":"app.js"));
}
const app=read("app.js"),detail=read("product-page-v1.js");
assert(app.includes('p?.["description"+locale]'),"Quick-view must use localized description");
assert(detail.includes('valueFor(p,"description")'),"Product page must use localized description");
assert(detail.includes("ld.description=individualCopy"),"Individual SEO missing");
console.log("PASS: 329 canonical products have unique trilingual copy, with safety and page wiring guards.");
