alter table if exists public.sessions
  add column if not exists facilitator_email text;
