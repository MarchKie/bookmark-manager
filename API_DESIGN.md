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