'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import { styled } from '@mui/material/styles'

// Third-party Imports
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import api from '@/libs/axiosInstance'

// Component Imports
import TransactionDetailModal from '@/components/dialogs/TransactionDetailModal'

// Styled Components
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}))

const LedgerSheet = ({
  dateRange,
  filters = {},
  summaryData = null,
  onRowClick = null
}) => {
  // States
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Hooks
  const { data: session } = useSession()

  // Fetch ledger transactions
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError
  } = useQuery({
    queryKey: ['ledger-transactions', dateRange, filters],
    queryFn: async () => {
      const params = {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        ...filters
      }

      const response = await api.get('/ledger/transactions', { params })
      return response.data
    },
    enabled: !!session && !!dateRange.startDate && !!dateRange.endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Update local state when data changes
  useEffect(() => {
    if (transactionsData?.data) {
      setTransactions(transactionsData.data)
    }
  }, [transactionsData])

  // Handle row click
  const handleRowClick = (transaction) => {
    setSelectedTransaction(transaction)
    setModalOpen(true)
    if (onRowClick) {
      onRowClick(transaction)
    }
  }

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedTransaction(null)
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get transaction type color
  const getTransactionTypeColor = (type) => {
    const colors = {
      'SALES_INVOICE': 'success',
      'PURCHASE_INVOICE': 'warning',
      'EXPENSE': 'error',
      'PAYMENT_RECEIVED': 'info',
      'PAYMENT_MADE': 'secondary'
    }
    return colors[type] || 'default'
  }

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    const colors = {
      'PAID': 'success',
      'PARTIAL': 'warning',
      'UNPAID': 'error'
    }
    return colors[status] || 'default'
  }

  if (transactionsLoading) {
    return (
      <Card>
        <CardContent className='flex justify-center items-center p-8'>
          <CircularProgress />
          <Typography variant='body1' className='ml-3'>
            Loading ledger data...
          </Typography>
        </CardContent>
      </Card>
    )
  }

  if (transactionsError) {
    return (
      <Card>
        <CardContent className='p-6'>
          <Typography variant='h6' color='error'>
            Error loading ledger data
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {transactionsError.message}
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className='p-0'>
        {/* Ledger Header */}
        <Box className='p-6 border-b border-divider'>
          <div className='flex justify-between items-center'>
            <div>
              <Typography variant='h5' component='h2'>
                General Ledger
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
              </Typography>
            </div>
            {summaryData && (
              <div className='text-right'>
                <Typography variant='body2' color='text.secondary'>
                  Total Transactions: {transactions.length}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Net Profit: {formatCurrency(summaryData.netProfit)}
                </Typography>
              </div>
            )}
          </div>
        </Box>

        {/* Ledger Table */}
        <TableContainer component={Paper} elevation={0}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align='right'>Debit</TableCell>
                <TableCell align='right'>Credit</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align='center' className='py-8'>
                    <Typography variant='body2' color='text.secondary'>
                      No transactions found for the selected date range
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction, index) => (
                  <StyledTableRow
                    key={transaction._id || index}
                    hover
                    onClick={() => handleRowClick(transaction)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      {formatDate(transaction.transactionDate)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <Typography variant='body2' fontWeight='medium'>
                          {transaction.description || 'Transaction'}
                        </Typography>
                        {transaction.invoiceNumber && (
                          <Typography variant='caption' color='text.secondary'>
                            #{transaction.invoiceNumber}
                          </Typography>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.transactionType?.replace('_', ' ')}
                        color={getTransactionTypeColor(transaction.transactionType)}
                        size='small'
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      {transaction.customerName || 'N/A'}
                    </TableCell>
                    <TableCell align='right'>
                      <Typography
                        variant='body2'
                        color={transaction.debitAmount > 0 ? 'success.main' : 'text.secondary'}
                        fontWeight={transaction.debitAmount > 0 ? 'medium' : 'normal'}
                      >
                        {formatCurrency(transaction.debitAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography
                        variant='body2'
                        color={transaction.creditAmount > 0 ? 'error.main' : 'text.secondary'}
                        fontWeight={transaction.creditAmount > 0 ? 'medium' : 'normal'}
                      >
                        {formatCurrency(transaction.creditAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.paymentStatus}
                        color={getPaymentStatusColor(transaction.paymentStatus)}
                        size='small'
                        variant='outlined'
                      />
                    </TableCell>
                  </StyledTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Ledger Footer */}
        {summaryData && (
          <Box className='p-6 border-t border-divider'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='text-center'>
                <Typography variant='body2' color='text.secondary'>
                  Total Debits
                </Typography>
                <Typography variant='h6' color='success.main'>
                  {formatCurrency(summaryData.totalDebit)}
                </Typography>
              </div>
              <div className='text-center'>
                <Typography variant='body2' color='text.secondary'>
                  Total Credits
                </Typography>
                <Typography variant='h6' color='error.main'>
                  {formatCurrency(summaryData.totalCredit)}
                </Typography>
              </div>
              <div className='text-center'>
                <Typography variant='body2' color='text.secondary'>
                  Net Profit
                </Typography>
                <Typography
                  variant='h6'
                  color={summaryData.netProfit >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(summaryData.netProfit)}
                </Typography>
              </div>
            </div>
          </Box>
        )}
      </CardContent>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        open={modalOpen}
        onClose={handleModalClose}
        transaction={selectedTransaction}
      />
    </Card>
  )
}

export default LedgerSheet
