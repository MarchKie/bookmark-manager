# Decisions
---
## 1.ADR-01: Token Strategy for Bearer Authentication (access token vs id_token)
### Context
Section §3.1 requires OIDC authentication against Auth0. Candidates must choose which token the API accepts as the Bearer credential and justify the choice.

### Decision
We choose the **JWT Access Token** (obtained by supplying `audience: https://bbl-candidate-test-api` during the Authorization Code PKCE flow) as the sole Bearer credential accepted by the NestJS backend API.

### Rationale
1. **Oauth 2.0 & OpenID Connect (OIDC) Compliance:**
   - **Access Tokens** are defined in **RFC 6750** as the standard bearer credentials for resource server access, carrying authorization scope and intended audience.
   - **ID Tokens** are **OIDC-specific artifacts** intended for client-side identity presentation, not backend API authorization.
   - Using Access Tokens aligns with industry-standard OAuth 2.0 security patterns.
2. **Asymmetric Signature Verification:**
   - **JWKS-based verification** (using the `.well-known/jwks.json` endpoint) is the industry-standard method for public key validation of JWT signatures in resource servers.
   - This approach ensures that the backend can verify token authenticity without relying on shared secrets with the authorization server.
3. **Audience-based Authorization:**
   - **Access Tokens** contain the `aud` (audience) claim, which specifies the intended recipient of the token.
   - the backend verifies `aud === https://bbl-candidate-test-api`, rejecting tokens intended for other applications.

4. **Data Privacy (PII Protection):**
   - ID Tokens contain sensitive user profile claims (email, name, picture). Transmitting ID Tokens on every REST request inflates header size and risks leaking personal identity details into proxy logs.

### Trade-offs
- the frontend must pass `audience: https://bbl-candidate-test-api` during the Authorization Code PKCE flow

---

## 2. ADR-02: Collection Deletion Cascade Behavior (Uncategorized Bookmarks)

### Context
Section §3.3 presents the under-specified requirement: *"Collections hold bookmarks. A user can delete a collection. A user may want to share a collection with someone else."*
Deleting a collection requires defining cascade behavior for nested bookmarks.

### Decision
When a user deletes a `Collection`, associated `Bookmark` records are **retained** in the database with their `collectionId` set to `null` (`onDelete: SetNull`). The bookmarks move to an **Uncategorized** state.

### Rationale
1. **Data Loss Prevention:** Deleting an organizational container (a collection) should not permanently destroy the user's saved web links. Users expect saved bookmarks to remain accessible even if their categorization changes.
2. **Database Integrity:** Setting `collectionId` to `null` maintains referential integrity without requiring soft-delete columns or complex recovery mechanisms.

### Trade-offs
- Bookmarks without collections accumulate in an uncategorized list and require UI support for viewing uncategorized items.
---
## 3. ADR-03: HTTP 404 Not Found for Cross-User Privacy Isolation (404 vs. 403)

### Context
The Core Security Invariant (§3) states: *"Everything in this app is private to the person who created it... If User A can see, edit, or learn of the existence of User B's data, the app is broken."*

### Decision
All database queries (`findMany`, `findFirst`, `update`, `delete`, `count`) MUST include `ownerId: user.sub` in their `where` clause. If a resource exists in the database but belongs to User B, requests by User A return **HTTP 404 Not Found** (never `403 Forbidden`).

### Rationale
1. **Zero Privacy Leakage:** Returning `403 Forbidden` acknowledges to an attacker or unauthorized user that a specific resource ID exists in the database, leaking metadata and enabling ID enumeration attacks.
2. **Uniform Privacy Boundary:** Returning `404 Not Found` hides resource existence entirely, making unauthorized resources indistinguishable from non-existent IDs.

### Trade-offs
- Requires strict query guardrail discipline in every service method to ensure `ownerId` is never omitted.

---

## 4. ADR-04: Cross-User Collection Injection Prevention during Bookmark Mutation

### Context
When creating or updating a bookmark (`POST /bookmarks`, `PUT /bookmarks/:id`, `PATCH /bookmarks/:id`), clients can pass a `collectionId`.

### Decision
Before creating or updating a bookmark with a `collectionId`, the service verifies that the target collection exists AND belongs to `user.sub` (`collectionsService.findOne(dto.collectionId, ownerId)`). If the collection belongs to another user or does not exist, the API throws `404 Not Found`.

### Rationale
1. **Boundary Enforcement:** Prevents User B from supplying User A's `collectionId` to inject bookmarks into User A's private collections.
2. **Consistent Privacy Responses:** Maintains the HTTP 404 response rule for invalid/cross-user collection references.

---

## 5. ADR-05: Collection Sharing — Read-Only Share Link (Minimal Scope)
### Context
The requirement states: 
- *"A user may want to share a collection with someone else."* 
- *"Everything in this app is private to the person who created it. There is no public content, no shared
feed, no "browse other users." If user A can see, edit, or even learn of the existence of user B's data, the
app is broken"* 

### Decision
Implemented a minimal read-only sharing mechanism - the owner can generate a share token for a collection. Anyone with the link can view that collection's bookmarks without logging in. No editing, no account required for the viewer, no visibility
into anything else the owner has. Regenerating the link invalidates the old one and expired old share token (acts as an implicit revoke).

### Rationale
1. **Simplicity:** Easy to implement and understand.
2. **Privacy:** No risk of oversharing private data.
3. **Security:** Cryptographically random tokens prevent guessing.
4. **Control:** Owner can revoke access by regenerating the token or by setting expiry time. After expiry time, the collection cannot be accessed by anyone.
5. **No edit/transferability:** This prevents any accidental or malicious propagation of private content outside the owner's control.

### Trade-offs
- No fine-grained permission controls (e.g., edit access, read-only vs. edit).
- No access logging or auditing.
