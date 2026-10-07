const {execFileSync}=require("node:child_process");

const protectedRootFiles=new Set([
  "about.html","app.js","contact.html","gift-v3.css","gift-v4.css","gift.html",
  "index.html","premium.css","premium.js","product-photos.js","products-data.js",
  "recipes.html","shop.html","styles.css"
]);

let base=String(process.env.ZWM_GIT_BASE||"").trim();
const head=String(process.env.ZWM_GIT_HEAD||"HEAD").trim()||"HEAD";

if(!base||/^0+$/.test(base)){
  try{base=execFileSync("git",["rev-parse",head+"^"],{encoding:"utf8"}).trim()}
  catch{console.log("source-of-truth guard: no comparison base; skipped");process.exit(0)}
}

let changed="";
try{
  changed=execFileSync("git",["diff","--name-only",base,head],{encoding:"utf8"});
}catch(error){
  console.error("source-of-truth guard could not compare",base,"to",head);
  process.exit(1);
}

const touched=changed.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
const forbidden=touched.filter(p=>protectedRootFiles.has(p));

if(forbidden.length){
  console.error("Production storefront source is public/. Do not edit legacy root storefront snapshots:");
  forbidden.forEach(p=>console.error(" - "+p));
  console.error("Move the intended customer-facing change under public/ instead.");
  process.exit(1);
}

console.log("source-of-truth guard passed");
