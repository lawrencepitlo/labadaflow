import { cn } from 'cn'
import { type LucideIcon, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 py-14 text-center',
        className
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/40">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">{description}</p>
      {actionLabel && actionHref && (
        <Button render={<Link href={actionHref} />} className="mt-4">{actionLabel}</Button>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button onClick={onAction} className="mt-4">{actionLabel}</Button>
      )}
    </div>
  )
}
