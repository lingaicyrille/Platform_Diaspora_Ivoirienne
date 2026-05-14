# Platform Diaspora Ivoirienne — Development Plan

## Project Overview

A full-stack platform serving the Ivorian diaspora community worldwide.
Built with Django REST Framework (backend) + Next.js 14 (frontend), deployed via Docker.

---

## Architecture Summary

| Layer | Technology |
|-------|-----------|
| Backend | Django 5.0 + DRF 3.15, PostgreSQL 16, Redis 7 |
| Auth | JWT (SimpleJWT) — 60min access / 7-day refresh + blacklist |
| Media | Cloudinary |
| Realtime | Django Channels + Redis |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| State | Zustand + React Query |
| Forms | React Hook Form + Zod |
| Infra | Docker Compose (db, redis, backend, frontend) |

---

## Repository Layout

```
src/
├── backend/
│   ├── config/              # Django settings (base / dev / prod) & URLs
│   ├── apps/
│   │   ├── users/           # ✅ Auth, profiles, JWT — DONE
│   │   ├── community/       # 🔲 Scaffold only
│   │   ├── associations/    # 🔲 Scaffold only
│   │   ├── events/          # 🔲 Scaffold only
│   │   ├── business/        # 🔲 Scaffold only
│   │   ├── marketplace/     # 🔲 Scaffold only
│   │   ├── immigration/     # 🔲 Scaffold only
│   │   ├── news/            # 🔲 Scaffold only
│   │   ├── messaging/       # 🔲 Scaffold only
│   │   ├── help/            # 🔲 Scaffold only
│   │   └── ads/             # 🔲 Scaffold only
│   ├── core/                # Shared permissions (IsVerifiedUser, IsTrustedUser)
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── entrypoint.sh
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # ✅ Landing page — DONE
│   │   ├── auth/login/      # ✅ Login — DONE
│   │   ├── auth/register/   # ✅ Register (3-step) — DONE
│   │   └── dashboard/       # ✅ Dashboard skeleton — DONE (mock data)
│   ├── components/
│   │   ├── layout/          # ✅ AppLayout, Sidebar, Topbar — DONE
│   │   └── ui/              # ✅ Button, Badge, StatCard, Skeleton — DONE
│   ├── lib/utils.ts         # ✅ cn() utility — DONE
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── CLAUDE.md
└── PLAN.md                  # ← this file
```

---

## Current State

### Done
- [x] Django project scaffold with 11 apps registered
- [x] Custom `User` model (email-based, geo fields, trust score, language preference)
- [x] JWT auth: register, login, token refresh, profile CRUD
- [x] Custom permissions: `IsVerifiedUser`, `IsTrustedUser`
- [x] All 11 app URL prefixes wired in `config/urls.py`
- [x] OpenAPI/Swagger docs at `/api/docs/`
- [x] Landing page (hero, features, testimonials, footer)
- [x] Login page (JWT → localStorage)
- [x] 3-step registration form
- [x] Dashboard skeleton (mock data)
- [x] AppLayout + Sidebar + Topbar
- [x] Design system (Ivorian colors, reusable UI components)
- [x] Docker Compose (db, redis, backend, frontend)
- [x] `.env.example` with all required variables

### Not Built Yet
- [ ] Models, serializers, views for 10 feature apps
- [ ] Real data in the dashboard (replace mock data with API calls)
- [ ] Frontend auth state management (replace localStorage with proper session)
- [ ] Tests — none exist (backend or frontend)
- [ ] Production deployment config (CI/CD, HTTPS, secrets management)

---

## Design System

**Colors (Ivorian flag):**
- Orange: `#F77F00` (`ci-orange`), dark `#CC6600`, light `#FFF0E0`
- Green: `#009A44` (`ci-green`), dark `#007233`, light `#E6F7ED`

**User Model Fields:**
- `email` (unique, USERNAME_FIELD)
- `first_name`, `last_name`, `phone`, `bio`
- `avatar` (Cloudinary)
- `country_of_residence`, `city`, `continent`
- `preferred_language` — FR (default), EN, Dioula, Baoulé, Bété
- `trust_score`, `is_verified`
- `date_joined`, `updated_at`

---

## Phase 1 — Foundation Hardening
> Goal: make what exists production-worthy before adding features.

