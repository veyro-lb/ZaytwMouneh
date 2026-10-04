(() => {
  "use strict";

  const RELEASE_PARAM="__zwm_release";
  const FRESH_PARAM="__zwm_fresh";
  const PROBE_PARAM="__zwm_probe";
  const meta=document.querySelector('meta[name="zwm-release"]');
  const current=String(meta?.content||"").trim();
  let checkPromise=null;

  function cleanTransientParams(){
    try{
      const url=new URL(location.href);
      let changed=false;
      [RELEASE_PARAM,FRESH_PARAM,PROBE_PARAM].forEach(key=>{
        if(url.searchParams.has(key)){
          url.searchParams.delete(key);
          changed=true;
        }
      });
      if(changed){
        history.replaceState(
          history.state,
          document.title,
          url.pathname+(url.search||"")+url.hash
        );
      }
    }catch{}
  }

  async function checkRelease(){
    cleanTransientParams();
    if(checkPromise)return checkPromise;

    checkPromise=(async()=>{
      try{
        const response=await fetch("/release.json?t="+Date.now(),{
          cache:"no-store",
          headers:{"Cache-Control":"no-cache","Pragma":"no-cache"}
        });
        if(!response.ok)return {current,latest:"",updateAvailable:false};

        const data=await response.json().catch(()=>null);
        const latest=String(data?.release||"").trim();
        const updateAvailable=!!(latest&&current&&latest!==current);

        if(updateAvailable){
          document.documentElement.dataset.zwmUpdateAvailable=latest;
          try{
            window.dispatchEvent(new CustomEvent("zwm:update-available",{
              detail:{current,latest}
            }));
          }catch{}
        }else{
          delete document.documentElement.dataset.zwmUpdateAvailable;
        }

        return {current,latest,updateAvailable};
      }catch{
        return {current,latest:"",updateAvailable:false};
      }finally{
        checkPromise=null;
      }
    })();

    return checkPromise;
  }

  // Never reload or replace the page automatically. Older/mobile browsers can
  // otherwise get trapped in visible refresh loops while caches are settling.
  // Versioned asset URLs already provide normal cache busting on navigation.
  cleanTransientParams();
  window.ZWM_RELEASE=current;
  window.ZWM_CHECK_RELEASE=checkRelease;
  window.addEventListener("pageshow",cleanTransientParams,{passive:true});
})();