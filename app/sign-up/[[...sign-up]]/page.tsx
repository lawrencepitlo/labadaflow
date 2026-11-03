'use client'

import { useState, useEffect } from 'react'
import { SignUp, ClerkLoaded, ClerkLoading } from '@clerk/nextjs'
import Link from 'next/link'
import { Droplets, ArrowRight, Sparkles, RefreshCw, AlertCircle } from 'lucide-react'

export default function SignUpPage() {
  const [slowLoad, setSlowLoad] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSlowLoad(true)
    }, 3500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/70 px-4 py-12 dark:bg-background">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link
            href="/"
            className="group mb-3 flex items-center gap-2.5 rounded-xl transition-transform hover:scale-105 active:scale-95"
            aria-label="LabadaFlow Home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Droplets className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">LabadaFlow</span>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Get your instant Digital Walk-in Pass and track all your laundry in one place.
          </p>
        </div>

        {/* Clerk Sign Up with Instant Skeleton Loading */}
        <div className="flex flex-col items-center justify-center min-h-[380px]">
          <ClerkLoading>
            <div className="w-full rounded-2xl border border-border/80 bg-card p-7 shadow-sm">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary/20 border-t-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Loading registration...</p>
                  <p className="text-xs text-muted-foreground">Preparing your account</p>
                </div>
                <div className="w-full space-y-3 pt-3">
                  <div className="h-10 w-full animate-pulse rounded-xl bg-muted/70" />
                  <div className="h-10 w-full animate-pulse rounded-xl bg-muted/70" />
                  <div className="h-10 w-full animate-pulse rounded-xl bg-muted/70" />
                </div>
              </div>
            </div>
          </ClerkLoading>

          <ClerkLoaded>
            <SignUp
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/auth/redirect"
              appearance={{
                variables: {
                  colorPrimary: '#2563eb',
                  borderRadius: '0.75rem',
                  fontFamily: 'inherit',
                },
                elements: {
                  rootBox: 'w-full shadow-lg shadow-slate-200/50 dark:shadow-none',
                  card: 'border border-border/80 bg-card rounded-2xl p-6 sm:p-8',
                  headerTitle: 'text-foreground font-semibold',
                  headerSubtitle: 'text-muted-foreground text-xs',
                  socialButtonsBlockButton: 'border border-border rounded-xl text-foreground font-medium hover:bg-muted/60 transition-colors',
                  formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl h-10 shadow-sm transition-all',
                  formFieldInput: 'rounded-xl border-border focus:border-primary focus:ring-primary/20',
                  footerActionLink: 'text-primary hover:underline font-medium',
                },
              }}
            />
          </ClerkLoaded>

          {/* Slow connection or ad-blocker tip */}
          {slowLoad && (
            <div className="mt-4 flex w-full items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="flex-1 leading-relaxed">
                <span>Taking longer to load? If using Brave or an ad blocker, try disabling shields for this domain or </span>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="font-bold underline hover:text-amber-950 dark:hover:text-amber-200 inline-flex items-center gap-0.5"
                >
                  <RefreshCw className="h-3 w-3" /> tap here to refresh
                </button>.
              </div>
            </div>
          )}
        </div>

        {/* Public Tracking Shortcut Footer */}
        <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3.5 py-1.5 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Have a paper slip from the counter?</span>
            <Link
              href="/track"
              className="font-semibold text-primary inline-flex items-center gap-0.5 hover:underline ml-1"
            >
              Track by Code
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
