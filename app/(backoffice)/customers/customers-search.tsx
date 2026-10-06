'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from 'react'

export function CustomersSearch({ currentSearch }: { currentSearch?: string }) {
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

  const updateSearch = useCallback((newSearch?: string) => {
    const params = new URLSearchParams()
    const s = newSearch ?? debouncedSearch

    if (s) params.set('search', s)

    // Preserve page param if not changing search
    if (newSearch === undefined) {
      const page = searchParams.get('page')
      if (page) params.set('page', page)
    }

    startTransition(() => {
      router.push(`/customers?${params.toString()}`)
    })
  }, [router, debouncedSearch, searchParams])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  const handleSearchSubmit = useCallback(() => {
    updateSearch(search)
  }, [updateSearch, search])

  return (
    <div className="flex gap-2 mb-6 max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSearchSubmit()
          }}
          className="pl-9"
          aria-label="Search customers"
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearch('')
              updateSearch('')
            }}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <Button onClick={handleSearchSubmit} disabled={search === currentSearch}>
        Search
      </Button>
      {currentSearch && currentSearch.length > 0 && (
        <Button variant="outline" size="default" onClick={() => updateSearch('')}>
          Clear
        </Button>
      )}
    </div>
  )
}
