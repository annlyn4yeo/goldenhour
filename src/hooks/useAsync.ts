import { useEffect, useState } from 'react'

export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

type UseAsyncOptions = {
  enabled?: boolean
}

export default function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: unknown[],
  options: UseAsyncOptions = {},
): AsyncState<T> {
  const { enabled = true } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void asyncFn()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null)
          setError(err instanceof Error ? err.message : 'Request failed.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, ...deps])

  return { data, loading, error }
}
