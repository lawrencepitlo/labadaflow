'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react'

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const isAccessDenied =
    error.message?.includes('FORBIDDEN') ||
    error.message?.includes('UNAUTHENTICATED') ||
    error.message?.toLowerCase().includes('access denied') ||
    error.message?.toLowerCase().includes('permission')

  if (isAccessDenied) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4 max-w-md mx-auto">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground mb-6">
          You don&apos;t have access to this portal order or resource. If you have an order slip, you can claim it or track it directly.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button render={<Link href="/track" />} size="sm">
            Track via Code
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4 max-w-md mx-auto">
      <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold tracking-tight mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-6">
        An unexpected error occurred while loading your portal data. Please try again.
      </p>
      <Button onClick={reset} size="sm">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}
