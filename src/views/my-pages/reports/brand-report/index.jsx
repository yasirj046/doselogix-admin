'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'

// Third-party Imports
import { createColumnHelper } from '@tanstack/react-table'
import { toast } from 'react-toastify'
import { useSession } from 'next-auth/react'
// formik removed: filters handled by CustomDataTable

// Component Imports
import CustomDataTable from '@components/custom-components/CustomDataTable'

// Service Imports
import { reportService } from '@/services/reportService'
import { lookupService } from '@/services/lookupService'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Column Definitions
const columnHelper = createColumnHelper()

const BrandReportPage = () => {
  const router = useRouter()
  const { lang: locale } = useParams()
  const { data: session } = useSession()

  // States
  const [brands, setBrands] = useState([])
  const [filterValues, setFilterValues] = useState({})

  // Fetch lookup data
  const { data: brandsData } = lookupService.getBrandsLookup('get-brands-lookup')

  useEffect(() => {
    if (brandsData?.data?.success) {
      setBrands(brandsData.data.result || [])
    }
  }, [brandsData])

  // Build extraQueryParams placeholder
  const queryParams = useMemo(() => ({}), [])



  const handleViewDetails = (brandId) => {
    router.push(getLocalizedUrl(`/reports/brands/${brandId}`, locale))
  }

  // Define columns
  const columns = [

    columnHelper.accessor('brandName', {
      header: 'Brand',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Typography color='text.primary' className='font-medium'>

            {row.original.brandName || 'N/A'}

            {/* <button
              onClick={(e) => { e.stopPropagation(); handleViewDetails(row.original.brandId) }}
              className='text-inherit text-left'
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >

            </button> */}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('totalInvoices', {
      header: 'Total Invoices',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {row.original.totalInvoices || 0}
        </Typography>
      )
    }),
    columnHelper.accessor('grossPurchaseAmount', {
      header: 'Gross Purchase',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          ₨{Number(row.original.grossPurchaseAmount || 0).toLocaleString()}
        </Typography>
      )
    }),
    columnHelper.accessor('totalFreight', {
      header: 'Freight',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          ₨{Number(row.original.totalFreight || 0).toLocaleString()}
        </Typography>
      )
    }),
    columnHelper.accessor('totalDiscount', {
      header: 'Total Discount',
      cell: ({ row }) => (
        <Typography color='info.main'>
          ₨{Number(row.original.totalDiscount || 0).toLocaleString()}
        </Typography>
      )
    }),
    columnHelper.accessor('grandTotal', {
      header: 'Grand Total',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          ₨{Number(row.original.grandTotal || 0).toLocaleString()}
        </Typography>
      )
    }),
    columnHelper.accessor('totalPaid', {
      header: 'Total Paid',
      cell: ({ row }) => (
        <Typography color='success.main' className='font-medium'>
          ₨{Number(row.original.totalPaid || 0).toLocaleString()}
        </Typography>
      )
    }),
    columnHelper.accessor('outstandingPayable', {
      header: 'Outstanding',
      cell: ({ row }) => {
        const balance = Number(row.original.outstandingPayable || 0)
        return (
          <Chip
            label={`₨${balance.toLocaleString()}`}
            color={balance > 0 ? 'error' : 'success'}
            size='small'
            variant='tonal'
          />
        )
      }
    }),
    columnHelper.accessor('actions', {
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Tooltip title='View Details'>
            <IconButton size='small' onClick={(e) => { e.stopPropagation(); handleViewDetails(row.original.brandId) }}>
              <i className='tabler-eye text-textSecondary' />
            </IconButton>
          </Tooltip>
        </div>
      ),
      enableSorting: false
    })
  ]

  // Filters configuration for CustomDataTable (embedded filters UI)
  const filters = {
    heading: 'Filters',
    filterArray: [
      {
        label: 'Brand',
        dbColumn: 'brandId',
        placeholder: 'Select Brand',
        options: brands,
        onChange: (value) => setFilterValues(prev => ({ ...prev, brandId: value }))
      },
      {
        label: 'Payment Status',
        dbColumn: 'paymentStatus',
        placeholder: 'Select Status',
        options: [
          { value: 'paid', label: 'Paid' },
          { value: 'unpaid', label: 'Unpaid' },
          { value: 'partial', label: 'Partial' }
        ],
        onChange: (value) => setFilterValues(prev => ({ ...prev, paymentStatus: value }))
      },
      {
        label: 'Start Date',
        dbColumn: 'startDate',
        type: 'date',
        placeholder: 'Start Date',
        onChange: (value) => setFilterValues(prev => ({ ...prev, startDate: value }))
      },
      {
        label: 'End Date',
        dbColumn: 'endDate',
        type: 'date',
        placeholder: 'End Date',
        onChange: (value) => setFilterValues(prev => ({ ...prev, endDate: value }))
      }
    ]
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <Card>
        <div className='flex flex-wrap items-center justify-between gap-4 p-6'>
          <div>
            <Typography variant='h4' className='mb-1'>
              Brand Reports
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Brand-wise purchase summary and analysis
            </Typography>
          </div>
          <div />
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <CustomDataTable
          apiURL='/reports/brands'
          queryKey='get-brands-report'
          columns={columns}
          filters={filters}
          enableSelection={false}
          extraQueryParams={queryParams}
          defaultPageSize={10}
          enableSearch={true}
          enableExport={false}
        />
      </Card>
    </div>
  )
}

export default BrandReportPage
