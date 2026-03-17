# USTC Payment Portal Developer Dashboard

React + TypeScript + Vite application for viewing transactions by status.

## Quick Reference

- **Language**: TypeScript
- **Framework**: React 19 + Router v7
- **Build Tool**: Vite
- **UI Library**: MUI DataGrid
- **Port**: `5173`
- **Node**: `>=24.12.0 <25.0.0`

## Overview

The web client provides a dashboard for viewing transactions organized by status:

- `/transactions/success` – Successful transactions
- `/transactions/failed` – Failed transactions
- `/transactions/pending` – Pending transactions
- `/transactions/all` – All transactions

The UI is **read-only** and displays transactions from the Dashboard API.

## Running the Application

Access at: http://localhost:5173

### Development

```bash
npm ci
npm run dev
```

**Prerequisites**:
- Dashboard API running on `localhost:8080` (or set `VITE_DASHBOARD_API_BASE_URL`)

---

## Features

### Transaction Views

The app renders transaction data in tabs and a Material-UI DataGrid:

- **All Tab**: Shows count of all transactions
- **Status Tabs**: Success, Failed, Pending – each with transaction count and detailed list
- **DataGrid**: Displays transaction rows with columns for status, payment method, tracking ID, etc.

### API Integration

The client calls these endpoints on the Dashboard API:

#### `GET /transactions/:status`

Fetch transactions by status.

**Path Parameters**:
- `:status` – One of: `success`, `failed`, `pending`

**Response**:
```json
{
  "data": [...],
  "total": 0
}
```

#### `GET /transaction-payment-status`

Fetch aggregate status counts.

**Response**:
```json
{
  "total": 100,
  "success": 67,
  "failed": 67,
  "pending": 66
}
```

---

## Environment Configuration

Vite reads `.env` files automatically — no dotenv library is required.

Create `.env` from the provided example:

```bash
cp .env.example .env
```

### Build-Time via Vite

```env
VITE_DASHBOARD_API_BASE_URL=http://localhost:8080
```

If not set, defaults to `http://localhost:8080`. Vite only exposes variables prefixed with `VITE_` to the browser bundle.

## Testing

No automated test runner is configured in this package.

---

## Available Scripts

```bash
npm run dev              # Start dev server (hot reload)
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Placeholder script (no automated tests configured)
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

---

## Development Notes

- **Case Handling**: Routes are lowercase (`/transactions/success`), but internally converted to uppercase (`SUCCESS`) for API queries and type matching
- **Navigation**: Uses React Router v7 for client-side routing
- **Styling**: Material-UI components for consistent design
- **Hot Reload**: Vite provides instant feedback during development

---

## Test Coverage Notes

No automated coverage workflow is currently configured for this package.

## Key Source Locations

- Router setup: `src/main.tsx`
- Page layout and tab count updates: `src/features/transactions/pages/TransactionsLayout.tsx`
- Status page wrapper: `src/features/transactions/pages/TransactionsStatusPage.tsx`
- DataGrid: `src/features/transactions/components/TransactionsTable.tsx`
- API client: `src/features/transactions/api/transactions.api.ts`

## Local Troubleshooting

If the UI loads but no data appears:

1. Verify API is healthy:

```bash
curl http://localhost:8080/health
```

2. Verify transaction endpoint:

```bash
curl http://localhost:8080/transactions/success
```

3. Verify status counts endpoint:

```bash
curl http://localhost:8080/transaction-payment-status
```
