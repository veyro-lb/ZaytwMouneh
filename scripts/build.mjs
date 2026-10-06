import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT=process.cwd();
const PUBLIC=path.join(ROOT,"public");
const PAGES=path.join(ROOT,"src","pages");
const PARTIALS=path.join(ROOT,"src","partials");
const CHECK=process.argv.includes("--check");
const VERSIONABLE=/\.(?:js|css|mjs|json|webmanifest|svg|png|jpe?g|webp|gif|avif|ico|mp4|webm)$/i;
const DYNAMIC_KEYS=["/fr-runtime-v1.js","/admin-config.js","/notifications-v1.css","/customer-notifications-v1.js","/mouneh-rewards-v8.js","/customer-orders-v1.css","/commerce-v1.css","/admin-notifications-v1.js","/mouneh-rewards-v8.css","/admin-sw.js","/site-runtime-v9.js"];

function walk(dir){
  if(!fs.existsSync(dir))return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(function(entry){
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?walk(full):[full];
  });
}
function slash(v){return v.split(path.sep).join("/")}
function gitBlobHash(input){
  const buf=Buffer.isBuffer(input)?input:fs.readFileSync(input);
  return crypto.createHash("sha1").update(Buffer.from("blob "+buf.length+"\0")).update(buf).digest("hex");
}
function sorted(obj){return Object.fromEntries(Object.entries(obj).sort(function(a,b){return a[0].localeCompare(b[0])}))}
function assetKey(raw){
  raw=String(raw||"").trim();
  if(!raw||/^(?:[a-z]+:|\/\/|#|mailto:|tel:|data:|blob:)/i.test(raw))return "";
  let p=raw.split("#")[0].split("?")[0];
  if(p.startsWith("./"))p=p.slice(2);
  if(!p.startsWith("/"))p="/"+p;
  return VERSIONABLE.test(p)?p:"";
}
function stripVersion(raw){
  const hi=raw.indexOf("#"),hash=hi>=0?raw.slice(hi):"",head=hi>=0?raw.slice(0,hi):raw;
  const qi=head.indexOf("?");
  if(qi<0)return raw;
  const pathname=head.slice(0,qi);
  const kept=head.slice(qi+1).split("&").filter(Boolean).filter(function(x){return !x.startsWith("v=")});
  return pathname+(kept.length?"?"+kept.join("&"):"")+hash;
}
function withVersion(raw,v){
  const hi=raw.indexOf("#"),hash=hi>=0?raw.slice(hi):"",head=hi>=0?raw.slice(0,hi):raw;
  const qi=head.indexOf("?"),pathname=qi>=0?head.slice(0,qi):head,query=qi>=0?head.slice(qi+1):"";
  const parts=query?query.split("&").filter(Boolean).filter(function(x){return !x.startsWith("v=")}):[];
  parts.push("v="+v);
  return pathname+"?"+parts.join("&")+hash;
}
function collectVersions(){
  const out={};
  for(const file of walk(PUBLIC)){
    const r=slash(path.relative(PUBLIC,file));
    if(r.endsWith(".html")||r==="release.json"||r==="asset-versions.js"||!VERSIONABLE.test(r))continue;
    out["/"+r]=gitBlobHash(file).slice(0,12);
  }
  return sorted(out);
}
function collectSources(){
  const out={};
  for(const base of [PAGES,PARTIALS]){
    for(const file of walk(base))out[slash(path.relative(ROOT,file))]=gitBlobHash(file).slice(0,12);
  }
  return sorted(out);
}
function manifestText(versions,sources){
  return '(function(){"use strict";var V=Object.freeze('+JSON.stringify(versions)+');var S=Object.freeze('+JSON.stringify(sources)+');function key(input){var raw=String(input||"").trim();if(!raw||/^(?:[a-z]+:|\\/\\/|#|mailto:|tel:|data:|blob:)/i.test(raw))return"";var p=raw.split("#")[0].split("?")[0];if(p.indexOf("./")===0)p=p.slice(2);if(p.charAt(0)!=="/")p="/"+p;return p}function version(input){return V[key(input)]||""}function url(input){var raw=String(input||"");var k=key(raw),v=V[k];if(!v)return raw;var hi=raw.indexOf("#"),hash=hi>=0?raw.slice(hi):"",head=hi>=0?raw.slice(0,hi):raw,qi=head.indexOf("?"),p=qi>=0?head.slice(0,qi):head,q=qi>=0?head.slice(qi+1):"",parts=q?q.split("&").filter(Boolean).filter(function(x){return x.slice(0,2)!=="v="}):[];parts.push("v="+v);if(p.indexOf("./")===0)p=p.slice(2);if(p.charAt(0)!=="/")p="/"+p;return p+"?"+parts.join("&")+hash}window.ZWM_ASSET_VERSIONS=V;window.ZWM_BUILD_SOURCES=S;window.ZWM_ASSET_VERSION=version;window.ZWM_ASSET_URL=url})();\n';
}
const partialCache=new Map();
function partial(name){
  if(partialCache.has(name))return partialCache.get(name);
  const file=path.join(PARTIALS,name+".html");
  if(!fs.existsSync(file))throw new Error("Unknown partial: "+name);
  const value=fs.readFileSync(file,"utf8");partialCache.set(name,value);return value;
}
function render(source,versions,manifestVersion,release){
  let out=source.replace(/\{\{>\s*([a-z0-9-]+)\s*\}\}/gi,function(_,name){return partial(name)}).replaceAll("__ZWM_RELEASE__",release);
  out=out.replace(/\b(src|href|poster)=(["'])([^"']+)\2/gi,function(match,attr,quote,url){
    const key=assetKey(url);if(!key)return match;
    const v=key==="/asset-versions.js"?manifestVersion:versions[key];
    if(!v)return match;
    return attr+"="+quote+withVersion(stripVersion(url),v)+quote;
  });
  if(out.includes("{{>"))throw new Error("Unresolved partial include");
  return out;
}
function output(file,content){
  if(CHECK){
    const current=fs.existsSync(file)?fs.readFileSync(file,"utf8"):"";
    if(current!==content)throw new Error("Generated output is stale: "+slash(path.relative(ROOT,file)));
  }else{
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file,content);
  }
}
const versions=collectVersions();
const sources=collectSources();
const dynamicVersions=sorted(Object.fromEntries(DYNAMIC_KEYS.filter(function(key){return versions[key]}).map(function(key){return [key,versions[key]]})));
const releaseSeed=JSON.stringify(versions)+"\\n"+JSON.stringify(sources)+"\\n";
const release=gitBlobHash(Buffer.from(releaseSeed)).slice(0,12);
const manifest=manifestText(dynamicVersions,sources);
const manifestVersion=gitBlobHash(Buffer.from(manifest)).slice(0,12);
output(path.join(PUBLIC,"asset-versions.js"),manifest);
output(path.join(PUBLIC,"release.json"),JSON.stringify({release:release,versioning:"git-blob-content-hash"})+"\n");
for(const file of walk(PAGES).filter(function(f){return f.endsWith(".html")})){
  const name=slash(path.relative(PAGES,file));
  output(path.join(PUBLIC,name),render(fs.readFileSync(file,"utf8"),versions,manifestVersion,release));
}
console.log((CHECK?"generated output verified":"build complete")+" · release "+release);
