const fs=require('fs');
const path=require('path');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const root=path.join(__dirname,'..');
const pub=path.join(root,'public');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const htmlFiles=fs.readdirSync(pub).filter(name=>name.endsWith('.html')).sort();

for(const name of htmlFiles){
  const html=read('public/'+name);
  assert(!/<script\b[^>]*src=["'][^"']*fr-runtime-v1\.js/i.test(html),name+' directly loads the heavy French runtime');
  assert(/<script\b[^>]*src=["']\/locale-loader-v1\.js\?v=20261006-perf1["']/i.test(html),name+' is missing the lightweight locale loader');
  assert(!/preload=["']auto["']/i.test(html),name+' contains preload="auto"');
}

const loader=read('public/locale-loader-v1.js');
assert(Buffer.byteLength(loader)<30000,'locale loader budget exceeded 30 KB');
assert(/loadFrenchRuntime/.test(loader),'locale loader no longer lazy-loads French runtime');
assert(/fr-runtime-v1\.js\?v=20261006-perf1/.test(loader),'locale loader French runtime version mismatch');
assert(/fr-runtime-loading/.test(loader),'French no-flash guard missing');

const app=read('public/app.js');
assert(/navigator\.connection&&navigator\.connection\.saveData/.test(app),'Save-Data media guard missing');
assert(!/video\.preload=activeNow\?"auto"/.test(app),'active scene still forces preload=auto');
assert(!/video\.preload=index===0\?"auto"/.test(app),'initial scene still forces preload=auto');

const site=read('public/site-runtime-v9.js');
assert(/script\[src\*=["']mouneh-rewards-v8\.js["']\]/.test(site),'rewards duplicate source guard missing');
assert(/requestIdleCallback/.test(site),'rewards fallback is not deferred to idle time');

const home=read('public/index.html');
assert(!/<video[^>]*id=["']shopHeroVideo["'][^>]*\bautoplay\b/i.test(home),'homepage decorative video autoplays before runtime guards');

const shop=read('public/shop.html');
const honeyWebm=shop.indexOf('assets/videos/honey.webm');
const honeyMp4=shop.indexOf('assets/videos/honey.mp4');
const lentilsWebm=shop.indexOf('assets/videos/lentils.webm');
const lentilsMp4=shop.indexOf('assets/videos/lentils.mp4');
const wheatWebm=shop.indexOf('assets/videos/wheat.webm');
const wheatMp4=shop.indexOf('assets/videos/wheat.mp4');
assert(honeyWebm>=0&&honeyWebm<honeyMp4,'honey should prefer the smaller WebM source');
assert(lentilsWebm>=0&&lentilsWebm<lentilsMp4,'lentils should prefer the smaller WebM source');
assert(wheatMp4>=0&&wheatMp4<wheatWebm,'wheat should prefer the much smaller MP4 source');
assert(!/<video[^>]*\bautoplay\b/i.test(shop),'shop decorative scenes autoplay before runtime guards');

console.log('performance-regression: ok');
