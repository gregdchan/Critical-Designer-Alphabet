-- Critical Designer Alphabet Workshop Database Schema
-- MariaDB/MySQL compatible

CREATE DATABASE IF NOT EXISTS critical_designer_alphabet;
USE critical_designer_alphabet;

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    code VARCHAR(10) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status ENUM('planned', 'live', 'done') DEFAULT 'planned',
    template_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_code VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('facilitator', 'participant') NOT NULL,
    color VARCHAR(20) NOT NULL,
    points INT DEFAULT 0,
    badges JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_code) REFERENCES sessions(code) ON DELETE CASCADE,
    INDEX idx_room_code (room_code)
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_code VARCHAR(10) NOT NULL,
    lens VARCHAR(50) NOT NULL, -- Risk, Work, Sustainability, Ethics
    type ENUM('usecase', 'concern', 'goal', 'metric') NOT NULL,
    text TEXT NOT NULL,
    cards JSON, -- array of linked card slugs
    author VARCHAR(100) NOT NULL,
    votes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_code) REFERENCES sessions(code) ON DELETE CASCADE,
    INDEX idx_room_code (room_code),
    INDEX idx_lens (lens),
    INDEX idx_type (type)
);

-- Timeline table
CREATE TABLE IF NOT EXISTS timeline (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_code VARCHAR(10) NOT NULL,
    label ENUM('Now', 'Next', 'Later') NOT NULL,
    item_text TEXT NOT NULL,
    owner VARCHAR(100),
    metric VARCHAR(255),
    risk_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_code) REFERENCES sessions(code) ON DELETE CASCADE,
    INDEX idx_room_code (room_code),
    INDEX idx_label (label)
);

-- Optional: Chat table for arcade chat feature
CREATE TABLE IF NOT EXISTS chat (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_code VARCHAR(10) NOT NULL,
    author VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_code) REFERENCES sessions(code) ON DELETE CASCADE,
    INDEX idx_room_code (room_code),
    INDEX idx_created_at (created_at)
);