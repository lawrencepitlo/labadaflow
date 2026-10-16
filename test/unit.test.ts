import test from 'node:test'
import assert from 'node:assert/strict'
import { validateTransition, type OrderStatus } from '../lib/order-machine'
import { mergeServiceItems } from '../lib/validation/order'

test('State Machine: valid forward transitions', () => {
  const forwardSteps: Array<[OrderStatus, OrderStatus]> = [
    ['RECEIVED', 'WASHING'],
    ['WASHING', 'DRYING'],
    ['DRYING', 'FOLDING'],
    ['FOLDING', 'READY'],
    ['READY', 'COMPLETED'],
  ]

  for (const [from, to] of forwardSteps) {
    const res = validateTransition(from, to)
    assert.equal(res.valid, true, `Transition ${from} -> ${to} should be valid`)
    assert.equal(res.isBackward, false, `Transition ${from} -> ${to} should not be backward`)
    assert.equal(res.isCancellation, false, `Transition ${from} -> ${to} should not be cancellation`)
  }
})

test('State Machine: valid backward transitions', () => {
  const backwardSteps: Array<[OrderStatus, OrderStatus]> = [
    ['READY', 'FOLDING'],
    ['FOLDING', 'DRYING'],
    ['DRYING', 'WASHING'],
    ['WASHING', 'RECEIVED'],
  ]

  for (const [from, to] of backwardSteps) {
    const res = validateTransition(from, to)
    assert.equal(res.valid, true, `Backward transition ${from} -> ${to} should be valid`)
    assert.equal(res.isBackward, true, `Backward transition ${from} -> ${to} should be marked backward`)
    assert.equal(res.isCancellation, false)
  }
})

test('State Machine: invalid skip or reverse transitions', () => {
  const invalidSteps: Array<[OrderStatus, OrderStatus]> = [
    ['RECEIVED', 'READY'],
    ['RECEIVED', 'FOLDING'],
    ['WASHING', 'READY'],
    ['READY', 'WASHING'],
    ['READY', 'RECEIVED'],
    ['FOLDING', 'RECEIVED'],
  ]

  for (const [from, to] of invalidSteps) {
    const res = validateTransition(from, to)
    assert.equal(res.valid, false, `Transition ${from} -> ${to} should be invalid`)
  }
})

test('State Machine: cancellation allowed from any non-terminal status', () => {
  const activeStatuses: OrderStatus[] = ['RECEIVED', 'WASHING', 'DRYING', 'FOLDING', 'READY']
  for (const status of activeStatuses) {
    const res = validateTransition(status, 'CANCELLED')
    assert.equal(res.valid, true)
    assert.equal(res.isCancellation, true)
    assert.equal(res.isBackward, false)
  }
})

test('State Machine: terminal statuses cannot transition', () => {
  const targets: OrderStatus[] = ['RECEIVED', 'WASHING', 'DRYING', 'FOLDING', 'READY', 'COMPLETED', 'CANCELLED']
  for (const target of targets) {
    const resCompleted = validateTransition('COMPLETED', target)
    assert.equal(resCompleted.valid, false, `COMPLETED -> ${target} should be invalid`)

    const resCancelled = validateTransition('CANCELLED', target)
    assert.equal(resCancelled.valid, false, `CANCELLED -> ${target} should be invalid`)
  }
})

test('Duplicate-service merge logic: merges duplicate services and sums quantities', () => {
  const items = [
    { service_id: 'svc-1', quantity: 2.5 },
    { service_id: 'svc-2', quantity: 3 },
    { service_id: 'svc-1', quantity: 1.5 },
  ]

  const merged = mergeServiceItems(items)
  assert.equal(merged.length, 2)

  const svc1 = merged.find(i => i.service_id === 'svc-1')
  assert.ok(svc1)
  assert.equal(svc1.quantity, 4.0)

  const svc2 = merged.find(i => i.service_id === 'svc-2')
  assert.ok(svc2)
  assert.equal(svc2.quantity, 3)
})

test('Duplicate-service merge logic: handles multiple lines and floating point precision', () => {
  const items = [
    { service_id: 'svc-1', quantity: 0.1 },
    { service_id: 'svc-1', quantity: 0.2 },
    { service_id: 'svc-1', quantity: 0.3 },
  ]

  const merged = mergeServiceItems(items)
  assert.equal(merged.length, 1)
  assert.equal(merged[0].quantity, 0.6)
})

test('Duplicate-service merge logic: leaves unique items unchanged', () => {
  const items = [
    { service_id: 'svc-1', quantity: 1 },
    { service_id: 'svc-2', quantity: 2 },
    { service_id: 'svc-3', quantity: 3 },
  ]

  const merged = mergeServiceItems(items)
  assert.equal(merged.length, 3)
  assert.deepEqual(merged, items)
})
