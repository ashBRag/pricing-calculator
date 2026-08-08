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
- Zod / request validation

### Database

- MongoDB
- Mongoose

### Testing

- Jest
- Supertest

### Infrastructure

- Docker
- SnapDeploy
- MongoDB Atlas
- GitHub Actions

### Observability

- Prometheus-compatible metrics
- Grafana for local monitoring/dashboarding

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
