#!/usr/bin/env bash
# PLXYGROUND Smoke Test Suite
# Usage: bash smoke-test.sh [BASE_URL]
# Default: http://localhost:3011
#
# Required env vars:
#   SMOKE_ADMIN_EMAIL    – admin account email   (default: admin@plxyground.local)
#   SMOKE_ADMIN_PASSWORD – admin account password (no default; script exits if unset)

set -euo pipefail

BASE="${1:-http://localhost:3011}"

if [ -z "${SMOKE_ADMIN_PASSWORD:-}" ]; then
  echo "ERROR: SMOKE_ADMIN_PASSWORD environment variable is required." >&2
  echo "  Export it before running: export SMOKE_ADMIN_PASSWORD=your-password" >&2
  exit 1
fi

ADMIN_EMAIL="${SMOKE_ADMIN_EMAIL:-admin@plxyground.local}"
PASS=0
FAIL=0
TOTAL=0

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
bold()  { printf "\033[1m%s\033[0m\n" "$1"; }

check() {
  local desc="$1" method="$2" url="$3" expected_status="$4"
  shift 4
  TOTAL=$((TOTAL + 1))

  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" "$@" 2>/dev/null || echo "000")

  if [ "$status" = "$expected_status" ]; then
    green "  ✓ $desc (HTTP $status)"
    PASS=$((PASS + 1))
  else
    red "  ✗ $desc — expected $expected_status, got $status"
    FAIL=$((FAIL + 1))
  fi
}

bold "🏟️  PLXYGROUND Smoke Tests"
bold "   Target: $BASE"
echo ""

# ── Health ──
bold "Health & Root"
check "GET /"            GET  "$BASE/"        200
check "GET /healthz"     GET  "$BASE/healthz" 200
check "GET /404-path"    GET  "$BASE/nope"    404

# ── Auth ──
bold "Auth Endpoints"
check "POST /api/auth/signup (no body)"   POST "$BASE/api/auth/signup" 400 \
  -H "Content-Type: application/json" -d '{}'
check "POST /api/auth/login (no body)"    POST "$BASE/api/auth/login"  400 \
  -H "Content-Type: application/json" -d '{}'
check "POST /api/auth/login (bad creds)"  POST "$BASE/api/auth/login"  401 \
  -H "Content-Type: application/json" -d '{"email":"nobody@test.com","password":"wrong"}'

# ── Admin Auth ──
bold "Admin Auth"
check "POST /api/admin/auth/login (no body)"   POST "$BASE/api/admin/auth/login" 400 \
  -H "Content-Type: application/json" -d '{}'
check "POST /api/admin/auth/login (bad creds)" POST "$BASE/api/admin/auth/login" 401 \
  -H "Content-Type: application/json" -d '{"email":"bad@admin.com","password":"wrong"}'

# Admin login to get token
ADMIN_RES=$(curl -s -X POST "$BASE/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${SMOKE_ADMIN_PASSWORD}\"}" 2>/dev/null)
ADMIN_TOKEN=$(echo "$ADMIN_RES" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ]; then
  green "  ✓ Admin login successful (token obtained)"
  PASS=$((PASS + 1))
  TOTAL=$((TOTAL + 1))

  # ── Protected Admin Routes ──
  bold "Admin Protected Routes (with token)"
  check "GET /api/admin/queue"     GET  "$BASE/api/admin/queue"     200 -H "Authorization: Bearer $ADMIN_TOKEN"
  check "GET /api/admin/content"   GET  "$BASE/api/admin/content"   200 -H "Authorization: Bearer $ADMIN_TOKEN"
  check "GET /api/admin/users"     GET  "$BASE/api/admin/users"     200 -H "Authorization: Bearer $ADMIN_TOKEN"
  check "GET /api/admin/audit"     GET  "$BASE/api/admin/audit"     200 -H "Authorization: Bearer $ADMIN_TOKEN"
  check "GET /api/admin/analytics" GET  "$BASE/api/admin/analytics" 200 -H "Authorization: Bearer $ADMIN_TOKEN"
  check "GET /api/admin/alerts"    GET  "$BASE/api/admin/alerts"    200 -H "Authorization: Bearer $ADMIN_TOKEN"
else
  red "  ✗ Admin login failed — skipping protected route tests"
  FAIL=$((FAIL + 1))
  TOTAL=$((TOTAL + 1))
fi

# ── Unauthenticated access to protected routes ──
bold "Auth Guard (no token)"
check "GET /api/admin/queue (no auth)"   GET "$BASE/api/admin/queue"   401
check "GET /api/admin/users (no auth)"   GET "$BASE/api/admin/users"   401
check "GET /api/content (public)"        GET "$BASE/api/content"       200
check "GET /api/creators (public)"       GET "$BASE/api/creators"      200
check "GET /api/opportunities (public)"  GET "$BASE/api/opportunities" 200

# ── Content endpoints ──
bold "Content & Feed"
check "GET /api/content"        GET "$BASE/api/content"        200
check "GET /api/content?limit=5" GET "$BASE/api/content?limit=5" 200

# ── Security headers ──
bold "Security Headers"
HEADERS=$(curl -sI "$BASE/" 2>/dev/null)
TOTAL=$((TOTAL + 1))
if echo "$HEADERS" | grep -qi "x-content-type-options"; then
  green "  ✓ X-Content-Type-Options header present"
  PASS=$((PASS + 1))
else
  red "  ✗ X-Content-Type-Options header missing"
  FAIL=$((FAIL + 1))
fi

TOTAL=$((TOTAL + 1))
if echo "$HEADERS" | grep -qi "x-frame-options\|content-security-policy"; then
  green "  ✓ Frame protection header present"
  PASS=$((PASS + 1))
else
  red "  ✗ Frame protection header missing"
  FAIL=$((FAIL + 1))
fi

# ── Summary ──
echo ""
bold "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
bold "Results: $PASS/$TOTAL passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  red "SMOKE TESTS FAILED"
  exit 1
else
  green "ALL SMOKE TESTS PASSED ✓"
  exit 0
fi
