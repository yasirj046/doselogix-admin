'use client'

// React Imports
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

// Next Imports
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import { styled } from '@mui/material/styles'

// Third-party Imports
import { useQueryClient, useMutation } from '@tanstack/react-query'

// Component Imports
import LedgerSummaryCards from './components/LedgerSummaryCards'
import LedgerFilters from './components/LedgerFilters'
import LedgerExportDialog from './components/LedgerExportDialog'
import LedgerSheet from './components/LedgerSheet'
import LedgerSyncModal from '@/components/dialogs/LedgerSyncModal'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'
import { ledgerService } from '@/services/ledgerService'
import api from '@/libs/axiosInstance'

// Styled Components
const Icon = styled('i')({})

const LedgerPage = () => {
  // States
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) // Last day of current month
  })
  const [filters, setFilters] = useState({
    transactionType: '',
    customerId: '',
    paymentStatus: ''
  })
  const [summaryData, setSummaryData] = useState(null)
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Hooks
  const queryClient = useQueryClient()
  const params = useParams()
  const router = useRouter()

  // Mutations
  const createMasterDataMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ledger/cdata-master')
      return response.data
    },
  })

  const createMasterDataWithTransactionsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ledger/cdata-transactions')
      return response.data
    },
  })

  const createComprehensiveTestDataMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ledger/cdata-comprehensive')
      return response.data
    },
  })


  // Fetch summary data
  const summaryDataResponse = ledgerService.getLedgerSummary('ledger-summary', {
    startDate: dateRange.startDate.toISOString(),
    endDate: dateRange.endDate.toISOString(),
    ...filters
  })

  // Fetch predefined date ranges
  const { data: dateRangesData } = ledgerService.getPredefinedDateRanges('ledger-date-ranges')
  const dateRanges = dateRangesData?.data || {}

  // Handle date range change
  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange)
  }

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  // Handle predefined date range selection
  const handlePredefinedDateRange = (rangeKey) => {
    const range = dateRanges[rangeKey]
    if (range) {
      setDateRange({
        startDate: new Date(range.startDate),
        endDate: new Date(range.endDate)
      })
    }
  }

  // Handle action menu
  const handleActionMenuOpen = (event) => {
    setActionMenuAnchor(event.currentTarget)
  }

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null)
  }

  // Handle sync data
  const handleSyncData = () => {
    setSyncModalOpen(true)
    handleActionMenuClose()
  }

  // Handle sync completion
  const handleSyncComplete = (data) => {
    toast.success('Data synced successfully!')
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries(['ledger-summary'])
    queryClient.invalidateQueries(['ledger-transactions'])
  }

  // Handle create master data only
  const handleCreateMasterData = async () => {
    setIsLoading(true)
    try {
      const result = await createMasterDataMutation.mutateAsync()
      toast.success(`Master data created successfully! Created: ${JSON.stringify(result.data)}`)
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['ledger-summary'])
      queryClient.invalidateQueries(['ledger-transactions'])
    } catch (error) {
      toast.error('Error creating master data: ' + error.message)
    } finally {
      setIsLoading(false)
      handleActionMenuClose()
    }
  }

  // Handle create master data with transactions
  const handleCreateMasterDataWithTransactions = async () => {
    setIsLoading(true)
    try {
      const result = await createMasterDataWithTransactionsMutation.mutateAsync()
      toast.success(`Master data with transactions created successfully! Created: ${JSON.stringify(result.data)}`)
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['ledger-summary'])
      queryClient.invalidateQueries(['ledger-transactions'])
    } catch (error) {
      toast.error('Error creating master data with transactions: ' + error.message)
    } finally {
      setIsLoading(false)
      handleActionMenuClose()
    }
  }

  // Handle create comprehensive test data
  const handleCreateComprehensiveTestData = async () => {
    setIsLoading(true)
    try {
      const result = await createComprehensiveTestDataMutation.mutateAsync()
      toast.success(`Comprehensive test data created successfully! Created: ${JSON.stringify(result.data)}`)
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['ledger-summary'])
      queryClient.invalidateQueries(['ledger-transactions'])
    } catch (error) {
      toast.error('Error creating comprehensive test data: ' + error.message)
    } finally {
      setIsLoading(false)
      handleActionMenuClose()
    }
  }


  // Handle export
  const handleExport = () => {
    setExportDialogOpen(true)
    handleActionMenuClose()
  }

  // Update summary data when date range changes
  useEffect(() => {
    if (summaryDataResponse?.data?.data) {
      setSummaryData(summaryDataResponse.data.data)
    }
  }, [summaryDataResponse])

  return (
    <>
      {/* Top Section with Ledger heading and Action buttons */}
      <Card className='mb-6'>
        <div className='flex justify-between items-center p-6'>
          <div className='flex items-center gap-3'>
            <IconButton onClick={() => router.back()}>
              <i className='tabler-arrow-left' />
            </IconButton>
            <div>
              <Typography variant='h4' component='h1'>
                Ledger
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                View and manage your financial transactions
              </Typography>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='contained'
              startIcon={<i className='tabler-refresh' />}
              onClick={handleSyncData}
              className='max-sm:is-full'
            >
              Sync Data
            </Button>
            <Button
              variant='outlined'
              startIcon={<i className='tabler-download' />}
              onClick={handleExport}
              className='max-sm:is-full'
            >
              Export
            </Button>
            <Button
              variant='contained'
              startIcon={<i className='tabler-settings' />}
              onClick={handleActionMenuOpen}
              className='max-sm:is-full'
            >
              Actions
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={6} className='mb-6'>
        <Grid size={{ xs: 12 }}>
          <LedgerSummaryCards 
            summaryData={summaryData}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onPredefinedDateRange={handlePredefinedDateRange}
            predefinedRanges={dateRanges}
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={6} className='mb-6'>
        <Grid size={{ xs: 12 }}>
          <LedgerFilters
            dateRange={dateRange}
            filters={filters}
            onDateRangeChange={handleDateRangeChange}
            onFilterChange={handleFilterChange}
            onPredefinedDateRange={handlePredefinedDateRange}
            predefinedRanges={dateRanges}
          />
        </Grid>
      </Grid>

      {/* Ledger Sheet */}
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <LedgerSheet
            dateRange={dateRange}
            filters={filters}
            summaryData={summaryData}
            onRowClick={row => {
              console.log('Row clicked:', row)
            }}
          />
        </Grid>
      </Grid>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleSyncData} disabled={isLoading}>
          <i className='tabler-refresh mr-2' />
          Sync Existing Data
        </MenuItem>
        <MenuItem onClick={handleCreateMasterData} disabled={isLoading}>
          <i className='tabler-database mr-2' />
          CDATA - Master Only
        </MenuItem>
        <MenuItem onClick={handleCreateMasterDataWithTransactions} disabled={isLoading}>
          <i className='tabler-database-plus mr-2' />
          CDATA - With Transactions
        </MenuItem>
        <MenuItem onClick={handleCreateComprehensiveTestData} disabled={isLoading}>
          <i className='tabler-test-pipe mr-2' />
          CDATA - Comprehensive Test Data
        </MenuItem>
      </Menu>

      {/* Export Dialog */}
      <LedgerExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        dateRange={dateRange}
        filters={filters}
      />

      {/* Sync Modal */}
      <LedgerSyncModal
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        onSyncComplete={handleSyncComplete}
      />
    </>
  )
}

export default LedgerPage