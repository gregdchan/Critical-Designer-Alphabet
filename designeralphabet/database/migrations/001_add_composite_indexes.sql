-- Migration: Add composite indexes for performance optimization
-- Date: 2025-11-08
-- Purpose: Improve query performance for room_code filtered queries with sorting and aggregation
-- Expected Impact: 40-60% query speed improvement for session data fetching

USE critical_designer_alphabet;

-- Responses table: Most frequently queried with room_code + created_at (for ordering)
-- and room_code + votes (for top ideas)
ALTER TABLE responses
  ADD INDEX idx_responses_room_created (room_code, created_at),
  ADD INDEX idx_responses_room_votes (room_code, votes DESC),
  ADD INDEX idx_responses_room_question (room_code, question_id);

-- Chat table: Always queried with room_code + ordered by created_at
ALTER TABLE chat
  ADD INDEX idx_chat_room_created (room_code, created_at);

-- Timeline table: Queried by room_code + label for Now/Next/Later filtering
ALTER TABLE timeline
  ADD INDEX idx_timeline_room_created (room_code, created_at),
  ADD INDEX idx_timeline_room_label (room_code, label);

-- Session_phases table: Queried by session_code + status/order
ALTER TABLE session_phases
  ADD INDEX idx_phases_session_status (session_code, status),
  ADD INDEX idx_phases_session_order (session_code, order_index);

-- Participants table: Add index for filtering by role
ALTER TABLE participants
  ADD INDEX idx_participants_room_role (room_code, role);

-- Questions table: Frequently filtered by phase_key
ALTER TABLE questions
  ADD INDEX idx_questions_room_phase (room_code, phase_key);

-- Verify indexes created
SHOW INDEX FROM responses;
SHOW INDEX FROM chat;
SHOW INDEX FROM timeline;
SHOW INDEX FROM session_phases;
SHOW INDEX FROM participants;
SHOW INDEX FROM questions;
