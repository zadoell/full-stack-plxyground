-- PLXYGROUND Supabase Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This creates all tables matching the existing SQLite schema, adapted for Postgres

-- ═══════════════════════════════════════════
-- 1. ADMINS
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS admins (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ADMIN',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 2. CREATORS (users: creator / business / athlete / fan)
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS creators (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'creator',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  profile_slug TEXT UNIQUE,
  social_links JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  suspend_reason TEXT DEFAULT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 3. CREATOR ACCOUNTS (login credentials)
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS creator_accounts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  creator_id BIGINT NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 4. CONTENT
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS content (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  creator_id BIGINT NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video_embed', 'image_story', 'campaign_brief')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  media_url TEXT NOT NULL DEFAULT '',
  order_priority INTEGER DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  feed_rank_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 5. TAGS
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tags (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS content_tags (
  content_id BIGINT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);

-- ═══════════════════════════════════════════
-- 6. OPPORTUNITIES
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS opportunities (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  creator_id BIGINT NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  role_type TEXT DEFAULT '',
  body TEXT DEFAULT '',
  requirements TEXT DEFAULT '',
  benefits TEXT DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If adding view_count to an existing opportunities table, run:
-- ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════
-- 7. MODERATION QUEUE
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS moderation_queue (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  title_or_name TEXT,
  submitted_by TEXT,
  report_count INTEGER DEFAULT 0,
  assigned_admin TEXT,
  entity_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 8. AUDIT LOG
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  action_type TEXT NOT NULL,
  actor TEXT,
  target TEXT,
  before_snapshot TEXT,
  after_snapshot TEXT,
  reason TEXT,
  metadata TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 9. BULK ACTION LOG
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bulk_action_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin TEXT,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_ids TEXT,
  previous_state TEXT,
  undo_window_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  undone_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════
-- 10. PASSWORD RESETS
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS password_resets (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 11. NOTIFICATIONS
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_content_published ON content(is_published);
CREATE INDEX IF NOT EXISTS idx_content_creator ON content(creator_id);
CREATE INDEX IF NOT EXISTS idx_content_created ON content(created_at);
CREATE INDEX IF NOT EXISTS idx_content_feed_rank ON content(feed_rank_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_creators_slug ON creators(profile_slug);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_accounts_creator ON creator_accounts(creator_id);
