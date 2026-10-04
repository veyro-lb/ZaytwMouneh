(() => {
  "use strict";
  const meta=document.querySelector('meta[name="zwm-release"]');
  const current=String(meta?.content||"").trim();
  const manifest="/release.json";
  const RELEASE_PARAM="__zwm_release";
  const FRESH_PARAM="__zwm_fresh";
  const PROBE_PARAM="__zwm_probe";
  const arrivedFresh=new URL(location.href).searchParams.has(FRESH_PARAM);
  let checking=false;
  let lastCheck=0;

  function cleanTransientParams(){
    try{
      const url=new URL(location.href);
      let changed=false;
      [RELEASE_PARAM,FRESH_PARAM,PROBE_PARAM].forEach(key=>{
        if(url.searchParams.has(key)){url.searchParams.delete(key);changed=true;}
      });
      if(changed)history.replaceState(history.state,document.title,url.pathname+(url.search||"")+url.hash);
    }catch{}
  }

  function freshUrl(input=location.href,release=""){
    const url=new URL(input,location.href);
    url.searchParams.delete(PROBE_PARAM);
    url.searchParams.set(FRESH_PARAM,Date.now().toString(36));
    if(release)url.searchParams.set(RELEASE_PARAM,release);
    return url.toString();
  }

  function signatureKey(value){
    let h=2166136261;
    for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}
    return (h>>>0).toString(36);
  }

  function forceFresh(release="",reason="fresh"){
    // Do not interrupt account entry or loop when session storage is unavailable.
    if(arrivedFresh||document.querySelector("#accountAuthForm,#accountCompleteForm"))return false;
    const marker="zwm:fresh-nav:"+String(release||current||"current")+":"+location.pathname+":"+reason;
    try{
      if(sessionStorage.getItem(marker)==="1")return false;
      sessionStorage.setItem(marker,"1");
    }catch{}
    location.replace(freshUrl(location.href,release));
    return true;
  }

  function localAssets(root,base){
    const out=[];
    root.querySelectorAll('script[src],link[rel="stylesheet"][href]').forEach(node=>{
      const raw=node.getAttribute("src")||node.getAttribute("href");
      if(!raw)return;
      try{
        const url=new URL(raw,base);
        if(url.origin!==location.origin)return;
        out.push(url.pathname+url.search);
      }catch{}
    });
    return [...new Set(out)].sort();
  }

  async function freshDocumentSignature(now){
    try{
      const probe=new URL(location.href);
      probe.hash="";
      [RELEASE_PARAM,FRESH_PARAM,PROBE_PARAM].forEach(key=>probe.searchParams.delete(key));
      probe.searchParams.set(PROBE_PARAM,String(now));
      const response=await fetch(probe.toString(),{
        cache:"no-store",
        headers:{"Cache-Control":"no-cache","Pragma":"no-cache"}
      });
      if(!response.ok)return null;
      const html=await response.text();
      const parsed=new DOMParser().parseFromString(html,"text/html");
      const assets=localAssets(parsed,probe.toString());
      const release=String(parsed.querySelector('meta[name="zwm-release"]')?.content||"").trim();
      return {assets,release,key:signatureKey(release+"|"+assets.join("|"))};
    }catch{return null}
  }

  async function checkRelease(force=false){
    const now=Date.now();
    if(checking||(!force&&now-lastCheck<5000))return;
    checking=true;
    lastCheck=now;
    try{
      const [manifestResponse,freshDoc]=await Promise.all([
        fetch(manifest+"?t="+now,{cache:"no-store",headers:{"Cache-Control":"no-cache","Pragma":"no-cache"}}).catch(()=>null),
        freshDocumentSignature(now)
      ]);

      // The freshly fetched HTML is the authority. Deployment manifests can lag a page
      // by a few seconds, so never "downgrade" a current page because release.json is stale.
      if(freshDoc){
        const liveAssets=new Set(localAssets(document,location.href));
        const missing=freshDoc.assets.filter(asset=>!liveAssets.has(asset));
        const releaseMismatch=freshDoc.release&&current&&freshDoc.release!==current;
        if(releaseMismatch||missing.length){
          forceFresh(freshDoc.release||current,"assets-"+freshDoc.key);
          return;
        }
        if(freshDoc.release===current&&!missing.length){
          cleanTransientParams();
          return;
        }
      }

      if(manifestResponse?.ok){
        const data=await manifestResponse.json().catch(()=>null);
        const latest=String(data?.release||"").trim();
        if(latest&&current&&latest!==current){
          forceFresh(latest,"release-"+latest);
          return;
        }
      }
      cleanTransientParams();
    }catch{
      /* Network loss must never block the storefront. */
    }finally{
      checking=false;
    }
  }

  window.addEventListener("pageshow",event=>{
    checkRelease(true);
  });
  window.addEventListener("focus",()=>checkRelease(false));
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)checkRelease(false)});

  // Native links preserve browser history, OAuth fragments and back/forward state.
  // HTML and scripts already revalidate through the deployment's cache headers.

  window.ZWM_CHECK_RELEASE=()=>checkRelease(true);
  queueMicrotask(()=>{cleanTransientParams();checkRelease(true)});
})();