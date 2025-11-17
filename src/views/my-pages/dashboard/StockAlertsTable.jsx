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

const StockAlertsTable = () => {
  // State for filters
  const [alertFilter, setAlertFilter] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch stock alerts data
  const { data, isLoading, isError } = dashboardService.getStockAlerts('dashboard-stock-alerts', {
    limit: 50
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Stock Alerts' />
        <CardContent className='flex justify-center items-center' style={{ minHeight: '400px', maxHeight: '400px' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader title='Stock Alerts' />
        <CardContent>
          <Typography color='error'>Failed to load stock alerts data</Typography>
        </CardContent>
      </Card>
    )
  }

  const stockAlerts = data?.data?.data || []

  const getAlertSeverity = (alertType) => {
    switch (alertType) {
      case 'Critical':
        return 'error'
      case 'Warning':
        return 'warning'
      case 'Low':
        return 'info'
      default:
        return 'default'
    }
  }

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'Critical':
        return 'tabler-alert-circle-filled'
      case 'Warning':
        return 'tabler-alert-triangle-filled'
      case 'Low':
        return 'tabler-info-circle-filled'
      default:
        return 'tabler-info-circle'
    }
  }

  // Filter logic
  const filteredAlerts = stockAlerts.filter(item => {
    const matchesAlert = alertFilter === 'All' || item.alertType === alertFilter
    const matchesSearch = searchTerm === '' ||
      (item.productName && item.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.brandName && item.brandName.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesAlert && matchesSearch
  })

  return (
    <Card>
      <CardHeader
        title='Stock Alerts'
        subheader='Products requiring immediate attention'
      />
      <CardContent>
        {/* Filters */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size='small'
              placeholder='Search by product or brand...'
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
              label='Alert Level'
              value={alertFilter}
              onChange={(e) => setAlertFilter(e.target.value)}
            >
              <MenuItem value='All'>All Alerts</MenuItem>
              <MenuItem value='Critical'>Critical</MenuItem>
              <MenuItem value='Warning'>Warning</MenuItem>
              <MenuItem value='Low'>Low</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {filteredAlerts.length === 0 ? (
          <Box className='flex flex-col justify-center items-center gap-4' style={{ minHeight: '300px' }}>
            <Icon icon='tabler-check-circle' fontSize={64} color='var(--mui-palette-success-main)' />
            <Typography variant='h6' color='success.main'>
              {stockAlerts.length === 0 ? 'All Stock Levels Healthy' : 'No Results Found'}
            </Typography>
            <Typography color='text.secondary'>
              {stockAlerts.length === 0
                ? 'No products require restocking at this time'
                : 'Try adjusting your filters'}
            </Typography>
          </Box>
        ) : (
          <>
            <Alert severity='warning' icon={<Icon icon='tabler-alert-triangle' />} sx={{ mb: 4 }}>
              {filteredAlerts.length} product{filteredAlerts.length !== 1 ? 's' : ''} need immediate attention
            </Alert>
            <TableContainer sx={{ maxHeight: 440, overflow: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Brand</TableCell>
                    <TableCell align='center'>Current Stock</TableCell>
                    <TableCell align='center'>Batches</TableCell>
                    <TableCell align='center'>Alert</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAlerts.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant='body2' fontWeight={600}>
                          {item.productName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {item.brandName}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          label={item.currentStock}
                          size='small'
                          color={item.currentStock === 0 ? 'error' : 'default'}
                          variant='tonal'
                        />
                      </TableCell>
                      <TableCell align='center'>
                        <Typography variant='body2' color='text.secondary'>
                          {item.batchCount}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          icon={<Icon icon={getAlertIcon(item.alertType)} />}
                          label={item.alertType}
                          size='small'
                          color={getAlertSeverity(item.alertType)}
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

export default StockAlertsTable
