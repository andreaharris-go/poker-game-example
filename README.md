# Poker API Debug Tool

A Next.js 16 + Tailwind CSS v4 web application for testing and debugging a Multi-Tenant MTT Tournament Poker REST API.

## Features

- **API Explorer** (`/explorer`) – Browse and test all API endpoints from the OpenAPI spec, grouped by tag (Health, Wallet, Tournaments, Tables, Admin). Each endpoint has a collapsible card with parameter inputs, JSON body editor, curl snippet generator, and response viewer.
- **Tournament Demo** (`/demo`) – Step-by-step wizard walking through a full tournament lifecycle: wallet adjust → create tournament → registration → start → table actions → advance → finish.
- **Wallet** (`/wallet`) – Check balances and browse transaction history with cursor pagination.
- **Tournaments** (`/tournaments`) – List, inspect, and manage tournaments with admin quick-action buttons.
- **Tables** (`/tables`) – Inspect table state with auto-refresh, view your hand, send player actions, and admin advance.
- **Network Logs** (`/logs`) – View every API request made in the session with full request/response details.
- **Header Profiles** (`/settings/profiles`) – Create, edit, delete, and switch between header profiles (x-vendor-id, x-provider-id, x-user-id, x-admin-key). Profiles persist in localStorage.
- **Idempotency Helper** – Generate UUID v4 idempotency keys and reuse last key for retry testing.
- **Curl Snippets** – Every request generates a copyable curl command.
- **Request History** – Last 50 requests persisted in localStorage with re-run capability.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Node 20+

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment file and adjust if needed
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3000` | Base URL of the Poker API |
| `NEXT_PUBLIC_DEFAULT_VENDOR_ID` | `demoVendor` | Default vendor ID header |
| `NEXT_PUBLIC_DEFAULT_PROVIDER_ID` | `demoProvider` | Default provider ID header |
| `NEXT_PUBLIC_DEFAULT_USER_ID` | `user-1` | Default user ID header |
| `NEXT_PUBLIC_DEFAULT_ADMIN_KEY` | `dev-admin-key` | Default admin key header |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Navbar
│   ├── page.tsx             # Home page with section links
│   ├── explorer/page.tsx    # API Explorer (Postman-like)
│   ├── demo/page.tsx        # Tournament Flow Demo wizard
│   ├── wallet/page.tsx      # Wallet debug view
│   ├── tournaments/page.tsx # Tournaments debug view
│   ├── tables/page.tsx      # Tables debug view
│   ├── logs/page.tsx        # Network logs viewer
│   └── settings/profiles/page.tsx # Header profile management
├── components/
│   ├── Navbar.tsx
│   ├── EndpointCard.tsx
│   ├── JsonEditor.tsx
│   ├── ResponseViewer.tsx
│   ├── CurlViewer.tsx
│   ├── HeaderProfileSelector.tsx
│   ├── IdempotencyHelper.tsx
│   └── RequestHistory.tsx
└── lib/
    ├── api/client.ts        # Fetch client with header injection
    ├── openapi/
    │   ├── openapi.json     # OpenAPI 3.0 spec (source of truth)
    │   └── parser.ts        # Endpoint catalog parser
    ├── storage/
    │   ├── profiles.ts      # Header profile localStorage
    │   └── history.ts       # Request history localStorage
    ├── curl/generator.ts    # Curl command generator
    └── types/index.ts       # Re-exported types
```

## Usage

1. **Configure**: Set the API Base URL in the navbar and select/create a Header Profile.
2. **Explore**: Use the API Explorer to test individual endpoints.
3. **Demo**: Walk through the Tournament Demo wizard for an end-to-end flow.
4. **Debug**: Check Network Logs for all requests, use Wallet/Tournaments/Tables pages for focused debugging.