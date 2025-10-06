-- Critical Designer Alphabet Workshop Platform
-- Supabase Setup for: https://difwgczqmftehbyohkwe.supabase.co
-- Created: 2025-01-27

-- ===========================================
-- 🗂️ DROP EXISTING TABLES (if any)
-- ===========================================
-- Uncomment if you need to start fresh
-- DROP TABLE IF EXISTS chat CASCADE;
-- DROP TABLE IF EXISTS timeline CASCADE;
-- DROP TABLE IF EXISTS responses CASCADE;
-- DROP TABLE IF EXISTS questions CASCADE;
-- DROP TABLE IF EXISTS participants CASCADE;
-- DROP TABLE IF EXISTS sessions CASCADE;

-- ===========================================
-- 📋 CORE WORKSHOP TABLES
-- ===========================================

-- Sessions: Workshop instances
CREATE TABLE IF NOT EXISTS sessions (
  code text PRIMARY KEY CHECK (length(code) >= 3 AND length(code) <= 16),
  title text NOT NULL,
  template_slug text,
  status text CHECK (status IN ('planned', 'live', 'done')) DEFAULT 'planned',
  created_at timestamptz DEFAULT now()
);

-- Participants: Users in workshops
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES sessions(code) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  role text CHECK (role IN ('facilitator', 'participant')) DEFAULT 'participant',
  color text DEFAULT '#06b6d4',
  points int DEFAULT 0 CHECK (points >= 0),
  badges jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Questions: Workshop prompts and discussion topics
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES sessions(code) ON DELETE CASCADE,
  section text,
  text text NOT NULL CHECK (length(trim(text)) > 0),
  lens text,
  response_type text,
  map_type text,
  config jsonb DEFAULT '{}'::jsonb,
  order_index integer,
  recommended_dashboards jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Responses: Participant answers and contributions
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES sessions(code) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (length(trim(text)) > 0),
  cards jsonb DEFAULT '[]'::jsonb,
  votes int DEFAULT 0 CHECK (votes >= 0),
  created_at timestamptz DEFAULT now()
);

-- Timeline: Now/Next/Later roadmap items
CREATE TABLE IF NOT EXISTS timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES sessions(code) ON DELETE CASCADE,
  label text CHECK (label IN ('Now', 'Next', 'Later')) NOT NULL,
  item_text text NOT NULL CHECK (length(trim(item_text)) > 0),
  owner text,
  metric text,
  risk_note text,
  created_at timestamptz DEFAULT now()
);

-- Chat: Real-time messaging during workshops
CREATE TABLE IF NOT EXISTS chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES sessions(code) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (length(trim(message)) > 0),
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- 🚀 PERFORMANCE INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_participants_room_code ON participants(room_code);
CREATE INDEX IF NOT EXISTS idx_participants_role ON participants(role);
CREATE INDEX IF NOT EXISTS idx_questions_room_code ON questions(room_code);
CREATE INDEX IF NOT EXISTS idx_responses_room_code ON responses(room_code);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON responses(question_id);
CREATE INDEX IF NOT EXISTS idx_responses_participant_id ON responses(participant_id);
CREATE INDEX IF NOT EXISTS idx_timeline_room_code ON timeline(room_code);
CREATE INDEX IF NOT EXISTS idx_timeline_label ON timeline(label);
CREATE INDEX IF NOT EXISTS idx_chat_room_code ON chat(room_code);
CREATE INDEX IF NOT EXISTS idx_chat_participant_id ON chat(participant_id);

