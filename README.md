# LabadaFlow — Every load has a flow.

LabadaFlow is a modern, end-to-end laundry management system built with Next.js 16 App Router, Clerk Authentication, Supabase Postgres, Tailwind CSS, and shadcn/ui. It is designed to operate like a real laundry shop: staff receive walk-in orders, process them across a 6-stage operational pipeline on a staff Kanban board, issue thermal slips with QR codes, record multi-method payments, and allow customers to track progress publicly or manage their laundry through a dedicated customer portal.

---

## The Workflow Lifecycle

Every laundry order follows a strict state machine enforced directly in the database:

```
RECEIVED → WASHING → DRYING → FOLDING → READY → COMPLETED
    ↓           ↓          ↓         ↓       ↓
CANCELLED   CANCELLED  CANCELLED CANCELLED (Terminal)
```

- **Forward moves:** Exactly one step forward at a time (`RECEIVED` → `WASHING` → `DRYING` → `FOLDING` → `READY` → `COMPLETED`).
- **Backward moves:** Allowed one step backward only with a non-empty audit note.
- **Cancellations:** Permitted from any non-terminal state with a required reason.
- **Terminal states:** `COMPLETED` and `CANCELLED` orders cannot transition. Admins can reverse `COMPLETED` back to `READY` via `reopen_order` with a required note (clearing payment timestamp/method).
- **Concurrency & Races:** Transitions check the expected current status before updating, preventing stale UI overwrites.

---

## Role Access & Portals

| Role | Access Level | Primary Routes | Capabilities |
| --- | --- | --- | --- |
| **ADMIN** | Full Backoffice | `/dashboard`, `/board`, `/orders`, `/customers`, `/services`, `/reports`, `/team`, `/settings` | Everything in Staff + manage services catalog, manage team member roles, and reopen completed orders with audit notes. |
| **STAFF** | Operational Backoffice | `/dashboard`, `/board`, `/orders`, `/customers`, `/reports` | Intake new orders, advance orders on Kanban board, edit items in `RECEIVED` state, complete orders with payment method, view reports. |
| **CUSTOMER** | Personal Portal | `/portal`, `/portal/orders`, `/portal/profile` | View personal order history, inspect order itemization and progress timeline, claim walk-in orders using tracking codes, update personal contact profile. |
| **Public / Guest** | Anonymous Tracking | `/`, `/track`, `/track/[code]` | Landing page and public tracking. Public tracking uses a `SECURITY DEFINER` RPC exposing only order number, status, timestamps, and milestone history with **zero customer PII**. |

---

## Architecture & Security Model

- **Next.js 16 App Router:** Server components by default. Server Actions handle all state mutations.
- **Proxy Middleware (`proxy.ts`):** Edge-level route protection powered by Clerk. Deep links (`redirect_url`) survive sign-in without redirects dropping context.
- **Database Hardening:**
  - **Row Level Security (RLS):** Enabled on all 6 tables with **NO policies** (deny-by-default).
  - **Zero Anon Direct Table Access:** The Supabase anonymous key cannot read or write to any table directly.
  - **Service Role Access:** All server actions and data access run exclusively on the server (`server-only`) using `SUPABASE_SERVICE_ROLE_KEY`.
  - **Public Tracking RPC:** Public `/track` reads through `get_tracking(p_code)` which strips customer names, phones, staff assignments, and prices.
  - **Atomic Stored Procedures:**
    - `create_order(...)`: atomic order insertion, line items snapshotting, and initial `RECEIVED` event in one transaction.
    - `update_order_items(...)`: row locking (`FOR UPDATE`), checks `RECEIVED` status, replaces items, and recomputes total.
    - `advance_order_status(...)`: atomic state machine validation and event logging.
    - `complete_order(...)`: atomic transition to `COMPLETED` with `payment_method` (`CASH`, `GCASH`, `OTHER`), `paid_at`, and `completed_at`.
    - `reopen_order(...)`: admin-only transition from `COMPLETED` back to `READY`.
    - `get_dashboard_metrics()` & `get_reports_data()`: aggregations computed in PostgreSQL using `Asia/Manila` day boundaries, excluding cancelled orders from revenue.

---

## Environment Variables

Configure your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...    # Deny-by-default on tables; public RPC access only
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Server-only data access (NEVER expose to client)

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Shop Configuration
NEXT_PUBLIC_SHOP_NAME=LabadaFlow
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEFAULT_DUE_WINDOW_DAYS=3

