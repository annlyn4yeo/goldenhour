import useAsync, { type AsyncState } from './useAsync'

type UseFetchOptions = {
  enabled?: boolean
  errorMessage?: string
}

export async function fetchJson<T>(url: string, errorMessage = 'Request failed.'): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(errorMessage)
  }
  return response.json() as Promise<T>
}

export default function useFetch<T>(
  url: string | null,
  deps: unknown[],
  options: UseFetchOptions = {},
): AsyncState<T> {
  const { enabled = true, errorMessage = 'Request failed.' } = options

  return useAsync(
    () => fetchJson<T>(url!, errorMessage),
    [url, ...deps],
    { enabled: enabled && url !== null },
  )
}
