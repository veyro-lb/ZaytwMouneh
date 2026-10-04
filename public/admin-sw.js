const CACHE="zwm-owner-shell-v24-mobile-stability";
const FALLBACK="/admin.html";

self.addEventListener("install",event=>{
  event.waitUntil(
    fetch(FALLBACK,{cache:"no-store"})
      .then(response=>response&&response.ok
        ?caches.open(CACHE).then(cache=>cache.put(FALLBACK,response.clone()))
        :undefined)
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

async function cacheResponse(request,response){
  if(!response||!response.ok)return response;
  try{
    const cache=await caches.open(CACHE);
    await cache.put(request,response.clone());
  }catch{}
  return response;
}

async function networkFirst(request,isNavigation=false){
  try{
    const response=await fetch(new Request(request,{cache:"no-store"}));
    await cacheResponse(request,response);
    return response;
  }catch{
    return (await caches.match(request))
      || (isNavigation ? await caches.match(FALLBACK) : Response.error());
  }
}

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(url.hostname.includes("supabase.co")||url.pathname.includes("/rest/")||url.pathname.includes("/auth/")||url.pathname.includes("/storage/"))return;

  const isNavigation=request.mode==="navigate";
  const mustBeFresh=isNavigation
    || url.pathname==="/admin"
    || url.pathname==="/admin.html"
    || url.pathname==="/admin-config.js"
    || url.pathname==="/release.json";

  if(mustBeFresh){
    event.respondWith(networkFirst(request,isNavigation));
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(request);
    const update=fetch(request)
      .then(response=>cacheResponse(request,response))
      .catch(()=>null);
    if(cached){
      event.waitUntil(update.then(()=>{}));
      return cached;
    }
    return (await update)||Response.error();
  })());
});
