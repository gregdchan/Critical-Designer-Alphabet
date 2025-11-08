-- Migration: Add composite indexes for performance optimization
-- Date: 2025-11-08
-- Purpose: Improve query performance for room_code filtered queries with sorting and aggregation
-- Expected Impact: 40-60% query speed improvement for session data fetching
-- Database: PostgreSQL (Supabase)

-- Responses table: Most frequently queried with room_code + created_at (for ordering)
-- and room_code + votes (for top ideas)
CREATE INDEX IF NOT EXISTS idx_responses_room_created ON responses (room_code, created_at);
CREATE INDEX IF NOT EXISTS idx_responses_room_votes ON responses (room_code, votes DESC);
CREATE INDEX IF NOT EXISTS idx_responses_room_question ON responses (room_code, question_id);

-- Chat table: Always queried with room_code + ordered by created_at
CREATE INDEX IF NOT EXISTS idx_chat_room_created ON chat (room_code, created_at);

-- Timeline table: Queried by room_code + label for Now/Next/Later filtering
CREATE INDEX IF NOT EXISTS idx_timeline_room_created ON timeline (room_code, created_at);
CREATE INDEX IF NOT EXISTS idx_timeline_room_label ON timeline (room_code, label);

-- Session_phases table: Queried by session_code + status/order
CREATE INDEX IF NOT EXISTS idx_phases_session_status ON session_phases (session_code, status);
CREATE INDEX IF NOT EXISTS idx_phases_session_order ON session_phases (session_code, order_index);

-- Participants table: Add index for filtering by role
CREATE INDEX IF NOT EXISTS idx_participants_room_role ON participants (room_code, role);

-- Questions table: Frequently filtered by phase_key
CREATE INDEX IF NOT EXISTS idx_questions_room_phase ON questions (room_code, phase_key);

-- Verify indexes created (run separately in Supabase SQL editor)
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('responses', 'chat', 'timeline', 'session_phases', 'participants', 'questions') ORDER BY tablename, indexname;
