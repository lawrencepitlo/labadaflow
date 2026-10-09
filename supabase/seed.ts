/**
 * LabadaFlow seed script.
 *
 * Usage:
 *   pnpm seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * Creates a complete demo dataset per Master Plan Section 24:
 *   - 1 admin user (must already exist via Clerk sync)
 *   - 2 staff users (demo records for team management / order assignment)
 *   - 1 customer user (must already exist via Clerk sync, linked to a customer record)
 *   - 5–8 customer records (mix of walk-in and linked)
 *   - 4–6 services (mix of PER_KG and PER_PIECE)
 *   - 10–15 orders in every status (incl. COMPLETED and CANCELLED)
 *   - Full status history for every order
 *   - At least one READY order ready for the completion demo
 *
 * Idempotent: skips records that already exist.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { customAlphabet } from 'nanoid'

function loadEnv() {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([^#=]+)=(.*)\s*$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2]
    }
  }
}

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16)

const FORWARD_FLOW = ['RECEIVED', 'WASHING', 'DRYING', 'FOLDING', 'READY', 'COMPLETED'] as const

async function main() {
  loadEnv()

  // Production guard: demo fixtures must never be seeded into a production
  // database by accident. Pass --allow-prod only when that is intentional.
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--allow-prod')) {
    console.error('Refusing to seed in NODE_ENV=production without --allow-prod.')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey)

  // ---------------------------------------------------------------
  // 1. Services
  // ---------------------------------------------------------------
  const services = [
    { name: 'Wash & Fold', description: 'Standard wash and fold', pricing_unit: 'PER_KG', unit_price_cents: 8000, sort_order: 1 },
    { name: 'Wash & Iron', description: 'Wash, dry, and press', pricing_unit: 'PER_KG', unit_price_cents: 12000, sort_order: 2 },
    { name: 'Dry Clean', description: 'Dry cleaning per piece', pricing_unit: 'PER_PIECE', unit_price_cents: 15000, sort_order: 3 },
    { name: 'Iron Only', description: 'Pressing only', pricing_unit: 'PER_PIECE', unit_price_cents: 3000, sort_order: 4 },
    { name: 'Bedding & Linen', description: 'Wash and fold for beddings', pricing_unit: 'PER_KG', unit_price_cents: 10000, sort_order: 5 },
  ]

  const serviceIds: Record<string, string> = {}
  for (const svc of services) {
    const { data: existing } = await supabase.from('services').select('id').eq('name', svc.name).maybeSingle()
    if (existing) {
      serviceIds[svc.name] = existing.id
    } else {
      const { data, error } = await supabase.from('services').insert(svc).select('id').single()
      if (error) console.error(`Service ${svc.name}:`, error.message)
      else {
        serviceIds[svc.name] = data.id
        console.log(`+ service ${svc.name}`)
      }
    }
  }

  // ---------------------------------------------------------------
  // 2. Customers
  // ---------------------------------------------------------------
  const customers: { full_name: string; phone: string | null; email: string | null; address: string | null }[] = [
    { full_name: 'Walk-in Customer', phone: null, email: null, address: null },
    { full_name: 'Juan Dela Cruz', phone: '09171234567', email: 'juan@example.com', address: 'Quezon City' },
    { full_name: 'Maria Santos', phone: '09179876543', email: 'maria@example.com', address: 'Manila' },
    { full_name: 'Pedro Reyes', phone: '09181112233', email: 'pedro@example.com', address: 'Makati' },
    { full_name: 'Ana Garcia', phone: '09194445566', email: 'ana@example.com', address: 'Pasig' },
    { full_name: 'Carlo Mendoza', phone: '09207778899', email: null, address: 'Taguig' },
    { full_name: 'Portal Customer', phone: '09170000000', email: 'labada.portal47@gmail.com', address: 'Demo City' },
  ]

  const customerIds: Record<string, string> = {}
  for (const c of customers) {
    const query = c.phone
      ? supabase.from('customers').select('id').eq('phone', c.phone).maybeSingle()
      : supabase.from('customers').select('id').eq('full_name', c.full_name).maybeSingle()
    const { data: existing } = await query
    if (existing) {
      customerIds[c.full_name] = existing.id
    } else {
      const { data, error } = await supabase.from('customers').insert(c).select('id').single()
      if (error) console.error(`Customer ${c.full_name}:`, error.message)
      else {
        customerIds[c.full_name] = data.id
        console.log(`+ customer ${c.full_name}`)
      }
    }
  }

  // ---------------------------------------------------------------
  // 3. Staff users (demo records — populate team management & assignment)
  // ---------------------------------------------------------------
  const staffMembers = [
    { clerk_user_id: 'seed-staff-1', role: 'STAFF', full_name: 'Staff One', email: 'staff1@labadaflow.demo' },
    { clerk_user_id: 'seed-staff-2', role: 'STAFF', full_name: 'Staff Two', email: 'staff2@labadaflow.demo' },
  ]

  const staffIds: string[] = []
  for (const s of staffMembers) {
    const { data: existing } = await supabase.from('users').select('id').eq('clerk_user_id', s.clerk_user_id).maybeSingle()
    if (existing) {
      staffIds.push(existing.id)
    } else {
      const { data, error } = await supabase.from('users').insert(s).select('id').single()
      if (error) console.error(`Staff ${s.full_name}:`, error.message)
      else {
        staffIds.push(data.id)
        console.log(`+ staff ${s.full_name}`)
      }
    }
  }

  // ---------------------------------------------------------------
  // 4. Orders in every status with full status history
  // ---------------------------------------------------------------
  const { count: existingOrders } = await supabase.from('orders').select('id', { count: 'exact', head: true })
  if (existingOrders && existingOrders > 0) {
    console.log(`= ${existingOrders} orders already exist — skipping order seed`)
    console.log('Seed complete.')
    return
  }

  // Resolve the admin user (created via Clerk sync) to use as order creator
  const { data: adminUser } = await supabase.from('users').select('id, full_name').eq('role', 'ADMIN').limit(1).maybeSingle()
  if (!adminUser) {
    console.error('No ADMIN user found. Log in as admin once so the user syncs, then re-run seed.')
    process.exit(1)
  }
  const creator = adminUser as { id: string; full_name: string }

  // Helper: create an order with items, then walk it to a target status
  async function createOrderWithStatus(opts: {
    customerKey: string
    status: string
    source?: 'WALK_IN' | 'PORTAL'
    items: { service: string; quantity: number }[]
    assignedToStaff?: number
    dueInDays?: number | null
    notes?: string | null
    cancelReason?: string | null
  }) {
    const customerId = customerIds[opts.customerKey]
    if (!customerId) {
      console.error(`Customer "${opts.customerKey}" not found — skipping order`)
      return
    }

    // Build items with snapshot pricing
    const orderItems = opts.items.map(i => {
      const svc = services.find(s => s.name === i.service)!
      const svcId = serviceIds[i.service]
      const lineTotal = Math.round(svc.unit_price_cents * i.quantity)
      return {
        service_id: svcId,
        service_name: svc.name,
        pricing_unit: svc.pricing_unit,
        unit_price_cents: svc.unit_price_cents,
        quantity: i.quantity,
        line_total_cents: lineTotal,
      }
    })
    const totalCents = orderItems.reduce((s, i) => s + i.line_total_cents, 0)

    const dueAt = opts.dueInDays != null
      ? new Date(Date.now() + opts.dueInDays * 86400000).toISOString()
      : null

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tracking_code: nanoid(),
        customer_id: customerId,
        status: 'RECEIVED',
        source: opts.source ?? 'WALK_IN',
        assigned_to: opts.assignedToStaff != null ? staffIds[opts.assignedToStaff] : null,
        created_by: creator.id,
        total_cents: totalCents,
        due_at: dueAt,
        notes: opts.notes ?? null,
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      console.error(`Order for ${opts.customerKey}:`, orderError?.message)
      return
    }

    // Insert items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems.map(i => ({ ...i, order_id: order.id })))
    if (itemsError) console.error(`  items:`, itemsError.message)

    // Initial event: NULL → RECEIVED
    await supabase.from('order_status_events').insert({
      order_id: order.id,
      actor_id: creator.id,
      actor_name: creator.full_name,
      from_status: null,
      to_status: 'RECEIVED',
    })

    // Walk forward to target status
    if (opts.status === 'CANCELLED') {
      await supabase.from('orders').update({ status: 'CANCELLED', cancel_reason: opts.cancelReason ?? 'Cancelled', cancelled_at: new Date().toISOString() }).eq('id', order.id)
      await supabase.from('order_status_events').insert({
        order_id: order.id,
        actor_id: creator.id,
        actor_name: creator.full_name,
        from_status: 'RECEIVED',
        to_status: 'CANCELLED',
        note: opts.cancelReason ?? 'Cancelled',
      })
    } else {
      const targetIdx = FORWARD_FLOW.indexOf(opts.status as (typeof FORWARD_FLOW)[number])
      for (let i = 0; i < targetIdx; i++) {
        const from = FORWARD_FLOW[i]
        const to = FORWARD_FLOW[i + 1]
        // COMPLETED requires paid_at + completed_at (DB constraint)
        const updatePayload = to === 'COMPLETED'
          ? { status: to, paid_at: new Date().toISOString(), completed_at: new Date().toISOString() }
          : { status: to }
        const { error: updErr } = await supabase.from('orders').update(updatePayload).eq('id', order.id)
        if (updErr) console.error(`  → ${to}:`, updErr.message)
        await supabase.from('order_status_events').insert({
          order_id: order.id,
          actor_id: creator.id,
          actor_name: creator.full_name,
          from_status: from,
          to_status: to,
        })
      }
    }

    console.log(`+ order ${order.order_number} → ${opts.status} (${opts.customerKey})`)
  }

  // 15 orders covering every status
  await createOrderWithStatus({ customerKey: 'Juan Dela Cruz', status: 'RECEIVED', items: [{ service: 'Wash & Fold', quantity: 3 }], assignedToStaff: 0, dueInDays: 3 })
  await createOrderWithStatus({ customerKey: 'Maria Santos', status: 'WASHING', items: [{ service: 'Wash & Iron', quantity: 2.5 }], assignedToStaff: 1, dueInDays: 2 })
  await createOrderWithStatus({ customerKey: 'Pedro Reyes', status: 'DRYING', items: [{ service: 'Dry Clean', quantity: 4 }, { service: 'Iron Only', quantity: 2 }], assignedToStaff: 0, dueInDays: 2 })
  await createOrderWithStatus({ customerKey: 'Ana Garcia', status: 'FOLDING', items: [{ service: 'Wash & Fold', quantity: 5 }], assignedToStaff: 1, dueInDays: 1 })
  await createOrderWithStatus({ customerKey: 'Juan Dela Cruz', status: 'READY', items: [{ service: 'Wash & Fold', quantity: 4 }, { service: 'Iron Only', quantity: 3 }], assignedToStaff: 0, dueInDays: 1, notes: 'Ready for pickup' })
  await createOrderWithStatus({ customerKey: 'Maria Santos', status: 'COMPLETED', items: [{ service: 'Wash & Iron', quantity: 3 }], assignedToStaff: 1 })
  await createOrderWithStatus({ customerKey: 'Pedro Reyes', status: 'COMPLETED', items: [{ service: 'Dry Clean', quantity: 2 }, { service: 'Bedding & Linen', quantity: 1.5 }], assignedToStaff: 0 })
  await createOrderWithStatus({ customerKey: 'Ana Garcia', status: 'CANCELLED', items: [{ service: 'Wash & Fold', quantity: 2 }], cancelReason: 'Customer requested cancellation' })
  await createOrderWithStatus({ customerKey: 'Walk-in Customer', status: 'RECEIVED', items: [{ service: 'Iron Only', quantity: 6 }], dueInDays: 4 })
  await createOrderWithStatus({ customerKey: 'Carlo Mendoza', status: 'WASHING', items: [{ service: 'Bedding & Linen', quantity: 2 }], assignedToStaff: 1, dueInDays: 3 })
  await createOrderWithStatus({ customerKey: 'Walk-in Customer', status: 'READY', items: [{ service: 'Wash & Fold', quantity: 6 }], dueInDays: 1 })
  await createOrderWithStatus({ customerKey: 'Juan Dela Cruz', status: 'COMPLETED', items: [{ service: 'Wash & Fold', quantity: 3.5 }, { service: 'Dry Clean', quantity: 1 }], assignedToStaff: 0 })
  await createOrderWithStatus({ customerKey: 'Maria Santos', status: 'DRYING', items: [{ service: 'Wash & Iron', quantity: 4 }], assignedToStaff: 1, dueInDays: 2 })
  await createOrderWithStatus({ customerKey: 'Ana Garcia', status: 'CANCELLED', items: [{ service: 'Iron Only', quantity: 3 }], cancelReason: 'Duplicate order' })
  await createOrderWithStatus({ customerKey: 'Carlo Mendoza', status: 'FOLDING', items: [{ service: 'Bedding & Linen', quantity: 3 }, { service: 'Wash & Fold', quantity: 2 }], assignedToStaff: 0, dueInDays: 1 })

  // Portal customer orders (linked customer record) — gives the portal demo data
  const portalCustomer = customerIds['Portal Customer']
  if (portalCustomer) {
    // Reuse the helper by temporarily mapping the key; create directly for PORTAL source
    const portalOrders: { status: string; items: { service: string; quantity: number }[]; dueInDays?: number }[] = [
      { status: 'COMPLETED', items: [{ service: 'Wash & Fold', quantity: 3 }] },
      { status: 'READY', items: [{ service: 'Wash & Iron', quantity: 2 }, { service: 'Iron Only', quantity: 4 }], dueInDays: 1 },
      { status: 'WASHING', items: [{ service: 'Dry Clean', quantity: 3 }], dueInDays: 2 },
    ]
    for (const po of portalOrders) {
      await createOrderWithStatus({ customerKey: 'Portal Customer', status: po.status, source: 'PORTAL', items: po.items, dueInDays: po.dueInDays ?? null })
    }
  }

  console.log('Seed complete.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
