const fs=require("node:fs");
const assert=require("node:assert/strict");
const path=require("node:path");
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

const sw=read("public/admin-sw.js");
assert(sw.includes('addEventListener("push"'),"service worker push handler missing");
assert(sw.includes('addEventListener("notificationclick"'),"notification click handler missing");
assert(sw.includes("networkFirst"),"existing service-worker caching behavior was lost");
assert(sw.includes('url.hostname.includes("supabase.co")'),"Supabase bypass missing from service worker");

const admin=read("public/notification-admin.js");
for(const token of [
  "Notification.requestPermission()",
  'api("subscribe"',
  'api("unsubscribe"',
  'api("test"',
  "adminNotificationBell",
  "adminNotificationsMarkAll",
  "loadHistory",
  "startRealtime",
  "claimLocalEvent",
  "WHOLESALE_INQUIRY_CREATED",
  "PAYMENT_FAILED",
  "ORDER_CREATED",
  "iPhone",
  "fr:{"
]) assert(admin.includes(token),"admin notification runtime missing "+token);
assert(!admin.includes("endpoint:</"),"raw endpoint must not be rendered");

const customer=read("public/notification-customer.js");
for(const token of [
  "order_updates",
  "marketing",
  "Notification.requestPermission()",
  "notification_ref",
  "logoutCleanup",
  "startRealtime",
  "iPhone",
  "fr:{"
]) assert(customer.includes(token),"customer notification runtime missing "+token);

const account=read("public/account.html");
assert(account.includes("site-manifest.webmanifest"),"customer PWA manifest missing");
assert(account.includes("notification-customer.js"),"customer notification runtime not wired");
assert(account.includes("notification-customer.css"),"customer notification CSS not wired");

const adminMain=read("public/admin.js");
assert(adminMain.includes("ZWM_NOTIFICATION_BOOTSTRAP_V1"),"admin notification bootstrap missing");
assert(adminMain.includes("notification-admin.js"),"admin notification runtime not bootstrapped");

const core=read("supabase/migrations/20261005191059_notification_core_tables.sql");
assert(core.includes("unique(user_id,dedupe_key)"),"notification idempotency constraint missing");
assert(core.includes("notification_push_outbox"),"durable push outbox missing");
assert(core.includes("push_subscriptions"),"push subscriptions table missing");

const delivery=read("supabase/migrations/20261005224500_notification_push_delivery.sql");
assert(delivery.includes("new.created_source='website'"),"new order alert is not tied to authoritative website finalization");
assert(delivery.includes("for update skip locked"),"push outbox atomic claiming missing");
assert(delivery.includes("zwm-notification-retry"),"push retry schedule missing");
assert(delivery.includes("notification_server_config"),"server-only Vault configuration missing");
assert(delivery.includes("drop trigger if exists zwm_notification_review_insert"),"unsupported review moderation event was not removed");

const safety=read("supabase/migrations/20261005225500_notification_transaction_safety.sql");
assert(safety.includes("exception when others then"),"notification side effects are not failure-isolated");
assert(safety.includes("/account?notification_ref="),"customer deep link does not preserve authenticated destination");

const edge=read("supabase/functions/notification-push/index.ts");
for(const token of [
  'npm:web-push@3.6.7',
  "x-zwm-dispatch-secret",
  'action==="subscribe"',
  'action==="unsubscribe"',
  'action==="devices"',
  'action==="set_preference"',
  'action==="test"',
  'status===404||status===410',
  "notification_delivery_accepted",
  "notification_push_allowed",
  "webpush.sendNotification"
]) assert(edge.includes(token),"push Edge Function missing "+token);
assert(!edge.includes("TinyFish"),"paid/external TinyFish dependency introduced");

console.log("Notification production regression passed.");
