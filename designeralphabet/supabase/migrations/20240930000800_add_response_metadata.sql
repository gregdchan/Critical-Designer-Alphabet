alter table if exists public.responses
  add column if not exists metadata jsonb default '{}'::jsonb;
