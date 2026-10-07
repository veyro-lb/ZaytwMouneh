"use strict";
const http=require("node:http");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..","public");
const port=Number(process.env.PORT||4173);
const host="127.0.0.1";
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".woff2":"font/woff2",".mp4":"video/mp4",".webm":"video/webm"};
function resolvePath(rawUrl){
  let pathname="/";
  try{pathname=decodeURIComponent(new URL(rawUrl,"http://local").pathname)}catch{}
  if(pathname==="/")pathname="/index.html";
  let candidate=path.resolve(root,"."+pathname);
  if(!candidate.startsWith(root+path.sep)&&candidate!==root)return null;
  if(!path.extname(candidate)){
    const html=candidate+".html";
    if(fs.existsSync(html))candidate=html;
    else if(fs.existsSync(path.join(candidate,"index.html")))candidate=path.join(candidate,"index.html");
  }
  return candidate;
}
const server=http.createServer((req,res)=>{
  const file=resolvePath(req.url||"/");
  if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404,{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"});
    res.end("Not found");return;
  }
  res.writeHead(200,{"content-type":mime[path.extname(file).toLowerCase()]||"application/octet-stream","cache-control":"no-store"});
  fs.createReadStream(file).pipe(res);
});
server.listen(port,host,()=>process.stdout.write(`ZWM test server http://${host}:${port}\n`));
