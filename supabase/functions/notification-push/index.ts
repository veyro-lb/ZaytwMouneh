import webpush from "npm:web-push@3.6.7";

const ALLOWED_ORIGINS = new Set([
  "https://zaytwmouneh.veyro-202.workers.dev"
]);
const OWNER_CATEGORIES = new Set(["new_order","wholesale","payment_issue","customer_requests","inventory","reviews","routine"]);
const CUSTOMER_CATEGORIES = new Set(["order_updates","back_in_stock","mouneh_points","marketing"]);

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function cors(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : [...ALLOWED_ORIGINS][0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-zwm-dispatch-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}
function json(origin: string | null, body: unknown, status=200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {...cors(origin),"Content-Type":"application/json","Cache-Control":"no-store"}
  });
}
function serviceHeaders(extra: Record<string,string>={}) {
  return {
    "apikey": serviceRole,
    "Authorization": "Bearer "+serviceRole,
    "Content-Type": "application/json",
    ...extra
  };
}
async function rest(path: string, init: RequestInit={}) {
  const response = await fetch(supabaseUrl+"/rest/v1/"+path, {
    ...init,
    headers: {...serviceHeaders(),...((init.headers||{}) as Record<string,string>)}
  });
  const text = await response.text();
  let data: any = null;
  if (text) { try { data=JSON.parse(text); } catch { data=text; } }
  if (!response.ok) throw new Error(typeof data==="object" && data?.message ? data.message : "Database request failed");
  return data;
}
async function rpc(name: string, body: Record<string,unknown>={}) {
  return rest("rpc/"+name,{method:"POST",body:JSON.stringify(body)});
}
async function authUser(req: Request) {
  const authorization=req.headers.get("authorization")||"";
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  const response=await fetch(supabaseUrl+"/auth/v1/user",{
    headers:{"apikey":serviceRole,"Authorization":authorization}
  });
  if (!response.ok) return null;
  const user=await response.json().catch(()=>null);
  return user?.id ? user : null;
}
async function isAdmin(userId: string) {
  const rows=await rest("admin_users?select=user_id&user_id=eq."+encodeURIComponent(userId)+"&limit=1");
  return Array.isArray(rows)&&rows.length>0;
}
async function config() {
  const value=await rpc("notification_server_config",{});
  if (!value?.vapid_public || !value?.vapid_private || !value?.dispatch_secret || !value?.vapid_subject) {
    throw new Error("Notification server configuration is incomplete");
  }
  return value;
}
function safeEqual(a: string,b: string) {
  if (a.length!==b.length) return false;
  let diff=0;
  for(let i=0;i<a.length;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
function locale(value: unknown) {
  return value==="ar"||value==="fr" ? String(value) : "en";
}
function browserLabel(ua: string) {
  if (/Edg\//.test(ua)) return "Microsoft Edge";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/CriOS|Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "Browser";
}
function deviceLabel(ua: string) {
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android device";
  if (/Macintosh|Mac OS X/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux device";
  return "This device";
}
function validSubscription(input: any) {
  if (!input || typeof input.endpoint!=="string" || !input.keys) return false;
  if (input.endpoint.length<16 || input.endpoint.length>4096) return false;
  try { const u=new URL(input.endpoint); if (u.protocol!=="https:") return false; } catch { return false; }
  return typeof input.keys.p256dh==="string" && input.keys.p256dh.length>=20 &&
         typeof input.keys.auth==="string" && input.keys.auth.length>=8;
}
function money(value: unknown,currency="USD") {
  const n=Number(value||0);
  try { return new Intl.NumberFormat("en",{style:"currency",currency,maximumFractionDigits:2}).format(n); }
  catch { return "$"+n.toFixed(2); }
}
function statusLabel(status: string,lang: string) {
  const map:any={
    en:{confirmed:"confirmed",preparing:"being prepared",out_for_delivery:"out for delivery",delivered:"delivered",cancelled:"cancelled"},
    ar:{confirmed:"تم تأكيده",preparing:"قيد التحضير",out_for_delivery:"خرج للتوصيل",delivered:"تم تسليمه",cancelled:"أُلغي"},
    fr:{confirmed:"confirmée",preparing:"en préparation",out_for_delivery:"en cours de livraison",delivered:"livrée",cancelled:"annulée"}
  };
  return map[lang]?.[status]||status.replaceAll("_"," ");
}
function renderMessage(job:any,lang:string) {
  const a=job.body_args||{};
  const meta=job.metadata||{};
  const ref=String(a.reference||meta.reference||job.entity_id||"").slice(0,80);
  const templates:any={
    en:{
      admin_new_order_title:"New order received 🛒",
      admin_wholesale_title:"New wholesale inquiry 📦",
      admin_payment_failed_title:"Payment issue needs attention ⚠️",
      admin_test_title:"Zayt w Mouneh notifications are working ✅",
      customer_order_received_title:"Order received ✅",
      customer_order_confirmed_title:"Order confirmed ✅",
      customer_order_preparing_title:"Your order is being prepared 🫙",
      customer_order_out_for_delivery_title:"Your order is out for delivery 🚚",
      customer_order_delivered_title:"Order delivered ✅",
      customer_order_cancelled_title:"Order cancelled",
      customer_order_status_body:"Your Zayt w Mouneh order {reference} is {status}.",
      customer_order_received_body:"We received your Zayt w Mouneh order {reference}.",
      admin_test_body:"This is a test notification."
    },
    ar:{
      admin_new_order_title:"طلب جديد 🛒",
      admin_wholesale_title:"استفسار جملة جديد 📦",
      admin_payment_failed_title:"مشكلة دفع تحتاج إلى انتباه ⚠️",
      admin_test_title:"إشعارات زيت ومونة تعمل ✅",
      customer_order_received_title:"تم استلام الطلب ✅",
      customer_order_confirmed_title:"تم تأكيد الطلب ✅",
      customer_order_preparing_title:"طلبك قيد التحضير 🫙",
      customer_order_out_for_delivery_title:"طلبك خرج للتوصيل 🚚",
      customer_order_delivered_title:"تم تسليم الطلب ✅",
      customer_order_cancelled_title:"تم إلغاء الطلب",
      customer_order_status_body:"طلب زيت ومونة {reference} {status}.",
      customer_order_received_body:"استلمنا طلب زيت ومونة {reference}.",
      admin_test_body:"هذا إشعار تجريبي."
    },
    fr:{
      admin_new_order_title:"Nouvelle commande 🛒",
      admin_wholesale_title:"Nouvelle demande de gros 📦",
      admin_payment_failed_title:"Problème de paiement à vérifier ⚠️",
      admin_test_title:"Les notifications Zayt w Mouneh fonctionnent ✅",
      customer_order_received_title:"Commande reçue ✅",
      customer_order_confirmed_title:"Commande confirmée ✅",
      customer_order_preparing_title:"Votre commande est en préparation 🫙",
      customer_order_out_for_delivery_title:"Votre commande est en livraison 🚚",
      customer_order_delivered_title:"Commande livrée ✅",
      customer_order_cancelled_title:"Commande annulée",
      customer_order_status_body:"Votre commande Zayt w Mouneh {reference} est {status}.",
      customer_order_received_body:"Nous avons reçu votre commande Zayt w Mouneh {reference}.",
      admin_test_body:"Ceci est une notification de test."
    }
  };
  const t=templates[lang]||templates.en;
  let title=t[job.title_key]||(
    job.notification_type==="WHOLESALE_INQUIRY_CREATED"?t.admin_wholesale_title:
    job.notification_type==="PAYMENT_FAILED"?t.admin_payment_failed_title:
    job.notification_type==="ORDER_CREATED"&&job.audience==="admin"?t.admin_new_order_title:
    job.notification_type==="TEST_PUSH"?t.admin_test_title:
    "Zayt w Mouneh"
  );
  let body="";
  if(job.notification_type==="ORDER_CREATED"&&job.audience==="admin"){
    body=(lang==="ar"?"الطلب {reference} · {total}":lang==="fr"?"Commande {reference} · {total}":"Order {reference} · {total}")
      .replace("{reference}",ref).replace("{total}",money(a.total||meta.total,a.currency||meta.currency||"USD"));
  }else if(job.notification_type==="WHOLESALE_INQUIRY_CREATED"){
    body=lang==="ar"?"تم استلام استفسار جديد من مطعم أو شركة.":lang==="fr"?"Une nouvelle demande professionnelle a été reçue.":"Restaurant / business inquiry received.";
  }else if(job.notification_type==="PAYMENT_FAILED"){
    body=(lang==="ar"?"راجع حالة الدفع للطلب {reference}.":lang==="fr"?"Vérifiez le paiement de la commande {reference}.":"Check payment status for order {reference}.").replace("{reference}",ref);
  }else if(job.notification_type==="TEST_PUSH"){
    body=t.admin_test_body;
  }else if(job.notification_type==="ORDER_CREATED"&&job.audience==="customer"){
    body=t.customer_order_received_body.replace("{reference}",ref);
  }else if(job.notification_type==="ORDER_STATUS_CHANGED"){
    body=t.customer_order_status_body.replace("{reference}",ref).replace("{status}",statusLabel(String(a.status||meta.status||""),lang));
  }else{
    body="Zayt w Mouneh";
  }
  return {title,body};
}
function safeRoute(route: unknown) {
  const value=String(route||"/");
  if (!value.startsWith("/") || value.startsWith("//") || /[\r\n]/.test(value)) return "/";
  return value.slice(0,500);
}
async function alreadyAccepted(notificationId:string,subscriptionId:string) {
  return !!(await rpc("notification_delivery_accepted",{p_notification_id:notificationId,p_subscription_id:subscriptionId}));
}
async function recordDelivery(job:any,subId:string|null,state:string,error:string|null=null) {
  await rpc("notification_delivery_record",{
    p_notification_id:job.notification_id,
    p_outbox_id:job.outbox_id,
    p_subscription_id:subId,
    p_state:state,
    p_error_category:error
  });
}
async function finish(job:any,status:string,error:string|null=null,retrySeconds=60) {
  await rpc("notification_outbox_finish",{
    p_outbox_id:job.outbox_id,
    p_status:status,
    p_error:error,
    p_retry_seconds:retrySeconds
  });
}
async function deliver(job:any,cfg:any) {
  const allowed=await rpc("notification_push_allowed",{
    p_user:job.user_id,p_audience:job.audience,p_category:job.category
  });
  if(!allowed){await finish(job,"disabled");return;}

  let query="push_subscriptions?select=id,endpoint,p256dh,auth_key,locale,failure_count"+
    "&user_id=eq."+encodeURIComponent(job.user_id)+
    "&audience=eq."+encodeURIComponent(job.audience)+
    "&enabled=eq.true&revoked_at=is.null";
  if(job.target_subscription_id)query+="&id=eq."+encodeURIComponent(job.target_subscription_id);
  const subscriptions=await rest(query);
  if(!Array.isArray(subscriptions)||!subscriptions.length){await finish(job,"no_subscriptions");return;}

  let accepted=0,temporary=0,permanent=0;
  for(const sub of subscriptions){
    if(await alreadyAccepted(job.notification_id,sub.id)){accepted++;continue;}
    const msg=renderMessage(job,locale(sub.locale));
    const payload=JSON.stringify({
      title:msg.title,
      body:msg.body,
      icon:"/assets/favicon.svg",
      badge:"/assets/favicon.svg",
      tag:"zwm:"+job.notification_type+":"+job.entity_id,
      data:{url:safeRoute(job.route),notificationId:job.notification_id},
      requireInteraction:job.audience==="admin"&&job.priority==="critical"
    });
    try{
      await webpush.sendNotification(
        {endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth_key}},
        payload,
        {TTL:86400,urgency:job.priority==="critical"?"high":job.priority==="informational"?"low":"normal"}
      );
      accepted++;
      await recordDelivery(job,sub.id,"accepted",null);
      await rest("push_subscriptions?id=eq."+encodeURIComponent(sub.id),{
        method:"PATCH",
        headers:{"Prefer":"return=minimal"},
        body:JSON.stringify({last_success_at:new Date().toISOString(),last_used_at:new Date().toISOString(),failure_count:0,updated_at:new Date().toISOString()})
      });
    }catch(error:any){
      const status=Number(error?.statusCode||error?.status||0);
      const permanentFailure=status===404||status===410;
      if(permanentFailure){
        permanent++;
        await recordDelivery(job,sub.id,"permanent_failure","endpoint_invalid");
        await rest("push_subscriptions?id=eq."+encodeURIComponent(sub.id),{
          method:"PATCH",
          headers:{"Prefer":"return=minimal"},
          body:JSON.stringify({enabled:false,revoked_at:new Date().toISOString(),failure_count:Number(sub.failure_count||0)+1,updated_at:new Date().toISOString()})
        });
      }else{
        temporary++;
        await recordDelivery(job,sub.id,"temporary_failure",status?"http_"+status:"push_error");
        await rest("push_subscriptions?id=eq."+encodeURIComponent(sub.id),{
          method:"PATCH",
          headers:{"Prefer":"return=minimal"},
          body:JSON.stringify({failure_count:Number(sub.failure_count||0)+1,updated_at:new Date().toISOString()})
        });
      }
    }
  }
  if(temporary>0){
    if(Number(job.attempts)>=5)await finish(job,"dead","Push retry limit reached");
    else await finish(job,"retry","Temporary push delivery failure",Math.min(3600,30*Math.pow(2,Math.min(Number(job.attempts)||1,6))));
  }else if(accepted>0){
    await finish(job,"sent",permanent?String(permanent)+" expired endpoint(s) removed":null);
  }else{
    await finish(job,"dead",permanent?"All push endpoints expired":"No deliverable push subscription");
  }
}
async function dispatch(req:Request,origin:string|null,body:any) {
  const cfg=await config();
  const supplied=req.headers.get("x-zwm-dispatch-secret")||"";
  if(!safeEqual(supplied,String(cfg.dispatch_secret||"")))return json(origin,{ok:false,error:"Forbidden"},403);
  webpush.setVapidDetails(String(cfg.vapid_subject),String(cfg.vapid_public),String(cfg.vapid_private));
  const jobs=await rpc("notification_claim_outbox",{p_limit:25});
  const list=Array.isArray(jobs)?jobs:[];
  for(const job of list){
    try{await deliver(job,cfg)}
    catch(error:any){
      try{
        if(Number(job.attempts)>=5)await finish(job,"dead",String(error?.message||"Push dispatch failed"));
        else await finish(job,"retry",String(error?.message||"Push dispatch failed"),60);
      }catch{}
    }
  }
  return json(origin,{ok:true,processed:list.length});
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return json(origin,{ok:false,error:"Method not allowed"},405);
  if(origin&&!ALLOWED_ORIGINS.has(origin))return json(origin,{ok:false,error:"Origin not allowed"},403);
  if(!supabaseUrl||!serviceRole)return json(origin,{ok:false,error:"Server configuration unavailable"},500);

  const body=await req.json().catch(()=>({}));
  const action=String(body?.action||"");
  if(action==="dispatch")return dispatch(req,origin,body);

  const user=await authUser(req);
  if(!user)return json(origin,{ok:false,error:"Sign-in required"},401);
  const requestedAudience=body?.audience==="admin"?"admin":"customer";
  if(requestedAudience==="admin"&&!await isAdmin(user.id))return json(origin,{ok:false,error:"Owner access required"},403);

  if(action==="public_key"){
    const cfg=await config();
    return json(origin,{ok:true,publicKey:cfg.vapid_public});
  }

  if(action==="subscribe"){
    const sub=body?.subscription;
    if(!validSubscription(sub))return json(origin,{ok:false,error:"Invalid push subscription"},400);
    const ua=req.headers.get("user-agent")||"";
    const now=new Date().toISOString();
    const payload={
      user_id:user.id,audience:requestedAudience,endpoint:sub.endpoint,
      p256dh:sub.keys.p256dh,auth_key:sub.keys.auth,
      device_label:String(body?.deviceLabel||deviceLabel(ua)).slice(0,100),
      browser_label:String(body?.browserLabel||browserLabel(ua)).slice(0,100),
      locale:locale(body?.locale),enabled:true,revoked_at:null,
      last_used_at:now,updated_at:now
    };
    const rows=await rest("push_subscriptions?on_conflict=endpoint,audience",{
      method:"POST",
      headers:{"Prefer":"resolution=merge-duplicates,return=representation"},
      body:JSON.stringify(payload)
    });
    const row=Array.isArray(rows)?rows[0]:null;
    return json(origin,{ok:true,device:row?{id:row.id,device_label:row.device_label,browser_label:row.browser_label,locale:row.locale,enabled:row.enabled,last_success_at:row.last_success_at}:null});
  }

  if(action==="unsubscribe"){
    const endpoint=String(body?.endpoint||"");
    if(!endpoint)return json(origin,{ok:false,error:"Subscription endpoint required"},400);
    await rest("push_subscriptions?user_id=eq."+encodeURIComponent(user.id)+"&audience=eq."+requestedAudience+"&endpoint=eq."+encodeURIComponent(endpoint),{
      method:"PATCH",
      headers:{"Prefer":"return=minimal"},
      body:JSON.stringify({enabled:false,revoked_at:new Date().toISOString(),updated_at:new Date().toISOString()})
    });
    return json(origin,{ok:true});
  }

  if(action==="devices"){
    const rows=await rest(
      "push_subscriptions?select=id,device_label,browser_label,locale,enabled,created_at,last_used_at,last_success_at,revoked_at"+
      "&user_id=eq."+encodeURIComponent(user.id)+"&audience=eq."+requestedAudience+
      "&order=updated_at.desc&limit=30"
    );
    return json(origin,{ok:true,devices:Array.isArray(rows)?rows:[]});
  }

  if(action==="remove_device"){
    const id=String(body?.id||"");
    if(!/^[0-9a-f-]{36}$/i.test(id))return json(origin,{ok:false,error:"Invalid device"},400);
    await rest("push_subscriptions?id=eq."+encodeURIComponent(id)+"&user_id=eq."+encodeURIComponent(user.id)+"&audience=eq."+requestedAudience,{
      method:"PATCH",
      headers:{"Prefer":"return=minimal"},
      body:JSON.stringify({enabled:false,revoked_at:new Date().toISOString(),updated_at:new Date().toISOString()})
    });
    return json(origin,{ok:true});
  }

  if(action==="get_preferences"){
    const rows=await rest("notification_preferences?select=category,in_app_enabled,push_enabled,updated_at&user_id=eq."+encodeURIComponent(user.id));
    return json(origin,{ok:true,preferences:Array.isArray(rows)?rows:[]});
  }

  if(action==="set_preference"){
    const category=String(body?.category||"");
    const allowed=requestedAudience==="admin"?OWNER_CATEGORIES:CUSTOMER_CATEGORIES;
    if(!allowed.has(category))return json(origin,{ok:false,error:"Unsupported notification category"},400);
    const payload={
      user_id:user.id,category,
      in_app_enabled:body?.in_app_enabled!==false,
      push_enabled:body?.push_enabled===true,
      updated_at:new Date().toISOString()
    };
    await rest("notification_preferences?on_conflict=user_id,category",{
      method:"POST",
      headers:{"Prefer":"resolution=merge-duplicates,return=minimal"},
      body:JSON.stringify(payload)
    });
    return json(origin,{ok:true});
  }

  if(action==="test"){
    if(requestedAudience!=="admin"||!await isAdmin(user.id))return json(origin,{ok:false,error:"Owner access required"},403);
    const subscriptionId=String(body?.subscription_id||"");
    if(!/^[0-9a-f-]{36}$/i.test(subscriptionId))return json(origin,{ok:false,error:"Enable notifications on this device first"},400);
    const cutoff=new Date(Date.now()-30000).toISOString();
    const recent=await rest("notifications?select=id&user_id=eq."+encodeURIComponent(user.id)+"&notification_type=eq.TEST_PUSH&created_at=gte."+encodeURIComponent(cutoff)+"&limit=1");
    if(Array.isArray(recent)&&recent.length)return json(origin,{ok:false,error:"Please wait before sending another test"},429);
    const id=await rpc("notification_create_test",{p_user:user.id,p_subscription_id:subscriptionId});
    return json(origin,{ok:true,notification_id:id});
  }

  return json(origin,{ok:false,error:"Unknown notification action"},400);
});
