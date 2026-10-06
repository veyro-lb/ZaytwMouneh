const fs = require("node:fs");
const assert = require("node:assert/strict");

const read = (path) => fs.readFileSync(path, "utf8");

const workflow = read(".github/workflows/production-regression.yml");
assert.match(workflow, /push:\s*\n\s*branches:\s*\n\s*-\s*main/);
assert.match(workflow, /pull_request:\s*\n\s*branches:\s*\n\s*-\s*main/);
assert.match(workflow, /workflow_dispatch:/);
assert.match(workflow, /name:\s*Production regression gate/);
assert.match(workflow, /npm ci --ignore-scripts/);
assert.doesNotMatch(workflow, /npm install --no-save|package-lock-only/);
assert.equal(fs.existsSync(".github/workflows/batch7-final-regression.yml"), false);

const lock = JSON.parse(read("package-lock.json"));
assert.equal(lock.lockfileVersion, 3);
assert.equal(lock.packages["node_modules/jsdom"].version, "26.1.0");

const admin = read("public/admin-notifications-v1.js");
assert.match(admin, /rpc\/notification_create_test/);
assert.match(admin, /p_subscription_id:device\.id/);
assert.doesNotMatch(admin, /p_user:user\.id,p_subscription_id:device\.id/);

const push = read("supabase/functions/notification-push/index.ts");
assert.match(push, /rpc\/notification_legacy_delivery_record/);
assert.match(push, /rpc\/notification_legacy_delivery_accepted/);
assert.doesNotMatch(push, /\/rest\/v1\/notification_delivery_attempts/);

const auth = read("public/mouneh-rewards-v8.js");
assert.match(auth, /status>=400&&status<500&&status!==429/);

const bridge = read("supabase/migrations/20261006150000_release_notification_authorization_bridge.sql");
assert.match(bridge, /v_user uuid := auth\.uid\(\)/);
assert.match(bridge, /p_user is distinct from v_user/);
assert.match(bridge, /notification_create_test\(\s*p_subscription_id uuid\s*\)/);
assert.match(bridge, /set search_path = ''/);
assert.match(bridge, /grant execute on function public\.notification_legacy_delivery_record[\s\S]*to service_role/);
assert.match(bridge, /revoke execute on function public\.notification_legacy_delivery_record[\s\S]*from anon, authenticated/);

const cleanup = read("supabase/migrations/20261006153000_release_notification_private_telemetry_cleanup.sql");
assert.match(cleanup, /alter table public\.notification_delivery_attempts set schema private/);
assert.match(cleanup, /drop function public\.notification_create_test\(uuid, uuid\)/);

console.log("Notification security/release regression checks passed.");
