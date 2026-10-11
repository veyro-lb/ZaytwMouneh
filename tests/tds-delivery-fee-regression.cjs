"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {JSDOM}=require("jsdom");
const root=path.join(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const sql=read("supabase/migrations/20261011140500_tds_variable_delivery_confirmation.sql");
const admin=read("public/admin.js"), adminHtml=read("public/admin.html");
const checkout=read("public/checkout.js"), checkoutHtml=read("public/checkout.html");
const receipt=read("public/order.js"), receiptHtml=read("public/order.html");
assert.match(sql,/security invoker/i,"Fee changes must use existing admin RLS");
assert.match(sql,/auth\.uid\(\)/,"Owner identity is required");
assert.match(sql,/p_expected_updated_at/,"Concurrent order edits must be checked");
assert.match(sql,/p_customer_approved is distinct from true/,"Customer consent is mandatory");
assert.match(sql,/payment_status is distinct from 'pending'/,"Paid orders must be immutable");
assert.match(sql,/out_for_delivery|dispatched/,"Dispatched orders must be immutable");
assert.match(sql,/Free delivery was promised/,"Free delivery promises must be honored");
assert.match(sql,/insert into public\.admin_activity/,"Price changes require an audit record");
assert.match(sql,/delivery_fee_confirmation/,"Customer must see the confirmed status");
assert.match(sql,/tg_op='INSERT' or old\.created_source is distinct from 'website'/,
  "Website quotes must always be restamped server-side");
assert.match(sql,/- 'delivery_fee_confirmation'/,
  "User-controlled checkout metadata must never preapprove the fee");
assert.ok(sql.includes("o.extra#>>'{delivery_fee_confirmation,status}'"),
  "Customer receives only the confirmation status, not internal audit metadata");

assert.doesNotMatch(sql,/delete\s+from\s+public\.orders/i,"No destructive order changes");
assert.match(admin,/ZWM_TDS_DELIVERY\?\.render/);
assert.match(admin,/status==="out_for_delivery"&&order\.created_source==="website"&&order\.extra\?\.delivery_fee_confirmation\?\.status==="pending"/);
assert.match(adminHtml,/tdsDeliveryPanel/);
assert.match(adminHtml,/admin-delivery-fee-v1\.js/);
assert.match(checkout,/Estimated delivery/);
assert.match(checkout,/no higher amount is charged without your approval/);
assert.match(checkoutHtml,/checkoutDeliveryNotice/);
assert.match(receipt,/o\.delivery_fee_confirmation\?\.status/);
assert.match(receiptHtml,/orderDeliveryConfirmationNote/);
assert.match(receipt,/freePending=feeStatus==="pending"/,"Guaranteed free delivery must never be labelled estimated");
assert.match(checkout,/no higher amount is charged without your approval/);
assert.match(adminHtml,/tdsDraftPreview/);
assert.match(adminHtml,/data-no-i18n/);

(async ()=>{
  const dom=new JSDOM(`<!doctype html><div id="tdsDeliveryPanel"></div>
    <span id="tdsPanelEyebrow"></span><h3 id="tdsPanelHeading"></h3>
    <span id="tdsFeeInputLabel"></span><span id="tdsAcceptLabel"></span>
    <p id="tdsDraftPreview"></p><p id="tdsMessageHint"></p>
    <p id="tdsFeeStatus"></p><p id="tdsCurrentQuote"></p><p id="tdsFeeHelp"></p>
    <input id="tdsFinalFee"><input type="checkbox" id="tdsFeeAccepted">
    <button id="tdsSendFee"></button><button id="tdsConfirmFee"></button>`,
    {url:"https://zaytwmouneh.com/admin",runScripts:"outside-only"});
  const w=dom.window, $=id=>w.document.getElementById(id);
  w.eval(read("public/admin-delivery-fee-v1.js"));
  const calls=[], messages=[], opened=[];
  w.open=url=>{opened.push(url);return {}};
  const api={
    client:{rpc:async(name,args)=>{calls.push({name,args});return {data:{delivery_fee:6,total:31},error:null};}},
    toast:(msg)=>messages.push(msg),
    refresh:async()=>calls.push({name:"refresh"})
  };
  const base={reference:"ZW-2610110000-ABCD",delivery_fee:5,total:30,status:"new",
    payment_status:"pending",created_source:"website",customer_phone:"03000000",
    updated_at:"2026-10-11T10:00:00.000Z",
    extra:{delivery_fee_confirmation:{status:"pending"},delivery_quote:{free_delivery:false}}};
  w.ZWM_TDS_DELIVERY.render(base,api);
  assert.match($("tdsFeeStatus").textContent,/Pending:/);
  assert.match($("tdsMessageHint").textContent,/English/);
  assert.equal($("tdsFinalFee").value,"5.00");
  $("tdsFinalFee").value="6.00";
  $("tdsFinalFee").oninput();
  assert.equal($("tdsFeeAccepted").checked,false,"Changing quote invalidates previous consent");
  $("tdsFeeAccepted").checked=true;
  w.document.documentElement.lang="ar";
  w.document.dispatchEvent(new w.CustomEvent("zwm:admin-language"));
  assert.match($("tdsPanelHeading").textContent,/تأكيد رسوم التوصيل/,"Arabic owner interface");
  assert.equal($("tdsFinalFee").value,"6.00","Language switching preserves the draft fee");
  assert.equal($("tdsFeeAccepted").checked,true,"Language switching preserves approval");
  assert.match($("tdsDraftPreview").textContent,/31.00/,"Arabic owner sees accurate total preview");
  w.document.documentElement.lang="en";
  w.document.dispatchEvent(new w.CustomEvent("zwm:admin-language"));
  w.ZWM_TDS_DELIVERY.render({...base},api);
  assert.equal($("tdsFinalFee").value,"6.00","Unchanged live refresh preserves owner draft");
  assert.equal($("tdsFeeAccepted").checked,true,"Unchanged live refresh preserves customer approval");
  await $("tdsSendFee").onclick();
  assert.match(decodeURIComponent(opened.at(-1)),/Proposed TDS delivery fee/,"English customer message");
  await $("tdsConfirmFee").onclick();
  assert.equal(calls[0].name,"zwm_admin_confirm_delivery_fee");
  assert.equal(calls[0].args.p_fee,6);
  assert.equal(calls[0].args.p_customer_approved,true);
  assert.equal(calls[0].args.p_expected_updated_at,base.updated_at);
  assert.equal(calls[1].name,"refresh");
  w.ZWM_TDS_DELIVERY.render({...base,updated_at:"2026-10-11T10:01:00.000Z"},api);
  assert.equal($("tdsFinalFee").value,"5.00","Changed order revision resets an old quote");
  assert.equal($("tdsFeeAccepted").checked,false,"Changed order revision invalidates old consent");
  w.ZWM_TDS_DELIVERY.render({...base,language:"ar"},api);
  await $("tdsSendFee").onclick();
  assert.match(decodeURIComponent(opened.at(-1)),/رسوم توصيل TDS المقترحة/,"Arabic customer message");
  w.ZWM_TDS_DELIVERY.render({...base,language:"fr"},api);
  await $("tdsSendFee").onclick();
  assert.match(decodeURIComponent(opened.at(-1)),/Frais de livraison TDS proposés/,"French customer message");
  w.ZWM_TDS_DELIVERY.render({...base,language:"fr",extra:{delivery_fee_confirmation:{status:"confirmed",confirmed_at:"2026-10-11T10:00:00Z"}}},api);
  assert.match($("tdsFeeStatus").textContent,/confirmed with the customer/,"Owner sees the saved confirmation state");
  w.ZWM_TDS_DELIVERY.render({...base,delivery_fee:0,total:25,extra:{delivery_quote:{free_delivery:true},delivery_fee_confirmation:{status:"pending"}}},api);
  assert.match($("tdsFeeHelp").textContent,/Free delivery was promised/);
  assert.equal($("tdsFinalFee").disabled,true,"Promised free delivery cannot be repriced");
  w.ZWM_TDS_DELIVERY.render({...base,status:"out_for_delivery"},api);
  assert.equal($("tdsConfirmFee").disabled,true,"Dispatched orders are locked");
  w.close();
  console.log("TDS delivery fee regression checks passed");
})().catch(err=>{console.error(err);process.exitCode=1});
