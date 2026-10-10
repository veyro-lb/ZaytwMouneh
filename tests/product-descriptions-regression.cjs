'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = fs.readFileSync('public/products-data.js', 'utf8');
const overlay = fs.readFileSync('public/product-descriptions-v1.js', 'utf8');
const productHtml = fs.readFileSync('public/product.html', 'utf8');
const shopHtml = fs.readFileSync('public/shop.html', 'utf8');
const homeHtml = fs.readFileSync('public/index.html', 'utf8');
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
for(const [label,html,needle] of [['product',productHtml,'/products-data.js'],['shop',shopHtml,'products-data.js'],['home',homeHtml,'products-data.js']]){
  const injected='/product-descriptions-v1.js?v=20261010-copyreview1';
  assert(html.includes(injected),label+': missing overlay script');
  assert(html.indexOf(needle)<html.indexOf(injected),label+': overlay must load after catalogue');
}
assert(page.includes('facts:"Product information"'),'Editorial product descriptions must not be called supplier-verified');
assert(page.includes('var summary=valueFor(p,"details")'),'Standalone product page should show its description');
assert(page.includes('var facts=factsMarkup(p)'),'Standalone facts must remain available when verified');
const app = fs.readFileSync('public/app.js', 'utf8');
const css = fs.readFileSync('public/product-copy-ui-v1.css', 'utf8');
assert(app.includes('function productDescriptionFor(p)'), 'Missing product-specific description helper');
assert(app.includes('class="zwm-card-summary"'), 'Card must show product-specific descriptions');
assert(!app.slice(app.indexOf('function renderProducts()'), app.indexOf('const empty=$("#catalogEmpty")')).includes('info.what'), 'Do not show generic what-it-is on cards');
assert(!app.slice(app.indexOf('function renderProducts()'), app.indexOf('const empty=$("#catalogEmpty")')).includes('info.use'), 'Do not show generic use-it-for on cards');
assert(app.includes('$("#productModalDescription").textContent=summary'), 'Quick view should display product-specific descriptions');
assert(!shopHtml.includes('id="productModalUse"'), 'Remove duplicate generic use panel from quick view');
assert(!shopHtml.includes('id="productModalOriginal"'), 'Remove duplicate raw catalogue name');
assert(shopHtml.includes('class="zwm-modal-description"'), 'Show clean quick-view descriptions');
assert(productHtml.includes('/product-copy-ui-v1.css'), 'Standalone product page is missing copy CSS');
assert(shopHtml.includes('/product-copy-ui-v1.css'), 'Shop page is missing copy CSS');
assert(css.includes('.zwm-card-summary') && css.includes('.zwm-modal-description'), 'Missing responsive description styles');
const uiDrafts=JSON.parse(overlayMatch[1]);
assert(!Object.values(uiDrafts).some(row=>/Available catalogue sizes?:|الأحجام المتاحة:|Formats proposés\s*:/.test(row.en+row.ar+row.fr)), 'Do not repeat pack sizes already visible in the size selector');
for(const id of ['carob-date-bites','carob-cookies','tahini']){
  assert(uiDrafts[id].ar.length>=45 && uiDrafts[id].fr.length>=45, 'Debsy copy missing Arabic/French specifics: '+id);
}
assert(!/no added sugar|sweetened only (?:with|by) carob/i.test(JSON.stringify(drafts)),'Unverified sugar claim found in draft');
for (const name of fs.readdirSync('public').filter(file => file.endsWith('.html'))) {
  const html = fs.readFileSync('public/' + name, 'utf8');
  const icons = [...html.matchAll(/<link\b[^>]*\brel="(?:shortcut icon|icon)"[^>]*>/g)].map(match => match[0]);
  assert(icons.every(icon => icon.includes('href="/favicon.jpg"')), name + ': favicon must match the homepage logo');
}
console.log('Product-description regression: PASS (332 drafts, 329 runtime records, 49 holds, 280 eligible)');
