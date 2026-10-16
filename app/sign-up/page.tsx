'use client'

import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { Droplets } from 'lucide-react'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <Link href="/" className="mb-2 flex items-center gap-2" aria-label="LabadaFlow Home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <Droplets className="h-4 w-4" />
          </span>
          <span className="text-xl font-bold tracking-tight">LabadaFlow</span>
        </Link>
        <p className="max-w-xs text-xs text-muted-foreground">
          New accounts are registered as Customer accounts to view orders, track loads, and manage profile.
        </p>
      </div>
      <SignUp routing="hash" fallbackRedirectUrl="/portal" />
    </div>
  )
}
