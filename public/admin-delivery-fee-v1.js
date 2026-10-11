/* TDS delivery confirmation: isolated admin controls. Rates remain configured elsewhere. */
(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  let saving=false,lastOrder=null,lastApi=null;

  const COPY={
    en:{
      eyebrow:"TDS delivery",heading:"Confirm final delivery fee",feeLabel:"Confirmed TDS delivery fee (USD)",
      approval:"Prepare WhatsApp approval message",copy:"Copy approval message",
      consent:"I told the customer the final delivery fee and order total, and they agreed before dispatch.",
      confirm:"Confirm final fee",saving:"Saving…",
      current:"Current delivery",total:"Order total",preview:"Total after confirmation",
      pending:"Pending: verify TDS's charge and obtain customer approval before dispatch.",
      confirmed:"Delivery fee confirmed with the customer",legacy:"Existing order: its recorded delivery amount remains unchanged unless you confirm an adjustment.",
      locked:"This amount is locked because the order is dispatched, cancelled, completed or payment has been processed.",
      free:"Free delivery was promised. The customer pays $0 for delivery; this cannot be increased.",
      help:"Ask TDS for the actual cost. If the customer total changes, obtain their approval before saving.",
      messageLanguage:"Customer message",messageHint:"WhatsApp opens a draft; review and send it yourself. Otherwise, copy the message.",
      copied:"Approval message copied.",copyFailed:"Please copy the approval message manually.",
      invalid:"Enter a valid delivery fee (USD 0–200).",freeError:"Promised free delivery cannot be changed.",
      consentError:"Confirm the customer agreed to the final total before saving.",
      saved:"Final delivery confirmed",newTotal:"Updated order total",
      saveFailed:"Could not confirm the delivery fee. Refresh the order and retry.",
      languages:{en:"English",ar:"Arabic",fr:"French"}
    },
    ar:{
      eyebrow:"توصيل TDS",heading:"تأكيد رسوم التوصيل النهائية",feeLabel:"رسوم توصيل TDS النهائية (دولار)",
      approval:"تحضير رسالة الموافقة عبر واتساب",copy:"نسخ رسالة الموافقة",
      consent:"أبلغت العميل برسوم التوصيل والمجموع النهائي، وقد وافق عليهما قبل إرسال الطلب.",
      confirm:"تأكيد رسوم التوصيل",saving:"جارٍ الحفظ…",
      current:"رسوم التوصيل الحالية",total:"مجموع الطلب",preview:"المجموع بعد التأكيد",
      pending:"بانتظار تأكيد تكلفة TDS والحصول على موافقة العميل قبل الإرسال.",
      confirmed:"تم تأكيد رسوم التوصيل مع العميل",legacy:"طلب سابق: تبقى رسوم التوصيل المسجّلة كما هي ما لم تؤكّد تغييرها.",
      locked:"لا يمكن تعديل الرسوم بعد إرسال الطلب أو إلغائه أو إكماله أو معالجة الدفع.",
      free:"تم منح العميل توصيلاً مجانياً. تبقى رسومه 0 دولار ولا يمكن زيادتها.",
      help:"تحقّق من تكلفة TDS الفعلية. إذا تغيّر المجموع، احصل على موافقة العميل قبل الحفظ.",
      messageLanguage:"لغة رسالة العميل",messageHint:"يفتح واتساب رسالة جاهزة للمراجعة؛ يجب عليك إرسالها بنفسك. أو انسخ الرسالة.",
      copied:"تم نسخ رسالة الموافقة.",copyFailed:"يرجى نسخ تفاصيل الموافقة يدوياً.",
      invalid:"أدخل رسوم توصيل صحيحة (من 0 إلى 200 دولار).",freeError:"لا يمكن تغيير التوصيل المجاني الموعود.",
      consentError:"أكّد موافقة العميل على المجموع النهائي قبل الحفظ.",
      saved:"تم تأكيد رسوم التوصيل",newTotal:"مجموع الطلب المحدّث",
      saveFailed:"تعذّر تأكيد الرسوم. حدّث الطلب وأعد المحاولة.",
      languages:{en:"الإنجليزية",ar:"العربية",fr:"الفرنسية"}
    }
  };
  function lang(){return document.documentElement.lang==="ar"?"ar":"en"}
  function copy(){return COPY[lang()]}
  function money(value){
    const amount="$"+(Number(value)||0).toFixed(2);
    return lang()==="ar"?"\u2066"+amount+"\u2069":amount;
  }
  function phoneDigits(value){
    let digits=String(value||"").replace(/\D/g,"");
    if(digits.startsWith("00"))digits=digits.slice(2);
    if(digits.startsWith("0")&&digits.length===8)digits="961"+digits.slice(1);
    if(digits.length===8)digits="961"+digits;
    return digits.length>=10&&digits.length<=15?digits:"";
  }
  function customerLang(order){
    const value=String(order.language||"en").toLowerCase().slice(0,2);
    return value==="ar"||value==="fr"?value:"en";
  }
  function customerMessage(order,fee,total){
    const orderNumber=String(order.reference||"");
    const fmt=value=>"$"+(Number(value)||0).toFixed(2);
    const language=customerLang(order);
    if(language==="ar")return "زيت ومونة — الطلب "+orderNumber+
      "\nرسوم توصيل TDS النهائية: "+fmt(fee)+
      "\nالمجموع النهائي للطلب: "+fmt(total)+
      "\nيرجى الرد بالموافقة على هذا المجموع قبل إرسال الطلب. لن نغيّر المبلغ من دون موافقتك. شكراً لك.";
    if(language==="fr")return "Zayt W Mouneh — commande "+orderNumber+
      "\nLivraison TDS confirmée : "+fmt(fee)+
      "\nTotal final de la commande : "+fmt(total)+
      "\nMerci de répondre pour confirmer votre accord avant l'expédition. Aucun changement de montant sans votre accord.";
    return "Zayt W Mouneh — order "+orderNumber+
      "\nConfirmed TDS delivery: "+fmt(fee)+
      "\nFinal order total: "+fmt(total)+
      "\nPlease reply to approve this total before dispatch. We will not change the amount without your approval. Thank you.";
  }
  function render(order,api,options){
    const panel=$("tdsDeliveryPanel"),fee=$("tdsFinalFee"),send=$("tdsSendFee"),
      accept=$("tdsFeeAccepted"),save=$("tdsConfirmFee"),status=$("tdsFeeStatus"),
      current=$("tdsCurrentQuote"),preview=$("tdsDraftPreview"),help=$("tdsFeeHelp"),
      messageHint=$("tdsMessageHint");
    if(!panel||!fee||!send||!accept||!save||!status||!current||!api?.client)return;
    // Live order refreshes must not erase an in-progress quote if the order hasn't changed.
    // A new updated_at revision invalidates the draft/consent to prevent stale approvals.
    const sameRevision=!!order.updated_at&&panel.dataset.orderReference===String(order.reference)&&
      panel.dataset.orderRevision===String(order.updated_at);
    const preserve=sameRevision&&options?.preserve!==false&&!saving;
    const priorFee=fee.value,priorConsent=accept.checked;
    lastOrder=order;lastApi=api;
    panel.dataset.orderReference=String(order.reference);
    panel.dataset.orderRevision=String(order.updated_at||"");
    const info=order.extra?.delivery_fee_confirmation||{};
    const quoted=Number(order.delivery_fee)||0;
    const isFree=order.created_source==="website"&&(quoted===0||order.extra?.delivery_quote?.free_delivery===true);
    const locked=!["new","confirmed","preparing"].includes(order.status)||
      String(order.payment_status||"pending")!=="pending";
    const c=copy();
    const labels={
      tdsPanelEyebrow:c.eyebrow,tdsPanelHeading:c.heading,tdsFeeInputLabel:c.feeLabel,
      tdsAcceptLabel:c.consent
    };
    Object.keys(labels).forEach(id=>{const el=$(id);if(el)el.textContent=labels[id]});
    current.textContent=c.current+" "+money(quoted)+" · "+c.total+" "+money(order.total);
    if(info.status==="confirmed"){
      let when="";
      if(info.confirmed_at){
        const date=new Date(info.confirmed_at);
        if(Number.isFinite(date.getTime()))when=" · "+date.toLocaleString(lang()==="ar"?"ar-LB":"en-LB");
      }
      status.textContent=c.confirmed+when;
    }else if(info.status==="pending"){
      status.textContent=c.pending;
    }else{
      status.textContent=c.legacy;
    }
    fee.value=preserve?priorFee:quoted.toFixed(2);
    fee.disabled=locked||isFree;
    accept.checked=preserve?priorConsent:false;
    accept.disabled=locked;
    send.disabled=locked;
    help.textContent=locked?c.locked:isFree?c.free:c.help;
    const messageLang=customerLang(order);
    if(messageHint)messageHint.textContent=c.messageLanguage+": "+c.languages[messageLang]+". "+c.messageHint;

    function updateDraft(){
      const draft=Number(fee.value);
      const valid=fee.value.trim()!==""&&Number.isFinite(draft)&&draft>=0&&draft<=200&&(!isFree||draft===0);
      const total=Math.round(((Number(order.total)||0)-quoted+(valid?draft:0))*100)/100;
      const phone=phoneDigits(order.customer_phone||order.extra?.recipient_phone);
      send.textContent=phone?c.approval:c.copy;
      send.disabled=locked||!valid;
      if(preview)preview.textContent=valid?c.preview+": "+money(total):c.invalid;
      send.onclick=async ()=>{
        if(!valid)return;
        const proposal=customerMessage(order,draft,total);
        if(phone){
          window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(proposal),"_blank","noopener");
        }else{
          try{await navigator.clipboard.writeText(proposal);api.toast(c.copied)}
          catch{api.toast(c.copyFailed,"error")}
        }
      };
      save.disabled=locked||saving||!valid;
      if(!saving)save.textContent=c.confirm;
    }
    fee.oninput=()=>{accept.checked=false;updateDraft()};
    updateDraft();
    save.onclick=async ()=>{
      if(locked||saving)return;
      const feeValue=Number(fee.value);
      if(fee.value.trim()===""||!Number.isFinite(feeValue)||feeValue<0||feeValue>200){
        api.toast(c.invalid,"error");return;
      }
      if(isFree&&feeValue!==0){api.toast(c.freeError,"error");return}
      if(!accept.checked){api.toast(c.consentError,"error");return}
      saving=true;save.disabled=true;save.textContent=c.saving;
      try{
        const {data,error}=await api.client.rpc("zwm_admin_confirm_delivery_fee",{
          p_reference:order.reference,p_fee:feeValue,p_customer_approved:true,p_expected_updated_at:order.updated_at
        });
        if(error)throw error;
        api.toast(c.saved+": "+money(data.delivery_fee)+" · "+c.newTotal+": "+money(data.total));
        await api.refresh();
      }catch(err){api.toast(err?.message||c.saveFailed,"error")}
      finally{saving=false;updateDraft()}
    };
  }
  document.addEventListener("zwm:admin-language",()=>{
    const modal=$("orderModal");
    if(lastOrder&&lastApi&&(!modal||!modal.hidden))render(lastOrder,lastApi,{preserve:true});
  });
  window.ZWM_TDS_DELIVERY={render};
})();