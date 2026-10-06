# LabadaFlow — Security Specification

This document is derived from `MASTER_PLAN.md`. It is a focused security reference; the Master Plan remains authoritative.

## Core model
Clerk authenticates identities. Supabase stores application records. The server-side DAL and Server Actions enforce authorization.

Middleware is not the security boundary.

## Required request pattern
Authenticate → resolve active actor → authorize operation → validate input → scope data → enforce domain rules → mutate → invalidate.

## IDOR
Customer portal queries must scope through the authenticated customer's `customers.id`. Never retrieve an order solely by `order_id` for a customer request.

Unauthorized resources should behave like missing resources where existence leakage is a concern.

## Public tracking
Tracking codes are unguessable. Public responses expose only current status and limited dates; never expose customer PII, actor names, or internal notes.

## Role security
Roles are server-controlled. Client input must never determine authorization.

## Mutation security
Every Server Action validates input and authorization independently. State transitions are validated against the server-side current status.

## Database integrity
Use foreign keys, checks, unique constraints, conditional updates, and Postgres transactions/functions where multi-step atomicity is required.

## Secrets
Server-only credentials such as Clerk secret and Supabase service-role credentials must never reach client code.

## Payment
No payment subsystem exists. The system only records real-world payment at completion.
