# Platform Diaspora Ivoirienne — Development Rules

Good practices that apply to every line of code written on this platform.
These are not to-dos. They are standing rules — follow them always.

---

## 1. Secrets & Security

- Never hardcode secrets, passwords, API keys, or tokens in source files — use environment variables only
- Never commit `.env` files — `.env.example` with dummy values is the only allowed reference
- Never log sensitive data: passwords, tokens, personal emails, phone numbers
- Always sanitize and validate all user input at the API boundary — never trust the client
- Use `django-environ` to read env vars in settings — never use `os.environ.get()` directly in views
- Rotate JWT tokens on every refresh — never allow long-lived access tokens without rotation
- Hash all passwords through Django's auth system — never store or compare plaintext passwords
- Apply rate limiting on all auth endpoints (`/register`, `/login`, `/token/refresh`)
- Use HTTPS in production — never allow plain HTTP for authenticated routes
- Set `SECURE_BROWSER_XSS_FILTER`, `X_FRAME_OPTIONS`, `SECURE_CONTENT_TYPE_NOSNIFF` in production settings

---

## 2. Git Workflow

- Never commit directly to `main` — always work on a feature branch
- Branch naming: `feat/<short-description>`, `fix/<short-description>`, `chore/<short-description>`
- Every commit must leave the app in a working state — no broken commits
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- One logical change per commit — do not bundle unrelated changes
- Never force-push to `main`
- Pull before pushing — always rebase or merge latest `main` before opening a PR
- All commits happen inside `src/` — never commit from the parent directory
- Never skip pre-commit hooks (`--no-verify`)

---

## 3. Code Quality

- Write code that is readable without comments — good names beat good comments
- Only add a comment when the WHY is non-obvious (a hidden constraint, a workaround, a subtle invariant)
- Never leave dead code, commented-out blocks, or `TODO` comments in committed files — open a ticket instead
- Keep functions and methods small and single-purpose
- DRY within a module — but do not over-abstract across modules before the pattern is proven
- Prefer explicit over implicit — avoid magic strings, magic numbers, or implicit boolean checks on objects
- Delete unused imports, variables, and files — do not leave stubs in committed code
- Never suppress linter warnings with inline ignores unless there is a documented reason

---

## 4. Django / Backend Rules

- Every app follows the same structure: `models.py`, `serializers.py`, `views.py`, `urls.py`, `tests/`
- Every model must have `__str__` defined and meaningful
- Every model must have `created_at` (auto_now_add) and `updated_at` (auto_now) timestamps
- Use `select_related` and `prefetch_related` on every queryset that traverses a FK or M2M — never trigger N+1 queries
- Never use `Model.objects.all()` in a view without pagination
- All views that modify data require authentication — `AllowAny` is only for register and login
- Use DRF serializers for all input validation — never validate manually in views
- Return consistent error shapes: `{ "field": ["message"] }` for validation, `{ "detail": "message" }` for others
- Keep business logic in services or model methods — not in views or serializers
- Never write raw SQL unless ORM genuinely cannot express the query — and add a comment explaining why
- All database schema changes go through migrations — never edit the database manually
- Never run `makemigrations` in production — only apply pre-generated migrations
- Use `django-filter` for all list endpoint filtering — never filter manually in `get_queryset`
- Use `drf-spectacular` decorators (`@extend_schema`) on every ViewSet and action

---

## 5. Django Settings

- Split settings into `base.py`, `development.py`, `production.py` — never use a single settings file
- Never set `DEBUG = True` in production settings
- `ALLOWED_HOSTS` must be explicit in production — never use `['*']` in production
- All third-party credentials (Cloudinary, SMTP, etc.) come from environment variables
- `SECRET_KEY` must be a long random string from the environment — never hardcoded, never the Django default

---

## 6. API Design

- All endpoints are versioned under `/api/` — no root-level endpoints
- Use nouns for resource names, not verbs: `/api/events/` not `/api/get-events/`
- Use HTTP methods semantically: GET (read), POST (create), PATCH (partial update), PUT (full update), DELETE (remove)
- Custom actions use DRF `@action` decorator with a descriptive `url_path`
- Every list endpoint supports pagination — never return an unbounded list
- Every list endpoint supports filtering and ordering via query params
- Never expose internal IDs as sequential integers in public-facing URLs — use UUIDs where exposure is a risk
- Return `201 Created` on POST, `200 OK` on GET/PATCH, `204 No Content` on DELETE
- Document every endpoint with `@extend_schema` before shipping

