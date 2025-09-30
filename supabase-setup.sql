-- Critical Designer Alphabet - Supabase Database Setup
-- Run this in your Supabase SQL Editor to create all required tables

-- ===========================================
-- 📋 Core Tables
-- ===========================================

-- Sessions table: Stores workshop sessions
create table if not exists sessions (
  code text primary key,
  title text,
  template_slug text,
  status text check (status in ('planned', 'live', 'done')) default 'planned',
  created_at timestamptz default now()
);

-- Participants table: Users in workshop sessions
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  room_code text references sessions(code) on delete cascade,
  name text not null,
  role text check (role in ('facilitator','participant')) default 'participant',
  color text,
  points int default 0,
  badges jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Questions table: Workshop prompts and questions
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  room_code text references sessions(code) on delete cascade,
  section text,
  text text not null,
  created_at timestamptz default now()
);

-- Responses table: Participant answers to questions
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  room_code text references sessions(code) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  text text not null,
  cards jsonb default '[]'::jsonb,
  votes int default 0,
  created_at timestamptz default now()
);

-- Timeline table: Now/Next/Later roadmap items
create table if not exists timeline (
  id uuid primary key default gen_random_uuid(),
  room_code text references sessions(code) on delete cascade,
  label text check (label in ('Now','Next','Later')),
  item_text text not null,
  owner text,
  metric text,
  risk_note text,
  created_at timestamptz default now()
);

-- Chat table: Real-time messaging during sessions
create table if not exists chat (
  id uuid primary key default gen_random_uuid(),
  room_code text references sessions(code) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  message text not null,
  created_at timestamptz default now()
);

-- ===========================================
-- 📊 Performance Indexes
-- ===========================================

create index if not exists idx_participants_room_code on participants(room_code);
create index if not exists idx_questions_room_code on questions(room_code);
create index if not exists idx_responses_room_code on responses(room_code);
create index if not exists idx_responses_question_id on responses(question_id);
create index if not exists idx_timeline_room_code on timeline(room_code);
create index if not exists idx_chat_room_code on chat(room_code);

-- ===========================================
-- 🔄 Real-time Subscriptions
-- ===========================================

-- Enable real-time for all tables
alter publication supabase_realtime add table sessions, participants, questions, responses, timeline, chat;

-- ===========================================
-- 🔒 Row Level Security (RLS)
-- ===========================================

-- Enable RLS on all tables
alter table sessions enable row level security;
alter table participants enable row level security;
alter table questions enable row level security;
alter table responses enable row level security;
alter table timeline enable row level security;
alter table chat enable row level security;

-- Sessions policies (open for workshop access)
create policy "read_sessions" on sessions for select using (true);
create policy "write_sessions" on sessions for insert with check (true);
create policy "update_sessions" on sessions for update using (true) with check (true);

-- Participants policies
create policy "read_participants" on participants for select using (true);
create policy "insert_participants" on participants for insert with check (true);
create policy "update_participants" on participants for update using (true) with check (true);

-- Questions policies
create policy "read_questions" on questions for select using (true);
create policy "write_questions" on questions for insert with check (true);

-- Responses policies
create policy "read_responses" on responses for select using (true);
create policy "write_responses" on responses for insert with check (true);
create policy "update_responses" on responses for update using (true) with check (true);

-- Timeline policies
create policy "read_timeline" on timeline for select using (true);
create policy "write_timeline" on timeline for insert with check (true);

-- Chat policies
create policy "read_chat" on chat for select using (true);
create policy "write_chat" on chat for insert with check (true);

-- ===========================================
-- 🧪 Test Data (Optional)
-- ===========================================

-- Insert a test session
insert into sessions (code, title, template_slug, status)
values ('TEST123', 'Sample AI Confidence Workshop', 'default-template', 'planned')
on conflict (code) do nothing;

-- Insert a test facilitator
insert into participants (room_code, name, role, color, points)
values ('TEST123', 'Workshop Facilitator', 'facilitator', '#ff00ff', 0)
on conflict do nothing;

-- Insert sample questions
insert into questions (room_code, section, text) values
  ('TEST123', 'Risk Assessment', 'What are the main risks of AI in your domain?'),
  ('TEST123', 'Sustainability', 'How can AI support long-term sustainability goals?'),
  ('TEST123', 'Ethics', 'What ethical considerations should guide AI development?')
on conflict do nothing;

-- ===========================================
-- ✅ Verification Queries
-- ===========================================

-- Check if tables were created successfully
select
  table_name,
  table_type
from information_schema.tables
where table_schema = 'public'
  and table_name in ('sessions', 'participants', 'questions', 'responses', 'timeline', 'chat')
order by table_name;

-- Check RLS status
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('sessions', 'participants', 'questions', 'responses', 'timeline', 'chat')
order by tablename;