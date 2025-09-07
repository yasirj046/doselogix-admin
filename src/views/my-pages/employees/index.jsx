'use client'

// React Imports
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

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
import AddEmployeeDrawer from './AddEmployeeDrawer'
import { employeeService } from '@/services/EmployeeService'

// Styled Components
const Icon = styled('i')({})

// Column Definitions
const columnHelper = createColumnHelper()

const EmployeesPage = () => {
  // States
  const [oneEmployee, setOneEmployee] = useState(null)
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [designations, setDesignations] = useState([])
  const [toggledId, setToggledId] = useState(null)

  // Hooks
  const { lang: locale } = useParams()
  const queryClient = useQueryClient()

  // Using `useMutation` to toggle employee status
  const { mutate: toggleStatus, isPending: isTogglingStatus } = employeeService.toggleEmployeeStatus()

  // Define columns for the employees table
  const columns = [
    columnHelper.accessor('employeeName', {
      header: 'Employee',
      cell: ({ row }) => (
        <div className='flex items-center gap-4'>
          {getAvatar({ avatar: null, fullName: row.original.employeeName })}
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.employeeName || 'N/A'}
            </Typography>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('designation', {
      header: 'Designation',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Icon className='tabler-user-check' sx={{ color: 'var(--mui-palette-primary-main)' }} />
          <Typography className='capitalize' color='text.primary'>
            {row.original.designation || 'N/A'}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('city', {
      header: 'Location',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {row.original.city || 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('primaryContact', {
      header: 'Contact',
      cell: ({ row }) => <Typography>{row.original.primaryContact || 'N/A'}</Typography>
    }),
    columnHelper.accessor('salary', {
      header: 'Salary',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {row.original.salary ? `Rs. ${row.original.salary.toLocaleString()}` : 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('createdAt', {
          header: 'Created Date',
          cell: ({ row }) => (
            <Typography color='text.primary'>
              {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : 'N/A'}
            </Typography>
          )
        }),
    columnHelper.accessor('employeeStatus', {
      header: 'Status',
      cell: ({ row }) => {
        const employeeId = row.original.id
        const isCurrentToggling = isTogglingStatus && toggledId === employeeId

        const handleToggle = () => {
          setToggledId(employeeId)
          toggleStatus(
            { id: employeeId },
            {
              onSuccess: (response) => {
                const statusText = response.data.result.isActive ? 'activated' : 'deactivated'
                toast.success(`Employee ${statusText} successfully`)
                queryClient.invalidateQueries(['get-all-employees'])
              },
              onError: (error) => {
                console.error('Failed to toggle employee status', error)
                toast.error('Failed to update employee status')
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
                inputProps={{ 'aria-label': 'toggle employee status' }}
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
          <div className='flex items-center'>
            <IconButton onClick={() => {
              setOneEmployee(row.original.id)
              setAddEmployeeOpen(true)
            }}>
              <div className='flex'>
                <i className='tabler-edit text-textSecondary' />
              </div>
            </IconButton>
          </div>
        )
      },
      enableSorting: false
    })
  ]

  //Api call to get all designations
  const { data: designationsData } = lookupService.getAllDesignations('get-all-designations')

  useEffect(() => {
    if (designationsData?.data?.success) {
      setDesignations(designationsData.data.result)
    } else {
      setDesignations([])
    }
  }, [designationsData])

  // Define filters for the employees table
  const filters = {
    heading: 'Filters',
    filterArray: [
      {
        label: 'Designation',
        dbColumn: 'designation',
        placeholder: 'Select Designation',
        options: designations
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
    // The API returns data in result.docs structure
    const data = apiResponse?.result?.docs || apiResponse?.docs || apiResponse || []

    // Transform the data to flatten nested fields for better filtering
    return data.map(item => ({
      ...item,
      id: item._id || item.id
    }))
  }

  const getAvatar = params => {
    const { avatar, fullName } = params

    if (avatar) {
      return <CustomAvatar src={avatar} size={34} />
    } else {
      return <CustomAvatar size={34}>{getInitials(fullName || 'N/A')}</CustomAvatar>
    }
  }

  return (
    <>
      {/* Top Section with Employees heading and Add New Employee button */}
      <Card className='mb-6'>
        <div className='flex justify-between items-center p-6'>
          <Typography variant='h4' component='h1'>
            Employees
          </Typography>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              setOneEmployee(null)
              setAddEmployeeOpen(!addEmployeeOpen)
            }}
            className='max-sm:is-full'
          >
            Add New Employee
          </Button>
        </div>
      </Card>

      {/* Custom Data Table */}
      <CustomDataTable
        apiURL='/employees'
        queryKey='get-all-employees'
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

      {/* Add Employee Drawer */}
      {addEmployeeOpen && (
        <AddEmployeeDrawer
          open={addEmployeeOpen}
          stateChanger={() => setAddEmployeeOpen(!addEmployeeOpen)}
          oneEmployee={oneEmployee}
          setOneEmployee={setOneEmployee}
        />
      )}
    </>
  )
}

export default EmployeesPage
