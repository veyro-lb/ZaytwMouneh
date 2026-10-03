const CACHE="zwm-owner-shell-v5";
const SHELL=[
  "/admin.html",
  "/admin.css?v=20261004-toolkit5",
  "/admin.js?v=20261004-toolkit5",
  "/admin-config.js?v=20261004-toolkit5",
  "/assets/favicon.svg"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch",event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=="GET")return;
  if(url.hostname.includes("supabase.co")||url.pathname.includes("/rest/")||url.pathname.includes("/auth/")||url.pathname.includes("/storage/"))return;
  if(url.pathname==="/admin.html"||url.pathname==="/admin"){
    event.respondWith(fetch(event.request).catch(()=>caches.match("/admin.html")));
    return;
  }
  if(url.origin===location.origin){
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      return response;
    })));
  }
});