- [ ] Replace localStorage JWT storage with httpOnly cookies or a secure token store
- [ ] Add a global Axios interceptor (attach Bearer token, handle 401 → redirect to login)
- [ ] Wire React Query into the dashboard (replace all mock data with `/api/users/me/`)
- [ ] Add a loading/error state to every data-fetching page
- [ ] Write backend unit tests for: `RegisterView`, `LoginView`, `ProfileView`
- [ ] Write frontend integration tests for the 3-step registration form
- [ ] Add `pytest` + `pytest-django` + `factory-boy` to `requirements.txt`
- [ ] Add Jest + React Testing Library to `package.json`
- [ ] Confirm Docker Compose starts cleanly end-to-end (`docker compose up --build`)

---

## Phase 2 — Community Module
> Core social layer: groups, posts, comments, reactions.

**Backend (`apps/community/`):**
- [ ] `Group` model — name, description, avatar, type (public/private), creator (FK User), member_count, created_at
- [ ] `Membership` model — user (FK), group (FK), role (member/admin/moderator), joined_at
- [ ] `Post` model — author (FK User), group (FK Group, nullable for feed), content, image (Cloudinary), created_at, updated_at
- [ ] `Comment` model — post (FK), author (FK User), content, created_at
- [ ] `Reaction` model — post (FK), user (FK User), type (like/heart/support)
- [ ] Serializers for all models
- [ ] ViewSets: GroupViewSet (CRUD + join/leave actions), PostViewSet, CommentViewSet
- [ ] Pagination (20/page)
- [ ] Permissions: only members can post in private groups
- [ ] Migration

**Frontend:**
- [ ] `/community` — list of groups (cards with avatar, member count, description)
- [ ] `/community/[id]` — group page (posts feed, members panel, join/leave button)
- [ ] Post composer (text + optional image upload)
- [ ] Comment thread (expandable)
- [ ] Reaction buttons

---

## Phase 3 — Events Module
> Discover, create, and RSVP to events worldwide.

**Backend (`apps/events/`):**
- [ ] `Event` model — title, description, organizer (FK User), location (address + lat/lng), start_datetime, end_datetime, cover_image (Cloudinary), is_online, link, capacity, category
- [ ] `RSVP` model — event (FK), user (FK User), status (going/maybe/not_going), created_at
- [ ] EventViewSet (CRUD + rsvp action)
- [ ] Filter by: date range, continent, category, is_online
- [ ] Migration

**Frontend:**
- [ ] `/events` — upcoming events list (filterable by date, location, category)
- [ ] `/events/[id]` — event detail (map embed, RSVP button, attendee count)
- [ ] `/events/create` — event creation form (multi-field, image upload)
- [ ] Calendar view toggle

---

## Phase 4 — Business Directory
> Yellow pages for Ivorian-owned businesses worldwide.

**Backend (`apps/business/`):**
- [ ] `Business` model — name, owner (FK User), description, category, address, country, city, phone, website, email, logo (Cloudinary), is_verified, created_at
- [ ] `Review` model — business (FK), author (FK User), rating (1-5), comment, created_at
- [ ] BusinessViewSet (CRUD + verify action for admins)
- [ ] Filter by: category, country, city, rating
- [ ] Average rating annotation on queryset
- [ ] Migration

**Frontend:**
- [ ] `/business` — directory with search and filters
- [ ] `/business/[id]` — business profile (details, reviews, map)
- [ ] `/business/create` — listing submission form
- [ ] Rating & review component

---

## Phase 5 — Marketplace
> Buy and sell within the community.

**Backend (`apps/marketplace/`):**
- [ ] `Listing` model — title, seller (FK User), description, price, currency, category, condition (new/used), images (Cloudinary, multiple), location, is_active, created_at
- [ ] `Offer` model — listing (FK), buyer (FK User), amount, message, status (pending/accepted/rejected), created_at
- [ ] ListingViewSet (CRUD + offer action)
- [ ] Filter by: category, price range, condition, location
- [ ] Migration

**Frontend:**
- [ ] `/marketplace` — browsable listings grid
- [ ] `/marketplace/[id]` — listing detail with image gallery and offer form
- [ ] `/marketplace/create` — multi-image listing creation
- [ ] My listings / My offers in user dashboard

