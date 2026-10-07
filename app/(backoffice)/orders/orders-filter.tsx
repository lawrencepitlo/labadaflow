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
import { Kbd } from '@/components/ui/kbd'

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
  const inputRef = useRef<HTMLInputElement>(null)

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

  // `/` focuses search from anywhere (unless already typing)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Silence unused warning while keeping searchParams subscribed for future pagination preservation
  void searchParams

  const hasActiveFilters =
    (currentSearch && currentSearch.length > 0) || (currentStatus && currentStatus !== 'ALL')

  return (
    <div className="mb-4 flex items-center gap-2" role="search" aria-label="Filter orders">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" aria-hidden="true" />
        <Input
          ref={inputRef}
          placeholder="Search order #, tracking code, or customer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') pushFilters(search)
          }}
          className="pr-8 pl-8"
          aria-label="Search orders"
        />
        {search ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearch('')
              pushFilters('')
            }}
            aria-label="Clear search"
          >
            <X aria-hidden="true" />
          </Button>
        ) : (
          <Kbd className="absolute top-1/2 right-2 -translate-y-1/2">/</Kbd>
        )}
      </div>
      <Select
        value={currentStatus ?? 'ALL'}
        onValueChange={value => pushFilters(search, value ?? undefined)}
        disabled={isPending}
      >
        <SelectTrigger className="w-[142px] shrink-0 sm:w-[172px]" aria-label="Filter by status">
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
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground"
          onClick={() => {
            setSearch('')
            startTransition(() => router.push('/orders'))
          }}
          aria-label="Clear all filters"
        >
          <X aria-hidden="true" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      )}
    </div>
  )
}
