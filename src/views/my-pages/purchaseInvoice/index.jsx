'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { toast } from 'react-toastify'

// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'

// Third-party Imports
import { createColumnHelper, flexRender } from '@tanstack/react-table'
import { useQueryClient } from '@tanstack/react-query'

// Component Imports
import CustomDataTable from '@components/custom-components/CustomDataTable'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'
import { lookupService } from '@/services/lookupService'
import { brandService } from '@/services/brandService'
import AddPurchaseInvoiceDrawer from './AddPurchaseInvoiceDrawer'
import { purchaseInvoiceService } from '@/services/purchaseInvoiceService'

// Styled Components
const Icon = styled('i')({})

// Column Definitions
const columnHelper = createColumnHelper()

const PurchaseInvoicePage = () => {
  // States
  const [onePurchaseEntry, setOnePurchaseEntry] = useState(null)
  const [addPurchaseEntryOpen, setAddPurchaseEntryOpen] = useState(false)
  const [brands, setBrands] = useState([])
  const [toggledId, setToggledId] = useState(null)

  // Hooks
  const { lang: locale } = useParams()
  const queryClient = useQueryClient()

  // Using `useMutation` to toggle purchase entry status
  const { mutate: toggleStatus, isPending: isTogglingStatus } = purchaseInvoiceService.togglePurchaseEntryStatus()

  // Define columns for the purchase entries table
  const columns = [
    columnHelper.accessor('invoiceNumber', {
      header: 'Invoice #',
      cell: ({ row }) => (
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center w-8 h-8 rounded bg-primary/10'>
            <Icon className='tabler-receipt text-primary' />
          </div>
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.invoiceNumber || 'N/A'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {row.original.date ? new Date(row.original.date).toLocaleDateString() : 'N/A'}
            </Typography>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('brandId', {
      header: 'Brand',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Icon className='tabler-brand-android' sx={{ color: 'var(--mui-palette-info-main)' }} />
          <Typography className='capitalize' color='text.primary'>
            {row.original.brandId?.brandName || row.original.brandName || 'N/A'}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('invoiceDate', {
      header: 'Invoice Date',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {row.original.invoiceDate ? new Date(row.original.invoiceDate).toLocaleDateString() : 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('grossTotal', {
      header: 'Gross Total',
      cell: ({ row }) => (
        <Typography className='font-medium' color='text.primary'>
          ₨{row.original.grossTotal ? row.original.grossTotal.toLocaleString() : '0'}
        </Typography>
      )
    }),
    columnHelper.accessor('grandTotal', {
      header: 'Grand Total',
      cell: ({ row }) => (
        <Typography className='font-semibold text-success-main'>
          ₨{row.original.grandTotal ? row.original.grandTotal.toLocaleString() : '0'}
        </Typography>
      )
    }),
    columnHelper.accessor('cashPaid', {
      header: 'Paid Amount',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          ₨{row.original.cashPaid ? row.original.cashPaid.toLocaleString() : '0'}
        </Typography>
      )
    }),
    columnHelper.accessor('creditAmount', {
      header: 'Credit Amount',
      cell: ({ row }) => {
        const creditAmount = row.original.creditAmount || 0
        const color = creditAmount > 0 ? 'warning' : 'success'
        
        return (
          <Chip
            variant='tonal'
            label={`₨${creditAmount.toLocaleString()}`}
            size='small'
            color={color}
            className='font-medium'
          />
        )
      }
    }),
    columnHelper.accessor('paymentStatus', {
      header: 'Payment Status',
      cell: ({ row }) => {
        const creditAmount = row.original.creditAmount || 0
        const grandTotal = row.original.grandTotal || 0
        const cashPaid = row.original.cashPaid || 0
        
        let status = 'Pending'
        let color = 'warning'
        
        if (cashPaid >= grandTotal) {
          status = 'Paid'
          color = 'success'
        } else if (cashPaid > 0) {
          status = 'Partial'
          color = 'info'
        } else {
          status = 'Unpaid'
          color = 'error'
        }

        return (
          <Chip
            variant='tonal'
            label={status}
            size='small'
            color={color}
            className='capitalize font-medium'
          />
        )
      }
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created Date',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ row }) => {
        const purchaseEntryId = row.original._id || row.original.id
        const isCurrentToggling = isTogglingStatus && toggledId === purchaseEntryId

        const handleToggle = () => {
          setToggledId(purchaseEntryId)
          toggleStatus(
            { id: purchaseEntryId },
            {
              onSuccess: (response) => {
                const statusText = response.data.result.isActive ? 'activated' : 'deactivated'
                toast.success(`Purchase entry ${statusText} successfully`)
                queryClient.invalidateQueries(['get-all-purchase-entries'])
              },
              onError: (error) => {
                console.error('Failed to toggle purchase entry status', error)
                toast.error('Failed to update purchase entry status')
              },
              onSettled: () => {
                setToggledId(null)
              }
            }
          )
        }

        return (
          <div className="flex items-center gap-2">
            {isCurrentToggling ? (
              <CircularProgress size={20} />
            ) : (
              <Switch
                checked={row.original.isActive}
                onChange={handleToggle}
                disabled={isTogglingStatus}
                inputProps={{ 'aria-label': 'toggle purchase entry status' }}
              />
            )}
          </div>
        )
      }
    }),
    columnHelper.accessor('action', {
      header: 'Action',
      cell: ({ row }) => {
        return (
          <div className='flex items-center gap-1'>
            <Tooltip title="Edit Purchase Entry">
              <IconButton 
                size="small"
                onClick={() => {
                  setOnePurchaseEntry(row.original._id || row.original.id)
                  setAddPurchaseEntryOpen(true)
                }}
              >
                <i className='tabler-edit text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Details">
              <IconButton size="small">
                <i className='tabler-eye text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Invoice">
              <IconButton size="small">
                <i className='tabler-printer text-textSecondary' />
              </IconButton>
            </Tooltip>
          </div>
        )
      },
      enableSorting: false
    })
  ]

  //Api call to get all brands
  const { data: brandsData } = brandService.getAllBrands('get-all-brands')

  useEffect(() => {
    if (brandsData?.data?.success) {
      setBrands(brandsData.data.result.docs || brandsData.data.result || [])
    } else {
      setBrands([])
    }
  }, [brandsData])

  // Define filters for the purchase entries table
  const filters = {
    heading: 'Filters',
    filterArray: [
      {
        label: 'Brand',
        dbColumn: 'brandId',
        placeholder: 'Select Brand',
        options: brands.map(brand => ({ value: brand._id, label: brand.brandName }))
      },
      {
        label: 'Payment Status',
        dbColumn: 'paymentStatus',
        placeholder: 'Select Payment Status',
        options: [
          { value: 'paid', label: 'Paid' },
          { value: 'partial', label: 'Partial' },
          { value: 'unpaid', label: 'Unpaid' },
          { value: 'pending', label: 'Pending' }
        ]
      },
      {
        label: 'Status',
        dbColumn: 'status',
        placeholder: 'Select Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      }
    ]
  }

  // Transform data function to extract data from API response
  const transformData = apiResponse => {
    // The API returns data in result.docs structure
    const data = apiResponse?.result?.docs || apiResponse?.docs || apiResponse || []

    // Transform the data to flatten nested fields for better filtering
    return data.map(item => ({
      ...item,
      id: item._id || item.id,
      
      // Calculate payment status for filtering
      paymentStatus: (() => {
        const creditAmount = item.creditAmount || 0
        const grandTotal = item.grandTotal || 0
        const cashPaid = item.cashPaid || 0
        
        if (cashPaid >= grandTotal) return 'paid'
        if (cashPaid > 0) return 'partial'
        if (creditAmount > 0) return 'pending'
        return 'unpaid'
      })(),

      // Add status for filtering
      status: item.isActive ? 'active' : 'inactive'
    }))
  }

  return (
    <>
      {/* Top Section with Purchase Entries heading and Add New Purchase Entry button */}
      <Card className='mb-6'>
        <div className='flex justify-between items-center p-6'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4' component='h1'>
              Purchase Invoices
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Manage your purchase entries and inventory updates
            </Typography>
          </div>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              setOnePurchaseEntry(null)
              setAddPurchaseEntryOpen(!addPurchaseEntryOpen)
            }}
            className='max-sm:is-full'
          >
            Add New Purchase Entry
          </Button>
        </div>
      </Card>

      {/* Custom Data Table */}
      <CustomDataTable
        apiURL='/purchase-entries'
        queryKey='get-all-purchase-entries'
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

      {/* Add Purchase Entry Drawer */}
      {addPurchaseEntryOpen && (
        <AddPurchaseInvoiceDrawer
          open={addPurchaseEntryOpen}
          stateChanger={() => setAddPurchaseEntryOpen(!addPurchaseEntryOpen)}
          onePurchaseEntry={onePurchaseEntry}
          setOnePurchaseEntry={setOnePurchaseEntry}
        />
      )}
    </>
  )
}

export default PurchaseInvoicePage
