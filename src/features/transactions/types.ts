/**
 * Domain status for a transaction record.
 * Keep this aligned with what your API actually returns.
 */
export type TransactionStatus =
  | 'RECEIVED'
  | 'INITIATED'
  | 'PENDING'
  | 'PROCESSED'
  | 'FAILED'

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

export type PaymentStatusCounts = { pending: number, success: number, failed: number, total: number }

/** UI-level tab identifier — extends PaymentStatus with the 'all' aggregate tab. */
export type TabStatus = PaymentStatus | 'ALL'

/**
 * Supported payment instruments in dev.
 * Add/remove as your Payment Portal grows.
 */
export type PaymentMethod =
  | 'PLASTIC_CARD'
  | 'ACH'
  | 'PAYPAL'

/**
 * A single transaction row as displayed in the dashboard.
 * Field names are camelCase to match common JSON/TS conventions.
 * Comments show the label you specified in the Acceptance Criteria.
 */
export type Transaction = {
  agencyTrackingId: string
  paygovTrackingId?: string | null
  feeName: string
  feeId: string
  feeAmount: number
  clientName: string
  transactionReferenceId: string
  paymentStatus: PaymentStatus
  transactionStatus?: TransactionStatus
  paygovToken?: string | null
  paymentMethod: PaymentMethod
  lastUpdatedAt: string
  createdAt: string
  metadata?: Record<string, string> | null
}
