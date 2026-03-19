import * as React from 'react'
import { useFetch } from '../../../lib/hooks/useFetch'
import { fetchTransactionsByStatus } from '../api/transactions.api'
import type { TransactionsResponse } from '../api/transactions.api'
import type { PaymentStatus } from '../types'

export function useTransactionsByStatus(status: PaymentStatus) {
  const fetcher = React.useCallback(
    (signal: AbortSignal) => fetchTransactionsByStatus(status, { signal }),
    [status]
  )

  return useFetch<TransactionsResponse>(fetcher)
}
