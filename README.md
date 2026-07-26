# Personal Bookmark Manager — Full-Stack Application

A private, secure read-later bookmark application built with NestJS (Backend API), Prisma ORM, PostgreSQL, and React + Vite (Frontend Website).

---

## 🔒 Core Security & Privacy Invariant
- **Strict Data Isolation**: Every resource (`Collection`, `Bookmark`) is strictly private to the authenticated user (`ownerId`).
- **Zero Privacy Leakage (HTTP 404 vs 403)**: If User A attempts to access, mutate, or delete a resource belonging to User B (e.g., `GET /collections/:id` or `GET /bookmarks/:id`), the API returns **`404 Not Found`** (never `403 Forbidden`) to prevent metadata disclosure and ID enumeration attacks.
- **Strict Database Query Scoping**: All Prisma queries explicitly include `ownerId: user.sub` in their `where` clause.

---

## 🔐 Bearer Credential Decision & Security Rationale (§3.1 Requirement)

> **Bearer Credential Decision**: We choose the **JWT Access Token** (obtained by supplying `audience: https://bbl-candidate-test-api` during the OIDC Authorization Code PKCE flow) as the sole Bearer credential accepted by the NestJS backend API.

### Rationale & Security Trade-offs
1. **RFC 6750 & OAuth 2.0 Compliance**: Access Tokens are standard bearer credentials for resource server authorization carrying intended audience scopes (`aud: https://bbl-candidate-test-api`).
2. **PII Protection**: ID Tokens contain user identity PII claims (email, name, picture). Transmitting ID Tokens on every REST API request inflates header size and risks leaking personal identity details into proxy and access logs. Access tokens present standard, scoped claims.
3. **JWKS Asymmetric Verification**: Signatures are dynamically verified against the tenant's JSON Web Key Set (`.well-known/jwks.json`).

---

## 🚀 Quick Start & Docker Containerization

The entire full-stack application (PostgreSQL, NestJS Backend API, and React Vite Frontend SPA) can be built and launched with a single Docker Compose command.

### Prerequisites
- Node.js (>= v20) & npm (for local development)
- Docker & Docker Compose

### 1. Launch Full Container Stack (PostgreSQL + Backend + Frontend)
```bash
# From workspace root
docker compose up --build -d
```
This single command:
1. Starts **PostgreSQL 16** container (`bbl-postgres`) on port `5432` with health checks.
2. Builds the **NestJS Backend API** container (`bbl-backend`) on port `3001`. Automatically runs Prisma schema sync, multi-user database seeding, and starts the server.
3. Builds the **React + Vite Frontend** container (`bbl-frontend`) using multi-stage Nginx Alpine on port `3000`. Serves production assets with static host rewrites (`try_files $uri $uri/ /index.html;`) and optimal asset caching headers.

### 2. Verify Running Containers
```bash
docker compose ps
```

---

## 🏃 Running the Application

### Development Mode
```bash
cd backend
npm run start:dev
```
The NestJS backend server will start on `http://localhost:3000`.

### Production Build & Run
```bash
cd backend
npm run build
npm run start:prod
```

---

## 🧪 Comprehensive Backend Verification & Test Commands

The repository features a comprehensive verification harness including automated unit tests, end-to-end security suites, and database seeding.

### 1. Run Unit Tests
Verifies service logic, controller handlers, JWT strategies, and share token generation in isolation.
```bash
cd backend
npm test
```

### 2. Run End-to-End (E2E) Security Tests
Executes adversarial cross-user privacy, authentication, and collection sharing security suites against a live application context.
```bash
cd backend
npm run test:e2e
```

### 3. Run Test Coverage Report
Generates code coverage metrics across all controllers, services, and modules.
```bash
cd backend
npm run test:cov
```

### 4. Database Seeding Verification
Seeds the database with two distinct users (`candidate@test.com` and a secondary user) to verify cross-user isolation.
```bash
cd backend
npx prisma db seed
```

---

## 🛡️ Verification Test Suites Breakdown

| Test Suite File | Type | Verification Target | Key Assertions |
|---|---|---|---|
| [share.service.spec.ts](./backend/src/share/share.service.spec.ts) | Unit | `ShareService` logic | Token generation, expiry validation, owner restriction, `ownerId` sanitization. |
| [auth.security.e2e-spec.ts](./backend/test/auth.security.e2e-spec.ts) | E2E | Auth Guard & OIDC JWT validation | Rejects unsigned, expired, or invalid audience tokens (`401 Unauthorized`). |
| [cross-user-security.e2e-spec.ts](./backend/test/cross-user-security.e2e-spec.ts) | E2E | Privacy Invariant Isolation | Verifies User B receives `404 Not Found` for User A collections/bookmarks (GET, PUT, PATCH, DELETE, list filtering, and collection injection). |
| [share-security.e2e-spec.ts](./backend/test/share-security.e2e-spec.ts) | E2E | Collection Sharing (ADR-05) | Public unauthenticated access without identity leakage, token regeneration invalidation, and unauthorized revocation prevention. |

---

## 📋 API Endpoints Overview

### Profile
- `GET /me` — Current user profile details.

### Collections (`/collections`)
- `GET /collections` — List authenticated user's collections.
- `POST /collections` — Create new collection.
- `GET /collections/:id` — Retrieve collection owned by user.
- `PUT /collections/:id` — Full update of collection name.
- `PATCH /collections/:id` — Partial update of collection name.
- `DELETE /collections/:id` — Delete collection (`onDelete: SetNull` moves bookmarks to uncategorized).
- `GET /collections/:id/bookmarks` — List bookmarks in collection owned by user.

### Bookmarks (`/bookmarks`)
- `GET /bookmarks` — List user bookmarks (optional `collectionId` query filter).
- `POST /bookmarks` — Create new bookmark (validates collection ownership).
- `GET /bookmarks/:id` — Retrieve single bookmark.
- `PUT /bookmarks/:id` — Full update of bookmark.
- `PATCH /bookmarks/:id` — Partial update of bookmark.
- `DELETE /bookmarks/:id` — Delete bookmark.

### Collection Sharing (`/collections/share`) — ADR-05
- `POST /collections/share` (Protected) — Generate/regenerate read-only share token.
- `GET /collections/share/:token` (Public) — Public access to shared collection & bookmarks (no auth required, `ownerId` sanitized).
- `DELETE /collections/share/:token` (Protected) — Revoke share token.

---

## 🏛️ Architecture Decision Records (ADRs)

- **ADR-01: JWT Access Token Strategy**: Accepted JWT Access Token with `audience` validation as Bearer credential.
- **ADR-02: Collection Deletion Cascade**: Retains bookmarks and sets `collectionId = null` (uncategorized bookmarks).
- **ADR-03: HTTP 404 Privacy Isolation**: Strict `404 Not Found` for unowned resources.
- **ADR-04: Collection Injection Prevention**: Validates collection ownership prior to linking bookmarks.
- **ADR-05: Read-Only Collection Share Link**: Public read-only share token with zero owner identity leakage and instant invalidation on regeneration.