---

## Phase 6 — Associations
> Directory and management for Ivorian NGOs and associations.

**Backend (`apps/associations/`):**
- [ ] `Association` model — name, founders, description, category, country, logo, website, contact_email, is_verified, created_at
- [ ] `AssociationMember` model — association (FK), user (FK User), role, joined_at
- [ ] AssociationViewSet (CRUD + join action)
- [ ] Migration

**Frontend:**
- [ ] `/associations` — association cards by category/country
- [ ] `/associations/[id]` — association profile (members, posts, contact)
- [ ] Create/edit form for association leaders

---

## Phase 7 — News & Flash Info
> Community-driven news feed for the diaspora.

**Backend (`apps/news/`):**
- [ ] `Article` model — title, author (FK User), content (rich text), category, cover_image (Cloudinary), is_published, published_at, created_at
- [ ] `Tag` model — name (unique)
- [ ] `ArticleTag` — many-to-many through table
- [ ] ArticleViewSet (CRUD; publish action for staff)
- [ ] Filter by: category, tag, published date
- [ ] Migration

**Frontend:**
- [ ] `/news` — news feed (latest, by category)
- [ ] `/news/[slug]` — full article page
- [ ] Article creation/edit form (staff only)

---

## Phase 8 — Immigration Resources
> Practical visa and legal information by country.

**Backend (`apps/immigration/`):**
- [ ] `Country` model — name, code, flag_emoji
- [ ] `ImmigrationGuide` model — country (FK), title, content, category (visa/permit/citizenship/travel), last_updated
- [ ] `Question` model — user (FK User), country (FK), content, is_answered, created_at
- [ ] `Answer` model — question (FK), author (FK User), content, is_accepted, created_at
- [ ] ViewSets for all models
- [ ] Migration

**Frontend:**
- [ ] `/immigration` — country selector grid
- [ ] `/immigration/[country]` — guides list + Q&A forum
- [ ] Guide detail page

---

## Phase 9 — Messaging
> Direct messages and group chats using WebSockets.

**Backend (`apps/messaging/`):**
- [ ] `Conversation` model — participants (M2M User), is_group, name (for groups), created_at
- [ ] `Message` model — conversation (FK), sender (FK User), content, read_by (M2M User), sent_at
- [ ] Django Channels consumer for WebSocket connections
- [ ] REST endpoints: list conversations, message history
- [ ] Redis channel layer already configured
- [ ] Migration

**Frontend:**
- [ ] `/messages` — conversation list (sidebar)
- [ ] `/messages/[id]` — chat window (real-time via WebSocket)
- [ ] New conversation / new group chat dialogs
- [ ] Unread count badge in sidebar

---

## Phase 10 — Help / Support Requests
> Community mutual-aid board.

**Backend (`apps/help/`):**
- [ ] `HelpRequest` model — requester (FK User), title, description, category, urgency, status (open/in_progress/resolved), created_at
- [ ] `HelpOffer` model — request (FK), helper (FK User), message, created_at
- [ ] HelpRequestViewSet (CRUD + offer action)
- [ ] Migration

**Frontend:**
- [ ] `/help` — open requests board (filterable by category/urgency)
- [ ] `/help/[id]` — request detail + offer form
- [ ] Create request form

---

## Phase 11 — Ads
> Sponsored content for community businesses.

**Backend (`apps/ads/`):**
- [ ] `Ad` model — advertiser (FK User), title, body, image (Cloudinary), link, placement (banner/sidebar/feed), start_date, end_date, is_active, impressions, clicks
- [ ] AdViewSet (CRUD + track_click / track_impression actions)
- [ ] Middleware or utility to inject active ads per placement
- [ ] Migration

**Frontend:**
- [ ] `<AdBanner>` component (placement-aware)
- [ ] `<AdSidebar>` component
- [ ] Ad management dashboard for advertisers

---

## Phase 12 — Diaspora Map & Trust Score
> Unique platform features.

**Diaspora Map:**
- [ ] Backend: aggregate user counts by country (public, no PII)
- [ ] Frontend: interactive world map (e.g. react-simple-maps) showing member density

