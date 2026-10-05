const fs=require("node:fs"),assert=require("node:assert/strict"),path=require("node:path");
const pub=path.join(process.cwd(),"public"),read=n=>fs.readFileSync(path.join(pub,n),"utf8");
const migrationDir=path.join(process.cwd(),"supabase/migrations");
const sql=fs.readdirSync(migrationDir).filter(n=>n.includes("wholesale")).sort().map(n=>fs.readFileSync(path.join(migrationDir,n),"utf8")).join("\\n");
const html=read("wholesale.html"),js=read("wholesale-v1.js"),css=read("wholesale-v1.css"),admin=read("admin-wholesale.js");
const menuPages=["index.html","shop.html","gift.html","recipes.html","about.html","contact.html","account.html","privacy.html","terms.html","privacy-policy.html","privacy-and-data.html","terms-of-service.html","terms-and-rewards.html"];
assert.equal((html.match(/<h1\b/gi)||[]).length,1,"wholesale must have one H1");
assert(html.includes('<header class="site-header"'),"wholesale must use the canonical storefront header");
assert(!html.includes('<header class="wholesale-header"'),"standalone wholesale header must not return");
assert(html.includes('<footer class="footer"'),"wholesale must use the canonical storefront footer");
assert(!html.includes('<footer class="wholesale-footer"'),"standalone wholesale footer must not return");
assert(html.includes('<a class="cart-button" id="cartButton" href="/shop"'),"wholesale header pantry control must be a reliable Shop link");
for(const expected of [
  'href="/" aria-label="Zayt w Mouneh home"',
  'href="/shop"><span>02</span>',
  'href="/gift"><span>03</span>',
  'href="/recipes"><span>04</span>',
  'href="/about"><span>05</span>',
  'href="/contact"><span>06</span>',
  'href="/wholesale" data-wholesale-link="nav" aria-current="page"',
  'href="/wholesale#wholesale-request" data-t="requestPricing"',
  'href="/shop" data-t="browsePantry"',
  'href="/privacy" target="_blank"',
  'href="/shop" data-t="backShop"',
  'href="https://wa.me/96181581230"'
])assert(html.includes(expected),"wholesale navigation/button route missing: "+expected);
assert(js.includes('function syncSiteShell()'),"wholesale shell synchronization missing");
assert(js.includes('localStorage.getItem("zwm-cart-v5")'),"wholesale shell cart count must reflect the saved pantry");
for(const x of ["en-LB","ar-LB","fr-LB","x-default"])assert(html.includes(`hreflang="${x}"`),"missing hreflang "+x);
for(const x of ["businessName","contactName","businessType","phone","location","productSearch","consent","submitWholesale"])assert(html.includes(`id="${x}"`),"missing field "+x);
assert(js.includes('D.documentElement.dir=locale==="ar"?"rtl":"ltr"'),"true Arabic RTL missing");
assert(js.includes('window.ZWM_FR_TRANSLATE'),"French catalogue translation integration missing");
for(const event of ["wholesale_page_view","wholesale_request_started","wholesale_product_added","wholesale_request_submitted","wholesale_request_failed"])assert(sql.includes(event),"analytics allowlist missing "+event);
assert(sql.includes("alter table public.wholesale_leads enable row level security"),"lead RLS missing");
assert(sql.includes("alter table public.wholesale_lead_items enable row level security"),"item RLS missing");
assert(sql.includes("revoke all on table public.wholesale_leads from public,anon,authenticated"),"lead grants not locked down");
assert(!/grant\s+select[^;]*wholesale_leads\s+to\s+anon/i.test(sql),"anon wholesale lead SELECT must never be granted");
assert(!/grant\s+(?:delete|all)[^;]*wholesale_leads\s+to\s+authenticated/i.test(sql),"hard delete/all grant must not be available");
assert(sql.includes("private.submit_wholesale_enquiry_core"),"controlled private submission routine missing");
assert(sql.includes("exists(select 1 from public.admin_users"),"owner allowlist policy missing");
for(const bad of ["best wholesale prices","guaranteed lowest","guaranteed supply"])assert(!html.toLowerCase().includes(bad),"unsupported wholesale claim: "+bad);
for(const page of menuPages){
  const menuHtml=read(page);
  assert(menuHtml.includes('data-wholesale-link="nav"'),page+" missing permanent wholesale menu entry");
  assert(menuHtml.includes('href="/wholesale"'),page+" wholesale menu href missing");
}
assert(css.includes("@media(max-width:360px)")&&css.includes("@media(max-width:560px)"),"small-phone CSS coverage missing");
assert(js.includes('DRAFT_MAX=48*60*60*1000'),"bounded draft persistence missing");
assert(js.includes("slice(0,24)"),"catalogue search rendering must stay bounded");
assert(js.includes("submission_key:ensureSubmissionKey()"),"client idempotency key missing");
assert(sql.includes("wholesale_leads_submission_key_idx"),"server idempotency unique index missing");
assert(sql.includes("private.submit_wholesale_enquiry_idempotent"),"idempotent submission routine missing");
assert(sql.includes("revoke execute on function private.submit_wholesale_enquiry_core(jsonb) from anon,authenticated"),"anonymous callers can bypass validated idempotent submission");
assert(sql.includes("grant execute on function private.submit_wholesale_enquiry_idempotent(jsonb) to anon,authenticated"),"controlled private retry helper grant missing");
assert(/create or replace function public\.submit_wholesale_enquiry\(p jsonb\)[\s\S]*?security invoker/i.test(sql),"public submission wrapper must remain security invoker");
assert(sql.includes("regexp_replace(phone,'[^0-9]','','g')"),"international phone normalization fix missing");
assert(admin.includes("wholesale_lead_items(*)"),"admin lead items relationship missing");
assert(admin.includes("next_follow_up_at"),"admin follow-up workflow missing");
console.log("Wholesale static regression passed: localized RFQ, bounded catalogue picker, CRM and RLS guards.");

assert(!html.includes('href="#wholesale-request" data-t="requestPricing"'),"fragment-only Wholesale CTA must not be used with <base href=\"/\"> because it resolves to the homepage");
