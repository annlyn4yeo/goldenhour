import type { ReactNode } from 'react'

type HeroSectionProps = {
  isLight?: boolean
  children?: ReactNode
}

export default function HeroSection({ isLight = false, children }: HeroSectionProps) {
  const textClass = isLight ? 'text-ink-primary' : 'text-ink-inverse'

  return (
    <section className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center pt-14">
      {children ?? (
        <p className={`font-display text-hero italic ${textClass}`}>hero</p>
      )}
    </section>
  )
}