# Admin Auto-Promotion (comma-separated verified emails promoted to ADMIN on first sync)
ADMIN_EMAILS=labada.admin47@gmail.com,owner@labadaflow.ph
```

---

## Database Migrations

Apply migrations to your Supabase project in order:

### 1. Initial Schema
Applies base tables (`users`, `customers`, `services`, `orders`, `order_items`, `order_status_events`) and triggers.
```bash
npx supabase db query --linked -f supabase/migrations/001_initial_schema.sql
```

### 2. Hardening & RPCs
Enables strict RLS deny-by-default, state machine validation, atomic stored procedures, payment methods enum, and Asia/Manila metrics RPCs.
```bash
npx supabase db query --linked -f supabase/migrations/002_hardening.sql
```

---

## Seeding Realistic Shop Data

Run the idempotent seed script to populate demo services, customers, and orders:

```bash
pnpm seed
```

To perform a clean wipe and re-seed 25 orders across all workflow states:

```bash
pnpm seed --clean
```

The seed script creates:
- **8 Services:** Everyday Wash & Fold, Wash & Iron, Dry Clean, Iron Only, Bedding & Linen, Comforter / Duvet, Curtains & Drapes, Shoe Cleaning.
- **12 Customers:** Mix of walk-in, registered, and portal customers.
- **2 Staff Users:** For role testing and staff assignment.
- **25 Orders:** Full realistic day with orders in `RECEIVED` (4), `WASHING` (4), `DRYING` (4), `FOLDING` (4), `READY` (3), `COMPLETED` (6 with mixed `CASH`, `GCASH`, `OTHER`), and `CANCELLED` (2), plus 2 overdue orders and complete transition histories.

---

## Running the Application

```bash
# Install dependencies
pnpm install

# Run unit tests (state machine + duplicate item merge)
pnpm test

# Start development server
pnpm dev

# Verify production build and types
pnpm build
```

---

## 5-Minute End-to-End Demo Script

Follow this script to demonstrate LabadaFlow to shop owners or team members:

### Step 1: Sign in & Dashboard (`/dashboard`)
1. Log in with an admin account (email listed in `ADMIN_EMAILS`).
2. Notice the live dashboard metrics computed in Manila timezone: Today's Orders, Today's Revenue, Active Queue, and Overdue count.
3. Observe the quick jump shortcuts and recent orders feed.

### Step 2: Staff Operations Board (`/board`)
1. Click **Board** in the sidebar (or press `⌘K` / `Ctrl+K` and type "Board").
2. See the 5 operational columns (`RECEIVED`, `WASHING`, `DRYING`, `FOLDING`, `READY`).
3. Notice the overdue badge on past-due orders and customer phone numbers on cards.
4. **One-tap advance:** Click "Start Washing" on a card; observe the instant optimistic UI advancement.
5. **Multi-select batch advance:** Select 2 cards using their checkboxes; click "Advance Selected" on the floating action bar to batch-advance them.

### Step 3: Fast Walk-in Intake (`/orders/new`)
1. Click **New Order** in the sidebar.
2. Click **+ Quick Add Customer** to create "Maria Santos" (`09179876543`) in a modal without navigating away. The new customer is automatically selected.
3. Select services: add "Wash & Fold" (3 kg) and another line with "Wash & Fold" (2 kg).
4. Notice the reactive summary automatically combines duplicate services into 5 kg total with live price recalculation.
5. Due date is pre-filled automatically using `DEFAULT_DUE_WINDOW_DAYS` (3 days).
6. Click **Create Order**.

### Step 4: 80mm Thermal Receipt Slip (`/orders/[orderId]/slip`)
1. From the order detail page, click **Print Slip**.
2. See the thermal receipt layout formatted for 80mm receipt printers (`@media print`).
3. Notice the scannable QR code generated dynamically pointing directly to `/track/[tracking_code]`.

### Step 5: Ready Notification (`/orders/[orderId]`)
1. Advance the order to `READY`.
2. Notice the green **Ready for customer pickup** banner.
3. Click **Send SMS** to open a pre-filled text message with customer name, total due, and tracking link (`sms:0917...?body=...`).
4. Click **Copy Message** to quickly copy the notification to the clipboard.

### Step 6: Payment Completion & Admin Reopen
1. Click **Complete & Collect Payment** in the header.
2. Select the payment method (**GCash**) and confirm completion.
3. The order is now locked as `COMPLETED` and paid.
4. As an admin, open **Actions** → click **Admin: Reopen Order**. Enter reason: *"Customer requested re-wash"*, and confirm. The order cleanly moves back to `READY`, clearing payment fields with an audit log.

### Step 7: Customer Portal Claiming (`/portal/orders`)
1. Sign in or switch to a customer account.
2. Go to **My Orders** in the customer portal.
3. Click **Claim an Order** and enter the tracking code from Step 4.
4. The order is instantly linked to the customer account and displays live status, itemization, and payment status.

### Step 8: Anonymous Public Tracking (`/track`)
1. Open an incognito browser window and visit `http://localhost:3000/track`.
2. Paste any tracking code (e.g. `LF-ABC123XY`).
3. View the live progress stepper and status milestones. Notice that customer names, phone numbers, and staff details are completely protected and hidden.
