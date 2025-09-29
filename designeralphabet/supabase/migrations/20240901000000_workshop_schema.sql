-- Workshop platform schema for Supabase
create table if not exists sessions (
  code text primary key,
  title text,
  template_slug text,
  status text default 'planned',
  created_at timestamptz default now()
);

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
create index on participants(room_code);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  room_code text references sessions(code) on delete cascade,
  section text,
  text text not null,
  created_at timestamptz default now()
);
create index on questions(room_code);

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
create index on responses(room_code);
create index on responses(question_id);

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
create index on timeline(room_code);

create table if not exists chat (
  id uuid primary key default gen_random_uuid(),
  room_code text references sessions(code) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  message text not null,
  created_at timestamptz default now()
);
create index on chat(room_code);

alter publication supabase_realtime add table sessions, participants, questions, responses, timeline, chat;

alter table sessions enable row level security;
alter table participants enable row level security;
alter table questions enable row level security;
alter table responses enable row level security;
alter table timeline enable row level security;
alter table chat enable row level security;

create policy "read sessions" on sessions for select using (true);
create policy "write sessions" on sessions for insert with check (true);
create policy "update sessions" on sessions for update using (true) with check (true);

create policy "read participants" on participants for select using (true);
create policy "insert participants" on participants for insert with check (true);
create policy "update participants" on participants for update using (true) with check (true);

create policy "read questions" on questions for select using (true);
create policy "write questions" on questions for insert with check (true);

create policy "read responses" on responses for select using (true);
create policy "write responses" on responses for insert with check (true);
create policy "update responses" on responses for update using (true) with check (true);

create policy "read timeline" on timeline for select using (true);
create policy "write timeline" on timeline for insert with check (true);

create policy "read chat" on chat for select using (true);
create policy "write chat" on chat for insert with check (true);
