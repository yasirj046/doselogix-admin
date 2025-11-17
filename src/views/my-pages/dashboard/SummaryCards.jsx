'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

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

const SummaryCards = () => {
  // Fetch summary cards data
  const { data, isLoading, isError } = dashboardService.getSummaryCards('dashboard-summary-cards')

  if (isLoading) {
    return (
      <Grid container spacing={6}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Card>
              <CardContent className='flex flex-col items-center justify-center gap-4' style={{ minHeight: '160px' }}>
                <CircularProgress />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent>
          <Typography color='error'>Failed to load summary data</Typography>
        </CardContent>
      </Card>
    )
  }

  const summaryData = data?.data?.data || {}

  const cards = [
    {
      title: 'Total Sales Today',
      value: formatCurrency(summaryData.totalSalesToday),
      icon: 'tabler-currency-dollar',
      color: 'primary',
      bgColor: 'primary.main'
    },
    {
      title: 'Invoices Generated Today',
      value: summaryData.invoicesGeneratedToday || 0,
      icon: 'tabler-file-invoice',
      color: 'success',
      bgColor: 'success.main'
    },
    {
      title: 'Top Selling Brand',
      value: summaryData.topSellingBrand?.name || 'N/A',
      subtitle: summaryData.topSellingBrand?.sales
        ? formatCurrency(summaryData.topSellingBrand.sales)
        : '',
      icon: 'tabler-award',
      color: 'info',
      bgColor: 'info.main'
    },
    {
      title: 'Pending Receivables (All Time)',
      value: formatCurrency(summaryData.pendingReceivables),
      icon: 'tabler-clock-dollar',
      color: 'warning',
      bgColor: 'warning.main'
    }
  ]

  return (
    <Grid container spacing={6}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', minHeight: '140px' }}>
              <Box className='flex items-start justify-between' sx={{ height: '100%' }}>
                <Box className='flex flex-col gap-1' sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant='h5'
                    color='text.primary'
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {card.value}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {card.title}
                  </Typography>
                  {card.subtitle && (
                    <Typography variant='caption' color='text.disabled'>
                      {card.subtitle}
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    ml: 2
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: `${card.bgColor}`,
                      borderRadius: '50%',
                      width: 44,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.12,
                      position: 'absolute'
                    }}
                  />
                  <Icon
                    icon={card.icon}
                    fontSize={28}
                    style={{
                      color: `var(--mui-palette-${card.color}-main)`,
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default SummaryCards
