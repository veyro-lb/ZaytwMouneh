const fs=require("node:fs");
const assert=require("node:assert/strict");
const path=require("node:path");
const pub=path.join(process.cwd(),"public");
const read=name=>fs.readFileSync(path.join(pub,name),"utf8");

const wholesaleCss=read("wholesale-v1.css");
const adminWholesaleCss=read("admin-wholesale.css");
const conversionCss=read("conversion-v1.css");
const notificationCss=read("notifications-v1.css");
const adminCss=read("admin.css");
const adminWholesaleJs=read("admin-wholesale.js");
const customerNotifications=read("customer-notifications-v1.js");
const adminNotifications=read("admin-notifications-v1.js");
const siteRuntime=read("site-runtime-v9.js");

for(const [name,css] of [
  ["Wholesale",wholesaleCss],
  ["Admin Wholesale",adminWholesaleCss],
  ["Conversion",conversionCss],
  ["Notifications",notificationCss]
]) assert(css.includes("mobile-audit-20261006"),name+" mobile audit marker missing");

assert(/@media\(max-width:560px\)[\s\S]*\.wholesale-form input,[\s\S]*font-size:16px/.test(wholesaleCss),"Wholesale phone controls must stay at 16px to avoid iOS focus zoom");
assert(wholesaleCss.includes(".product-result{min-height:46px}"),"Wholesale product picker touch targets regressed");

assert(adminWholesaleCss.includes(".wholesale-lead-actions button{min-height:44px}"),"Wholesale owner actions must be at least 44px high");
assert(/@media\(max-width:700px\)[\s\S]*\.wholesale-lead-modal\{width:100%;height:100dvh;max-height:100dvh;border-radius:0\}/.test(adminWholesaleCss),"Wholesale owner modal must be a true phone sheet");
assert(/\.wholesale-crm-grid select,[\s\S]*font-size:16px/.test(adminWholesaleCss),"Wholesale owner fields must avoid iOS focus zoom");
assert(adminWholesaleCss.includes(".wholesale-admin-toolbar{display:grid;grid-template-columns:1fr;align-items:stretch}"),"Wholesale owner toolbar must stack on phones");

assert(/@media\(max-width:650px\)[\s\S]*\.c6-field input,[\s\S]*font-size:16px/.test(conversionCss),"New product/conversion forms must avoid iOS focus zoom");

