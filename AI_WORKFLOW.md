# AI Workflow & Reflection Log
---

This document details the task decomposition, agent tool usage, successes, AI flaws and recovery processes, effective vs. ineffective prompts, and token efficiency strategies used throughout the develo
pment of the **Personal Bookmark Manager**

---

## 1. AI Tools & Models Used
- **AI Coding Agent**: Antigravity IDE Coding Agent
- **LLM Model**: Gemini 3.6 Flash (High)
- **MCP Servers**: Context7 MCP Server (`resolve-library-id`, `query-docs`), Prisma MCP Server (`migrate-status`, `migrate-dev`)
- **Custom Skill**: `vite-react-best-practices` ([SKILL.md](.agents/skills/vite-react-best-practices/SKILL.md))

---

## 2. Agent Rules & Guardrails
- **Rule Enforcement**: Strictly follow [AGENTS.md]
- **Data Privacy Invariant**: All DB queries strictly scope by authenticated user `ownerId`.
- **Context7 MCP Server**: Use for Node.js, NestJS, and Vite/React documentation lookup.

---

## 3. Task Execution Plan

The project was implemented in 6 structured phases:

1. **Phase 0: Environment Setup & Agent Guardrails**
   - Configured repository rules ([AGENTS.md](AGENTS.md)) and Context7/Prisma MCP servers.
   - Set up workspace structure for backend and frontend.

2. **Phase 1: Auth0 Tenant Investigation & Token Strategy**
   - Inspected Auth0 discovery document (`.well-known/openid-configuration`) and JWKS endpoint.
   - Formulated **ADR-01**: Selected JWT Access Tokens (`aud: https://bbl-candidate-test-api`) for Bearer API authorization.

3. **Phase 2: Database Infrastructure & Prisma ORM**
   - Launched PostgreSQL container (`docker-compose.yml`).
   - Defined schema ([schema.prisma](backend/prisma/schema.prisma)) and initialized `PrismaService` with `@prisma/adapter-pg`.

4. **Phase 3: OIDC Authentication & User Profile**
   - Built `JwtAuthGuard` & `JwtStrategy` with dynamic JWKS signature verification.
   - Implemented `@CurrentUser()` decorator and `/me` profile endpoint.

5. **Phase 4: Core Domain Endpoints & Security Isolation**
   - Implemented `/collections` and `/bookmarks` controllers and services.
   - Enforced **ADR-02** (set null on collection delete), **ADR-03** (404 Not Found privacy boundary), and **ADR-04** (collection injection guard).
   - Created adversarial e2e test suite (`cross-user-security.e2e-spec.ts`).

6. **Phase 5: Read-Only Sharing (ADR-05), Backend Verification**
   - Implemented `CollectionShare` model & `/collections/share` endpoints (ADR-05).
   - Created multi-user database seed script (`seed.ts`) and verified `share-security.e2e-spec.ts`.

7. **Phase 6: Frontend Implementation & Backend Integration**
   - Built React + Vite SPA adhering to `vite-react-best-practices` skill with MUI v6, Auth0 PKCE login, and lazy-loaded routes.
   - Integrated with backend APIs using Axios for authentication, collections, bookmarks, and sharing.



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
