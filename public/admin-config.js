/* Zayt w Mouneh owner dashboard connection.
   Only PUBLIC Supabase values belong here. Never put a secret/service-role key in browser code. */
window.ZWM_CMS_CONFIG = Object.freeze({
  enabled: true,
  version: "2026-10-04",
  supabaseUrl: "https://mraobsbgrtmgpdjqjrzr.supabase.co",
  supabasePublishableKey: "sb_publishable_6vBP0VO4UaoULK05ry0bvw_GGuPtVwb",
  bootstrapFunction: "bootstrap-owner",
  tables: Object.freeze({
    admins: "admin_users",
    products: "product_overrides",
    settings: "site_settings",
    events: "site_events",
    activity: "admin_activity",
    orders: "orders"
  }),
  storageBucket: "product-images",
  analytics: Object.freeze({
    enabled: true,
    retentionDays: 90
  })
});
