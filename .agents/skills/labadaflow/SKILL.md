# LabadaFlow — Universal AI Engineering Skill

## Governing Principle
Build LabadaFlow as a polished, production-quality, defense-ready Laundry Management System.

**USER DEFINES WHAT. AI DECIDES HOW.**

Use the authoritative `docs/MASTER_PLAN.md` as the product and architecture specification. This SKILL governs engineering behavior.

## Locked Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- shadcn/ui
- Clerk — authentication/identity; never replace
- Supabase PostgreSQL — database; never replace
- Magic UI — tasteful application micro-interactions
- Aceternity UI — selective marketing-only effects
- Lucide React

Do not introduce another ORM, REST backend, React Query/SWR, global state library, payment provider, or parallel architecture without a concrete requirement.

## Product
LabadaFlow is a focused SaaS-style academic Laundry Management System.

Core workflow:
`RECEIVED → WASHING → DRYING → FOLDING → READY → COMPLETED`

Roles:
- ADMIN
- STAFF
- CUSTOMER

Critical distinction:
**Clerk user ≠ laundry customer.**
Walk-in customers are first-class business records and may have no Clerk account.

## Architecture Rules
- One Next.js App Router application.
- Server Components by default.
- Server Actions for mutations.
- Supabase server-side data access through a typed DAL.
- Authentication and authorization are checked on every protected data access/mutation.
- Middleware is a UX/redirect layer, not the security boundary.
- Validate all mutation input server-side.
- Enforce business rules server-side.
- Use database constraints and transactions/RPC where atomicity is required.
- Return role-shaped DTOs and only required fields.
- Avoid N+1 queries, unnecessary client JavaScript, unnecessary dependencies, and premature abstractions.

## Security Rules
Every protected operation:
1. Authenticate with Clerk.
2. Resolve an active actor.
3. Authorize the specific operation.
4. Scope the query to permitted data.
5. Validate input.
6. Enforce domain rules.
7. Mutate safely and invalidate affected UI/data.

Prevent IDOR, role spoofing, privilege escalation, malformed state transitions, duplicate/racing mutations, injection, unsafe HTML, and secret exposure.

Customer portal access must always scope through the authenticated customer's `customers.id`.

Public tracking must expose minimal non-PII data and use unguessable tracking codes.

## Domain Rules
- Status history is append-only.
- Valid transitions are defined by `docs/MASTER_PLAN.md`.
- Backward transitions require a note.
- Cancellation requires a reason.
- Terminal states cannot transition.
- Order items are editable only while RECEIVED.
- Money is integer centavos.
- Historical order item prices are snapshotted.
- Time is stored consistently and displayed in Asia/Manila.

## Payment Rule
LabadaFlow **does not process payments**.

There is:
- no Stripe
- no GCash/Maya/PayPal integration
- no payment gateway
- no payment transaction table
- no payment methods subsystem
- no refunds/partial payments/reconciliation
- no `payment_note`

“Payment” means staff records that real-world payment was received by completing the order.

Completion atomically:
- sets `status = COMPLETED`
- sets `paid_at`
- sets `completed_at`
- appends the status event

## UI/UX Rules
- shadcn/ui is the primary application UI.
- Reuse existing components before creating custom ones.
- Magic UI is for subtle, purposeful micro-interactions.
- Aceternity is marketing-only.
- Avoid decorative effects that slow or distract from operational work.
- Every important area should have intentional loading, empty, error, success, disabled, unauthorized, and not-found behavior where applicable.
- Prevent duplicate submissions.
- Use visible status text/icons in addition to color.
- Mobile behavior is intentional, not merely a shrunken desktop layout.
- Respect reduced motion and WCAG AA basics.

## Smart Everything
Optimize intelligently, not theatrically:
- server-first rendering
- selective queries
- indexes
- pagination
- correct cache invalidation
- lazy-load expensive marketing effects
- avoid unnecessary network requests
- measure before adding complexity

## AI Behavior
Before changing code:
- inspect the existing implementation
- inspect package/configuration
- inspect existing components
- inspect schema/migrations
- reuse what already exists

Prefer the smallest correct change.

Do not ask the user to decide ordinary implementation details. Resolve them autonomously within the locked architecture.

Ask only when:
- a product behavior is genuinely ambiguous,
- established requirements conflict,
- security would be compromised,
- the request materially expands scope,
- an external credential/permission is required.

Do not refactor unrelated code merely because you prefer another style.

## Scope Discipline
Do not add features outside the authoritative MVP specification.

The project has a finite endpoint. Once feature-freeze criteria pass, focus on bug fixes, accessibility, performance, polish, testing, deployment, and defense readiness rather than adding product features.

## Definition of Done
A feature is not done merely because it renders.

Where applicable verify:
- correct UI
- responsive behavior
- loading/empty/error/success states
- client UX validation
- server validation
- authorization
- database constraints
- cache/path invalidation
- accessibility
- edge cases
- no obvious runtime/console errors

## Source of Truth
When this SKILL and `docs/MASTER_PLAN.md` overlap, they should agree.

For detailed routes, schema, permissions, state machine, testing, roadmap, defense flow, and exclusions, use `docs/MASTER_PLAN.md`.

Never silently replace locked decisions with preferred alternatives.
