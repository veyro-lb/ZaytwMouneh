-- Correct phone normalization in wholesale lead validation.
-- Use a character class rather than a backslash escape so valid Lebanese and
-- international punctuation (+, spaces, dashes, parentheses) is normalized safely.
alter table public.wholesale_leads drop constraint if exists wholesale_leads_phone_check;
alter table public.wholesale_leads add constraint wholesale_leads_phone_check
check (regexp_replace(phone,'[^0-9]','','g') ~ '^[0-9]{7,20}$');
