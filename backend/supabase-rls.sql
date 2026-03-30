-- ══════════════════════════════════════════════════════════════════
-- PLXYGROUND — Row Level Security (RLS)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- Architecture note:
--   The backend API uses the SERVICE ROLE key, which bypasses RLS
--   by design. This is correct — all access control is enforced at
--   the API layer via JWT middleware (authenticate + requireRole).
--
--   Enabling RLS here is defence-in-depth: it ensures that even if
--   the anon key were ever exposed, no direct database reads or
--   writes are possible without going through the API.
-- ══════════════════════════════════════════════════════════════════

-- ── Step 1: Enable RLS on every client-accessible table ──────────

ALTER TABLE admins               ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators             ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE content              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_action_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;


-- ── Step 2: Deny all direct anon/authenticated access ────────────
-- With RLS enabled and NO permissive policies, the default behaviour
-- is DENY ALL for the anon and authenticated roles.
-- The service role key continues to bypass RLS (Supabase default).
--
-- No additional policy statements are needed to achieve this.
-- The absence of policies is itself the deny-all rule.


-- ══════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- Run this after the ALTER TABLE statements above.
-- Every row should show rls_enabled = true.
-- ══════════════════════════════════════════════════════════════════

SELECT
  tablename                        AS "table",
  rowsecurity                      AS "rls_enabled",
  CASE WHEN rowsecurity THEN 'PASS' ELSE 'FAIL' END AS "status"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected output:
-- ┌──────────────────┬─────────────┬────────┐
-- │ table            │ rls_enabled │ status │
-- ├──────────────────┼─────────────┼────────┤
-- │ admins           │ true        │ PASS   │
-- │ audit_log        │ true        │ PASS   │
-- │ bulk_action_log  │ true        │ PASS   │
-- │ content          │ true        │ PASS   │
-- │ content_tags     │ true        │ PASS   │
-- │ creator_accounts │ true        │ PASS   │
-- │ creators         │ true        │ PASS   │
-- │ moderation_queue │ true        │ PASS   │
-- │ notifications    │ true        │ PASS   │
-- │ opportunities    │ true        │ PASS   │
-- │ password_resets  │ true        │ PASS   │
-- │ tags             │ true        │ PASS   │
-- └──────────────────┴─────────────┴────────┘
-- 12 rows — all PASS = RLS enabled on every table.
