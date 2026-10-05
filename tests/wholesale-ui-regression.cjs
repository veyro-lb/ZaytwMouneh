const {JSDOM}=require("jsdom");
const fs=require("node:fs");
const assert=require("node:assert/strict");
const read=p=>fs.readFileSync("public/"+p,"utf8");
const wait=ms=>new Promise(r=>setTimeout(r,ms));

function page(locale="en"){
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
  let mode="success";
  w.fetch=async(url,opts={})=>{
    requests.push({url:String(url),opts});
    if(mode==="failure")return {ok:false,status:503,json:async()=>({message:"offline"})};
    return {ok:true,status:200,json:async()=>"00000000-0000-0000-0000-000000000001"};
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

  console.log("Wholesale UI regression passed: EN/AR/FR, accessible validation, catalogue RFQ, failure retry, success and draft restore.");
})().catch(err=>{console.error(err);process.exitCode=1});
