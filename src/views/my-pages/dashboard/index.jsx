'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'

// Icon Imports
import { Icon } from '@iconify/react'

// Component Imports
import SummaryCards from './SummaryCards'
import BrandWiseSalesChart from './BrandWiseSalesChart'
import TopProductsWidget from './TopProductsWidget'
import ReceivablesAgingChart from './ReceivablesAgingChart'
import StockAlertsTable from './StockAlertsTable'
import NearExpiryTable from './NearExpiryTable'
import AreaWiseSalesChart from './AreaWiseSalesChart'
import InvoiceBreakdownChart from './InvoiceBreakdownChart'

const DashboardPage = () => {
  // State for date filter
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })

  const [appliedFilter, setAppliedFilter] = useState({
    startDate: '',
    endDate: ''
  })

  const handleApplyFilter = () => {
    setAppliedFilter(dateFilter)
  }

  const handleClearFilter = () => {
    setDateFilter({ startDate: '', endDate: '' })
    setAppliedFilter({ startDate: '', endDate: '' })
  }

  const handleTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0]

    setDateFilter({ startDate: today, endDate: today })
    setAppliedFilter({ startDate: today, endDate: today })
  }

  const handleThisWeekFilter = () => {
    const today = new Date()
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6))

    const startDate = firstDayOfWeek.toISOString().split('T')[0]
    const endDate = lastDayOfWeek.toISOString().split('T')[0]

    setDateFilter({ startDate, endDate })
    setAppliedFilter({ startDate, endDate })
  }

  const handleThisMonthFilter = () => {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const startDate = firstDayOfMonth.toISOString().split('T')[0]
    const endDate = lastDayOfMonth.toISOString().split('T')[0]

    setDateFilter({ startDate, endDate })
    setAppliedFilter({ startDate, endDate })
  }

  return (
    <Grid container spacing={6}>
      {/* Page Header */}
      <Grid item xs={12}>
        <Box className='flex flex-col gap-2'>
          <Typography variant='h4' fontWeight={600}>
            Dashboard
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Comprehensive analytics and insights for your pharmaceutical distribution
          </Typography>
        </Box>
      </Grid>

      {/* Summary Cards */}
      <Grid item xs={12}>
        <SummaryCards />
      </Grid>

      {/* SECTION: Sales Analytics */}
      <Grid item xs={12}>
        <Box className='flex items-center gap-2 mb-2'>
          <Icon icon='tabler-chart-line' fontSize={24} color='var(--mui-palette-primary-main)' />
          <Typography variant='h5' fontWeight={600}>
            Sales Analytics
          </Typography>
        </Box>
        <Divider />
      </Grid>

      {/* Date Range Filter */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box className='flex flex-col gap-4'>
              <Box className='flex items-center gap-2'>
                <Icon icon='tabler-calendar' fontSize={24} />
                <Typography variant='h6'>Date Range Filter</Typography>
              </Box>
              <Divider />
              <Grid container spacing={4} alignItems='center'>
                <Grid item xs={12} sm={6} md={2.5}>
                  <TextField
                    fullWidth
                    type='date'
                    label='Start Date'
                    InputLabelProps={{ shrink: true }}
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.5}>
                  <TextField
                    fullWidth
                    type='date'
                    label='End Date'
                    InputLabelProps={{ shrink: true }}
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={7}>
                  <Box className='flex flex-wrap gap-2'>
                    <Button
                      variant='outlined'
                      size='small'
                      startIcon={<Icon icon='tabler-calendar-event' />}
                      onClick={handleTodayFilter}
                    >
                      Today
                    </Button>
                    <Button
                      variant='outlined'
                      size='small'
                      startIcon={<Icon icon='tabler-calendar-week' />}
                      onClick={handleThisWeekFilter}
                    >
                      This Week
                    </Button>
                    <Button
                      variant='outlined'
                      size='small'
                      startIcon={<Icon icon='tabler-calendar-month' />}
                      onClick={handleThisMonthFilter}
                    >
                      This Month
                    </Button>
                    <Button
                      variant='contained'
                      size='small'
                      startIcon={<Icon icon='tabler-filter' />}
                      onClick={handleApplyFilter}
                    >
                      Apply Filter
                    </Button>
                    <Button
                      variant='tonal'
                      size='small'
                      color='secondary'
                      startIcon={<Icon icon='tabler-filter-off' />}
                      onClick={handleClearFilter}
                    >
                      Clear
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Brand-Wise Sales Chart */}
      <Grid item xs={12} lg={8}>
        <BrandWiseSalesChart dateFilter={appliedFilter} />
      </Grid>

      {/* Invoice Breakdown */}
      <Grid item xs={12} lg={4}>
        <InvoiceBreakdownChart dateFilter={appliedFilter} />
      </Grid>

      {/* Top Products Widget */}
      <Grid item xs={12} md={6}>
        <TopProductsWidget dateFilter={appliedFilter} />
      </Grid>

      {/* Area-Wise Sales Chart */}
      <Grid item xs={12} md={6}>
        <AreaWiseSalesChart dateFilter={appliedFilter} />
      </Grid>

      {/* SECTION: Financial Management */}
      <Grid item xs={12}>
        <Box className='flex items-center gap-2 mb-2 mt-4'>
          <Icon icon='tabler-cash' fontSize={24} color='var(--mui-palette-success-main)' />
          <Typography variant='h5' fontWeight={600}>
            Financial Management
          </Typography>
        </Box>
        <Divider />
      </Grid>

      {/* Receivables Aging Chart */}
      <Grid item xs={12}>
        <ReceivablesAgingChart />
      </Grid>

      {/* SECTION: Inventory Alerts */}
      <Grid item xs={12}>
        <Box className='flex items-center gap-2 mb-2 mt-4'>
          <Icon icon='tabler-alert-triangle' fontSize={24} color='var(--mui-palette-warning-main)' />
          <Typography variant='h5' fontWeight={600}>
            Inventory Alerts
          </Typography>
        </Box>
        <Divider />
      </Grid>

      {/* Stock Alerts Table */}
      <Grid item xs={12} lg={6}>
        <StockAlertsTable />
      </Grid>

      {/* Near Expiry Products Table */}
      <Grid item xs={12} lg={6}>
        <NearExpiryTable />
      </Grid>
    </Grid>
  )
}

export default DashboardPage
