# Agent Instructions & Project Rules (AGENTS.md)
---
This repository contains the **Personal Bookmark Manager** full-stack web application. This document defines the mandatory rules, architectural constraints, security invariants, and coding standards for all AI coding agents working on this codebase.

---

## 1. Core Mission & Non-Negotiable Invariants

### 🔒 Absolute Data Privacy & Isolation Invariant
- **EVERY resource (Collection, Bookmark) belongs strictly to the authenticated user (`ownerId`).**
- **Zero Privacy Leakage:** A signed-in user must NEVER be able to read, create, update, patch, delete, or even infer the existence of another user's collections or bookmarks.
- **HTTP 404 vs 403:** If User A attempts to access or mutate a resource belonging to User B (e.g., `GET /collections/:id` or `GET /bookmarks/:id`), the API MUST return `404 Not Found` (or `403 Forbidden` without revealing data existence). Returning user B's data or revealing its presence is an immediate security failure.
- **Database Query Guardrails:** All Prisma database queries (`findMany`, `findFirst`, `update`, `delete`, `count`) MUST include the authenticated user's `ownerId` in the `where` clause (e.g., `where: { id, ownerId: user.sub }`).

---

## 2. Technical Stack Specifications

### 🖥️ Backend Service (`/backend`)
- **Runtime & Framework:** Node.js + TypeScript, NestJS (`@nestjs/core`, `@nestjs/common`).
- **ORM & Database:** Prisma ORM with PostgreSQL database.
- **Authentication & Security:**
  - OIDC Authentication against Auth0 tenant (`https://dev-yg.us.auth0.com/.well-known/openid-configuration`).
  - Client ID: `H9F6QG5SzTKMv0tbmgxLj9LjG1EKVllA`, Audience: `https://bbl-candidate-test-api`.
  - Auth Flow: Authorization Code Flow with PKCE (S256).
  - Validation: Verify JWT access tokens using JWKS (`jwks_uri`) and NestJS AuthGuard/Passport JWT strategy.
- **Endpoints & Resources:**
  - `/me` : Get current signed-in user profile details.
  - `/collections` : GET (list/filter), POST (create), GET `:id`, PUT `:id`, PATCH `:id`, DELETE `:id`.
  - `/bookmarks` : GET (list/filter by `collectionId`), POST (create), GET `:id`, PUT `:id`, PATCH `:id`, DELETE `:id`.
  - `/collections/:id/bookmarks` : GET all bookmarks in a specific collection owned by the user.
  
> ⚠️ **TBD before implementing the auth guard:** issuer, `jwks_uri`, supported signing
> algorithm(s), and token endpoint auth method must be confirmed by inspecting the
> discovery document and JWKS directly — do not assume defaults. This section will be
> updated with the confirmed values once that investigation is done (see `DECISIONS.md`
> and `transcripts/`).

### 🌐 Frontend Website (`/frontend`)
- **Framework & Build:** React with Vite, TypeScript. (**Strictly NO Next.js**).
- **Routing:** React Router (`>= v8` or `react-router` v7/v8 setup).
- **UI Component Library:** Material UI (`MUI` standard components).
- **Pages & Views:**
  - `/collections` : List user collections, view single collection, create collection, delete collection.
  - `/bookmarks` : List user bookmarks, view details, create bookmark, delete bookmark, filter by collection.
  - `/all` (Bonus): Combined page displaying collections with nested bookmarks.

---

## 3. Ambiguity & Feature Decision Framework

### 📐 Under-specified Requirement: Collection Sharing & Deletion
Brief requirement: *"Collections hold bookmarks. A user can delete a collection. A user may want to share a collection with someone else."*
- **Privacy Trade-off Decision:**
  - Sharing must be strictly evaluated to preserve the Core Security Invariant (e.g., explicit read-only access or unlisted tokens without exposing owner identity).
  - Deleting a collection MUST specify cascade behavior: either nullify `collectionId` on bookmarks (moving them to uncategorized) or delete associated bookmarks explicitly. Document this decision in `DECISIONS.md`.

---

## 4. Code Quality, Testing & Verification Rules

1. **Test-Driven Security Verification:**
   - Write automated unit and integration tests (NestJS `@nestjs/testing`, Jest, Supertest) for all guards, services, and controllers.
   - Include adversarial security tests: verify User A receiving `404` when requesting User B's resource IDs.
2. **Prisma Database Seeding:**
   - Seed data must include at least **two distinct users** (`candidate@test.com` and a secondary user) to verify cross-user isolation.
3. **Clean Code & Error Handling:**
   - Use standard NestJS DTOs with `class-validator` and `class-transformer` for strict payload validation.
   - Standardized JSON error response shapes across all endpoints.

---

## 5. Required Repository Deliverables & Artifacts

All agents must maintain and update the following project documentation:
- `API_DESIGN.md` : OpenAPI / API contract spec, error shapes, status codes, privacy enforcement logic, and notes on agent missteps & corrections.
- `DECISIONS.md` : Architecture Decision Records (ADRs) explaining choices under under-specified requirements.
- `AI_WORKFLOW.md` : Process writeup detailing task decomposition, agent tool usage, successes, failures, and prompt logs.
- `README.md` : Setup, installation, environment variables, database migration/seeding, test execution instructions, and implementation status.

---

## 6. Reusable Agent Capabilities (`/.agents/` & Skills)

The repository configures reusable capabilities, MCP tools, and skills to steer AI agents deterministically:

### 1. `vite-react-best-practices` Custom Skill
- **Path**: [.agents/skills/vite-react-best-practices/SKILL.md](.agents/skills/vite-react-best-practices/SKILL.md)
- **Definition**: Senior-level guidelines for Vite + React SPAs covering route-level code splitting (`React.lazy`), `VITE_` environment variable scoping, static host rewrites, and Rollup build validation.
- **When & Why Invoked**: Invoked automatically whenever building, refactoring, or reviewing frontend React components and Vite configurations to prevent SPA routing 404s, unhandled bundle bloat, and missing environment variables.

### 2. Context7 Documentation MCP Integration (`context7`)
- **Path**: [.agents/mcp_config.json](.agents/mcp_config.json#L5-L10)
- **Definition**: Model Context Protocol (MCP) server providing version-specific documentation lookups (`resolve-library-id`, `query-docs`) for React, NestJS, Prisma, and Auth0 libraries.
- **When & Why Invoked**: Invoked before implementing framework features or API integrations to prevent hallucinating obsolete SDK methods or deprecated signatures.

### 3. Prisma Database ORM MCP Integration (`prisma-mcp-server`)
- **Path**: [.agents/mcp_config.json](.agents/mcp_config.json#L11-L19)
- **Definition**: MCP tool integration providing automated schema migration status checks (`migrate-status`, `migrate-dev`) and database inspection capabilities.
- **When & Why Invoked**: Invoked during database schema refactoring (e.g., adding `CollectionShare` for ADR-05) and multi-user data seeding verification.

