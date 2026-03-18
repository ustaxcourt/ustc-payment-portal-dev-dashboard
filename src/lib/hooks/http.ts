import React from 'react'
import { useFetch } from './useFetch'

export function useGet<T>(url: string) {
  const fetcher = React.useCallback(
    (signal: AbortSignal) =>
      fetch(url, { method: 'GET', signal }).then(async (res) => {
        if (!res.ok) throw new Error(`GET failed: ${res.status}`)
        return res.json()
      }),
    [url]
  )

  return useFetch<T>(fetcher)
}

export function usePost<T, B = unknown>(
  url: string,
  body: B
) {
  const fetcher = React.useCallback(
    (signal: AbortSignal) =>
      fetch(url, {
        method: 'POST',
        signal,
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }).then(async (res) => {
        if (!res.ok) throw new Error(`POST failed: ${res.status}`)
        return res.json()
      }),
    [body, url]
  )

  return useFetch<T>(fetcher)
}
