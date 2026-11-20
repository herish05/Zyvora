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
- Google OAuth target routing:
   - Customer: `GET /api/v1/auth/google?target=customer`
   - Admin: `GET /api/v1/auth/google?target=admin`
   - Admin target enforces role check at callback and rejects non-admin users.
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

## Catalog Foundation (Phase 4 start)

- Public category discovery:
   - `GET /api/v1/catalog/categories/public-tree`
   - `GET /api/v1/catalog/categories/:slug/filters`
- Admin category management:
   - `GET /api/v1/catalog/admin/categories`
   - `POST /api/v1/catalog/admin/categories`
   - `PUT /api/v1/catalog/admin/categories/:id`
- Admin attribute-definition management:
   - `GET /api/v1/catalog/admin/attributes`
   - `POST /api/v1/catalog/admin/attributes`
   - `PUT /api/v1/catalog/admin/attributes/:id`
   - All admin catalog endpoints require admin-role Bearer token.

## Product and Inventory Foundation

- Public product APIs:
   - `GET /api/v1/public/products`
   - `GET /api/v1/public/products/:slug`
- Admin product APIs:
   - `GET /api/v1/admin/products`
   - `GET /api/v1/admin/products/:id`
   - `POST /api/v1/admin/products`
   - `PUT /api/v1/admin/products/:id`
- Admin variant and inventory APIs:
   - `POST /api/v1/admin/media/signature` (admin only; signs a Cloudinary upload)
   - `POST /api/v1/admin/products/:id/variants`
   - `PUT /api/v1/admin/variants/:id`
   - `POST /api/v1/admin/variants/:id/inventory-adjustments`
   - `PUT /api/v1/admin/variants/:id/low-stock-threshold`
   - `GET /api/v1/admin/inventory/low-stock`
   - All admin product and inventory endpoints require admin-role Bearer token.
- Product media uploads require `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` on the API service. The API secret stays server-side; uploaded media URLs are saved with the product variant.

## Cart and Wishlist Foundation

- Authenticated customer cart APIs:
   - `GET /api/v1/cart`
   - `POST /api/v1/cart/items`
   - `PUT /api/v1/cart/items/:id`
   - `DELETE /api/v1/cart/items/:id`
- Authenticated customer wishlist APIs:
   - `GET /api/v1/wishlist`
   - `POST /api/v1/wishlist/items`
   - `DELETE /api/v1/wishlist/items/:id`
- Cart behavior:
   - Backend validates stock and active variants on add/update.
   - Totals are computed server-side in minor units.

## Orders and Fulfillment

- Customer order endpoints (customer-role Bearer token):
   - `POST /api/v1/orders` creates a cash-on-delivery order from available product variants and reserves inventory.
   - `GET /api/v1/orders` returns the signed-in customer's orders.
- Admin fulfillment endpoints (admin-role Bearer token):
   - `GET /api/v1/admin/orders`
   - `PUT /api/v1/admin/orders/:id` updates fulfillment status, payment collection status, and tracking number.
- Fulfillment progresses through new, confirmed, packing, shipped, out for delivery, delivered, or cancelled. Cancelling before shipment restores stock.
- Online payments and configurable shipping/tax rates are not connected; the current checkout supports cash on delivery with no shipping charge.

## Status Tracking

Implementation phases and progress are maintained in `docs/IMPLEMENTATION_STATUS.md`.

## Deployment Guide

### 1. Deploying Backend (`apps/api`) to Render (Free Tier)

#### Option A: Blueprint (Recommended)
1. Go to **Render Dashboard** -> **New** -> **Blueprint**.
2. Connect this repository. Render automatically reads `render.yaml`.
3. Fill in required environment secrets:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (`mongodb+srv://...`). Make sure Atlas Network Access allows `0.0.0.0/0`.
   - `JWT_ACCESS_SECRET`: Random 32+ character string.
   - `JWT_REFRESH_SECRET`: Random 32+ character string.
   - `CLIENT_WEB_URL`: Your Vercel frontend URL (or leave default for local).
   - `ADMIN_WEB_URL`: Your Vercel admin URL (or leave default for local).
   - `REDIS_URL`: Optional. If not provided or if free Redis is unavailable, the API seamlessly operates using an in-memory cache fallback.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Required for admin product photo and video uploads. Create these in Cloudinary and set them on the API service only.
4. Click **Apply**.

#### Option B: Manual Web Service
If creating a Web Service directly:
- **Root Directory**: Leave EMPTY (anchored at repository root).
- **Environment**: Node.
- **Node Version**: 22 (read from `.node-version`).
- **Build Command**:
  ```bash
  corepack enable && corepack prepare pnpm@9.15.4 --activate && pnpm install --no-frozen-lockfile --prod=false && pnpm --filter @zyvora/api build
  ```
- **Start Command**:
  ```bash
  node apps/api/dist/server.js
  ```
- **Health Check Path**: `/api/v1/health`

### 2. Deploying Storefront (`apps/customer-web`) to Vercel

1. In **Vercel**, import this GitHub repository.
2. In **Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/customer-web`
   - **Include source files outside Root Directory**: Checked (ON)
3. Set Environment Variables:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://<your-render-api-name>.onrender.com/api/v1`
   - `NEXT_PUBLIC_BRAND_NAME`: `Zyvora`
4. Deploy. `apps/customer-web/vercel.json` automatically orchestrates the monorepo root installation and builds only the customer storefront.

## Current Scope

The platform includes product catalog, inventory, media upload signing, customer checkout for cash-on-delivery orders, and basic fulfillment status management. Online payments, shipping/tax configuration, returns, and customer order notifications are not connected yet.
