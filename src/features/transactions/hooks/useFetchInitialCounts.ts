import React from "react"
import { fetchTransactionPaymentStatus } from "../api/transactions.api"
import { useFetch } from "../../../lib/hooks/useFetch"

export function useFetchInitialCounts() {
  const fetcher = React.useCallback(
    (signal: AbortSignal) => fetchTransactionPaymentStatus({ signal }),
    []
  )

  return useFetch(fetcher)
}
