import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h2 className="text-2xl font-bold mb-2">Page not found</h2>
      <p className="text-muted-foreground mb-6">The page you are looking for does not exist.</p>
      <Button render={<Link href="/" />} variant="outline">Go home</Button>
    </div>
  )
}
