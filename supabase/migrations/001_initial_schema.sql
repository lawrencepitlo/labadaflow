-- LabadaFlow — Initial Database Schema
-- Authoritative source: docs/MASTER_PLAN.md Section 8-9

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER');
CREATE TYPE order_status AS ENUM ('RECEIVED', 'WASHING', 'DRYING', 'FOLDING', 'READY', 'COMPLETED', 'CANCELLED');
CREATE TYPE order_source AS ENUM ('WALK_IN', 'PORTAL');
CREATE TYPE pricing_unit AS ENUM ('PER_KG', 'PER_PIECE');

-- ============================================================
-- TABLES
-- ============================================================

-- Users: backoffice team members and registered portal customers with Clerk accounts
CREATE TABLE users (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   TEXT         NOT NULL UNIQUE,
  role            user_role    NOT NULL DEFAULT 'STAFF',
  full_name       TEXT         NOT NULL,
  email           TEXT         NOT NULL,
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Customers: laundry business customers (walk-in or registered)
CREATE TABLE customers (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   TEXT         UNIQUE,
  full_name       TEXT         NOT NULL,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  notes           TEXT,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Services: laundry service types with pricing
CREATE TABLE services (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT          NOT NULL,
  description       TEXT,
  pricing_unit      pricing_unit  NOT NULL,
  unit_price_cents  INTEGER       NOT NULL CHECK (unit_price_cents >= 0),
  is_active         BOOLEAN       NOT NULL DEFAULT true,
  sort_order        INTEGER       NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Order number sequence
CREATE SEQUENCE order_number_seq START 1 INCREMENT 1;

-- Orders
CREATE TABLE orders (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    TEXT          NOT NULL UNIQUE DEFAULT ('LF-' || LPAD(nextval('order_number_seq')::TEXT, 5, '0')),
  tracking_code   TEXT          NOT NULL UNIQUE,
  customer_id     UUID          NOT NULL REFERENCES customers(id),
  status          order_status  NOT NULL DEFAULT 'RECEIVED',
  source          order_source  NOT NULL DEFAULT 'WALK_IN',
  assigned_to     UUID          REFERENCES users(id),
  created_by      UUID          NOT NULL REFERENCES users(id),
  total_cents     INTEGER       NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  due_at          TIMESTAMPTZ,
  notes           TEXT,
  cancel_reason   TEXT,
  received_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  paid_at         TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT completed_requires_payment CHECK (
    status <> 'COMPLETED' OR (paid_at IS NOT NULL AND completed_at IS NOT NULL)
  ),
  CONSTRAINT cancelled_requires_reason CHECK (
    status <> 'CANCELLED' OR (cancel_reason IS NOT NULL AND cancel_reason <> '')
  ),
  CONSTRAINT paid_at_only_on_completion CHECK (
    paid_at IS NULL OR status = 'COMPLETED'
  ),
  CONSTRAINT cancelled_at_matches_status CHECK (
    (status = 'CANCELLED') = (cancelled_at IS NOT NULL)
  )
);

-- Order items: price fields snapshotted at creation
CREATE TABLE order_items (
  id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_id          UUID            REFERENCES services(id) ON DELETE SET NULL,
  service_name        TEXT            NOT NULL,
  pricing_unit        pricing_unit    NOT NULL,
  unit_price_cents    INTEGER         NOT NULL CHECK (unit_price_cents >= 0),
  quantity            NUMERIC(10,3)   NOT NULL CHECK (quantity > 0),
  line_total_cents    INTEGER         NOT NULL CHECK (line_total_cents >= 0),
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Order status events: append-only audit trail
CREATE TABLE order_status_events (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID          NOT NULL REFERENCES orders(id),
  actor_id      UUID          REFERENCES users(id) ON DELETE SET NULL,
  actor_name    TEXT          NOT NULL,
  from_status   order_status,
  to_status     order_status  NOT NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- orders
CREATE INDEX idx_orders_customer_id   ON orders(customer_id);
CREATE INDEX idx_orders_status        ON orders(status);
CREATE INDEX idx_orders_created_at    ON orders(created_at DESC);
CREATE INDEX idx_orders_assigned_to   ON orders(assigned_to);
CREATE INDEX idx_orders_received_at   ON orders(received_at DESC);

-- order_items
CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX idx_order_items_service_id ON order_items(service_id);

-- order_status_events
CREATE INDEX idx_events_order_id ON order_status_events(order_id, created_at ASC);

-- customers
CREATE INDEX idx_customers_phone         ON customers(phone);
CREATE INDEX idx_customers_email         ON customers(email);
CREATE INDEX idx_customers_archived_at   ON customers(archived_at);
CREATE INDEX idx_customers_full_name     ON customers USING gin(to_tsvector('simple', full_name));

-- users
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- complete_order: atomically sets COMPLETED + paid_at + completed_at + inserts status event
CREATE OR REPLACE FUNCTION complete_order(
  p_order_id   UUID,
  p_actor_id   UUID,
  p_actor_name TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE orders
  SET status = 'COMPLETED',
      paid_at = NOW(),
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_order_id
    AND status = 'READY';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not in READY status or does not exist';
  END IF;

  INSERT INTO order_status_events (order_id, actor_id, actor_name, from_status, to_status)
  VALUES (p_order_id, p_actor_id, p_actor_name, 'READY', 'COMPLETED');
END;
$$ LANGUAGE plpgsql;

-- cancel_order: atomically sets CANCELLED + cancel_reason + cancelled_at + inserts status event
CREATE OR REPLACE FUNCTION cancel_order(
  p_order_id      UUID,
  p_actor_id      UUID,
  p_actor_name    TEXT,
  p_cancel_reason TEXT,
  p_from_status   order_status
) RETURNS VOID AS $$
BEGIN
  UPDATE orders
  SET status = 'CANCELLED',
      cancel_reason = p_cancel_reason,
      cancelled_at = NOW(),
      updated_at = NOW()
  WHERE id = p_order_id
    AND status = p_from_status
    AND status NOT IN ('COMPLETED', 'CANCELLED');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order cannot be cancelled from current status';
  END IF;

  INSERT INTO order_status_events (order_id, actor_id, actor_name, from_status, to_status, note)
  VALUES (p_order_id, p_actor_id, p_actor_name, p_from_status, 'CANCELLED', p_cancel_reason);
END;
$$ LANGUAGE plpgsql;

-- advance_order_status: moves order forward or backward one step + inserts status event
CREATE OR REPLACE FUNCTION advance_order_status(
  p_order_id    UUID,
  p_actor_id    UUID,
  p_actor_name  TEXT,
  p_from_status order_status,
  p_to_status   order_status,
  p_note        TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE orders
  SET status = p_to_status,
      updated_at = NOW()
  WHERE id = p_order_id
    AND status = p_from_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order status mismatch — expected % but order has changed', p_from_status;
  END IF;

  INSERT INTO order_status_events (order_id, actor_id, actor_name, from_status, to_status, note)
  VALUES (p_order_id, p_actor_id, p_actor_name, p_from_status, p_to_status, p_note);
END;
$$ LANGUAGE plpgsql;

-- update_order_total: recalculates total_cents from order_items
CREATE OR REPLACE FUNCTION update_order_total(p_order_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE orders
  SET total_cents = COALESCE((
    SELECT SUM(line_total_cents) FROM order_items WHERE order_id = p_order_id
  ), 0),
  updated_at = NOW()
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;
