-- Add email and device tracking to participants for cross-session persistence
-- Allows participants to rejoin sessions without losing stats

ALTER TABLE participants
ADD COLUMN email VARCHAR(255),
ADD COLUMN device_id VARCHAR(255);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_device_id ON participants(device_id);

-- Add unique constraint for email+room_code combination to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_email_room ON participants(email, room_code)
WHERE email IS NOT NULL;
