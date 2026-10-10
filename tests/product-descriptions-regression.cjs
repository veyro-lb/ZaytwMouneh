'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = fs.readFileSync('public/products-data.js', 'utf8');
const overlay = fs.readFileSync('public/product-descriptions-v1.js', 'utf8');
const productHtml = fs.readFileSync('public/product.html', 'utf8');
const shopHtml = fs.readFileSync('public/shop.html', 'utf8');
const page = fs.readFileSync('public/product-page-v1.js', 'utf8');
const sourceMatch = base.match(/const PRODUCTS_DATA\s*=\s*(\[[\s\S]*?\]);/);
const overlayMatch = overlay.match(/var COPY=(\{[\s\S]*?\});\s+var HOLD=new Set\((\[[\s\S]*?\])\)/);
assert(sourceMatch, 'Could not locate source JSON');
assert(overlayMatch, 'Could not locate overlay data and safety holds');
const products = JSON.parse(sourceMatch[1]);
const drafts = JSON.parse(overlayMatch[1]);
const hold = new Set(JSON.parse(overlayMatch[2]));
const aliases = new Set(['barly-flour','bezer-el-kettan','sekar-nabet']);
assert.equal(products.length,332,'Unexpected source catalogue count');
assert.equal(new Set(products.map(p=>p.id)).size,332,'Duplicate source IDs');
assert.equal(Object.keys(drafts).length,332,'Descriptions should cover every source record');
assert.equal(hold.size,49,'Review the identity-hold inventory before changing this baseline');
for(const p of products){
  const d=drafts[p.id];
  assert(d, 'Missing description: '+p.id);
  for(const lang of ['en','ar','fr'])assert(d[lang] && d[lang].length>=40, 'Short/missing '+lang+' for '+p.id);
}
assert.equal(new Set(products.map(p=>drafts[p.id].en)).size,332,'English descriptions must be distinct');
const active=products.filter(p=>!aliases.has(p.id));
assert.equal(active.length,329);
assert.equal(active.filter(p=>!hold.has(p.id)).length,280);
for(const [label,html,needle] of [['product',productHtml,'/products-data.js'],['shop',shopHtml,'products-data.js']]){
  const injected='/product-descriptions-v1.js?v=20261010-copyreview1';
  assert(html.includes(injected),label+': missing overlay script');
  assert(html.indexOf(needle)<html.indexOf(injected),label+': overlay must load after catalogue');
}
assert(page.includes('facts:"Product information"'),'Product details should not be called verified when they are editorial drafts');
assert(!/no added sugar|sweetened only (?:with|by) carob/i.test(JSON.stringify(drafts)),'Unverified sugar claim found in draft');
console.log('Product-description regression: PASS (332 drafts, 329 runtime records, 49 holds, 280 eligible)');
