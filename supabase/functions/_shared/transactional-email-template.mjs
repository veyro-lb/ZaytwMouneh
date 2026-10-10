const SITE_ORIGIN="https://zaytwmouneh.com";
const LOGO_URL="https://zaytwmouneh.com/assets/email-logo.jpg";

export function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,(char)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[char]));
}

function localeOf(value){
  const locale=String(value||"").toLowerCase();
  return locale==="ar"||locale==="fr"?locale:"en";
}

function safeRoute(value,fallback="/account"){
  try{
    const url=new URL(String(value||fallback),SITE_ORIGIN);
    if(url.origin!==SITE_ORIGIN)return fallback;
    return url.pathname+url.search+url.hash;
  }catch{
    return fallback;
  }
}

function money(value,currency="USD",locale="en"){
  const amount=Number(value);
  if(!Number.isFinite(amount))return "";
  try{
    return new Intl.NumberFormat(locale==="ar"?"ar-LB":locale==="fr"?"fr-LB":"en-LB",{
      style:"currency",currency:String(currency||"USD").toUpperCase(),maximumFractionDigits:2
    }).format(amount);
  }catch{
    return "$"+amount.toFixed(2);
  }
}

const ORDER_STATUS={
  en:{new:"Order received",confirmed:"Confirmed",preparing:"Preparing",out_for_delivery:"Out for delivery",delivered:"Delivered",cancelled:"Cancelled"},
  ar:{new:"تم استلام الطلب",confirmed:"تم التأكيد",preparing:"قيد التحضير",out_for_delivery:"خرج للتوصيل",delivered:"تم التسليم",cancelled:"ملغي"},
  fr:{new:"Commande reçue",confirmed:"Confirmée",preparing:"En préparation",out_for_delivery:"En livraison",delivered:"Livrée",cancelled:"Annulée"}
};

