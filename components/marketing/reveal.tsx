'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from 'cn'

/**
 * Quiet scroll reveal. Renders visible on first paint (no-JS / reduced-motion
 * safe); the hidden-then-reveal enhancement arms only when JS runs and the
 * user has no reduced-motion preference.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'plain' | 'hidden' | 'shown'>('plain')

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setState('shown')
            observer.disconnect()
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    observer.observe(el)
    const raf = requestAnimationFrame(() => {
      setState(h => (h === 'plain' ? 'hidden' : h))
    })
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        'transition-all duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        state === 'hidden' && 'translate-y-4 opacity-0',
        state === 'shown' && 'translate-y-0 opacity-100',
        className
      )}
    >
      {children}
    </div>
  )
}
