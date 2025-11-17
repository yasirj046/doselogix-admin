'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'

// Icon Imports
import { Icon } from '@iconify/react'

// Service Import
import { dashboardService } from '@/services/dashboardService'

const formatDate = (dateString) => {
  const date = new Date(dateString)

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const NearExpiryTable = () => {
  // State for filters
  const [urgencyFilter, setUrgencyFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch near expiry products data
  const { data, isLoading, isError } = dashboardService.getNearExpiryProducts('dashboard-near-expiry', {
    limit: 50
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Products Near Expiry' />
        <CardContent className='flex justify-center items-center' style={{ minHeight: '400px', maxHeight: '400px' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader title='Products Near Expiry' />
        <CardContent>
          <Typography color='error'>Failed to load near expiry products data</Typography>
        </CardContent>
      </Card>
    )
  }

  const expiryProducts = data?.data?.data || []

  const getDaysColor = (urgencyLevel) => {
    switch (urgencyLevel) {
      case 'expired':
        return 'default' // Grey
      case 'critical':
        return 'error' // Red (≤ 90 days / 3 months)
      case 'warning':
        return 'warning' // Yellow (≤ 180 days / 6 months)
      default:
        return 'info'
    }
  }

  const getUrgencyIcon = (urgencyLevel) => {
    switch (urgencyLevel) {
      case 'expired':
        return 'tabler-ban'
      case 'critical':
        return 'tabler-clock-exclamation'
      case 'warning':
        return 'tabler-clock-hour-3'
      default:
        return 'tabler-clock'
    }
  }

  const getUrgencyLabel = (urgencyLevel, daysToExpiry) => {
    if (urgencyLevel === 'expired') {
      return 'Expired'
    }
    return `${daysToExpiry} days`
  }

  // Filter logic
  const filteredProducts = expiryProducts.filter(item => {
    const matchesUrgency = urgencyFilter === 'All' || item.urgencyLevel === urgencyFilter
    const matchesSearch = searchTerm === '' ||
      (item.productName && item.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.brandName && item.brandName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.batchNumber && item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesUrgency && matchesSearch
  })

  return (
    <Card>
      <CardHeader
        title='Products Near Expiry'
        subheader='Products expiring within 6 months (≤180 days)'
      />
      <CardContent>
        {/* Filters */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size='small'
              placeholder='Search by product, brand, or batch...'
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
              label='Urgency Level'
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
            >
              <MenuItem value='All'>All Products</MenuItem>
              <MenuItem value='expired'>Expired</MenuItem>
              <MenuItem value='critical'>Critical (≤90 days)</MenuItem>
              <MenuItem value='warning'>Warning (≤180 days)</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {filteredProducts.length === 0 ? (
          <Box className='flex flex-col justify-center items-center gap-4' style={{ minHeight: '300px' }}>
            <Icon icon='tabler-calendar-check' fontSize={64} color='var(--mui-palette-success-main)' />
            <Typography variant='h6' color='success.main'>
              {expiryProducts.length === 0 ? 'No Products Near Expiry' : 'No Results Found'}
            </Typography>
            <Typography color='text.secondary'>
              {expiryProducts.length === 0
                ? 'All products have sufficient shelf life'
                : 'Try adjusting your filters'}
            </Typography>
          </Box>
        ) : (
          <>
            <Alert severity='warning' icon={<Icon icon='tabler-calendar-clock' />} sx={{ mb: 4 }}>
              {filteredProducts.length} product batch{filteredProducts.length !== 1 ? 'es' : ''} expiring within 6 months
            </Alert>
            <TableContainer sx={{ maxHeight: 440, overflow: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Batch Number</TableCell>
                    <TableCell>Brand</TableCell>
                    <TableCell align='center'>Quantity</TableCell>
                    <TableCell align='center'>Expiry Date</TableCell>
                    <TableCell align='center'>Days Remaining</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant='body2' fontWeight={600}>
                          {item.productName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {item.batchNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {item.brandName}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Typography variant='body2' fontWeight={500}>
                          {item.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Typography variant='body2'>
                          {formatDate(item.expiryDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          icon={<Icon icon={getUrgencyIcon(item.urgencyLevel)} />}
                          label={getUrgencyLabel(item.urgencyLevel, item.daysToExpiry)}
                          size='small'
                          color={getDaysColor(item.urgencyLevel)}
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

export default NearExpiryTable
