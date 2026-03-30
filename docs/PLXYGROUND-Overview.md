# PLXYGROUND — Full-Stack Content Platform Prototype

## What It Is

PLXYGROUND is a full-stack content platform that connects four types of users — **creators**, **businesses**, **athletes**, and **fans** — around content creation and collaboration opportunities. It's a hybrid between a creator portfolio platform and a talent marketplace.

---

## What It Does

- **Creators** sign up, build a profile (unique slug, bio, location, social links), and publish content — articles, video embeds, or image stories — with media uploads (images/video up to 50 MB).
- **Businesses** sign up, post collaboration opportunities (role type, requirements, benefits), and discover creators.
- **Athletes** sign up, showcase their training and competitions, connect with brands for sponsorships, and build their public athlete profile.
- **Fans** sign up with a lightweight flow, browse a content feed, discover creators via search, and view profiles.
- **Admins** manage the platform through a separate single-page admin panel with a moderation queue, user management, content management, audit logs, analytics, and live alerts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React Native + Expo (SDK 55), Expo Router (file-based routing), `react-native-web` for cross-platform (iOS / Android / Web) |
| **Backend** | Node.js + Express REST API |
| **Database** | PostgreSQL via Supabase (migrated from SQLite during development) |
| **File Storage** | Supabase Storage — public `media` bucket, uploads handled via Multer (in-memory buffer) forwarded to Supabase |
| **Auth** | Custom JWT-based authentication with bcrypt password hashing (10 salt rounds), tokens stored client-side via AsyncStorage |
| **Admin Panel** | Vanilla HTML / CSS / JS single-page app (no framework), communicates with the same backend API |
| **DevOps** | Docker + Docker Compose (multi-service orchestration), health checks, smoke test suite, EAS Build for iOS/Android production builds |

---

## Architecture & Key Design Decisions

- **Three-tier architecture**: Mobile/web frontend → Express REST API → Supabase (Postgres + Storage). The backend uses the Supabase service-role key to bypass Row Level Security, handling all authorization in Express middleware.
- **Role-based access control**: JWT tokens encode user role (`creator`, `business`, `athlete`, `fan`, `ADMIN`). Middleware functions `authenticate` and `requireRole` gate endpoints accordingly.
- **Moderation pipeline**: New creator, business, and athlete signups are automatically added to a moderation queue. Admins can approve, reject, or bulk-action items. Every action is logged to an `audit_log` table with before/after snapshots.
- **Content feed**: Content has a `feed_rank_at` timestamp for feed ordering, plus search by title/body and filtering by content type. Pagination uses limit/offset.
- **Security hardening**: Helmet for HTTP headers, CORS with configurable allowed origins, rate limiting on auth (50 req / 15 min) and content (100 req / 15 min) endpoints, input validation middleware, 8-character minimum passwords, HTML escaping in the admin panel to prevent XSS.
- **Observability**: Custom request logger recording method/path/status/duration per request, plus an in-memory counter system for auth successes/failures, content CRUD, and moderation actions — exposed on a `/healthz` endpoint.
- **Notifications system**: In-app notifications stored in Postgres with read/unread tracking, fetched per-user with unread count. Supports mark-individual and mark-all-as-read.
- **Password reset flow**: Token-based password reset with 6-digit code and 15-minute expiration, stored in a dedicated `password_resets` table. Authenticated change-password endpoint also available.
- **Reusable UI components**: Shared component library (`UIComponents.js`) with NoticeBanner (animated toast/banner), InlineModal (confirmation dialog), LoadingSpinner, SkeletonLoader (shimmer effect), EmptyState, ErrorState (with retry), and ContentCard.
- **Docker deployment**: Multi-stage Dockerfile with `node:20-alpine`, non-root user (`appuser`, UID 1001), built-in health check, and `npm ci --omit=dev` for production. Docker Compose orchestrates backend (port 3011) and admin panel (port 3012) with health-based dependency ordering and auto-restart.
- **EAS Build configuration**: Development (simulator), preview (internal APK), and production (app-bundle with auto-increment) build profiles. Submission config for Apple App Store Connect and Google Play.

---

## Database Schema (12 Tables)

| Table | Purpose |
|---|---|
| `admins` | Admin accounts and credentials |
| `creators` | User profiles (creators, businesses, athletes, fans) |
| `creator_accounts` | Login credentials separated from profile data |
| `content` | Articles, video embeds, image stories |
| `tags` | Tag labels |
| `content_tags` | Many-to-many content ↔ tags |
| `opportunities` | Business collaboration postings |
| `moderation_queue` | Pending items for admin review |
| `audit_log` | Action history with before/after snapshots |
| `bulk_action_log` | Bulk admin actions with undo window |
| `password_resets` | Token-based password reset records |
| `notifications` | Per-user in-app notifications |

Indexed on frequently queried columns: `is_published`, `creator_id`, `feed_rank_at`, `profile_slug`, `user_id`, `created_at`.

Additional database utilities:
- **Supabase Storage setup SQL**: Creates public `media` bucket (50 MB limit, MIME type allowlist), public read policy, service-role insert/delete policies.
- **Rollback migration SQL**: Drops all indexes and tables in reverse dependency order for dev reset/testing.
- **Seed script**: Idempotent seeder with production safety guard (`NODE_ENV` check). Seeds 1 admin, 10 creators, 3 businesses, 3 athletes, 3 fans, 30+ content items with curated Unsplash media URLs, and sample opportunities.

