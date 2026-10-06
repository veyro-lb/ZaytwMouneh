const fs=require("node:fs");
const assert=require("node:assert/strict");
const path=require("node:path");

const root=process.cwd();
const pub=path.join(root,"public");
const read=name=>fs.readFileSync(path.join(pub,name),"utf8");
const checkoutHtml=read("checkout.html");
const checkoutJs=read("checkout.js");
const commerceCss=read("commerce-v1.css");
const orderJs=read("order.js");
const customerOrders=read("customer-orders-v1.js");
const commerceJs=read("commerce-v1.js");
const migration=fs.readFileSync(path.join(root,"supabase","migrations","20261004153222_native_checkout_orders_v1.sql"),"utf8");

assert(checkoutHtml.includes("Cash on Delivery"),"checkout must present Cash on Delivery");
assert(checkoutHtml.includes("Payment is made in cash when your order is delivered."),"checkout must explain COD");
assert(checkoutHtml.includes("checkout-pay-note"),"checkout total must explain when payment is due");
assert(checkoutHtml.includes('id="summaryGift"'),"gift metadata summary slot missing");
assert(checkoutHtml.includes('id="cartIssueBox"'),"cart integrity alert missing");
assert(!checkoutHtml.includes("More payment methods can be added later"),"developer payment roadmap copy returned");
assert(!/Visa|Mastercard|Apple Pay|Google Pay|Stripe|PayPal|Whish|OMT/.test(checkoutHtml),"unimplemented payment method shown in checkout");
assert(!/name=["']payment["']/.test(checkoutHtml),"single COD method should not render a fake choice");

assert(/font-size:16px/.test(commerceCss),"checkout controls must use a mobile-safe 16px font");
for(const token of ["checkout-field-error","summary-item-photo","checkout-cart-issue","checkout-pay-note"])assert(commerceCss.includes(token),"missing commerce style: "+token);

for(const token of [
  "AbortController","controller.abort()","20000","networkError.retryable=true",
  "cartIssues","invalid_quantity","normalizePhone","validateCheckout",
  "checkout-field-error","summary-item-photo",'payment_method:"cash_on_delivery"',
  "request_id:a.request_id","sessionStorage.setItem(REQUEST_KEY",
  'location.replace("/order?ref="'
])assert(checkoutJs.includes(token),"checkout hardening token missing: "+token);

const submitCall='rpc("zwm_checkout",{action:"submit",p:payload})';
assert.equal((checkoutJs.split(submitCall).length-1),2,"network retry must reuse the exact checkout payload");
assert(checkoutJs.indexOf("if(!result||!result.reference)")<checkoutJs.indexOf('remove(state.kind==="gift"?GIFT_KEY:CART_KEY)'),"cart must not clear before definite order success");
assert(checkoutJs.includes("Your cart changed or contains invalid data."),"stale cart review path missing");
assert(checkoutJs.includes("Impossible de passer la commande"),"French checkout failure copy missing");
assert(checkoutJs.includes("We couldn’t place the order right now. Your cart and details are still here"),"safe generic failure copy missing");

assert(orderJs.includes('tr("Cash on Delivery","الدفع عند الاستلام","Paiement à la livraison")'),"order COD label localization missing");
assert(orderJs.includes('tr("Due on delivery","مستحق عند الاستلام","À payer à la livraison")'),"COD pending state must mean due on delivery");
assert(orderJs.includes("Commande reçue"),"French order status copy missing");
assert(orderJs.includes("We received your order. We’ll prepare it and contact you only if needed."),"confirmation next-step copy missing");
assert(orderJs.includes('location.href="/shop?open=cart"'),"reorder must use clean shop route");
assert(!customerOrders.includes("/order.html?ref="),"customer order history still links to .html order URL");
assert(!customerOrders.includes("/shop.html"),"customer order history still links to .html shop URL");
assert(!commerceJs.includes("/order.html?ref="),"native account order enhancer still links to .html order URL");

assert(migration.includes("orders_idempotency_key_uidx"),"database idempotency unique index missing");
assert(migration.includes("create unique index if not exists orders_idempotency_key_uidx"),"database idempotency must be unique");
assert(migration.includes("where idempotency_key=req"),"checkout RPC must look up an existing request key");
assert(migration.includes("if found then"),"checkout RPC must return an existing idempotent order");
assert(migration.includes("payment_method"),"checkout RPC payment validation missing");
assert(migration.includes("cash_on_delivery"),"server must enforce COD reality");

console.log("Checkout commerce regression passed: COD clarity, mobile form safety, cart integrity, idempotent retry, confirmation and clean routes.");
