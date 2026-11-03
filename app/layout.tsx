import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LabadaFlow — Laundry Shop Operations System",
  description:
    "Modern laundry operations management software. Track orders from intake to pickup, manage workflow stages, and record payments.",
};

const rawKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
// Ensure fast, reliable auth even if custom domain fails SSL
const clerkPublishableKey =
  !rawKey || rawKey.includes('Y2xlcmsubGFiYWRhZmxvdy52ZXJjZWwuYXBw')
    ? 'pk_test_c3BlY2lhbC1zdGFnLTMwMjIuY2xlcmsuYWNjb3VudHMuZGV2JA'
    : rawKey

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, inter.variable, "font-sans")}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://special-stag-3022.clerk.accounts.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://special-stag-3022.clerk.accounts.dev" />
        <link rel="preconnect" href="https://img.clerk.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://img.clerk.com" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          signInFallbackRedirectUrl="/auth/redirect"
          signUpFallbackRedirectUrl="/auth/redirect"
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('labadaflow-theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
            }}
          />
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
