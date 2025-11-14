'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
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

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

const LedgerSummaryCards = ({
  summaryData,
  dateRange,
  onDateRangeChange,
  onPredefinedDateRange,
  predefinedRanges
}) => {
  const [dateMenuAnchor, setDateMenuAnchor] = useState(null)

  const handleDateMenuOpen = (event) => {
    setDateMenuAnchor(event.currentTarget)
  }

  const handleDateMenuClose = () => {
    setDateMenuAnchor(null)
  }

  const handlePredefinedRangeSelect = (rangeKey) => {
    onPredefinedDateRange(rangeKey)
    handleDateMenuClose()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const summaryCards = [

    {
      title: 'Total Receivables',
      value: formatCurrency(summaryData?.totalReceivables),
      subtitle: 'Amount Yet to Receive',
      icon: 'tabler-clock',
      color: 'success',
      // trend: '-5.2%',
      // trendColor: 'error'
    },
    {
      title: 'Total Received Cash',
      value: formatCurrency(summaryData?.totalCashReceived),
      subtitle: 'Cash Received from Sales',
      icon: 'tabler-currency-rupee',
      color: 'warning',
      // trend: '+12.5%',
      // trendColor: 'success'
    },
    {
      title: 'Total Sales',
      value: formatCurrency(summaryData?.totalSales),
      subtitle: 'Sales Revenue',
      icon: 'tabler-shopping-cart',
      color: 'info',
      // trend: '+18.2%',
      // trendColor: 'success'
    },
    {
      title: 'Total Payable',
      value: formatCurrency(summaryData?.totalPayables),
      subtitle: 'Outstanding Amount Purchases',
      icon: 'tabler-credit-card',
      color: 'error',
      // trend: '+8.1%',
      // trendColor: 'warning'
    },
    {
      title: 'Total Purchases',
      value: formatCurrency(summaryData?.totalPurchases),
      subtitle: 'Purchase Cost',
      icon: 'tabler-package',
      color: 'secondary',
      // trend: '+9.4%',
      // trendColor: 'warning'
    },
    {
      title: 'Net Profit',
      value: formatCurrency(summaryData?.netProfit),
      subtitle: 'Profit/Loss',
      icon: 'tabler-trending-up',
      color: summaryData?.netProfit >= 0 ? 'success' : 'error',
      // trend: summaryData?.netProfit >= 0 ? '+15.3%' : '-12.7%',
      // trendColor: summaryData?.netProfit >= 0 ? 'success' : 'error'
    },
  ]

  return (
    <Card>
      <CardContent className='p-6'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <div>
            <Typography variant='h5' component='h2' className='mb-1'>
              Financial Summary
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
            </Typography>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outlined'
              size='small'
              onClick={handleDateMenuOpen}
              startIcon={<i className='tabler-calendar' />}
            >
              Quick Select
            </Button>
            <IconButton size='small'>
              <i className='tabler-refresh' />
            </IconButton>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <Grid container spacing={4}>
          {summaryCards.map((card, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <Card
                className='h-full border-l-4'
                sx={{
                  borderLeftColor: `${card.color}.main`,
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between mb-3'>
                    <CustomAvatar
                      skin='light'
                      color={card.color}
                      size={40}
                    >
                      <i className={card.icon} />
                    </CustomAvatar>
                    {/* <Chip
                      label={card.trend}
                      color={card.trendColor}
                      variant='outlined'
                      size='small'
                    /> */}
                  </div>

                  <Typography variant='h6' className='mb-1 font-semibold'>
                    {card.value}
                  </Typography>

                  <Typography variant='body2' color='text.secondary' className='mb-2'>
                    {card.title}
                  </Typography>

                  <Typography variant='caption' color='text.secondary'>
                    {card.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Additional Stats */}
        {summaryData && (
          <Box className='mt-6 pt-6 border-t border-divider'>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <div className='text-center'>
                  <Typography variant='h6' color='text.primary' className='font-semibold'>
                    {summaryData.totalTransactions || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Transactions
                  </Typography>
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <div className='text-center'>
                  <Typography variant='h6' color='success.main' className='font-semibold'>
                    {summaryData.paidTransactions || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Paid Transactions
                  </Typography>
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <div className='text-center'>
                  <Typography variant='h6' color='warning.main' className='font-semibold'>
                    {summaryData.partialTransactions || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Partial Payments
                  </Typography>
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <div className='text-center'>
                  <Typography variant='h6' color='error.main' className='font-semibold'>
                    {summaryData.unpaidTransactions || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Unpaid Transactions
                  </Typography>
                </div>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>

      {/* Date Range Menu */}
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
    </Card>
  )
}

export default LedgerSummaryCards
