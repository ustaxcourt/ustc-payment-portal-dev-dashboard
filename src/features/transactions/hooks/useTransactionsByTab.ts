import React from "react"
import type { TabStatus } from "../types"
import { fetchAllTransactions, fetchTransactionsByStatus, type TransactionsResponse } from "../api/transactions.api"
import { useFetch } from "../../../lib/hooks/useFetch"

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
