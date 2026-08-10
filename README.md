# Multi-Rate Pricing Calculator

A full-stack pricing and document management application.

The application allows authenticated users to create pricing documents, add line items, apply discounts and taxes, calculate document totals, finalize documents, and view summary reports.

## Live Demo

- Frontend: `TODO`
- Backend API: `TODO`

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- NestJS
- TypeScript
- REST API
- Passport
- JWT authentication

### Database

- MongoDB
- Mongoose

### Testing

- Jest

### Observability

- Prometheus-compatible metrics
- Grafana for local monitoring/dashboarding

---

# Setup

## Prerequisites

- Node.js (v18+)
- [pnpm](https://pnpm.io/)
- MongoDB (local instance or a connection URI)

## Backend (`api`)

```bash
cd api
pnpm install
```

Copy the example env file and adjust values as needed:

```bash
cp .env.example .env
```

Start the API in watch mode:

```bash
pnpm dev
```

The API will be available at `http://localhost:3000` (per `PORT` in `.env`).

Alternatively, run the API and a MongoDB instance together with Docker Compose:

```bash
cd api
PORT=3000 JWT_SECRET=your-secret JWT_EXPIRES_IN=7d docker compose up
```

Other useful commands:

```bash
pnpm build   # compile to dist/
pnpm start   # run the compiled build
pnpm test    # run the Jest test suite
```

### Tests

Unit tests cover `CalculationService`, the module responsible for line item and document pricing math (`src/modules/calculation/calculation.service.spec.ts`):

- **Money handling (cents conversion & rounding)** integer-cent conversion, float-drift avoidance, and rounding of discounts/tax
- **Line item calculation rules** subtotal, percentage/fixed discounts, tax on discounted amount, line totals, absent discount/tax defaults, and fixed-discount-exceeds-subtotal rejection
- **Document totals** aggregation of subtotal/discount/tax/grand total across line items, including empty line item lists and error propagation
- **Assignment sample document** verifies output against the worked example from the spec

Run the suite:

```bash
cd api
pnpm test
```

## Frontend (`web`)

```bash
cd web
pnpm install
```

Copy the example env file and adjust values as needed:

```bash
cp .env.example .env
```

By default `API_URL` in `web/.env.example` points to `http://localhost:3000`, so either run the backend on that port (`PORT=3000` in `api/.env`) or update `API_URL` here to match wherever the API is running.

Start the dev server:

```bash
pnpm dev
```

The app will be available at `http://localhost:3001`.

Other useful commands:

```bash
pnpm build   # production build
pnpm start   # run the production build
pnpm lint    # run ESLint
```

---

# Features

## Authentication

- User registration
- User login
- Password hashing
- JWT authentication
- Protected API endpoints
- User-level data isolation

Users can only access and modify their own documents.

## Documents

Users can:

- Create documents
- View documents
- Edit draft documents
- Delete draft documents
- Add and edit line items
- Remove line items
- Finalize documents

## Pricing Calculations

Each line item supports:

- Quantity
- Unit price
- Fixed discount
- Percentage discount
- Tax percentage

The backend calculates:

- Line subtotal
- Discount amount
- Discounted amount
- Tax amount
- Line total
- Document subtotal
- Total discount
- Total tax
- Grand total

## Document Lifecycle

Documents have two states:

```text
draft
finalized
```
