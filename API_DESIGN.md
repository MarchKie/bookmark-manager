# API_design
---
## 1. Overview
- Base UR: `http://localhost:3001`
- Content Type: `application/json`
- Authentication: Bearer `access_token` in `Authorization` header (`Authorization: Bearer <access_token>`)

---

## 2. Privacy Invariant Enforcement Architecture
> **Privacy Invariant Rule**: Everything in this app is private to the person who created it. If User A can see, edit, or learn of the existence of User B's data, the app is broken.

---

## 3. Resource Endpoints

### 3.1 Profile Endpoint (`/me`)
| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/me` | Get current authenticated user profile & claims | `200 OK` |

---

### 3.2 Collections Resource (`/collections`)

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/collections` | List all collections owned by user | `200 OK` |
| `GET` | `/collections/:id` | Get single collection owned by user | `200 OK` / `404` |
| `POST` | `/collections` | Create new collection | `201 Created` |
| `PUT` | `/collections/:id` | Full update of collection name | `200 OK` / `404` |
| `PATCH` | `/collections/:id` | Partial update of collection name | `200 OK` / `404` |
| `DELETE` | `/collections/:id` | Delete collection (`onDelete: SetNull` for bookmarks) | `204 No Content` / `404` |
| `GET` | `/collections/:id/bookmarks` | List all bookmarks in collection owned by user | `200 OK` / `404` |

#### Collection Schema Shape
```json
{
  "id": "cuid-string",
  "name": "Dev Resources",
  "ownerId": "auth0|user-a-candidate",
  "createdAt": "2026-07-25T00:00:00.000Z",
  "updatedAt": "2026-07-25T00:00:00.000Z",
  "_count": {
    "bookmarks": 3
  }
}
```

---

### 3.3 Bookmarks Resource (`/bookmarks`)

| Method | Endpoint | Query Params | Description | Status Code |
|---|---|---|---|---|
| `GET` | `/bookmarks` | `collectionId` (optional) | List bookmarks owned by user (optionally filtered by collection) | `200 OK` |
| `GET` | `/bookmarks/:id` | - | Get single bookmark owned by user | `200 OK` / `404` |
| `POST` | `/bookmarks` | - | Create new bookmark | `201 Created` / `404` |
| `PUT` | `/bookmarks/:id` | - | Full update of bookmark | `200 OK` / `404` |
| `PATCH` | `/bookmarks/:id` | - | Partial update of bookmark | `200 OK` / `404` |
| `DELETE` | `/bookmarks/:id` | - | Delete bookmark | `204 No Content` / `404` |

#### Bookmark Schema Shape
```json
{
  "id": "cuid-string",
  "url": "https://nestjs.com",
  "title": "NestJS Framework",
  "notes": "Main backend framework",
  "collectionId": "cuid-string",
  "ownerId": "auth0|user-a-candidate",
  "createdAt": "2026-07-25T00:00:00.000Z",
  "updatedAt": "2026-07-25T00:00:00.000Z",
  "collection": {
    "id": "cuid-string",
    "name": "Dev Resources"
  }
}
```

---
### 3.4 Sharing Resource (`/collections/share`)

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `POST` | `/collections/share` | Generate new share token for collection | `201 Created` / `404` |
| `GET` | `/collections/share/:token` | Get share token for collection | `200 OK` / `404` |
| `DELETE` | `/collections/share/:token` | Delete share token for collection | `204 No Content` / `404` |

#### Share Token Schema Shape
```json
{
  "id": "cuid-string",
  "collectionId": "cuid-string",
  "shareToken": "cuid-string",
  "expiresAt": "2026-07-25T00:00:00.000Z",
  "createdAt": "2026-07-25T00:00:00.000Z",
  "updatedAt": "2026-07-25T00:00:00.000Z"
}
```

---

## 4. Error Responses Format
Standardized error shape emitted by NestJS Exception Filters:

- **404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Collection with ID \"col-123\" not found",
  "error": "Not Found"
}
```

- **403 Forbidden**

```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden"
}
```

- **401 Unauthorized**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

- **400 Bad Request**

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Bad Request"
}
```

- **500 Internal Server Error**

```json
{
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Internal Server Error"
}
```

---

## 5.Flaws Caught and Corrected
### Flaw 1: Cross-User Privacy Leakage (403 vs 404)
- **Agent's First Attempt**: The initial service logic attempted to query resources by ID alone (`prisma.collection.findUnique({ where: { id } })`) and then evaluate ownership via an explicit conditional (`if (collection.ownerId !== user.sub) throw new ForbiddenException()`).
- **Why it was wrong**: Returning `403 Forbidden` leaks data existence to malicious actors, allowing User B to probe and infer valid resource IDs belonging to User A, violating the non-negotiable Privacy Invariant in §3.
- **How it was caught & corrected**: Enforced the rule from `AGENTS.md`. Refactored all queries (`findFirst`, `update`, `delete`) to include `ownerId: user.sub` directly in the database `where` clause. If a resource belongs to another user, Prisma returns `null` and the API throws `NotFoundException` (`404 Not Found`).

### Flaw 2: Cross-User Collection Injection during Bookmark Creation
- **Agent's First Attempt**: When receiving `POST /bookmarks` with a `collectionId`, the agent created the bookmark record without verifying whether the referenced collection belonged to the authenticated user.
- **Why it was wrong**: User B could supply User A's `collectionId` in the request body, successfully associating User B's bookmark with User A's collection container.
- **How it was caught & corrected**: Added explicit collection ownership validation in `BookmarksService.create()`, `update()`, and `patch()`. Calling `this.collectionsService.findOne(dto.collectionId, ownerId)` ensures that any target collection MUST exist and belong to `user.sub`, returning `404 Not Found` if it belongs to another user.
