/**
 * LabadaFlow seed script — Realistic Philippine Laundry Shop Operations
 *
 * Usage:
 *   pnpm seed
 *   pnpm seed --clean
 *
 * Populates:
 *   - 10 comprehensive laundry services (mix of PER_KG and PER_PIECE)
 *   - 22 realistic Filipino customers (with valid 09XX numbers and Manila / Provincial addresses)
 *   - Staff and Admin linking
 *   - 50 realistic orders distributed across the past 14 days:
 *       - 6 RECEIVED
 *       - 6 WASHING (including 2 overdue)
 *       - 6 DRYING (including 1 overdue)
 *       - 5 FOLDING
 *       - 5 READY (awaiting customer collection)
 *       - 20 COMPLETED (mixed CASH, GCASH, OTHER across 14 days to feed analytics)
 *       - 2 CANCELLED
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
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
    }
  }
}

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16)
const FORWARD_FLOW = ['RECEIVED', 'WASHING', 'DRYING', 'FOLDING', 'READY', 'COMPLETED'] as const

async function main() {
  loadEnv()

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
  // 1. Services (~10 services)
  // ---------------------------------------------------------------
  const services = [
    { name: 'Wash & Fold', description: 'Standard everyday wash and tumble fold', pricing_unit: 'PER_KG', unit_price_cents: 8000, sort_order: 1 },
    { name: 'Wash & Iron / Press', description: 'Wash, dry, and professional hand iron', pricing_unit: 'PER_KG', unit_price_cents: 12000, sort_order: 2 },
    { name: 'Dry Clean - Barong & Suit', description: 'Delicate garments, suits, formal wear & Barong Tagalog', pricing_unit: 'PER_PIECE', unit_price_cents: 18000, sort_order: 3 },
    { name: 'Dry Clean - Gown & Formal', description: 'Evening gowns, wedding dresses & silk delicate wear', pricing_unit: 'PER_PIECE', unit_price_cents: 26000, sort_order: 4 },
    { name: 'Ironing / Press Only', description: 'Professional pressing for already cleaned clothes', pricing_unit: 'PER_PIECE', unit_price_cents: 3500, sort_order: 5 },
    { name: 'Bedding, Linens & Blankets', description: 'Bed sheets, pillowcases, and bed covers', pricing_unit: 'PER_KG', unit_price_cents: 10000, sort_order: 6 },
    { name: 'Comforter / Bulky Duvet', description: 'Bulky comforters, thick quilts and winter jackets', pricing_unit: 'PER_PIECE', unit_price_cents: 28000, sort_order: 7 },
    { name: 'Curtains & Heavy Drapes', description: 'Gentle wash and fold for curtains and drapes', pricing_unit: 'PER_KG', unit_price_cents: 15000, sort_order: 8 },
    { name: 'Sneaker & Footwear Care', description: 'Deep shoe cleaning, deodorizing and sole whitening', pricing_unit: 'PER_PIECE', unit_price_cents: 22000, sort_order: 9 },
    { name: 'Express Wash & Fold (4-Hour)', description: 'Same-day priority turnaround wash and fold', pricing_unit: 'PER_KG', unit_price_cents: 14000, sort_order: 10 },
  ]

  const serviceIds: Record<string, string> = {}
  for (const svc of services) {
    const { data: existing } = await supabase.from('services').select('id').eq('name', svc.name).maybeSingle()
    if (existing) {
      serviceIds[svc.name] = existing.id
      await supabase.from('services').update(svc).eq('id', existing.id)
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
  // 2. Customers (22 Filipino Customers)
  // ---------------------------------------------------------------
  const customers: { full_name: string; phone: string | null; email: string | null; address: string | null }[] = [
    { full_name: 'Walk-in Customer', phone: null, email: null, address: null },
    { full_name: 'Juan Dela Cruz', phone: '09171234567', email: 'juan.delacruz@labadaflow.ph', address: 'Diliman, Quezon City' },
    { full_name: 'Maria Clara Santos', phone: '09179876543', email: 'maria.clara@gmail.com', address: 'Ermita, Manila' },
    { full_name: 'Jose Protacio Rizal', phone: '09181112233', email: 'pepe.rizal@gmail.com', address: 'Bel-Air, Makati' },
    { full_name: 'Andres Bonifacio', phone: '09194445566', email: 'supremo.andres@gmail.com', address: 'Tondo, Manila' },
    { full_name: 'Corazon Aquino', phone: '09207778899', email: 'cory.aquino@gmail.com', address: 'Greenhills, San Juan' },
    { full_name: 'Emilio Aguinaldo', phone: '09223334455', email: 'emilio.a@gmail.com', address: 'Kapitolyo, Pasig' },
    { full_name: 'Francisco Balagtas', phone: '09175556677', email: 'f.balagtas@gmail.com', address: 'Concepcion, Marikina' },
    { full_name: 'Gabriela Silang', phone: '09186667788', email: 'gabriela.s@gmail.com', address: 'BGC, Taguig City' },
    { full_name: 'Melchora Aquino', phone: '09218889900', email: 'tandang.sora@gmail.com', address: 'Tandang Sora, Quezon City' },
    { full_name: 'Antonio Luna', phone: '09259990011', email: 'antonio.luna@gmail.com', address: 'San Juan City' },
    { full_name: 'Apolinario Mabini', phone: '09172345678', email: 'a.mabini@gmail.com', address: 'Taft Ave, Pasay City' },
    { full_name: 'Marcelo H. Del Pilar', phone: '09183456789', email: 'plaridel@gmail.com', address: 'Highway Hills, Mandaluyong' },
    { full_name: 'Diego Silang', phone: '09194567890', email: 'diego.silang@gmail.com', address: 'BF Homes, Parañaque' },
    { full_name: 'Teresa Magbanua', phone: '09205678901', email: 'nay.teresa@gmail.com', address: 'Ususan, Taguig' },
    { full_name: 'Trinidad Tecson', phone: '09226789012', email: 'trinidad.t@gmail.com', address: 'San Miguel, Manila' },
    { full_name: 'Gregoria de Jesus', phone: '09177890123', email: 'oryang.dj@gmail.com', address: 'Grace Park, Caloocan' },
    { full_name: 'Vicente Lim', phone: '09188901234', email: 'vicente.lim@gmail.com', address: 'Paco, Manila' },
    { full_name: 'Gliceria Marella', phone: '09199012345', email: 'gliceria.m@gmail.com', address: 'Malate, Manila' },
    { full_name: 'Ramon Magsaysay', phone: '09200123456', email: 'monching.m@gmail.com', address: 'Cubao, Quezon City' },
    { full_name: 'Manuel L. Quezon', phone: '09221234567', email: 'mlq@gmail.com', address: 'New Manila, Quezon City' },
    { full_name: 'Portal Customer', phone: '09170000000', email: 'labada.portal47@gmail.com', address: 'Ortigas Center, Pasig' },
  ]

  const customerIds: Record<string, string> = {}
  for (const c of customers) {
    const query = c.phone
      ? supabase.from('customers').select('id').eq('phone', c.phone).maybeSingle()
      : supabase.from('customers').select('id').eq('full_name', c.full_name).maybeSingle()
    const { data: existing } = await query
    if (existing) {
      customerIds[c.full_name] = existing.id
      await supabase.from('customers').update(c).eq('id', existing.id)
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
  // 3. Admin & Staff users
  // ---------------------------------------------------------------
  const { data: adminUser } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'ADMIN')
    .eq('email', 'lawrence.pitlo@urios.edu.ph')
    .maybeSingle()

  const fallbackAdmin = adminUser || (await supabase.from('users').select('id, full_name').eq('role', 'ADMIN').limit(1).single()).data
  if (!fallbackAdmin) {
    console.error('No ADMIN user found.')
    process.exit(1)
  }
  const creator = fallbackAdmin as { id: string; full_name: string }

  const { data: staffMembers } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'STAFF')

  const staffList = staffMembers && staffMembers.length > 0 ? staffMembers : [creator]

  // Check if orders already seeded
  const { count: existingOrders } = await supabase.from('orders').select('id', { count: 'exact', head: true })
  if (existingOrders && existingOrders > 0 && !shouldClean) {
    console.log(`= ${existingOrders} orders already exist (run with --clean to overwrite). Seed complete.`)
    return
  }

  // ---------------------------------------------------------------
  // 4. Order Creation Helper
  // ---------------------------------------------------------------
  async function createOrderWithStatus(opts: {
    customerKey: string
    status: 'RECEIVED' | 'WASHING' | 'DRYING' | 'FOLDING' | 'READY' | 'COMPLETED' | 'CANCELLED'
    source?: 'WALK_IN' | 'PORTAL'
    items: { service: string; quantity: number }[]
    assignedStaffIndex?: number
    dueInDays?: number | null
    paymentMethod?: 'CASH' | 'GCASH' | 'OTHER'
    createdDaysAgo?: number
    completedHoursAgo?: number
    notes?: string | null
    cancelReason?: string | null
  }) {
    const customerId = customerIds[opts.customerKey]
    if (!customerId) {
      console.error(`Customer "${opts.customerKey}" not found`)
      return
    }

    const orderItems = opts.items.map(i => {
      const svc = services.find(s => s.name === i.service) || services[0]
      const svcId = serviceIds[i.service] || Object.values(serviceIds)[0]
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

    const createdDays = opts.createdDaysAgo ?? (opts.completedHoursAgo ? Math.ceil(opts.completedHoursAgo / 24) : 0)
    const createdAtDate = new Date(Date.now() - createdDays * 86400000 - Math.floor(Math.random() * 3600000))
    const createdAt = createdAtDate.toISOString()

    const dueAt = opts.dueInDays != null
      ? new Date(Date.now() + opts.dueInDays * 86400000).toISOString()
      : new Date(createdAtDate.getTime() + 2 * 86400000).toISOString()

    const trackingCode = `LF-${nanoid().slice(0, 8).toUpperCase()}`
    const assignedStaff = opts.assignedStaffIndex != null ? staffList[opts.assignedStaffIndex % staffList.length].id : null

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tracking_code: trackingCode,
        customer_id: customerId,
        status: 'RECEIVED',
        source: opts.source ?? 'WALK_IN',
        assigned_to: assignedStaff,
        created_by: creator.id,
        total_cents: totalCents,
        received_at: createdAt,
        created_at: createdAt,
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
    await supabase.from('order_items').insert(orderItems.map(i => ({ ...i, order_id: order.id })))

    // Initial event
    await supabase.from('order_status_events').insert({
      order_id: order.id,
      actor_id: creator.id,
      actor_name: creator.full_name,
      from_status: null,
      to_status: 'RECEIVED',
      created_at: createdAt,
    })

    if (opts.status === 'CANCELLED') {
      const cancelDate = new Date(createdAtDate.getTime() + 1800000).toISOString()
      await supabase
        .from('orders')
        .update({
          status: 'CANCELLED',
          cancel_reason: opts.cancelReason ?? 'Customer requested cancellation',
          cancelled_at: cancelDate,
          updated_at: cancelDate,
        })
        .eq('id', order.id)

      await supabase.from('order_status_events').insert({
        order_id: order.id,
        actor_id: creator.id,
        actor_name: creator.full_name,
        from_status: 'RECEIVED',
        to_status: 'CANCELLED',
        note: opts.cancelReason ?? 'Order cancelled per customer request',
        created_at: cancelDate,
      })
    } else {
      const targetIdx = FORWARD_FLOW.indexOf(opts.status)
      for (let i = 0; i < targetIdx; i++) {
        const from = FORWARD_FLOW[i]
        const to = FORWARD_FLOW[i + 1]

        let stepDate: Date
        if (to === 'COMPLETED' && opts.completedHoursAgo != null) {
          stepDate = new Date(Date.now() - opts.completedHoursAgo * 3600000)
        } else {
          stepDate = new Date(createdAtDate.getTime() + (i + 1) * 3600000)
        }

        let updatePayload: Record<string, unknown> = {
          status: to,
          updated_at: stepDate.toISOString(),
        }

        if (to === 'COMPLETED') {
          updatePayload = {
            ...updatePayload,
            paid_at: stepDate.toISOString(),
            completed_at: stepDate.toISOString(),
            payment_method: opts.paymentMethod ?? 'CASH',
          }
        }

        await supabase.from('orders').update(updatePayload).eq('id', order.id)

        await supabase.from('order_status_events').insert({
          order_id: order.id,
          actor_id: creator.id,
          actor_name: creator.full_name,
          from_status: from,
          to_status: to,
          note: to === 'COMPLETED' ? `Settled via ${opts.paymentMethod ?? 'CASH'}` : undefined,
          created_at: stepDate.toISOString(),
        })
      }
    }

    console.log(`+ order ${order.order_number} → ${opts.status} (${opts.customerKey})`)
  }

  console.log('\n--- Seeding 50 Realistic Laundry Orders ---')

  // ---------------------------------------------------------------
  // 6 RECEIVED (Awaiting processing)
  // ---------------------------------------------------------------
  await createOrderWithStatus({ customerKey: 'Juan Dela Cruz', status: 'RECEIVED', items: [{ service: 'Wash & Fold', quantity: 5.5 }], assignedStaffIndex: 0, dueInDays: 3, createdDaysAgo: 0 })
  await createOrderWithStatus({ customerKey: 'Maria Clara Santos', status: 'RECEIVED', items: [{ service: 'Wash & Iron / Press', quantity: 4.2 }], dueInDays: 2, createdDaysAgo: 0 })
  await createOrderWithStatus({ customerKey: 'Jose Protacio Rizal', status: 'RECEIVED', items: [{ service: 'Dry Clean - Barong & Suit', quantity: 2 }], assignedStaffIndex: 1, dueInDays: 4, createdDaysAgo: 0 })
  await createOrderWithStatus({ customerKey: 'Corazon Aquino', status: 'RECEIVED', items: [{ service: 'Bedding, Linens & Blankets', quantity: 6 }], dueInDays: 2, createdDaysAgo: 1 })
  await createOrderWithStatus({ customerKey: 'Walk-in Customer', status: 'RECEIVED', items: [{ service: 'Ironing / Press Only', quantity: 6 }], dueInDays: 3, createdDaysAgo: 0 })
  await createOrderWithStatus({ customerKey: 'Portal Customer', status: 'RECEIVED', source: 'PORTAL', items: [{ service: 'Sneaker & Footwear Care', quantity: 2 }], dueInDays: 2, createdDaysAgo: 0 })

  // ---------------------------------------------------------------
  // 6 WASHING (In wash cycle - 2 Overdue)
  // ---------------------------------------------------------------
  await createOrderWithStatus({ customerKey: 'Andres Bonifacio', status: 'WASHING', items: [{ service: 'Express Wash & Fold (4-Hour)', quantity: 4.5 }], assignedStaffIndex: 0, dueInDays: 1, createdDaysAgo: 0 })
  await createOrderWithStatus({ customerKey: 'Emilio Aguinaldo', status: 'WASHING', items: [{ service: 'Curtains & Heavy Drapes', quantity: 7.0 }], assignedStaffIndex: 1, dueInDays: -2, createdDaysAgo: 3, notes: 'URGENT: Rush curtains for event' }) // OVERDUE 1
  await createOrderWithStatus({ customerKey: 'Francisco Balagtas', status: 'WASHING', items: [{ service: 'Wash & Fold', quantity: 8.0 }], assignedStaffIndex: 0, dueInDays: 2, createdDaysAgo: 1 })
  await createOrderWithStatus({ customerKey: 'Gabriela Silang', status: 'WASHING', items: [{ service: 'Comforter / Bulky Duvet', quantity: 2 }], assignedStaffIndex: 1, dueInDays: -1, createdDaysAgo: 2, notes: 'Bulky king-size comforters' }) // OVERDUE 2
  await createOrderWithStatus({ customerKey: 'Melchora Aquino', status: 'WASHING', items: [{ service: 'Wash & Iron / Press', quantity: 5.0 }], assignedStaffIndex: 0, dueInDays: 2, createdDaysAgo: 1 })
  await createOrderWithStatus({ customerKey: 'Portal Customer', status: 'WASHING', source: 'PORTAL', items: [{ service: 'Wash & Fold', quantity: 3.5 }], dueInDays: 2, createdDaysAgo: 1 })

  // ---------------------------------------------------------------
  // 6 DRYING (In dryers - 1 Overdue)
  // ---------------------------------------------------------------
  await createOrderWithStatus({ customerKey: 'Antonio Luna', status: 'DRYING', items: [{ service: 'Dry Clean - Barong & Suit', quantity: 3 }, { service: 'Ironing / Press Only', quantity: 4 }], assignedStaffIndex: 1, dueInDays: -1, createdDaysAgo: 3 }) // OVERDUE 3
  await createOrderWithStatus({ customerKey: 'Apolinario Mabini', status: 'DRYING', items: [{ service: 'Wash & Fold', quantity: 6.2 }], assignedStaffIndex: 0, dueInDays: 1, createdDaysAgo: 1 })
  await createOrderWithStatus({ customerKey: 'Marcelo H. Del Pilar', status: 'DRYING', items: [{ service: 'Bedding, Linens & Blankets', quantity: 5.0 }], assignedStaffIndex: 1, dueInDays: 2, createdDaysAgo: 1 })
  await createOrderWithStatus({ customerKey: 'Diego Silang', status: 'DRYING', items: [{ service: 'Wash & Iron / Press', quantity: 4.0 }], assignedStaffIndex: 0, dueInDays: 1, createdDaysAgo: 1 })
  await createOrderWithStatus({ customerKey: 'Teresa Magbanua', status: 'DRYING', items: [{ service: 'Sneaker & Footwear Care', quantity: 1 }, { service: 'Wash & Fold', quantity: 4.0 }], assignedStaffIndex: 1, dueInDays: 2, createdDaysAgo: 1 })
  await createOrderWithStatus({ customerKey: 'Walk-in Customer', status: 'DRYING', items: [{ service: 'Comforter / Bulky Duvet', quantity: 1 }], dueInDays: 1, createdDaysAgo: 1 })

  // ---------------------------------------------------------------
  // 5 FOLDING (Folding & Quality Check)
  // ---------------------------------------------------------------
  await createOrderWithStatus({ customerKey: 'Trinidad Tecson', status: 'FOLDING', items: [{ service: 'Wash & Fold', quantity: 7.5 }], assignedStaffIndex: 0, dueInDays: 1, createdDaysAgo: 2 })
  await createOrderWithStatus({ customerKey: 'Gregoria de Jesus', status: 'FOLDING', items: [{ service: 'Ironing / Press Only', quantity: 10 }], assignedStaffIndex: 1, dueInDays: 1, createdDaysAgo: 2 })
  await createOrderWithStatus({ customerKey: 'Vicente Lim', status: 'FOLDING', items: [{ service: 'Wash & Iron / Press', quantity: 3.8 }], assignedStaffIndex: 0, dueInDays: 1, createdDaysAgo: 2 })
  await createOrderWithStatus({ customerKey: 'Gliceria Marella', status: 'FOLDING', items: [{ service: 'Bedding, Linens & Blankets', quantity: 4.5 }], assignedStaffIndex: 1, dueInDays: 2, createdDaysAgo: 2 })
  await createOrderWithStatus({ customerKey: 'Ramon Magsaysay', status: 'FOLDING', items: [{ service: 'Wash & Fold', quantity: 6.0 }], assignedStaffIndex: 0, dueInDays: 1, createdDaysAgo: 2 })

  // ---------------------------------------------------------------
  // 5 READY (Awaiting Pickup at counter)
  // ---------------------------------------------------------------
  await createOrderWithStatus({ customerKey: 'Manuel L. Quezon', status: 'READY', items: [{ service: 'Dry Clean - Barong & Suit', quantity: 2 }, { service: 'Wash & Iron / Press', quantity: 4.0 }], assignedStaffIndex: 0, dueInDays: 1, createdDaysAgo: 3, notes: 'Folded in separate premium plastic garment bags' })
  await createOrderWithStatus({ customerKey: 'Portal Customer', status: 'READY', source: 'PORTAL', items: [{ service: 'Sneaker & Footwear Care', quantity: 2 }, { service: 'Wash & Fold', quantity: 3.0 }], dueInDays: 1, createdDaysAgo: 3 })
  await createOrderWithStatus({ customerKey: 'Juan Dela Cruz', status: 'READY', items: [{ service: 'Express Wash & Fold (4-Hour)', quantity: 5.0 }], assignedStaffIndex: 1, dueInDays: 1, createdDaysAgo: 2 })
  await createOrderWithStatus({ customerKey: 'Maria Clara Santos', status: 'READY', items: [{ service: 'Dry Clean - Gown & Formal', quantity: 1 }], assignedStaffIndex: 0, dueInDays: 2, createdDaysAgo: 3 })
  await createOrderWithStatus({ customerKey: 'Walk-in Customer', status: 'READY', items: [{ service: 'Ironing / Press Only', quantity: 5 }], dueInDays: 1, createdDaysAgo: 2 })

  // ---------------------------------------------------------------
  // 20 COMPLETED (Spread across the past 14 days, with CASH, GCASH, OTHER)
  // ---------------------------------------------------------------
  // Today (0-6 hours ago)
  await createOrderWithStatus({ customerKey: 'Corazon Aquino', status: 'COMPLETED', items: [{ service: 'Wash & Fold', quantity: 6.5 }], paymentMethod: 'CASH', completedHoursAgo: 2 })
  await createOrderWithStatus({ customerKey: 'Jose Protacio Rizal', status: 'COMPLETED', items: [{ service: 'Dry Clean - Barong & Suit', quantity: 3 }], paymentMethod: 'GCASH', completedHoursAgo: 4 })
  await createOrderWithStatus({ customerKey: 'Andres Bonifacio', status: 'COMPLETED', items: [{ service: 'Wash & Iron / Press', quantity: 4.0 }], paymentMethod: 'CASH', completedHoursAgo: 6 })

  // 1 day ago (24-30 hrs)
  await createOrderWithStatus({ customerKey: 'Gabriela Silang', status: 'COMPLETED', items: [{ service: 'Bedding, Linens & Blankets', quantity: 7.0 }], paymentMethod: 'GCASH', completedHoursAgo: 26 })
  await createOrderWithStatus({ customerKey: 'Emilio Aguinaldo', status: 'COMPLETED', items: [{ service: 'Comforter / Bulky Duvet', quantity: 2 }], paymentMethod: 'CASH', completedHoursAgo: 28 })

  // 2 days ago (48-54 hrs)
  await createOrderWithStatus({ customerKey: 'Melchora Aquino', status: 'COMPLETED', items: [{ service: 'Sneaker & Footwear Care', quantity: 2 }], paymentMethod: 'GCASH', completedHoursAgo: 50 })
  await createOrderWithStatus({ customerKey: 'Antonio Luna', status: 'COMPLETED', items: [{ service: 'Wash & Fold', quantity: 8.5 }], paymentMethod: 'OTHER', completedHoursAgo: 52 })

  // 3 days ago (72-78 hrs)
  await createOrderWithStatus({ customerKey: 'Francisco Balagtas', status: 'COMPLETED', items: [{ service: 'Dry Clean - Gown & Formal', quantity: 1 }, { service: 'Ironing / Press Only', quantity: 4 }], paymentMethod: 'CASH', completedHoursAgo: 74 })
  await createOrderWithStatus({ customerKey: 'Portal Customer', status: 'COMPLETED', source: 'PORTAL', items: [{ service: 'Wash & Fold', quantity: 5.0 }], paymentMethod: 'GCASH', completedHoursAgo: 76 })

  // 4 days ago (96-102 hrs)
  await createOrderWithStatus({ customerKey: 'Apolinario Mabini', status: 'COMPLETED', items: [{ service: 'Wash & Iron / Press', quantity: 5.5 }], paymentMethod: 'CASH', completedHoursAgo: 98 })
  await createOrderWithStatus({ customerKey: 'Marcelo H. Del Pilar', status: 'COMPLETED', items: [{ service: 'Curtains & Heavy Drapes', quantity: 8.0 }], paymentMethod: 'GCASH', completedHoursAgo: 100 })

  // 5 days ago (120-126 hrs)
  await createOrderWithStatus({ customerKey: 'Diego Silang', status: 'COMPLETED', items: [{ service: 'Wash & Fold', quantity: 6.0 }], paymentMethod: 'CASH', completedHoursAgo: 122 })
  await createOrderWithStatus({ customerKey: 'Teresa Magbanua', status: 'COMPLETED', items: [{ service: 'Comforter / Bulky Duvet', quantity: 1 }, { service: 'Sneaker & Footwear Care', quantity: 1 }], paymentMethod: 'OTHER', completedHoursAgo: 124 })

  // 6 days ago (144-150 hrs)
  await createOrderWithStatus({ customerKey: 'Trinidad Tecson', status: 'COMPLETED', items: [{ service: 'Bedding, Linens & Blankets', quantity: 5.5 }], paymentMethod: 'GCASH', completedHoursAgo: 146 })
  await createOrderWithStatus({ customerKey: 'Gregoria de Jesus', status: 'COMPLETED', items: [{ service: 'Ironing / Press Only', quantity: 8 }], paymentMethod: 'CASH', completedHoursAgo: 148 })

  // 7-13 days ago (historical for 14-day reports chart)
  await createOrderWithStatus({ customerKey: 'Vicente Lim', status: 'COMPLETED', items: [{ service: 'Wash & Fold', quantity: 9.0 }], paymentMethod: 'CASH', completedHoursAgo: 170 }) // 7 days
  await createOrderWithStatus({ customerKey: 'Gliceria Marella', status: 'COMPLETED', items: [{ service: 'Dry Clean - Barong & Suit', quantity: 2 }], paymentMethod: 'GCASH', completedHoursAgo: 195 }) // 8 days
  await createOrderWithStatus({ customerKey: 'Ramon Magsaysay', status: 'COMPLETED', items: [{ service: 'Wash & Iron / Press', quantity: 6.0 }], paymentMethod: 'CASH', completedHoursAgo: 220 }) // 9 days
  await createOrderWithStatus({ customerKey: 'Manuel L. Quezon', status: 'COMPLETED', items: [{ service: 'Express Wash & Fold (4-Hour)', quantity: 7.0 }], paymentMethod: 'GCASH', completedHoursAgo: 245 }) // 10 days
  await createOrderWithStatus({ customerKey: 'Walk-in Customer', status: 'COMPLETED', items: [{ service: 'Wash & Fold', quantity: 4.5 }], paymentMethod: 'CASH', completedHoursAgo: 290 }) // 12 days

  // ---------------------------------------------------------------
  // 2 CANCELLED (with authentic business reasons)
  // ---------------------------------------------------------------
  await createOrderWithStatus({
    customerKey: 'Juan Dela Cruz',
    status: 'CANCELLED',
    items: [{ service: 'Wash & Fold', quantity: 3.5 }],
    cancelReason: 'Customer requested order cancellation before washing started due to travel plans change',
    createdDaysAgo: 1,
  })

  await createOrderWithStatus({
    customerKey: 'Walk-in Customer',
    status: 'CANCELLED',
    items: [{ service: 'Ironing / Press Only', quantity: 4 }],
    cancelReason: 'Duplicate entry created at counter by staff mistake',
    createdDaysAgo: 2,
  })

  console.log('\n=== Seed Completed Successfully! 50 orders seeded with complete history. ===')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
