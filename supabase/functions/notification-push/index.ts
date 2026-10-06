
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import webpush from "npm:web-push@3.6.7";

const ORIGIN="https://zaytwmouneh.veyro-202.workers.dev";
const cors=(origin:string|null)=>({
  "Access-Control-Allow-Origin": origin===ORIGIN?ORIGIN:ORIGIN,
  "Access-Control-Allow-Headers":"authorization, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Vary":"Origin"
});
const json=(origin:string|null,body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors(origin),"Content-Type":"application/json"}});
const categoryFor=(type:string)=>({
  ORDER_CREATED:"new_order",
  RETURN_REQUEST_CREATED:"customer_requests",
  RETURN_MORE_INFO_NEEDED:"customer_requests",
  RETURN_STATUS_CHANGED:"customer_requests",
  RETURN_SAFETY_ISSUE:"customer_requests",
  RETURN_CUSTOMER_UPDATE:"customer_requests",
  RETURN_REFUND_FAILED:"customer_requests",
  WHOLESALE_INQUIRY_CREATED:"wholesale",
  WHOLESALE_STATUS_CHANGED:"wholesale",
  PAYMENT_ISSUE:"payment_issue",
  PAYMENT_FAILED:"payment_issue",
  CUSTOMER_REQUEST_CREATED:"customer_requests",
  PRODUCT_LOW_STOCK:"low_stock",
  PRODUCT_OUT_OF_STOCK:"out_of_stock",
  REVIEW_CREATED:"reviews",
  ORDER_STATUS_CHANGED:"order_updates",
  ORDER_ITEM_ATTENTION:"order_updates",
  PRODUCT_BACK_IN_STOCK:"back_in_stock",
  MOUNEH_POINTS:"mouneh_points",
  MARKETING:"marketing"
}[type]||"routine_activity");

const copy:any={
  en:{
    "order.created.title":"New order received 🛒",
    "wholesale.created.title":"New wholesale inquiry 📦",
    "payment.failed.title":"Payment issue needs attention ⚠️",
    "review.created.title":"New review received ★",
    status:{
      new:"Order received",
      confirmed:"Order confirmed ✅",
      preparing:"Your order is being prepared",
      out_for_delivery:"Your order is out for delivery 🚚",
      delivered:"Order delivered ✅",
      cancelled:"Order cancelled"
    }
  },
  ar:{
    "order.created.title":"طلب جديد 🛒",
    "wholesale.created.title":"استفسار جملة جديد 📦",
    "payment.failed.title":"مشكلة دفع تحتاج إلى انتباه ⚠️",
    "review.created.title":"تقييم جديد ★",
    status:{
      new:"تم استلام الطلب",
      confirmed:"تم تأكيد الطلب ✅",
      preparing:"طلبك قيد التحضير",
      out_for_delivery:"طلبك خرج للتوصيل 🚚",
      delivered:"تم تسليم الطلب ✅",
      cancelled:"تم إلغاء الطلب"
    }
  },
  fr:{
    "order.created.title":"Nouvelle commande reçue 🛒",
    "wholesale.created.title":"Nouvelle demande de gros 📦",
    "payment.failed.title":"Problème de paiement à vérifier ⚠️",
    "review.created.title":"Nouvel avis reçu ★",
    status:{
      new:"Commande reçue",
      confirmed:"Commande confirmée ✅",
      preparing:"Votre commande est en préparation",
      out_for_delivery:"Votre commande est en livraison 🚚",
      delivered:"Commande livrée ✅",
      cancelled:"Commande annulée"
    }
  }
};