const COPY={
  en:{
    brand:"Lebanese pantry · المونة اللبنانية",
    reference:"Order reference",status:"Status",total:"Order total",delivery:"Delivery area",
    items:"Your order",qty:"Qty",variant:"Variant",viewOrder:"View your order",contact:"Contact us",
    wholesaleRef:"Request reference",business:"Business",viewWholesale:"View wholesale request",
    footer:"Operational update from Zayt W Mouneh. This is not a marketing email.",
    orderReceived:{subject:r=>"We received your Zayt W Mouneh order "+r,eyebrow:"Order received",heading:"Thank you — we received your order",intro:"Your order is safely in our system. We’ll review it and begin preparing it shortly.",notice:"If anything in the order needs clarification, we’ll contact you before it continues."},
    orderConfirmed:{subject:r=>"Your Zayt W Mouneh order "+r+" is confirmed",eyebrow:"Order confirmed",heading:"Your order is confirmed",intro:"Everything is confirmed and your order is moving forward."},
    orderPreparing:{subject:r=>"We're preparing your Zayt W Mouneh order "+r,eyebrow:"Preparing",heading:"We’re preparing your order",intro:"Your Zayt W Mouneh order is now being prepared with care."},
    orderOut:{subject:r=>"Your Zayt W Mouneh order "+r+" is on the way",eyebrow:"Out for delivery",heading:"Your order is on the way",intro:"Your order has left for delivery."},
    orderDelivered:{subject:r=>"Your Zayt W Mouneh order "+r+" has been delivered",eyebrow:"Delivered",heading:"Your order has been delivered",intro:"We hope your pantry order arrived safely. Thank you for choosing Zayt W Mouneh."},
    orderCancelled:{subject:r=>"Update about your Zayt W Mouneh order "+r,eyebrow:"Order update",heading:"Your order was cancelled",intro:"This order has been cancelled.",notice:"If you need help or this was unexpected, contact us and mention your order reference."},
    itemAttention:{subject:r=>"An item in your Zayt W Mouneh order "+r+" needs attention",eyebrow:"Action needed",heading:"An item in your order needs attention",intro:"One or more items in your Zayt W Mouneh order are currently unavailable. We’ll contact you shortly to arrange the best option before your order continues.",item:"Item"},
    wholesaleReceived:{subject:"We received your Zayt W Mouneh wholesale request",eyebrow:"Wholesale request received",heading:"Thank you — we received your wholesale request",intro:"Your request is in our system and we’ll review the details shortly."},
    wholesaleContacted:{subject:"An update on your Zayt W Mouneh wholesale request",eyebrow:"Wholesale follow-up",heading:"We’ve started following up on your request",intro:"Our team has started reviewing and following up on your wholesale request."},
    wholesaleNeedsInfo:{subject:"We need a little more information about your wholesale request",eyebrow:"Information needed",heading:"We need a little more information",intro:"To continue with your wholesale request, we need a few additional details. Please open your request or contact us so we can keep things moving."},
    wholesaleQuotePreparing:{subject:"Your Zayt W Mouneh wholesale quote is being prepared",eyebrow:"Quote in preparation",heading:"We’re preparing your wholesale quote",intro:"We’re working through your request and preparing the next wholesale update."},
    wholesaleQuoteSent:{subject:"Your Zayt W Mouneh wholesale update is ready",eyebrow:"Wholesale update ready",heading:"Your wholesale update is ready",intro:"Your quotation or wholesale update is ready. Open your request to review the latest status."},
    wholesaleNegotiating:{subject:"An update on your Zayt W Mouneh wholesale request",eyebrow:"In discussion",heading:"Your wholesale request is in discussion",intro:"We’re continuing the conversation around your wholesale request and its details."},
    wholesaleApproved:{subject:"Your Zayt W Mouneh wholesale request has been approved",eyebrow:"Approved",heading:"Your wholesale request is approved",intro:"Your request has been approved. We’ll continue with the next practical steps with you."},
    wholesaleCompleted:{subject:"Your Zayt W Mouneh wholesale request is complete",eyebrow:"Completed",heading:"Your wholesale request is complete",intro:"This wholesale request has reached its completed stage. Thank you for working with Zayt W Mouneh."}
  },
  ar:{
    brand:"المونة اللبنانية · Lebanese pantry",
    reference:"مرجع الطلب",status:"الحالة",total:"إجمالي الطلب",delivery:"منطقة التوصيل",
    items:"طلبك",qty:"الكمية",variant:"الخيار",viewOrder:"عرض طلبك",contact:"تواصل معنا",
    wholesaleRef:"مرجع طلب الجملة",business:"النشاط التجاري",viewWholesale:"عرض طلب الجملة",
    footer:"تحديث تشغيلي من زيت ومونة. هذه ليست رسالة تسويقية.",
    orderReceived:{subject:r=>"استلمنا طلبك من زيت ومونة "+r,eyebrow:"تم استلام الطلب",heading:"شكراً — تم استلام طلبك",intro:"تم تسجيل طلبك بأمان وسنراجعه ونبدأ بتحضيره قريباً.",notice:"إذا احتجنا إلى توضيح أي تفصيل في الطلب فسنتواصل معك قبل المتابعة."},
    orderConfirmed:{subject:r=>"تم تأكيد طلبك من زيت ومونة "+r,eyebrow:"تم التأكيد",heading:"تم تأكيد طلبك",intro:"تم تأكيد تفاصيل الطلب وهو الآن ينتقل إلى المرحلة التالية."},
    orderPreparing:{subject:r=>"نحضّر طلبك من زيت ومونة "+r,eyebrow:"قيد التحضير",heading:"نحضّر طلبك الآن",intro:"طلبك من زيت ومونة قيد التحضير بعناية."},
    orderOut:{subject:r=>"طلبك من زيت ومونة "+r+" في طريقه إليك",eyebrow:"خرج للتوصيل",heading:"طلبك في طريقه إليك",intro:"غادر طلبك للتوصيل."},
    orderDelivered:{subject:r=>"تم تسليم طلبك من زيت ومونة "+r,eyebrow:"تم التسليم",heading:"تم تسليم طلبك",intro:"نتمنى أن يكون طلب المونة قد وصلك بأمان. شكراً لاختيارك زيت ومونة."},
    orderCancelled:{subject:r=>"تحديث بخصوص طلبك من زيت ومونة "+r,eyebrow:"تحديث الطلب",heading:"تم إلغاء الطلب",intro:"تم إلغاء هذا الطلب.",notice:"إذا كنت بحاجة إلى مساعدة أو لم تكن تتوقع الإلغاء، تواصل معنا واذكر مرجع الطلب."},
    itemAttention:{subject:r=>"هناك صنف في طلبك من زيت ومونة "+r+" يحتاج إلى متابعة",eyebrow:"بحاجة إلى متابعة",heading:"هناك صنف في طلبك يحتاج إلى متابعة",intro:"هناك صنف أو أكثر في طلبك من زيت ومونة غير متوفر حالياً. سنتواصل معك قريباً لترتيب أفضل خيار قبل متابعة الطلب.",item:"الصنف"},
    wholesaleReceived:{subject:"استلمنا طلب الجملة من زيت ومونة",eyebrow:"تم استلام طلب الجملة",heading:"شكراً — تم استلام طلب الجملة",intro:"تم تسجيل طلبك وسنراجع التفاصيل قريباً."},
    wholesaleContacted:{subject:"تحديث بخصوص طلب الجملة من زيت ومونة",eyebrow:"متابعة طلب الجملة",heading:"بدأنا متابعة طلبك",intro:"بدأ فريقنا مراجعة ومتابعة طلب الجملة."},
    wholesaleNeedsInfo:{subject:"نحتاج إلى بعض المعلومات الإضافية عن طلب الجملة",eyebrow:"معلومات مطلوبة",heading:"نحتاج إلى بعض المعلومات الإضافية",intro:"لمتابعة طلب الجملة نحتاج إلى بعض التفاصيل الإضافية. افتح طلبك أو تواصل معنا لنكمل المتابعة."},
    wholesaleQuotePreparing:{subject:"يجري تحضير عرض الجملة من زيت ومونة",eyebrow:"تحضير العرض",heading:"نحضّر عرض الجملة",intro:"نعمل على طلبك ونحضّر التحديث التالي."},
    wholesaleQuoteSent:{subject:"تحديث طلب الجملة من زيت ومونة جاهز",eyebrow:"التحديث جاهز",heading:"تحديث طلب الجملة جاهز",intro:"عرض السعر أو تحديث طلب الجملة جاهز. افتح طلبك للاطلاع على آخر حالة."},
    wholesaleNegotiating:{subject:"تحديث بخصوص طلب الجملة من زيت ومونة",eyebrow:"قيد المناقشة",heading:"طلب الجملة قيد المناقشة",intro:"نواصل مناقشة تفاصيل طلب الجملة معك."},
    wholesaleApproved:{subject:"تمت الموافقة على طلب الجملة من زيت ومونة",eyebrow:"تمت الموافقة",heading:"تمت الموافقة على طلب الجملة",intro:"تمت الموافقة على طلبك وسنتابع معك الخطوات العملية التالية."},
    wholesaleCompleted:{subject:"اكتمل طلب الجملة من زيت ومونة",eyebrow:"مكتمل",heading:"اكتمل طلب الجملة",intro:"وصل طلب الجملة إلى مرحلة الاكتمال. شكراً لتعاملك مع زيت ومونة."}
  },
  fr:{
    brand:"Épicerie libanaise · المونة اللبنانية",
    reference:"Référence",status:"Statut",total:"Total",delivery:"Zone de livraison",
    items:"Votre commande",qty:"Qté",variant:"Variante",viewOrder:"Voir votre commande",contact:"Nous contacter",
    wholesaleRef:"Référence de la demande",business:"Entreprise",viewWholesale:"Voir la demande",
    footer:"Mise à jour opérationnelle de Zayt W Mouneh. Ceci n’est pas un e-mail marketing.",
    orderReceived:{subject:r=>"Nous avons reçu votre commande Zayt W Mouneh "+r,eyebrow:"Commande reçue",heading:"Merci — votre commande est bien reçue",intro:"Votre commande est enregistrée. Nous allons la vérifier puis commencer sa préparation.",notice:"Si un détail doit être clarifié, nous vous contacterons avant de poursuivre."},
    orderConfirmed:{subject:r=>"Votre commande Zayt W Mouneh "+r+" est confirmée",eyebrow:"Commande confirmée",heading:"Votre commande est confirmée",intro:"Tout est confirmé et votre commande avance."},
    orderPreparing:{subject:r=>"Nous préparons votre commande Zayt W Mouneh "+r,eyebrow:"En préparation",heading:"Nous préparons votre commande",intro:"Votre commande Zayt W Mouneh est maintenant préparée avec soin."},
    orderOut:{subject:r=>"Votre commande Zayt W Mouneh "+r+" est en route",eyebrow:"En livraison",heading:"Votre commande est en route",intro:"Votre commande est partie en livraison."},
    orderDelivered:{subject:r=>"Votre commande Zayt W Mouneh "+r+" a été livrée",eyebrow:"Livrée",heading:"Votre commande a été livrée",intro:"Nous espérons que votre commande est bien arrivée. Merci d’avoir choisi Zayt W Mouneh."},
    orderCancelled:{subject:r=>"Mise à jour concernant votre commande Zayt W Mouneh "+r,eyebrow:"Mise à jour",heading:"Votre commande a été annulée",intro:"Cette commande a été annulée.",notice:"Si vous avez besoin d’aide ou si cette annulation est inattendue, contactez-nous en indiquant la référence."},
    itemAttention:{subject:r=>"Un article de votre commande Zayt W Mouneh "+r+" nécessite votre attention",eyebrow:"Attention requise",heading:"Un article de votre commande nécessite votre attention",intro:"Un ou plusieurs articles de votre commande sont actuellement indisponibles. Nous vous contacterons rapidement afin de convenir de la meilleure option avant de poursuivre.",item:"Article"},
    wholesaleReceived:{subject:"Nous avons reçu votre demande de gros Zayt W Mouneh",eyebrow:"Demande reçue",heading:"Merci — votre demande de gros est bien reçue",intro:"Votre demande est enregistrée et nous examinerons les détails prochainement."},
    wholesaleContacted:{subject:"Mise à jour de votre demande de gros Zayt W Mouneh",eyebrow:"Suivi",heading:"Nous avons commencé le suivi",intro:"Notre équipe a commencé à examiner et suivre votre demande de gros."},
    wholesaleNeedsInfo:{subject:"Il nous faut quelques informations sur votre demande de gros",eyebrow:"Informations requises",heading:"Il nous faut quelques informations supplémentaires",intro:"Pour poursuivre votre demande de gros, nous avons besoin de quelques précisions. Ouvrez votre demande ou contactez-nous."},
    wholesaleQuotePreparing:{subject:"Votre devis de gros Zayt W Mouneh est en préparation",eyebrow:"Devis en préparation",heading:"Nous préparons votre devis",intro:"Nous travaillons sur votre demande et préparons la prochaine mise à jour."},
    wholesaleQuoteSent:{subject:"Votre mise à jour de gros Zayt W Mouneh est prête",eyebrow:"Mise à jour prête",heading:"Votre mise à jour de gros est prête",intro:"Votre devis ou mise à jour est prêt. Ouvrez votre demande pour consulter le dernier statut."},
    wholesaleNegotiating:{subject:"Mise à jour de votre demande de gros Zayt W Mouneh",eyebrow:"En discussion",heading:"Votre demande est en discussion",intro:"Nous poursuivons la discussion concernant les détails de votre demande."},
    wholesaleApproved:{subject:"Votre demande de gros Zayt W Mouneh a été approuvée",eyebrow:"Approuvée",heading:"Votre demande de gros est approuvée",intro:"Votre demande a été approuvée. Nous poursuivrons avec vous les prochaines étapes pratiques."},
    wholesaleCompleted:{subject:"Votre demande de gros Zayt W Mouneh est terminée",eyebrow:"Terminée",heading:"Votre demande de gros est terminée",intro:"Cette demande de gros est arrivée à son terme. Merci de travailler avec Zayt W Mouneh."}
  }
};


