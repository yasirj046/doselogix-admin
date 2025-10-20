'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import { useQuery } from '@tanstack/react-query'
import api from '@/libs/axiosInstance'

const TransactionDetailModal = ({ open, onClose, transaction }) => {
  // States
  const [transactionDetails, setTransactionDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Determine transaction type and API endpoint
  const getTransactionTypeAndEndpoint = (transaction) => {
    if (!transaction) return { type: null, endpoint: null, id: null }
    
    switch (transaction.transactionType) {
      case 'SALES_INVOICE':
        return {
          type: 'sales',
          endpoint: `/sales-invoices/${transaction.referenceId}`,
          id: transaction.referenceId
        }
      case 'PURCHASE_INVOICE':
        return {
          type: 'purchase',
          endpoint: `/purchase-entries/${transaction.referenceId}`,
          id: transaction.referenceId
        }
      case 'EXPENSE':
        return {
          type: 'expense',
          endpoint: `/expenses/${transaction.referenceId}`,
          id: transaction.referenceId
        }
      default:
        return { type: null, endpoint: null, id: null }
    }
  }

  const { type, endpoint, id } = getTransactionTypeAndEndpoint(transaction)

  // Fetch transaction details
  const {
    data: detailsData,
    isLoading: detailsLoading,
    error: detailsError
  } = useQuery({
    queryKey: ['transaction-details', type, id],
    queryFn: async () => {
      if (!endpoint) return null
      try {
        const response = await api.get(endpoint)
        return response.data
      } catch (error) {
        console.error('API Error:', error.response?.data || error.message)
        throw error
      }
    },
    enabled: !!endpoint && !!id && open,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

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
      'EXPENSE': 'error'
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

  // Render sales invoice details
  const renderSalesInvoiceDetails = (data) => {
    if (!data) return null

    return (
      <Box>
        {/* Customer Information */}
        <Card className='mb-6'>
          <CardContent>
            <Typography variant='h6' className='mb-4 font-medium'>
              Customer Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={6}>
                <Typography variant='body2' color='text.secondary'>
                  Customer Name
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {data.customerId?.customerName || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant='body2' color='text.secondary'>
                  Address
                </Typography>
                <Typography variant='body1'>
                  {data.customerId?.customerAddress || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant='body2' color='text.secondary'>
                  City
                </Typography>
                <Typography variant='body1'>
                  {data.customerId?.customerCity || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant='body2' color='text.secondary'>
                  Area
                </Typography>
                <Typography variant='body1'>
                  {data.customerId?.customerArea?.areaName || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Invoice Information */}
        <Card className='mb-6'>
          <CardContent>
            <Typography variant='h6' className='mb-4 font-medium'>
              Invoice Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Invoice Number
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {data.deliveryLogNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Date
                </Typography>
                <Typography variant='body1'>
                  {formatDate(data.date)}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Payment Status
                </Typography>
                <Chip
                  label={data.paymentStatus || 'UNPAID'}
                  color={getPaymentStatusColor(data.paymentStatus)}
                  size='small'
                  variant='outlined'
                />
              </Grid>
              <Grid size={6}>
                <Typography variant='body2' color='text.secondary'>
                  Delivered By
                </Typography>
                <Typography variant='body1'>
                  {data.deliverBy?.employeeName || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant='body2' color='text.secondary'>
                  Booked By
                </Typography>
                <Typography variant='body1'>
                  {data.bookedBy?.employeeName || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Products */}
        {data.products && data.products.length > 0 && (
          <Card className='mb-6'>
            <CardContent>
              <Typography variant='h6' className='mb-4 font-medium'>
                Products ({data.products.length})
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align='right'>Quantity</TableCell>
                      <TableCell align='right'>Rate</TableCell>
                      <TableCell align='right'>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <Typography variant='body2' fontWeight='medium'>
                              {product.productId?.productName || 'N/A'}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              Pack: {product.productId?.packingSize || 'N/A'}
                            </Typography>
                          </div>
                        </TableCell>
                        <TableCell align='right'>
                          {product.quantity || 0}
                        </TableCell>
                        <TableCell align='right'>
                          {formatCurrency(product.salePrice || 0)}
                        </TableCell>
                        <TableCell align='right'>
                          {formatCurrency(product.totalAmount || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Financial Summary */}
        <Card className='mb-6'>
          <CardContent>
            <Typography variant='h6' className='mb-4 font-medium'>
              Financial Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Subtotal
                </Typography>
                <Typography variant='h6'>
                  {formatCurrency(data.subtotal || 0)}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Discount
                </Typography>
                <Typography variant='h6'>
                  {formatCurrency(data.totalDiscount || 0)}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Total Amount
                </Typography>
                <Typography variant='h6' color='success.main'>
                  {formatCurrency(data.grandTotal || 0)}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Total Paid
                </Typography>
                <Typography variant='h6' color='info.main'>
                  {formatCurrency(data.totalPaid || 0)}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Remaining Balance
                </Typography>
                <Typography variant='h6' color={data.remainingBalance > 0 ? 'error.main' : 'success.main'}>
                  {formatCurrency(data.remainingBalance || 0)}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Payment Status
                </Typography>
                <Chip
                  label={data.paymentStatus || 'UNPAID'}
                  color={getPaymentStatusColor(data.paymentStatus)}
                  size='small'
                  variant='outlined'
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Payment History */}
        {data.paymentDetails && data.paymentDetails.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant='h6' className='mb-4 font-medium'>
                Payment History ({data.paymentDetails.length})
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment Date</TableCell>
                      <TableCell align='right'>Amount Paid</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.paymentDetails.map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {formatDate(payment.date)}
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' color='success.main' fontWeight='medium'>
                            {formatCurrency(payment.amountPaid)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box className='mt-3 pt-3 border-t'>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Cash Payment
                    </Typography>
                    <Typography variant='body1' fontWeight='medium'>
                      {formatCurrency(data.cash || 0)}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Credit Payment
                    </Typography>
                    <Typography variant='body1' fontWeight='medium'>
                      {formatCurrency(data.credit || 0)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    )
  }

  // Render purchase invoice details
  const renderPurchaseInvoiceDetails = (data) => {
    if (!data) return null

    return (
      <Box>
        {/* Supplier Information */}
        <Card className='mb-6'>
          <CardContent>
            <Typography variant='h6' className='mb-4 font-medium'>
              Supplier Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={6}>
                <Typography variant='body2' color='text.secondary'>
                  Brand
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {data.brandId?.brandName || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant='body2' color='text.secondary'>
                  Vendor
                </Typography>
                <Typography variant='body1'>
                  {data.vendorId?.vendorName || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Purchase Information */}
        <Card className='mb-6'>
          <CardContent>
            <Typography variant='h6' className='mb-4 font-medium'>
              Purchase Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Invoice Number
                </Typography>
                <Typography variant='body1' fontWeight='medium'>
                  {data.invoiceNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Date
                </Typography>
                <Typography variant='body1'>
                  {formatDate(data.date)}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Payment Status
                </Typography>
                <Chip
                  label={data.paymentStatus || 'UNPAID'}
                  color={getPaymentStatusColor(data.paymentStatus)}
                  size='small'
                  variant='outlined'
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Products */}
        {data.products && data.products.length > 0 && (
          <Card className='mb-6'>
            <CardContent>
              <Typography variant='h6' className='mb-4 font-medium'>
                Products ({data.products.length})
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align='right'>Cartons</TableCell>
                      <TableCell align='right'>Pieces</TableCell>
                      <TableCell align='right'>Rate</TableCell>
                      <TableCell align='right'>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <Typography variant='body2' fontWeight='medium'>
                              {product.productName || 'N/A'}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              Batch: {product.batchNumber || 'N/A'}
                            </Typography>
                          </div>
                        </TableCell>
                        <TableCell align='right'>
                          {product.cartons || 0}
                        </TableCell>
                        <TableCell align='right'>
                          {product.pieces || 0}
                        </TableCell>
                        <TableCell align='right'>
                          {formatCurrency(product.invoicePrice || 0)}
                        </TableCell>
                        <TableCell align='right'>
                          {formatCurrency(product.totalAmount || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Financial Summary */}
        <Card className='mb-6'>
          <CardContent>
            <Typography variant='h6' className='mb-4 font-medium'>
              Financial Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Gross Total
                </Typography>
                <Typography variant='h6'>
                  {formatCurrency(data.grossTotal || 0)}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Total Discount
                </Typography>
                <Typography variant='h6'>
                  {formatCurrency((data.flatDiscount || 0) + (data.specialDiscount || 0))}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Total Amount
                </Typography>
                <Typography variant='h6' color='error.main'>
                  {formatCurrency(data.grandTotal || 0)}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Total Paid
                </Typography>
                <Typography variant='h6' color='info.main'>
                  {formatCurrency(data.totalPaid || 0)}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Remaining Balance
                </Typography>
                <Typography variant='h6' color={data.remainingBalance > 0 ? 'error.main' : 'success.main'}>
                  {formatCurrency(data.remainingBalance || 0)}
                </Typography>
              </Grid>
              <Grid size={4}>
                <Typography variant='body2' color='text.secondary'>
                  Payment Status
                </Typography>
                <Chip
                  label={data.paymentStatus || 'UNPAID'}
                  color={getPaymentStatusColor(data.paymentStatus)}
                  size='small'
                  variant='outlined'
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Payment History */}
        {data.paymentDetails && data.paymentDetails.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant='h6' className='mb-4 font-medium'>
                Payment History ({data.paymentDetails.length})
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment Date</TableCell>
                      <TableCell align='right'>Amount Paid</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.paymentDetails.map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {formatDate(payment.date)}
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='body2' color='success.main' fontWeight='medium'>
                            {formatCurrency(payment.amountPaid)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box className='mt-3 pt-3 border-t'>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Cash Paid
                    </Typography>
                    <Typography variant='body1' fontWeight='medium'>
                      {formatCurrency(data.cashPaid || 0)}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Credit Amount
                    </Typography>
                    <Typography variant='body1' fontWeight='medium'>
                      {formatCurrency(data.creditAmount || 0)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    )
  }

  // Render expense details
  const renderExpenseDetails = (data) => {
    if (!data) return null

    return (
      <Box>
        {/* Expense Information */}
        <Card className='mb-6'>
          <CardContent>
            <Typography variant='h6' className='mb-4 font-medium'>
              Expense Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={6}>
                <Typography variant='body2' color='text.secondary'>
                  Category
                </Typography>
                <Chip
                  label={data.expenseCategory || 'N/A'}
                  color='error'
                  size='small'
                  variant='outlined'
                />
              </Grid>
              <Grid size={6}>
                <Typography variant='body2' color='text.secondary'>
                  Date
                </Typography>
                <Typography variant='body1'>
                  {formatDate(data.date)}
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant='body2' color='text.secondary'>
                  Description
                </Typography>
                <Typography variant='body1'>
                  {data.description || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardContent>
            <Typography variant='h6' className='mb-4 font-medium'>
              Financial Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid size={6}>
                <Typography variant='body2' color='text.secondary'>
                  Amount
                </Typography>
                <Typography variant='h6' color='error.main'>
                  {formatCurrency(data.amount || 0)}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant='body2' color='text.secondary'>
                  Status
                </Typography>
                <Chip
                  label={data.isActive ? 'Active' : 'Inactive'}
                  color={data.isActive ? 'success' : 'error'}
                  size='small'
                  variant='outlined'
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // Render content based on transaction type
  const renderTransactionDetails = () => {
    if (detailsLoading) {
      return (
        <Box className='flex justify-center items-center p-8'>
          <CircularProgress />
          <Typography variant='body1' className='ml-3'>
            Loading transaction details...
          </Typography>
        </Box>
      )
    }

    if (detailsError) {
      return (
        <Box className='p-6'>
          <Typography variant='h6' color='error'>
            Error loading transaction details
          </Typography>
          <Typography variant='body2' color='text.secondary' className='mt-2'>
            {detailsError.message}
          </Typography>
          {detailsError.response?.data?.message && (
            <Typography variant='caption' color='error' className='mt-1 block'>
              Server: {detailsError.response.data.message}
            </Typography>
          )}
          <Typography variant='caption' color='text.secondary' className='mt-2 block'>
            Endpoint: {endpoint}
          </Typography>
        </Box>
      )
    }

    if (!detailsData?.result) {
      return (
        <Box className='p-6'>
          <Typography variant='body2' color='text.secondary'>
            No details available for this transaction
          </Typography>
        </Box>
      )
    }

    switch (type) {
      case 'sales':
        return renderSalesInvoiceDetails(detailsData.result)
      case 'purchase':
        return renderPurchaseInvoiceDetails(detailsData.result)
      case 'expense':
        return renderExpenseDetails(detailsData.result)
      default:
        return (
          <Box className='p-6'>
            <Typography variant='body2' color='text.secondary'>
              Unknown transaction type
            </Typography>
          </Box>
        )
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogTitle className='flex justify-between items-center pbs-16 pbe-6 pli-16'>
        <div>
          <Typography variant='h4'>
            Transaction Details
          </Typography>
          {transaction && (
            <div className='flex items-center gap-2 mt-2'>
              <Chip
                label={transaction.transactionType?.replace('_', ' ')}
                color={getTransactionTypeColor(transaction.transactionType)}
                size='small'
                variant='outlined'
              />
              <Typography variant='body2' color='text.secondary'>
                {transaction.referenceNumber}
              </Typography>
            </div>
          )}
        </div>
        <IconButton onClick={onClose} size='small'>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </DialogTitle>

      <DialogContent className='pbs-0 pli-16 pbe-16'>
        {renderTransactionDetails()}
      </DialogContent>

      <DialogActions className='justify-center pbs-0 pbe-16 pli-16'>
        <Button onClick={onClose} variant='contained'>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TransactionDetailModal
