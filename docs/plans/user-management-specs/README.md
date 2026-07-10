# User Management Specifications

These specifications split the user-management initiative into small, independently reviewable implementation units.

## Execution order

1. [01 — Application permissions foundation](01-application-permissions-foundation.md)
   - Replaces the API's global role with per-application membership and establishes a first administrator.
2. [02 — User management API](02-user-management-api.md)
   - Adds persisted authorization and protected user/permission CRUD endpoints.
3. [03 — React client foundation](03-react-client-foundation.md)
   - Scaffolds the Vite client and establishes its authenticated API session lifecycle.
4. [04 — Dashboard and integration](04-dashboard-and-integration.md)
   - Delivers the permission-aware administration UI, documentation, and end-to-end validation.

## Fixed decisions

- The only initial application is `user-management-app`.
- Each app membership has one role: `READ_ONLY` or `ADMIN`.
- Public account registration is removed; only app administrators provision accounts.
- A documented CLI seed command provisions the first administrator from environment variables.
- Users are permanently deleted; database relations must cascade accordingly.
- The client is a Vite + React + TypeScript SPA. It uses the API's existing JWT access-token / rotating refresh-token login flow.

## Review contract

Each specification has:

- a limited file boundary;
- test-first acceptance criteria;
- a standalone commit boundary; and
- explicit dependency and verification requirements.

Do not begin a later specification until its listed dependency is merged or otherwise available in the working branch.
