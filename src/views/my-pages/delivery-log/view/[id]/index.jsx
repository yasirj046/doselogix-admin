'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'

// Third-party Imports
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

// Service Imports
import { deliveryLogService } from '@/services/deliveryLogService'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Styled Components
const Icon = styled('i')({})

const ViewDeliveryLogPage = () => {
  const router = useRouter()
  const params = useParams()
  const logId = params?.id
  const queryClient = useQueryClient()

  // Get delivery log data
  const {
    data: deliveryLogDetails,
    isLoading: isLoadingDeliveryLog,
    error: deliveryLogError
  } = deliveryLogService.getDeliveryLogById('get-delivery-log-by-id', logId)

  // Recalculate mutation
  const recalculateMutation = deliveryLogService.recalculateTotal()

  // Handle recalculate success/error
  useEffect(() => {
    if (recalculateMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['get-delivery-log-by-id', logId] })
      toast.success('Total recalculated successfully')
    }
    if (recalculateMutation.isError) {
      console.error('Recalculate error:', recalculateMutation.error)
      toast.error('Failed to recalculate total')
    }
  }, [recalculateMutation.isSuccess, recalculateMutation.isError, recalculateMutation.error, queryClient, logId])

  // Auto recalculate on load
  useEffect(() => {
    if (deliveryLogDetails?.data?.success && deliveryLogDetails.data.result) {
      handleRecalculate()
    }
  }, [deliveryLogDetails?.data?.success])

  const handleBack = () => {
    router.push(getLocalizedUrl('/delivery-log', params.lang))
  }

  const handlePrint = () => {
    router.push(getLocalizedUrl(`/delivery-log/print/${logId}`, params.lang))
  }

  const handleRecalculate = () => {
    recalculateMutation.mutate(logId)
  }

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success'
      case 'partial':
        return 'warning'
      case 'unpaid':
        return 'error'
      default:
        return 'default'
    }
  }

  if (isLoadingDeliveryLog) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  if (deliveryLogError || !deliveryLogDetails?.data?.success) {
    return (
      <Card>
        <CardContent>
          <Typography color='error'>
            {deliveryLogError?.message || 'Failed to load delivery log details'}
          </Typography>
          <Button onClick={handleBack} variant='contained' className='mt-4'>
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  const deliveryLog = deliveryLogDetails.data.result

  return (
    <Grid container spacing={6}>
      {/* Header Card */}
      <Grid size={12}>
        <Card>
          <CardHeader
            title={
              <Box display='flex' alignItems='center' gap={2}>
                <IconButton onClick={handleBack}>
                  <Icon className='tabler-arrow-left' />
                </IconButton>
                <Typography variant='h5'>Delivery Log Details</Typography>
              </Box>
            }
            action={
              <Box display='flex' gap={2}>
                <Button
                  variant='outlined'
                  startIcon={<Icon className='tabler-refresh' />}
                  onClick={handleRecalculate}
                  disabled={recalculateMutation.isPending}
                >
                  Recalculate Total
                </Button>
                <Button
                  variant='contained'
                  startIcon={<Icon className='tabler-printer' />}
                  onClick={handlePrint}
                >
                  Print
                </Button>
              </Box>
            }
          />
          <Divider />
          <CardContent>
            <Grid container spacing={4}>
              {/* Delivery Log Number */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant='body2' color='text.secondary' className='mb-1'>
                  Log Number
                </Typography>
                <Typography variant='h6' color='primary'>
                  {deliveryLog.deliveryLogNumber || 'N/A'}
                </Typography>
              </Grid>

              {/* Date */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant='body2' color='text.secondary' className='mb-1'>
                  Date
                </Typography>
                <Typography variant='h6'>
                  {deliveryLog.date
                    ? new Date(deliveryLog.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </Typography>
              </Grid>

              {/* Salesman */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant='body2' color='text.secondary' className='mb-1'>
                  Salesman
                </Typography>
                <Typography variant='h6'>
                  {deliveryLog.salesmanId?.employeeName || 'N/A'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {deliveryLog.salesmanId?.employeeDesignation || 'Employee'}
                </Typography>
              </Grid>

              {/* Total Amount */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant='body2' color='text.secondary' className='mb-1'>
                  Total Amount
                </Typography>
                <Typography variant='h5' color='success.main'>
                  ₨{deliveryLog.totalAmount?.toLocaleString() || '0'}
                </Typography>
              </Grid>

              {/* Vendor */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant='body2' color='text.secondary' className='mb-1'>
                  Vendor
                </Typography>
                <Typography variant='body1'>
                  {deliveryLog.vendorId?.vendorName || 'N/A'}
                </Typography>
              </Grid>

              {/* Number of Invoices */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant='body2' color='text.secondary' className='mb-1'>
                  Number of Invoices
                </Typography>
                <Chip
                  label={`${deliveryLog.invoices?.length || 0} Invoice${
                    deliveryLog.invoices?.length !== 1 ? 's' : ''
                  }`}
                  color='info'
                  variant='tonal'
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Linked Invoices */}
      <Grid size={12}>
        <Card>
          <CardHeader
            title={<Typography variant='h6'>Linked Invoices</Typography>}
          />
          <Divider />
          <CardContent>
            {deliveryLog.invoices && deliveryLog.invoices.length > 0 ? (
              deliveryLog.invoices.map((invoice, index) => (
                <Box key={invoice._id} mb={4}>
                  {/* Invoice Header */}
                  <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                    <Box>
                      <Typography variant='h6' color='primary'>
                        Invoice {index + 1}
                      </Typography>
                    </Box>
                    <Box display='flex' gap={4} alignItems='center'>
                      <Typography variant='body1'>
                        <strong>Invoice Number:</strong> {invoice.salesInvoiceNumber || 'N/A'}
                      </Typography>
                      <Typography variant='body1'>
                        <strong>Invoice Date:</strong> {invoice.date
                          ? new Date(invoice.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />


                  {/* Customer and financials information */}
                  <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='flex-start' mb={2}>

                    {/* Customer and Area (left) */}
                    <Box display='flex' flexDirection='column' gap={2} flex={1}>
                      <Typography variant='body1'>
                        <strong>Customer:</strong> {invoice.customerId?.customerName || 'N/A'}
                      </Typography>
                      <Typography variant='body1'>
                        <strong>Area:</strong> {invoice.customerId?.customerCity || 'N/A'}
                      </Typography>
                      <Box display = 'flex' flexDirection='row' gap={2}>
                        <Typography variant='body1'>
                          <strong>Payment Status:</strong>
                        </Typography>
                        <Chip
                          label={invoice.paymentStatus || 'Unknown'}
                          color={getPaymentStatusColor(invoice.paymentStatus)}
                          variant='tonal'
                          size='small'
                        />
                      </Box>
                    </Box>

                    {/* Financial Summary (right) */}
                    <Box display='flex' flexDirection='column' gap={2} alignItems='flex-end' sx={{ minWidth: 220 }}>
                      <Typography variant='body1'>
                        <strong>Total Amount:</strong> ₨{invoice.grandTotal?.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant='body1'>
                        <strong>Credit Amount:</strong> ₨{invoice.credit?.toLocaleString() || '0'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Medicines List */}
                  <Typography variant='h6' mb={2}>Medicines:</Typography>
                  {invoice.salesProducts && invoice.salesProducts.length > 0 ? (
                    <Box mb={3}>
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>#</TableCell>
                              <TableCell>Product Name</TableCell>
                              <TableCell>Batch #</TableCell>
                              <TableCell>Quantity</TableCell>
                              <TableCell>Bonus</TableCell>
                              <TableCell>Price</TableCell>
                              <TableCell>Discount</TableCell>
                              <TableCell>Total</TableCell>
                              {/* <TableCell>Paid</TableCell>
                              <TableCell>Balance (Credit)</TableCell> */}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {invoice.salesProducts.map((product, prodIndex) => {
                              const proratedPaid = invoice.grandTotal > 0 ? ((product.totalAmount / invoice.grandTotal) * (invoice.totalPaid || 0)) : 0
                              const balance = (product.totalAmount || 0) - proratedPaid
                              return (
                                <TableRow key={product._id}>
                                  <TableCell>{prodIndex + 1}</TableCell>
                                  <TableCell>{product.productId?.productName || product.productName || 'N/A'}</TableCell>
                                  <TableCell>{product.batchNumber || 'N/A'}</TableCell>
                                  <TableCell>{product.quantity || 0}</TableCell>
                                  <TableCell>{product.bonus || 0}</TableCell>
                                  <TableCell>₨{product.price?.toLocaleString() || '0'}</TableCell>
                                  <TableCell>₨{((product.percentageDiscount ? (product.quantity * product.price * product.percentageDiscount / 100) : 0) + (product.flatDiscount || 0))?.toLocaleString() || '0'}</TableCell>
                                  <TableCell>₨{product.totalAmount?.toLocaleString() || '0'}</TableCell>
                                  {/* <TableCell>₨{proratedPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                  <TableCell>₨{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell> */}
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Divider sx={{ my: 2 }} />
                      <Box display='flex' justifyContent='space-between' alignItems='center'>
                        <Typography variant='body1' fontWeight='bold'>
                          Grand Total: ₨{invoice.grandTotal?.toLocaleString() || '0'}
                        </Typography>
                        <Typography variant='body1' fontWeight='bold'>
                          Paid: ₨{invoice.totalPaid?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </Typography>
                        <Typography variant='body1' fontWeight='bold'>
                          Balance: ₨{((invoice.grandTotal || 0) - (invoice.totalPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant='body2' color='text.secondary' mb={3}>
                      No medicines found in this invoice
                    </Typography>
                  )}

                  {index < deliveryLog.invoices.length - 1 && <Divider sx={{ my: 3 }} />}
                </Box>
              ))
            ) : (
              <Typography color='text.secondary'>No invoices found in this delivery log</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ViewDeliveryLogPage