const RETURN_COPY={
  en:{
    RETURN_REQUEST_RECEIVED:{subject:r=>"We received your return / product issue request "+r,eyebrow:"Request received",heading:"We received your request",intro:"Your request is safely in our system and will be reviewed by our team.",notice:"Submitting a request does not automatically guarantee a refund or exchange."},
    RETURN_INFORMATION_NEEDED:{subject:r=>"We need more information for request "+r,eyebrow:"Information needed",heading:"We need a little more information",intro:"Please open your request and send the requested details so we can continue the review."},
    RETURN_REPLY_RECEIVED:{subject:r=>"New reply on request "+r,eyebrow:"New reply",heading:"We replied to your request",intro:"There is a new message from Zayt W Mouneh about your return or product-issue request."},
    RETURN_AUTHORIZED:{subject:r=>"Return authorized for request "+r,eyebrow:"Return authorized",heading:"Your return has been authorized",intro:"Please review the instructions in your request before sending or bringing back the product."},
    RETURN_RESOLUTION_APPROVED:{subject:r=>"Resolution approved for request "+r,eyebrow:"Resolution approved",heading:"We approved a resolution",intro:"Your request has been reviewed and a resolution has been approved."},
    RETURN_REJECTED:{subject:r=>"Update on request "+r,eyebrow:"Request reviewed",heading:"Your request has been reviewed",intro:"We completed our review and could not approve the requested resolution based on the available information."},
    RETURN_REFUND_PENDING:{subject:r=>"Refund approved for request "+r,eyebrow:"Refund approved",heading:"Your refund is pending processing",intro:"The refund has been approved and is awaiting the recorded payment step."},
    RETURN_REFUND_COMPLETED:{subject:r=>"Refund processed for request "+r,eyebrow:"Refund processed",heading:"Your refund has been processed",intro:"The approved refund has been recorded as processed."},
    RETURN_COMPLETED:{subject:r=>"Request "+r+" is complete",eyebrow:"Request complete",heading:"Your request is complete",intro:"This return or product-issue request has reached its completed stage."}
  },
  ar:{
    RETURN_REQUEST_RECEIVED:{subject:r=>"استلمنا طلب الإرجاع أو مشكلة المنتج "+r,eyebrow:"تم استلام الطلب",heading:"استلمنا طلبك",intro:"تم تسجيل طلبك بأمان وسيقوم فريقنا بمراجعته.",notice:"إرسال الطلب لا يعني الموافقة التلقائية على الاسترداد أو الاستبدال."},
    RETURN_INFORMATION_NEEDED:{subject:r=>"نحتاج معلومات إضافية للطلب "+r,eyebrow:"معلومات مطلوبة",heading:"نحتاج إلى بعض المعلومات الإضافية",intro:"يرجى فتح الطلب وإرسال التفاصيل المطلوبة حتى نتمكن من متابعة المراجعة."},
    RETURN_REPLY_RECEIVED:{subject:r=>"رد جديد بخصوص الطلب "+r,eyebrow:"رد جديد",heading:"أرسلنا لك رداً جديداً",intro:"هناك رسالة جديدة من زيت ومونة بخصوص طلب الإرجاع أو مشكلة المنتج."},
    RETURN_AUTHORIZED:{subject:r=>"تمت الموافقة على إرجاع الطلب "+r,eyebrow:"تمت الموافقة على الإرجاع",heading:"تمت الموافقة على الإرجاع",intro:"يرجى مراجعة التعليمات داخل طلبك قبل إعادة المنتج."},
    RETURN_RESOLUTION_APPROVED:{subject:r=>"تمت الموافقة على حل للطلب "+r,eyebrow:"تمت الموافقة على الحل",heading:"وافقنا على حل لطلبك",intro:"تمت مراجعة طلبك والموافقة على الحل المناسب."},
    RETURN_REJECTED:{subject:r=>"تحديث بخصوص الطلب "+r,eyebrow:"تمت مراجعة الطلب",heading:"اكتملت مراجعة طلبك",intro:"بعد المراجعة لم نتمكن من الموافقة على الحل المطلوب بناءً على المعلومات المتوفرة."},
    RETURN_REFUND_PENDING:{subject:r=>"تمت الموافقة على الاسترداد للطلب "+r,eyebrow:"تمت الموافقة على الاسترداد",heading:"الاسترداد بانتظار المعالجة",intro:"تمت الموافقة على مبلغ الاسترداد وهو بانتظار تسجيل خطوة الدفع."},
    RETURN_REFUND_COMPLETED:{subject:r=>"تمت معالجة الاسترداد للطلب "+r,eyebrow:"تمت معالجة الاسترداد",heading:"تمت معالجة الاسترداد",intro:"تم تسجيل مبلغ الاسترداد المعتمد على أنه تمت معالجته."},
    RETURN_COMPLETED:{subject:r=>"اكتمل الطلب "+r,eyebrow:"اكتمل الطلب",heading:"اكتمل طلبك",intro:"وصل طلب الإرجاع أو مشكلة المنتج إلى مرحلة الاكتمال."}
  },
  fr:{
    RETURN_REQUEST_RECEIVED:{subject:r=>"Nous avons reçu votre demande retour / produit "+r,eyebrow:"Demande reçue",heading:"Nous avons reçu votre demande",intro:"Votre demande est enregistrée et sera examinée par notre équipe.",notice:"L’envoi d’une demande ne garantit pas automatiquement un remboursement ou un échange."},
    RETURN_INFORMATION_NEEDED:{subject:r=>"Informations requises pour la demande "+r,eyebrow:"Informations requises",heading:"Nous avons besoin de quelques informations",intro:"Ouvrez votre demande et envoyez les informations demandées afin de poursuivre l’examen."},
    RETURN_REPLY_RECEIVED:{subject:r=>"Nouveau message pour la demande "+r,eyebrow:"Nouveau message",heading:"Nous avons répondu à votre demande",intro:"Un nouveau message de Zayt W Mouneh est disponible concernant votre retour ou problème produit."},
    RETURN_AUTHORIZED:{subject:r=>"Retour autorisé pour la demande "+r,eyebrow:"Retour autorisé",heading:"Votre retour est autorisé",intro:"Consultez les instructions de votre demande avant de retourner le produit."},
    RETURN_RESOLUTION_APPROVED:{subject:r=>"Solution approuvée pour la demande "+r,eyebrow:"Solution approuvée",heading:"Une solution a été approuvée",intro:"Votre demande a été examinée et une solution a été approuvée."},
    RETURN_REJECTED:{subject:r=>"Mise à jour de la demande "+r,eyebrow:"Demande examinée",heading:"Votre demande a été examinée",intro:"Après examen, nous n’avons pas pu approuver la solution demandée sur la base des informations disponibles."},
    RETURN_REFUND_PENDING:{subject:r=>"Remboursement approuvé pour la demande "+r,eyebrow:"Remboursement approuvé",heading:"Votre remboursement est en attente de traitement",intro:"Le remboursement a été approuvé et attend l’étape de paiement enregistrée."},
    RETURN_REFUND_COMPLETED:{subject:r=>"Remboursement traité pour la demande "+r,eyebrow:"Remboursement traité",heading:"Votre remboursement a été traité",intro:"Le remboursement approuvé a été enregistré comme traité."},
    RETURN_COMPLETED:{subject:r=>"Demande "+r+" terminée",eyebrow:"Demande terminée",heading:"Votre demande est terminée",intro:"Cette demande de retour ou de problème produit est maintenant terminée."}
  }
};
const RETURN_LABELS={
  en:{request:"Request reference",order:"Order reference",status:"Status",amount:"Approved refund",view:"View request"},
  ar:{request:"مرجع الطلب",order:"مرجع الطلب الأصلي",status:"الحالة",amount:"مبلغ الاسترداد المعتمد",view:"عرض الطلب"},
  fr:{request:"Référence de la demande",order:"Référence de commande",status:"Statut",amount:"Remboursement approuvé",view:"Voir la demande"}
};

