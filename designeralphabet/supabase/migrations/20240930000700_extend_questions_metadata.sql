alter table if exists public.questions
  add column if not exists lens text,
  add column if not exists response_type text,
  add column if not exists map_type text,
  add column if not exists config jsonb default '{}'::jsonb,
  add column if not exists order_index integer,
  add column if not exists recommended_dashboards jsonb default '[]'::jsonb;

create index if not exists idx_questions_order on public.questions(room_code, order_index);
