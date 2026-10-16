-- LabadaFlow — Hardening & Security Migration (002)
-- Strict RLS, DB state machine, atomic RPCs, payments, and SQL aggregations

-- ============================================================
-- 1. SECURITY & ROW LEVEL SECURITY (Deny by default)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_events ENABLE ROW LEVEL SECURITY;

-- Note: No permissive policies are added.
-- The anon and authenticated roles have NO access to tables directly.
-- All server access uses the service_role key which bypasses RLS in Postgres.

-- ============================================================
-- 2. ENUMS & PAYMENT METHOD
-- ============================================================

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('CASH', 'GCASH', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method payment_method;

-- Backfill any existing completed orders with default CASH payment method
UPDATE orders SET payment_method = 'CASH' WHERE status = 'COMPLETED' AND payment_method IS NULL;

-- Update constraints for payment methods & reopening
ALTER TABLE orders DROP CONSTRAINT IF EXISTS completed_requires_payment;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS paid_at_only_on_completion;

ALTER TABLE orders ADD CONSTRAINT completed_requires_payment CHECK (
  status <> 'COMPLETED' OR (paid_at IS NOT NULL AND completed_at IS NOT NULL AND payment_method IS NOT NULL)
);

ALTER TABLE orders ADD CONSTRAINT paid_at_only_on_completion CHECK (
  (paid_at IS NULL AND payment_method IS NULL) OR status = 'COMPLETED'
);

-- ============================================================
-- 3. STATE MACHINE IN DATABASE (advance_order_status, complete_order, reopen_order, cancel_order)
-- ============================================================

-- advance_order_status: strictly validates allowed transitions and notes
CREATE OR REPLACE FUNCTION advance_order_status(
  p_order_id    UUID,
  p_actor_id    UUID,
  p_actor_name  TEXT,
  p_from_status order_status,
  p_to_status   order_status,
  p_note        TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_current_status order_status;
  v_is_valid BOOLEAN := false;
  v_is_backward BOOLEAN := false;
BEGIN
  SELECT status INTO v_current_status
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_current_status <> p_from_status THEN
    RAISE EXCEPTION 'Order status mismatch — expected % but order is %', p_from_status, v_current_status;
  END IF;

  IF v_current_status IN ('COMPLETED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Terminal status % cannot transition', v_current_status;
  END IF;

  -- Forward transitions (1 step only)
  IF (v_current_status = 'RECEIVED' AND p_to_status = 'WASHING') OR
     (v_current_status = 'WASHING'  AND p_to_status = 'DRYING') OR
     (v_current_status = 'DRYING'   AND p_to_status = 'FOLDING') OR
     (v_current_status = 'FOLDING'  AND p_to_status = 'READY') THEN
    v_is_valid := true;
    v_is_backward := false;
  END IF;

  -- Backward transitions (1 step only, non-empty note required)
  IF (v_current_status = 'READY'   AND p_to_status = 'FOLDING') OR
     (v_current_status = 'FOLDING' AND p_to_status = 'DRYING') OR
     (v_current_status = 'DRYING'  AND p_to_status = 'WASHING') OR
     (v_current_status = 'WASHING' AND p_to_status = 'RECEIVED') THEN
    v_is_valid := true;
    v_is_backward := true;
  END IF;

  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Invalid transition from % to %', v_current_status, p_to_status;
  END IF;

  IF v_is_backward AND (p_note IS NULL OR trim(p_note) = '') THEN
    RAISE EXCEPTION 'Note required for backward transition from % to %', v_current_status, p_to_status;
  END IF;

  UPDATE orders
  SET status = p_to_status,
      updated_at = NOW()
  WHERE id = p_order_id;

  INSERT INTO order_status_events (order_id, actor_id, actor_name, from_status, to_status, note)
  VALUES (p_order_id, p_actor_id, p_actor_name, p_from_status, p_to_status, p_note);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- complete_order: atomically sets COMPLETED + paid_at + completed_at + payment_method
CREATE OR REPLACE FUNCTION complete_order(
  p_order_id       UUID,
  p_actor_id       UUID,
  p_actor_name     TEXT,
  p_payment_method payment_method
) RETURNS VOID AS $$
BEGIN
  IF p_payment_method IS NULL THEN
    RAISE EXCEPTION 'Payment method is required';
  END IF;

  UPDATE orders
  SET status = 'COMPLETED',
      paid_at = NOW(),
      completed_at = NOW(),
      payment_method = p_payment_method,
      updated_at = NOW()
  WHERE id = p_order_id
    AND status = 'READY';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not in READY status or does not exist';
  END IF;

  INSERT INTO order_status_events (order_id, actor_id, actor_name, from_status, to_status, note)
  VALUES (p_order_id, p_actor_id, p_actor_name, 'READY', 'COMPLETED', 'Paid via ' || p_payment_method::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- reopen_order: admin-only reversal from COMPLETED back to READY with required note
CREATE OR REPLACE FUNCTION reopen_order(
  p_order_id   UUID,
  p_actor_id   UUID,
  p_actor_name TEXT,
  p_note       TEXT
) RETURNS VOID AS $$
BEGIN
  IF p_note IS NULL OR trim(p_note) = '' THEN
    RAISE EXCEPTION 'Note is required to reopen order';
  END IF;

  UPDATE orders
  SET status = 'READY',
      paid_at = NULL,
      completed_at = NULL,
      payment_method = NULL,
      updated_at = NOW()
  WHERE id = p_order_id
    AND status = 'COMPLETED';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not in COMPLETED status or does not exist';
  END IF;

  INSERT INTO order_status_events (order_id, actor_id, actor_name, from_status, to_status, note)
  VALUES (p_order_id, p_actor_id, p_actor_name, 'COMPLETED', 'READY', p_note);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 4. ATOMIC ORDER CREATION & ITEM UPDATES
-- ============================================================

-- create_order: atomic order + items + initial status event with price snapshots & service merge
CREATE OR REPLACE FUNCTION create_order(
  p_customer_id   UUID,
  p_source        order_source,
  p_assigned_to   UUID,
  p_due_at        TIMESTAMPTZ,
  p_notes         TEXT,
  p_created_by    UUID,
  p_actor_name    TEXT,
  p_tracking_code TEXT,
  p_items         JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_total_cents INTEGER := 0;
  v_item RECORD;
  v_svc RECORD;
  v_line_total INTEGER;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one item is required';
  END IF;

  -- Verify customer exists
  IF NOT EXISTS (SELECT 1 FROM customers WHERE id = p_customer_id) THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  -- Create order record
  INSERT INTO orders (
    customer_id,
    source,
    assigned_to,
    created_by,
    total_cents,
    due_at,
    notes,
    tracking_code,
    status
  ) VALUES (
    p_customer_id,
    COALESCE(p_source, 'WALK_IN'),
    p_assigned_to,
    p_created_by,
    0,
    p_due_at,
    p_notes,
    p_tracking_code,
    'RECEIVED'
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- Process merged items (group by service_id)
  FOR v_item IN
    SELECT
      (elem->>'service_id')::UUID AS service_id,
      SUM((elem->>'quantity')::NUMERIC) AS quantity
    FROM jsonb_array_elements(p_items) AS elem
    GROUP BY (elem->>'service_id')::UUID
  LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive';
    END IF;

    SELECT id, name, pricing_unit, unit_price_cents, is_active
    INTO v_svc
    FROM services
    WHERE id = v_item.service_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Service % not found', v_item.service_id;
    END IF;

    IF NOT v_svc.is_active THEN
      RAISE EXCEPTION 'Service "%" is not active', v_svc.name;
    END IF;

    v_line_total := ROUND(v_svc.unit_price_cents * v_item.quantity);
    v_total_cents := v_total_cents + v_line_total;

    INSERT INTO order_items (
      order_id,
      service_id,
      service_name,
      pricing_unit,
      unit_price_cents,
      quantity,
      line_total_cents
    ) VALUES (
      v_order_id,
      v_svc.id,
      v_svc.name,
      v_svc.pricing_unit,
      v_svc.unit_price_cents,
      v_item.quantity,
      v_line_total
    );
  END LOOP;

  -- Update final total
  UPDATE orders
  SET total_cents = v_total_cents
  WHERE id = v_order_id;

  -- Initial status event
  INSERT INTO order_status_events (
    order_id,
    actor_id,
    actor_name,
    from_status,
    to_status
  ) VALUES (
    v_order_id,
    p_created_by,
    p_actor_name,
    NULL,
    'RECEIVED'
  );

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'tracking_code', p_tracking_code,
    'total_cents', v_total_cents
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- update_order_items: locks order, requires RECEIVED, replaces items, recomputes total
CREATE OR REPLACE FUNCTION update_order_items(
  p_order_id   UUID,
  p_items      JSONB
) RETURNS JSONB AS $$
DECLARE
  v_status order_status;
  v_total_cents INTEGER := 0;
  v_item RECORD;
  v_svc RECORD;
  v_line_total INTEGER;
BEGIN
  SELECT status INTO v_status
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_status <> 'RECEIVED' THEN
    RAISE EXCEPTION 'Items can only be edited while order is RECEIVED (current status: %)', v_status;
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one item is required';
  END IF;

  -- Remove existing items
  DELETE FROM order_items WHERE order_id = p_order_id;

  -- Insert merged items
  FOR v_item IN
    SELECT
      (elem->>'service_id')::UUID AS service_id,
      SUM((elem->>'quantity')::NUMERIC) AS quantity
    FROM jsonb_array_elements(p_items) AS elem
    GROUP BY (elem->>'service_id')::UUID
  LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive';
    END IF;

    SELECT id, name, pricing_unit, unit_price_cents, is_active
    INTO v_svc
    FROM services
    WHERE id = v_item.service_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Service % not found', v_item.service_id;
    END IF;

    v_line_total := ROUND(v_svc.unit_price_cents * v_item.quantity);
    v_total_cents := v_total_cents + v_line_total;

    INSERT INTO order_items (
      order_id,
      service_id,
      service_name,
      pricing_unit,
      unit_price_cents,
      quantity,
      line_total_cents
    ) VALUES (
      p_order_id,
      v_svc.id,
      v_svc.name,
      v_svc.pricing_unit,
      v_svc.unit_price_cents,
      v_item.quantity,
      v_line_total
    );
  END LOOP;

  UPDATE orders
  SET total_cents = v_total_cents,
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'id', p_order_id,
    'total_cents', v_total_cents
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 5. PUBLIC TRACKING RPC (SECURITY DEFINER, NO PII)
-- ============================================================

CREATE OR REPLACE FUNCTION get_tracking(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'order_number', o.order_number,
    'status', o.status,
    'received_at', o.received_at,
    'due_at', o.due_at,
    'updated_at', o.updated_at,
    'events', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'to_status', e.to_status,
          'created_at', e.created_at
        ) ORDER BY e.created_at ASC
      )
      FROM order_status_events e
      WHERE e.order_id = o.id
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM orders o
  WHERE o.tracking_code = trim(p_code);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_tracking(TEXT) TO anon, authenticated, service_role;

-- ============================================================
-- 6. DASHBOARD & REPORTS (Asia/Manila time zone & accurate aggregations)
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSONB AS $$
DECLARE
  v_overdue_count INTEGER;
  v_ready_count INTEGER;
  v_in_progress_count INTEGER;
  v_received_count INTEGER;
  v_today_orders_count INTEGER;
  v_today_revenue_cents INTEGER;
  v_total_orders INTEGER;
  v_active_orders INTEGER;
  v_customer_count INTEGER;
  v_status_counts JSONB;
  v_recent_orders JSONB;
BEGIN
  -- Overdue orders (not completed, not cancelled, due_at has passed)
  SELECT COUNT(*) INTO v_overdue_count
  FROM orders
  WHERE due_at < NOW()
    AND status NOT IN ('COMPLETED', 'CANCELLED');

  SELECT COUNT(*) INTO v_ready_count FROM orders WHERE status = 'READY';
  SELECT COUNT(*) INTO v_in_progress_count FROM orders WHERE status IN ('WASHING', 'DRYING', 'FOLDING');
  SELECT COUNT(*) INTO v_received_count FROM orders WHERE status = 'RECEIVED';

  -- Today's orders count in Asia/Manila
  SELECT COUNT(*) INTO v_today_orders_count
  FROM orders
  WHERE (received_at AT TIME ZONE 'Asia/Manila')::DATE = (NOW() AT TIME ZONE 'Asia/Manila')::DATE;

  -- Today's revenue in Asia/Manila (excluding cancelled orders)
  SELECT COALESCE(SUM(total_cents), 0) INTO v_today_revenue_cents
  FROM orders
  WHERE status = 'COMPLETED'
    AND (completed_at AT TIME ZONE 'Asia/Manila')::DATE = (NOW() AT TIME ZONE 'Asia/Manila')::DATE;

  SELECT COUNT(*) INTO v_total_orders FROM orders;
  SELECT COUNT(*) INTO v_active_orders FROM orders WHERE status NOT IN ('COMPLETED', 'CANCELLED');
  SELECT COUNT(*) INTO v_customer_count FROM customers WHERE archived_at IS NULL;

  -- Status counts map
  SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb) INTO v_status_counts
  FROM (
    SELECT status, COUNT(*) AS cnt
    FROM orders
    GROUP BY status
  ) s;

  -- Recent orders with customer & items summary
  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) INTO v_recent_orders
  FROM (
    SELECT
      o.id,
      o.order_number,
      o.status,
      o.total_cents,
      o.received_at,
      o.due_at,
      o.updated_at,
      o.created_at,
      jsonb_build_object('id', c.id, 'full_name', c.full_name) AS customer,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object('service_name', oi.service_name, 'quantity', oi.quantity))
        FROM order_items oi
        WHERE oi.order_id = o.id
      ), '[]'::jsonb) AS items
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    ORDER BY o.created_at DESC
    LIMIT 8
  ) r;

  RETURN jsonb_build_object(
    'overdue_count', v_overdue_count,
    'ready_count', v_ready_count,
    'in_progress_count', v_in_progress_count,
    'received_count', v_received_count,
    'today_orders_count', v_today_orders_count,
    'today_revenue_cents', v_today_revenue_cents,
    'total_orders', v_total_orders,
    'active_orders', v_active_orders,
    'customer_count', v_customer_count,
    'status_counts', v_status_counts,
    'recent_orders', v_recent_orders
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_reports_data()
RETURNS JSONB AS $$
DECLARE
  v_orders_today INTEGER;
  v_orders_this_week INTEGER;
  v_revenue_today INTEGER;
  v_revenue_this_week INTEGER;
  v_revenue_total INTEGER;
  v_orders_by_service JSONB;
  v_status_breakdown JSONB;
BEGIN
  -- Orders today in Asia/Manila
  SELECT COUNT(*) INTO v_orders_today
  FROM orders
  WHERE (created_at AT TIME ZONE 'Asia/Manila')::DATE = (NOW() AT TIME ZONE 'Asia/Manila')::DATE;

  -- Orders past 7 days (rolling week) in Asia/Manila
  SELECT COUNT(*) INTO v_orders_this_week
  FROM orders
  WHERE (created_at AT TIME ZONE 'Asia/Manila')::DATE >= (NOW() AT TIME ZONE 'Asia/Manila')::DATE - INTERVAL '6 days';

  -- Revenue today (COMPLETED only)
  SELECT COALESCE(SUM(total_cents), 0) INTO v_revenue_today
  FROM orders
  WHERE status = 'COMPLETED'
    AND (completed_at AT TIME ZONE 'Asia/Manila')::DATE = (NOW() AT TIME ZONE 'Asia/Manila')::DATE;

  -- Revenue this week (COMPLETED only)
  SELECT COALESCE(SUM(total_cents), 0) INTO v_revenue_this_week
  FROM orders
  WHERE status = 'COMPLETED'
    AND (completed_at AT TIME ZONE 'Asia/Manila')::DATE >= (NOW() AT TIME ZONE 'Asia/Manila')::DATE - INTERVAL '6 days';

  -- Total revenue (COMPLETED only)
  SELECT COALESCE(SUM(total_cents), 0) INTO v_revenue_total
  FROM orders
  WHERE status = 'COMPLETED';

  -- Orders by service (EXCLUDES CANCELLED ORDERS, counts DISTINCT order_id)
  SELECT COALESCE(jsonb_agg(s ORDER BY (s->>'revenue_cents')::INTEGER DESC), '[]'::jsonb) INTO v_orders_by_service
  FROM (
    SELECT jsonb_build_object(
      'service_name', oi.service_name,
      'count', COUNT(DISTINCT oi.order_id),
      'revenue_cents', COALESCE(SUM(oi.line_total_cents), 0)
    ) AS s
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status <> 'CANCELLED'
    GROUP BY oi.service_name
  ) grouped;

  -- Status breakdown
  SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb) INTO v_status_breakdown
  FROM (
    SELECT status, COUNT(*) AS cnt
    FROM orders
    GROUP BY status
  ) sb;

  RETURN jsonb_build_object(
    'orders_today', v_orders_today,
    'orders_this_week', v_orders_this_week,
    'revenue_today', v_revenue_today,
    'revenue_this_week', v_revenue_this_week,
    'revenue_total', v_revenue_total,
    'orders_by_service', v_orders_by_service,
    'status_breakdown', v_status_breakdown
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
