const CACHE="zwm-owner-shell-v26-customer-notifications";
const FALLBACK="/admin.html";
self.addEventListener("install",event=>{event.waitUntil(fetch(FALLBACK,{cache:"no-store"}).then(response=>response&&response.ok?caches.open(CACHE).then(cache=>cache.put(FALLBACK,response.clone())):undefined).catch(()=>{}));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
async function cacheResponse(request,response){if(!response||!response.ok)return response;try{const cache=await caches.open(CACHE);await cache.put(request,response.clone())}catch{}return response}
async function networkFirst(request,isNavigation=false){try{const response=await fetch(new Request(request,{cache:"no-store"}));await cacheResponse(request,response);return response}catch{const cached=await caches.match(request);if(cached)return cached;if(isNavigation){const path=new URL(request.url).pathname;if(path.startsWith("/admin"))return(await caches.match(FALLBACK))||Response.error()}return Response.error()}}
self.addEventListener("fetch",event=>{const request=event.request;if(request.method!=="GET")return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(url.hostname.includes("supabase.co")||url.pathname.includes("/rest/")||url.pathname.includes("/auth/")||url.pathname.includes("/storage/")||url.pathname.includes("/functions/"))return;const isNavigation=request.mode==="navigate";const mustBeFresh=isNavigation||url.pathname==="/admin"||url.pathname==="/admin.html"||url.pathname==="/account"||url.pathname==="/account.html"||url.pathname==="/admin-config.js"||url.pathname==="/admin-notifications-v1.js"||url.pathname==="/customer-notifications-v1.js"||url.pathname==="/notifications-v1.css"||url.pathname==="/release.json";if(mustBeFresh){event.respondWith(networkFirst(request,isNavigation));return}event.respondWith((async()=>{const cached=await caches.match(request);const update=fetch(request).then(response=>cacheResponse(request,response)).catch(()=>null);if(cached){event.waitUntil(update.then(()=>{}));return cached}return(await update)||Response.error()})())});

self.addEventListener("push",event=>{
  let payload={};
  try{payload=event.data?event.data.json():{}}catch{try{payload={body:event.data?.text()||""}}catch{}}
  const title=String(payload.title||"Zayt w Mouneh");
  event.waitUntil(self.registration.showNotification(title,{
    body:String(payload.body||""),
    icon:String(payload.icon||"/assets/favicon.svg"),
    badge:String(payload.badge||"/assets/favicon.svg"),
    tag:String(payload.tag||("zwm-"+Date.now())),
    data:{url:String(payload.route||payload.data?.url||"/"),notificationId:String(payload.notification_id||payload.data?.notificationId||"")},
    requireInteraction:payload.requireInteraction===true
  }));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  let target;
  try{target=new URL(String(event.notification?.data?.url||"/"),self.location.origin);if(target.origin!==self.location.origin)target=new URL("/",self.location.origin)}catch{target=new URL("/",self.location.origin)}
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    const preferred=windows.find(client=>{try{const cur=new URL(client.url);return cur.origin===target.origin&&(cur.pathname.startsWith("/admin")===target.pathname.startsWith("/admin")||cur.pathname.startsWith("/account")===target.pathname.startsWith("/account"))}catch{return false}})||windows.find(client=>{try{return new URL(client.url).origin===target.origin}catch{return false}});
    if(preferred){try{if("navigate" in preferred)await preferred.navigate(target.href)}catch{};try{return await preferred.focus()}catch{return}}
    if(self.clients.openWindow)return self.clients.openWindow(target.href);
  })());
});
