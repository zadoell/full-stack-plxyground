# PLXYGROUND — Presentation Deck

---

## Slide 1: Title

### PLXYGROUND

**A Full-Stack Content Platform for Sports Creators, Athletes, Businesses & Fans**

Built with React Native (Expo) · Node.js/Express · Supabase (PostgreSQL)

---

## Slide 2: What is PLXYGROUND?

- A hybrid between a **creator portfolio platform** and a **talent marketplace** for the sports industry
- Connects four user types: **Creators**, **Businesses**, **Athletes**, and **Fans**
- Creators publish content (articles, videos, image stories); businesses post collaboration opportunities; athletes showcase training; fans browse and discover
- Full admin panel for platform moderation, analytics, and user management

---

## Slide 3: Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React Native + Expo SDK 55, Expo Router (file-based), react-native-web (cross-platform: iOS / Android / Web) |
| **Backend** | Node.js + Express 4.x REST API |
| **Database** | PostgreSQL via Supabase (migrated from SQLite) |
| **File Storage** | Supabase Storage (public `media` bucket, Multer in-memory upload pipeline, 50 MB limit) |
| **Auth** | Custom JWT + bcrypt (10 salt rounds), AsyncStorage on client |
| **Admin Panel** | Vanilla HTML / CSS / JS SPA (no framework) |
| **DevOps** | Docker + Docker Compose, health checks, smoke test suite |

---

## Slide 4: Architecture Overview

- **Three-tier architecture**: Mobile/Web frontend → Express REST API → Supabase (Postgres + Storage)
- Backend uses Supabase **service-role key** (bypasses RLS) — all authorization handled in Express middleware
- **Role-based access control**: JWT tokens encode user role (`creator`, `business`, `athlete`, `fan`, `ADMIN`)
- Middleware stack: `authenticate` → `requireRole` → route handler
- Separate admin panel (vanilla JS SPA) communicates with the same backend API

---

## Slide 5: Database Schema (12 Tables)

| Table | Purpose |
|---|---|
| `admins` | Admin accounts & credentials |
| `creators` | All user profiles (creators, businesses, athletes, fans) |
| `creator_accounts` | Login credentials (separated from profile data) |
| `content` | Articles, video embeds, image stories |
| `tags` / `content_tags` | Tagging system (many-to-many) |
| `opportunities` | Business collaboration postings |
| `moderation_queue` | Items pending admin review |
| `audit_log` | Full action history with before/after snapshots |
| `bulk_action_log` | Bulk admin actions with 5-minute undo window |
| `password_resets` | Token-based password reset records |
| `notifications` | Per-user in-app notifications |

Performance indexes on: published status, creator FK, `feed_rank_at`, `profile_slug`, `user_id`, `created_at`

---

## Slide 6: Authentication & Security

- **JWT-based auth** with configurable expiration (default 7 days)
- **bcrypt** password hashing (10 salt rounds), 8-character minimum enforcement
- **Rate limiting**: Auth endpoints (50 req / 15 min), Content endpoints (100 req / 15 min)
- **Helmet** for HTTP security headers (HSTS, XSS protection, etc.)
- **CORS** with configurable allowed origins
- **Input validation middleware**: URL validation, content type allowlist, title length limits (500 chars), body limits (50,000 chars)
- **HTML escaping** in admin panel (`escapeHtml()`) to prevent XSS
- **Docker**: non-root user (`appuser`) in container
- Suspended account detection at login with reason display

---

## Slide 7: User Roles & Signup Flows

Four distinct user roles, each with a dedicated signup flow:

- **Creator**: Full content creation, profile building, media uploads, opportunity discovery
- **Business**: Post sponsorship/collaboration opportunities, discover creators
- **Athlete**: Showcase training & competitions, connect with brands for sponsorships
- **Fan**: Lightweight signup, browse feed, discover creators (no content creation)

Key behaviors:

- Creators, businesses, and athletes are auto-added to the **moderation queue** on signup
- Fans skip the queue (instant access)
- Unique profile slugs auto-generated from name (collision avoidance with timestamp suffix)
- Credentials separated from profile data (`creator_accounts` vs `creators` tables)

---

## Slide 8: Content System

- Three content types: **Article**, **Video Embed**, **Image Story**
- Content creation requires media URL (uploaded via Supabase Storage or external)
- **Moderation pipeline**: New content starts as `is_published: false`, enters moderation queue → admin approves → published to feed
- **Feed ordering** by `feed_rank_at` timestamp (updated on publish), secondary sort by creation date
- Search by title/body with ILIKE, filter by `content_type`
- Paginated responses (limit/offset) across all list endpoints
- Owners can edit/delete their own content (enforced server-side)

---

## Slide 9: File Upload Pipeline

