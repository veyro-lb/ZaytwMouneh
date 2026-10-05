/* Zayt w Mouneh owner dashboard connection.
   Only PUBLIC Supabase values belong here. Never put a secret/service-role key in browser code. */
window.ZWM_CMS_CONFIG = Object.freeze({
  enabled: true,
  version: "2026-10-05-wholesale1",
  supabaseUrl: "https://mraobsbgrtmgpdjqjrzr.supabase.co",
  supabasePublishableKey: "sb_publishable_6vBP0VO4UaoULK05ry0bvw_GGuPtVwb",
  tables: Object.freeze({
    admins: "admin_users",
    products: "product_overrides",
    settings: "site_settings",
    events: "site_events",
    activity: "admin_activity",
    orders: "orders",
    notes: "admin_notes",
    revisions: "product_revisions",
    backups: "admin_backups",
    wholesaleLeads: "wholesale_leads",
    wholesaleItems: "wholesale_lead_items"
  }),
  storageBucket: "product-images",
  analytics: Object.freeze({
    enabled: true,
    retentionDays: 90
  })
});
