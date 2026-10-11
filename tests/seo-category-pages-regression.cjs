'use strict';const fs=require('node:fs');const assert=require('node:assert/strict');const slugs=["olive-oil","zaatar","honey","mouneh","spices","pickles","olives"];const xml=fs.readFileSync('public/sitemap.xml','utf8');const routes=fs.readFileSync('public/_redirects','utf8');const cat=fs.readFileSync('public/catalogue.html','utf8');assert.equal((xml.match(/<loc>/g)||[]).length,1028);assert(!xml.includes('/product/sekar-nabet'));for(const s of slugs){const h=fs.readFileSync('public/'+s+'.html','utf8');assert(h.includes('rel="canonical" href="https://zaytwmouneh.com/'+s+'"'));assert(h.includes('"@type":"CollectionPage"'));assert(h.includes('name="description"'));assert(h.includes('hreflang="ar-LB"')&&h.includes('hreflang="fr-LB"'));assert(xml.includes('<loc>https://zaytwmouneh.com/'+s+'</loc>'));assert(routes.includes('/'+s+' /'+s+'.html 200'));assert(cat.includes('href="/'+s+'"'));}
const homepage=fs.readFileSync('public/index.html','utf8');
const jsonScripts=[...homepage.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const website=jsonScripts.find(x=>x['@type']==='WebSite');
assert(website && website.name==='Zayt W Mouneh' && website.url==='https://zaytwmouneh.com/','Search site name schema absent');
assert(website.alternateName.includes('زيت ومونة'),'Arabic site name missing');
assert(homepage.includes('property="og:site_name" content="Zayt W Mouneh"'),'Open Graph site name missing');
console.log('SEO category and brand metadata coverage passed');
