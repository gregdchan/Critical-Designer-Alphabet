-- Critical Designer Alphabet Workshop Database Schema
-- MariaDB/MySQL compatible

CREATE DATABASE IF NOT EXISTS critical_designer_alphabet;
USE critical_designer_alphabet;

CREATE TABLE IF NOT EXISTS sessions (
  code VARCHAR(16) PRIMARY KEY,
  title VARCHAR(255),
  template_id VARCHAR(64),
  facilitator_email VARCHAR(255),
  challenge TEXT,
  active_round VARCHAR(128),
  round_expires_at TIMESTAMP NULL,
  status ENUM('planned','live','done') DEFAULT 'planned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(16),
  name VARCHAR(128),
  role ENUM('facilitator','participant'),
  color VARCHAR(16),
  points INT DEFAULT 0,
  badges JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_code) REFERENCES sessions(code) ON DELETE CASCADE,
  INDEX idx_participants_room_code (room_code)
);

CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(16),
  section VARCHAR(64),
  text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_code) REFERENCES sessions(code) ON DELETE CASCADE,
  INDEX idx_questions_room_code (room_code)
);

CREATE TABLE IF NOT EXISTS responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(16),
  question_id INT,
  participant_id INT,
  text TEXT,
  cards JSON,
  votes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_code) REFERENCES sessions(code) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL,
  INDEX idx_responses_room_code (room_code)
);

CREATE TABLE IF NOT EXISTS timeline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(16),
  label ENUM('Now','Next','Later'),
  item_text TEXT,
  owner VARCHAR(128),
  metric VARCHAR(128),
  risk_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_code) REFERENCES sessions(code) ON DELETE CASCADE,
  INDEX idx_timeline_room_code (room_code)
);

CREATE TABLE IF NOT EXISTS chat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(16),
  participant_id INT,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_code) REFERENCES sessions(code) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL,
  INDEX idx_chat_room_code (room_code)
);

CREATE TABLE IF NOT EXISTS session_phases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_code VARCHAR(16),
  phase_key VARCHAR(64),
  title VARCHAR(255),
  description TEXT,
  order_index INT,
  duration_minutes INT,
  dashboards JSON,
  status ENUM('pending','active','completed') DEFAULT 'pending',
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_code) REFERENCES sessions(code) ON DELETE CASCADE,
  INDEX idx_session_phases_session_code (session_code)
);
