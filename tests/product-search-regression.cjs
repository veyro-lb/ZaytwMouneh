'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'public/products-data.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(root,'public/product-search-v1.js'),'utf8'),ctx);
const products=vm.runInContext('PRODUCTS_DATA',ctx),search=ctx.window.ZWM_PRODUCT_SEARCH;
const find=id=>{const p=products.find(p=>p.id===id);assert(p,id+' exists');return p};
const rank=q=>products.map(p=>({p,score:search.score(p,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
for(const p of products){
 for(const field of ['id','nameEn','nameAr','original'])if(p[field])assert(search.score(p,p[field])>0,p.id+': '+field);
}
const cases=[
 ['extra-virgin-olive-oil',['olive oil','oil olive','OLIVE-OIL','زَيْت الزَّيْتُون','زيت الزيتون','زيت زيتون بكر','zayt zaytoon','zeit zeitoun','huile olive','huile d’olive','olvie oil','بدي زيت زيتون','زيت olive','olive oil 1l','زيت ١ لتر','oliveoil','zaytzaytoun','huile d olive']],
 ['debes-el-remen',['دبس رمان','debs remmen','dibs pomegranate','melasse grenade','mélasse de grenade']],
 ['aadas-majroush',['عدس','3adas','lentilles','split lentlis']],
 ['tahini',['طحينه','t7ine','tahina']],
 ['khal-el-tefeh',['khal teffeh','خل تفاح']],
 ['zaatar-manakish',['زعتر','za3tar','zatar','za’atar']],
];
for(const [id,queries] of cases)for(const q of queries)assert(search.score(find(id),q)>0,id+' query '+q);
assert.equal(search.score(find('extra-virgin-olive-oil'),'olive oil 999kg'),0,'unknown size must not match');
assert.equal(rank('zzzzqxwvv').length,0,'unrelated strings do not match everything');
assert.equal(rank('extra virgin olive oil')[0].p.id,'extra-virgin-olive-oil','exact names lead ranking');
assert.equal(search.score(find('tahini'),'tahini nonsense'),0,'every meaningful query term is required');
const custom={id:'test',nameEn:'Test Product',nameAr:'منتج',nameFr:'Produit special',searchAliases:['bespoke alias'],variants:[{sizeEn:'250 g'}]};
assert(search.score(custom,'bespoke alias')>0);assert(search.score(custom,'produit special')>0);
custom.nameEn='Renamed Product';assert(search.score(custom,'renamed')>0,'owner edits refresh index');
const frSource=fs.readFileSync(path.join(root,'public/fr-runtime-v1.js'),'utf8');
vm.runInContext(frSource.slice(frSource.indexOf('var CATEGORY_FR='),frSource.indexOf('function dynamicFr(')),ctx);
for(const p of products){const name=ctx.productFr(p.nameEn);assert(search.score(p,name)>0,p.id+' is searchable by its displayed French name');}
const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
assert(app.includes('window.ZWM_PRODUCT_SEARCH.score(p,rawQuery)'));
assert(app.includes('bindSearchKeyboard();'));
for(const file of fs.readdirSync(path.join(root,'public')).filter(f=>f.endsWith('.html'))){
 const html=fs.readFileSync(path.join(root,'public',file),'utf8');
 if(/src="\/?(?:app|wholesale-v1|admin)\.js/.test(html))assert(html.indexOf('product-search-v1.js')<html.search(/src="\/?(?:app|wholesale-v1|admin)\.js/),file+' loads shared search first');
}
console.log('Product search passed: '+products.length+' products, multilingual, Arabizi, typos, sizes, ranking and shared integration.');
