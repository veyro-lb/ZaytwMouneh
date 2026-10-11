/* TDS variable delivery fee review. Kept separate from core order logic. */
(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  let saving=false;
  function money(value){return "$"+(Number(value)||0).toFixed(2)}
  function phoneDigits(value){
    let digits=String(value||"").replace(/\D/g,"");
    if(digits.startsWith("00"))digits=digits.slice(2);
    if(digits.startsWith("0")&&digits.length===8)digits="961"+digits.slice(1);
    if(digits.length===8)digits="961"+digits;
    return digits.length>=10&&digits.length<=15?digits:"";
  }
  function render(order,api){
    const panel=$("tdsDeliveryPanel"),fee=$("tdsFinalFee"),send=$("tdsSendFee"),accept=$("tdsFeeAccepted"),save=$("tdsConfirmFee"),status=$("tdsFeeStatus"),current=$("tdsCurrentQuote");
    if(!panel||!fee||!save||!api?.client)return;
    const info=order.extra?.delivery_fee_confirmation||{};
    const quoted=Number(order.delivery_fee)||0;
    const isFree=order.created_source==="website"&&(quoted===0||order.extra?.delivery_quote?.free_delivery===true);
    const locked=!["new","confirmed","preparing"].includes(order.status)||String(order.payment_status||"pending")!=="pending";
    current.textContent="Current delivery "+money(quoted)+" · Order total "+money(order.total);
    if(info.status==="confirmed"){
      status.textContent="Final fee confirmed with customer"+(info.confirmed_at?" · "+new Date(info.confirmed_at).toLocaleString():"");
    }else if(info.status==="pending"){
      status.textContent="Waiting for the owner to confirm TDS's final price.";
    }else{
      status.textContent="Existing order — the original price stays as recorded unless you explicitly confirm a change.";
    }
    fee.value=quoted.toFixed(2);fee.disabled=locked||isFree;
    accept.checked=false;accept.disabled=locked;
    save.disabled=locked;
    send.disabled=locked;
    $("tdsFeeHelp").textContent=locked
      ?"Price is locked: order dispatched, completed, cancelled or payment already processed."
      :isFree?"Free delivery was promised. You can confirm $0, but cannot add a fee."
      :"Ask TDS for the actual charge, tell the customer the exact new total, and obtain their agreement before confirming.";
    let draft=quoted;
    function updateDraft(){
      draft=Number(fee.value);
      const valid=fee.value.trim()!==""&&Number.isFinite(draft)&&draft>=0&&draft<=200;
      const total=(Number(order.total)||0)-quoted+(valid?draft:0);
      const proposal="Zayt W Mouneh — order "+order.reference+"\nTDS delivery: "+money(draft)+"\nOrder total: "+money(total)+"\nPlease reply to confirm that you accept this final amount before dispatch. Thank you.";
      const digits=phoneDigits(order.customer_phone||order.extra?.recipient_phone);
      send.textContent=digits?"Request approval on WhatsApp":"Copy price confirmation message";
      send.onclick=async ()=>{
        if(!valid)return;
        if(digits)window.open("https://wa.me/"+digits+"?text="+encodeURIComponent(proposal),"_blank","noopener");
        else {
          try{await navigator.clipboard.writeText(proposal);api.toast("Price confirmation message copied.");}
          catch{api.toast("Please copy the price details manually.","error");}
        }
      };
      save.disabled=locked||saving||!valid;
    }
    fee.oninput=()=>{accept.checked=false;updateDraft()};
    updateDraft();
    save.onclick=async ()=>{
      if(locked||saving)return;
      const feeValue=Number(fee.value);
      if(fee.value.trim()===""||!Number.isFinite(feeValue)||feeValue<0||feeValue>200){api.toast("Enter a valid delivery fee.","error");return}
      if(isFree&&feeValue!==0){api.toast("Promised free delivery cannot be changed.","error");return}
      if(!accept.checked){api.toast("Confirm the customer accepted the final total before saving.","error");return}
      saving=true;save.disabled=true;save.textContent="Saving…";
      try{
        const {data,error}=await api.client.rpc("zwm_admin_confirm_delivery_fee",{
          p_reference:order.reference,p_fee:feeValue,p_customer_approved:true,p_expected_updated_at:order.updated_at
        });
        if(error)throw error;
        api.toast("Final delivery "+money(data.delivery_fee)+" confirmed. New total "+money(data.total));
        await api.refresh();
      }catch(err){api.toast(err?.message||"Could not confirm delivery price. Refresh and retry.","error");}
      finally{saving=false;save.textContent="Confirm final fee";if(!locked)save.disabled=false;}
    };
  }
  window.ZWM_TDS_DELIVERY={render};
})();
