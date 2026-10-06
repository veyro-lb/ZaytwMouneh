import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {renderTransactionalEmailJob} from "../supabase/functions/_shared/transactional-email-template.mjs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(__dirname,"..");
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");

const migration=read("supabase/migrations/20261006220400_transactional_email_notification_sync.sql");
const edge=read("supabase/functions/transactional-email/index.ts");
const push=read("supabase/functions/notification-push/index.ts");
const customer=read("public/customer-notifications-v1.js");
const admin=read("public/admin-notifications-v1.js");
const adminConfig=read("public/admin-config.js");
const attention=read("public/admin-order-attention-v1.js");

for(const event of [
  "ORDER_RECEIVED","ORDER_CONFIRMED","ORDER_PREPARING","ORDER_OUT_FOR_DELIVERY",
  "ORDER_DELIVERED","ORDER_ITEM_ATTENTION","WHOLESALE_REQUEST_RECEIVED",
  "WHOLESALE_NEEDS_INFORMATION","WHOLESALE_QUOTE_PREPARING","WHOLESALE_QUOTE_SENT",
  "WHOLESALE_APPROVED"
]){
  assert.ok(migration.includes("'"+event+"'"),"missing event "+event);
}

assert.doesNotMatch(migration,/^\\$;$/m,"malformed PL/pgSQL dollar-quote terminator");
assert.match(migration,/create table if not exists private\.transactional_email_outbox/i);
assert.match(migration,/event_key text not null unique/i);
assert.match(migration,/for update skip locked/i);
assert.match(migration,/status in \('pending','retry'\)/i);
assert.match(migration,/old\.status is distinct from new\.status/i);
assert.match(migration,/exception when others[\s\S]*transactional email queueing failed/i);
assert.match(migration,/customer:ORDER_ITEM_ATTENTION:/);
assert.match(migration,/admin:ORDER_ITEM_ATTENTION:/);
assert.match(migration,/admin_mark_order_item_attention/);
assert.doesNotMatch(migration,/status\s*=\s*'rejected'|status\s*in\s*\([^)]*'rejected'/i);
assert.match(migration,/grant execute on function public\.transactional_email_claim_outbox\(integer\) to service_role/i);
assert.match(migration,/revoke all on table private\.transactional_email_outbox from public, anon, authenticated/i);

assert.match(edge,/ZWM_RESEND_API_KEY/);
assert.match(edge,/ZWM_TRANSACTIONAL_EMAIL_FROM/);
assert.match(edge,/Idempotency-Key/);
assert.match(edge,/AbortController/);
assert.match(edge,/transactional_email_claim_outbox/);
assert.match(edge,/transactional_email_outbox_finish/);
assert.doesNotMatch(edge,/re_[A-Za-z0-9]{20,}/,"provider key must not be committed");
assert.doesNotMatch(read("public/admin-config.js"),/service_role|ZWM_RESEND_API_KEY|ZWM_TRANSACTIONAL_EMAIL_FROM/i);

assert.match(push,/ORDER_ITEM_ATTENTION/);
assert.match(customer,/ORDER_ITEM_ATTENTION/);
assert.match(admin,/ORDER_ITEM_ATTENTION/);
assert.match(admin,/customer_requests/);
assert.match(adminConfig,/admin-order-attention-v1\.js/);
assert.match(attention,/admin_mark_order_item_attention/);
assert.match(attention,/The order was not rejected or cancelled/);
assert.match(attention,/@media\(max-width:680px\)/);

const orderJob={
  event_type:"ORDER_RECEIVED",locale:"en",entity_id:"ZW-TEST-123",
  payload:{
    reference:"ZW-TEST-123",
    status:"new",
    total:24.5,
    currency:"USD",
    delivery_summary:"Baabda",
    route:"/account?notification_ref=ZW-TEST-123#orders",
    items:[
      {name:"Olive Oil <script>alert(1)</script>",size:"1 L",qty:2},
      {name:"Za'atar",variant:"500 g",quantity:1}
    ]
  }
};
const order=renderTransactionalEmailJob(orderJob);
assert.equal(order.subject,"We received your Zayt W Mouneh order ZW-TEST-123");
assert.match(order.html,/max-width:620px/);
assert.match(order.html,/#082d13/);
assert.match(order.html,/#d3a323/);
assert.match(order.html,/email-logo\.jpg/);
assert.match(order.html,/Olive Oil &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(order.html,/<script>/i);
assert.doesNotMatch(order.html,/\bundefined\b|\bnull\b/);
assert.match(order.html,/https:\/\/zaytwmouneh\.com\/account\?notification_ref=ZW-TEST-123#orders/);

const ar=renderTransactionalEmailJob({
  ...orderJob,locale:"ar",event_type:"ORDER_ITEM_ATTENTION",
  payload:{reference:"ZW-TEST-123",status:"preparing",item:"زيت زيتون",route:"/account#orders"}
});
assert.match(ar.html,/<html lang="ar" dir="rtl">/);
assert.match(ar.subject,/يحتاج إلى متابعة/);

const fr=renderTransactionalEmailJob({
  event_type:"WHOLESALE_QUOTE_SENT",locale:"fr",entity_id:"lead-1",
  payload:{reference:"ZW-B2B-ABC12345",business_name:"Café du Liban",route:"/wholesale#wholesale-history"}
});
assert.match(fr.subject,/Zayt W Mouneh/);
assert.match(fr.html,/Café du Liban/);
assert.match(fr.html,/lang="fr"/);

const malicious=renderTransactionalEmailJob({
  event_type:"WHOLESALE_NEEDS_INFORMATION",locale:"en",entity_id:"lead-2",
  payload:{reference:"X",business_name:'"><img src=x onerror=alert(1)>',route:"https://evil.example/phish"}
});
assert.doesNotMatch(malicious.html,/<img src=x onerror=/);
assert.doesNotMatch(malicious.html,/evil\.example/);
assert.match(malicious.html,/https:\/\/zaytwmouneh\.com\/wholesale/);

console.log("Transactional email regression checks passed.");