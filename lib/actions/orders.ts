'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActorByClerkId } from '@/lib/auth'
import { generateTrackingCode } from '@/lib/tracking'
import { validateTransition, type OrderStatus } from '@/lib/order-machine'
import {
  CreateOrderSchema,
  AdvanceStatusSchema,
  CancelOrderSchema,
  CompleteOrderSchema,
  ReopenOrderSchema,
  UpdateOrderItemsSchema,
  mergeServiceItems,
} from '@/lib/validation/order'

export async function createOrder(input: {
  customer_id: string
  source?: 'WALK_IN' | 'PORTAL'
  assigned_to?: string | null
  due_at?: string | null
  notes?: string | null
  items: { service_id: string; quantity: number }[]
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return { error: 'Forbidden' }

  const mergedInput = {
    ...input,
    items: mergeServiceItems(input.items || []),
  }

  const parsed = CreateOrderSchema.safeParse(mergedInput)
  if (!parsed.success) return { error: 'Invalid input', details: parsed.error.issues }

  const supabase = await createClient()

  // Verify assignee if provided
  if (parsed.data.assigned_to) {
    const { data: assignee, error: assigneeErr } = await supabase
      .from('users')
      .select('id, role, is_active')
      .eq('id', parsed.data.assigned_to)
      .maybeSingle()

    if (assigneeErr || !assignee || !assignee.is_active || !['ADMIN', 'STAFF'].includes(assignee.role)) {
      return { error: 'Assigned staff member not found or inactive' }
    }
  }

  const trackingCode = generateTrackingCode()

  // Call atomic create_order RPC (price snapshot, validation, items, and status event in one tx)
  const { data, error } = await supabase.rpc('create_order', {
    p_customer_id: parsed.data.customer_id,
    p_source: parsed.data.source || 'WALK_IN',
    p_assigned_to: parsed.data.assigned_to || null,
    p_due_at: parsed.data.due_at || null,
    p_notes: parsed.data.notes || null,
    p_created_by: actor.id,
    p_actor_name: actor.full_name,
    p_tracking_code: trackingCode,
    p_items: parsed.data.items,
  })

  if (error || !data) {
    return { error: error?.message || 'Failed to create order' }
  }

  revalidatePath('/orders')
  revalidatePath('/board')
  revalidatePath('/dashboard')

  const res = data as { id: string; order_number: string; tracking_code: string; total_cents: number }
  return { success: true, id: res.id, order_number: res.order_number }
}

export async function createPortalOrder(input: {
  phone?: string | null
  notes?: string | null
  due_at?: string | null
  items: { service_id: string; quantity: number }[]
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const actor = await getActorByClerkId(userId)
  if (!actor || !actor.is_active) return { error: 'Account not active or not found' }

  const mergedItems = mergeServiceItems(input.items || [])
  if (!mergedItems || mergedItems.length === 0) {
    return { error: 'Please select at least one service item' }
  }

  for (const item of mergedItems) {
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      return { error: 'Quantities must be greater than zero' }
    }
  }

  const supabase = await createClient()

  // Find or automatically provision customer record
  let customerId: string | null = null
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, phone')
    .or(`clerk_user_id.eq.${userId},email.eq.${actor.email}`)
    .maybeSingle()

  if (existingCustomer) {
    customerId = existingCustomer.id
    const updatePayload: { clerk_user_id: string; updated_at: string; phone?: string } = {
      clerk_user_id: userId,
      updated_at: new Date().toISOString(),
    }
    if (input.phone && !existingCustomer.phone) {
      updatePayload.phone = input.phone
    }
    await supabase.from('customers').update(updatePayload).eq('id', customerId)
  } else {
    const { data: newCustomer, error: custErr } = await supabase
      .from('customers')
      .insert({
        clerk_user_id: userId,
        full_name: actor.full_name || 'Customer',
        email: actor.email,
        phone: input.phone || null,
      })
      .select('id')
      .single()

    if (custErr || !newCustomer) {
      return { error: custErr?.message || 'Failed to initialize customer account for booking' }
    }
    customerId = newCustomer.id
  }

  const trackingCode = generateTrackingCode()

  // Atomic creation via create_order RPC
  const { data, error } = await supabase.rpc('create_order', {
    p_customer_id: customerId,
    p_source: 'PORTAL',
    p_assigned_to: null,
    p_due_at: input.due_at || null,
    p_notes: input.notes ? `[Online Order] ${input.notes}` : '[Online Order] Self drop-off',
    p_created_by: actor.id,
    p_actor_name: actor.full_name,
    p_tracking_code: trackingCode,
    p_items: mergedItems,
  })

  if (error || !data) {
    return { error: error?.message || 'Failed to place online order' }
  }

  revalidatePath('/portal')
  revalidatePath('/portal/orders')
  revalidatePath('/orders')
  revalidatePath('/board')
  revalidatePath('/dashboard')

  const res = data as { id: string; order_number: string; tracking_code: string; total_cents: number }
  return { success: true, id: res.id, order_number: res.order_number, tracking_code: trackingCode }
}

export async function advanceOrderStatus(input: {
  order_id: string
  to_status: string
  note?: string
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const parsed = AdvanceStatusSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return { error: 'Forbidden' }

  const supabase = await createClient()

  // Get current order status from DB (source of truth & race check)
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', parsed.data.order_id)
    .single()

  if (orderErr || !order) return { error: 'Order not found' }

  // State machine validation (UI check before calling DB RPC)
  const transition = validateTransition(order.status as OrderStatus, parsed.data.to_status as OrderStatus)
  if (!transition.valid) return { error: transition.reason }

  if (transition.isBackward && !parsed.data.note?.trim()) {
    return { error: 'Note required for backward transition' }
  }

  // Use RPC for atomic transition with DB state machine enforcement
  const { error } = await supabase.rpc('advance_order_status', {
    p_order_id: parsed.data.order_id,
    p_actor_id: actor.id,
    p_actor_name: actor.full_name,
    p_from_status: order.status,
    p_to_status: parsed.data.to_status as DatabaseStatus,
    p_note: parsed.data.note?.trim() || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/orders/${parsed.data.order_id}`)
  revalidatePath('/orders')
  revalidatePath('/board')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function batchAdvanceOrders(
  items: Array<{ order_id: string; to_status: string; payment_method?: 'CASH' | 'GCASH' | 'OTHER' }>
) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return { error: 'Forbidden' }

  const results = await Promise.all(
    items.map(async item => {
      if (item.to_status === 'COMPLETED') {
        return completeOrder({ order_id: item.order_id, payment_method: item.payment_method || 'CASH' })
      }
      return advanceOrderStatus({ order_id: item.order_id, to_status: item.to_status })
    })
  )

  const failures = results.filter(r => r && r.error)
  if (failures.length > 0) {
    return { error: `Failed to advance ${failures.length} order(s): ${failures.map(f => f.error).join('; ')}` }
  }

  revalidatePath('/orders')
  revalidatePath('/board')
  revalidatePath('/dashboard')
  return { success: true }
}

type DatabaseStatus = 'RECEIVED' | 'WASHING' | 'DRYING' | 'FOLDING' | 'READY' | 'COMPLETED' | 'CANCELLED'

export async function cancelOrder(input: {
  order_id: string
  cancel_reason: string
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const parsed = CancelOrderSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return { error: 'Forbidden' }

  const supabase = await createClient()

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', parsed.data.order_id)
    .single()

  if (orderErr || !order) return { error: 'Order not found' }

  const transition = validateTransition(order.status as OrderStatus, 'CANCELLED')
  if (!transition.valid) return { error: transition.reason }

  const { error } = await supabase.rpc('cancel_order', {
    p_order_id: parsed.data.order_id,
    p_actor_id: actor.id,
    p_actor_name: actor.full_name,
    p_cancel_reason: parsed.data.cancel_reason.trim(),
    p_from_status: order.status,
  })

  if (error) return { error: error.message }

  revalidatePath(`/orders/${parsed.data.order_id}`)
  revalidatePath('/orders')
  revalidatePath('/board')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  return { success: true }
}

export async function completeOrder(input: {
  order_id: string
  payment_method: 'CASH' | 'GCASH' | 'OTHER'
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const parsed = CompleteOrderSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input or payment method' }

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return { error: 'Forbidden' }

  const supabase = await createClient()

  // Pre-check READY status
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', parsed.data.order_id)
    .single()

  if (orderErr || !order) return { error: 'Order not found' }
  if (order.status !== 'READY') return { error: 'Only READY orders can be completed' }

  // Use RPC for atomic completion
  const { error } = await supabase.rpc('complete_order', {
    p_order_id: parsed.data.order_id,
    p_actor_id: actor.id,
    p_actor_name: actor.full_name,
    p_payment_method: parsed.data.payment_method,
  })

  if (error) return { error: error.message }

  revalidatePath(`/orders/${parsed.data.order_id}`)
  revalidatePath('/orders')
  revalidatePath('/board')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  return { success: true }
}

export async function reopenOrder(input: {
  order_id: string
  note: string
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const actor = await getActorByClerkId(userId)
  if (!actor || actor.role !== 'ADMIN') return { error: 'Forbidden: Admins only can reopen orders' }

  const parsed = ReopenOrderSchema.safeParse(input)
  if (!parsed.success) return { error: 'Note is required to reopen an order' }

  const supabase = await createClient()

  const { error } = await supabase.rpc('reopen_order', {
    p_order_id: parsed.data.order_id,
    p_actor_id: actor.id,
    p_actor_name: actor.full_name,
    p_note: parsed.data.note.trim(),
  })

  if (error) return { error: error.message }

  revalidatePath(`/orders/${parsed.data.order_id}`)
  revalidatePath('/orders')
  revalidatePath('/board')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
  return { success: true }
}

export async function updateOrderItems(input: {
  order_id: string
  items: { service_id: string; quantity: number }[]
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return { error: 'Forbidden' }

  const mergedInput = {
    ...input,
    items: mergeServiceItems(input.items || []),
  }

  const parsed = UpdateOrderItemsSchema.safeParse(mergedInput)
  if (!parsed.success) return { error: 'Invalid input' }

  const supabase = await createClient()

  // Call atomic update_order_items RPC (locks order row, checks RECEIVED, replaces items, recomputes total)
  const { error } = await supabase.rpc('update_order_items', {
    p_order_id: parsed.data.order_id,
    p_items: parsed.data.items,
  })

  if (error) return { error: error.message }

  revalidatePath(`/orders/${parsed.data.order_id}`)
  revalidatePath('/orders')
  revalidatePath('/board')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function claimOrder(trackingCode: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const code = trackingCode.trim()
  if (!code) return { error: 'Please enter a valid tracking code.' }

  const supabase = await createClient()

  // 1. Find the order by tracking_code
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, order_number, customer_id')
    .eq('tracking_code', code)
    .single()

  if (orderErr || !order) {
    return { error: 'No order found with that tracking code.' }
  }

  // 2. Fetch the order's customer
  const { data: orderCustomer, error: custErr } = await supabase
    .from('customers')
    .select('id, clerk_user_id, full_name, email, phone')
    .eq('id', order.customer_id)
    .single()

  if (custErr || !orderCustomer) {
    return { error: 'Order customer record not found.' }
  }

  // Check if already claimed by another user
  if (orderCustomer.clerk_user_id && orderCustomer.clerk_user_id !== userId) {
    return { error: 'This order is already claimed by another account.' }
  }

  // Check if current user already has a customer record
  const { data: myCustomer } = await supabase
    .from('customers')
    .select('id, clerk_user_id')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (myCustomer) {
    if (myCustomer.id === order.customer_id) {
      return { success: true, orderId: order.id, message: 'This order is already linked to your account.' }
    }
    // Reassign order to current user's customer record
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ customer_id: myCustomer.id })
      .eq('id', order.id)

    if (updateErr) return { error: updateErr.message }
  } else {
    // Current user has no customer record yet.
    // If order customer has no clerk_user_id, link them!
    if (!orderCustomer.clerk_user_id) {
      const { error: linkErr } = await supabase
        .from('customers')
        .update({ clerk_user_id: userId })
        .eq('id', orderCustomer.id)

      if (linkErr) return { error: linkErr.message }
    }
  }

  revalidatePath('/portal/orders')
  revalidatePath(`/portal/orders/${order.id}`)
  return { success: true, orderId: order.id }
}


export async function lookupOrderByCode(rawInput: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return { error: 'Forbidden' }

  let clean = rawInput.trim()
  const urlMatch = clean.match(/\/track\/([A-Za-z0-9-_]+)/)
  if (urlMatch) {
    clean = urlMatch[1]
  }
  clean = clean.replace(/^[#]/, '').trim()

  if (!clean) return { found: false }

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, tracking_code, status, source, total_cents, received_at,
      customer:customers!inner(id, full_name, phone)
    `)
    .or(`tracking_code.eq.${clean},order_number.ilike.%${clean}%`)
    .limit(1)
    .maybeSingle()

  if (!order) {
    return { found: false }
  }

  const cust = Array.isArray(order.customer) ? order.customer[0] : order.customer
  return {
    found: true,
    order: {
      id: order.id,
      order_number: order.order_number,
      tracking_code: order.tracking_code,
      status: order.status as OrderStatus,
      source: order.source as 'WALK_IN' | 'PORTAL',
      total_cents: order.total_cents,
      received_at: order.received_at,
      customer_name: cust?.full_name ?? 'Customer',
      customer_phone: cust?.phone ?? null,
    },
  }
}
