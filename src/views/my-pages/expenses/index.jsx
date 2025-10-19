'use client'

// React Imports
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'

// Third-party Imports
import { createColumnHelper } from '@tanstack/react-table'
import { useQueryClient } from '@tanstack/react-query'

// Component Imports
import CustomDataTable from '@components/custom-components/CustomDataTable'
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'
import { expenseService } from '@/services/expenseService'
import { lookupService } from '@/services/lookupService'
import AddExpenseDrawer from './AddExpenseDrawer'

// Styled Components
const Icon = styled('i')({})

// Column Definitions
const columnHelper = createColumnHelper()

const ExpensesPage = () => {
  // States
  const [oneExpense, setOneExpense] = useState(null)
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [toggledId, setToggledId] = useState(null)

  // Hooks
  const { lang: locale } = useParams()
  const queryClient = useQueryClient()

  // Using `useMutation` to toggle expense status
  const { mutate: toggleStatus, isPending: isTogglingStatus } = expenseService.toggleExpenseStatus()

  // Fetch expense categories for filters
  const { data: expenseCategoriesData } = lookupService.getExpenseCategoriesLookup('expense-categories-lookup')
  const expenseCategories = expenseCategoriesData?.data?.result || []

  // Define columns for the expenses table
  const columns = [
    columnHelper.accessor('description', {
      header: 'Description',
      cell: ({ row }) => (
        <Typography color='text.primary' className='max-w-xs truncate'>
          {row.original.description || 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('expenseCategory', {
      header: 'Category',
      cell: ({ row }) => (
        <Chip
          label={row.original.expenseCategory || 'N/A'}
          color='primary'
          variant='outlined'
          size='small'
        />
      )
    }),
    columnHelper.accessor('date', {
      header: 'Date',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {row.original.date ? new Date(row.original.date).toLocaleDateString() : 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          ₨{row.original.amount ? parseFloat(row.original.amount).toFixed(2) : '0.00'}
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
          <IconButton
            size='small'
            onClick={e => {
              e.stopPropagation()
              handleEdit(row.original)
            }}
          >
            <i className='tabler-edit text-textPrimary' />
          </IconButton>
        </div>
      )
    })
  ]

  // Define filters for the expenses table
  const filters = {
    heading: 'Filters',
    filterArray: [
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
        label: 'Category',
        dbColumn: 'expenseCategory',
        placeholder: 'Select Category',
        options: expenseCategories
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
      id: item._id
    }))
  }

  // Handle toggle status
  const handleToggleStatus = async id => {
    setToggledId(id)
    toggleStatus(id, {
      onSuccess: () => {
        queryClient.invalidateQueries(['get-all-expenses'])
        toast.success('Expense status updated successfully')
      },
      onError: error => {
        toast.error(error.message || 'Error updating expense status')
      },
      onSettled: () => {
        setToggledId(null)
      }
    })
  }

  // Handle edit
  const handleEdit = expense => {
    setOneExpense(expense)
    setAddExpenseOpen(true)
  }

  return (
    <>
      {/* Top Section with Expenses heading and Add New Expense button */}
      <Card className='mb-6'>
        <div className='flex justify-between items-center p-6'>
          <Typography variant='h4' component='h1'>
            Expenses
          </Typography>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              setOneExpense(null)
              setAddExpenseOpen(!addExpenseOpen)
            }}
            className='max-sm:is-full'
          >
            Add New Expense
          </Button>
        </div>
      </Card>

      {/* Custom Data Table */}
      <CustomDataTable
        apiURL='/expenses'
        queryKey='get-all-expenses'
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

      {/* Add Expense Drawer */}
      {addExpenseOpen && (
        <AddExpenseDrawer
          open={addExpenseOpen}
          stateChanger={() => setAddExpenseOpen(!addExpenseOpen)}
          oneExpense={oneExpense}
          setOneExpense={setOneExpense}
        />
      )}
    </>
  )
}

export default ExpensesPage
