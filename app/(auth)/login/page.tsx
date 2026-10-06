import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 px-4">
      <SignIn routing="hash" forceRedirectUrl="/dashboard" />
    </div>
  )
}
