# LabadaFlow — Database Specification

The authoritative schema is Section 8–9 of `docs/MASTER_PLAN.md`.

Core tables:
- users
- customers
- services
- orders
- order_items
- order_status_events

Core enums:
- user_role
- order_status
- order_source
- pricing_unit

Important invariants:
- money is integer centavos
- order item pricing is snapshotted
- order items require positive quantity
- completed orders require paid_at and completed_at
- paid_at may only exist on COMPLETED orders
- cancelled orders require a cancellation reason
- status events are append-only
- order numbers are generated from a Postgres sequence
- tracking codes are unique and unguessable

Atomic completion uses a Postgres function/RPC that updates the order and appends its status event in one transaction.
