# Zyvora Architecture Baseline

## Bounded Applications

- Customer storefront: `apps/customer-web`
- Admin control center: `apps/admin-web`
- Shared backend API: `apps/api`

## Monorepo conventions

- Package manager: pnpm workspaces
- Build orchestration: Turbo
- Language: TypeScript strict mode

## Initial backend module boundaries

- `auth` - login, signup, refresh tokens, Google OAuth
- `users` - user profile and identity records
- `business` - brand/business identity and store settings
- `health` - service health endpoints

Additional modules (products, categories, inventory, cart, checkout, orders, payments, reviews, CMS, analytics, etc.) are tracked for next phases.

## Security baseline (initial)

- Helmet headers
- CORS allowlist
- Cookie parser for secure refresh-token strategy
- Rate limiting
- Zod request and environment validation
- JWT access/refresh flow with rotation hooks

## Authentication strategy

- Customer and admin auth both handled centrally via API.
- Role claims are embedded in short-lived access token.
- Refresh token is HTTP-only cookie, session-backed, and rotated on refresh.
- Google login path via OAuth2, then mapped to local user record.
- One-time admin bootstrap endpoint is protected by environment bootstrap key and disabled after first admin exists.

## Data stores

- MongoDB for transactional domain and content data.
- Redis for caching, queues, session/revocation helpers.