function eventCopy(eventType,locale,reference){
  const c=COPY[locale]||COPY.en;
  if(String(eventType||"").startsWith("RETURN_")){
    const value=(RETURN_COPY[locale]||RETURN_COPY.en)[eventType];
    if(!value)throw new Error("Unsupported transactional email template");
    return {...value,subject:typeof value.subject==="function"?value.subject(reference):value.subject};
  }
  const key={
    ORDER_RECEIVED:"orderReceived",
    ORDER_CONFIRMED:"orderConfirmed",
    ORDER_PREPARING:"orderPreparing",
    ORDER_OUT_FOR_DELIVERY:"orderOut",
    ORDER_DELIVERED:"orderDelivered",
    ORDER_CANCELLED:"orderCancelled",
    ORDER_ITEM_ATTENTION:"itemAttention",
    WHOLESALE_REQUEST_RECEIVED:"wholesaleReceived",
    WHOLESALE_CONTACTED:"wholesaleContacted",
    WHOLESALE_NEEDS_INFORMATION:"wholesaleNeedsInfo",
    WHOLESALE_QUOTE_PREPARING:"wholesaleQuotePreparing",
    WHOLESALE_QUOTE_SENT:"wholesaleQuoteSent",
    WHOLESALE_NEGOTIATING:"wholesaleNegotiating",
    WHOLESALE_APPROVED:"wholesaleApproved",
    WHOLESALE_COMPLETED:"wholesaleCompleted"
  }[eventType];
  if(!key||!c[key])throw new Error("Unsupported transactional email template");
  const value=c[key];
  return {...value,subject:typeof value.subject==="function"?value.subject(reference):value.subject};
}

