import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGINS=new Set([
  "https://zaytwmouneh.com",
  "https://www.zaytwmouneh.com",
  "https://zaytwmouneh.veyro-202.workers.dev"
]);

const cors=(origin:string|null)=>({
  "Access-Control-Allow-Origin":origin&&ALLOWED_ORIGINS.has(origin)?origin:"https://zaytwmouneh.com",
  "Access-Control-Allow-Headers":"authorization, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Cache-Control":"no-store",
  "Vary":"Origin"
});
const json=(origin:string|null,body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors(origin),"Content-Type":"application/json"}});
async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("")}
async function readJson(url:string,init:RequestInit){const response=await fetch(url,init);const data=await response.json().catch(()=>null);return {response,data}}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return json(origin,{ok:false,error:"Method not allowed"},405);
  if(origin&&!ALLOWED_ORIGINS.has(origin))return json(origin,{ok:false,error:"Origin not allowed"},403);

  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
  const serviceRole=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!supabaseUrl||!serviceRole)return json(origin,{ok:false,error:"Server configuration unavailable"},500);

  const body=await req.json().catch(()=>({}));
  const reference=String(body?.reference||"").trim().toUpperCase();
  const contact=String(body?.contact||"").trim();
  if(!/^[A-Z0-9-]{6,80}$/.test(reference))return json(origin,{ok:false,error:"Enter a valid order code."},400);
  if(contact.length>254)return json(origin,{ok:false,error:"Enter the email or phone used on the order."},400);

  let userId:string|null=null;
  const auth=req.headers.get("authorization")||"";
  if(auth.toLowerCase().startsWith("bearer ")){
    const userResult=await readJson(supabaseUrl+"/auth/v1/user",{headers:{"apikey":serviceRole,"Authorization":auth}});
    if(!userResult.response.ok||!userResult.data?.id)return json(origin,{ok:false,error:"Your sign-in session has expired. Please sign in again."},401);
    userId=String(userResult.data.id);
  }else if(!contact){
    return json(origin,{ok:false,error:"Enter the email or phone number used on this order."},400);
  }

  const forwarded=(req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")||"").split(",")[0].trim();
  const fingerprint=forwarded||((req.headers.get("user-agent")||"unknown")+"|"+(origin||"no-origin"));
  const ipHash=await sha256(serviceRole+"|"+fingerprint);

  const rpc=await readJson(supabaseUrl+"/rest/v1/rpc/zwm_return_verify_order",{
    method:"POST",
    headers:{"apikey":serviceRole,"Authorization":"Bearer "+serviceRole,"Content-Type":"application/json","Cache-Control":"no-store"},
    body:JSON.stringify({p_reference:reference,p_contact:contact||null,p_ip_hash:ipHash,p_user_id:userId})
  });

  if(!rpc.response.ok)return json(origin,{ok:false,error:"Verification is temporarily unavailable. Please try again."},503);
  if(rpc.data?.rate_limited===true)return json(origin,{ok:false,error:"Too many verification attempts. Please try again later."},429);
  if(rpc.data?.verified!==true)return json(origin,{ok:false,error:"We could not verify those order details. Check the order code and the email or phone used for the order."},400);
  return json(origin,{ok:true,...rpc.data});
});