# Zyvora Implementation Status

Last updated: 2026-11-17

## Phase Status

- [x] Phase 0 - Requirements and architecture baseline documented
- [x] Phase 1 - Monorepo foundation initialized
- [~] Phase 2 - Auth, RBAC, business setup (in progress)
- [~] Phase 3 - Customer design system and storefront core (in progress)
- [~] Phase 4 - Product and category management (in progress)
- [~] Phase 5 - Commerce flows (in progress)
- [ ] Phase 6 - Customer trust and moderation
- [ ] Phase 7 - Admin control center modules
- [ ] Phase 8 - Hardening and production readiness

## What is implemented now

1. Monorepo structure with pnpm workspaces and Turbo tasks.
2. Three independent apps:
   - `apps/customer-web`
   - `apps/admin-web`
   - `apps/api`
3. Initial backend foundation with:
   - Express app
   - Security middleware (helmet, cors, cookie parser, rate limit)
   - Zod-based env validation
   - Auth module including signup/signin/signout endpoints and Google OAuth callback flow
   - Session-backed refresh-token rotation and refresh token revocation
   - Backend RBAC middleware (`requireAuth`, `requireRoles`)
   - One-time admin bootstrap endpoint (`/api/v1/auth/bootstrap-admin`)
4. Initial premium UI shell for customer and admin websites with independent routing and branding tokens.
5. Representative design-review screens delivered for both applications:
   - Customer: homepage, listing, product detail, cart, checkout, account, sign in, sign up
   - Admin: dashboard, products, product create, categories, orders, customers, settings, sign in
6. Business profile persistence and admin-only profile update endpoints (`/api/v1/business/profile`) replacing hardcoded branding.
7. Docker Compose dev dependencies for MongoDB and Redis.
8. Catalog backend foundation:
   - Dynamic category hierarchy with cycle-safe parent management
   - Reusable attribute-definition engine with data types and category applicability
   - Public category tree endpoint and category-specific dynamic filter metadata endpoint
   - Admin RBAC-protected CRUD endpoints for categories and attribute definitions
9. Product and inventory backend foundation:
   - Product core entity with publication-state transition validation
   - Variant entity with unique SKU and pricing rules
   - Public product list/detail APIs for published catalog
   - Inventory records per variant with movement audit logging
   - Admin inventory adjustment and low-stock monitoring endpoints
10. Admin control center moved from placeholders to operational API-backed screens:
   - Admin signin with token storage and role validation
   - Category and attribute management page wired to backend catalog endpoints
   - Product listing and low-stock alert page wired to backend product/inventory endpoints
   - Product creation form and product detail screen with variant creation and inventory adjustments
11. Admin OAuth and advanced product controls:
   - Admin-targeted Google OAuth flow with backend role enforcement and separate callback route
   - Product detail publication status update control
   - Product detail low-stock-threshold update control per variant
12. Customer commerce integration:
   - Backend cart module with stock-aware add/update validation and server-side total calculation
   - Backend wishlist module with published-product validation
   - Customer storefront signin/signup forms wired to backend auth
   - Customer cart, wishlist, and account screens wired to live APIs

## Pending critical items

1. Database models for full domain (products, categories, inventory, orders, CMS, reviews, etc.)
2. Production-grade payment flow and webhook idempotency
3. Full RBAC policies and resource-level authorization
4. Media upload pipeline and moderation workflow
5. Full storefront pages and admin management modules
6. Comprehensive test coverage and CI/CD pipeline

## Engineering notes

- Feature fixtures used only for development previews must remain isolated from production data pathways.
- Financial calculations and stock reservations must remain backend-owned and transactional.
- No admin feature should be exposed without backend authorization checks.
