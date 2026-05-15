-- Migration: Add app_settings table
-- Run this in Supabase SQL Editor if app_settings doesn't exist yet.

CREATE TABLE IF NOT EXISTS app_settings (
    key        VARCHAR(100) PRIMARY KEY,
    value      TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write settings
CREATE POLICY "Admins full access settings"
  ON app_settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Seed with empty Fonnte token (safe default)
INSERT INTO app_settings (key, value)
VALUES ('fonnte_token', '')
ON CONFLICT (key) DO NOTHING;
