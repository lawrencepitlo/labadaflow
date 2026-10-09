'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActorByClerkId } from '@/lib/auth'
import { generateTrackingCode } from '@/lib/tracking'
import { calculateLineTotal, sumCentavos } from '@/lib/money'
import { validateTransition, type OrderStatus } from '@/lib/order-machine'
import {
  CreateOrderSchema,
  AdvanceStatusSchema,
  CancelOrderSchema,
  CompleteOrderSchema,
  UpdateOrderItemsSchema,
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

  const parsed = CreateOrderSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input', details: parsed.error.issues }

  const supabase = await createClient()

  // Fetch service data to snapshot prices
  const serviceIds = parsed.data.items.map(i => i.service_id)
  const { data: services } = await supabase
    .from('services')
    .select('id, name, pricing_unit, unit_price_cents, is_active')
    .in('id', serviceIds)

  if (!services || services.length !== serviceIds.length) {
    return { error: 'One or more services not found' }
  }

  // Check all services are active
  const inactiveService = services.find(s => !s.is_active)
  if (inactiveService) {
    return { error: `Service "${inactiveService.name}" is no longer active` }
  }

  // Verify assignee exists and is an active team member (ADMIN/STAFF only —
  // never a customer record or a dangling UUID).
  if (parsed.data.assigned_to) {
    const { data: assignee } = await supabase
      .from('users')
      .select('id, role, is_active')
      .eq('id', parsed.data.assigned_to)
      .single()

    if (!assignee || !assignee.is_active || !['ADMIN', 'STAFF'].includes(assignee.role)) {
      return { error: 'Assigned staff member not found' }
    }
  }

  // Build order items with snapshotted prices
  const orderItems = parsed.data.items.map(item => {
    const service = services.find(s => s.id === item.service_id)!
    const lineTotal = calculateLineTotal(service.unit_price_cents, item.quantity)
    return {
      service_id: service.id,
      service_name: service.name,
      pricing_unit: service.pricing_unit,
      unit_price_cents: service.unit_price_cents,
      quantity: item.quantity,
      line_total_cents: lineTotal,
    }
  })

  const totalCents = sumCentavos(orderItems.map(i => i.line_total_cents))
  const trackingCode = generateTrackingCode()

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      tracking_code: trackingCode,
      customer_id: parsed.data.customer_id,
      status: 'RECEIVED',
      source: parsed.data.source || 'WALK_IN',
      assigned_to: parsed.data.assigned_to || null,
      created_by: actor.id,
      total_cents: totalCents,
      due_at: parsed.data.due_at || null,
      notes: parsed.data.notes || null,
    })
    .select('id, order_number')
    .single()

  if (orderError || !order) return { error: orderError?.message || 'Failed to create order' }

  // Insert order items
  const itemsWithOrderId = orderItems.map(item => ({
    ...item,
    order_id: order.id,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsWithOrderId)

  if (itemsError) return { error: itemsError.message }

  // Insert initial status event (NULL → RECEIVED)
  await supabase
    .from('order_status_events')
    .insert({
      order_id: order.id,
      actor_id: actor.id,
      actor_name: actor.full_name,
      from_status: null,
      to_status: 'RECEIVED',
    })

  revalidatePath('/orders')
  revalidatePath('/dashboard')
  return { success: true, id: order.id, order_number: order.order_number }
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

  // Get current order status from DB (source of truth)
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', parsed.data.order_id)
    .single()

  if (!order) return { error: 'Order not found' }

  // Validate state machine
  const transition = validateTransition(order.status as OrderStatus, parsed.data.to_status as OrderStatus)
  if (!transition.valid) return { error: transition.reason }

  // Business rule: backward transitions require note
  if (transition.isBackward && !parsed.data.note?.trim()) {
    return { error: 'Note required for backward transition' }
  }

  // Use RPC for atomic transition
  const { error } = await supabase.rpc('advance_order_status', {
    p_order_id: parsed.data.order_id,
    p_actor_id: actor.id,
    p_actor_name: actor.full_name,
    p_from_status: order.status,
    p_to_status: parsed.data.to_status,
    p_note: parsed.data.note ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/orders/${parsed.data.order_id}`)
  revalidatePath('/orders')
  revalidatePath('/dashboard')
  return { success: true }
}

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

  // Get current status
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', parsed.data.order_id)
    .single()

  if (!order) return { error: 'Order not found' }

  // Validate transition
  const transition = validateTransition(order.status as OrderStatus, 'CANCELLED')
  if (!transition.valid) return { error: transition.reason }

  // Use RPC for atomic cancellation
  const { error } = await supabase.rpc('cancel_order', {
    p_order_id: parsed.data.order_id,
    p_actor_id: actor.id,
    p_actor_name: actor.full_name,
    p_cancel_reason: parsed.data.cancel_reason,
    p_from_status: order.status,
  })

  if (error) return { error: error.message }

  revalidatePath(`/orders/${parsed.data.order_id}`)
  revalidatePath('/orders')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function completeOrder(input: { order_id: string }) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const parsed = CompleteOrderSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return { error: 'Forbidden' }

  const supabase = await createClient()

  // Completion is only valid from READY. The complete_order RPC also enforces
  // this (status = 'READY' guard); this pre-check gives a clean error and keeps
  // the rule visible at the server boundary.
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', parsed.data.order_id)
    .single()

  if (!order) return { error: 'Order not found' }
  if (order.status !== 'READY') return { error: 'Only READY orders can be completed' }

  // Use RPC for atomic completion (sets COMPLETED + paid_at + completed_at + status event)
  const { error } = await supabase.rpc('complete_order', {
    p_order_id: parsed.data.order_id,
    p_actor_id: actor.id,
    p_actor_name: actor.full_name,
  })

  if (error) return { error: error.message }

  revalidatePath(`/orders/${parsed.data.order_id}`)
  revalidatePath('/orders')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateOrderItems(input: {
  order_id: string
  items: { service_id: string; quantity: number }[]
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthenticated' }

  const parsed = UpdateOrderItemsSchema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid input' }

  const actor = await getActorByClerkId(userId)
  if (!actor || !['ADMIN', 'STAFF'].includes(actor.role)) return { error: 'Forbidden' }

  const supabase = await createClient()

  // Verify order is in RECEIVED status (items only editable in RECEIVED)
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', parsed.data.order_id)
    .single()

  if (!order) return { error: 'Order not found' }
  if (order.status !== 'RECEIVED') return { error: 'Items can only be edited while order is RECEIVED' }

  // Fetch service data
  const serviceIds = parsed.data.items.map(i => i.service_id)
  const { data: services } = await supabase
    .from('services')
    .select('id, name, pricing_unit, unit_price_cents, is_active')
    .in('id', serviceIds)

  if (!services || services.length !== serviceIds.length) {
    return { error: 'One or more services not found' }
  }

  // Build new items
  const orderItems = parsed.data.items.map(item => {
    const service = services.find(s => s.id === item.service_id)!
    const lineTotal = calculateLineTotal(service.unit_price_cents, item.quantity)
    return {
      order_id: parsed.data.order_id,
      service_id: service.id,
      service_name: service.name,
      pricing_unit: service.pricing_unit,
      unit_price_cents: service.unit_price_cents,
      quantity: item.quantity,
      line_total_cents: lineTotal,
    }
  })

  const totalCents = sumCentavos(orderItems.map(i => i.line_total_cents))

  // Delete existing items and insert new ones
  await supabase
    .from('order_items')
    .delete()
    .eq('order_id', parsed.data.order_id)

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) return { error: itemsError.message }

  // Update total
  const { error: totalError } = await supabase
    .from('orders')
    .update({ total_cents: totalCents, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.order_id)

  if (totalError) return { error: totalError.message }

  revalidatePath(`/orders/${parsed.data.order_id}`)
  revalidatePath('/orders')
  return { success: true }
}
