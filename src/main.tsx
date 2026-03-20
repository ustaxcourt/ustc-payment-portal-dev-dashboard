import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme'
import './index.css'

import App from './App'
import TransactionsLayout from './features/transactions/pages/TransactionsLayout'
import TransactionsStatusPage from './features/transactions/pages/TransactionsStatusPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/transactions/all" replace /> },
      {
        path: 'transactions',
        element: <TransactionsLayout />,
        children: [
          { index: true, element: <Navigate to="all" replace /> },
          { path: 'all', element: <TransactionsStatusPage status="ALL" /> },
          { path: 'success', element: <TransactionsStatusPage status="SUCCESS" /> },
          { path: 'failed', element: <TransactionsStatusPage status="FAILED" /> },
          { path: 'pending', element: <TransactionsStatusPage status="PENDING" /> },
        ],
      },
    ],
  },
])

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
)
