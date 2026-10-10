const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

for (const file of ['checkout.js', 'checkout-delivery-v4.js']) {
  const source = fs.readFileSync('public/' + file, 'utf8');
  const fn = source.slice(source.indexOf('function phoneSupport(){'), source.indexOf('function renderIdentity(){'));
  for (const settings of [undefined, {contact:{whatsapp:'96170381412'}}, {contact:{whatsapp:'96170123456'}}]) {
    const support = {};
    const context = {window:{ZWM_CMS:{getSettings:()=>settings}}, $:()=>support, state:{lang:'en'}, t:en=>en};
    vm.runInNewContext(fn + '\nphoneSupport()', context);
    assert.equal(new URL(support.href).pathname, '/' + (settings?.contact.whatsapp || '96170381412'));
  }
}
const source = fs.readFileSync('public/conversion-v1.js', 'utf8');
const fn = source.slice(source.indexOf('async function contactNumber(){'), source.indexOf('async function openCorporate(){'));
(async()=>{
  const context = {window:{},fetch:async()=>{throw new Error('offline')}};
  assert.equal(await vm.runInNewContext(fn+'\ncontactNumber()',context),'96170381412');
  context.window.ZWM_CMS_CONFIG={supabaseUrl:'https://store.example',supabasePublishableKey:'public'};
  assert.equal(await vm.runInNewContext(fn+'\ncontactNumber()',context),'96170381412');
  context.fetch=async()=>({ok:true,json:async()=>[{value:{whatsapp:'96170123456'}}]});
  assert.equal(await vm.runInNewContext(fn+'\ncontactNumber()',context),'96170123456');
  console.log('Launch contact regression passed: checkout and gift support use the current number offline and preserve configured overrides.');
})().catch(e=>{console.error(e);process.exitCode=1});