function content(n:any){
  const l=["en","ar","fr"].includes(n.locale)?n.locale:"en";
  const c=copy[l],m=n.metadata||{};
  if(n.notification_type==="TEST_PUSH"){return {title:l==="ar"?"الإشعارات تعمل ✅":l==="fr"?"Les notifications fonctionnent ✅":"Notifications are working ✅",body:l==="ar"?"هذا إشعار تجريبي من زيت ومونة.":l==="fr"?"Ceci est une notification test de Zayt w Mouneh.":"This is a test notification from Zayt w Mouneh."};}
  const returnType=String(n.notification_type||"").startsWith("RETURN_");
  if(returnType){
    const ref=String(m.reference||"").trim(),status=String(m.status||"").trim(),note=String(m.note||"").trim();
    const suffix=ref?" · "+ref:"";
    if(n.notification_type==="RETURN_SAFETY_ISSUE")return {title:(l==="ar"?"مشكلة جودة أو سلامة تحتاج مراجعة":l==="fr"?"Problème qualité / sécurité à examiner":"Quality / safety issue needs review")+suffix,body:l==="ar"?"تم إرسال بلاغ سلامة أو جودة جديد.":l==="fr"?"Une nouvelle demande qualité ou sécurité a été envoyée.":"A new quality or safety request was submitted."};
    if(n.notification_type==="RETURN_CUSTOMER_UPDATE")return {title:(l==="ar"?"أضاف العميل معلومات جديدة":l==="fr"?"Le client a ajouté des informations":"Customer added information")+suffix,body:l==="ar"?"راجع طلب الإرجاع أو مشكلة المنتج.":l==="fr"?"Consultez la demande retour / produit.":"Review the return or product-issue request."};
    if(n.notification_type==="RETURN_REFUND_FAILED")return {title:(l==="ar"?"تعذرت معالجة استرداد":l==="fr"?"Échec du traitement d’un remboursement":"Refund processing needs attention")+suffix,body:l==="ar"?"راجع معاملة الاسترداد المعلقة.":l==="fr"?"Vérifiez la transaction de remboursement en attente.":"Review the pending refund transaction."};
    if(n.notification_type==="RETURN_MORE_INFO_NEEDED")return {title:(l==="ar"?"نحتاج معلومات إضافية":l==="fr"?"Informations supplémentaires requises":"More information needed")+suffix,body:note||(l==="ar"?"افتح طلبك وأرسل التفاصيل المطلوبة.":l==="fr"?"Ouvrez votre demande et envoyez les informations demandées.":"Open your request and send the requested details.")};
    const statusMap:any={
      submitted:[ "Request received","تم استلام الطلب","Demande reçue"],
      under_review:["Request under review","الطلب قيد المراجعة","Demande en cours d’examen"],
      awaiting_customer:["More information needed","معلومات إضافية مطلوبة","Informations requises"],
      return_authorized:["Return authorized","تمت الموافقة على الإرجاع","Retour autorisé"],
      resolution_in_progress:["Resolution in progress","الحل قيد التنفيذ","Solution en cours"],
      completed:["Request completed","اكتمل الطلب","Demande terminée"],
      rejected:["Request reviewed","تمت مراجعة الطلب","Demande examinée"]
    };
    const labels=statusMap[status]||["Return / product issue update","تحديث على طلب الإرجاع","Mise à jour retour / produit"];
    return {title:(l==="ar"?labels[1]:l==="fr"?labels[2]:labels[0])+suffix,body:note||(l==="ar"?"افتح حسابك لمراجعة آخر تحديث.":l==="fr"?"Ouvrez votre compte pour consulter la mise à jour.":"Open your account to review the latest update.")};
  }
  if(n.notification_type==="ORDER_CREATED"){
    const ref=m.reference||n.entity_id;
    if(n.audience==="customer"){
      return {title:l==="ar"?"تم استلام طلبك":l==="fr"?"Commande reçue":"Order received",body:l==="ar"?`استلمنا طلبك ${ref}.`:l==="fr"?`Nous avons reçu votre commande ${ref}.`:`We received your order ${ref}.`};
    }
    const amount=Number(m.total||0).toFixed(2);
    return {title:c["order.created.title"],body:l==="ar"?`الطلب ${ref} · ${amount}`:l==="fr"?`Commande ${ref} · ${amount}`:`Order ${ref} · ${amount}`};
  }
  if(n.notification_type==="WHOLESALE_INQUIRY_CREATED"){
    const business=String(m.business_name||"").trim();
    return {title:c["wholesale.created.title"],body:business?(l==="ar"?`طلب جملة جديد من ${business}.`:l==="fr"?`Nouvelle demande de gros de ${business}.`:`New wholesale inquiry from ${business}.`):(l==="ar"?"تم استلام استفسار جملة جديد.":l==="fr"?"Une nouvelle demande de gros a été reçue.":"New wholesale inquiry received.")};
  }
  if(n.notification_type==="WHOLESALE_STATUS_CHANGED"){
    const status=String(m.status||"new"),ref=m.reference||n.entity_id;
    const statusCopy:any={
      en:{new:"Wholesale request received",contacted:"Wholesale request contacted",needs_information:"Wholesale request needs information",quote_preparing:"Wholesale quote in preparation",quote_sent:"Wholesale quote sent",negotiating:"Wholesale request in discussion",approved:"Wholesale request approved",converted:"Wholesale request completed",lost:"Wholesale request closed",archived:"Wholesale request archived"},
      ar:{new:"تم استلام طلب الجملة",contacted:"تم التواصل بشأن طلب الجملة",needs_information:"طلب الجملة يحتاج معلومات إضافية",quote_preparing:"يتم تحضير عرض الجملة",quote_sent:"تم إرسال عرض الجملة",negotiating:"طلب الجملة قيد المناقشة",approved:"تمت الموافقة على طلب الجملة",converted:"اكتمل طلب الجملة",lost:"تم إغلاق طلب الجملة",archived:"تمت أرشفة طلب الجملة"},
      fr:{new:"Demande de gros reçue",contacted:"Contact effectué pour la demande de gros",needs_information:"Informations requises pour la demande de gros",quote_preparing:"Devis de gros en préparation",quote_sent:"Devis de gros envoyé",negotiating:"Demande de gros en discussion",approved:"Demande de gros approuvée",converted:"Demande de gros finalisée",lost:"Demande de gros clôturée",archived:"Demande de gros archivée"}
    };
    return {title:(statusCopy[l]||statusCopy.en)[status]||statusCopy.en.new,body:l==="ar"?`تم تحديث طلب الجملة ${ref}.`:l==="fr"?`Votre demande de gros ${ref} a été mise à jour.`:`Your wholesale request ${ref} was updated.`};
  }
  if(n.notification_type==="PAYMENT_ISSUE"||n.notification_type==="PAYMENT_FAILED"){
    return {title:c["payment.failed.title"],body:l==="ar"?`راجع الطلب ${m.reference||n.entity_id}.`:l==="fr"?`Vérifiez la commande ${m.reference||n.entity_id}.`:`Review order ${m.reference||n.entity_id}.`};
  }
  if(n.notification_type==="REVIEW_CREATED"){
    return {title:c["review.created.title"],body:l==="ar"?"هناك تقييم جديد يحتاج إلى المراجعة.":l==="fr"?"Un nouvel avis est disponible pour modération.":"A new review is ready for moderation."};
  }
  if(n.notification_type==="ORDER_ITEM_ATTENTION"){
    const ref=m.reference||n.entity_id,item=String(m.item||"").trim();
    if(n.audience==="admin")return {title:l==="ar"?"صنف يحتاج إلى متابعة ⚠️":l==="fr"?"Article nécessitant une attention ⚠️":"Item needs attention ⚠️",body:(l==="ar"?`الطلب ${ref}`:l==="fr"?`Commande ${ref}`:`Order ${ref}`)+(item?" · "+item:"")};
    return {title:l==="ar"?"هناك صنف في طلبك يحتاج إلى متابعة":l==="fr"?"Un article de votre commande nécessite votre attention":"An item in your order needs attention",body:l==="ar"?`سنراجع الطلب ${ref} ونتواصل معك قريباً.`:l==="fr"?`Nous vérifierons la commande ${ref} et vous contacterons rapidement.`:`We’ll review order ${ref} and contact you shortly.`};
  }
  if(n.notification_type==="ORDER_STATUS_CHANGED"){
    const status=String(m.status||"new");
    return {title:c.status[status]||c.status.new,body:l==="ar"?`طلبك ${m.reference||n.entity_id} تم تحديثه.`:l==="fr"?`Votre commande ${m.reference||n.entity_id} a été mise à jour.`:`Your Zayt w Mouneh order ${m.reference||n.entity_id} was updated.`};
  }
  return {title:"Zayt w Mouneh",body:l==="ar"?"لديك إشعار جديد.":l==="fr"?"Vous avez une nouvelle notification.":"You have a new notification."};
}

