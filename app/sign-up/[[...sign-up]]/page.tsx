import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { Droplets, ArrowRight, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Sign Up — LabadaFlow',
  description: 'Create an account to track all your laundry orders and access your customer pass.',
}

export default function SignUpPage() {
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

        {/* Clerk Sign Up Card Container */}
        <div className="flex justify-center">
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
