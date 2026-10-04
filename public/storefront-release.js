(() => {
  "use strict";
  const meta=document.querySelector('meta[name="zwm-release"]');
  const current=String(meta?.content||"").trim();
  const manifest="/release.json";
  let checking=false;
  let lastCheck=0;

  function cleanReleaseParam(){
    try{
      const url=new URL(location.href);
      if(url.searchParams.has("__zwm_release")){
        url.searchParams.delete("__zwm_release");
        history.replaceState(history.state,document.title,url.pathname+(url.search||"")+url.hash);
      }
    }catch{}
  }

  async function checkRelease(force=false){
    const now=Date.now();
    if(checking||(!force&&now-lastCheck<5000))return;
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
      if(!latest||!current||latest===current){
        cleanReleaseParam();
        return;
      }
      const key="zwm:release-reload:"+latest+":"+location.pathname;
      try{
        if(sessionStorage.getItem(key)==="1")return;
        sessionStorage.setItem(key,"1");
      }catch{}
      const url=new URL(location.href);
      url.searchParams.set("__zwm_release",latest);
      location.replace(url.toString());
    }catch{
      /* Network loss must never block the storefront. */
    }finally{
      checking=false;
    }
  }

  window.ZWM_CHECK_RELEASE=()=>checkRelease(true);
  window.addEventListener("pageshow",()=>checkRelease(true));
  window.addEventListener("focus",()=>checkRelease(false));
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)checkRelease(false)});
  checkRelease(true);
})();