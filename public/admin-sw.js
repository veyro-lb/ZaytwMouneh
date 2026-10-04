const CACHE="zwm-owner-shell-v20-adminqa2";
const FALLBACK="/admin.html";

self.addEventListener("install",event=>{
  event.waitUntil(
    fetch(FALLBACK,{cache:"no-store"})
      .then(response=>caches.open(CACHE).then(cache=>cache.put(FALLBACK,response.clone())))
      .catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.hostname.includes("supabase.co")||url.pathname.includes("/rest/")||url.pathname.includes("/auth/")||url.pathname.includes("/storage/"))return;

  event.respondWith((async()=>{
    try{
      const request=new Request(event.request,{cache:"no-store"});
      const response=await fetch(request);
      if(response&&response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      }
      return response;
    }catch(error){
      return (await caches.match(event.request)) || (event.request.mode==="navigate" ? await caches.match(FALLBACK) : Response.error());
    }
  })());
});
