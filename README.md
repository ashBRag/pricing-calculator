# Multi-Rate Pricing Calculator

A full-stack pricing and document management application.

The application allows authenticated users to create pricing documents, add line items, apply discounts and taxes, calculate document totals, finalize documents, and view summary reports.

## Live Demo

- Frontend: https://pricing-calculator-woad.vercel.app/
- Backend API: https://pricing-calculator-pb3o.onrender.com/

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

Alternatively, run the API and a MongoDB instance together with Docker Compose (reads the same `api/.env`):

```bash
cd api
docker compose up
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

---

# Calculation and Rounding Policy

All money is handled in **integer cents** throughout the backend to avoid floating-point drift. `unitPrice` and `fixedDiscount` are accepted from the client in decimal currency units (e.g. `100.00`) and converted to cents immediately:

```ts
toCents(amount) = Math.round(amount * 100);
```

Per line item (see `CalculationService.calculateLineItem`):

1. **Subtotal** `quantity * unitPriceCents` (quantity is a whole number, so no rounding needed here).
2. **Discount amount** a line item may have a percentage discount _or_ a fixed discount, not both:
   - Percent: `Math.round(subtotalCents * discountPercent / 100)`
   - Fixed: `toCents(fixedDiscount)`, rejected with a `ValidationError` if it exceeds the subtotal.
3. **Discounted amount** `subtotalCents - discountAmountCents`.
4. **Tax amount** `Math.round(discountedAmountCents * taxPercent / 100)`, i.e. **tax is applied after the discount**, not on the original subtotal.
5. **Line total** `discountedAmountCents + taxAmountCents`.

Document totals are a plain sum of each line's subtotal, discount, tax, and line total. There is no additional rounding at the document level, so the grand total is always exactly the sum of the (already-rounded) line totals.

## Worked Example

This is the exact fixture asserted in `api/src/modules/calculation/calculation.service.spec.ts` ("assignment sample document"):

| Line        | Qty | Unit price | Discount     | Tax % | Subtotal | Discount amt | Discounted amt | Tax amt | Line total |
| ----------- | --- | ---------- | ------------ | ----- | -------- | ------------ | -------------- | ------- | ---------- |
| Widget A    | 2   | $100.00    | 10%          | 5%    | $200.00  | $20.00       | $180.00        | $9.00   | $189.00    |
| Widget B    | 1   | $50.00     | —            | 5%    | $50.00   | $0.00        | $50.00         | $2.50   | $52.50     |
| Service fee | 1   | $200.00    | $20.00 fixed | —     | $200.00  | $20.00       | $180.00        | $0.00   | $180.00    |

Document totals:

| Subtotal | Total discount | Total tax | Grand total |
| -------- | -------------- | --------- | ----------- |
| $450.00  | $40.00         | $11.50    | $421.50     |

Walking through Widget A in cents: `subtotalCents = 2 * 10000 = 20000`; `discountAmountCents = round(20000 * 10 / 100) = 2000`; `discountedAmountCents = 20000 - 2000 = 18000`; `taxAmountCents = round(18000 * 5 / 100) = 900`; `lineTotalCents = 18000 + 900 = 18900` ($189.00).

---

# Finalize / Immutability Rules

- A document starts as `draft` and can be freely edited (title, customer, issue date, line items) or deleted while in that state.
- **Finalizing** (`DocumentsService.finalize`) transitions a document from `draft` to `finalized`. There is no "un-finalize" operation.
- Before finalizing, the service re-validates every line item (`assertFinalizable`): any item with `quantity <= 0` or `unitPrice < 0` blocks finalization with a `ValidationError`. This is a last-chance integrity check performed immediately before the document is locked, independent of whatever validation ran at creation/update time.
- Finalizing an already-finalized document throws a `ConflictError` (409) rather than silently succeeding.
- Once `finalized`:
  - **Update is rejected** (`DocumentFinalizedError`, 409) totals, line items, and metadata are frozen.
  - **Delete is rejected** (`DocumentFinalizedError`, 409) finalized documents are permanent records and cannot be removed.
  - The only way to get an editable copy of a finalized document's contents is **Duplicate**, which creates a brand-new `draft` document by recalculating totals from the source's line items (not by copying the stored cent values), so the copy stays correct even if calculation rules change between duplications.
- All of the above checks are enforced server-side per-request in `DocumentsService`, and every document lookup is scoped to `{ _id, userId }` (`findOwned`), so a user can only finalize, edit, or delete their own documents, attempting to act on another user's document (or a nonexistent id) returns `NotFoundError` (404) rather than leaking existence.

---

# Assumptions and Tradeoffs

- **Single currency, no locale/currency formatting on the backend.** Amounts are cents-only integers; the API doesn't track or convert currencies. Multi-currency support would require a currency field per document and a real conversion/rounding strategy.
- **A line item is either percent-discounted or fixed-discounted, never both.** `discountModeOf` on the frontend and the calculation service both treat these as mutually exclusive, matching the assignment's model of a single "discount" concept per line rather than stacked discounts.
- **Tax is computed on the post-discount amount, not the gross subtotal.** This is the common real-world convention as a policy choice.
- **Rounding happens per-line, not once at the document level.** This guarantees each line's displayed numbers are internally consistent (`lineTotal = discountedAmount + tax`).
- **JWT access + refresh token pair, stored in cookies**
- **No soft-delete / audit trail.** Deleting a draft document is a hard delete; there's no history of what a draft looked like before edits, and no record of who deleted what. Acceptable for a draft (nothing is "official" yet), but finalized documents are protected from deletion specifically because they're meant to be the durable record.
- **Report summary is a single aggregate query over a date range**, not a paginated/streamed report. Fine at the expected data volumes for this exercise; would not scale to very large per-user document counts without pagination or pre-aggregation.
- **Report summary only counts finalized documents.** Drafts are excluded from `reportSummary`'s totals since their numbers aren't final and can still change or be deleted, so including them would make the report misleading. Only documents locked via finalize contribute to the document count, grand total, tax, and discount sums.
- **No idempotency key on document creation.** A duplicate network request (e.g. a double-click before the loading state disables the button) could create two documents. The frontend now disables the submit button while a mutation is pending, which covers the common case, but there's no server-side protection.

---

# What I Would Improve Before Production

- **Idempotency keys on mutating endpoints** (create, finalize, duplicate) to make retries from flaky clients safe, rather than relying solely on the frontend disabling buttons during a pending request.
- **Structured audit log for finalize/delete/duplicate**, so there's a record of who finalized or duplicated a document and when, independent of the document's own fields.
- **Pagination on `findAll` / documents list**, and a paginated or pre-aggregated path for `reportSummary`, before per-user document counts get large.
- **Stronger input validation on the frontend to fully mirror backend constraints** (e.g. surfacing the "fixed discount exceeds subtotal" rule as a client-side validation error before submit, not just as a server error after the fact).
- **E2E test coverage** for the documents/auth API routes and the Next.js flows (currently only `CalculationService` has unit tests). Integration tests would catch regressions in the controller/DTO/schema wiring that unit tests on the pure calculation logic can't.
- **Currency/locale support** if this needs to serve more than one market. Currently hardcoded to a single implicit currency with no formatting metadata stored per document.
- **Rate limiting on auth endpoints** (login/signup/refresh) to reduce brute-force and credential-stuffing exposure.
- **Frontend error boundaries and offline/network-failure handling** beyond the current per-mutation error message, particularly around the finalize/delete confirm flows where a failed request should make the document's actual state unambiguous to the user.
