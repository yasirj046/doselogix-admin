 'use client'

// React Imports
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'

// Service Imports
import { deliveryLogService } from '@/services/deliveryLogService'

// Styled Components
const PrintContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6),
  maxWidth: '210mm',
  margin: '0 auto',
  backgroundColor: 'primary',
  border: '2px solid #ffffff9e',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  borderRadius: '10px',
  fontSize: '12px',
  lineHeight: 1.4,
  '@media print': {
    padding: theme.spacing(1),
    margin: 0,
    maxWidth: 'none',
    fontSize: '11px',
    '& .no-print': {
      display: 'none !important'
    },
    '& *': {
      color: 'black !important',
      backgroundColor: 'white !important',
      boxShadow: 'none !important'
    }
  }
}))

const PrintDeliveryLogPage = () => {
  const params = useParams()
  const router = useRouter()
  const logId = params?.id

  // Get delivery log data
  const {
    data: deliveryLogDetails,
    isLoading: isLoadingDeliveryLog,
    error: deliveryLogError
  } = deliveryLogService.getDeliveryLogById('get-delivery-log-by-id-print', logId)

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

  const handlePrint = () => {
    // Inject print-only CSS that hides everything except the print container
    try {
      // Avoid duplicating the style tag
      if (!document.getElementById('doselogix-print-style')) {
        const style = document.createElement('style')
        style.id = 'doselogix-print-style'
        style.innerHTML = `
          @media print {
            /* Hide all elements */
            body * { visibility: hidden !important; }
            /* Show only the print container and its children */
            .doselogix-print-only, .doselogix-print-only * { visibility: visible !important; }
            /* Make print container use the page and remove margins */
            .doselogix-print-only { position: absolute !important; left: 0 !important; top: 0 !important; width: 210mm !important; margin: 0 !important; }
            /* Remove backgrounds/shadows for clean print */
            .doselogix-print-only { background: #fff !important; box-shadow: none !important; }
            /* Hide any elements that still may appear */
            .no-print { display: none !important; }
          }
        `
        document.head.appendChild(style)
      }

      // Call print dialog
      window.print()

      // Clean up after printing — some browsers fire onafterprint, otherwise fallback timeout
      const cleanup = () => {
        const s = document.getElementById('doselogix-print-style')
        if (s && s.parentNode) s.parentNode.removeChild(s)
        window.removeEventListener('afterprint', cleanup)
      }

      window.addEventListener('afterprint', cleanup)

      // Fallback cleanup in case afterprint isn't fired
      setTimeout(cleanup, 1500)
    } catch (err) {
      // Fallback to default print if anything goes wrong
      console.error('Print helper error:', err)
      window.print()
    }
  }

  // Site title for print header — read from document.title so we don't need to change
  // the delivery log page code. This will be rendered only for print via sx rules below.
  const [siteTitle, setSiteTitle] = useState('')

  useEffect(() => {
    if (typeof document !== 'undefined') setSiteTitle(document.title || '')
  }, [])

  if (isLoadingDeliveryLog) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
        <CircularProgress />
      </Box>
    )
  }

  if (deliveryLogError || !deliveryLogDetails?.data?.success) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
        <Typography color='error'>
          {deliveryLogError?.message || 'Failed to load delivery log details'}
        </Typography>
      </Box>
    )
  }

  const deliveryLog = deliveryLogDetails.data.result

  return (
    <PrintContainer className='doselogix-print-only'>
      {/* Site title (print-only) - read from document.title so we don't modify delivery log page code */}
      <Box textAlign='center' mb={1} sx={{ display: 'none', '@media print': { display: 'block' } }}>
        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 500 }}>
          {siteTitle || ''}
        </Typography>
      </Box>
      {/* Print Button */}
      <Box display='flex' justifyContent='center' mb={4} className='no-print'>
        <Button
          variant='contained'
          size='large'
          onClick={handlePrint}
          startIcon={<span>🖨️</span>}
        >
          Print Delivery Log
        </Button>
      </Box>

      {/* Header */}
      <Box textAlign='center' mb={4}>
        <Typography variant='h4' fontWeight='bold' gutterBottom>
          Delivery Log Report
        </Typography>
        <Typography variant='h6' color='primary' fontWeight='bold'>
          {deliveryLog.deliveryLogNumber || 'N/A'}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Delivery Log Information */}
      <Box mb={4}>
        <Typography variant='h6' fontWeight='bold' gutterBottom>
          Delivery Information
        </Typography>
        <Box display='grid' gridTemplateColumns='repeat(2, 1fr)' gap={2} mt={2}>
          <Box>
            <Typography variant='body2' color='text.secondary'>
              Date:
            </Typography>
            <Typography variant='body1' fontWeight='medium'>
              {deliveryLog.date
                ? new Date(deliveryLog.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant='body2' color='text.secondary'>
              Vendor:
            </Typography>
            <Typography variant='body1' fontWeight='medium'>
              {deliveryLog.vendorId?.vendorName || 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant='body2' color='text.secondary'>
              Salesman:
            </Typography>
            <Typography variant='body1' fontWeight='medium'>
              {deliveryLog.salesmanId?.employeeName || 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant='body2' color='text.secondary'>
              Designation:
            </Typography>
            <Typography variant='body1' fontWeight='medium'>
              {deliveryLog.salesmanId?.employeeDesignation || 'N/A'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Linked Invoices */}
      <Box mb={4}>
        <Typography variant='h6' fontWeight='bold' gutterBottom>
          Linked Invoices
        </Typography>
        {deliveryLog.invoices && deliveryLog.invoices.length > 0 ? (
          deliveryLog.invoices.map((invoice, index) => (
            <Box key={invoice._id} mb={4} p={2} border='1px solid #e0e0e0' borderRadius={1}>
              {/* Invoice Header */}
              <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                <Box>
                  <Typography variant='h6' color='primary' fontWeight='bold'>
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

                {/* Customer and Area */}
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

                {/* Financial Summary */}
                <Box display='flex' flexDirection='column' alignItems='flex-end' sx={{ minWidth: 220 }} gap={2} mb={0}>
                  <Typography variant='body1'>
                    <strong>Total Amount:</strong> ₨{invoice.grandTotal?.toLocaleString() || '0'}
                  </Typography>
                  <Typography variant='body1'>
                    <strong>Credit Amount:</strong> ₨{invoice.credit?.toLocaleString() || '0'}
                  </Typography>
                </Box>
              </Box>


              {/* Medicines Table */}
              <Typography variant='body1' fontWeight='bold' mb={2}>Medicines:</Typography>
              {invoice.salesProducts && invoice.salesProducts.length > 0 ? (
                <Box mb={3}>
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                    <Table size='small'>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'primary' }}>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '4px' }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '4px' }}>Product Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '4px' }}>Batch #</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '4px' }}>Qty</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '4px' }}>Bonus</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '4px' }}>Price</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '4px' }}>Disc</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '4px' }}>Total</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '4px' }}>Paid</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', padding: '4px' }}>Balance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoice.salesProducts.map((product, prodIndex) => {
                          const proratedPaid = invoice.grandTotal > 0 ? ((product.totalAmount / invoice.grandTotal) * (invoice.totalPaid || 0)) : 0
                          const balance = (product.totalAmount || 0) - proratedPaid
                          return (
                            <TableRow key={product._id}>
                              <TableCell sx={{ fontSize: '10px', padding: '2px' }}>{prodIndex + 1}</TableCell>
                              <TableCell sx={{ fontSize: '10px', padding: '2px' }}>{product.productId?.productName || product.productName || 'N/A'}</TableCell>
                              <TableCell sx={{ fontSize: '10px', padding: '2px' }}>{product.batchNumber || 'N/A'}</TableCell>
                              <TableCell sx={{ fontSize: '10px', padding: '2px' }}>{product.quantity || 0}</TableCell>
                              <TableCell sx={{ fontSize: '10px', padding: '2px' }}>{product.bonus || 0}</TableCell>
                              <TableCell sx={{ fontSize: '10px', padding: '2px' }}>₨{product.price?.toLocaleString() || '0'}</TableCell>
                              <TableCell sx={{ fontSize: '10px', padding: '2px' }}>₨{((product.percentageDiscount ? (product.quantity * product.price * product.percentageDiscount / 100) : 0) + (product.flatDiscount || 0))?.toLocaleString() || '0'}</TableCell>
                              <TableCell sx={{ fontSize: '10px', padding: '2px' }}>₨{product.totalAmount?.toLocaleString() || '0'}</TableCell>
                              <TableCell sx={{ fontSize: '10px', padding: '2px' }}>₨{proratedPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                              <TableCell sx={{ fontSize: '10px', padding: '2px' }}>₨{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Summary */}
      <Box display='flex' justifyContent='space-between' alignItems='center' p={2} bgcolor='primary' borderRadius={1}>
        <Typography variant='h6' fontWeight='bold'>
          Grand Total:
        </Typography>
        <Typography variant='h5' fontWeight='bold' color='success.main'>
          ₨{deliveryLog.totalAmount?.toLocaleString() || '0'}
        </Typography>
      </Box>

      {/* Footer */}
      <Box mt={6} textAlign='center'>
        <Typography variant='body2' color='text.secondary'>
          Total Invoices: {deliveryLog.invoices?.length || 0}
        </Typography>
        <Typography variant='body2' color='text.secondary' mt={1}>
          Printed on: {new Date().toLocaleString()}
        </Typography>
      </Box>

      {/* Signatures */}
      <Box display='grid' gridTemplateColumns='repeat(2, 1fr)' gap={4} mt={8}>
        <Box>
          <Divider sx={{ mb: 1 }} />
          <Typography variant='body2' textAlign='center'>
            Prepared By
          </Typography>
        </Box>
        <Box>
          <Divider sx={{ mb: 1 }} />
          <Typography variant='body2' textAlign='center'>
            Received By
          </Typography>
        </Box>
      </Box>
    </PrintContainer>
  )
}

export default PrintDeliveryLogPage
