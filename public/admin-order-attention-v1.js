(() => {
  "use strict";
  if(window.__ZWM_ADMIN_ORDER_ATTENTION_V1__)return;
  window.__ZWM_ADMIN_ORDER_ATTENTION_V1__=true;

  const SESSION_KEY="zwm:owner-session:v3";
  const $=(id)=>document.getElementById(id);
  const cfg=()=>window.ZWM_CMS_CONFIG||{};
  const isAr=()=>document.documentElement.dir==="rtl"||document.documentElement.lang==="ar";
  const isFr=()=>document.documentElement.lang==="fr";
  const tr=(en,ar,fr)=>isAr()?ar:isFr()?fr:en;

  function session(){
    try{
      const value=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");
      return value?.access_token?value:null;
    }catch{return null}
  }

  async function rpc(reference,item,note){
    const c=cfg(),s=session();
    if(!c.supabaseUrl||!c.supabasePublishableKey||!s?.access_token)throw new Error(tr("Owner session unavailable.","جلسة المالك غير متاحة.","Session propriétaire indisponible."));
    const response=await fetch(String(c.supabaseUrl).replace(/\/$/,"")+"/rest/v1/rpc/admin_mark_order_item_attention",{
      method:"POST",
      headers:{
        "apikey":c.supabasePublishableKey,
        "Authorization":"Bearer "+s.access_token,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({p_reference:reference,p_item_label:item,p_note:note||null})
    });
    const data=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(data?.message||data?.hint||tr("Could not send the customer-attention update.","تعذّر إرسال تحديث المتابعة للعميل.","Impossible d’envoyer la mise à jour."));
    return data;
  }

  function itemChoices(){
    const rows=[...document.querySelectorAll("#orderDetailItems .order-detail-item")];
    return rows.map((row,index)=>{
      const name=(row.querySelector("b")?.textContent||tr("Item","صنف","Article")).trim();
      const small=(row.querySelector("small")?.textContent||"").trim();
      const variant=small.split("·")[0]?.trim()||"";
      return {value:(name+(variant?" · "+variant:"")).slice(0,200),label:(name+(variant?" — "+variant:"")).slice(0,220),index};
    });
  }

  function populate(){
    const select=$("orderAttentionItem");
    if(!select)return;
    const current=select.value,items=itemChoices();
    select.innerHTML=items.map((item)=>'<option value="'+item.index+'"></option>').join("");
    [...select.options].forEach((option,i)=>{option.textContent=items[i]?.label||"";option.dataset.value=items[i]?.value||""});
    if(current&&[...select.options].some(x=>x.value===current))select.value=current;
    $("orderAttentionAction").disabled=!items.length;
  }

  async function send(){
    const button=$("orderAttentionAction"),status=$("orderAttentionStatus"),select=$("orderAttentionItem"),note=$("orderAttentionNote");
    const reference=($("orderDetailCode")?.textContent||"").trim();
    const option=select?.selectedOptions?.[0];
    const item=option?.dataset?.value||"";
    if(!reference||!item){status.textContent=tr("Choose an order item first.","اختر صنفاً من الطلب أولاً.","Choisissez d’abord un article.");return}
    button.disabled=true;status.textContent=tr("Sending customer update…","جارٍ إرسال تحديث للعميل…","Envoi de la mise à jour…");
    try{
      await rpc(reference,item,(note?.value||"").trim());
      status.textContent=tr("Customer and owner alerts queued. The order was not rejected or cancelled.","تمت جدولة تنبيهات العميل والمالك. لم يتم رفض الطلب أو إلغاؤه.","Alertes client et propriétaire mises en file. La commande n’a pas été refusée ni annulée.");
      if(note)note.value="";
    }catch(error){
      status.textContent=error?.message||tr("Could not send the update.","تعذّر إرسال التحديث.","Impossible d’envoyer la mise à jour.");
    }finally{
      button.disabled=!itemChoices().length;
    }
  }

  function ensurePanel(){
    const modal=$("orderModal"),items=$("orderDetailItems");
    if(!modal||!items)return;
    let panel=$("orderAttentionPanel");
    if(!panel){
      panel=document.createElement("article");
      panel.id="orderAttentionPanel";
      panel.className="order-detail-section";
      panel.innerHTML=
        '<div class="order-detail-section-head"><div><span>'+tr("Availability","التوفر","Disponibilité")+'</span><h3>'+tr("Item needs customer attention","صنف يحتاج إلى متابعة العميل","Article nécessitant l’attention du client")+'</h3></div></div>'+
        '<p class="field-help" style="margin:0 0 10px">'+tr("Use this only when an item in an existing order is unavailable. It alerts the customer without rejecting the order.","استخدم هذا فقط عندما يكون صنف في طلب قائم غير متوفر. يتم تنبيه العميل من دون رفض الطلب.","À utiliser uniquement lorsqu’un article est indisponible. Le client est alerté sans refuser la commande.")+'</p>'+
        '<div class="zwm-order-attention-grid">'+
          '<label><span>'+tr("Affected item","الصنف المتأثر","Article concerné")+'</span><select id="orderAttentionItem" aria-label="'+tr("Affected order item","الصنف المتأثر في الطلب","Article concerné")+'"></select></label>'+
          '<label><span>'+tr("Optional note","ملاحظة اختيارية","Note facultative")+'</span><textarea id="orderAttentionNote" rows="2" maxlength="500" placeholder="'+tr("Replacement, quantity change, or follow-up note…","بديل أو تعديل كمية أو ملاحظة متابعة…","Remplacement, quantité ou note de suivi…")+'"></textarea></label>'+
        '</div>'+
        '<div class="zwm-order-attention-actions"><button id="orderAttentionAction" class="button-secondary" type="button">'+tr("Notify customer about item","تنبيه العميل بخصوص الصنف","Alerter le client")+'</button><small id="orderAttentionStatus" role="status" aria-live="polite"></small></div>';
      const productSection=items.closest(".order-detail-section");
      productSection?.insertAdjacentElement("afterend",panel);
      $("orderAttentionAction")?.addEventListener("click",send);
    }
    populate();
  }

  function style(){
    if($("orderAttentionStyle"))return;
    const el=document.createElement("style");
    el.id="orderAttentionStyle";
    el.textContent=".zwm-order-attention-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.zwm-order-attention-grid label{display:grid;gap:5px;font-size:10px;font-weight:800;color:var(--muted)}.zwm-order-attention-grid select,.zwm-order-attention-grid textarea{width:100%;min-height:44px;border:1px solid #d8ddd3;border-radius:10px;background:#fff;padding:10px;font:inherit;color:var(--ink);box-sizing:border-box}.zwm-order-attention-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:10px}.zwm-order-attention-actions button{min-height:44px}.zwm-order-attention-actions small{font-size:10px;color:var(--muted);line-height:1.45;max-width:560px}@media(max-width:680px){.zwm-order-attention-grid{grid-template-columns:1fr}.zwm-order-attention-actions button{width:100%}}";
    document.head.appendChild(el);
  }

  function boot(){
    if(!document.body.classList.contains("admin-body"))return;
    style();ensurePanel();
    new MutationObserver(()=>ensurePanel()).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["hidden"]});
    document.addEventListener("zwm:admin-language",()=>{const old=$("orderAttentionPanel");old?.remove();ensurePanel()});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();