function normalizeItems(items){
  if(!Array.isArray(items))return [];
  return items.slice(0,40).map((item)=>({
    name:String(item?.name||item?.name_en||item?.product_name||item?.title||item?.product_id||"Item"),
    variant:String(item?.variant||item?.size||item?.pack||item?.option||""),
    qty:Number(item?.qty??item?.quantity??1)||1
  }));
}

function detailsTable(rows,rtl){
  const usable=rows.filter(([,value])=>String(value??"").trim()!=="");
  if(!usable.length)return "";
  return '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;border-collapse:separate;border-spacing:0;background:#fffaf0;border:1px solid #e8dfcc;border-radius:16px;overflow:hidden;">'+
    usable.map(([label,value],index)=>'<tr><td style="padding:12px 16px;font-size:12px;line-height:18px;color:#6a6a5d;border-top:'+(index?"1px solid #eee5d4":"0")+';text-align:'+(rtl?"right":"left")+';">'+escapeHtml(label)+'</td><td style="padding:12px 16px;font-size:13px;line-height:18px;font-weight:700;color:#082d13;border-top:'+(index?"1px solid #eee5d4":"0")+';text-align:'+(rtl?"left":"right")+';overflow-wrap:anywhere;">'+escapeHtml(value)+'</td></tr>').join("")+
  '</table>';
}

