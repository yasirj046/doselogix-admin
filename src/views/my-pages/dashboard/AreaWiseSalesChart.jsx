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

const AreaWiseSalesChart = ({ dateFilter }) => {
  // Hooks
  const theme = useTheme()

  // Fetch area-wise sales data
  const { data, isLoading, isError } = dashboardService.getAreaWiseSales('dashboard-area-sales', {
    startDate: dateFilter?.startDate,
    endDate: dateFilter?.endDate,
    limit: 10
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Area-Wise Sales Distribution' />
        <CardContent className='flex justify-center items-center' style={{ minHeight: '400px' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader title='Area-Wise Sales Distribution' />
        <CardContent>
          <Typography color='error'>Failed to load area sales data</Typography>
        </CardContent>
      </Card>
    )
  }

  const areaData = data?.data?.data || []

  // Prepare chart data
  const categories = areaData.map(item => item.areaName)
  const salesData = areaData.map(item => item.totalSales)
  const invoiceData = areaData.map(item => item.totalInvoices)

  const chartOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '70%',
        borderRadius: 8,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      formatter: function (val, opts) {
        // Format based on series index
        if (opts.seriesIndex === 0) {
          return formatCurrency(val)
        }
        return val.toString() // Invoice count - no formatting
      },
      offsetX: 8,
      style: {
        fontSize: '11px',
        fontWeight: 600,
        colors: ['var(--mui-palette-text-primary)']
      }
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: 'var(--mui-palette-text-secondary)',
          fontSize: '13px'
        },
        formatter: function (value) {
          return formatCurrency(value)
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: 'var(--mui-palette-text-secondary)',
          fontSize: '13px'
        }
      }
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: function (value, { seriesIndex }) {
          if (seriesIndex === 0) {
            return formatCurrency(value)
          }
          return `${value} invoices`
        }
      }
    },
    colors: ['var(--mui-palette-primary-main)', 'var(--mui-palette-info-main)'],
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      labels: {
        colors: 'var(--mui-palette-text-primary)'
      }
    },
    grid: {
      borderColor: 'var(--mui-palette-divider)',
      xaxis: {
        lines: { show: true }
      }
    }
  }

  const series = [
    {
      name: 'Total Sales',
      data: salesData
    },
    {
      name: 'Invoice Count',
      data: invoiceData
    }
  ]

  return (
    <Card>
      <CardHeader
        title='Area-Wise Sales Distribution'
        subheader='Sales performance by geographical area'
      />
      <CardContent>
        {areaData.length === 0 ? (
          <Box className='flex justify-center items-center' style={{ minHeight: '300px' }}>
            <Typography color='text.secondary'>No area sales data available for selected period</Typography>
          </Box>
        ) : (
          <AppReactApexCharts
            type='bar'
            height={400}
            options={chartOptions}
            series={series}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default AreaWiseSalesChart
