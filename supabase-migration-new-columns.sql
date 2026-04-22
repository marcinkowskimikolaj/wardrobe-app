-- Migracja: nowe pola AI (uruchom w Supabase SQL Editor)
-- https://supabase.com/dashboard/project/altitfgqnxnohiqdkmrq/sql/new

ALTER TABLE public.clothes
  ADD COLUMN IF NOT EXISTS subcategory    text,
  ADD COLUMN IF NOT EXISTS occasion       text[],
  ADD COLUMN IF NOT EXISTS warmth_level   smallint,
  ADD COLUMN IF NOT EXISTS formality_score smallint,
  ADD COLUMN IF NOT EXISTS texture        text;
