import * as React from 'react'
import { useFetch } from '../../../lib/hooks/useFetch'
import { fetchTransactionsByStatus, fetchAllTransactions } from '../api/transactions.api'
import type { TransactionsResponse } from '../api/transactions.api'
import type { PaymentStatus, TabStatus } from '../types'

export function useTransactionsByStatus(status: PaymentStatus) {
  const fetcher = React.useCallback(
    (signal: AbortSignal) => fetchTransactionsByStatus(status, { signal }),
    [status]
  )

  return useFetch<TransactionsResponse>(fetcher)
}

/** Unified hook that handles both the 'all' aggregate tab and the per-status tabs. */
export function useTransactionsByTab(tab: TabStatus) {
  const fetcher = React.useCallback(
    (signal: AbortSignal) =>
      tab === 'ALL'
        ? fetchAllTransactions({ signal })
        : fetchTransactionsByStatus(tab, { signal }),
    [tab]
  )

  return useFetch<TransactionsResponse>(fetcher)
}
