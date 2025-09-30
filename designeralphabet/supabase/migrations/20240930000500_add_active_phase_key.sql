alter table if exists public.sessions
  add column if not exists active_phase_key text;
