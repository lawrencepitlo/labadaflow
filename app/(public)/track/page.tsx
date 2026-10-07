import Link from 'next/link'
import { Droplets } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TrackForm } from './track-form'

export default function TrackPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
              <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-[13px] font-semibold">LabadaFlow</span>
          </Link>
          <Link href="/login" className="text-[13px] font-medium text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-5 text-center">
            <h1 className="text-xl font-semibold tracking-tight">Track your laundry</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Enter the tracking code from your order slip to see where your laundry is right now.
            </p>
          </div>
          <Card className="gap-0 py-0">
            <CardContent className="px-4 py-4">
              <TrackForm />
            </CardContent>
          </Card>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Registered customer? <Link href="/login" className="font-medium text-foreground hover:underline">Sign in to see all your orders</Link>.
          </p>
        </div>
      </main>
    </div>
  )
}
