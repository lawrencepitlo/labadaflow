'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { archiveCustomer, restoreCustomer } from '@/lib/actions/customers'
import { Button } from '@/components/ui/button'

export function ArchiveButtons({ customerId, archived }: { customerId: string; archived: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run() {
    setError(null)
    startTransition(async () => {
      const result = archived ? await restoreCustomer(customerId) : await archiveCustomer(customerId)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div>
      <Button variant={archived ? 'outline' : 'destructive'} onClick={run} disabled={isPending}>
        {isPending ? 'Working…' : archived ? 'Restore Customer' : 'Archive Customer'}
      </Button>
      {error && <p className="text-sm text-destructive mt-2" role="alert">{error}</p>}
    </div>
  )
}
