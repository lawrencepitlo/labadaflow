import Link from 'next/link'
import { Droplets, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TrackForm } from './track-form'

export const metadata = {
  title: 'Track Laundry Order — LabadaFlow',
  description: 'Track your laundry order live from intake to washing, drying, folding, and counter pickup.',
}

export default function TrackPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/70 dark:bg-background">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-105">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Droplets className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold tracking-tight text-foreground">LabadaFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Staff & Customer Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-lg">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Live Customer Tracking
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Where is my laundry right now?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Enter the tracking code from your counter receipt slip to view real-time wash stages, estimated ready time, and pickup status.
            </p>
          </div>

          <Card className="rounded-2xl border-border/80 shadow-md shadow-slate-200/50 dark:shadow-none p-2 sm:p-4">
            <CardContent className="p-4 sm:p-5">
              <TrackForm />
            </CardContent>
          </Card>

          {/* Quick Flow Visual */}
          <div className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Live Stage Updates You Can See:
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-center pt-1 font-medium">
              <span className="rounded-lg bg-muted/60 p-1.5">1. Received</span>
              <span className="rounded-lg bg-muted/60 p-1.5">2. Washing</span>
              <span className="rounded-lg bg-muted/60 p-1.5">3. Drying</span>
              <span className="rounded-lg bg-muted/60 p-1.5">4. Folding</span>
              <span className="rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-1.5">5. Ready!</span>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Registered customer?{' '}
            <Link href="/sign-in" className="font-semibold text-primary hover:underline">
              Sign in to see all your orders & customer pass
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
