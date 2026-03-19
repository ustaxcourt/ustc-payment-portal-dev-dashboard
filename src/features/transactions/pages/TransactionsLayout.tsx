import * as React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import DashboardHeader from '../../../components/DashboardHeader'
import StatusTabs from '../components/StatusTabs'
import type { TabStatus, Transaction } from '../types'
import { useTransactionsByTab } from '../hooks/useTransactionsByTab'
import { useFetchInitialCounts } from '../hooks/useFetchInitialCounts'

export interface TransactionsLayoutContext {
  status: TabStatus
  rows: Transaction[]
  total: number
  loading: boolean
  error: Error | null
}

const isTabStatus = (value: string): value is TabStatus => {
  return value === 'ALL' || value === 'SUCCESS' || value === 'FAILED' || value === 'PENDING'
}

export default function TransactionsLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const currentTab: TabStatus = React.useMemo(() => {
    const seg = pathname.split('/').pop() || ''
    const normalized = seg.toUpperCase()
    return isTabStatus(normalized) ? normalized : 'ALL'
  }, [pathname])

  const { data, loading, error } = useTransactionsByTab(currentTab)
  const { data: initialCounts } = useFetchInitialCounts()

  const [counts, setCounts] = React.useState<Record<TabStatus, number>>({
    ALL: 0,
    SUCCESS: 0,
    FAILED: 0,
    PENDING: 0,
  })

  const hasInitializedCounts = React.useRef(false)

  // Initialize the per-status counts when the initial data is fetched
  React.useEffect(() => {
    if (!initialCounts || hasInitializedCounts.current) {
      return
    }

    setCounts((prev) => ({
      ...prev,
      ALL: initialCounts.total,
      SUCCESS: initialCounts.success,
      FAILED: initialCounts.failed,
      PENDING: initialCounts.pending,
    }))
    hasInitializedCounts.current = true
  }, [initialCounts])

  // Update the count for the active tab whenever data changes
  React.useEffect(() => {
    if (typeof data?.total !== 'number') {
      return
    }

    setCounts((prev) => {
      if (prev[currentTab] === data.total) {
        return prev
      }

      return {
        ...prev,
        [currentTab]: data.total,
      }
    })
  }, [currentTab, data?.total])

  // When the tab changes, navigate to the corresponding child route
  const handleTabChange = (value: TabStatus) => {
    navigate(`/transactions/${value.toLowerCase()}`)
  }

  return (
    <Box>
      <DashboardHeader />

      <Box sx={{ m: 2 }}>
        <Typography variant="h6" sx={{ my: 2, fontWeight: 700 }}>
          Transaction Log
        </Typography>

        <StatusTabs
          value={currentTab}
          counts={counts}
          onChange={handleTabChange}
        />

        <Outlet
          context={{
            status: currentTab,
            rows: data?.data ?? [],
            total: data?.total ?? 0,
            loading,
            error,
          } satisfies TransactionsLayoutContext}
        />
      </Box>
    </Box >
  )
}
