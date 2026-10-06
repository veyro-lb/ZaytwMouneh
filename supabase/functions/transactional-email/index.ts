import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { renderTransactionalEmailJob } from "../_shared/transactional-email-template.mjs";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{"Content-Type":"application/json","Cache-Control":"no-store"}
});

async function rest(url:string,init:RequestInit={}){
  const response=await fetch(url,init);
  const data=await response.json().catch(()=>null);
  return {response,data};
}

async function finish(
  supabaseUrl:string,
  headers:Record<string,string>,
  outboxId:string,
  status:"sent"|"retry"|"dead",
  error:string|null,
  providerMessageId:string|null,
  retrySeconds:number
){
  await fetch(supabaseUrl+"/rest/v1/rpc/transactional_email_outbox_finish",{
    method:"POST",
    headers,
    body:JSON.stringify({
      p_outbox_id:outboxId,
      p_status:status,
      p_error:error,
      p_provider_message_id:providerMessageId,
      p_retry_seconds:retrySeconds
    })
  });
}

async function sendWithResend(
  apiKey:string,
  from:string,
  job:any,
  subject:string,
  html:string
){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  try{
    const response=await fetch("https://api.resend.com/emails",{
      method:"POST",
      signal:controller.signal,
      headers:{
        "Authorization":"Bearer "+apiKey,
        "Content-Type":"application/json",
        "Idempotency-Key":"zwm/"+String(job.outbox_id)
      },
      body:JSON.stringify({
        from,
        to:[String(job.recipient)],
        subject,
        html
      })
    });
    const data=await response.json().catch(()=>null);
    return {status:response.status,ok:response.ok,data};
  }catch(error){
    if(error instanceof DOMException&&error.name==="AbortError"){
      return {status:0,ok:false,data:{name:"timeout"}};
    }
    return {status:0,ok:false,data:{name:"network_error"}};
  }finally{
    clearTimeout(timeout);
  }
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({ok:false,error:"Method not allowed"},405);

  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
  const serviceRole=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!supabaseUrl||!serviceRole)return json({ok:false,error:"Server configuration unavailable"},500);

  const serviceHeaders={
    "apikey":serviceRole,
    "Authorization":"Bearer "+serviceRole,
    "Content-Type":"application/json"
  };

  const configResult=await rest(supabaseUrl+"/rest/v1/rpc/transactional_email_server_config",{
    method:"POST",
    headers:serviceHeaders,
    body:"{}"
  });
  if(!configResult.response.ok||!configResult.data?.dispatch_token){
    return json({ok:false,error:"Email dispatch configuration unavailable"},500);
  }

  const suppliedSecret=req.headers.get("x-zwm-email-dispatch-secret")||"";
  if(!suppliedSecret||suppliedSecret!==String(configResult.data.dispatch_token)){
    return json({ok:false,error:"Not authorized"},403);
  }

  const body=await req.json().catch(()=>({}));
  if(String(body?.action||"")!=="dispatch"){
    return json({ok:false,error:"Invalid action"},400);
  }

  const resendKey=Deno.env.get("ZWM_RESEND_API_KEY")||"";
  const from=Deno.env.get("ZWM_TRANSACTIONAL_EMAIL_FROM")||"";
  if(!resendKey||!from){
    return json({ok:false,error:"Transactional email provider not configured"},503);
  }

  const claimResult=await rest(supabaseUrl+"/rest/v1/rpc/transactional_email_claim_outbox",{
    method:"POST",
    headers:serviceHeaders,
    body:JSON.stringify({p_limit:20})
  });
  if(!claimResult.response.ok){
    return json({ok:false,error:"Could not claim email outbox"},500);
  }

  const jobs=Array.isArray(claimResult.data)?claimResult.data:[];
  let sent=0,retry=0,dead=0;

  for(const job of jobs){
    let rendered:{subject:string;html:string};
    try{
      rendered=renderTransactionalEmailJob(job);
    }catch{
      dead++;
      await finish(supabaseUrl,serviceHeaders,String(job.outbox_id),"dead","template_error",null,60);
      continue;
    }

    const result=await sendWithResend(resendKey,from,job,rendered.subject,rendered.html);
    const providerId=typeof result.data?.id==="string"?result.data.id:null;

    if(result.ok){
      sent++;
      await finish(supabaseUrl,serviceHeaders,String(job.outbox_id),"sent",null,providerId,60);
      continue;
    }

    const status=Number(result.status||0);
    const providerName=String(result.data?.name||"");
    const attempts=Number(job.attempts||1);
    const permanent=status===422
      || providerName==="validation_error"
      || providerName==="invalid_to_address"
      || providerName==="invalid_from_address";

    if(permanent||attempts>=5){
      dead++;
      await finish(
        supabaseUrl,serviceHeaders,String(job.outbox_id),"dead",
        permanent?"invalid_recipient_or_payload":"delivery_retries_exhausted",
        providerId,60
      );
    }else{
      retry++;
      const seconds=Math.min(3600,60*Math.pow(2,Math.max(0,attempts-1)));
      const category=status?("provider_http_"+status):(providerName||"provider_network_error");
      await finish(
        supabaseUrl,serviceHeaders,String(job.outbox_id),"retry",
        category,providerId,seconds
      );
    }
  }

  return json({ok:true,claimed:jobs.length,sent,retry,dead});
});
