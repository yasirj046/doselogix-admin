'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

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

const TopProductsWidget = ({ dateFilter }) => {
  // Fetch top products data
  const { data, isLoading, isError } = dashboardService.getTopProducts('dashboard-top-products', {
    startDate: dateFilter?.startDate,
    endDate: dateFilter?.endDate,
    limit: 5
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Top Selling Products' />
        <CardContent className='flex justify-center items-center' style={{ minHeight: '400px' }}>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader title='Top Selling Products' />
        <CardContent>
          <Typography color='error'>Failed to load top products data</Typography>
        </CardContent>
      </Card>
    )
  }

  const productsData = data?.data?.data || []
  const totalRevenue = data?.data?.meta?.totalRevenue || 0

  return (
    <Card>
      <CardHeader
        title='Top Selling Products'
        subheader={`Total Revenue: ${formatCurrency(totalRevenue)}`}
      />
      <CardContent>
        {productsData.length === 0 ? (
          <Box className='flex justify-center items-center' style={{ minHeight: '250px' }}>
            <Typography color='text.secondary'>No product sales data available</Typography>
          </Box>
        ) : (
          <Box className='flex flex-col gap-6'>
            {productsData.map((product, index) => (
              <Box key={index}>
                <Box className='flex items-center justify-between mb-2'>
                  <Box className='flex flex-col gap-1' sx={{ flex: 1 }}>
                    <Typography variant='body2' fontWeight={600} color='text.primary'>
                      {product.productName}
                    </Typography>
                    <Box className='flex items-center gap-2'>
                      <Chip
                        label={product.brandName}
                        size='small'
                        color='primary'
                        variant='tonal'
                        sx={{ fontSize: '11px', height: '20px' }}
                      />
                      <Typography variant='caption' color='text.secondary'>
                        {product.totalQuantitySold} units sold
                      </Typography>
                    </Box>
                  </Box>
                  <Box className='flex flex-col items-end gap-1'>
                    <Typography variant='body2' fontWeight={600} color='primary'>
                      {formatCurrency(product.totalRevenue)}
                    </Typography>
                    <Chip
                      label={`${product.contributionPercentage.toFixed(1)}%`}
                      size='small'
                      color='success'
                      variant='outlined'
                      sx={{ fontSize: '11px', height: '20px' }}
                    />
                  </Box>
                </Box>
                <LinearProgress
                  variant='determinate'
                  value={product.contributionPercentage}
                  color='primary'
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'var(--mui-palette-primary-lightOpacity)'
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default TopProductsWidget