---

## Frontend Screens (~25 Routes)

**Auth flow:** signup choice → creator / business / athlete / fan signup & login → forgot / reset password → suspended page

**Main app:** dashboard with KPIs, content feed, create / edit post with media upload, my content, profile view / edit, discover creators, notifications, opportunities

**Settings:** change password, terms, privacy, support

**Mobile app configuration** (`app.json`): Bundle ID `com.plxyground.app`, iOS camera/photo library permissions with iOS 17+ privacy manifests, Android camera/storage permissions, web via Metro bundler.

---

## API Endpoints

| Route | Description |
|---|---|
| `POST /api/auth/signup` | Creator signup |
| `POST /api/auth/login` | Creator login |
| `POST /api/auth/forgot-password` | Request password reset code (6-digit, 15-min expiry) |
| `POST /api/auth/reset-password` | Reset password with code |
| `POST /api/auth/change-password` | Change password (authenticated) |
| `POST /api/business/auth/signup` | Business signup |
| `POST /api/business/auth/login` | Business login |
| `POST /api/fan/auth/signup` | Fan signup |
| `POST /api/fan/auth/login` | Fan login |
| `POST /api/athlete/auth/signup` | Athlete signup |
| `POST /api/athlete/auth/login` | Athlete login |
| `GET /api/content` | Public content feed (paginated, searchable, filterable by type) |
| `GET /api/content/mine` | Authenticated user's own posts |
| `GET/POST/PUT/DELETE /api/content/:id` | Content CRUD |
| `GET /api/creators` | List/search creators (by name, bio, location; filter by role) |
| `GET /api/creators/:id` | Creator profile by ID |
| `GET /api/creators/slug/:slug` | Creator profile by slug |
| `PUT /api/creators/me` | Update own profile (name, bio, location, social_links) |
| `GET /api/opportunities` | List published opportunities (paginated) |
| `POST /api/upload` | Authenticated file upload (image/video, 50 MB max) |
| `GET /api/notifications` | Notification list with unread count |
| `PUT /api/notifications/:id/read` | Mark single notification as read |
| `PUT /api/notifications/read-all` | Mark all notifications as read |
| `POST /api/admin/auth/login` | Admin login |
| `GET /api/admin/queue` | Moderation queue (paginated, filterable by status) |
| `POST /api/admin/queue/bulk-action` | Bulk approve/reject/delete/assign |
| `POST /api/admin/queue/bulk-action/undo` | Undo bulk action (5-minute window) |
| `GET /api/admin/content` | List all content (search, filter published/pending) |
| `POST /api/admin/content` | Admin-create content (assign to any creator) |
| `PUT /api/admin/content/:id` | Admin-edit content (publish/unpublish, edit fields) |
| `DELETE /api/admin/content/:id` | Admin-delete content |
| `GET /api/admin/users` | List all users (search, filter by role) |
| `POST /api/admin/users` | Admin-create user (any role) |
| `POST /api/admin/users/:userId/suspend` | Suspend/reactivate user with reason |
| `POST /api/admin/users/:userId/role` | Change user role |
| `POST /api/admin/users/:userId/email-verify` | Toggle email verification |
| `POST /api/admin/users/reset-password` | Admin force-reset user password |
| `GET /api/admin/audit` | Audit log (paginated) |
| `GET /api/admin/audit/export` | Export audit log as JSON download |
| `GET /api/admin/analytics` | KPI dashboard (users by role, content stats, weekly trends, content by type) |
| `GET /api/admin/alerts` | Live alerts (recent content & user signups) |
| `POST /api/admin/security/change-password` | Admin change own password |
| `GET /` | Root status check |
| `GET /healthz` | Health check with DB status, uptime, environment, and counters |

---

## Key Talking Points for Interviews

1. **End-to-end ownership**: Designed and built every layer — database schema, REST API, authentication, file upload pipeline, mobile frontend, and admin tooling.
2. **Database migration**: Migrated from SQLite to Supabase Postgres mid-project, writing the full migration SQL manually.
3. **Real-world admin features**: Bulk actions with an undo window, audit logging with before/after snapshots, and a moderation queue reflect production platform needs.
4. **Deliberate security choices**: Rate limiting, Helmet, bcrypt, JWT expiration, input validation, and HTML escaping.
5. **Cross-platform frontend**: Single React Native codebase runs on iOS, Android, and Web via Expo and `react-native-web`.
6. **Clean separation of concerns**: Credentials separated from profile data (creators vs. creator_accounts), middleware layers for auth/validation/logging, and a modular route structure.
7. **DevOps pipeline**: Dockerized deployment with non-root user, health checks, Docker Compose orchestration, EAS Build profiles for iOS/Android, and a comprehensive smoke test suite (20+ automated endpoint checks).
8. **Reusable component library**: Shared UI components (toast banners, modals, skeleton loaders, error/empty states) used across all screens for consistent UX.

---

## Development & Testing

- **Seed script** (`npm run seed`): Idempotent database seeder with production safety guard. Seeds admin, 10 creators, 3 businesses, 3 athletes, 3 fans, 30+ content items, and sample opportunities.
- **Smoke test** (`npm run smoke`): Bash script that validates 20+ endpoints — health checks, auth flows, admin protected routes (with token), auth guards (without token), public endpoints, and security headers.
- **Docker** (`docker compose up`): Runs backend (port 3011) + admin panel (port 3012) with health-based dependency ordering, auto-restart, and production environment variables.
