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

const BrandWiseSalesChart = ({ dateFilter }) => {
  // Hooks
  const theme = useTheme()

  // Fetch brand-wise sales data
  const { data, isLoading, isError } = dashboardService.getBrandWiseSales('dashboard-brand-sales', {
    startDate: dateFilter?.startDate,
    endDate: dateFilter?.endDate,
    limit: 10
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Brand-Wise Sales Performance' />
        <CardContent className='flex justify-center items-center' style={{ minHeight: '400px' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader title='Brand-Wise Sales Performance' />
        <CardContent>
          <Typography color='error'>Failed to load brand sales data</Typography>
        </CardContent>
      </Card>
    )
  }

  const brandData = data?.data?.data || []

  // Prepare chart data
  const categories = brandData.map(item => item.brandName)
  const salesData = brandData.map(item => item.totalSales)
  const quantityData = brandData.map(item => item.totalQuantity)

  const chartOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: true,
        tools: {
          download: '<svg>...</svg>',
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        },
        export: {
          csv: {
            filename: 'brand-wise-sales',
            columnDelimiter: ',',
            headerCategory: 'Brand',
            headerValue: 'value'
          }
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 8,
        borderRadiusApplication: 'end',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (value, opts) {
        // Only show labels for Sales series (index 0)
        if (opts.seriesIndex === 0) {
          return formatCurrency(value)
        }
        return ''
      },
      offsetY: -20,
      style: {
        fontSize: '11px',
        colors: ['var(--mui-palette-text-secondary)']
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
        rotate: -45,
        rotateAlways: categories.length > 5
      }
    },
    yaxis: [
      {
        title: {
          text: 'Sales Amount (PKR)',
          style: {
            color: 'var(--mui-palette-text-secondary)'
          }
        },
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
      {
        opposite: true,
        title: {
          text: 'Quantity (Units)',
          style: {
            color: 'var(--mui-palette-text-secondary)'
          }
        },
        labels: {
          style: {
            colors: 'var(--mui-palette-text-secondary)',
            fontSize: '13px'
          },
          formatter: function (value) {
            return Math.round(value).toString()
          }
        }
      }
    ],
    fill: {
      opacity: 1
    },
    tooltip: {
      theme: theme.palette.mode,
      shared: true,
      intersect: false,
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const brandName = w.globals.labels[dataPointIndex]
        const salesValue = series[0][dataPointIndex]
        const quantityValue = series[1][dataPointIndex]

        return `
          <div style="padding: 10px; min-width: 200px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: var(--mui-palette-text-primary);">
              ${brandName}
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: var(--mui-palette-text-secondary);">Sales:</span>
              <span style="font-weight: 600; color: var(--mui-palette-primary-main);">
                ${formatCurrency(salesValue)}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--mui-palette-text-secondary);">Quantity:</span>
              <span style="font-weight: 600; color: var(--mui-palette-secondary-main);">
                ${quantityValue} units
              </span>
            </div>
          </div>
        `
      }
    },
    colors: ['var(--mui-palette-primary-main)', 'var(--mui-palette-secondary-main)'],
    legend: {
      show: false
    },
    grid: {
      borderColor: 'var(--mui-palette-divider)',
      yaxis: {
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
      name: 'Total Quantity',
      data: quantityData
    }
  ]

  return (
    <Card>
      <CardHeader
        title='Brand-Wise Sales Performance'
        subheader='Top 10 brands by sales volume'
      />
      <CardContent>
        {brandData.length === 0 ? (
          <Box className='flex justify-center items-center' style={{ minHeight: '300px' }}>
            <Typography color='text.secondary'>No sales data available for selected period</Typography>
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

export default BrandWiseSalesChart
