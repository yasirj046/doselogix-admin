'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import { useTheme } from '@mui/material/styles'

// Service Import
import { dashboardService } from '@/services/dashboardService'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// Utility function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0)
}

const InvoiceBreakdownChart = ({ dateFilter }) => {
  // Hooks
  const theme = useTheme()

  // Fetch invoice breakdown data
  const { data, isLoading, isError } = dashboardService.getInvoiceBreakdown('dashboard-invoice-breakdown', {
    startDate: dateFilter?.startDate,
    endDate: dateFilter?.endDate
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Invoice Breakdown - Cash vs Credit' />
        <CardContent className='flex justify-center items-center' style={{ minHeight: '400px' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader title='Invoice Breakdown - Cash vs Credit' />
        <CardContent>
          <Typography color='error'>Failed to load invoice breakdown data</Typography>
        </CardContent>
      </Card>
    )
  }

  const breakdownData = data?.data?.data || {}

  const cashAmount = breakdownData.cash?.amount || 0
  const creditAmount = breakdownData.credit?.amount || 0
  const totalAmount = breakdownData.total || 0

  const chartOptions = {
    chart: {
      type: 'donut'
    },
    labels: ['Cash', 'Credit'],
    colors: ['var(--mui-palette-success-main)', 'var(--mui-palette-warning-main)'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--mui-palette-text-primary)'
            },
            value: {
              show: true,
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--mui-palette-text-primary)',
              formatter: function (value) {
                return formatCurrency(value)
              }
            },
            total: {
              show: true,
              label: 'Total Sales',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--mui-palette-text-secondary)',
              formatter: function () {
                return formatCurrency(totalAmount)
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return `${val.toFixed(1)}%`
      },
      style: {
        fontSize: '14px',
        fontWeight: 600,
        colors: ['#fff']
      }
    },
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '14px',
      labels: {
        colors: 'var(--mui-palette-text-primary)'
      },
      markers: {
        width: 12,
        height: 12,
        radius: 12
      },
      itemMargin: {
        horizontal: 15,
        vertical: 8
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: function (value) {
          return formatCurrency(value)
        }
      }
    }
  }

  const series = [cashAmount, creditAmount]

  return (
    <Card>
      <CardHeader
        title='Invoice Breakdown - Cash vs Credit'
        subheader='Payment method distribution'
      />
      <CardContent>
        {totalAmount === 0 ? (
          <Box className='flex justify-center items-center' style={{ minHeight: '300px' }}>
            <Typography color='text.secondary'>No invoice data available for selected period</Typography>
          </Box>
        ) : (
          <>
            <AppReactApexCharts
              type='donut'
              height={400}
              options={chartOptions}
              series={series}
            />
            <Grid container spacing={4} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <Box className='flex flex-col items-center gap-1 p-4'
                  sx={{
                    backgroundColor: 'var(--mui-palette-success-lightOpacity)',
                    borderRadius: 2
                  }}
                >
                  <Typography variant='h6' color='success.main' fontWeight={700}>
                    {formatCurrency(cashAmount)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Cash Sales
                  </Typography>
                  <Typography variant='caption' color='text.disabled'>
                    {breakdownData.cash?.percentage?.toFixed(1) || 0}% of total
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box className='flex flex-col items-center gap-1 p-4'
                  sx={{
                    backgroundColor: 'var(--mui-palette-warning-lightOpacity)',
                    borderRadius: 2
                  }}
                >
                  <Typography variant='h6' color='warning.main' fontWeight={700}>
                    {formatCurrency(creditAmount)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Credit Sales
                  </Typography>
                  <Typography variant='caption' color='text.disabled'>
                    {breakdownData.credit?.percentage?.toFixed(1) || 0}% of total
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default InvoiceBreakdownChart
