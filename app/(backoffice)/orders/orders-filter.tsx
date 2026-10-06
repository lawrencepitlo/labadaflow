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
import { useCallback, useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'WASHING', label: 'Washing' },
  { value: 'DRYING', label: 'Drying' },
  { value: 'FOLDING', label: 'Folding' },
  { value: 'READY', label: 'Ready' },
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
  const [debouncedSearch, setDebouncedSearch] = useState(currentSearch ?? '')
  const [, startTransition] = useTransition()

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const updateFilters = useCallback(
    (newSearch?: string, newStatus?: string) => {
      const params = new URLSearchParams()
      const s = newSearch ?? debouncedSearch
      const st = newStatus ?? currentStatus

      if (s) params.set('search', s)
      if (st && st !== 'ALL') params.set('status', st)

      // Preserve page param if not changing search/status
      if (newSearch === undefined && newStatus === undefined) {
        const page = searchParams.get('page')
        if (page) params.set('page', page)
      }

      startTransition(() => {
        router.push(`/orders?${params.toString()}`)
      })
    },
    [router, debouncedSearch, currentStatus, searchParams]
  )

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  const handleSearchSubmit = useCallback(() => {
    updateFilters(search)
  }, [updateFilters, search])

  const hasActiveFilters = (currentSearch && currentSearch.length > 0) || (currentStatus && currentStatus !== 'ALL')

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search orders..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSearchSubmit()
          }}
          className="pl-9"
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearch('')
              updateFilters('')
            }}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <Select
        value={currentStatus ?? 'ALL'}
        onValueChange={value => updateFilters(undefined, value ?? undefined)}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
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
        <Button variant="outline" size="sm" onClick={() => updateFilters('', 'ALL')}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
