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

  const currentController = React.useRef<AbortController | null>(null)
  const latestRequestId = React.useRef(0)

  const fetchData = React.useCallback(() => {
    const ac = new AbortController()
    const id = ++latestRequestId.current

    // Abort any previous in-flight request
    if (currentController.current) {
      currentController.current.abort()
    }
    currentController.current = ac

    setLoading(true)
    setError(null)

    fetcher(ac.signal)
      .then((res) => {
        if (id === latestRequestId.current) setData(res)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        if (id === latestRequestId.current) setError(err)
      })
      .finally(() => {
        // Only clear loading for the latest request
        if (id === latestRequestId.current) {
          setLoading(false)
          currentController.current = null
        }
      })

    return () => {
      // Only abort this request if it's still the latest
      if (id === latestRequestId.current) {
        currentController.current = null
      }
      ac.abort()
    }
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