function itemsTable(items,c,rtl){
  const normalized=normalizeItems(items);
  if(!normalized.length)return "";
  return '<div style="margin:22px 0 8px;font-size:12px;line-height:18px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0f4a20;">'+escapeHtml(c.items)+'</div>'+
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;border-spacing:0;background:#fffaf0;border:1px solid #e8dfcc;border-radius:16px;overflow:hidden;">'+
    normalized.map((item,index)=>'<tr><td style="padding:12px 14px;border-top:'+(index?"1px solid #eee5d4":"0")+';text-align:'+(rtl?"right":"left")+';"><strong style="display:block;font-size:13px;line-height:18px;color:#082d13;overflow-wrap:anywhere;">'+escapeHtml(item.name)+'</strong>'+(item.variant?'<span style="display:block;margin-top:2px;font-size:11px;line-height:16px;color:#6a6a5d;">'+escapeHtml(c.variant)+': '+escapeHtml(item.variant)+'</span>':"")+'</td><td style="width:74px;padding:12px 14px;border-top:'+(index?"1px solid #eee5d4":"0")+';font-size:12px;line-height:18px;font-weight:700;color:#0f4a20;text-align:'+(rtl?"left":"right")+';">'+escapeHtml(c.qty)+': '+escapeHtml(item.qty)+'</td></tr>').join("")+
    '</table>';
}