async function rest(url:string,init:any={}){
  const r=await fetch(url,init);
  const data=await r.json().catch(()=>null);
  return {r,data};
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return json(origin,{ok:false,error:"Method not allowed"},405);
  if(origin&&origin!==ORIGIN)return json(origin,{ok:false,error:"Origin not allowed"},403);

  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
  const serviceRole=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!supabaseUrl||!serviceRole)return json(origin,{ok:false,error:"Server configuration unavailable"},500);
  const serviceHeaders={"apikey":serviceRole,"Authorization":"Bearer "+serviceRole,"Content-Type":"application/json"};

  const confResp=await rest(supabaseUrl+"/rest/v1/rpc/zwm_notification_server_config",{method:"POST",headers:serviceHeaders,body:"{}"});
  if(!confResp.r.ok||!confResp.data)return json(origin,{ok:false,error:"Push configuration unavailable"},500);
  let conf=confResp.data;

  if(!conf.vapid_public_key||!conf.vapid_private_key){
    const keys=webpush.generateVAPIDKeys();
    const setResp=await rest(supabaseUrl+"/rest/v1/rpc/zwm_notification_server_set_vapid",{method:"POST",headers:serviceHeaders,body:JSON.stringify({p_public:keys.publicKey,p_private:keys.privateKey})});
    if(!setResp.r.ok)return json(origin,{ok:false,error:"Could not initialize push keys"},500);
    const refresh=await rest(supabaseUrl+"/rest/v1/rpc/zwm_notification_server_config",{method:"POST",headers:serviceHeaders,body:"{}"});
    conf=refresh.data;
  }
  webpush.setVapidDetails("mailto:notifications@zaytwmouneh.com",conf.vapid_public_key,conf.vapid_private_key);

  const body=await req.json().catch(()=>({}));
  const action=String(body?.action||"");

  if(action==="dispatch"){
    const internalSecret=req.headers.get("x-zwm-dispatch-secret")||"";
    if(internalSecret){
      const prodConfResp=await rest(supabaseUrl+"/rest/v1/rpc/notification_server_config",{method:"POST",headers:serviceHeaders,body:"{}"});
      const prodConf=prodConfResp.data||{};
      if(!prodConfResp.r.ok||!prodConf.dispatch_secret||internalSecret!==String(prodConf.dispatch_secret)){
        return json(origin,{ok:false,error:"Not authorized"},403);
      }

      const claimResp=await rest(supabaseUrl+"/rest/v1/rpc/notification_claim_outbox",{method:"POST",headers:serviceHeaders,body:JSON.stringify({p_limit:25})});
      if(!claimResp.r.ok)return json(origin,{ok:false,error:"Could not claim notification outbox"},500);
      const jobs=Array.isArray(claimResp.data)?claimResp.data:[];
      let acceptedTotal=0,retryTotal=0;

      for(const job of jobs){
        const finish=async(status:string,error:string|null=null,retrySeconds=60)=>{
          await fetch(supabaseUrl+"/rest/v1/rpc/notification_outbox_finish",{method:"POST",headers:serviceHeaders,body:JSON.stringify({p_outbox_id:job.outbox_id,p_status:status,p_error:error,p_retry_seconds:retrySeconds})});
          if(status!=="retry"){
            await fetch(supabaseUrl+`/rest/v1/notifications?id=eq.${encodeURIComponent(job.notification_id)}`,{method:"PATCH",headers:{...serviceHeaders,"Prefer":"return=minimal"},body:JSON.stringify({push_dispatched_at:new Date().toISOString()})});
          }
        };
        const record=async(subscriptionId:string|null,state:string,error:string|null=null)=>{
          await fetch(supabaseUrl+"/rest/v1/rpc/notification_delivery_record",{method:"POST",headers:serviceHeaders,body:JSON.stringify({p_notification_id:job.notification_id,p_outbox_id:job.outbox_id,p_subscription_id:subscriptionId,p_state:state,p_error_category:error})});
        };

        const allowedResp=await rest(supabaseUrl+"/rest/v1/rpc/notification_push_allowed",{method:"POST",headers:serviceHeaders,body:JSON.stringify({p_user:job.user_id,p_audience:job.audience,p_category:job.category})});
        if(!allowedResp.r.ok||allowedResp.data!==true){
          await record(null,"skipped","push_disabled");
          await finish("disabled");
          continue;
        }

        let subUrl=supabaseUrl+`/rest/v1/push_subscriptions?select=*&user_id=eq.${encodeURIComponent(job.user_id)}&audience=eq.${encodeURIComponent(job.audience)}&enabled=eq.true&revoked_at=is.null`;
        if(job.target_subscription_id)subUrl+=`&id=eq.${encodeURIComponent(job.target_subscription_id)}`;
        const subsResp=await rest(subUrl,{headers:serviceHeaders});
        const subs=Array.isArray(subsResp.data)?subsResp.data:[];
        if(!subs.length){
          await finish("no_subscriptions");
          continue;
        }

        let temporary=false,acceptedAny=false,permanentCount=0,eligibleCount=0;
        for(const sub of subs){
          const prior=await rest(supabaseUrl+"/rest/v1/rpc/notification_delivery_accepted",{method:"POST",headers:serviceHeaders,body:JSON.stringify({p_notification_id:job.notification_id,p_subscription_id:sub.id})});
          if(prior.r.ok&&prior.data===true)continue;
          eligibleCount++;
          const payload=content({...job,locale:sub.locale||"en"});
          try{
            await webpush.sendNotification(
              {endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth_key}},
              JSON.stringify({title:payload.title,body:payload.body,route:job.route||"/",tag:"zwm-"+job.notification_id,notification_id:job.notification_id}),
              {TTL:job.priority==="critical"?3600:86400,urgency:job.priority==="critical"?"high":"normal"}
            );
            acceptedAny=true;acceptedTotal++;
            await record(sub.id,"accepted");
            await fetch(supabaseUrl+`/rest/v1/push_subscriptions?id=eq.${encodeURIComponent(sub.id)}`,{method:"PATCH",headers:{...serviceHeaders,"Prefer":"return=minimal"},body:JSON.stringify({last_success_at:new Date().toISOString(),last_used_at:new Date().toISOString(),failure_count:0})});
          }catch(e:any){
            const status=Number(e?.statusCode||0),permanent=status===404||status===410;
            if(permanent){
              permanentCount++;
              await record(sub.id,"permanent_failure",status?`http_${status}`:"delivery_error");
              await fetch(supabaseUrl+`/rest/v1/push_subscriptions?id=eq.${encodeURIComponent(sub.id)}`,{method:"PATCH",headers:{...serviceHeaders,"Prefer":"return=minimal"},body:JSON.stringify({enabled:false,revoked_at:new Date().toISOString(),failure_count:Number(sub.failure_count||0)+1})});
            }else{
              temporary=true;
              await record(sub.id,"temporary_failure",status?`http_${status}`:"delivery_error");
              await fetch(supabaseUrl+`/rest/v1/push_subscriptions?id=eq.${encodeURIComponent(sub.id)}`,{method:"PATCH",headers:{...serviceHeaders,"Prefer":"return=minimal"},body:JSON.stringify({failure_count:Number(sub.failure_count||0)+1,last_used_at:new Date().toISOString()})});
            }
          }
        }

        if(temporary){
          const attempts=Number(job.attempts||1);
          if(attempts>=5)await finish("dead","delivery_retries_exhausted");
          else{
            retryTotal++;
            await finish("retry","temporary_delivery_failure",Math.min(3600,60*Math.pow(2,Math.max(0,attempts-1))));
          }
        }else if(acceptedAny||eligibleCount===0){
          await finish("sent");
        }else if(permanentCount===eligibleCount){
          await finish("dead","all_subscriptions_invalid");
        }else{
          await finish("sent");
        }
      }
      return json(origin,{ok:true,claimed:jobs.length,accepted:acceptedTotal,retry:retryTotal});
    }
  }

  if(action==="test"){
    const authorization=req.headers.get("authorization")||"";
    if(!authorization.toLowerCase().startsWith("bearer "))return json(origin,{ok:false,error:"Sign-in required"},401);
    const userResp=await rest(supabaseUrl+"/auth/v1/user",{headers:{"apikey":serviceRole,"Authorization":authorization}});
    if(!userResp.r.ok||!userResp.data?.id)return json(origin,{ok:false,error:"Session invalid"},401);
    const userId=userResp.data.id;
    const endpoint=String(body?.endpoint||"");
    const audience=String(body?.audience||"");
    if(audience!=="admin"&&audience!=="customer")return json(origin,{ok:false,error:"Invalid audience"},400);
    const subResp=await rest(supabaseUrl+`/rest/v1/push_subscriptions?select=*&user_id=eq.${encodeURIComponent(userId)}&audience=eq.${encodeURIComponent(audience)}&endpoint=eq.${encodeURIComponent(endpoint)}&enabled=eq.true&revoked_at=is.null&limit=1`,{headers:serviceHeaders});
    const sub=Array.isArray(subResp.data)?subResp.data[0]:null;
    if(!sub)return json(origin,{ok:false,error:"This device is not registered"},404);
    try{
      await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth_key}},JSON.stringify({title:"Zayt w Mouneh notifications are working ✅",body:"This is a test notification.",route:sub.audience==="customer"?"/account":"/admin",tag:"zwm-test"}),{TTL:60,urgency:"normal"});
      return json(origin,{ok:true});
    }catch(e:any){
      return json(origin,{ok:false,error:"Test notification could not be delivered",status:e?.statusCode||0},502);
    }
  }

  if(action!=="dispatch"||String(body?.dispatch_token||"")!==String(conf.dispatch_token||""))return json(origin,{ok:false,error:"Not authorized"},403);
  const notificationId=String(body?.notification_id||"");
  if(!/^[0-9a-f-]{36}$/i.test(notificationId))return json(origin,{ok:false,error:"Invalid notification"},400);

  const nResp=await rest(supabaseUrl+`/rest/v1/notifications?select=*&id=eq.${encodeURIComponent(notificationId)}&limit=1`,{headers:serviceHeaders});
  const n=Array.isArray(nResp.data)?nResp.data[0]:null;
  if(!n)return json(origin,{ok:false,error:"Notification not found"},404);

  const category=String(n.category||categoryFor(n.notification_type));
  const prefResp=await rest(supabaseUrl+`/rest/v1/notification_preferences?select=push_enabled&user_id=eq.${encodeURIComponent(n.user_id)}&category=eq.${encodeURIComponent(category)}&limit=1`,{headers:serviceHeaders});
  const pref=Array.isArray(prefResp.data)?prefResp.data[0]:null;
  if(pref&&pref.push_enabled===false){
    await fetch(supabaseUrl+"/rest/v1/rpc/notification_legacy_delivery_record",{method:"POST",headers:serviceHeaders,body:JSON.stringify({p_notification_id:n.id,p_subscription_id:null,p_state:"skipped_preference",p_error_category:null})});
    await fetch(supabaseUrl+`/rest/v1/notifications?id=eq.${encodeURIComponent(n.id)}`,{method:"PATCH",headers:{...serviceHeaders,"Prefer":"return=minimal"},body:JSON.stringify({push_dispatched_at:new Date().toISOString()})});
    return json(origin,{ok:true,skipped:"preference"});
  }

  const subsResp=await rest(supabaseUrl+`/rest/v1/push_subscriptions?select=*&user_id=eq.${encodeURIComponent(n.user_id)}&audience=eq.${encodeURIComponent(n.audience)}&enabled=eq.true&revoked_at=is.null`,{headers:serviceHeaders});
  const subs=Array.isArray(subsResp.data)?subsResp.data:[];
  if(!subs.length){
    await fetch(supabaseUrl+"/rest/v1/rpc/notification_legacy_delivery_record",{method:"POST",headers:serviceHeaders,body:JSON.stringify({p_notification_id:n.id,p_subscription_id:null,p_state:"no_subscription",p_error_category:null})});
    await fetch(supabaseUrl+`/rest/v1/notifications?id=eq.${encodeURIComponent(n.id)}`,{method:"PATCH",headers:{...serviceHeaders,"Prefer":"return=minimal"},body:JSON.stringify({push_dispatched_at:new Date().toISOString()})});
    return json(origin,{ok:true,devices:0});
  }

  let temporary=false,acceptedCount=0;
  for(const sub of subs){
    const payload=content({...n,locale:sub.locale||n.locale});
    const legacyAccepted=await rest(supabaseUrl+"/rest/v1/rpc/notification_legacy_delivery_accepted",{method:"POST",headers:serviceHeaders,body:JSON.stringify({p_notification_id:n.id,p_subscription_id:sub.id})});
    if(legacyAccepted.r.ok&&legacyAccepted.data===true)continue;
    try{
      await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth_key}},JSON.stringify({title:payload.title,body:payload.body,route:n.route||"/",tag:n.dedupe_key,notification_id:n.id}),{TTL:n.priority==="critical"?3600:86400,urgency:n.priority==="critical"?"high":"normal"});
      acceptedCount++;
      await fetch(supabaseUrl+"/rest/v1/rpc/notification_legacy_delivery_record",{method:"POST",headers:serviceHeaders,body:JSON.stringify({p_notification_id:n.id,p_subscription_id:sub.id,p_state:"accepted",p_error_category:null})});
      await fetch(supabaseUrl+`/rest/v1/push_subscriptions?id=eq.${encodeURIComponent(sub.id)}`,{method:"PATCH",headers:{...serviceHeaders,"Prefer":"return=minimal"},body:JSON.stringify({last_success_at:new Date().toISOString(),last_used_at:new Date().toISOString(),failure_count:0})});
    }catch(e:any){
      const status=Number(e?.statusCode||0);
      const permanent=status===404||status===410;
      if(!permanent)temporary=true;
      await fetch(supabaseUrl+"/rest/v1/rpc/notification_legacy_delivery_record",{method:"POST",headers:serviceHeaders,body:JSON.stringify({p_notification_id:n.id,p_subscription_id:sub.id,p_state:permanent?"permanent_failure":"temporary_failure",p_error_category:status?`http_${status}`:"delivery_error"})});
      if(permanent){
        await fetch(supabaseUrl+`/rest/v1/push_subscriptions?id=eq.${encodeURIComponent(sub.id)}`,{method:"PATCH",headers:{...serviceHeaders,"Prefer":"return=minimal"},body:JSON.stringify({enabled:false,revoked_at:new Date().toISOString(),failure_count:Number(sub.failure_count||0)+1})});
      }else{
        await fetch(supabaseUrl+`/rest/v1/push_subscriptions?id=eq.${encodeURIComponent(sub.id)}`,{method:"PATCH",headers:{...serviceHeaders,"Prefer":"return=minimal"},body:JSON.stringify({failure_count:Number(sub.failure_count||0)+1,last_used_at:new Date().toISOString()})});
      }
    }
  }
  if(!temporary){
    await fetch(supabaseUrl+`/rest/v1/notifications?id=eq.${encodeURIComponent(n.id)}`,{method:"PATCH",headers:{...serviceHeaders,"Prefer":"return=minimal"},body:JSON.stringify({push_dispatched_at:new Date().toISOString()})});
  }
  return json(origin,{ok:true,devices:subs.length,accepted:acceptedCount,pending_retry:temporary});
});
