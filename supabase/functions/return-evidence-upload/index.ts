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
  "Vary":"Origin",
  "Cache-Control":"no-store"
});
const json=(origin:string|null,body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors(origin),"Content-Type":"application/json"}});
function safeUuid(v:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)}
function extFor(mime:string){return mime==="image/jpeg"?"jpg":mime==="image/png"?"png":mime==="image/webp"?"webp":""}
function signatureOk(bytes:Uint8Array,mime:string){
  if(mime==="image/jpeg")return bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  if(mime==="image/png")return bytes.length>=8&&bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes[4]===0x0d&&bytes[5]===0x0a&&bytes[6]===0x1a&&bytes[7]===0x0a;
  if(mime==="image/webp")return bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
  return false;
}
async function requestJson(url:string,init:RequestInit){const r=await fetch(url,init);const data=await r.json().catch(()=>null);return {r,data}}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return json(origin,{ok:false,error:"Method not allowed"},405);
  if(origin&&!ALLOWED_ORIGINS.has(origin))return json(origin,{ok:false,error:"Origin not allowed"},403);
  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"",serviceRole=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"",auth=req.headers.get("authorization")||"";
  if(!supabaseUrl||!serviceRole)return json(origin,{ok:false,error:"Server configuration unavailable"},500);
  if(!auth.toLowerCase().startsWith("bearer "))return json(origin,{ok:false,error:"Sign in required"},401);
  const userResult=await requestJson(supabaseUrl+"/auth/v1/user",{headers:{"apikey":serviceRole,"Authorization":auth}});
  const userId=String(userResult.data?.id||"");
  if(!userResult.r.ok||!safeUuid(userId))return json(origin,{ok:false,error:"Session invalid"},401);
  const form=await req.formData().catch(()=>null),requestId=String(form?.get("request_id")||""),file=form?.get("file");
  if(!safeUuid(requestId)||!(file instanceof File))return json(origin,{ok:false,error:"Request and image are required"},400);
  if(file.size<=0||file.size>5*1024*1024)return json(origin,{ok:false,error:"Each image must be 5 MB or smaller"},400);
  const mime=String(file.type||"").toLowerCase(),ext=extFor(mime);
  if(!ext)return json(origin,{ok:false,error:"Use a JPEG, PNG or WebP image"},400);
  const head=new Uint8Array(await file.slice(0,16).arrayBuffer());
  if(!signatureOk(head,mime))return json(origin,{ok:false,error:"The selected file does not match its image type"},400);
  const ctxResult=await requestJson(supabaseUrl+"/rest/v1/rpc/zwm_returns",{
    method:"POST",headers:{"apikey":serviceRole,"Authorization":auth,"Content-Type":"application/json"},
    body:JSON.stringify({action:"evidence_context",p:{request_id:requestId}})
  });
  if(!ctxResult.r.ok)return json(origin,{ok:false,error:ctxResult.data?.message||"Request is not available"},ctxResult.r.status===401?401:403);
  if(ctxResult.data?.can_upload!==true)return json(origin,{ok:false,error:"This request is closed"},409);
  if(Number(ctxResult.data?.file_count||0)>=4)return json(origin,{ok:false,error:"This request already has the maximum of 4 evidence images"},409);
  if(Number(ctxResult.data?.total_bytes||0)+file.size>15*1024*1024)return json(origin,{ok:false,error:"Evidence for this request is limited to 15 MB total"},409);
  const path=requestId+"/"+crypto.randomUUID()+"."+ext,encoded=path.split("/").map(encodeURIComponent).join("/");
  const storage=await fetch(supabaseUrl+"/storage/v1/object/return-evidence/"+encoded,{
    method:"POST",headers:{"apikey":serviceRole,"Authorization":"Bearer "+serviceRole,"Content-Type":mime,"x-upsert":"false","Cache-Control":"no-store"},body:file
  });
  if(!storage.ok)return json(origin,{ok:false,error:"Could not store this image securely"},502);
  const insert=await requestJson(supabaseUrl+"/rest/v1/return_request_evidence",{
    method:"POST",headers:{"apikey":serviceRole,"Authorization":"Bearer "+serviceRole,"Content-Type":"application/json","Prefer":"return=representation"},
    body:JSON.stringify({request_id:requestId,storage_path:path,mime_type:mime,file_size:file.size,uploaded_by:userId})
  });
  if(!insert.r.ok){
    await fetch(supabaseUrl+"/storage/v1/object/return-evidence/"+encoded,{method:"DELETE",headers:{"apikey":serviceRole,"Authorization":"Bearer "+serviceRole}}).catch(()=>null);
    return json(origin,{ok:false,error:"Could not attach this image to the request"},500);
  }
  const row=Array.isArray(insert.data)?insert.data[0]:insert.data;
  return json(origin,{ok:true,evidence:{id:row?.id,mime_type:mime,file_size:file.size,created_at:row?.created_at}});
});