function renderShell({locale,eyebrow,heading,intro,detailsHtml,contentHtml,notice,actionLabel,actionRoute}){
  const rtl=locale==="ar";
  const c=COPY[locale]||COPY.en;
  const fallback=String(actionRoute||"").startsWith("/wholesale")?"/wholesale":"/account";
  const actionUrl=new URL(safeRoute(actionRoute,fallback),SITE_ORIGIN).toString();
  return '<!doctype html><html lang="'+locale+'" dir="'+(rtl?"rtl":"ltr")+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHtml(heading)+'</title></head>'+
  '<body style="margin:0;padding:0;background:#f7f0e2;color:#082d13;font-family:Arial,Helvetica,sans-serif;direction:'+(rtl?"rtl":"ltr")+';">'+
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f7f0e2;"><tr><td align="center" style="padding:22px 10px;">'+
  '<table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;background:#fffaf0;border:1px solid #e2d8c2;border-radius:24px;overflow:hidden;">'+
  '<tr><td align="center" style="background:#082d13;padding:26px 20px 22px;border-bottom:4px solid #d3a323;">'+
  '<img src="'+LOGO_URL+'" width="82" height="82" alt="Zayt W Mouneh" style="display:block;width:82px;height:82px;border-radius:50%;border:3px solid #fffaf0;background:#fffaf0;margin:0 auto 12px;">'+
  '<div style="font-family:Georgia,Times New Roman,serif;font-size:27px;line-height:32px;color:#ffffff;">Zayt W Mouneh</div>'+
  '<div style="margin-top:5px;font-size:11px;line-height:16px;letter-spacing:1.4px;color:#edca72;font-weight:700;">'+escapeHtml(c.brand)+'</div>'+
  '</td></tr><tr><td style="padding:28px 28px 26px;text-align:'+(rtl?"right":"left")+';">'+
  '<div style="font-size:11px;line-height:16px;letter-spacing:.1em;text-transform:uppercase;color:#0f4a20;font-weight:800;">'+escapeHtml(eyebrow)+'</div>'+
  '<h1 style="margin:8px 0 12px;font-family:Georgia,Times New Roman,serif;font-size:28px;line-height:34px;color:#082d13;font-weight:700;">'+escapeHtml(heading)+'</h1>'+
  '<p style="margin:0;font-size:15px;line-height:24px;color:#3f4b40;">'+escapeHtml(intro)+'</p>'+
  (detailsHtml||"")+(contentHtml||"")+
  (notice?'<div style="margin:20px 0 0;padding:14px 16px;border-left:'+(rtl?"0":"4px solid #d3a323")+';border-right:'+(rtl?"4px solid #d3a323":"0")+';background:#f7f0e2;border-radius:12px;font-size:13px;line-height:20px;color:#384838;">'+escapeHtml(notice)+'</div>':"")+
  '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 4px;"><tr><td bgcolor="#0f4a20" style="border-radius:999px;"><a href="'+escapeHtml(actionUrl)+'" style="display:inline-block;padding:13px 22px;font-size:14px;line-height:18px;font-weight:800;color:#ffffff;text-decoration:none;">'+escapeHtml(actionLabel)+'</a></td></tr></table>'+
  '<p style="margin:18px 0 0;font-size:11px;line-height:17px;color:#777568;overflow-wrap:anywhere;">'+escapeHtml(actionUrl)+'</p>'+
  '</td></tr><tr><td style="background:#082d13;padding:18px 22px;text-align:center;font-size:11px;line-height:17px;color:#dfe8df;">'+escapeHtml(c.footer)+'</td></tr>'+
  '</table></td></tr></table></body></html>';
}

