'use client'

// React Imports
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import { styled } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { createColumnHelper } from '@tanstack/react-table'

// Component Imports
import CustomDataTable from '@components/custom-components/CustomDataTable'

// Service Imports
import { inventoryService } from '@/services/inventoryService'
import { brandService } from '@/services/brandService'
import { lookupService } from '@/services/lookupService'

// Styled Components
const Icon = styled('i')({})

// Column Definitions
const columnHelper = createColumnHelper()

const InventoryPage = () => {
  const router = useRouter()

  // States
  const [brands, setBrands] = useState([])

  // Define columns for the inventory table
  const columns = [
    columnHelper.accessor('productName', {
      header: 'Product Name',
      cell: ({ row }) => (
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center w-8 h-8 rounded bg-primary/10'>
            <Icon className='tabler-pill text-primary' />
          </div>
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.productName || 'N/A'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {row.original.packingSize ? `${row.original.packingSize} pcs/pack` : 'N/A'}
            </Typography>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('brandName', {
      header: 'Brand',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Icon className='tabler-building-store' sx={{ color: 'var(--mui-palette-info-main)' }} />
          <Typography className='capitalize' color='text.primary'>
            {row.original.brandName || 'N/A'}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('totalBatches', {
      header: 'No. of Batches',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Icon className='tabler-package' sx={{ color: 'var(--mui-palette-warning-main)' }} />
          <Chip
            variant='tonal'
            label={row.original.totalBatches || 0}
            size='small'
            color='primary'
            className='font-medium'
          />
        </div>
      )
    }),
    columnHelper.accessor('totalQuantity', {
      header: 'Total Quantity',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography className='font-semibold text-success-main'>
            {row.original.totalQuantity ? row.original.totalQuantity.toLocaleString() : '0'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {/* Available: {row.original.availableQuantity ? row.original.availableQuantity.toLocaleString() : '0'} */}
            Packs
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('overallStockStatus', {
      header: 'Stock Status',
      cell: ({ row }) => {
        const status = row.original.overallStockStatus || 'Unknown'
        let color = 'default'

        switch (status) {
          case 'In Stock':
            color = 'success'
            break
          case 'Low Stock':
            color = 'warning'
            break
          case 'Out of Stock':
            color = 'error'
            break
          default:
            color = 'default'
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
    columnHelper.accessor('batchSummary', {
      header: 'Expiry Summary',
      cell: ({ row }) => {
        const { expiredBatches, expiringSoonBatches } = row.original

        return (
          <div className='flex flex-col gap-1'>
            {(expiredBatches > 0 || expiringSoonBatches > 0) ? (
              <>
                {expiredBatches > 0 && (
                  <Typography variant='body2' className='text-error-main'>
                    {expiredBatches} Expired
                  </Typography>
                )}
                {expiringSoonBatches > 0 && (
                  <Typography variant='body2' className='text-warning-main'>
                    {expiringSoonBatches} Expiring Soon
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant='body2' className='text-success-main'>
                All Batches Good
              </Typography>
            )}
          </div>
        )
      }
    }),
    columnHelper.accessor('lastUpdated', {
      header: 'Last Updated',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {row.original.lastUpdated ? new Date(row.original.lastUpdated).toLocaleDateString() : 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('action', {
      header: 'Action',
      cell: ({ row }) => {
        const handleViewBatches = () => {
          router.push(`/inventory/batch-details/${row.original.productId}`)
        }

        return (
          <div className='flex items-center gap-1'>
            <Tooltip title="View Batch Details">
              <IconButton
                size="small"
                onClick={handleViewBatches}
              >
                <i className='tabler-eye text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Report">
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

  // API call to get all brands
  const { data: brandsData } = brandService.getAllBrands('get-all-brands')

  useEffect(() => {
    if (brandsData?.data?.success) {
      setBrands(brandsData.data.result.docs || brandsData.data.result || [])
    } else {
      setBrands([])
    }
  }, [brandsData])

  // Define filters for the inventory table
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
        label: 'Stock Status',
        dbColumn: 'stockStatus',
        placeholder: 'Select Stock Status',
        options: [
          { value: 'in_stock', label: 'In Stock' },
          { value: 'low_stock', label: 'Low Stock' },
          { value: 'out_of_stock', label: 'Out of Stock' },
          { value: 'expired', label: 'Expired' },
          { value: 'expiring_soon', label: 'Expiring Soon' }
        ]
      },
      // {
      //   label: 'Status',
      //   dbColumn: 'status',
      //   placeholder: 'Select Status',
      //   options: [
      //     { value: 'Active', label: 'Active' },
      //     { value: 'Inactive', label: 'Inactive' }
      //   ]
      // }
    ]
  }

  // Transform data function to extract data from API response
  const transformData = apiResponse => {
    // The API returns data in result.docs structure
    const data = apiResponse?.result?.docs || apiResponse?.docs || apiResponse || []

    // Transform the data for better filtering
    return data.map(item => ({
      ...item,
      id: item.productId || item._id,

      // Add status for filtering
      status: 'Active' // Since we only show active inventory items from the backend
    }))
  }

  return (
    <>
      {/* Top Section with Inventory heading */}
      <Card className='mb-6'>
        <div className='flex justify-between items-center p-6'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4' component='h1'>
              Inventory Management
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Monitor your stock levels, batch details, and inventory status
            </Typography>
          </div>

        </div>
      </Card>

      {/* Custom Data Table */}
      <CustomDataTable
        apiURL='/inventory/grouped'
        queryKey='get-grouped-inventory'
        columns={columns}
        filters={filters}
        enableSelection={false}
        enableExport={true}
        enableSearch={true}
        defaultPageSize={10}
        transformData={transformData}
        onRowClick={row => {
          // Handle row click to navigate to batch details page
          router.push(`/inventory/batch-details/${row.productId}`)
        }}
      />
    </>
  )
}

export default InventoryPage
