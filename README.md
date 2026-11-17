# Zyvora Premium Commerce Platform

Zyvora is a monorepo containing three independent applications:

- `apps/customer-web` - premium customer storefront
- `apps/admin-web` - premium admin control center
- `apps/api` - centralized commerce API

## Stack

- Frontend: Next.js App Router + React + TypeScript + Tailwind
- Backend: Node.js + Express + TypeScript + MongoDB + Redis
- Monorepo: pnpm workspaces + Turbo

## Quick Start

1. Copy environment template:
   - `cp .env.example .env`
2. Start local data services:
   - `docker compose up -d`
3. Install dependencies:
   - `pnpm install`
4. Start all apps:
   - `pnpm dev`

App URLs:

- Customer storefront: `http://localhost:3000`
- Admin control center: `http://localhost:3001`
- API: `http://localhost:4000`

## Authentication

- Email/password signup and signin endpoints are provided by the API.
- Google OAuth entry points:
  - `GET /api/v1/auth/google`
  - `GET /api/v1/auth/google/callback`
- Refresh token rotation:
   - `POST /api/v1/auth/refresh`
- Signout with session revocation:
   - `POST /api/v1/auth/signout`
- First admin bootstrap (one-time):
   - `POST /api/v1/auth/bootstrap-admin`
   - Requires `ADMIN_BOOTSTRAP_KEY` and only works while no admin user exists.

## Business Profile and Branding

- Public storefront branding:
   - `GET /api/v1/business/branding/public`
- Admin-only business profile endpoints:
   - `GET /api/v1/business/profile`
   - `PUT /api/v1/business/profile`
   - Requires Bearer access token with `admin` role.

## Status Tracking

Implementation phases and progress are maintained in `docs/IMPLEMENTATION_STATUS.md`.

## Current Scope

This baseline includes architecture, monorepo setup, initial premium screen set for design review, and foundational auth APIs. Full commerce domain modules (catalog, cart, checkout, orders, inventory, CMS, moderation, analytics) are tracked for subsequent phases.
