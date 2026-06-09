import { useEffect, useRef, useState } from 'react'
import { formatDuration } from '../lib/goldenHour'

function FlipChar({ char }: { char: string }) {
  const [display, setDisplay] = useState(char)
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle')
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    setPhase('out')
    const outTimer = window.setTimeout(() => {
      setDisplay(char)
      setPhase('in')
      window.setTimeout(() => setPhase('idle'), 75)
    }, 75)

    return () => window.clearTimeout(outTimer)
  }, [char])

  const animClass =
    phase === 'out'
      ? 'animate-countdown-flip-out'
      : phase === 'in'
        ? 'animate-countdown-flip-in'
        : ''

  return (
    <span
      className={`inline-block origin-center ${animClass}`}
      style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
    >
      {display === ' ' ? '\u00a0' : display}
    </span>
  )
}

export function formatCountdownFromMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return 'now'
  return formatDuration(totalMinutes * 60_000)
}

export default function SunArcCountdown({ text }: { text: string }) {
  return (
    <span className="inline">
      {text.split('').map((char, index) => (
        <FlipChar key={index} char={char} />
      ))}
    </span>
  )
}
