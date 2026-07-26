# AI Workflow & Reflection Log
---

## 1. AI Tools & Models Used
- **AI Coding Agent**: Antigravity IDE Coding Agent
- **LLM Model**: Gemini 3.6 Flash (High)
- **MCP Servers**: Context7 MCP Server (`resolve-library-id`, `query-docs`)
- **Custom Skill**: `vite-react-best-practices` ([SKILL.md](.agents/skills/vite-react-best-practices/SKILL.md))

---

## 2. Agent Rules & Guardrails
- **Rule Enforcement**: Strictly follow [AGENTS.md]
- **Data Privacy Invariant**: All DB queries strictly scope by authenticated user `ownerId`.

---

## 3. Task Execution Plan

---

## 4. What AI Did Well & Where It Failed

### What AI Did Well
1. **Rapid Type-Safe Infrastructure Scaffolding**:
   The agent generated full NestJS DTOs with `class-validator`, Prisma ORM models, and service interfaces cleanly within minutes, adhering strictly to NestJS dependency injection patterns.
2. **Comprehensive Adversarial Security Test Suite**:
   The agent generated robust end-to-end security test suites using RSA-256 JWT key-signing mocks to simulate two distinct users (`User A` candidate and `User B` adversary). The tests rigorously verified list isolation, cross-user mutation guards, and 404 responses.
3. **Vite React Performance & Design System**:
   Applied the `vite-react-best-practices` skill to build a modern MUI v6 frontend with custom Outfit/Inter typography, dark/light theme switching, and automatic route-level code splitting (`React.lazy` and `Suspense`).

---

### Flaws, Failures & Recovery Process

#### Flaw 1: Cross-User Privacy Leakage via 403 Forbidden (vs 404 Not Found)
- **Agent's First Attempt**: When querying a collection by ID (`GET /collections/:id`), the agent originally wrote:
  ```ts
  const collection = await prisma.collection.findUnique({ where: { id } });
  if (collection.ownerId !== user.sub) throw new ForbiddenException();
  ```
- **Why it failed**: Throwing `403 Forbidden` confirms to an attacker that the resource ID exists in the database, enabling ID probing and metadata leakage in violation of Section §3 of the test spec.
- **How it was caught & recovered**: Caught during `AGENTS.md` rule review. Refactored all queries (`findFirst`, `update`, `delete`) to include `ownerId: user.sub` in the database `where` clause. If unowned, Prisma returns `null` and the service throws `NotFoundException` (`404 Not Found`).

---

#### Flaw 2: Cross-User Collection Injection during Bookmark Creation
- **Agent's First Attempt**: When receiving `POST /bookmarks` with a `collectionId`, the agent created the bookmark record without verifying whether the target collection belonged to the authenticated user.
- **Why it failed**: User B could supply User A's valid `collectionId`, associating User B's bookmark with User A's private collection.
- **How it was caught & recovered**: Caught while writing adversarial test cases in `cross-user-security.e2e-spec.ts`. Added explicit collection ownership validation in `BookmarksService.create()`, `update()`, and `patch()` via `this.collectionsService.findOne(dto.collectionId, ownerId)`.

---

#### Flaw 3: Identity Leakage in Public Share Payload & Unauthorized Revocation
- **Agent's First Attempt**: When implementing ADR-05 collection sharing (`GET /collections/share/:token`), the agent returned the raw database collection record including `ownerId: "auth0|..."`. Additionally, `DELETE /collections/share/:token` allowed any authenticated user to delete a share token without checking collection ownership.
- **Why it failed**:
  1. Exposing `ownerId` on a public unauthenticated route leaks owner identity details, violating the core Privacy Invariant.
  2. Allowing User B to revoke User A's share token enables cross-user tampering and unauthorized revocation.
- **How it was caught & recovered**: Caught during `share-security.e2e-spec.ts` test execution. Refactored `ShareService.getSharedCollection()` to return a sanitized shape excluding `ownerId`, and updated `ShareService.revokeShareToken()` to verify `share.collection.ownerId === ownerId`, returning `404 Not Found` if User B attempts to manipulate User A's share token.

---

#### Flaw 4: Auth0 Callback URL Mismatch (Port 3001 vs 3000) & Missing Backend CORS
- **Agent's First Attempt**: When scaffolding the Vite frontend in `vite.config.ts`, the agent configured the dev server to run on port `3001` (`port: 3001`). Consequently, `@auth0/auth0-react` generated a PKCE redirect URI of `http://localhost:3001/callback`. Additionally, NestJS `main.ts` was initialized without calling `app.enableCors()`.
- **Why it failed**:
  1. The Auth0 tenant specifies a strict `Callback URL: http://localhost:3000/callback` in the test specification (§3.1). Initiating OAuth PKCE login from port 3001 triggered a `Callback URL Mismatch` / `Redirect URI Mismatch` error from Auth0.
  2. Cross-origin REST requests from the frontend on port 3000 to the backend on port 3001 were blocked by browser CORS policy due to missing NestJS CORS headers.
- **How it was caught & recovered**:
  1. Cross-referenced the Auth0 configuration table in `Full-Stack-Developer-Test.pdf` §3.1.
  2. Updated `frontend/vite.config.ts` to serve on port `3000` (`port: 3000, strictPort: true`).
  3. Updated `backend/src/main.ts` to listen on port `3001` (`PORT=3001`) and added `app.enableCors({ origin: true, credentials: true })`.
  4. Configured `frontend/.env` with `VITE_API_BASE_URL=http://localhost:3001`.
