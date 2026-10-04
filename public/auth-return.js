(() => {
  "use strict";

  const ACCOUNT_PATH="/account.html";
  const path=location.pathname.replace(/\/+$/,"")||"/";
  const onAccount=path==="/account"||path==="/account.html";
  if(onAccount)return;

  let hashParams;
  try{hashParams=new URLSearchParams((location.hash||"").replace(/^#/,""));}catch{hashParams=new URLSearchParams();}
  let query;
  try{query=new URLSearchParams(location.search||"");}catch{query=new URLSearchParams();}

  const authHash=
    hashParams.has("access_token")||
    hashParams.has("refresh_token")||
    hashParams.has("expires_in")||
    hashParams.has("error")||
    hashParams.has("error_description");

  const authQuery=
    query.has("mouneh_auth")||
    query.has("error")||
    query.has("error_code")||
    query.has("error_description");

  if(!authHash&&!authQuery)return;

  try{
    const target=new URL(ACCOUNT_PATH,location.origin);
    target.searchParams.set("mouneh_auth","1");
    ["error","error_code","error_description"].forEach(key=>{
      if(query.has(key))target.searchParams.set(key,query.get(key)||"");
    });
    target.hash=location.hash||"";
    location.replace(target.toString());
  }catch{
    location.replace(ACCOUNT_PATH+(location.hash||""));
  }
})();
