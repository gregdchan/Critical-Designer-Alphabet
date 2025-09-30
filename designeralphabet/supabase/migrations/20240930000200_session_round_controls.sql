alter table if exists public.sessions
  add column if not exists active_round text,
  add column if not exists round_expires_at timestamptz,
  add column if not exists cards jsonb;
