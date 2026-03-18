import * as React from 'react'

export interface UseFetchState<T> {
  data: T | null
  error: Error | null
  loading: boolean
  refetch: () => void
}

export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>
): UseFetchState<T> {
  const [data, setData] = React.useState<T | null>(null)
  const [error, setError] = React.useState<Error | null>(null)
  const [loading, setLoading] = React.useState(false)

  const fetchData = React.useCallback(() => {
    const ac = new AbortController()
    setLoading(true)
    setError(null)

    fetcher(ac.signal)
      .then((res) => setData(res))
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err)
      })
      .finally(() => setLoading(false))

    return () => ac.abort()
  }, [fetcher])

  React.useEffect(() => {
    const abort = fetchData()
    return abort
  }, [fetchData])

  return {
    data,
    error,
    loading,
    refetch: fetchData,
  }
}
