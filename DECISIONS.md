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

### Trade-offs
- the frontend must pass `audience: https://bbl-candidate-test-api` during the Authorization Code PKCE flow