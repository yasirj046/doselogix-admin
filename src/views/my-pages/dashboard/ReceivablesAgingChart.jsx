'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'

// Icon Imports
import { Icon } from '@iconify/react'

// Service Import
import { dashboardService } from '@/services/dashboardService'

// Utility function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0)
}

// Utility function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const ReceivablesAgingChart = () => {
  // State for filters
  const [searchTerm, setSearchTerm] = useState('')
  const [ageFilter, setAgeFilter] = useState('All')

  // Fetch receivables aging data
  const { data, isLoading, isError } = dashboardService.getReceivablesAging('dashboard-receivables-aging')

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Receivables Aging Analysis' />
        <CardContent className='flex justify-center items-center' style={{ minHeight: '400px' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader title='Receivables Aging Analysis' />
        <CardContent>
          <Typography color='error'>Failed to load receivables data</Typography>
        </CardContent>
      </Card>
    )
  }

  const invoices = data?.data?.data?.invoices || []
  const totalReceivables = data?.data?.data?.totalReceivables || 0
  const count = data?.data?.data?.count || 0

  // Get age category
  const getAgeCategory = (days) => {
    if (days < 30) return '0-30 days'
    if (days < 60) return '31-60 days'
    if (days < 90) return '61-90 days'
    return '90+ days'
  }

  // Get age color
  const getAgeColor = (days) => {
    if (days < 30) return 'success'
    if (days < 60) return 'warning'
    if (days < 90) return 'error'
    return 'default'
  }

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' ||
      (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoice.customerName && invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()))

    const ageCategory = getAgeCategory(invoice.creditAge)
    const matchesAge = ageFilter === 'All' || ageCategory === ageFilter

    return matchesSearch && matchesAge
  })

  return (
    <Card>
      <CardHeader
        title='Receivables Aging Analysis'
        subheader={`${count} invoice${count !== 1 ? 's' : ''} with outstanding credit - Total: ${formatCurrency(totalReceivables)}`}
      />
      <CardContent>
        {/* Filters */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size='small'
              placeholder='Search by invoice or customer...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Icon icon='tabler-search' style={{ marginRight: 8 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              size='small'
              label='Credit Age'
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
            >
              <MenuItem value='All'>All Ages</MenuItem>
              <MenuItem value='0-30 days'>0-30 days</MenuItem>
              <MenuItem value='31-60 days'>31-60 days</MenuItem>
              <MenuItem value='61-90 days'>61-90 days</MenuItem>
              <MenuItem value='90+ days'>90+ days</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {filteredInvoices.length === 0 ? (
          <Box className='flex flex-col justify-center items-center gap-4' style={{ minHeight: '300px' }}>
            <Icon
              icon='tabler-circle-check'
              fontSize={64}
              color='var(--mui-palette-success-main)'
            />
            <Typography variant='h6' color='success.main'>
              {invoices.length === 0 ? 'No Outstanding Receivables' : 'No Results Found'}
            </Typography>
            <Typography color='text.secondary'>
              {invoices.length === 0
                ? 'All invoices have been fully paid'
                : 'Try adjusting your filters'}
            </Typography>
          </Box>
        ) : (
          <>
            <Alert severity='info' icon={<Icon icon='tabler-info-circle' />} sx={{ mb: 4 }}>
              Showing {filteredInvoices.length} of {count} invoices with outstanding credit
            </Alert>
            <TableContainer sx={{ maxHeight: 440, overflow: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice Number</TableCell>
                    <TableCell>Customer Name</TableCell>
                    <TableCell align='right'>Credited Amount</TableCell>
                    <TableCell align='center'>Credit Age (Days)</TableCell>
                    <TableCell align='center'>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.map((invoice, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant='body2' fontWeight={600}>
                          {invoice.invoiceNumber}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {formatDate(invoice.invoiceDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {invoice.customerName}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' fontWeight={600} color='error.main'>
                          {formatCurrency(invoice.creditedAmount)}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          of {formatCurrency(invoice.grandTotal)}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={`${invoice.creditAge} days`}
                          size='small'
                          color={getAgeColor(invoice.creditAge)}
                          variant='tonal'
                        />
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={getAgeCategory(invoice.creditAge)}
                          size='small'
                          color={getAgeColor(invoice.creditAge)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ReceivablesAgingChart
