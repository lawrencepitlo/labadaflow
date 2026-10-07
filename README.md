# LabadaFlow — Every load has a flow.

LabadaFlow is a laundry-shop management system. Staff receive orders, move them through a defined six-stage workflow, and customers follow progress with a tracking code or a personal portal.

## How it works

**The lifecycle.** Every order travels one path:

```
RECEIVED → WASHING → DRYING → FOLDING → READY → COMPLETED
```

Forward moves go one step at a time. Moving backward requires a note, cancelling requires a reason, and completed/cancelled orders are terminal. Every transition is recorded with who did it, when, and why — an append-only status history.

**Three ways in.**

| Who | Where | What |
| --- | --- | --- |
| Shop staff / admin | Backoffice (`/dashboard`, `/orders`, `/customers`, `/services`, `/reports`, `/team`, `/settings`) | Receive orders, advance them through the flow, manage customers and services, view reports |
| Registered customer | Portal (`/portal`) | See own orders, order detail with progress, and profile — nothing else |
| Anyone with the slip | Public tracking (`/track`) | Enter the tracking code, see the current stage — no account needed |

**The demo flow.** Receive an order (starts `RECEIVED`) → advance it stage by stage to `READY` → the customer sees "Ready" on the tracking page → staff hit Complete & Mark Paid → the order closes as `COMPLETED` and shows up in reports.

## Architecture

- **Next.js 16 App Router** with route groups: `(marketing)`, `(auth)`, `(backoffice)`, `(portal)`, `(public)`.
- **Auth:** Clerk sessions bridged to an app-level `users` table with `ADMIN` / `STAFF` / `CUSTOMER` roles. Edge middleware requires login on all non-public routes; every server action and data reader re-checks role server-side.
- **Data:** Supabase Postgres. Orders snapshot service prices at creation; totals stored in centavos. Atomic transitions run through `advance_order_status`, `cancel_order`, and `complete_order` RPCs that verify expected current status (race-safe).
- **State machine:** `lib/order-machine.ts` is the single source of truth for valid transitions, consumed by both UI and server actions.
- **UI:** shadcn/ui + Tailwind, Inter, Lucide icons. Shared `StatusBadge` and `OrderFlowStepper` components keep status presentation consistent across backoffice, portal, tracking, and marketing.

## Project structure

```
app/(marketing)/      landing page
app/(backoffice)/     dashboard, orders, customers, services, reports, team, settings
app/(portal)/         customer orders, order detail, profile
app/(public)/track/   tracking-code entry + public status page
components/app/       shared product UI (status badge, flow stepper, …)
components/marketing/ landing-only visuals
components/ui/        shadcn/ui primitives
lib/order-machine.ts  workflow state machine
lib/actions/          server actions (orders, customers, services, team, profile)
lib/data/             role-checked data readers
lib/validation/      zod input schemas
supabase/migrations/  schema + RPCs
supabase/seed.ts      demo dataset
```

## Getting started

Prerequisites: Node 18+, pnpm, a Supabase project, a Clerk application.

```bash
pnpm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…      # server + seed only, never expose
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=…
CLERK_SECRET_KEY=…

# optional
NEXT_PUBLIC_SHOP_NAME=LabadaFlow
DEFAULT_DUE_WINDOW_DAYS=3
```

Apply the schema (`supabase/migrations/001_initial_schema.sql`) in your Supabase project, then optionally seed demo data (services, customers, orders across every status, full histories):

```bash
pnpm seed
```

Run it:

```bash
pnpm dev      # http://localhost:3000
pnpm build    # production check (tsc + lint clean)
```

Sign in via Clerk, then visit `/dashboard` (staff/admin) or `/portal` (customer). First-time sign-ins sync into the `users` table automatically.

## Scope note

LabadaFlow intentionally does not include payments gateways, SMS/email notifications, delivery, AI, realtime sockets, inventory, multi-branch, QR scanning, or loyalty. Completion records pickup + payment timestamps in the order record — that is the full extent of "paid."
