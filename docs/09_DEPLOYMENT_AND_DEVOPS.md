# 09 — Deployment & DevOps Guide

> **Smart OPD** – MERN-Stack OPD Clinic Management Platform  
> Version: 1.0 | Last Updated: {{DATE}} | Audience: Engineering, DevOps

---

## Table of Contents

1. [Environment Overview](#1-environment-overview)
2. [Environment Variables Reference](#2-environment-variables-reference)
3. [Local Development Setup](#3-local-development-setup)
4. [Project Structure Overview](#4-project-structure-overview)
5. [CI/CD Pipeline](#5-cicd-pipeline)
6. [Backend Deployment (Render)](#6-backend-deployment-render)
7. [Frontend Deployment (Vercel)](#7-frontend-deployment-vercel)
8. [MongoDB Atlas Setup](#8-mongodb-atlas-setup)
9. [Cloudinary Setup](#9-cloudinary-setup)
10. [Post-Deployment Verification Checklist](#10-post-deployment-verification-checklist)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Backup & Disaster Recovery](#12-backup--disaster-recovery)
13. [Rollback Procedure](#13-rollback-procedure)

---

## 1. Environment Overview

Smart OPD uses three isolated environments to ensure safe, predictable releases. Each environment has its own database cluster, secrets, and configuration profile.

### 1.1 Environment Summary

| Attribute                | Development                       | Staging                                    | Production                                      |
|--------------------------|-----------------------------------|--------------------------------------------|-------------------------------------------------|
| **Purpose**              | Local feature work & debugging    | Pre-release integration & QA               | Live clinic-facing system                       |
| **Frontend URL**         | `http://localhost:5173`           | `https://staging.{{DOMAIN}}`               | `https://{{DOMAIN}}`                            |
| **Backend URL**          | `http://localhost:5000`           | `https://api-staging.{{DOMAIN}}`           | `https://api.{{DOMAIN}}`                        |
| **Database**             | Local MongoDB or Atlas M0 (free)  | Atlas M0 (shared, isolated DB name)        | Atlas M10+ (dedicated, production DB)           |
| **Secrets source**       | `.env` files (local)              | Render env vars + Vercel env vars          | Render env vars + Vercel env vars               |
| **Debug mode**           | `NODE_ENV=development`            | `NODE_ENV=staging`                         | `NODE_ENV=production`                           |
| **Morgan log level**     | `dev` (colorized, verbose)        | `combined` (Apache-style)                  | `combined` → piped to log aggregator            |
| **Rate limiting**        | Relaxed (1000 req/15 min)         | Standard (500 req/15 min)                  | Strict (200 req/15 min per IP)                  |
| **CORS origins**         | `http://localhost:5173`           | `https://staging.{{DOMAIN}}`               | `https://{{DOMAIN}}`                            |
| **Email delivery**       | Ethereal (fake SMTP)              | SendGrid sandbox                           | SendGrid production                             |
| **SMS delivery**         | Disabled / mock                   | Twilio test credentials                    | Twilio production / MSG91                       |
| **Cloudinary env**       | Personal dev account              | Shared staging cloud                       | Production cloud (separate account)             |
| **SSL**                  | None (HTTP)                       | Render auto (Let's Encrypt)                | Render + Vercel automatic (Let's Encrypt)       |
| **Error tracking**       | Console only                      | Sentry (staging DSN)                       | Sentry (production DSN)                         |
| **Hot reload**           | Yes (nodemon + Vite HMR)          | No                                         | No                                              |
| **Seed data**            | Yes (`pnpm seed`)                 | Minimal seed                               | No seed (real data only)                        |

### 1.2 Branch ↔ Environment Mapping

```
main        →  Production  (manual approval gate required)
develop     →  Staging     (auto-deploy on push)
feature/*   →  Local dev + Vercel preview URL (per PR)
```

---

## 2. Environment Variables Reference

> **Security rule:** Never commit real secrets to version control. Use `.env.example` with placeholder values only. All real values must be injected via the hosting platform's secret management (Render dashboard, Vercel project settings).

### 2.1 Backend Environment Variables (`server/.env`)

#### 2.1.1 Server Configuration

| Variable           | Description                                    | Example Value              | Required | Service         |
|--------------------|------------------------------------------------|----------------------------|----------|-----------------|
| `NODE_ENV`         | Runtime environment name                       | `production`               | ✅       | Express server  |
| `PORT`             | Port the Express server listens on             | `5000`                     | ✅       | Express server  |
| `API_BASE_URL`     | Fully-qualified base URL for the API           | `https://api.{{DOMAIN}}`   | ✅       | Express server  |
| `CLIENT_URL`       | Frontend origin (used for CORS + redirects)    | `https://{{DOMAIN}}`       | ✅       | CORS middleware |
| `LOG_LEVEL`        | Morgan/Winston log verbosity                   | `combined`                 | ❌       | Logger          |
| `RATE_LIMIT_MAX`   | Max requests per window per IP                 | `200`                      | ❌       | Rate limiter    |
| `RATE_LIMIT_WINDOW_MS` | Window in milliseconds for rate limit    | `900000`                   | ❌       | Rate limiter    |

#### 2.1.2 MongoDB

| Variable                  | Description                                    | Example Value                                                        | Required | Service         |
|---------------------------|------------------------------------------------|----------------------------------------------------------------------|----------|-----------------|
| `MONGODB_URI`             | Full Atlas connection string                   | `mongodb+srv://opd_user:{{PASSWORD}}@cluster0.xxxxx.mongodb.net/smartopd_prod?retryWrites=true&w=majority` | ✅ | Mongoose |
| `MONGODB_DB_NAME`         | Database name override (optional)              | `smartopd_prod`                                                      | ❌       | Mongoose        |

#### 2.1.3 JWT Authentication

| Variable                | Description                                     | Example Value                        | Required | Service         |
|-------------------------|-------------------------------------------------|--------------------------------------|----------|-----------------|
| `JWT_ACCESS_SECRET`     | Secret key for signing access tokens            | `a_very_long_random_string_min_32ch` | ✅       | JWT / Auth      |
| `JWT_REFRESH_SECRET`    | Secret key for signing refresh tokens           | `another_very_long_random_string`    | ✅       | JWT / Auth      |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL                                | `15m`                                | ✅       | JWT / Auth      |
| `JWT_REFRESH_EXPIRES_IN`| Refresh token TTL                               | `7d`                                 | ✅       | JWT / Auth      |

#### 2.1.4 Cloudinary

| Variable                | Description                                     | Example Value           | Required | Service        |
|-------------------------|-------------------------------------------------|-------------------------|----------|----------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name                   | `my-clinic-cloud`       | ✅       | Cloudinary SDK |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                              | `123456789012345`       | ✅       | Cloudinary SDK |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                           | `aBcDeFgHiJkLmNoPqRsTuV` | ✅      | Cloudinary SDK |
| `CLOUDINARY_UPLOAD_PRESET` | Upload preset name (unsigned or signed)      | `smartopd_reports`      | ✅       | Cloudinary SDK |

#### 2.1.5 Email (SMTP / SendGrid)

| Variable                | Description                                     | Example Value                 | Required | Service              |
|-------------------------|-------------------------------------------------|-------------------------------|----------|----------------------|
| `EMAIL_PROVIDER`        | `smtp` or `sendgrid`                            | `sendgrid`                    | ✅       | Notification service |
| `SENDGRID_API_KEY`      | SendGrid API key (SG.xxxxx)                     | `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx` | ⚠️ Cond.| SendGrid            |
| `SMTP_HOST`             | SMTP server hostname (if using SMTP)            | `smtp.ethereal.email`         | ⚠️ Cond.| Nodemailer          |
| `SMTP_PORT`             | SMTP port                                       | `587`                         | ⚠️ Cond.| Nodemailer          |
| `SMTP_SECURE`           | TLS flag (`true` for port 465)                  | `false`                       | ❌       | Nodemailer          |
| `SMTP_USER`             | SMTP authentication username                    | `noreply@{{DOMAIN}}`          | ⚠️ Cond.| Nodemailer          |
| `SMTP_PASS`             | SMTP authentication password                    | `smtp_password_placeholder`   | ⚠️ Cond.| Nodemailer          |
| `EMAIL_FROM`            | "From" display name and address                 | `Smart OPD <noreply@{{DOMAIN}}>` | ✅    | Notification service |

#### 2.1.6 SMS (Twilio / MSG91)

| Variable                | Description                                     | Example Value              | Required | Service              |
|-------------------------|-------------------------------------------------|----------------------------|----------|----------------------|
| `SMS_PROVIDER`          | `twilio` or `msg91`                             | `twilio`                   | ❌       | Notification service |
| `TWILIO_ACCOUNT_SID`    | Twilio account SID                              | `ACxxxxxxxxxxxxxxxxxxxxxxxxxx` | ⚠️ Cond.| Twilio SDK          |
| `TWILIO_AUTH_TOKEN`     | Twilio auth token                               | `your_twilio_auth_token`   | ⚠️ Cond.| Twilio SDK          |
| `TWILIO_PHONE_NUMBER`   | Twilio sender phone number                      | `+1XXXXXXXXXX`             | ⚠️ Cond.| Twilio SDK          |
| `MSG91_AUTH_KEY`        | MSG91 API authentication key                    | `msg91_api_key_placeholder` | ⚠️ Cond.| MSG91 SDK           |
| `MSG91_SENDER_ID`       | MSG91 6-character sender ID                     | `SMARTO`                   | ⚠️ Cond.| MSG91 SDK           |
| `MSG91_TEMPLATE_ID`     | MSG91 DLT-approved template ID                  | `1234567890123456789`       | ⚠️ Cond.| MSG91 SDK           |

#### 2.1.7 Sentry (Error Tracking)

| Variable          | Description                     | Example Value                                   | Required | Service |
|-------------------|---------------------------------|-------------------------------------------------|----------|---------|
| `SENTRY_DSN`      | Sentry Data Source Name for backend | `https://xxxx@oXXXXX.ingest.sentry.io/XXXXXX` | ❌    | Sentry  |
| `SENTRY_ENV`      | Sentry environment label        | `production`                                    | ❌       | Sentry  |

### 2.2 Frontend Environment Variables (`client/.env`)

> All Vite environment variables **must** be prefixed with `VITE_` to be exposed to the browser bundle.

| Variable                      | Description                                     | Example Value                        | Required | Service            |
|-------------------------------|-------------------------------------------------|--------------------------------------|----------|--------------------|
| `VITE_API_BASE_URL`           | Backend API base URL                            | `https://api.{{DOMAIN}}/api/v1`      | ✅       | Axios / fetch      |
| `VITE_WS_URL`                 | WebSocket server URL for Socket.IO              | `wss://api.{{DOMAIN}}`               | ✅       | Socket.IO client   |
| `VITE_CLOUDINARY_CLOUD_NAME`  | Cloudinary cloud name (public, read-only)       | `my-clinic-cloud`                    | ✅       | Cloudinary widget  |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset             | `smartopd_reports_unsigned`          | ✅       | Cloudinary widget  |
| `VITE_SENTRY_DSN`             | Sentry DSN for frontend error tracking          | `https://xxxx@oXXXXX.ingest.sentry.io/YYYYYY` | ❌ | Sentry        |
| `VITE_APP_VERSION`            | App version string (injected by CI)             | `1.2.3`                              | ❌       | App header / about |
| `VITE_ENVIRONMENT`            | Environment label for conditional UI behaviour  | `production`                         | ❌       | App config         |

---

## 3. Local Development Setup

### 3.1 Prerequisites

Ensure the following tools are installed before beginning:

| Tool           | Minimum Version | Install                                      |
|----------------|-----------------|----------------------------------------------|
| Node.js        | 20.x LTS        | [nodejs.org](https://nodejs.org) or `nvm`    |
| pnpm           | 9.x             | `npm install -g pnpm`                        |
| Git            | 2.x             | [git-scm.com](https://git-scm.com)           |
| MongoDB        | 7.x (optional)  | [mongodb.com](https://mongodb.com) or Atlas  |
| VS Code        | Latest          | Recommended IDE                              |

> **Tip:** Use [nvm](https://github.com/nvm-sh/nvm) (Unix) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage Node versions. The repo contains a `.nvmrc` with `20`.

### 3.2 Clone & Install

```bash
# 1. Clone the repository
git clone https://github.com/{{GITHUB_ORG}}/smart-opd.git
cd smart-opd

# 2. Install all workspace dependencies (root, client, server)
pnpm install
```

### 3.3 Environment Files

#### Backend (`server/.env`)

Copy the example file and fill in your values:

```bash
cp server/.env.example server/.env
```

**`server/.env.example`** (commit this file — no real secrets):

```dotenv
# ── Server ─────────────────────────────────────────────
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173
LOG_LEVEL=dev
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW_MS=900000

# ── MongoDB ────────────────────────────────────────────
# Option A: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/smartopd_dev
# Option B: Atlas free tier (comment out Option A)
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/smartopd_dev?retryWrites=true&w=majority
MONGODB_DB_NAME=smartopd_dev

# ── JWT ────────────────────────────────────────────────
JWT_ACCESS_SECRET=replace_with_a_random_64_char_string
JWT_REFRESH_SECRET=replace_with_another_random_64_char_string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Cloudinary ─────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=smartopd_reports

# ── Email ──────────────────────────────────────────────
EMAIL_PROVIDER=smtp
# Dev: use Ethereal (https://ethereal.email) — free fake SMTP
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ethereal_user@ethereal.email
SMTP_PASS=ethereal_password
EMAIL_FROM=Smart OPD Dev <noreply@localhost>

# ── SMS (disabled in dev) ──────────────────────────────
SMS_PROVIDER=mock

# ── Sentry (optional in dev) ───────────────────────────
# SENTRY_DSN=
```

#### Frontend (`client/.env.local`)

```bash
cp client/.env.example client/.env.local
```

**`client/.env.example`**:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_WS_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=smartopd_reports_unsigned
VITE_ENVIRONMENT=development
```

### 3.4 Running the Backend Dev Server

```bash
# From repo root — uses pnpm workspace script
pnpm dev:server

# Or directly in the server directory
cd server
pnpm dev        # runs: nodemon --exec ts-node-dev src/index.ts
```

The server starts at **`http://localhost:5000`**.  
Health check: `GET http://localhost:5000/api/v1/health`

### 3.5 Running the Frontend Dev Server

```bash
# From repo root
pnpm dev:client

# Or directly
cd client
pnpm dev        # runs: vite --port 5173
```

The UI is served at **`http://localhost:5173`** with Vite HMR (Hot Module Replacement) enabled.

### 3.6 Running Both Concurrently

```bash
# From repo root — starts both backend and frontend in one terminal
pnpm dev
```

This uses the `concurrently` package defined in the root `package.json`.

### 3.7 Seeding Initial Data

The seed script creates the default Clinic Admin user and sample clinic settings so you can log in immediately:

```bash
cd server
pnpm seed

# Expected output:
# ✅ Connected to MongoDB
# ✅ Clinic settings created
# ✅ Admin user created: admin@{{DOMAIN}} / Admin@1234
# ✅ Sample doctor created
# ✅ Seed complete
```

> **Warning:** Never run `pnpm seed` against a production database. The script checks `NODE_ENV` and exits if it detects `production`.

### 3.8 Local MongoDB vs Atlas

| Aspect              | Local MongoDB                        | Atlas Free Tier (M0)                    |
|---------------------|--------------------------------------|-----------------------------------------|
| Setup effort        | Install + start `mongod`             | Register at atlas.mongodb.com           |
| Internet required   | No                                   | Yes                                     |
| Performance         | Native (fastest for local dev)       | Network latency (~5–50 ms)              |
| Data persistence    | Local disk                           | Cloud (survives machine restarts)       |
| GUI                 | MongoDB Compass                      | Atlas Data Explorer + Compass           |
| Recommended for     | Offline / fast iteration             | Team sharing, testing Atlas features    |

---

## 4. Project Structure Overview

```
smart-opd/                          ← Monorepo root
├── client/                         ← React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                    ← Axios instances & API hooks
│   │   ├── components/             ← Shared UI components (shadcn/ui)
│   │   ├── features/               ← Feature-based modules (appointments, billing…)
│   │   ├── hooks/                  ← Custom React hooks
│   │   ├── lib/                    ← Utilities, validators, constants
│   │   ├── pages/                  ← Route-level page components
│   │   ├── store/                  ← Zustand global state slices
│   │   └── main.tsx
│   ├── .env.example
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                         ← Node.js + Express backend
│   ├── src/
│   │   ├── config/                 ← DB, Cloudinary, Mailer config
│   │   ├── controllers/            ← Route handlers
│   │   ├── middleware/             ← Auth, error, rate-limit, upload
│   │   ├── models/                 ← Mongoose schemas & models
│   │   ├── routes/                 ← Express route definitions
│   │   ├── services/               ← Business logic layer
│   │   ├── sockets/                ← Socket.IO event handlers
│   │   ├── utils/                  ← Helpers (PDF gen, token, logger)
│   │   └── index.ts                ← App entry point
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── .env.example
│   ├── jest.config.ts
│   └── tsconfig.json
│
├── docs/                           ← All markdown documentation
│   ├── 01_PRD.md
│   ├── 02_DATABASE_ARCHITECTURE.md
│   └── 09_DEPLOYMENT_AND_DEVOPS.md (this file)
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── .nvmrc                          ← Node version pin (20)
├── package.json                    ← Workspace root scripts
├── pnpm-workspace.yaml
├── render.yaml                     ← Render IaC definition
└── vercel.json                     ← Vercel configuration
```

### 4.1 Root `package.json` Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"pnpm dev:server\" \"pnpm dev:client\"",
    "dev:server": "pnpm --filter server dev",
    "dev:client": "pnpm --filter client dev",
    "build": "pnpm --filter server build && pnpm --filter client build",
    "test": "pnpm --filter server test && pnpm --filter client test",
    "lint": "pnpm --filter server lint && pnpm --filter client lint",
    "typecheck": "pnpm --filter server typecheck && pnpm --filter client typecheck",
    "seed": "pnpm --filter server seed",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
  }
}
```

---

## 5. CI/CD Pipeline

All pipelines run on GitHub Actions. Secrets are stored in GitHub repository settings under **Settings → Secrets and variables → Actions**.

### Required GitHub Secrets

| Secret Name                  | Description                                      |
|------------------------------|--------------------------------------------------|
| `RENDER_API_KEY`             | Render API key for deploy hooks                  |
| `RENDER_SERVICE_ID_STAGING`  | Render service ID for staging backend            |
| `RENDER_SERVICE_ID_PROD`     | Render service ID for production backend         |
| `VERCEL_TOKEN`               | Vercel personal access token                     |
| `VERCEL_ORG_ID`              | Vercel organization ID                           |
| `VERCEL_PROJECT_ID`          | Vercel project ID                                |
| `STAGING_API_URL`            | Staging health check URL                         |
| `PROD_API_URL`               | Production health check URL                      |
| `CODECOV_TOKEN`              | Codecov upload token (optional)                  |

### 5.1 CI Workflow (`ci.yml`)

Runs on every push and every pull request to `develop` and `main`.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Lint · Typecheck · Test
    runs-on: ubuntu-latest
    timeout-minutes: 20

    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.runCommand({ ping: 1 })'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      NODE_ENV: test
      MONGODB_URI: mongodb://localhost:27017/smartopd_test
      JWT_ACCESS_SECRET: test_access_secret_min_32_characters_long
      JWT_REFRESH_SECRET: test_refresh_secret_min_32_characters_long
      JWT_ACCESS_EXPIRES_IN: 15m
      JWT_REFRESH_EXPIRES_IN: 7d
      PORT: 5000

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: TypeScript typecheck (server)
        run: pnpm --filter server typecheck

      - name: TypeScript typecheck (client)
        run: pnpm --filter client typecheck

      - name: Lint (server)
        run: pnpm --filter server lint

      - name: Lint (client)
        run: pnpm --filter client lint

      - name: Run backend unit & integration tests
        run: pnpm --filter server test --coverage --forceExit

      - name: Run frontend unit tests
        run: pnpm --filter client test --coverage --run

      - name: Upload backend coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          directory: server/coverage
          flags: backend
          fail_ci_if_error: false

      - name: Upload frontend coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          directory: client/coverage
          flags: frontend
          fail_ci_if_error: false
```

### 5.2 Staging Deploy Workflow (`deploy-staging.yml`)

Triggers automatically on every push to the `develop` branch.

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy – Staging

on:
  push:
    branches: [develop]

concurrency:
  group: deploy-staging
  cancel-in-progress: true

jobs:
  ci:
    name: Run CI
    uses: ./.github/workflows/ci.yml
    secrets: inherit

  deploy-backend-staging:
    name: Deploy Backend → Render Staging
    needs: ci
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Trigger Render staging deploy
        run: |
          curl -s -o /dev/null -w "%{http_code}" \
            -X POST \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            "https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID_STAGING }}/deploys" \
            | grep -q "201" && echo "Deploy triggered" || (echo "Deploy trigger failed" && exit 1)

      - name: Wait for Render deploy to complete
        run: |
          echo "Waiting 90 seconds for Render to build & start..."
          sleep 90

  deploy-frontend-staging:
    name: Deploy Frontend → Vercel Preview
    needs: ci
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install Vercel CLI
        run: pnpm add -g vercel

      - name: Deploy to Vercel preview
        run: |
          vercel deploy \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --scope=${{ secrets.VERCEL_ORG_ID }} \
            --env VITE_API_BASE_URL=${{ secrets.STAGING_API_URL }}/api/v1 \
            --yes
        working-directory: client

  smoke-test:
    name: Smoke Test – Staging
    needs: [deploy-backend-staging, deploy-frontend-staging]
    runs-on: ubuntu-latest
    steps:
      - name: Health check – backend
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${{ secrets.STAGING_API_URL }}/api/v1/health")
          if [ "$STATUS" -ne 200 ]; then
            echo "Health check failed with HTTP $STATUS"
            exit 1
          fi
          echo "✅ Backend health check passed (HTTP $STATUS)"

      - name: Verify JSON response body
        run: |
          BODY=$(curl -s "${{ secrets.STAGING_API_URL }}/api/v1/health")
          echo "Response: $BODY"
          echo "$BODY" | grep -q '"status":"ok"' || (echo "Unexpected health response" && exit 1)
```

### 5.3 Production Deploy Workflow (`deploy-production.yml`)

Triggers on pushes to `main`. Requires a manual approval gate (GitHub Environment protection rule on the `production` environment).

```yaml
# .github/workflows/deploy-production.yml
name: Deploy – Production

on:
  push:
    branches: [main]

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  ci:
    name: Run CI
    uses: ./.github/workflows/ci.yml
    secrets: inherit

  approval-gate:
    name: Manual Approval Gate
    needs: ci
    runs-on: ubuntu-latest
    environment: production        # ← Requires reviewer approval in GitHub settings
    steps:
      - name: Approved – proceeding to production deploy
        run: echo "Production deploy approved by ${{ github.actor }}"

  deploy-backend-production:
    name: Deploy Backend → Render Production
    needs: approval-gate
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Trigger Render production deploy
        run: |
          curl -s -o /dev/null -w "%{http_code}" \
            -X POST \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            "https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID_PROD }}/deploys" \
            | grep -q "201" && echo "Deploy triggered" || (echo "Deploy trigger failed" && exit 1)

      - name: Wait for Render deploy to complete
        run: sleep 120

  deploy-frontend-production:
    name: Deploy Frontend → Vercel Production
    needs: approval-gate
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install Vercel CLI
        run: pnpm add -g vercel

      - name: Deploy to Vercel production
        run: |
          vercel deploy --prod \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --scope=${{ secrets.VERCEL_ORG_ID }} \
            --yes
        working-directory: client

  post-deploy-healthcheck:
    name: Post-Deployment Health Check
    needs: [deploy-backend-production, deploy-frontend-production]
    runs-on: ubuntu-latest
    steps:
      - name: Backend health check
        run: |
          for i in 1 2 3; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${{ secrets.PROD_API_URL }}/api/v1/health")
            if [ "$STATUS" -eq 200 ]; then
              echo "✅ Health check passed (attempt $i)"
              exit 0
            fi
            echo "Attempt $i failed (HTTP $STATUS), retrying in 15s..."
            sleep 15
          done
          echo "❌ Health check failed after 3 attempts"
          exit 1

      - name: Notify on success
        run: echo "🚀 Production deploy successful for commit ${{ github.sha }}"
```

---

## 6. Backend Deployment (Render)

### 6.1 Service Configuration

| Setting                | Value                                              |
|------------------------|----------------------------------------------------|
| **Service Type**       | Web Service                                        |
| **Runtime**            | Node                                               |
| **Region**             | Oregon (US West) or Frankfurt (EU) – choose closest to users |
| **Branch**             | `main` (production) / `develop` (staging)          |
| **Root Directory**     | `server`                                           |
| **Build Command**      | `pnpm install --frozen-lockfile && pnpm build`     |
| **Start Command**      | `node dist/index.js`                               |
| **Health Check Path**  | `/api/v1/health`                                   |
| **Auto-Deploy**        | Yes (on GitHub push)                               |

### 6.2 Health Check Endpoint

The backend exposes a lightweight health endpoint that Render polls to determine service readiness:

```typescript
// server/src/routes/health.ts
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'smart-opd-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});
```

### 6.3 Render Tier Recommendations

| Tier                  | vCPU | RAM   | Monthly Cost | Recommendation                      |
|-----------------------|------|-------|--------------|-------------------------------------|
| **Free**              | 0.1  | 512 MB| $0           | Development / demos only. Spins down after 15 min of inactivity (cold start ~30 s). |
| **Starter**           | 0.5  | 512 MB| ~$7          | Low-traffic staging                 |
| **Standard**          | 1    | 2 GB  | ~$25         | ✅ Recommended for production (single clinic) |
| **Pro**               | 2    | 4 GB  | ~$85         | High-traffic or multi-clinic         |

> **Free tier warning:** The free tier sleeps after 15 minutes of inactivity. This is acceptable for development but **not** for production — a sleeping service causes the first patient request to fail or timeout.

### 6.4 Render IaC (`render.yaml`)

Place this file in the **repository root**. Render automatically picks it up.

```yaml
# render.yaml
services:
  # ── Staging Backend ───────────────────────────────────────────────────────
  - type: web
    name: smart-opd-api-staging
    runtime: node
    region: oregon
    plan: starter
    branch: develop
    rootDir: server
    buildCommand: pnpm install --frozen-lockfile && pnpm build
    startCommand: node dist/index.js
    healthCheckPath: /api/v1/health
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: staging
      - key: PORT
        value: "5000"
      - key: MONGODB_URI
        sync: false           # Must be set manually in Render dashboard (secret)
      - key: JWT_ACCESS_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
      - key: JWT_ACCESS_EXPIRES_IN
        value: 15m
      - key: JWT_REFRESH_EXPIRES_IN
        value: 7d
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: CLIENT_URL
        value: https://staging.{{DOMAIN}}

  # ── Production Backend ─────────────────────────────────────────────────────
  - type: web
    name: smart-opd-api-production
    runtime: node
    region: oregon
    plan: standard
    branch: main
    rootDir: server
    buildCommand: pnpm install --frozen-lockfile && pnpm build
    startCommand: node dist/index.js
    healthCheckPath: /api/v1/health
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "5000"
      - key: MONGODB_URI
        sync: false
      - key: JWT_ACCESS_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
      - key: JWT_ACCESS_EXPIRES_IN
        value: 15m
      - key: JWT_REFRESH_EXPIRES_IN
        value: 7d
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: CLIENT_URL
        value: https://{{DOMAIN}}
      - key: RATE_LIMIT_MAX
        value: "200"
```

### 6.5 Custom Domain on Render

1. In the Render dashboard, navigate to your service → **Settings → Custom Domains**.
2. Add `api.{{DOMAIN}}`.
3. In your DNS provider, create a **CNAME record**: `api.{{DOMAIN}}` → `<render-service>.onrender.com`.
4. Render provisions an SSL certificate automatically via Let's Encrypt within minutes.

---

## 7. Frontend Deployment (Vercel)

### 7.1 Project Configuration

| Setting               | Value                                         |
|-----------------------|-----------------------------------------------|
| **Framework Preset**  | Vite                                          |
| **Root Directory**    | `client`                                      |
| **Build Command**     | `pnpm run build`                              |
| **Output Directory**  | `dist`                                        |
| **Install Command**   | `pnpm install --frozen-lockfile`              |
| **Node.js Version**   | 20.x                                          |

### 7.2 `vercel.json`

Place this file in the `client/` directory (the Vercel root directory):

```json
{
  "framework": "vite",
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install --frozen-lockfile",
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

> **SPA Routing:** The `rewrites` rule redirects all non-asset requests to `index.html`, enabling React Router to handle client-side navigation even on direct URL access or page refresh.

### 7.3 Environment Variables in Vercel

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable                        | Environments             |
|---------------------------------|--------------------------|
| `VITE_API_BASE_URL`             | Production, Preview      |
| `VITE_WS_URL`                   | Production, Preview      |
| `VITE_CLOUDINARY_CLOUD_NAME`    | All                      |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | All                      |
| `VITE_SENTRY_DSN`               | Production               |
| `VITE_ENVIRONMENT`              | All (per-environment)    |

### 7.4 Preview Deployments

Every pull request automatically receives a unique preview URL from Vercel (e.g., `smart-opd-git-feature-xyz-org.vercel.app`). This URL is posted as a GitHub PR comment by the Vercel GitHub App. QA and design reviews happen on preview URLs before merging to `develop`.

### 7.5 Production Domain Setup

1. In Vercel dashboard → **Project → Settings → Domains**.
2. Add `{{DOMAIN}}` and optionally `www.{{DOMAIN}}`.
3. In your DNS provider, create:
   - `A` record: `{{DOMAIN}}` → `76.76.21.21` (Vercel's IP)
   - `CNAME` record: `www.{{DOMAIN}}` → `cname.vercel-dns.com`
4. Vercel provisions SSL automatically.

---

## 8. MongoDB Atlas Setup

### 8.1 Cluster Tier Recommendations

| Tier  | vCPU   | RAM    | Storage   | Cost/mo   | Use Case                             |
|-------|--------|--------|-----------|-----------|--------------------------------------|
| M0    | Shared | 512 MB | 512 MB    | Free      | Development, staging (low traffic)   |
| M10   | 2      | 2 GB   | 10 GB SSD | ~$57      | ✅ Recommended for single-clinic prod |
| M20   | 2      | 4 GB   | 20 GB SSD | ~$113     | High-volume or multi-specialty clinic |

> **M0 limitations:** No dedicated RAM, no continuous backup, no VPC peering. Upgrade to M10+ for production workloads.

### 8.2 Network Access (IP Allowlist)

For Render-hosted backends, Render does **not** provide static outbound IPs on the free or starter plan. Options:

| Option                    | Recommended For | Notes                                               |
|---------------------------|-----------------|-----------------------------------------------------|
| Allow `0.0.0.0/0`         | Dev/Staging only | Insecure for production — open to all IPs           |
| Render Static IPs (paid)  | Production       | Upgrade to Render's Standard+ plan to get static IPs|
| Atlas Private Endpoint    | Enterprise       | VPC peering — highest security                      |

**Steps:**
1. Atlas Dashboard → **Network Access → Add IP Address**.
2. Enter the Render static outbound IP (found in Render dashboard under service → **Outbound IPs**).
3. Click **Confirm**.

### 8.3 Database User Creation

1. Atlas Dashboard → **Database Access → Add New Database User**.
2. Authentication method: **Password**.
3. Username: `opd_app_user`
4. Auto-generate a secure password (save it — you'll need it in `MONGODB_URI`).
5. Built-in role: **Read and write to any database** (or scope to `smartopd_prod` only for least privilege).

### 8.4 Connection String Format

```
mongodb+srv://opd_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/smartopd_prod?retryWrites=true&w=majority&appName=SmartOPD
```

Replace `<PASSWORD>` with the URL-encoded password (use `%40` for `@`, etc.).

### 8.5 Atlas Backup Configuration

| Tier | Backup Type            | Frequency   | Retention  | Cost         |
|------|------------------------|-------------|------------|--------------|
| M0   | None (no auto backup)  | —           | —          | Included     |
| M10+ | Continuous Cloud Backup| Snapshots every 6h | 2 days daily, 1 wk weekly | ~$2.50/GB/mo |

Enable in Atlas → **Cluster → Backup → Enable Cloud Backup**.

Recommended retention policy for production:
- Daily snapshots: **7 days**
- Weekly snapshots: **4 weeks**
- Monthly snapshots: **12 months**

### 8.6 Performance Advisor

Atlas Performance Advisor analyses query patterns and recommends indexes automatically:

1. Atlas Dashboard → **Cluster → Performance Advisor**.
2. Review slow query suggestions (queries taking >100 ms).
3. Apply recommended indexes via the **Create Index** button or add them to Mongoose model definitions.

---

## 9. Cloudinary Setup

### 9.1 Account Setup

1. Register at [cloudinary.com](https://cloudinary.com) — the free tier provides 25 GB storage and 25 GB bandwidth/month.
2. Navigate to **Dashboard** to find your `Cloud name`, `API Key`, and `API Secret`.
3. Create a **separate Cloudinary account** (or sub-account) for production vs development to prevent test file pollution.

### 9.2 Upload Preset Configuration

Two presets are needed:

| Preset Name                   | Signed? | Used By         | Purpose                                    |
|-------------------------------|---------|------------------|--------------------------------------------|
| `smartopd_reports`            | Signed  | Backend server   | Secure backend-initiated uploads (prescriptions, reports) |
| `smartopd_reports_unsigned`   | Unsigned| Frontend widget  | Direct browser upload (profile photos only) |

**To create a preset:**
1. Cloudinary Dashboard → **Settings → Upload → Upload Presets → Add upload preset**.
2. Set signing mode (**Signed** / **Unsigned**).
3. Set **Folder**: use the structure below.

### 9.3 Folder Structure

```
smartopd/
├── reports/
│   └── {patientId}/         ← Medical lab reports, imaging
├── prescriptions/
│   └── {prescriptionId}/    ← Generated prescription PDFs (if stored)
├── avatars/
│   └── {userId}/            ← Staff and doctor profile photos
└── clinic/
    └── logo/                ← Clinic logo, branding assets
```

### 9.4 Transformation Settings

Apply automatic transformations on upload for optimization:

```json
{
  "transformation": [
    {
      "quality": "auto:good",
      "fetch_format": "auto"
    }
  ]
}
```

For PDF medical reports: **no transformation** (preserve exact fidelity).

### 9.5 Signed URL Configuration for Secure Access

Medical reports must not be publicly accessible. Use signed URLs with expiry:

```typescript
// server/src/utils/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

export function generateSignedUrl(publicId: string, expiresInSeconds = 3600): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return cloudinary.url(publicId, {
    sign_url: true,
    expires_at: expiresAt,
    resource_type: 'raw',   // for PDFs / non-image files
    type: 'authenticated',
  });
}
```

Set the Cloudinary delivery type to **Authenticated** for the `reports/` folder in the preset settings.

---

## 10. Post-Deployment Verification Checklist

Run these checks **immediately after every production deployment**:

```
DEPLOYMENT VERIFICATION CHECKLIST
==================================

Infrastructure
[ ] Health endpoint responds HTTP 200
      curl https://api.{{DOMAIN}}/api/v1/health

[ ] SSL certificate valid (check expiry, no mixed content warnings)
      curl -I https://{{DOMAIN}}

[ ] Custom domain resolves correctly (no www redirect loops)

Authentication
[ ] Admin login succeeds (POST /api/v1/auth/login)
[ ] Access token returned and accepted on subsequent requests
[ ] Refresh token flow works (/api/v1/auth/refresh)
[ ] Role-based access control enforced (try patient token on admin route → 403)

Database
[ ] MongoDB Atlas cluster status: "Active"
[ ] Successful write (create a test appointment, then delete)
[ ] Indexes present (check Atlas → Collections → Indexes tab)

File Upload
[ ] Cloudinary upload succeeds via backend route
[ ] Signed URL generation returns valid, accessible URL
[ ] URL expires after configured TTL (test with expired URL → 403)

Email
[ ] Test email sent successfully (use /api/v1/debug/test-email if available)
[ ] Email received in target inbox with correct formatting

WebSocket / Real-time
[ ] Socket.IO connection established from frontend
[ ] Queue update event received in real time (browser console: socket connected)

CORS
[ ] Preflight OPTIONS request to API from {{DOMAIN}} returns HTTP 204 with correct headers
      curl -X OPTIONS -H "Origin: https://{{DOMAIN}}" https://api.{{DOMAIN}}/api/v1/health -v

Rate Limiting
[ ] Rate limit headers present in response (X-RateLimit-Limit, X-RateLimit-Remaining)
[ ] Exceeding limit returns HTTP 429

Error Logging
[ ] Intentional 500 error appears in Render logs within 60 seconds
[ ] Sentry dashboard shows the test error (if configured)

Performance
[ ] Home page Time to First Byte (TTFB) < 1 s (use Vercel Speed Insights or browser DevTools)
[ ] API health endpoint response time < 200 ms
```

---

## 11. Monitoring & Observability

### 11.1 Render Built-In Logs

Render streams stdout/stderr from your Node.js process in real time:

- **Dashboard → Service → Logs**: Live tail and historical logs (last 500 lines on free tier, unlimited on paid).
- **Log filters**: Filter by keyword (e.g., `ERROR`, `mongoose`, `socket`).

Configure Morgan in Express to output structured Apache Combined logs in production:

```typescript
// server/src/middleware/logger.ts
import morgan from 'morgan';
import { Request, Response } from 'express';

const format = process.env.NODE_ENV === 'development' ? 'dev' : 'combined';
export const httpLogger = morgan(format);
```

### 11.2 MongoDB Atlas Monitoring

Atlas provides built-in charts for:

| Metric                     | Alert Threshold (suggested)         |
|----------------------------|-------------------------------------|
| CPU Utilization            | > 70% sustained for 5 min           |
| Memory used %              | > 80%                               |
| Connections current        | > 80% of max (512 for M10)          |
| Disk IOPS                  | > 90% of provisioned IOPS           |
| Replication lag (if RS)    | > 10 s                              |
| Query targeting ratio      | > 1000 (index inefficiency)         |

Enable alerts: Atlas → **Project → Alerts → Add Alert**.

### 11.3 Sentry — Error Tracking

**Backend (Node.js) setup:**

```bash
pnpm --filter server add @sentry/node @sentry/profiling-node
```

```typescript
// server/src/index.ts (top of file, before all imports)
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 1.0,
});
```

**Frontend (React) setup:**

```bash
pnpm --filter client add @sentry/react
```

```typescript
// client/src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
});
```

### 11.4 UptimeRobot — Uptime Monitoring

1. Register at [uptimerobot.com](https://uptimerobot.com) (free plan: 50 monitors, 5-minute checks).
2. Add two HTTP(S) monitors:

| Monitor Name          | URL                                      | Check Interval | Alert contacts      |
|-----------------------|------------------------------------------|----------------|---------------------|
| Smart OPD Backend     | `https://api.{{DOMAIN}}/api/v1/health`   | 5 minutes      | Email, Slack webhook |
| Smart OPD Frontend    | `https://{{DOMAIN}}`                     | 5 minutes      | Email, Slack webhook |

3. Set an alert contact pointing to the on-call team email or Slack channel.

### 11.5 Log Levels Summary

| Environment | Morgan format | Console level | Sentry traces |
|-------------|---------------|---------------|---------------|
| development | `dev`         | `debug`       | 100%          |
| staging     | `combined`    | `info`        | 100%          |
| production  | `combined`    | `warn`+`error`| 10%           |

---

## 12. Backup & Disaster Recovery

### 12.1 MongoDB Atlas Automated Backups

| Configuration          | Setting                                              |
|------------------------|------------------------------------------------------|
| Backup type            | Continuous Cloud Backup (M10+)                       |
| Snapshot frequency     | Every 6 hours                                        |
| Daily retention        | 7 days                                               |
| Weekly retention       | 4 weeks                                              |
| Monthly retention      | 12 months                                            |
| Point-in-time restore  | Up to last 24 hours (oplog window)                   |
| Backup storage region  | Same as cluster (Oregon or Frankfurt)                |

### 12.2 Manual Export Procedure

Use `mongodump` for portable backups that you control:

```bash
# Full database export (run from a machine with Atlas network access)
mongodump \
  --uri="mongodb+srv://opd_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/smartopd_prod" \
  --out="./backup/$(date +%Y-%m-%d_%H-%M-%S)"

# Compress
tar -czf backup_$(date +%Y-%m-%d).tar.gz ./backup/
```

Schedule this as a weekly cron job on a bastion host or CI pipeline and upload to a secure S3/GCS bucket.

### 12.3 Restoration Procedure

**From Atlas UI (recommended for point-in-time):**
1. Atlas → Cluster → **Backup → Snapshots**.
2. Select the target snapshot → **Restore**.
3. Choose restore type: **Restore to this cluster** or **Restore to new cluster**.
4. Confirm and monitor restore progress.

**From `mongodump` archive:**
```bash
mongorestore \
  --uri="mongodb+srv://opd_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/smartopd_prod" \
  --drop \
  ./backup/2026-11-10_12-00-00/
```

> **`--drop` flag:** This drops existing collections before restoring. Only use when you intend a full replacement.

### 12.4 RTO / RPO Targets

| Metric                              | Target          | How Achieved                                       |
|-------------------------------------|-----------------|----------------------------------------------------|
| **RPO** (Recovery Point Objective)  | ≤ 6 hours       | Atlas continuous backup (6-hour snapshot cycle)    |
| **RTO** (Recovery Time Objective)   | ≤ 2 hours       | Atlas restore to existing cluster + app redeploy   |
| **Frontend RTO**                    | ≤ 10 minutes    | Vercel instant rollback via dashboard              |
| **Backend RTO**                     | ≤ 20 minutes    | Render one-click redeploy from previous deploy     |

---

## 13. Rollback Procedure

### 13.1 Backend Rollback (Render)

Render maintains a full deploy history for each service:

1. Navigate to **Render Dashboard → smart-opd-api-production → Events**.
2. Find the last known-good deploy entry.
3. Click **Rollback to this deploy** → confirm.
4. Render re-deploys the previous Docker image immediately (no rebuild required, ~1–2 minutes).
5. Monitor health check at `GET /api/v1/health` until `HTTP 200`.

**Via Render API (scripted):**
```bash
# List recent deploys
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID_PROD/deploys?limit=5"

# Rollback to specific deploy ID
curl -s -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID_PROD/deploys/<DEPLOY_ID>/rollback"
```

### 13.2 Frontend Rollback (Vercel)

1. Navigate to **Vercel Dashboard → Project → Deployments**.
2. Find the last successful production deployment.
3. Click the **⋯ menu → Promote to Production**.
4. Vercel instantly switches the production domain to that deployment (no rebuild, ~30 seconds).

**Via Vercel CLI:**
```bash
# List production deployments
vercel ls --token=$VERCEL_TOKEN --prod

# Promote a specific deployment URL to production
vercel promote <deployment-url> --token=$VERCEL_TOKEN
```

### 13.3 Database Rollback Considerations

> **Warning:** Database rollback is the highest-risk operation. **Do not roll back the database to match a code rollback unless data corruption has occurred.** Code is typically backward-compatible with slightly older data.

**Decision matrix:**

| Situation                                           | Action                                                |
|-----------------------------------------------------|-------------------------------------------------------|
| Bug in business logic (no schema change)            | Roll back code only. Leave DB as-is.                  |
| Migration added a field (non-breaking)              | Roll back code only. The extra field is ignored.       |
| Migration removed a required field (breaking)       | Roll back code AND restore DB from pre-migration snapshot. |
| Data corruption (bad write, bad migration)          | Restore from Atlas point-in-time backup + roll back code. |

**Pre-migration checklist (always do before schema migrations):**
1. Take a manual `mongodump` snapshot.
2. Test migration on staging with production-sized data copy.
3. Have the rollback script (`migration-down`) tested and ready.
4. Schedule migration during off-peak hours (early morning).

### 13.4 Emergency Contacts & Runbook Location

| Resource                | Location                                                |
|-------------------------|---------------------------------------------------------|
| Render dashboard        | `https://dashboard.render.com`                          |
| Vercel dashboard        | `https://vercel.com/{{VERCEL_ORG}}`                     |
| Atlas dashboard         | `https://cloud.mongodb.com`                             |
| Cloudinary dashboard    | `https://cloudinary.com/console`                        |
| Sentry dashboard        | `https://sentry.io/organizations/{{SENTRY_ORG}}`        |
| UptimeRobot dashboard   | `https://uptimerobot.com/dashboard`                     |
| On-call contact         | {{ON_CALL_EMAIL}}                                       |
| Incident runbook        | `docs/INCIDENT_RUNBOOK.md`                              |

---

*Document maintained by the Smart OPD Engineering Team. Update this document whenever infrastructure changes are made. Review quarterly.*
