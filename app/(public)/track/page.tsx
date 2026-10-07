import Link from 'next/link'
import { Droplets, Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TrackForm } from './track-form'

export default function TrackPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105 motion-reduce:transition-none">
              <Droplets className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-bold text-xl tracking-tight">LabadaFlow</span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-primary/20">
              <Package className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Track your laundry</h1>
            <p className="text-muted-foreground">
              Enter the tracking code from your order slip to see where your laundry is right now.
            </p>
          </div>
          <Card className="border-2 shadow-lg shadow-primary/5">
            <CardContent className="p-6">
              <TrackForm />
            </CardContent>
          </Card>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Registered customer? <Link href="/login" className="font-medium text-primary hover:underline">Sign in to see all your orders</Link>.
          </p>
        </div>
      </main>
    </div>
  )
}
