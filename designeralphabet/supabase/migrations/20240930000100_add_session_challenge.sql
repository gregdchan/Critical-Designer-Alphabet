alter table if exists public.sessions
  add column if not exists challenge text;
