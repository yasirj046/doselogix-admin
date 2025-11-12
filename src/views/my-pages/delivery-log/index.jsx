'use client'

// React Imports
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

// Next Imports
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { styled } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { createColumnHelper } from '@tanstack/react-table'
import { useQueryClient } from '@tanstack/react-query'

// Component Imports
import CustomDataTable from '@components/custom-components/CustomDataTable'

// Service Imports
import { deliveryLogService } from '@/services/deliveryLogService'
import { lookupService } from '@/services/lookupService'
import DeliveryLogSyncModal from '@/components/dialogs/DeliveryLogSyncModal'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Styled Components
const Icon = styled('i')({})

// Column Definitions
const columnHelper = createColumnHelper()

const DeliveryLogPage = () => {
  // States
  const [toggledId, setToggledId] = useState(null)
  const [salesmen, setSalesmen] = useState([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncModalOpen, setSyncModalOpen] = useState(false)

  // Hooks
  const { lang: locale } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Using `useMutation` to toggle delivery log status
  const { mutate: toggleStatus, isPending: isTogglingStatus } = deliveryLogService.toggleDeliveryLogStatus()
  const handleSyncMissingInvoices = async () => {
    if (isSyncing) return

    setIsSyncing(true)
    try {
      const response = await deliveryLogService.syncMissingInvoices()
      queryClient.invalidateQueries(['get-all-delivery-logs'])

      const linkedCount = response?.data?.result?.linkedCount || 0
      toast.success(`Sync completed: ${linkedCount} invoice${linkedCount === 1 ? '' : 's'} linked`)
    } catch (error) {
      console.error('Sync error:', error)
      const message = error?.response?.data?.message || error?.message || 'Sync failed'
      toast.error(message)
    } finally {
      setIsSyncing(false)
    }
  }

  // Fetch salesmen lookup for filters
  const { data: salesmenData } = lookupService.getSalesmenLookup('salesmen-lookup')

  useEffect(() => {
    if (salesmenData?.data?.success) {
      const rawSalesmen = salesmenData.data.result?.docs || salesmenData.data.result || []
      const transformedSalesmen = rawSalesmen.map(emp => ({
        value: emp.value || emp._id || emp.id,
        label: emp.label || emp.employeeName || emp.name || 'Unknown'
      }))
      setSalesmen(transformedSalesmen)
    } else {
      setSalesmen([])
    }
  }, [salesmenData])

  // Handle toggle status
  const handleToggleStatus = async id => {
    setToggledId(id)
    toggleStatus(id, {
      onSuccess: () => {
        queryClient.invalidateQueries(['get-all-delivery-logs'])
        toast.success('Delivery log status updated successfully')
      },
      onError: error => {
        toast.error(error.message || 'Error updating delivery log status')
      },
      onSettled: () => {
        setToggledId(null)
      }
    })
  }

  // Handle view delivery log
  const handleViewLog = id => {
    router.push(getLocalizedUrl(`/delivery-log/view/${id}`, locale))
  }

  // Handle print delivery log
  const handlePrintLog = id => {
    router.push(getLocalizedUrl(`/delivery-log/print/${id}`, locale))
  }

  // Define columns for the delivery log table
  const columns = [
    columnHelper.accessor('deliveryLogNumber', {
      header: 'Log Number',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Icon className='tabler-truck-delivery text-primary' />
          <Typography color='text.primary' className='font-medium'>
            {row.original.deliveryLogNumber || 'N/A'}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('date', {
      header: 'Date',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {row.original.date
            ? new Date(row.original.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('salesmanName', {
      header: 'Salesman',
      cell: ({ row }) => {
        const salesmanName = row.original.salesmanId?.employeeName || 'Unknown'
        const employeeDesignation = row.original.salesmanId?.designation || 'Salesman'

        return (
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {salesmanName}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {employeeDesignation}
            </Typography>
          </div>
        )
      }
    }),
    columnHelper.accessor('invoiceCount', {
      header: 'Invoices',
      cell: ({ row }) => {
        const count = row.original.invoices?.length || 0

        return (
          <Chip label={`${count} Invoice${count !== 1 ? 's' : ''}`} color='info' variant='tonal' size='small' />
        )
      }
    }),
    columnHelper.accessor('totalAmount', {
      header: 'Total Amount',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          ₨{row.original.totalAmount?.toLocaleString() || '0'}
        </Typography>
      )
    }),
    columnHelper.accessor('updatedAt', {
      header: 'Updated Date',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {row.original.updatedAt ? new Date(row.original.updatedAt).toLocaleDateString() : 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ row }) => {
        const isLoading = isTogglingStatus && toggledId === row.original._id

        return (
          <div className='flex items-center gap-2'>
            {isLoading ? (
              <CircularProgress size={20} />
            ) : (
              <Switch
                checked={row.original.isActive}
                onChange={() => handleToggleStatus(row.original._id)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            )}
          </div>
        )
      }
    }),
    columnHelper.accessor('actions', {
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Tooltip title='View Details'>
            <IconButton size='small' onClick={() => handleViewLog(row.original._id)}>
              <Icon className='tabler-eye text-textSecondary' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Print'>
            <IconButton size='small' onClick={() => handlePrintLog(row.original._id)}>
              <Icon className='tabler-printer text-textSecondary' />
            </IconButton>
          </Tooltip>
        </div>
      ),
      enableSorting: false
    })
  ]

  // Define filters for the delivery logs table
  const filters = {
    heading: 'Filters',
    filterArray: [
      {
        label: 'Salesman',
        dbColumn: 'salesmanId',
        placeholder: 'Select Salesman',
        options: salesmen
      },
      {
        label: 'Status',
        dbColumn: 'status',
        placeholder: 'Select Status',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Inactive', label: 'Inactive' }
        ]
      },
      {
        label: 'Start Date',
        dbColumn: 'startDate',
        placeholder: 'Select Start Date DD/MM/YYYY',
        type: 'date'
      },
      {
        label: 'End Date',
        dbColumn: 'endDate',
        placeholder: 'Select End Date DD/MM/YYYY',
        type: 'date'
      }
    ]
  }

  // Transform data function to extract data from API response
  const transformData = raw => {
    console.log('Raw API response in transformData:', raw)

    // `raw` may be:
    // - an array of items (already extracted by CustomDataTable)
    // - a paginated object (e.g. { result: { docs: [...] }})
    // - a plain object (single item) or unexpected shape

    // Normalize to an array safely
    let dataArray = []

    if (!raw) {
      dataArray = []
    } else if (Array.isArray(raw)) {
      dataArray = raw
    } else if (raw.result && Array.isArray(raw.result.docs)) {
      dataArray = raw.result.docs
    } else if (Array.isArray(raw.docs)) {
      dataArray = raw.docs
    } else if (raw.data && Array.isArray(raw.data.result?.docs)) {
      // in case an axios response slipped through
      dataArray = raw.data.result.docs
    } else if (raw.data && Array.isArray(raw.data)) {
      dataArray = raw.data
    } else {
      // Last resort: if it's an object with enumerable keys, wrap it
      dataArray = typeof raw === 'object' ? [raw] : []
    }

    console.log('Normalized dataArray:', dataArray)

    // Transform the data to flatten nested fields for better filtering
    const transformed = dataArray.map(item => {
      const transformedItem = {
        ...item,
        id: item._id || item.id,
        salesmanName: item.salesmanId?.employeeName || 'Unknown'
      }
      console.log('Transformed item:', transformedItem)
      return transformedItem
    })

    console.log('Final transformed data:', transformed)
    return transformed
  }

  return (
    <>
      {/* Top Section with Delivery Logs heading */}
      <Card className='mb-6'>
        <div className='flex justify-between items-center p-6'>
          <Typography variant='h4' component='h1'>
            Delivery Logs
          </Typography>
          <div className='flex items-center gap-2'>
            <Button
              variant='outlined'
              color='primary'
              onClick={() => setSyncModalOpen(true)}
              disabled={isSyncing}
              startIcon={isSyncing ? <CircularProgress size={16} /> : null}
            >
              {isSyncing ? 'Syncing...' : 'Sync Missing Invoices'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Custom Data Table */}
      <CustomDataTable
        apiURL='/delivery-logs'
        queryKey='get-all-delivery-logs'
        columns={columns}
        filters={filters}
        enableSelection={true}
        enableExport={true}
        enableSearch={true}
        defaultPageSize={10}
        transformData={transformData}
        onRowClick={row => {
          // Handle row click if needed
          console.log('Row clicked:', row)
        }}
      />

      {/* Delivery Log Sync Modal */}
      <DeliveryLogSyncModal
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        onSyncComplete={() => {
          queryClient.invalidateQueries(['get-all-delivery-logs'])
          toast.success('Sync completed')
        }}
      />
    </>
  )
}

export default DeliveryLogPage