-- Time-based indexes for ordering
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_participants_created_at ON participants(created_at);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON timeline(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat(created_at);

-- ===========================================
-- 🔄 ENABLE REAL-TIME SUBSCRIPTIONS
-- ===========================================

-- Add all tables to real-time publication
ALTER publication supabase_realtime ADD TABLE sessions, participants, questions, responses, timeline, chat;

-- ===========================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat ENABLE ROW LEVEL SECURITY;

-- Sessions policies - Allow public workshop access
CREATE POLICY "sessions_select" ON sessions FOR SELECT USING (true);
CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_update" ON sessions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "sessions_delete" ON sessions FOR DELETE USING (true);

-- Participants policies
CREATE POLICY "participants_select" ON participants FOR SELECT USING (true);
CREATE POLICY "participants_insert" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "participants_update" ON participants FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "participants_delete" ON participants FOR DELETE USING (true);

-- Questions policies
CREATE POLICY "questions_select" ON questions FOR SELECT USING (true);
CREATE POLICY "questions_insert" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "questions_update" ON questions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "questions_delete" ON questions FOR DELETE USING (true);

-- Responses policies
CREATE POLICY "responses_select" ON responses FOR SELECT USING (true);
CREATE POLICY "responses_insert" ON responses FOR INSERT WITH CHECK (true);
CREATE POLICY "responses_update" ON responses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "responses_delete" ON responses FOR DELETE USING (true);

-- Timeline policies
CREATE POLICY "timeline_select" ON timeline FOR SELECT USING (true);
CREATE POLICY "timeline_insert" ON timeline FOR INSERT WITH CHECK (true);
CREATE POLICY "timeline_update" ON timeline FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "timeline_delete" ON timeline FOR DELETE USING (true);

-- Chat policies
CREATE POLICY "chat_select" ON chat FOR SELECT USING (true);
CREATE POLICY "chat_insert" ON chat FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_update" ON chat FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "chat_delete" ON chat FOR DELETE USING (true);

-- ===========================================
-- 🧪 TEST DATA
-- ===========================================

-- Insert sample session
INSERT INTO sessions (code, title, template_slug, status)
VALUES ('DEMO123', 'AI Confidence Workshop Demo', 'default-template', 'planned')
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  template_slug = EXCLUDED.template_slug;

-- Insert facilitator
INSERT INTO participants (room_code, name, role, color, points)
VALUES ('DEMO123', 'Workshop Facilitator', 'facilitator', '#ff00ff', 0)
ON CONFLICT DO NOTHING;

-- Insert sample questions
INSERT INTO questions (room_code, section, text) VALUES
  ('DEMO123', 'Risk Assessment', 'What are the primary risks of AI in your work domain?'),
  ('DEMO123', 'Sustainability', 'How can AI support long-term sustainability goals?'),
  ('DEMO123', 'Ethics', 'What ethical considerations should guide AI development?'),
  ('DEMO123', 'Community Impact', 'How will AI affect community relationships and dynamics?')
ON CONFLICT DO NOTHING;

-- ===========================================
-- 📊 HELPFUL VIEWS
-- ===========================================

-- Session summary view
CREATE OR REPLACE VIEW session_summary AS
SELECT
  s.code,
  s.title,
  s.status,
  s.created_at,
  COUNT(DISTINCT p.id) as participant_count,
  COUNT(DISTINCT q.id) as question_count,
  COUNT(DISTINCT r.id) as response_count,
  COUNT(DISTINCT t.id) as timeline_count,
  COUNT(DISTINCT c.id) as message_count
FROM sessions s
LEFT JOIN participants p ON s.code = p.room_code
LEFT JOIN questions q ON s.code = q.room_code
LEFT JOIN responses r ON s.code = r.room_code
LEFT JOIN timeline t ON s.code = t.room_code
LEFT JOIN chat c ON s.code = c.room_code
GROUP BY s.code, s.title, s.status, s.created_at
ORDER BY s.created_at DESC;

-- ===========================================
-- ✅ VERIFICATION QUERIES
-- ===========================================

-- Check table creation
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sessions', 'participants', 'questions', 'responses', 'timeline', 'chat')
ORDER BY table_name;

-- Check RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('sessions', 'participants', 'questions', 'responses', 'timeline', 'chat')
ORDER BY tablename;

-- Check real-time publication
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('sessions', 'participants', 'questions', 'responses', 'timeline', 'chat')
ORDER BY tablename;

-- Test query: Check demo data
SELECT
  'sessions' as table_name,
  count(*) as record_count
FROM sessions WHERE code = 'DEMO123'
UNION ALL
SELECT
  'participants',
  count(*)
FROM participants WHERE room_code = 'DEMO123'
UNION ALL
SELECT
  'questions',
  count(*)
FROM questions WHERE room_code = 'DEMO123';

-- ===========================================
-- 🎉 SETUP COMPLETE!
-- ===========================================

-- Your workshop platform database is now ready!
-- Next steps:
-- 1. Update your service role key in .env
-- 2. Restart your Docker containers
-- 3. Test session creation at http://localhost:3000/facilitator