assert(adminCss.includes(".topbar-right .icon-button{display:none}"),"Admin base phone icon rule changed; re-audit notification bell visibility");
assert(notificationCss.includes(".topbar-right #zwmNotificationBell"),"Admin notification bell phone override missing");
assert(/#zwmNotificationBell\{[\s\S]*display:grid!important/.test(notificationCss),"Admin notification bell must remain visible on narrow phones");
assert(notificationCss.includes(".nav-actions:has(#zwmCustomerNotificationBell)"),"Storefront header must make room for the customer notification bell");
assert(notificationCss.includes("max-height:calc(100dvh - 82px)"),"Notification popovers must fit the dynamic phone viewport");
assert(/\.zwm-customer-switch,\r?\n\.zwm-admin-switch\{min-width:46px;min-height:44px/.test(notificationCss),"Notification toggles need a 44px touch target");
assert(notificationCss.includes("white-space:normal;text-align:start"),"Notification status pills must wrap on narrow phones");

assert(adminWholesaleJs.includes('e.key==="Escape"&&modal&&!modal.hidden'),"Wholesale owner modal Escape close regression");
assert(adminWholesaleJs.includes('<button type="button" class="wholesale-lead-open"'),"Wholesale table action must be an explicit button");
assert((adminWholesaleJs.match(/class="wholesale-lead-open"/g)||[]).length>=2,"Desktop and mobile Wholesale open actions must share the audited button class");
assert(adminWholesaleJs.includes("function contactPhone(v)"),"Wholesale admin contact link normalization missing");
assert(adminWholesaleCss.includes(".wholesale-mobile-card button{width:100%;min-height:44px"),"Wholesale mobile-card Open lead touch target must be at least 44px");
assert(customerNotifications.includes('bell.id="zwmCustomerNotificationBell"'),"Customer notification bell missing");
assert(customerNotifications.includes('data-test'),"Customer production notification test control missing");
assert(customerNotifications.includes('WHOLESALE_STATUS_CHANGED'),"Customer Wholesale status notification rendering missing");
assert(customerNotifications.includes('data-pref="wholesale"'),"Customer Wholesale push preference missing");
assert(adminNotifications.includes('b.id="zwmNotificationBell"'),"Admin notification bell missing");
assert(adminNotifications.includes('notification_test_status'),"Admin production notification delivery verification missing");
assert(siteRuntime.includes('CUSTOMER_NOTIFICATIONS_VERSION = "20261007-storefrontstability1"'),"Site runtime must request the stabilized notification assets");
assert(!siteRuntime.includes('new MutationObserver(check).observe(document.body,{childList:true,subtree:true})'),"Site runtime must not observe the entire customer body subtree");
assert(!siteRuntime.includes('observer.observe(document.documentElement,{subtree:true,childList:true})'),"Returns navigation must not observe the entire document subtree");
assert(!customerNotifications.includes('obs.observe(document.body,{subtree:true,childList:true})'),"Customer notifications must not observe the entire body subtree");

assert(read("wholesale.html").includes("/wholesale-v1.css?v=20261006-wholesaleqa1"),"Wholesale CSS cache token stale");
assert.match(read("admin.html"),/admin-wholesale\.css\?v=\d{8}-[a-z0-9-]+/,"Admin Wholesale CSS must carry a versioned asset URL");
assert.match(read("admin.html"),/admin-wholesale\.js\?v=\d{8}-[a-z0-9-]+/,"Admin Wholesale JS must carry a versioned asset URL");
assert(read("account.html").includes("/notifications-v1.css?v=20261006-mobileaudit1"),"Customer notification CSS cache token stale");
assert(read("admin-config.js").includes("/notifications-v1.css?v=20261006-mobileaudit1"),"Admin notification CSS loader cache token stale");
assert(read("admin-config.js").includes("/admin-notifications-v1.js?v=20261006-transactionalemail1"),"Admin notification JS cache token stale");
assert.match(read("admin.html"),/admin-config\.js\?v=\d{8}-[a-z0-9-]+/,"Admin config must carry a versioned asset URL");
assert(read("account.html").includes("/customer-notifications-v1.js?v=20261006-transactionalemail1"),"Customer notification JS cache token stale");
for(const file of ["account.html","product.html","gift.html","shop.html","recipes.html"]){
  assert(read(file).includes("/conversion-v1.css?v=20261006-mobileaudit1"),file+" conversion CSS cache token stale");
}
const storefrontRelease=JSON.parse(read("release.json")).release;
for(const file of ["index.html","shop.html","gift.html","recipes.html","about.html","contact.html","account.html","checkout.html","product.html","returns.html","terms.html","privacy.html","returns-policy.html","privacy-policy.html","privacy-and-data.html","terms-of-service.html","terms-and-rewards.html"]){
  assert(read(file).includes("site-runtime-v9.js?v="+storefrontRelease),file+" stabilized runtime cache token stale");
}
assert(read("wholesale.html").includes("/notifications-v1.css?v=20261006-mobileaudit1"),"Wholesale must load audited notification styles directly");
assert(read("wholesale.html").includes("/site-runtime-v9.js?v="+storefrontRelease),"Wholesale stabilized storefront runtime cache token stale");
assert.match(read("wholesale.html"),/\/wholesale-v1\.js\?v=\d{8}-[a-z0-9-]+/,"Wholesale behavior JS must remain explicitly versioned");

console.log("Today UI/mobile regression passed: Wholesale, notification bells, owner modal and conversion forms.");
