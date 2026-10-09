const {JSDOM}=require("jsdom");
const fs=require("node:fs");
const assert=require("node:assert/strict");
const read=p=>fs.readFileSync("public/"+p,"utf8");
const wait=ms=>new Promise(r=>setTimeout(r,ms));

function page(locale="en",options={}){
  let html=read("wholesale.html").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"");
  const prefix=locale==="en"?"":"/"+locale;
  const dom=new JSDOM(html,{url:"https://store.example"+prefix+"/wholesale",runScripts:"outside-only",pretendToBeVisual:true});
  const w=dom.window,d=w.document,requests=[],events=[];
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.requestAnimationFrame=fn=>w.setTimeout(()=>fn(Date.now()),0);
  w.cancelAnimationFrame=id=>w.clearTimeout(id);
  w.ZWM_CMS_CONFIG={supabaseUrl:"https://service.example",supabasePublishableKey:"publishable-test"};
  w.ZWM_CMS={track:(name,meta)=>events.push({name,meta})};
  w.ZWM_FR_TRANSLATE=s=>"FR "+s;
  if(options.session)w.localStorage.setItem("zwm:mouneh:session:v1",JSON.stringify(options.session));
  let mode="success";
  const statusRow={found:true,reference:"ZW-B2B-00000000",status:"new",created_at:"2026-10-05T20:00:00Z",updated_at:"2026-10-05T20:00:00Z",business_name:"Cedar Kitchen",preferred_contact_method:"whatsapp",items:[{product_name:"Test Product",variant:"1 kg",quantity:2,unit:"units"}]};
  w.fetch=async(url,opts={})=>{
    const u=String(url);requests.push({url:u,opts});
    if(u.includes("/rpc/get_wholesale_enquiry_status"))return {ok:true,status:200,json:async()=>statusRow};
    if(u.includes("/rpc/get_my_wholesale_enquiries"))return {ok:true,status:200,json:async()=>options.accountRows||[]};
    if(u.includes("/rpc/hide_my_wholesale_enquiry"))return {ok:true,status:200,json:async()=>true};
    if(u.includes("/rpc/submit_wholesale_enquiry")){
      if(mode==="failure")return {ok:false,status:503,json:async()=>({message:"offline"})};
      return {ok:true,status:200,json:async()=>"00000000-0000-0000-0000-000000000001"};
    }
    return {ok:true,status:200,json:async()=>null};
  };
  w.eval(read("products-data.js")+"\n;\n"+read("wholesale-v1.js"));
  d.dispatchEvent(new w.Event("DOMContentLoaded",{bubbles:true}));
  return {dom,w,d,requests,events,setMode:v=>mode=v};
}
function input(ctx,id,value){
  const el=ctx.d.getElementById(id);el.value=value;
  el.dispatchEvent(new ctx.w.Event("input",{bubbles:true}));
  return el;
}
function change(ctx,id,value){
  const el=ctx.d.getElementById(id);el.value=value;
  el.dispatchEvent(new ctx.w.Event("change",{bubbles:true}));
  return el;
}
function addFirstProduct(ctx){
  const btn=ctx.d.querySelector("[data-add-product]");
  assert(btn,"catalogue did not render addable products");
  btn.click();
  assert.equal(ctx.d.getElementById("selectedCount").textContent,"1","selected product count");
  assert(ctx.d.querySelector("[data-selected-product]"),"selected product row missing");
}
function fillRequired(ctx){
  input(ctx,"businessName","Cedar Kitchen");
  input(ctx,"contactName","Maya Haddad");
  change(ctx,"businessType","restaurant");
  input(ctx,"phone","+961 70 123 456");
  input(ctx,"location","Beirut");
  ctx.d.getElementById("consent").checked=true;
  ctx.d.getElementById("consent").dispatchEvent(new ctx.w.Event("change",{bubbles:true}));
}
async function submit(ctx){
  ctx.d.getElementById("wholesaleForm").dispatchEvent(new ctx.w.Event("submit",{bubbles:true,cancelable:true}));
  await wait(35);
}

