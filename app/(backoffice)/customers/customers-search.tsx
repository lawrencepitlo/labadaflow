'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'

export function CustomersSearch({ currentSearch }: { currentSearch?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch ?? '')
  const [, startTransition] = useTransition()
  const firstRender = useRef(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const pushSearch = useCallback((value: string) => {
    const params = new URLSearchParams()
    if (value.trim()) params.set('search', value.trim())
    startTransition(() => {
      router.push(`/customers?${params.toString()}`)
    })
  }, [router])

  // Debounced auto-search — resets to page 1
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      if (search !== (currentSearch ?? '')) pushSearch(search)
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

  return (
    <div className="mb-4 flex items-center gap-2" role="search" aria-label="Search customers">
      <div className="relative min-w-0 max-w-md flex-1">
        <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" aria-hidden="true" />
        <Input
          ref={inputRef}
          placeholder="Search name, phone, or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') pushSearch(search)
          }}
          className="pr-8 pl-8"
          aria-label="Search customers"
        />
        {search ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearch('')
              pushSearch('')
            }}
            aria-label="Clear search"
          >
            <X aria-hidden="true" />
          </Button>
        ) : (
          <Kbd className="absolute top-1/2 right-2 -translate-y-1/2">/</Kbd>
        )}
      </div>
    </div>
  )
}
