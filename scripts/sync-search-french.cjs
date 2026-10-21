'use strict';
// Refresh the lightweight search dictionary without loading the French UI runtime on EN/AR pages.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'public/fr-runtime-v1.js'),'utf8');
const start=source.indexOf('var CATEGORY_FR='),end=source.indexOf('function dynamicFr(');
if(start<0||end<=start)throw new Error('French translation source boundaries changed');
const context=vm.createContext({window:{}});
vm.runInContext(source.slice(start,end),context);
vm.runInContext(fs.readFileSync(path.join(root,'public/products-data.js'),'utf8'),context);
const names=vm.runInContext('Object.fromEntries(PRODUCTS_DATA.map(p=>[p.nameEn,productFr(p.nameEn)]))',context);
const file=path.join(root,'public/product-search-v1.js');
const script=fs.readFileSync(file,'utf8');
fs.writeFileSync(file,script.replace(/^const frenchNames=.*;$/m,()=>`const frenchNames=${JSON.stringify(names)};`));
console.log('Updated search French names.');