**Trust Score System:**
- [ ] Define scoring rules: +5 verified email, +10 profile complete, +2 per approved listing, +1 per community post, etc.
- [ ] Background task (Celery or Django signal) to recalculate on events
- [ ] Trust score badge visible on profiles, listings, and business cards

**Digital Tontine:**
- [ ] `Tontine` model — name, creator, members (M2M User), contribution_amount, currency, cycle, start_date
- [ ] `TontineRound` model — tontine (FK), recipient (FK User), round_number, date, is_paid
- [ ] ViewSets + serializers
- [ ] Frontend: tontine dashboard with round schedule

---

## Phase 13 — Production Readiness

**Backend:**
- [ ] Switch to Gunicorn in production Dockerfile
- [ ] Configure Whitenoise for static files
- [ ] Add Celery + Celery Beat (async tasks: emails, trust score updates, notifications)
- [ ] Add `django-ratelimit` on auth endpoints
- [ ] Add structured logging (JSON) via `python-json-logger`
- [ ] Health check endpoint `/api/health/`
- [ ] Sentry error tracking

**Frontend:**
- [ ] `next build` optimization (bundle analysis, image optimization)
- [ ] Environment-aware API base URL (`NEXT_PUBLIC_API_URL`)
- [ ] CSP headers via `next.config.js`
- [ ] Sentry error boundary

**CI/CD:**
- [ ] GitHub Actions: lint → test → build on every PR
- [ ] Docker image build & push on merge to main
- [ ] Auto-deploy to staging on merge to main
- [ ] Auto-deploy to production on release tag

**Infrastructure:**
- [ ] HTTPS with Let's Encrypt (Caddy or nginx reverse proxy)
- [ ] Secrets managed via environment variables / vault (never in repo)
- [ ] Postgres backups (daily automated)
- [ ] Redis persistence config for production

---

## API Endpoints Reference

### Users (implemented)
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/users/register/` | None | Create account |
| POST | `/api/users/login/` | None | Get JWT tokens + user data |
| POST | `/api/users/token/refresh/` | None | Refresh access token |
| GET/PATCH | `/api/users/me/` | Bearer | Get / update profile |
| GET | `/api/users/` | Bearer | List users (filterable) |

### All other modules
Currently return `{ "module": "<name>", "status": "coming soon" }`.
Full endpoint tables to be added per phase above.

---

## Testing Strategy

**Backend:**
- `pytest` + `pytest-django` + `factory-boy`
- Unit tests for every serializer and permission class
- Integration tests for every view (use `APIClient`)
- Target: 80%+ coverage before each phase ships

**Frontend:**
- Jest + React Testing Library
- Unit tests for all UI components
- Integration tests for form flows (register, login)
- E2E tests (Playwright) for critical paths: register → login → dashboard

---

## Environment Variables

See `.env.example` for the full list. Key groups:

| Group | Variables |
|-------|-----------|
| Django | `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS`, `DJANGO_SETTINGS_MODULE` |
| Database | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL` |
| Cache | `REDIS_URL` |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| JWT | `JWT_ACCESS_TOKEN_LIFETIME_MINUTES`, `JWT_REFRESH_TOKEN_LIFETIME_DAYS` |
| Frontend | `NEXT_PUBLIC_API_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| CORS | `CORS_ALLOWED_ORIGINS` |

---

## Progress Tracker

| Phase | Module | Backend | Frontend | Tests |
|-------|--------|---------|----------|-------|
| Foundation | users + auth | ✅ Done | ✅ Done | ❌ |
| 1 | Foundation hardening | — | — | ❌ |
| 2 | Community | ❌ | ❌ | ❌ |
| 3 | Events | ❌ | ❌ | ❌ |
| 4 | Business Directory | ❌ | ❌ | ❌ |
| 5 | Marketplace | ❌ | ❌ | ❌ |
| 6 | Associations | ❌ | ❌ | ❌ |
| 7 | News | ❌ | ❌ | ❌ |
| 8 | Immigration | ❌ | ❌ | ❌ |
| 9 | Messaging | ❌ | ❌ | ❌ |
| 10 | Help / Support | ❌ | ❌ | ❌ |
| 11 | Ads | ❌ | ❌ | ❌ |
| 12 | Map, Trust, Tontine | ❌ | ❌ | ❌ |
| 13 | Production | ❌ | ❌ | ❌ |
