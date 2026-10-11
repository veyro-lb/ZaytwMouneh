# Website audit — 11 October 2026

Baseline: `6877bd446b23d5d3c8e9ebb4da5469baa7804d7b` on `main`. Scope: promoted storefront, EN/AR/FR customer pages, mobile/tablet/desktop layouts, checkout loading and validation, account/auth code, admin synchronization, database access and delivery notifications.

## Findings and changes

| Area | Finding | Action / evidence |
| --- | --- | --- |
| Mobile checkout overlay | Source screenshots showed the floating Returns & Issues tab overlapping form fields. | Hide this duplicate floating tab on checkout; retain the footer Returns link and require the tab to be hidden in browser checks. |
| Checkout startup | Place Order was enabled in the initial HTML before its submission handler was attached. During slow initialization, the form could use native GET submission instead of the checkout API. | Disable the button in HTML, bind the submit handler at startup, and require readiness before accepting submission. |
| Checkout slow connections | Catalogue verification, optional account lookup and delivery-directory loading lacked bounded failure paths. | Abort the two JSON loaders after 20 seconds; settle directory loading after 10 seconds. Catalogue verification still blocks ordering and offers retry; optional identity lookup can fail without blocking the guest form. |
| Checkout regression coverage | Existing responsive checks could inspect an empty basket rather than the populated checkout form. | Seed one real catalogue item and return a valid mocked checkout configuration. Require the form and basket line to be visible. |
| Browser gate | The last full browser run was cancelled; affected-layout checks passed, but the complete result was unavailable. | Split the same Chromium/WebKit EN/AR/FR coverage across five viewport jobs: 360×800, 390×844, 430×932, 768×1024 and 1280×900. |
| Idle observer test | A 160ms measurement could count intentional footer setup scheduled at 500ms/1500ms. | Wait for those startup tasks, require a bounded quiet period, then retain the zero-idle-frame assertion. |

## Live backend and deployment evidence

- Supabase reports `ACTIVE_HEALTHY` for the selected Zayt W Mouneh project.
- All 23 public tables have row-level security enabled. Reviewed policies restrict admin data to owner membership and customer data to the relevant user/order relationship.
- `orders` and `notifications` are in the realtime publication. The admin client subscribes to orders, refreshes them every 30 seconds as a fallback, and reconciles other dashboard data on resume / every two minutes. Failed loads preserve prior data rather than replacing it with empty results.
- Live checkout configuration has delivery enabled, Sibline delivery at $3, other configured regions at $5, free delivery from $50 before discounts, and Cash on Delivery as the active payment method.
- The latest external public-domain probe passed HTTPS routes for home, shop, product, checkout, gifts, contact, account, language variants, seven SEO collections, robots and sitemap. It also verified `www`/HTTP redirects, guest checkout API configuration and storefront CORS without placing an order. [Run](https://github.com/veyro-lb/ZaytwMouneh/actions/runs/38128279907).
- Recent transactional email outbox records include five sent messages. Eight older dead records report `invalid_recipient_or_payload`; these were not resent or deleted during this audit.
- Flagged authenticated SECURITY DEFINER functions reviewed for order attention, return admin messaging and notification test status explicitly check owner/caller access and use an empty search path. The four no-policy advisory records are private internal tables. No access was widened to clear advisories.

## Catalogue review items

- 332 source products, 424 variants, 21 categories; structural validation passes.
- 290 products have exact matched photos, with no broken mapped assets. 42 lack an exact match and retain placeholders.
- The description check reports 49 holds and 280 eligible runtime descriptions. Resolve factual label questions using [the existing label review list](product-label-verification-requests-2026-10-10.csv).
- French names use the existing translation runtime; the structured `nameFr` field is absent from the source records. Translation coverage checks and visual EN/AR/FR checks are distinct.
- Display-name duplicates and one unknown unit remain catalogue review signals, not sufficient grounds to invent facts or delete products.

## Validation and limits

The checkout-loading behavioral test covers early submission, stalled catalogue/identity requests, directory timeout, catalogue retry, validation after recovery and cart preservation. It does not send orders. The existing regression suite covers cart integrity, idempotent retries, wholesale forms/admin actions, quick-view lifecycle, account layouts, session refresh, notifications, email rendering, localization, asset budgets and analytics.

Responsive browser checks use local source and mocked external APIs. They verify rendered layout/overflow and browser errors, not real customer credentials, payment execution, email inbox receipt or signed-in production dashboard behavior. A browser-family run is not a physical-device test.

The audit browser and this workspace receive a generic Site Unavailable response from the public hostname. External GitHub probes independently verified the actual storefront; this environment's response is not evidence of a customer outage. Direct visual inspection of the live site and a new real sign-in → order → admin confirmation cycle remain unverified. No customer records, account credentials, orders or notification deliveries were changed by audit probes. Supabase leaked-password checking was not enabled because the project uses the free-plan baseline recorded in `production-release-safety.md`.
