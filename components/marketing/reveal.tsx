'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from 'cn'

/**
 * Subtle scroll reveal. Content renders visible by default (works with JS
 * disabled); the hidden-then-reveal enhancement only applies when JS runs
 * and the user has no reduced-motion preference.
 */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
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
      { threshold: 0.12 }
    )
    observer.observe(el)
    // Arm the hidden state async so the no-JS / reduced-motion
    // first paint stays visible; only downgrade from 'plain'.
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
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        state === 'hidden' && 'translate-y-6 opacity-0',
        state === 'shown' && 'translate-y-0 opacity-100',
        className
      )}
    >
      {children}
    </div>
  )
}
