/* Zayt w Mouneh owner dashboard connection.
   Only put PUBLIC Supabase values here. Never put a secret/service-role key in browser code.
   This file is intentionally disabled until a dedicated Zayt w Mouneh backend is connected. */
window.ZWM_CMS_CONFIG = Object.freeze({
  enabled: false,
  version: "2026-10-04",
  supabaseUrl: "",
  supabasePublishableKey: "",
  tables: Object.freeze({
    admins: "admin_users",
    products: "product_overrides",
    settings: "site_settings",
    events: "site_events",
    activity: "admin_activity"
  }),
  storageBucket: "product-images",
  analytics: Object.freeze({
    enabled: true,
    retentionDays: 90
  })
});