- **Multer** handles multipart uploads with in-memory buffer storage
- Supported formats: JPEG, PNG, GIF, WebP, SVG, MP4, WebM, MOV
- Max file size: **50 MB**
- Files stored in Supabase Storage under `uploads/{userId}/{timestamp-randomhex}{ext}`
- Unique filenames via `crypto.randomBytes(8)` to prevent collisions
- Public URL returned immediately after upload
- Client-side upload via `expo-image-picker` → FormData → API

---

## Slide 10: Admin Panel Features

A standalone vanilla HTML/CSS/JS SPA with 9 management sections:

1. **Moderation Queue** — Review, approve, reject, delete, or assign items; bulk actions with checkbox selection
2. **Content Management** — Search, view, edit, publish/unpublish, delete any content
3. **Add Content** — Create content on behalf of any creator
4. **User Management** — Search users, suspend/reactivate, change roles, reset passwords, verify emails
5. **Add User** — Create users directly (creator, business, fan, athlete)
6. **Audit Log** — Full action history with export to JSON
7. **Analytics** — KPI dashboard: total users by role, content metrics, weekly trends, content by type
8. **Live Alerts** — Real-time feed of recent content and user signups
9. **Admin Security** — Change admin password

---

## Slide 11: Moderation & Audit System

- **Moderation Queue**: Every new user (non-fan) and content submission enters a pending queue
- **Bulk Actions**: Approve, reject, delete, or assign multiple items at once
- **Undo Window**: 5-minute undo window on bulk actions — previous state stored and restorable
- **Audit Log**: Every significant action logged with:
  - `action_type`, `actor`, `target`
  - `before_snapshot` and `after_snapshot` (JSON)
  - Timestamp
- Actions tracked: logins, signups, content CRUD, role changes, suspensions, password resets, bulk operations
- Audit log exportable as JSON download

---

## Slide 12: Frontend Screens (~25 Routes)

**Auth Flow:**
Landing page → Signup choice → Creator / Business / Athlete / Fan signup → Login → Forgot password → Reset password → Suspended page

**Main App:**
Dashboard (KPIs + quick actions) → Content feed (search, filter, paginate) → Create post (with image picker + upload) → Edit post → My content → Profile view → Edit profile → Discover creators → Notifications → Opportunities

**Settings:**
Change password → Terms → Privacy → Support

**UX Features:**

- Pull-to-refresh on dashboard and feed
- Skeleton loaders during data fetch
- Toast notifications (success/error/warning/info)
- Inline confirmation modals for destructive actions
- Bottom navigation bar with role-aware options (fans see fewer items)
- Animated banner notifications

---

## Slide 13: API Endpoints Overview

| Category | Endpoints |
|---|---|
| **Auth** | Signup/login for each role (creator, business, athlete, fan), forgot/reset/change password |
| **Content** | Public feed (GET), own content (GET), CRUD (GET/POST/PUT/DELETE by ID) |
| **Creators** | List/search, get by ID, get by slug, update own profile |
| **Opportunities** | List published opportunities (paginated) |
| **Upload** | Single file upload (authenticated, multipart) |
| **Notifications** | List, mark read, mark all read |
| **Admin** | Login, queue (+ bulk action + undo), content CRUD, user management (suspend, role change, reset password, email verify), audit log + export, analytics, live alerts, security (change password) |
| **Health** | `GET /` and `GET /healthz` (DB status, uptime, counters) |

---

## Slide 14: Observability & DevOps

- **Request Logger**: Logs every request with method, path, status code, and duration (ms)
- **In-memory Counters**: Tracks auth success/failure, content create/update/delete, moderation actions
- **Health Endpoint** (`/healthz`): Reports DB connection status, server uptime, environment, and all counters
- **Docker**: Multi-stage Dockerfile (node:20-alpine), non-root user, health check built in
- **Docker Compose**: Backend + Admin Panel services, dependency management, auto-restart
- **Smoke Test Suite**: Bash script that tests all endpoints (health, auth, admin, content, security headers) — 20+ automated checks
- **Seed Script**: Idempotent seeder with 10 creators, 3 businesses, 3 athletes, 3 fans, 30+ content items, and sample opportunities — production-safe guard (`NODE_ENV` check)

---

## Slide 15: Key Design Decisions & Talking Points

1. **End-to-end ownership** — Every layer designed and built from scratch: database schema, REST API, auth, file uploads, mobile frontend, admin tooling
2. **Database migration** — Migrated from SQLite to Supabase Postgres mid-project, full migration SQL written manually
3. **Credential separation** — Login credentials (`creator_accounts`) separated from profile data (`creators`) for clean data modeling
4. **Real-world admin features** — Bulk actions with undo, audit logging with before/after snapshots, moderation queue
5. **Cross-platform** — Single React Native codebase runs on iOS, Android, and Web via Expo + react-native-web
6. **Security-first** — Rate limiting, Helmet, bcrypt, JWT expiration, input validation, HTML escaping, non-root Docker user
7. **Modular architecture** — Separate middleware layers for auth, validation, and logging; modular route files; reusable UI components
