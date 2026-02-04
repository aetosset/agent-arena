-- Agent Arena Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ BOTS TABLE ============
CREATE TABLE bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  avatar TEXT NOT NULL DEFAULT '🤖',
  api_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Stats
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  total_earnings INTEGER DEFAULT 0,
  avg_placement DECIMAL(3,2) DEFAULT 0
);

-- Index for API key lookups (authentication)
CREATE INDEX idx_bots_api_key ON bots(api_key);

-- ============ MATCHES TABLE ============
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'live', 'finished')),
  bot_ids UUID[] NOT NULL,
  rounds JSONB DEFAULT '[]'::jsonb,
  winner_id UUID REFERENCES bots(id),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding live/recent matches
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_ended_at ON matches(ended_at DESC);

-- ============ QUEUE TABLE ============
CREATE TABLE queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID UNIQUE REFERENCES bots(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ROW LEVEL SECURITY ============
-- Enable RLS on all tables (even though we use service_role, defense in depth)
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;

-- No public policies - all access via service_role key
-- This means anon key gets NOTHING (exactly what we want)

-- ============ HELPER FUNCTIONS ============
-- Function to get public bot data (excludes api_key)
CREATE OR REPLACE FUNCTION get_public_bot(bot_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  avatar TEXT,
  matches_played INTEGER,
  wins INTEGER,
  win_rate DECIMAL,
  avg_placement DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.avatar,
    b.matches_played,
    b.wins,
    CASE WHEN b.matches_played > 0 
      THEN b.wins::DECIMAL / b.matches_played 
      ELSE 0 
    END as win_rate,
    b.avg_placement
  FROM bots b
  WHERE b.id = bot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Leaderboard function
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  rank BIGINT,
  id UUID,
  name TEXT,
  avatar TEXT,
  matches_played INTEGER,
  wins INTEGER,
  win_rate DECIMAL,
  avg_placement DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY b.wins DESC, b.avg_placement ASC) as rank,
    b.id,
    b.name,
    b.avatar,
    b.matches_played,
    b.wins,
    CASE WHEN b.matches_played > 0 
      THEN b.wins::DECIMAL / b.matches_played 
      ELSE 0 
    END as win_rate,
    b.avg_placement
  FROM bots b
  WHERE b.matches_played >= 1
  ORDER BY b.wins DESC, b.avg_placement ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
