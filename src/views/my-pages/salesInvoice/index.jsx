'use client'

// React Imports
import { useState, useEffect } from 'react'
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
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useSession } from 'next-auth/react'

// Component Imports
import CustomDataTable from '@components/custom-components/CustomDataTable'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

// Service Imports
import { salesInvoiceService } from '@/services/salesInvoiceService'
import { lookupService } from '@/services/lookupService'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'

// Styled Components
const Icon = styled('i')({})

// Column Definitions
const columnHelper = createColumnHelper()

const SalesInvoicePage = () => {
  const router = useRouter()

  // States
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [toggledId, setToggledId] = useState(null)

  // Hooks
  const { lang: locale } = useParams()
  const queryClient = useQueryClient()
  const { data: session, status } = useSession()

  // Toggle status mutation
  const toggleStatusMutation = salesInvoiceService.toggleSalesEntryStatus()

  // Handle toggle status success/error
  useEffect(() => {
    if (toggleStatusMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['get-all-sales-invoices'] })
      toast.success('Status updated successfully')
      setToggledId(null)
    }
    if (toggleStatusMutation.isError) {
      console.error('Toggle status error:', toggleStatusMutation.error)
      toast.error('Failed to update status')
      setToggledId(null)
    }
  }, [toggleStatusMutation.isSuccess, toggleStatusMutation.isError, toggleStatusMutation.error, queryClient])

  // Fetch lookup data using React Query
  const { data: customersData, isLoading: isLoadingCustomers, error: customersError } = lookupService.getCustomersLookup('get-customers-lookup')
  const { data: employeesData, isLoading: isLoadingEmployees, error: employeesError } = lookupService.getEmployeesLookup('get-employees-lookup')

  // Test sales invoice data fetch
  const { data: salesInvoicesData, isLoading: isLoadingSalesInvoices, error: salesInvoicesError } =
    salesInvoiceService.getAllSalesEntries('get-all-sales-invoices')

  useEffect(() => {
    if (customersData?.data?.success) {
      // Transform customers data to the format expected by filters
      const rawCustomers = customersData.data.result?.docs || customersData.data.result || []

      const transformedCustomers = rawCustomers.map(customer => ({
        value: customer._id || customer.id,
        label: customer.customerName || customer.name || 'Unknown Customer'
      }))

      setCustomers(transformedCustomers)
    } else {
      setCustomers([])
    }
  }, [customersData])

  useEffect(() => {
    if (employeesData?.data?.success) {
      // Transform employees data to the format expected by filters
      const rawEmployees = employeesData.data.result?.docs || employeesData.data.result || []

      const transformedEmployees = rawEmployees.map(employee => ({
        value: employee._id || employee.id,
        label: employee.employeeName || employee.name || 'Unknown Employee'
      }))

      setEmployees(transformedEmployees)

    } else {
      setEmployees([])
    }
  }, [employeesData])

  // Define columns for the sales invoice table (reordered as required)
  const columns = [

    columnHelper.accessor('invoiceNumber', {
      header: 'Invoice #',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Icon className='tabler-file-invoice text-primary' />
          <Typography color='text.primary' className='font-medium'>
            #{row.original.deliveryLogNumber || 'N/A'}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('customerName', {
      header: 'Customer',
      cell: ({ row }) => {
        // Use populated data from backend instead of lookup array
        const customerName = row.original.customerData?.customerName || 'Unknown Customer'
        return (
          <div className='flex items-center gap-3'>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {customerName}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {row.original.licenseNumber || 'No License'}
              </Typography>
            </div>
          </div>
        )
      }
    }),
    columnHelper.accessor('date', {
      header: 'Date',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {row.original.date ? new Date(row.original.date).toLocaleDateString() : 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('grandTotal', {
      header: 'Total Amount',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          ₨{(row.original.grandTotal || 0).toLocaleString()}
        </Typography>
      )
    }),
    columnHelper.accessor('deliverBy', {
      header: 'Delivered By',
      cell: ({ row }) => {
        // Use populated data from backend instead of lookup array
        const employeeName = row.original.deliverByData?.employeeName || 'Unknown'
        return (
          <Typography color='text.primary'>
            {employeeName}
          </Typography>
        )
      }
    }),
    columnHelper.accessor('totalPaid', {
      header: 'Cash Paid (Total Paid)',
      cell: ({ row }) => {
        const totalPaid = (row.original.cash || 0) +
          (row.original.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)
        return (
          <Typography color='text.primary' className='font-medium'>
            ₨{totalPaid.toLocaleString()}
          </Typography>
        )
      }
    }),
    columnHelper.accessor('remainingBalance', {
      header: 'Balance (Credit)',
      cell: ({ row }) => {
        const totalPaid = (row.original.cash || 0) +
          (row.original.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)
        const remainingBalance = Math.max(0, (row.original.grandTotal || 0) - totalPaid)

        return (
          <Chip
            label={`₨${remainingBalance.toLocaleString()}`}
            color={remainingBalance === 0 ? 'success' : remainingBalance < (row.original.grandTotal || 0) / 2 ? 'warning' : 'error'}
            variant='tonal'
            size='small'
          />
        )
      }
    }),
    columnHelper.accessor('paymentStatus', {
      header: 'Payment Status',
      cell: ({ row }) => {
        const totalPaid = (row.original.cash || 0) +
          (row.original.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)
        const grandTotal = row.original.grandTotal || 0

        let status, color
        if (totalPaid === 0) {
          status = 'Unpaid'
          color = 'error'
        } else if (totalPaid >= grandTotal) {
          status = 'Paid'
          color = 'success'
        } else {
          status = 'Partial'
          color = 'warning'
        }

        return (
          <Chip
            label={status}
            color={color}
            variant='tonal'
            size='small'
          />
        )
      }
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ row }) => (
        <div className='flex items-center'>
          {toggledId === row.original._id ? (
            <CircularProgress size={20} />
          ) : (
            <Switch
              checked={row.original.isActive}
              onChange={() => {
                setToggledId(row.original._id)
                toggleStatusMutation.mutate(row.original._id)
              }}
              size='small'
            />
          )}
        </div>
      )
    }),
    columnHelper.accessor('action', {
      header: 'Action',
      cell: ({ row }) => (
        <div className='flex items-center gap-1'>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => {
                router.push(`/sales-invoice/edit/${row.original._id}`)
              }}
            >
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Invoice">
            <IconButton size="small">
              <i className='tabler-printer text-textSecondary' />
            </IconButton>
          </Tooltip>
        </div>
      ),
      enableSorting: false
    })
  ]

  // Filter configuration (following the same pattern as brands module)
  const filters = {
    heading: 'Filters',
    filterArray: [
      {
        label: 'Customers',
        dbColumn: 'customerId',
        placeholder: 'Select Customer',
        options: customers
      },
      {
        label: 'Payment Status',
        dbColumn: 'paymentStatus',
        placeholder: 'Select Payment Status',
        options: [
          { value: 'paid', label: 'Paid' },
          { value: 'partial', label: 'Partial Payment' },
          { value: 'unpaid', label: 'Unpaid' }
        ]
      },
      {
        label: 'Delivered By',
        dbColumn: 'deliverBy',
        placeholder: 'Select Employee',
        options: employees
      },
      {
        label: 'Status',
        dbColumn: 'status',
        placeholder: 'Select Status',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Inactive', label: 'Inactive' }
        ]
      }
    ]
  }

  // Transform data function to extract data from API response
  const transformData = apiResponse => {

    // The API returns data in result.docs structure (after axios response)
    const data = apiResponse?.data?.result?.docs ||
                 apiResponse?.data?.result ||
                 apiResponse?.result?.docs ||
                 apiResponse?.result ||
                 apiResponse?.docs ||
                 apiResponse || []


    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.warn('Expected array data, received:', data)
      return []
    }

    // Transform the data to add calculated fields for better filtering
    return data.map(item => ({
      ...item,
      id: item._id,

      // Calculate payment status for filtering
      paymentStatus: (() => {
        const totalPaid = (item.cash || 0) +
          (item.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)
        const grandTotal = item.grandTotal || 0

        if (totalPaid === 0) return 'unpaid'
        if (totalPaid >= grandTotal) return 'paid'
        return 'partial'
      })(),

      // Calculate remaining balance
      remainingBalance: (() => {
        const totalPaid = (item.cash || 0) +
          (item.paymentDetails || []).reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)
        return Math.max(0, (item.grandTotal || 0) - totalPaid)
      })(),

      // Add status for filtering (matches what backend expects)
      status: item.isActive ? 'Active' : 'Inactive',

      // Ensure customerId and deliverBy references are preserved for filtering
      // Backend populates these, so they should be objects with _id and name fields
      customerId: item.customerId?._id || item.customerId, // For filtering by customer ID
      deliverBy: item.deliverBy?._id || item.deliverBy, // For filtering by employee ID

      // Keep the populated objects for display
      customerData: item.customerId, // Full customer object for display
      deliverByData: item.deliverBy // Full employee object for display
    }))
  }

  return (
    <>
      {/* Top Section with Sales Invoices heading and Add New Sales Invoice button */}
      <Card className='mb-6'>
        <div className='flex justify-between items-center p-6'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4' component='h1'>
              Sales Invoices
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Manage your sales invoices and customer transactions
            </Typography>
          </div>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              router.push(getLocalizedUrl('/sales-invoice/add', locale))
            }}
            className='max-sm:is-full'
          >
            Add New Sales Invoice
          </Button>
        </div>
      </Card>

      {/* Custom Data Table */}
      <CustomDataTable
        apiURL='/sales-invoices'
        queryKey='get-all-sales-invoices'
        columns={columns}
        filters={filters}
        enableSelection={true}
        enableExport={true}
        enableSearch={true}
        defaultPageSize={10}
        transformData={transformData}
        onRowClick={row => {
          // Handle row click to navigate to edit page
          router.push(`/sales-invoice/edit/${row.original._id}`)
        }}
      />
    </>
  )
}

export default SalesInvoicePage
