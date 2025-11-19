'use client'

// Next Imports
import dynamic from 'next/dynamic'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Alert from '@mui/material/Alert'
import { useTheme } from '@mui/material/styles'

// Service Import
import { dashboardService } from '@/services/dashboardService'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const SalesPredictionChart = () => {
  // Hooks
  const theme = useTheme()
  const [selectedProductId, setSelectedProductId] = useState('')
  // Fetch products with sales history
  const { data: productsData, isLoading: loadingProducts } = dashboardService.getProductsWithSales(
    'dashboard-products-with-sales'
  )

  // Fetch prediction for selected product
  const { data: predictionData, isLoading: loadingPrediction, isError } = dashboardService.getSalesPrediction(
    'dashboard-sales-prediction',
    { productId: selectedProductId }
  )

  const products = productsData?.data?.data || []
  const prediction = predictionData?.data?.data || {}

  // Derive the selected product label so the chart header matches the menu item text
  const selectedProduct = products.find(p => p.productId === selectedProductId)
  const selectedProductLabel = selectedProduct
    ? `${selectedProduct.productName} - ${selectedProduct.brandName}`
    : prediction.productName || ''

  const handleProductChange = event => {
    setSelectedProductId(event.target.value)
  }

  // Prepare chart data
  const getChartData = () => {
    if (!prediction.months || prediction.status !== 'success') {
      return null
    }

    const categories = [...prediction.months, prediction.predictedMonth]
    const salesData = [...prediction.sales, null] // null for predicted month bar
    const predictedData = [...Array(prediction.sales.length).fill(null), prediction.predicted]

    return {
      categories,
      salesData,
      predictedData
    }
  }

  const chartData = getChartData()

  const chartOptions = chartData
    ? {
        chart: {
          type: 'bar',
          toolbar: {
            show: false
          }
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '60%',
            borderRadius: 4,
            dataLabels: {
              position: 'top'
            }
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (val) {
            return val ? Math.round(val) : ''
          },
          offsetY: -20,
          style: {
            fontSize: '12px',
            colors: ['var(--mui-palette-text-primary)']
          }
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: chartData.categories,
          labels: {
            style: {
              colors: 'var(--mui-palette-text-secondary)',
              fontSize: '12px'
            },
            rotate: -45,
            rotateAlways: chartData.categories.length > 6
          }
        },
        yaxis: {
          title: {
            text: 'Quantity Sold',
            style: {
              color: 'var(--mui-palette-text-secondary)',
              fontSize: '13px',
              fontWeight: 500
            }
          },
          labels: {
            style: {
              colors: 'var(--mui-palette-text-secondary)'
            },
            formatter: function (value) {
              return Math.round(value)
            }
          }
        },
        fill: {
          opacity: 1
        },
        tooltip: {
          theme: theme.palette.mode,
          shared: true,
          intersect: false,
          custom: function ({ series, seriesIndex, dataPointIndex, w }) {
            const monthName = chartData.categories[dataPointIndex]
            const isPredicted = seriesIndex === 1 && series[seriesIndex][dataPointIndex] !== null
            const isActual = seriesIndex === 0 && series[seriesIndex][dataPointIndex] !== null

            if (isPredicted) {
              const value = series[1][dataPointIndex]
              return `
                <div style="padding: 12px; background: var(--mui-palette-background-paper); border: 1px solid var(--mui-palette-divider); border-radius: 6px;">
                  <div style="font-weight: 600; color: var(--mui-palette-warning-main); margin-bottom: 4px;">
                    ${monthName} (Predicted)
                  </div>
                  <div style="color: var(--mui-palette-text-primary); font-size: 14px;">
                    Expected: <strong>${Math.round(value)} units</strong>
                  </div>
                  <div style="color: var(--mui-palette-text-secondary); font-size: 11px; margin-top: 4px;">
                    AI-based forecast
                  </div>
                </div>
              `
            } else if (isActual) {
              const value = series[0][dataPointIndex]
              return `
                <div style="padding: 12px; background: var(--mui-palette-background-paper); border: 1px solid var(--mui-palette-divider); border-radius: 6px;">
                  <div style="font-weight: 600; color: var(--mui-palette-primary-main); margin-bottom: 4px;">
                    ${monthName}
                  </div>
                  <div style="color: var(--mui-palette-text-primary); font-size: 14px;">
                    Sold: <strong>${Math.round(value)} units</strong>
                  </div>
                  <div style="color: var(--mui-palette-text-secondary); font-size: 11px; margin-top: 4px;">
                    Actual sales
                  </div>
                </div>
              `
            }
            return ''
          }
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'left',
          labels: {
            colors: 'var(--mui-palette-text-primary)'
          }
        },
        colors: ['var(--mui-palette-success-main)', 'var(--mui-palette-warning-main)']
      }
    : {}

  const series = chartData
    ? [
        {
          name: 'Past Sales',
          data: chartData.salesData
        },
        {
          name: 'Predicted',
          data: chartData.predictedData
        }
      ]
    : []

  return (
    <Card>
      <CardHeader
        title='Sales Prediction (ML Forecasting)'
        subheader='AI-powered prediction based on historical monthly sales trends'
      />
      <CardContent>
        {/* Product Selector */}
        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel id='product-select-label'>Select Product</InputLabel>
          <Select
            labelId='product-select-label'
            id='product-select'
            value={selectedProductId}
            label='Select Product'
            onChange={handleProductChange}
            disabled={loadingProducts}
          >
            <MenuItem value=''>
              <em>Choose a product</em>
            </MenuItem>
            {products.map(product => (
              <MenuItem key={product.productId} value={product.productId}>
                {product.productName} - {product.brandName} ({product.totalSales} total sales)
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Loading State */}
        {loadingPrediction && (
          <Box className='flex justify-center items-center' style={{ minHeight: '300px' }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {isError && selectedProductId && (
          <Alert severity='error' sx={{ mb: 2 }}>
            Failed to load prediction data. Implementing Moving Averages.
          </Alert>
        )}

        {/* No Product Selected */}
        {!selectedProductId && !loadingPrediction && (
          <Box className='flex justify-center items-center' style={{ minHeight: '300px' }}>
            <Typography color='text.secondary'>Please select a product to view sales prediction</Typography>
          </Box>
        )}

        {/* Not Enough Data */}
        {prediction.status === 'not_enough_data' && selectedProductId && (
          <Box>
            <Alert severity='info' sx={{ mb: 3 }}>
              <Typography variant='body2' fontWeight={600}>
                Limited Historical Data
              </Typography>
              <Typography variant='caption'>{prediction.message}</Typography>
            </Alert>
            {prediction.months && prediction.months.length > 0 && (
              <Box>
                <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 2 }}>
                  Available Sales History ({prediction.months.length}{' '}
                  {prediction.months.length === 1 ? 'month' : 'months'})
                </Typography>
                <AppReactApexCharts
                  type='bar'
                  height={300}
                  options={{
                    chart: {
                      type: 'bar',
                      toolbar: { show: false }
                    },
                    plotOptions: {
                      bar: {
                        horizontal: false,
                        columnWidth: '60%',
                        borderRadius: 4
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: val => Math.round(val),
                      offsetY: -20,
                      style: {
                        fontSize: '12px',
                        colors: ['var(--mui-palette-text-primary)']
                      }
                    },
                    xaxis: {
                      categories: prediction.months,
                      labels: {
                        style: {
                          colors: 'var(--mui-palette-text-secondary)',
                          fontSize: '12px'
                        }
                      }
                    },
                    yaxis: {
                      title: { text: 'Quantity Sold' },
                      labels: {
                        formatter: val => Math.round(val)
                      }
                    },
                    tooltip: {
                      theme: theme.palette.mode,
                      y: {
                        formatter: val => `${Math.round(val)} units`
                      }
                    },
                    colors: ['var(--mui-palette-info-main)']
                  }}
                  series={[
                    {
                      name: 'Monthly Sales',
                      data: prediction.sales
                    }
                  ]}
                />
              </Box>
            )}
          </Box>
        )}

        {/* No Sales Data */}
        {prediction.status === 'no_data' && selectedProductId && (
          <Box className='flex justify-center items-center' style={{ minHeight: '300px' }}>
            <Alert severity='info'>
              <Typography variant='body2' fontWeight={600}>
                No Sales History
              </Typography>
              <Typography variant='caption'>{prediction.message}</Typography>
            </Alert>
          </Box>
        )}

        {/* Success: Show Chart with Prediction */}
        {prediction.status === 'success' && chartData && (
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant='h6' color='primary.main' fontWeight={700}>
                {selectedProductLabel}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Showing last 12 months + AI prediction for {prediction.predictedMonth}
              </Typography>
              <Typography variant='caption' color='text.disabled' display='block'>
                Model trained on {prediction.totalMonthsData} months of historical data
              </Typography>
            </Box>

            <AppReactApexCharts type='bar' height={400} options={chartOptions} series={series} />

            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: 'var(--mui-palette-warning-lightOpacity)',
                borderRadius: 2
              }}
            >
              <Typography variant='body2' fontWeight={600} color='warning.main'>
                Predicted Sales for {prediction.predictedMonth}
              </Typography>
              <Typography variant='h5' fontWeight={700} color='warning.main'>
                ~{prediction.predicted} units
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Based on moving average and historical trends
              </Typography>
            </Box>
          </Box>
        )}

        {/* Prediction Error */}
        {prediction.status === 'prediction_error' && selectedProductId && (
          <Box>
            <Alert severity='error' sx={{ mb: 3 }}>
              <Typography variant='body2' fontWeight={600}>
                Prediction Failed.
              </Typography>
              <Typography variant='caption'>{prediction.message + ` Implementing Moving Averages.`}</Typography>
            </Alert>
            {prediction.months && prediction.months.length > 0 && (
              <Box>
                <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 2 }}>
                  Available Sales History
                </Typography>
                <AppReactApexCharts
                  type='bar'
                  height={300}
                  options={{
                    ...chartOptions,
                    colors: ['var(--mui-palette-error-main)']
                  }}
                  series={[
                    {
                      name: 'Monthly Sales',
                      data: prediction.sales
                    }
                  ]}
                />
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default SalesPredictionChart
