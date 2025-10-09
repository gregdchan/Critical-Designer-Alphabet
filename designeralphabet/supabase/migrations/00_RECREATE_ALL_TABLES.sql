-- EMERGENCY RECREATION OF ALL TABLES
-- Run this in Supabase SQL Editor if you accidentally deleted tables

-- First, drop everything cleanly (in reverse dependency order)
DROP TABLE IF EXISTS public.chat CASCADE;
DROP TABLE IF EXISTS public.timeline CASCADE;
DROP TABLE IF EXISTS public.responses CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.session_phases CASCADE;
DROP TABLE IF EXISTS public.participants CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;

-- Now recreate everything in the correct order

-- 1. Sessions table
CREATE TABLE public.sessions (
  code text PRIMARY KEY,
  title text,
  template_slug text,
  challenge text,
  facilitator_email text,
  active_phase_key text,
  active_round text,
  round_expires_at timestamptz,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'live', 'done')),
  created_at timestamptz DEFAULT now()
);

-- 2. Participants table
CREATE TABLE public.participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text REFERENCES public.sessions(code) ON DELETE CASCADE,
  name text NOT NULL,
  role text CHECK (role IN ('facilitator', 'participant')) DEFAULT 'participant',
  color text,
  points int DEFAULT 0,
  badges jsonb DEFAULT '[]'::jsonb,
  email VARCHAR(255),
  device_id VARCHAR(255),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_participants_room_code ON public.participants(room_code);
CREATE INDEX idx_participants_email ON public.participants(email);
CREATE INDEX idx_participants_device_id ON public.participants(device_id);
CREATE UNIQUE INDEX idx_participants_email_room ON public.participants(email, room_code) WHERE email IS NOT NULL;

-- 3. Questions table
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text REFERENCES public.sessions(code) ON DELETE CASCADE,
  section text,
  phase_key text,
  text text NOT NULL,
  lens text,
  response_type text,
  map_type text,
  config jsonb,
  order_index integer,
  recommended_dashboards jsonb DEFAULT '[]'::jsonb,
  enable_voting boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_questions_room_code ON public.questions(room_code);
CREATE INDEX idx_questions_phase_key ON public.questions(phase_key);

-- 4. Responses table
CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text REFERENCES public.sessions(code) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES public.participants(id) ON DELETE CASCADE,
  text text NOT NULL,
  cards jsonb DEFAULT '[]'::jsonb,
  votes int DEFAULT 0,
  lens text,
  maturity text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_responses_room_code ON public.responses(room_code);
CREATE INDEX idx_responses_question_id ON public.responses(question_id);
CREATE INDEX idx_responses_participant_id ON public.responses(participant_id);

-- 5. Timeline table
CREATE TABLE public.timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text REFERENCES public.sessions(code) ON DELETE CASCADE,
  label text CHECK (label IN ('Now', 'Next', 'Later')),
  item_text text NOT NULL,
  owner text,
  metric text,
  risk_note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_timeline_room_code ON public.timeline(room_code);

-- 6. Chat table
CREATE TABLE public.chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text REFERENCES public.sessions(code) ON DELETE CASCADE,
  participant_id uuid REFERENCES public.participants(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_chat_room_code ON public.chat(room_code);

-- 7. Session Phases table
CREATE TABLE public.session_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code text REFERENCES public.sessions(code) ON DELETE CASCADE,
  phase_key text,
  title text,
  description text,
  order_index integer,
  duration_minutes integer,
  dashboards jsonb DEFAULT '[]'::jsonb,
  status text CHECK (status IN ('pending', 'active', 'completed')) DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_session_phases_session_code ON public.session_phases(session_code);
CREATE INDEX idx_session_phases_status ON public.session_phases(status);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_phases;

-- Enable Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_phases ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (allowing all operations for now - you can restrict later)

-- Sessions policies
DROP POLICY IF EXISTS "read sessions" ON public.sessions;
CREATE POLICY "read sessions" ON public.sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "write sessions" ON public.sessions;
CREATE POLICY "write sessions" ON public.sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "update sessions" ON public.sessions;
CREATE POLICY "update sessions" ON public.sessions FOR UPDATE USING (true) WITH CHECK (true);

-- Participants policies
DROP POLICY IF EXISTS "read participants" ON public.participants;
CREATE POLICY "read participants" ON public.participants FOR SELECT USING (true);
DROP POLICY IF EXISTS "insert participants" ON public.participants;
CREATE POLICY "insert participants" ON public.participants FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "update participants" ON public.participants;
CREATE POLICY "update participants" ON public.participants FOR UPDATE USING (true) WITH CHECK (true);

-- Questions policies
DROP POLICY IF EXISTS "read questions" ON public.questions;
CREATE POLICY "read questions" ON public.questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "write questions" ON public.questions;
CREATE POLICY "write questions" ON public.questions FOR INSERT WITH CHECK (true);

-- Responses policies
DROP POLICY IF EXISTS "read responses" ON public.responses;
CREATE POLICY "read responses" ON public.responses FOR SELECT USING (true);
DROP POLICY IF EXISTS "write responses" ON public.responses;
CREATE POLICY "write responses" ON public.responses FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "update responses" ON public.responses;
CREATE POLICY "update responses" ON public.responses FOR UPDATE USING (true) WITH CHECK (true);

-- Timeline policies
DROP POLICY IF EXISTS "read timeline" ON public.timeline;
CREATE POLICY "read timeline" ON public.timeline FOR SELECT USING (true);
DROP POLICY IF EXISTS "write timeline" ON public.timeline;
CREATE POLICY "write timeline" ON public.timeline FOR INSERT WITH CHECK (true);

-- Chat policies
DROP POLICY IF EXISTS "read chat" ON public.chat;
CREATE POLICY "read chat" ON public.chat FOR SELECT USING (true);
DROP POLICY IF EXISTS "write chat" ON public.chat;
CREATE POLICY "write chat" ON public.chat FOR INSERT WITH CHECK (true);

-- Session phases policies
DROP POLICY IF EXISTS "read session_phases" ON public.session_phases;
CREATE POLICY "read session_phases" ON public.session_phases FOR SELECT USING (true);
DROP POLICY IF EXISTS "insert session_phases" ON public.session_phases;
CREATE POLICY "insert session_phases" ON public.session_phases FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "update session_phases" ON public.session_phases;
CREATE POLICY "update session_phases" ON public.session_phases FOR UPDATE USING (true) WITH CHECK (true);
