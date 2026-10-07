'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'WASHING', label: 'Washing' },
  { value: 'DRYING', label: 'Drying' },
  { value: 'FOLDING', label: 'Folding' },
  { value: 'READY', label: 'Ready for pickup' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

interface OrdersFilterProps {
  currentSearch?: string
  currentStatus?: string
}

export function OrdersFilter({ currentSearch, currentStatus }: OrdersFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch ?? '')
  const [isPending, startTransition] = useTransition()
  const firstRender = useRef(true)

  const pushFilters = useCallback(
    (nextSearch: string, nextStatus?: string) => {
      const params = new URLSearchParams()
      if (nextSearch.trim()) params.set('search', nextSearch.trim())
      const status = nextStatus ?? currentStatus
      if (status && status !== 'ALL') params.set('status', status)
      startTransition(() => {
        router.push(`/orders?${params.toString()}`)
      })
    },
    [router, currentStatus]
  )

  // Debounced auto-search — reset to page 1 on filter change
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      if (search !== (currentSearch ?? '')) pushFilters(search)
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Silence unused warning while keeping searchParams subscribed for future pagination preservation
  void searchParams

  const hasActiveFilters =
    (currentSearch && currentSearch.length > 0) || (currentStatus && currentStatus !== 'ALL')

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row" role="search" aria-label="Filter orders">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Search order #, tracking code, or customer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') pushFilters(search)
          }}
          className="pl-9 pr-9"
          aria-label="Search orders"
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearch('')
              pushFilters('')
            }}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      <Select
        value={currentStatus ?? 'ALL'}
        onValueChange={value => pushFilters(search, value ?? undefined)}
        disabled={isPending}
      >
        <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter by status">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={() => {
            setSearch('')
            startTransition(() => router.push('/orders'))
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}
