import QRCode from 'qrcode'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getCustomerByClerkId } from '@/lib/data/customers'
import { getActor } from '@/lib/auth'
import { PageHeader } from '@/components/app/page-header'
import { ClaimOrderDialog } from '@/components/app/claim-order-dialog'
import { QrCode, Store, Sparkles, Phone, User, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export const metadata = {
  title: 'Digital Walk-in Pass — LabadaFlow',
  description: 'Your personal digital walk-in pass for rapid counter intake.',
}

export default async function CustomerPassPage() {
  const { userId } = await auth()
  const actor = await getActor()
  const customer = userId ? await getCustomerByClerkId(userId) : null

  const customerName = customer?.full_name || actor?.full_name || 'Valued Customer'
  const customerPhone = customer?.phone || 'Not provided'
  const customerEmail = customer?.email || actor?.email || ''
  const passIdentifier = customer?.id || userId || 'WALK-IN-PASS'

  // Generate QR code for counter scanner
  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      type: 'LABADAFLOW_CUSTOMER_PASS',
      id: customer?.id || userId,
      name: customerName,
      phone: customerPhone,
    }),
    {
      margin: 1,
      width: 240,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    }
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Walk-in Customer Pass"
        description="Show this digital pass at the counter when you drop off your clothes for fast, contactless check-in."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* The Digital Pass Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-linear-to-b from-blue-50/50 via-card to-card p-6 shadow-md dark:border-border dark:from-primary/5 sm:p-8">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold tracking-wider text-primary uppercase">
                  LabadaFlow Pass
                </span>
                <p className="text-[11px] text-muted-foreground">Express Walk-in Member</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              <Sparkles className="h-3 w-3" />
              Active
            </span>
          </div>

          {/* QR Code Container */}
          <div className="my-6 flex flex-col items-center justify-center">
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-sm dark:border-border">
              <Image
                src={qrDataUrl}
                alt={`Walk-in QR Pass for ${customerName}`}
                width={190}
                height={190}
                className="rounded-xl"
                priority
              />
            </div>
            <span className="mt-2 font-mono text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">
              SCAN AT COUNTER
            </span>
          </div>

          {/* Customer Identifiers */}
          <div className="space-y-2 rounded-2xl bg-slate-50/80 p-4 text-xs dark:bg-muted/40">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-3.5 w-3.5" /> Name
              </span>
              <span className="font-bold text-foreground">{customerName}</span>
            </div>
            {customerPhone !== 'Not provided' && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </span>
                <span className="font-mono font-medium text-foreground">{customerPhone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Counter Guide & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-card p-6 shadow-xs dark:border-border sm:p-7">
            <h2 className="text-base font-bold text-foreground">How Walk-in Works</h2>
            <ol className="space-y-3.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  1
                </span>
                <div>
                  <strong className="text-foreground">Bring your clothes to the counter.</strong>
                  <p className="mt-0.5">Walk in anytime during store business hours.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  2
                </span>
                <div>
                  <strong className="text-foreground">Show this QR Pass.</strong>
                  <p className="mt-0.5">Staff scans your code to pull up your profile in 2 seconds.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  3
                </span>
                <div>
                  <strong className="text-foreground">Track live stages on your phone.</strong>
                  <p className="mt-0.5">Watch your laundry move through washing, drying, and folding in real time.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="rounded-3xl border border-dashed border-border/80 bg-slate-50/50 p-6 text-center dark:bg-muted/20">
            <h3 className="text-sm font-semibold text-foreground">Have a paper slip from previous visits?</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter your tracking code to claim it and attach it to your account history.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <ClaimOrderDialog triggerText="Claim Paper Slip Order" variant="default" />
              <Button variant="outline" size="sm" render={<Link href="/portal/orders" />}>
                View My Orders
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
