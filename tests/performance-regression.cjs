const fs=require("fs");const path=require("path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const publicDir=path.join(root,"public");
const htmls=fs.readdirSync(publicDir).filter(n=>n.endsWith(".html"));
for(const name of htmls){
  const html=read("public/"+name);
  if(/<script\b[^>]*src=["'][^"']*fr-runtime-v1\.js/i.test(html))throw new Error(name+" directly loads the heavy French runtime");
  if(!html.includes("locale-loader-v1.js"))throw new Error(name+" is missing the lightweight locale loader");
}
const loader=read("public/locale-loader-v1.js");
if(!loader.includes('if(initial!=="fr")return'))throw new Error("French runtime is not conditionally loaded");
if(!loader.includes("zwm-fr-loading"))throw new Error("French early-paint guard is missing");
const site=read("public/site-runtime-v9.js");
if(!site.includes('script[data-mouneh-rewards],script[src*="mouneh-rewards-v8.js"]'))throw new Error("Rewards duplicate-load guard is missing");
const app=read("public/app.js");
if(app.includes('preload=activeNow?"auto"')||app.includes('preload=index===0?"auto"'))throw new Error("Hero video code still forces preload auto");
if(!app.includes("navigator.connection&&navigator.connection.saveData"))throw new Error("Save-Data media guard is missing");
if((app.match(/\$\$\("\[data-scene\] video"\)\.forEach\(v=>v\.pause\(\)\);/g)||[]).length<2)throw new Error("Scene video pause handlers must use the multi-element selector");
if(!/product-photo-original[^>]*width=/.test(app)||!/product-photo-original[^>]*loading="lazy"/.test(app))throw new Error("Product-card image safeguards regressed");
console.log("performance regression checks passed");
