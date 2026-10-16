/**
 * LabadaFlow seed script.
 *
 * Usage:
 *   pnpm seed
 *   pnpm seed --clean
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * Creates a realistic laundry shop day dataset:
 *   - 8 services (mix of PER_KG and PER_PIECE)
 *   - 12 customers (walk-in, registered, portal)
 *   - 2 staff users
 *   - ~25 orders across all statuses with full histories:
 *       - 4 RECEIVED
 *       - 4 WASHING (1 overdue)
 *       - 4 DRYING (1 overdue)
 *       - 4 FOLDING
 *       - 3 READY
 *       - 6 COMPLETED (mixed payment methods: CASH, GCASH, OTHER; completed today & this week)
 *       - 2 CANCELLED (with valid cancel reasons)
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
      process.env[match[1]] = match[2].trim()
    }
  }
}

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16)

const FORWARD_FLOW = ['RECEIVED', 'WASHING', 'DRYING', 'FOLDING', 'READY', 'COMPLETED'] as const

async function main() {
  loadEnv()

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
  const shouldClean = process.argv.includes('--clean') || process.argv.includes('--force')

  if (shouldClean) {
    console.log('Cleaning existing orders and events for clean re-seed...')
    await supabase.from('order_status_events').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }

  // ---------------------------------------------------------------
  // 1. Services (~8 services)
  // ---------------------------------------------------------------
  const services = [
    { name: 'Wash & Fold', description: 'Standard everyday wash and tumble fold', pricing_unit: 'PER_KG', unit_price_cents: 8000, sort_order: 1 },
    { name: 'Wash & Iron', description: 'Wash, dry, and professional hand iron', pricing_unit: 'PER_KG', unit_price_cents: 12000, sort_order: 2 },
    { name: 'Dry Clean', description: 'Delicate garments, suits, and barong tagalog', pricing_unit: 'PER_PIECE', unit_price_cents: 15000, sort_order: 3 },
    { name: 'Iron Only', description: 'Pressing only for clean clothes', pricing_unit: 'PER_PIECE', unit_price_cents: 3000, sort_order: 4 },
    { name: 'Bedding & Linen', description: 'Sheets, pillowcases, and blankets', pricing_unit: 'PER_KG', unit_price_cents: 10000, sort_order: 5 },
    { name: 'Comforter / Duvet', description: 'Bulky comforter and heavy quilts', pricing_unit: 'PER_PIECE', unit_price_cents: 25000, sort_order: 6 },
    { name: 'Curtains & Drapes', description: 'Gentle wash and fold for curtains', pricing_unit: 'PER_KG', unit_price_cents: 14000, sort_order: 7 },
    { name: 'Shoe Cleaning', description: 'Deep clean for sneakers and footwear', pricing_unit: 'PER_PIECE', unit_price_cents: 18000, sort_order: 8 },
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
  // 2. Customers (~12 customers)
  // ---------------------------------------------------------------
  const customers: { full_name: string; phone: string | null; email: string | null; address: string | null }[] = [
    { full_name: 'Walk-in Customer', phone: null, email: null, address: null },
    { full_name: 'Juan Dela Cruz', phone: '09171234567', email: 'juan@example.com', address: 'Quezon City' },
    { full_name: 'Maria Santos', phone: '09179876543', email: 'maria@example.com', address: 'Manila' },
    { full_name: 'Pedro Reyes', phone: '09181112233', email: 'pedro@example.com', address: 'Makati' },
    { full_name: 'Ana Garcia', phone: '09194445566', email: 'ana@example.com', address: 'Pasig' },
    { full_name: 'Carlo Mendoza', phone: '09207778899', email: 'carlo@example.com', address: 'Taguig' },
    { full_name: 'Elena Bautista', phone: '09223334455', email: 'elena@example.com', address: 'Mandaluyong' },
    { full_name: 'Ramon Valenzuela', phone: '09175556677', email: 'ramon@example.com', address: 'San Juan' },
    { full_name: 'Cristina Dizon', phone: '09186667788', email: 'cristina@example.com', address: 'Marikina' },
    { full_name: 'Gabriel Mercado', phone: '09218889900', email: 'gabriel@example.com', address: 'Pasay' },
    { full_name: 'Patricia Lim', phone: '09259990011', email: 'patricia@example.com', address: 'Parañaque' },
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
  // 3. Staff users
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
  // 4. Resolve creator admin
  // ---------------------------------------------------------------
  const { data: adminUser } = await supabase.from('users').select('id, full_name').eq('role', 'ADMIN').limit(1).maybeSingle()
  if (!adminUser) {
    console.error('No ADMIN user found in users table.')
    process.exit(1)
  }
  const creator = adminUser as { id: string; full_name: string }

  // Check if orders exist already (unless --clean was used)
  const { count: existingOrders } = await supabase.from('orders').select('id', { count: 'exact', head: true })
  if (existingOrders && existingOrders > 0 && !shouldClean) {
    console.log(`= ${existingOrders} orders already exist (run with --clean to overwrite). Seed complete.`)
    return
  }

  // ---------------------------------------------------------------
  // 5. Orders Helper
  // ---------------------------------------------------------------
  async function createOrderWithStatus(opts: {
    customerKey: string
    status: 'RECEIVED' | 'WASHING' | 'DRYING' | 'FOLDING' | 'READY' | 'COMPLETED' | 'CANCELLED'
    source?: 'WALK_IN' | 'PORTAL'
    items: { service: string; quantity: number }[]
    assignedToStaff?: number
    dueInDays?: number | null
    paymentMethod?: 'CASH' | 'GCASH' | 'OTHER'
    completedHoursAgo?: number
    notes?: string | null
    cancelReason?: string | null
  }) {
    const customerId = customerIds[opts.customerKey]
    if (!customerId) {
      console.error(`Customer "${opts.customerKey}" not found — skipping order`)
      return
    }

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

    const trackingCode = `LF-${nanoid().slice(0, 8).toUpperCase()}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tracking_code: trackingCode,
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

    // Insert line items
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

    // Advance order along flow
    if (opts.status === 'CANCELLED') {
      await supabase
        .from('orders')
        .update({
          status: 'CANCELLED',
          cancel_reason: opts.cancelReason ?? 'Customer requested cancellation',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      await supabase.from('order_status_events').insert({
        order_id: order.id,
        actor_id: creator.id,
        actor_name: creator.full_name,
        from_status: 'RECEIVED',
        to_status: 'CANCELLED',
        note: opts.cancelReason ?? 'Order cancelled per customer request',
      })
    } else {
      const targetIdx = FORWARD_FLOW.indexOf(opts.status)
      for (let i = 0; i < targetIdx; i++) {
        const from = FORWARD_FLOW[i]
        const to = FORWARD_FLOW[i + 1]

        let updatePayload: Record<string, unknown> = { status: to }

        if (to === 'COMPLETED') {
          const compDate = opts.completedHoursAgo != null
            ? new Date(Date.now() - opts.completedHoursAgo * 3600000).toISOString()
            : new Date().toISOString()

          updatePayload = {
            status: to,
            paid_at: compDate,
            completed_at: compDate,
            payment_method: opts.paymentMethod ?? 'CASH',
          }
        }

        const { error: updErr } = await supabase.from('orders').update(updatePayload).eq('id', order.id)
        if (updErr) console.error(`  → ${to}:`, updErr.message)

        await supabase.from('order_status_events').insert({
          order_id: order.id,
          actor_id: creator.id,
          actor_name: creator.full_name,
          from_status: from,
          to_status: to,
          note: to === 'COMPLETED' ? `Paid via ${opts.paymentMethod ?? 'CASH'}` : undefined,
        })
      }
    }

    console.log(`+ order ${order.order_number} → ${opts.status} (${opts.customerKey})`)
  }

  // ---------------------------------------------------------------
  // 6. ~25 orders across all statuses
  // ---------------------------------------------------------------

  // 4 RECEIVED
  await createOrderWithStatus({ customerKey: 'Juan Dela Cruz', status: 'RECEIVED', items: [{ service: 'Wash & Fold', quantity: 3.5 }], assignedToStaff: 0, dueInDays: 3 })
  await createOrderWithStatus({ customerKey: 'Elena Bautista', status: 'RECEIVED', items: [{ service: 'Bedding & Linen', quantity: 4 }, { service: 'Comforter / Duvet', quantity: 1 }], dueInDays: 2 })
  await createOrderWithStatus({ customerKey: 'Walk-in Customer', status: 'RECEIVED', items: [{ service: 'Iron Only', quantity: 5 }], dueInDays: 4 })
  await createOrderWithStatus({ customerKey: 'Patricia Lim', status: 'RECEIVED', items: [{ service: 'Dry Clean', quantity: 3 }], assignedToStaff: 1, dueInDays: 3 })

  // 4 WASHING (1 Overdue: dueInDays: -2)
  await createOrderWithStatus({ customerKey: 'Maria Santos', status: 'WASHING', items: [{ service: 'Wash & Iron', quantity: 4.2 }], assignedToStaff: 1, dueInDays: 2 })
  await createOrderWithStatus({ customerKey: 'Carlo Mendoza', status: 'WASHING', items: [{ service: 'Curtains & Drapes', quantity: 6 }], assignedToStaff: 0, dueInDays: -2, notes: 'Priority rush order' }) // OVERDUE 1
  await createOrderWithStatus({ customerKey: 'Gabriel Mercado', status: 'WASHING', items: [{ service: 'Wash & Fold', quantity: 5 }, { service: 'Shoe Cleaning', quantity: 1 }], assignedToStaff: 1, dueInDays: 3 })
  await createOrderWithStatus({ customerKey: 'Portal Customer', status: 'WASHING', source: 'PORTAL', items: [{ service: 'Wash & Fold', quantity: 4 }], dueInDays: 2 })

  // 4 DRYING (1 Overdue: dueInDays: -1)
  await createOrderWithStatus({ customerKey: 'Pedro Reyes', status: 'DRYING', items: [{ service: 'Dry Clean', quantity: 2 }, { service: 'Iron Only', quantity: 3 }], assignedToStaff: 0, dueInDays: -1 }) // OVERDUE 2
  await createOrderWithStatus({ customerKey: 'Ramon Valenzuela', status: 'DRYING', items: [{ service: 'Wash & Fold', quantity: 6.5 }], assignedToStaff: 1, dueInDays: 1 })
  await createOrderWithStatus({ customerKey: 'Cristina Dizon', status: 'DRYING', items: [{ service: 'Bedding & Linen', quantity: 5 }], assignedToStaff: 0, dueInDays: 2 })
  await createOrderWithStatus({ customerKey: 'Walk-in Customer', status: 'DRYING', items: [{ service: 'Comforter / Duvet', quantity: 2 }], dueInDays: 2 })

  // 4 FOLDING
  await createOrderWithStatus({ customerKey: 'Ana Garcia', status: 'FOLDING', items: [{ service: 'Wash & Fold', quantity: 5.5 }], assignedToStaff: 1, dueInDays: 1 })
  await createOrderWithStatus({ customerKey: 'Juan Dela Cruz', status: 'FOLDING', items: [{ service: 'Wash & Iron', quantity: 3.2 }], assignedToStaff: 0, dueInDays: 1 })
  await createOrderWithStatus({ customerKey: 'Elena Bautista', status: 'FOLDING', items: [{ service: 'Iron Only', quantity: 8 }], assignedToStaff: 1, dueInDays: 2 })
  await createOrderWithStatus({ customerKey: 'Maria Santos', status: 'FOLDING', items: [{ service: 'Wash & Fold', quantity: 4 }], assignedToStaff: 0, dueInDays: 1 })

  // 3 READY (for counter pickup & payment completion demo)
  await createOrderWithStatus({ customerKey: 'Juan Dela Cruz', status: 'READY', items: [{ service: 'Wash & Fold', quantity: 4 }, { service: 'Iron Only', quantity: 2 }], assignedToStaff: 0, dueInDays: 1, notes: 'Folded in separate bags' })
  await createOrderWithStatus({ customerKey: 'Portal Customer', status: 'READY', source: 'PORTAL', items: [{ service: 'Wash & Iron', quantity: 3 }, { service: 'Shoe Cleaning', quantity: 1 }], dueInDays: 1 })
  await createOrderWithStatus({ customerKey: 'Patricia Lim', status: 'READY', items: [{ service: 'Dry Clean', quantity: 2 }, { service: 'Wash & Fold', quantity: 3 }], assignedToStaff: 1, dueInDays: 2 })

  // 6 COMPLETED (mixed payment methods: CASH, GCASH, OTHER; completed today & earlier this week)
  await createOrderWithStatus({ customerKey: 'Maria Santos', status: 'COMPLETED', items: [{ service: 'Wash & Iron', quantity: 3.5 }], assignedToStaff: 1, paymentMethod: 'CASH', completedHoursAgo: 2 }) // Today
  await createOrderWithStatus({ customerKey: 'Pedro Reyes', status: 'COMPLETED', items: [{ service: 'Dry Clean', quantity: 4 }], assignedToStaff: 0, paymentMethod: 'GCASH', completedHoursAgo: 4 }) // Today
  await createOrderWithStatus({ customerKey: 'Carlo Mendoza', status: 'COMPLETED', items: [{ service: 'Bedding & Linen', quantity: 5 }], assignedToStaff: 1, paymentMethod: 'OTHER', completedHoursAgo: 6 }) // Today
  await createOrderWithStatus({ customerKey: 'Gabriel Mercado', status: 'COMPLETED', items: [{ service: 'Wash & Fold', quantity: 7 }], assignedToStaff: 0, paymentMethod: 'GCASH', completedHoursAgo: 48 }) // 2 days ago
  await createOrderWithStatus({ customerKey: 'Cristina Dizon', status: 'COMPLETED', items: [{ service: 'Shoe Cleaning', quantity: 2 }], assignedToStaff: 1, paymentMethod: 'CASH', completedHoursAgo: 72 }) // 3 days ago
  await createOrderWithStatus({ customerKey: 'Portal Customer', status: 'COMPLETED', source: 'PORTAL', items: [{ service: 'Wash & Fold', quantity: 4.5 }], paymentMethod: 'GCASH', completedHoursAgo: 96 }) // 4 days ago

  // 2 CANCELLED (with explicit reasons)
  await createOrderWithStatus({ customerKey: 'Ana Garcia', status: 'CANCELLED', items: [{ service: 'Wash & Fold', quantity: 2.5 }], cancelReason: 'Customer requested cancellation before washing' })
  await createOrderWithStatus({ customerKey: 'Walk-in Customer', status: 'CANCELLED', items: [{ service: 'Iron Only', quantity: 4 }], cancelReason: 'Duplicate order entered by cashier mistake' })

  console.log('Seed successfully completed with realistic shop data!')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
