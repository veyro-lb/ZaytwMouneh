(() => {
  "use strict";
  const meta=document.querySelector('meta[name="zwm-release"]');
  const current=String(meta?.content||"").trim();
  const manifest="/release.json";
  const RELEASE_PARAM="__zwm_release";
  const FRESH_PARAM="__zwm_fresh";
  let checking=false;
  let lastCheck=0;

  function cleanTransientParams(){
    try{
      const url=new URL(location.href);
      let changed=false;
      [RELEASE_PARAM,FRESH_PARAM].forEach(key=>{
        if(url.searchParams.has(key)){url.searchParams.delete(key);changed=true;}
      });
      if(changed)history.replaceState(history.state,document.title,url.pathname+(url.search||"")+url.hash);
    }catch{}
  }

  function freshUrl(input=location.href,release=""){
    const url=new URL(input,location.href);
    url.searchParams.set(FRESH_PARAM,Date.now().toString(36));
    if(release)url.searchParams.set(RELEASE_PARAM,release);
    return url.toString();
  }

  function forceFresh(release="",reason="fresh"){
    const marker="zwm:fresh-nav:"+String(release||current||"current")+":"+location.pathname+":"+reason;
    try{
      if(sessionStorage.getItem(marker)==="1")return false;
      sessionStorage.setItem(marker,"1");
    }catch{}
    location.replace(freshUrl(location.href,release));
    return true;
  }

  async function checkRelease(force=false){
    const now=Date.now();
    if(checking||(!force&&now-lastCheck<4000))return;
    checking=true;
    lastCheck=now;
    try{
      const res=await fetch(manifest+"?t="+now,{
        cache:"no-store",
        headers:{"Cache-Control":"no-cache","Pragma":"no-cache"}
      });
      if(!res.ok)return;
      const data=await res.json();
      const latest=String(data?.release||"").trim();
      if(latest&&current&&latest!==current){
        forceFresh(latest,"release");
        return;
      }
      cleanTransientParams();
    }catch{
      /* A network interruption must never block the storefront. */
    }finally{
      checking=false;
    }
  }

  // Back/forward cache is the main reason an already-open tab can look like an old deployment.
  window.addEventListener("pageshow",event=>{
    if(event.persisted){
      if(forceFresh(current,"bfcache"))return;
    }
    checkRelease(true);
  });
  window.addEventListener("focus",()=>checkRelease(false));
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)checkRelease(false)});

  // Force ordinary same-origin page navigation to request a fresh document.
  document.addEventListener("click",event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest?.("a[href]");
    if(!link||link.hasAttribute("download")||link.target&&link.target!=="_self")return;
    let url;
    try{url=new URL(link.href,location.href)}catch{return}
    if(url.origin!==location.origin)return;
    if(url.protocol!=="http:"&&url.protocol!=="https:")return;
    const sameDocument=url.pathname===location.pathname&&url.search===location.search;
    if(sameDocument&&url.hash)return;
    event.preventDefault();
    location.assign(freshUrl(url.toString(),current));
  });

  window.ZWM_CHECK_RELEASE=()=>checkRelease(true);
  queueMicrotask(()=>{cleanTransientParams();checkRelease(true)});
})();