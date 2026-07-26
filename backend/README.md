# Backend API Server — Personal Bookmark Manager

NestJS REST API server providing OIDC-authenticated bookmark management, collection organization, uncategorized bookmark tracking, and read-only collection sharing.

---

## 🔒 Security & Privacy Invariant
- **Strict User Isolation**: All query operations include `ownerId: user.sub`.
- **HTTP 404 Not Found Standard**: Attempts by User B to view, edit, or delete User A's data return `404 Not Found` (never `403 Forbidden`).

---

## 🔐 Bearer Credential Decision (§3.1 Requirement)
> We choose the **JWT Access Token** (obtained via Authorization Code PKCE flow with `audience: https://bbl-candidate-test-api`) as the sole Bearer credential accepted by the NestJS backend API.

---

## 🏃 Setup & Command Line Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Schema Sync & Generation
```bash
# Push database schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed database with multi-user sample data
npx prisma db seed
```

### 3. Run Application Server
```bash
# Development
npm run start:dev

# Production build & run
npm run build
npm run start:prod
```

---

## 🧪 Verification & Testing Commands

### Unit Tests
```bash
npm test
```

### End-to-End Security Tests
```bash
npm run test:e2e
```

### Test Coverage Report
```bash
npm run test:cov
```

### Multi-User Seeding Verification
```bash
npx prisma db seed
```

---

## 🛡️ Test Suite Reference

- **[share.service.spec.ts](file:///d:/BBL_Project/backend/src/share/share.service.spec.ts)** — Unit testing for `ShareService` logic and sanitization.
- **[auth.security.e2e-spec.ts](file:///d:/BBL_Project/backend/test/auth.security.e2e-spec.ts)** — End-to-end verification of JWT signatures, JWKS resolution, and token audience rules.
- **[cross-user-security.e2e-spec.ts](file:///d:/BBL_Project/backend/test/cross-user-security.e2e-spec.ts)** — End-to-end verification of 404 response logic for unowned resources across all REST verbs.
- **[share-security.e2e-spec.ts](file:///d:/BBL_Project/backend/test/share-security.e2e-spec.ts)** — End-to-end verification of collection share link generation, public access, token regeneration, and revocation security.
