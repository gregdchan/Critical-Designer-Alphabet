alter table if exists public.questions
  add column if not exists phase_key text;

alter table if exists public.session_phases
  add column if not exists cards jsonb default '[]'::jsonb;