(async()=>{
  // Locale and true directionality.
  for(const locale of ["en","ar","fr"]){
    const ctx=page(locale);
    try{
      assert.equal(ctx.d.documentElement.lang,locale,locale+" html lang");
      assert.equal(ctx.d.documentElement.dir,locale==="ar"?"rtl":"ltr",locale+" html direction");
      assert(ctx.d.getElementById("businessType").options.length>5,locale+" business options missing");
      assert(ctx.d.querySelectorAll("[data-add-product]").length>0,locale+" catalogue results missing");
      assert(ctx.d.querySelectorAll("[data-add-product]").length<=24,locale+" catalogue render cap exceeded");
      if(locale==="ar")assert(ctx.d.querySelector("h1").textContent.includes("مونة"),"Arabic hero not localized");
      if(locale==="fr")assert(ctx.d.querySelector("h1").textContent.includes("approvisionnement"),"French hero not localized");
    }finally{ctx.dom.window.close()}
  }

  // Inline validation is accessible and does not submit/erase the form.
  {
    const ctx=page("en");
    try{
      await submit(ctx);
      const field=ctx.d.getElementById("businessName");
      assert.equal(field.getAttribute("aria-invalid"),"true","required field not marked invalid");
      const described=field.getAttribute("aria-describedby");
      assert(described&&ctx.d.getElementById(described),"required error not programmatically associated");
      assert.equal(ctx.requests.length,0,"invalid form reached network");
    }finally{ctx.dom.window.close()}
  }

  // Catalogue selection + failure retention + successful controlled RPC transition.
  {
    const ctx=page("en");
    try{
      addFirstProduct(ctx);fillRequired(ctx);
      input(ctx,"notes","Please review recurring packaging needs.");
      ctx.setMode("failure");
      await submit(ctx);
      assert.equal(ctx.d.getElementById("businessName").value,"Cedar Kitchen","failure erased form");
      assert(!ctx.d.getElementById("wholesaleForm").hidden,"failure hid the form");
      assert(ctx.d.getElementById("formStatus").classList.contains("is-error"),"failure state missing");
      ctx.setMode("success");
      await submit(ctx);
      assert(ctx.d.getElementById("wholesaleForm").hidden,"successful form not hidden");
      assert(!ctx.d.getElementById("wholesaleSuccess").hidden,"success state not shown");
      assert.equal(ctx.d.getElementById("successReference").textContent,"ZW-B2B-00000000","success reference missing");
      assert.equal(ctx.d.getElementById("successStatus").textContent,"Received","customer status label missing");
      const receipts=JSON.parse(ctx.w.localStorage.getItem("zwm:wholesale:history:v1")||"[]");
      assert.equal(receipts.length,1,"successful request receipt was not saved");
      assert(ctx.d.getElementById("wholesaleHistoryList").textContent.includes("Cedar Kitchen"),"submitted request missing from customer history");
      const rpc=ctx.requests.find(r=>r.url.includes("/rest/v1/rpc/submit_wholesale_enquiry")&&r.opts.body);
      assert(rpc,"controlled wholesale RPC was not called");
      const payload=JSON.parse(rpc.opts.body).p;
      assert.equal(payload.business_name,"Cedar Kitchen");
      assert.equal(payload.items.length,1);
      assert.equal(payload.locale,"en");
      assert(!JSON.stringify(payload).includes("card"),"unexpected payment data in payload");
      assert(ctx.events.some(e=>e.name==="wholesale_request_submitted"),"submit analytics event missing");
    }finally{ctx.dom.window.close()}
  }

  // Signed-in customers can see account-linked history and its owner-managed status.
  {
    const row={reference:"ZW-B2B-ABC12345",status:"quote_preparing",created_at:"2026-10-05T19:00:00Z",updated_at:"2026-10-05T20:00:00Z",business_name:"Account Cafe",preferred_contact_method:"email",items:[{product_name:"Olive Oil",variant:"1 L",quantity:6,unit:"bottles"}]};
    const ctx=page("en",{session:{access_token:"signed-in-test-token"},accountRows:[row]});
    try{
      await wait(40);
      const history=ctx.d.getElementById("wholesaleHistoryList").textContent;
      assert(history.includes("Account Cafe"),"signed-in Wholesale history missing");
      assert(history.includes("Reviewing & preparing quote"),"owner-managed status not translated for customer");
      assert(ctx.d.getElementById("wholesaleHistorySignIn").hidden,"sign-in prompt should hide for authenticated customer");
      const rpc=ctx.requests.find(r=>r.url.includes("/rpc/get_my_wholesale_enquiries"));
      assert(rpc&&rpc.opts.headers.Authorization==="Bearer signed-in-test-token","account history RPC missing customer auth token");
    }finally{ctx.dom.window.close()}
  }

  // Real draft persistence and restore, including selected catalogue items.
  {
    const first=page("en");
    input(first,"businessName","Draft Bakery");addFirstProduct(first);
    await wait(320);
    const saved=first.w.localStorage.getItem("zwm:wholesale:draft:v1");
    assert(saved,"unfinished wholesale draft was not saved");
    first.dom.window.close();

    let html=read("wholesale.html").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"");
    const dom=new JSDOM(html,{url:"https://store.example/wholesale",runScripts:"outside-only",pretendToBeVisual:true});
    const w=dom.window,d=w.document;
    w.HTMLElement.prototype.scrollIntoView=function(){};
    w.localStorage.setItem("zwm:wholesale:draft:v1",saved);
    w.ZWM_CMS_CONFIG={supabaseUrl:"https://service.example",supabasePublishableKey:"test"};
    w.ZWM_CMS={track(){}};
    w.ZWM_FR_TRANSLATE=s=>"FR "+s;
    w.fetch=async()=>({ok:true,json:async()=>null});
    w.eval(read("products-data.js")+"\n;\n"+read("wholesale-v1.js"));
    d.dispatchEvent(new w.Event("DOMContentLoaded",{bubbles:true}));
    assert.equal(d.getElementById("businessName").value,"Draft Bakery","draft business field not restored");
    assert.equal(d.getElementById("selectedCount").textContent,"1","draft selected product not restored");
    dom.window.close();
  }

  // Customer-facing button/link audit: destination integrity, clear draft, refresh guard and history removal.
  {
    const ctx=page("en");
    try{
      const requestLink=ctx.d.querySelector('.wholesale-hero-actions a[data-t="requestPricing"]');
      const historyLink=ctx.d.querySelector('.wholesale-hero-actions a[data-t="trackRequests"]');
      assert.equal(requestLink.getAttribute("href"),"/wholesale#wholesale-request","request-pricing CTA destination regressed");
      assert.equal(historyLink.getAttribute("href"),"/wholesale#wholesale-history","track-requests CTA destination regressed");

      input(ctx,"businessName","Draft To Clear");addFirstProduct(ctx);
      await wait(320);
      assert(ctx.w.localStorage.getItem("zwm:wholesale:draft:v1"),"draft missing before clear button test");
      ctx.d.getElementById("clearDraft").click();
      assert.equal(ctx.d.getElementById("businessName").value,"","clear draft did not reset customer fields");
      assert.equal(ctx.d.getElementById("selectedCount").textContent,"0","clear draft did not remove selected products");
      assert.equal(ctx.w.localStorage.getItem("zwm:wholesale:draft:v1"),null,"clear draft left persisted data behind");

      addFirstProduct(ctx);fillRequired(ctx);await submit(ctx);
      const before=ctx.requests.filter(r=>r.url.includes("/rpc/get_wholesale_enquiry_status")).length;
      const refresh=ctx.d.getElementById("refreshWholesaleHistory");
      refresh.click();
      assert.equal(refresh.disabled,true,"refresh button must disable while statuses are loading");
      await wait(20);
      const after=ctx.requests.filter(r=>r.url.includes("/rpc/get_wholesale_enquiry_status")).length;
      assert(after>before,"refresh status button did not reload saved request status");
      assert.equal(refresh.disabled,false,"refresh button did not re-enable after loading");
    }finally{ctx.dom.window.close()}
  }

  {
    const row={lead_id:"11111111-1111-1111-1111-111111111111",reference:"ZW-B2B-DELETE01",status:"new",created_at:"2026-10-05T19:00:00Z",updated_at:"2026-10-05T20:00:00Z",business_name:"Delete Me Cafe",preferred_contact_method:"whatsapp",items:[]};
    const ctx=page("en",{session:{access_token:"signed-in-test-token"},accountRows:[row]});
    try{
      ctx.w.confirm=()=>true;ctx.w.alert=()=>{};
      await wait(40);
      const del=ctx.d.querySelector('[data-history-delete="ZW-B2B-DELETE01"]');
      assert(del,"history delete button missing");
      del.click();
      assert.equal(del.disabled,true,"history delete button must disable during removal");
      await wait(20);
      assert(!ctx.d.getElementById("wholesaleHistoryList").textContent.includes("Delete Me Cafe"),"history delete did not remove the customer card");
      const rpc=ctx.requests.find(r=>r.url.includes("/rpc/hide_my_wholesale_enquiry"));
      assert(rpc&&rpc.opts.headers.Authorization==="Bearer signed-in-test-token","history delete did not use the authenticated protected RPC");
    }finally{ctx.dom.window.close()}
  }

  // Owner/admin Wholesale interaction matrix: desktop/mobile open, refresh, contact links, save/contact/delete.
  {
    const html=`<!doctype html><html><body>
      <button data-view="wholesale" type="button">Wholesale</button><h1 id="viewTitle"></h1>
      <section data-view-panel="wholesale" class="is-active">
        <div class="wholesale-admin-toolbar"><label class="search-field"><input id="wholesaleLeadSearch" type="search"></label>
        <select id="wholesaleLeadStatus"><option value="">All</option><option value="new">New</option><option value="contacted">Contacted</option><option value="quote_preparing">Quote preparing</option></select>
        <button id="refreshWholesaleLeads" type="button">Refresh</button></div>
        <strong id="wholesaleLeadResultCount"></strong><strong id="wholesaleMetricAll"></strong><strong id="wholesaleMetricNew"></strong><strong id="wholesaleMetricQuotes"></strong><strong id="wholesaleMetricConverted"></strong><strong id="navWholesaleCount"></strong>
        <table><tbody id="wholesaleLeadTableBody"></tbody></table><div id="wholesaleLeadCards"></div>
      </section></body></html>`;
    const dom=new JSDOM(html,{url:"https://store.example/admin",runScripts:"outside-only",pretendToBeVisual:true});
    const w=dom.window,d=w.document,requests=[];
    w.ZWM_CMS_CONFIG={supabaseUrl:"https://service.example",supabasePublishableKey:"publishable-test",tables:{wholesaleLeads:"wholesale_leads"}};
    w.sessionStorage.setItem("zwm:owner-session:v3",JSON.stringify({access_token:"owner-test-token"}));w.confirm=()=>true;
    let row={id:"11111111-1111-1111-1111-111111111111",business_name:"Cedar Kitchen",contact_name:"Maya Haddad",business_type:"restaurant",location:"Beirut",phone:"03 123 456",email:"maya@example.com",website_or_instagram:"",purchase_frequency:"weekly",approximate_volume:null,first_order_timing:"asap",preferred_contact_method:"whatsapp",locale:"en",status:"new",created_at:"2026-10-05T20:00:00Z",updated_at:"2026-10-05T20:00:00Z",next_follow_up_at:null,internal_notes:null,priorities:["price"],current_supplier_status:"yes",supplier_switch_reason:"",notes:"",unlisted_products:"",wholesale_lead_items:[{product_name_snapshot:"Olive Oil",selected_variant:"1 L",requested_quantity:6,requested_unit:"bottles"}]};
    w.fetch=async(url,opts={})=>{const u=String(url);requests.push({url:u,opts});
      if(u.includes("/rest/v1/wholesale_leads?select="))return {ok:true,status:200,json:async()=>[row]};
      if(u.includes("/rest/v1/wholesale_leads?id=eq.")&&opts.method==="PATCH"){row={...row,...JSON.parse(opts.body||"{}")};return {ok:true,status:200,json:async()=>[row]};}
      if(u.includes("/rest/v1/rpc/admin_delete_wholesale_enquiry"))return {ok:true,status:200,json:async()=>true};
      return {ok:false,status:404,json:async()=>({message:"unexpected request"})};
    };
    w.eval(read("admin-wholesale.js"));d.dispatchEvent(new w.Event("DOMContentLoaded",{bubbles:true}));await wait(35);
    assert(d.getElementById("wholesaleLeadTableBody").textContent.includes("Cedar Kitchen"),"desktop admin Wholesale table did not load");
    let open=d.querySelector("#wholesaleLeadCards .wholesale-lead-open");assert(open,"mobile admin Open lead button missing audited class");assert.equal(open.getAttribute("type"),"button","mobile Open lead must be an explicit button");
    const before=requests.filter(r=>r.url.includes("?select=")).length,refresh=d.getElementById("refreshWholesaleLeads");refresh.click();assert.equal(refresh.disabled,true,"admin refresh must disable while loading");await wait(20);assert(requests.filter(r=>r.url.includes("?select=")).length>before,"admin refresh did not reload leads");assert.equal(refresh.disabled,false,"admin refresh did not re-enable");
    open=d.querySelector("#wholesaleLeadCards .wholesale-lead-open");open.click();const modal=d.getElementById("wholesaleLeadModal");assert(modal&&!modal.hidden,"Open lead did not show CRM modal");
    assert(d.querySelector('.wholesale-lead-actions a[href="tel:+9613123456"]'),"local Lebanese phone did not normalize for Call");assert(d.querySelector('.wholesale-lead-actions a[href="https://wa.me/9613123456"]'),"local Lebanese phone did not normalize for WhatsApp");
    d.dispatchEvent(new w.KeyboardEvent("keydown",{key:"Escape",bubbles:true}));assert(modal.hidden,"Escape did not close CRM modal");d.querySelector("#wholesaleLeadCards .wholesale-lead-open").click();
    let mark=d.getElementById("markWholesaleContacted");mark.click();assert.equal(mark.disabled,true,"Mark contacted must disable during save");await wait(20);assert(requests.some(r=>r.opts.method==="PATCH"&&JSON.parse(r.opts.body||"{}").last_contacted_at),"Mark contacted did not persist contact time");assert.equal(row.status,"contacted","new lead did not transition to contacted");
    d.getElementById("wholesaleDetailStatus").value="quote_preparing";d.getElementById("wholesaleDetailNotes").value="Prepare a quote.";let save=d.getElementById("saveWholesaleLead");save.click();assert.equal(save.disabled,true,"Save CRM changes must disable during save");await wait(20);assert.equal(row.status,"quote_preparing","CRM status did not persist");assert.equal(row.internal_notes,"Prepare a quote.","internal notes did not persist");
    // Regression: both owner admin languages, static labels, enum values and modal must switch without mutating CRM records.
    d.documentElement.lang="ar";
    d.documentElement.dir="rtl";
    d.dispatchEvent(new w.Event("zwm:admin-language"));
    assert.equal(d.querySelector('[data-view="wholesale"]').textContent,"الجملة","Wholesale desktop nav must localize");
    assert.equal(d.getElementById("wholesaleLeadStatus").querySelector('[value="quote_preparing"]').textContent,"جارٍ إعداد عرض السعر","Wholesale dropdown must localize");
    assert(d.getElementById("wholesaleLeadTableBody").textContent.includes("مطعم"),"Wholesale business type must be Arabic");
    assert(d.getElementById("wholesaleLeadTableBody").textContent.includes("أسبوعياً"),"Wholesale frequency must be Arabic");
    assert.equal(d.querySelector("#wholesaleLeadModal h2").textContent,"تفاصيل طلب الجملة","Wholesale modal heading must be Arabic");
    assert.equal(d.getElementById("wholesaleDetailStatus").value,"quote_preparing","Changing language must never change saved status codes");
    assert.equal(d.getElementById("wholesaleDetailNotes").value,"Prepare a quote.","Changing language must preserve internal notes");
    d.documentElement.lang="en";
    d.documentElement.dir="ltr";
    d.dispatchEvent(new w.Event("zwm:admin-language"));
    assert.equal(d.querySelector('[data-view="wholesale"]').textContent,"Wholesale","Wholesale desktop nav must restore English");
    assert.equal(d.getElementById("wholesaleLeadStatus").querySelector('[value="quote_preparing"]').textContent,"Quote preparing","Wholesale dropdown must restore English");
    assert.equal(d.querySelector("#wholesaleLeadModal h2").textContent,"Lead details","Wholesale modal must restore English");
    assert(d.getElementById("wholesaleLeadTableBody").textContent.includes("Restaurant"),"Business type must restore English");
    assert.equal(d.getElementById("wholesaleDetailStatus").value,"quote_preparing","Restoring English must retain status code");
    d.getElementById("deleteWholesaleLead").click();await wait(20);assert(requests.some(r=>r.url.includes("/rpc/admin_delete_wholesale_enquiry")),"Delete enquiry did not call protected RPC");assert(!d.getElementById("wholesaleLeadCards").textContent.includes("Cedar Kitchen"),"deleted lead remained visible");
    dom.window.close();
  }

  console.log("Wholesale UI regression passed: customer and admin desktop/mobile buttons, RFQ flow, history/status, draft restore, contact/save/delete actions.");
})().catch(err=>{console.error(err);process.exitCode=1});
