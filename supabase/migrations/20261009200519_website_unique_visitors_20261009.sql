-- First-party, pseudonymous visitor counting for the owner analytics dashboard.
-- A visitor ID is a random UUID stored only in the originating browser and
-- recorded on page_view events. Earlier events remain valid and readable.
alter table public.site_events
  add column if not exists visitor_id uuid;

comment on column public.site_events.visitor_id is
  'Random per-browser identifier for anonymous unique-visitor metrics. Only sent with page_view; null for historical events and clients without persistent storage.';
