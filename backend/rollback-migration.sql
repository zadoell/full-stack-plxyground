-- PLXYGROUND Rollback Migration
-- Run this in Supabase SQL Editor to DROP all tables and start fresh.
-- WARNING: This is destructive and irreversible. Back up data first.

-- Drop indexes first
DROP INDEX IF EXISTS idx_creator_accounts_creator;
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_creators_slug;
DROP INDEX IF EXISTS idx_queue_status;
DROP INDEX IF EXISTS idx_audit_created;
DROP INDEX IF EXISTS idx_content_feed_rank;
DROP INDEX IF EXISTS idx_content_created;
DROP INDEX IF EXISTS idx_content_creator;
DROP INDEX IF EXISTS idx_content_published;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS bulk_action_log CASCADE;
DROP TABLE IF EXISTS moderation_queue CASCADE;
DROP TABLE IF EXISTS content_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS creator_accounts CASCADE;
DROP TABLE IF EXISTS creators CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Drop storage bucket (run separately if needed)
-- DELETE FROM storage.objects WHERE bucket_id = 'media';
-- DELETE FROM storage.buckets WHERE id = 'media';
