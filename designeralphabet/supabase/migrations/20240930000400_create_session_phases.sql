create table if not exists public.session_phases (
  id uuid primary key default gen_random_uuid(),
  session_code text references public.sessions(code) on delete cascade,
  phase_key text,
  title text,
  description text,
  order_index integer,
  duration_minutes integer,
  dashboards jsonb default '[]'::jsonb,
  status text check (status in ('pending','active','completed')) default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_session_phases_session_code on public.session_phases(session_code);
create index if not exists idx_session_phases_status on public.session_phases(status);
