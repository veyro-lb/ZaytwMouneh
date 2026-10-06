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
(function(){
  function loadAdminNotifications(){
    if(!document.body||!document.body.classList.contains("admin-body"))return;
    if(!document.querySelector('link[href*="notifications-v1.css"]')){
      const l=document.createElement("link");l.rel="stylesheet";l.href="/notifications-v1.css?v=20261006-mobileaudit1";document.head.appendChild(l);
    }
    if(!document.querySelector('script[src*="admin-notifications-v1.js"]')){
      const s=document.createElement("script");s.src="/admin-notifications-v1.js?v=20261006-notificationhardening1";s.async=false;document.head.appendChild(s);
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",loadAdminNotifications,{once:true});
  else loadAdminNotifications();
})();