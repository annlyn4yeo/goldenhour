import { useEffect, useState } from 'react'

export default function useNow(intervalMs: number, enabled = true): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!enabled) return

    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, intervalMs)

    return () => window.clearInterval(intervalId)
  }, [intervalMs, enabled])

  return now
}
