'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import Grid from '@mui/material/Grid2'

// Component Imports
import CustomDatePicker from '@/components/custom-components/CustomDatePicker'

const LedgerFilters = ({ 
  dateRange, 
  filters, 
  onDateRangeChange, 
  onFilterChange, 
  onPredefinedDateRange, 
  predefinedRanges 
}) => {
  const [dateMenuAnchor, setDateMenuAnchor] = useState(null)
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null)

  const handleDateMenuOpen = (event) => {
    setDateMenuAnchor(event.currentTarget)
  }

  const handleDateMenuClose = () => {
    setDateMenuAnchor(null)
  }

  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget)
  }

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null)
  }

  const handlePredefinedRangeSelect = (rangeKey) => {
    onPredefinedDateRange(rangeKey)
    handleDateMenuClose()
  }

  const handleStartDateChange = (date) => {
    onDateRangeChange({
      ...dateRange,
      startDate: date
    })
  }

  const handleEndDateChange = (date) => {
    onDateRangeChange({
      ...dateRange,
      endDate: date
    })
  }

  const handleFilterChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value
    })
  }

  const clearFilters = () => {
    onFilterChange({
      transactionType: '',
      customerId: '',
      paymentStatus: ''
    })
    handleFilterMenuClose()
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length
  }

  return (
    <Card>
      <CardContent className='p-6'>
        {/* Header */}
        <div className='flex justify-between items-center mb-4'>
          <Typography variant='h6' component='h3'>
            Filters & Date Range
          </Typography>
          <div className='flex items-center gap-2'>
            {getActiveFiltersCount() > 0 && (
              <Chip
                label={`${getActiveFiltersCount()} filters active`}
                color='primary'
                variant='outlined'
                size='small'
              />
            )}
            <Button
              variant='outlined'
              size='small'
              onClick={handleFilterMenuOpen}
              startIcon={<i className='tabler-filter' />}
            >
              Filters
            </Button>
            <Button
              variant='outlined'
              size='small'
              onClick={handleDateMenuOpen}
              startIcon={<i className='tabler-calendar' />}
            >
              Quick Select
            </Button>
          </div>
        </div>

        {/* Date Range Selection */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <CustomDatePicker
              label='Start Date'
              selected={dateRange.startDate}
              onChange={handleStartDateChange}
              dateFormat='dd/MM/yyyy'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <CustomDatePicker
              label='End Date'
              selected={dateRange.endDate}
              onChange={handleEndDateChange}
              dateFormat='dd/MM/yyyy'
            />
          </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={filters.transactionType}
                  label='Transaction Type'
                  onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                >
                  <MenuItem value=''>All Types</MenuItem>
                  <MenuItem value='SALES_INVOICE'>Sales Invoice</MenuItem>
                  <MenuItem value='PURCHASE_INVOICE'>Purchase Invoice</MenuItem>
                  <MenuItem value='EXPENSE'>Expense</MenuItem>
                  <MenuItem value='PAYMENT_RECEIVED'>Payment Received</MenuItem>
                  <MenuItem value='PAYMENT_MADE'>Payment Made</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={filters.paymentStatus}
                  label='Payment Status'
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                >
                  <MenuItem value=''>All Status</MenuItem>
                  <MenuItem value='PAID'>Paid</MenuItem>
                  <MenuItem value='PARTIAL'>Partial</MenuItem>
                  <MenuItem value='UNPAID'>Unpaid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <Box className='mt-4 pt-4 border-t border-divider'>
            <Typography variant='body2' color='text.secondary' className='mb-2'>
              Active Filters:
            </Typography>
            <div className='flex flex-wrap gap-2'>
              {filters.transactionType && (
                <Chip
                  label={`Type: ${filters.transactionType.replace('_', ' ')}`}
                  onDelete={() => handleFilterChange('transactionType', '')}
                  color='primary'
                  variant='outlined'
                  size='small'
                />
              )}
              {filters.paymentStatus && (
                <Chip
                  label={`Status: ${filters.paymentStatus}`}
                  onDelete={() => handleFilterChange('paymentStatus', '')}
                  color='secondary'
                  variant='outlined'
                  size='small'
                />
              )}
              {filters.customerId && (
                <Chip
                  label={`Customer: ${filters.customerId}`}
                  onDelete={() => handleFilterChange('customerId', '')}
                  color='info'
                  variant='outlined'
                  size='small'
                />
              )}
            </div>
          </Box>
        )}
      </CardContent>

      {/* Quick Date Range Menu */}
      <Menu
        anchorEl={dateMenuAnchor}
        open={Boolean(dateMenuAnchor)}
        onClose={handleDateMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {Object.entries(predefinedRanges || {}).map(([key, range]) => (
          <MenuItem key={key} onClick={() => handlePredefinedRangeSelect(key)}>
            <i className='tabler-calendar mr-2' />
            {range.label}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleDateMenuClose}>
          <i className='tabler-calendar-off mr-2' />
          Custom Range
        </MenuItem>
      </Menu>

      {/* Filter Options Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={clearFilters}>
          <i className='tabler-filter-off mr-2' />
          Clear All Filters
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleFilterMenuClose}>
          <i className='tabler-filter mr-2' />
          More Filter Options
        </MenuItem>
      </Menu>
    </Card>
  )
}

export default LedgerFilters