export function renderTransactionalEmailJob(job){
  const locale=localeOf(job?.locale);
  const payload=job?.payload&&typeof job.payload==="object"?job.payload:{};
  const reference=String(payload.reference||job?.entity_id||"").trim();
  const c=COPY[locale]||COPY.en;
  const copy=eventCopy(String(job?.event_type||""),locale,reference);
  const isWholesale=String(job?.event_type||"").startsWith("WHOLESALE_");
  const isAttention=job?.event_type==="ORDER_ITEM_ATTENTION";
  const isOrder=String(job?.event_type||"").startsWith("ORDER_");
  const isReturn=String(job?.event_type||"").startsWith("RETURN_");

  let details=[];
  let contentHtml="";
  if(isOrder){
    details=[
      [c.reference,reference],
      [c.status,(ORDER_STATUS[locale]||ORDER_STATUS.en)[String(payload.status||"")]||""],
      [c.total,money(payload.total,payload.currency,locale)],
      [c.delivery,payload.delivery_summary||""]
    ];
    if(job.event_type==="ORDER_RECEIVED")contentHtml=itemsTable(payload.items,c,locale==="ar");
    if(isAttention){
      details=[
        [c.reference,reference],
        [copy.item||c.items,payload.item||""]
      ];
    }
  }else if(isWholesale){
    details=[
      [c.wholesaleRef,reference],
      [c.business,payload.business_name||""]
    ];
  }else if(isReturn){
    const labels=RETURN_LABELS[locale]||RETURN_LABELS.en;
    details=[
      [labels.request,reference],
      [labels.order,payload.order_reference||""],
      [labels.status,payload.status||""],
      [labels.amount,Number(payload.approved_refund_total||0)>0?money(payload.approved_refund_total,payload.currency||"USD",locale):""]
    ];
  }

  const route=safeRoute(payload.route,isWholesale?"/wholesale":"/account");
  const actionLabel=isWholesale?c.viewWholesale:isReturn?(RETURN_LABELS[locale]||RETURN_LABELS.en).view:(route==="/contact"?c.contact:c.viewOrder);
  return {
    subject:copy.subject,
    html:renderShell({
      locale,
      eyebrow:copy.eyebrow,
      heading:copy.heading,
      intro:copy.intro,
      detailsHtml:detailsTable(details,locale==="ar"),
      contentHtml,
      notice:copy.notice||String(payload.note||"").trim(),
      actionLabel,
      actionRoute:route
    })
  };
}