---

## 7. Database

- Define `db_index=True` on every FK that is used in a `filter()` or `order_by()`
- Add `unique_together` or `UniqueConstraint` wherever the data model demands it — do not rely on application logic alone
- Never delete a migration file — squash instead if history is too long
- Name migrations descriptively: `0002_add_trust_score_to_user` not `0002_auto_20240101`
- Use `on_delete=models.PROTECT` for critical FKs (e.g. user data) — use `CASCADE` only where cascade deletion is intentional
- All money/financial fields use `DecimalField` — never `FloatField`

---

## 8. Next.js / Frontend Rules

- All pages under `/app/` use the App Router — never mix Pages Router patterns
- Every page that requires authentication checks the session before rendering — redirect to `/auth/login` if unauthenticated
- Never store JWTs in localStorage in production — use httpOnly cookies or a secure token store
- Use React Query for all server data — never fetch in `useEffect` directly
- Use Zustand only for client-side UI state (sidebar open/closed, modal state, etc.) — not for server data
- All forms use React Hook Form + Zod validation — never build ad-hoc form state with `useState`
- All Zod schemas are defined alongside their form and reused for TypeScript types (`z.infer<typeof schema>`)
- Never use `any` in TypeScript — use `unknown` and narrow, or define a proper type
- Never disable TypeScript with `// @ts-ignore` unless there is a documented reason
- All API calls go through a central Axios instance with the auth interceptor attached — never call `axios.get()` directly
- Every data-fetching component handles three states: loading (skeleton), error (message + retry), and success
- Images from Cloudinary must use Next.js `<Image>` component — never raw `<img>` tags
- Keep component files under 200 lines — extract sub-components when exceeded

---

## 9. Styling

- Use Tailwind utility classes only — no custom CSS files except for the global reset
- Follow the design system: use `ci-orange` and `ci-green` color tokens, not raw hex values
- Use the `cn()` utility for conditional class merging — never string-concatenate class names
- Never use inline `style` props unless Tailwind genuinely cannot express the value
- Mobile-first: default styles are for small screens, `md:` and `lg:` breakpoints add larger-screen styles
- All interactive elements (buttons, links, inputs) must have visible focus styles for keyboard navigation
- Color is never the only means of conveying information — add icons, labels, or patterns for accessibility

---

## 10. Testing

- Write tests before shipping any feature — no untested code merges to `main`
- Every serializer has unit tests for valid input, missing fields, and invalid types
- Every view has integration tests covering: success path, unauthenticated access, invalid input, and not-found
- Every frontend component has a unit test verifying it renders without crashing
- Every form has an integration test covering: valid submission, validation errors, and API error display
- Use `factory-boy` for all backend test data — never hardcode fixture data in test files
- Never mock the database in backend tests — use a real test database
- Test file names mirror source file names: `test_views.py` for `views.py`, `Button.test.tsx` for `Button.tsx`
- Aim for 80%+ test coverage on every app before it ships

---

## 11. Docker & Infrastructure

- Every service in `docker-compose.yml` has a healthcheck
- Never pin dependencies to `latest` in Dockerfiles — always use a specific version tag
- Application containers run as non-root users in production
- Environment variables are passed to containers via `.env` files or a secrets manager — never baked into images
- `docker compose up --build` must succeed from a clean state — document any manual steps that can't be automated

---

## 12. Performance

- Never trigger database queries inside a loop — batch with `bulk_create`, `bulk_update`, or a single annotated queryset
- Cache expensive or repeated read queries with Redis — use Django's cache framework
- Use Cloudinary transformations for image resizing — never resize images in Python at request time
- Paginate every list view — default 20 items per page, max 100
- WebSocket consumers (Django Channels) must release connections cleanly on disconnect

---

## 13. Collaboration & Review

- Every PR has a clear description: what changed, why, and how to test it
- Self-review your own diff before requesting a review — no typos, no debug prints, no leftover `console.log`
- Never merge your own PR — at least one other review required
- Address all review comments before merging — do not dismiss without a written response
- Breaking changes (model field removal, API contract change) require a migration plan written before coding begins
