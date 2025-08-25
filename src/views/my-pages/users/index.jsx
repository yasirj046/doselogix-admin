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
import AddUserDrawer from './AddUserDrawer'
import { customerService } from '@/services/customerService'

// Styled Components
const Icon = styled('i')({})

// Column Definitions
const columnHelper = createColumnHelper()

const UsersPage = () => {
  // States
  const [oneUser, setOneUser] = useState(null)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [provinces, setProvinces] = useState([])
  const [selectedProvince, setSelectedProvince] = useState('')
  const [cities, setCities] = useState([])
  const [toggledId, setToggledId] = useState(null)

  // Hooks
  const { lang: locale } = useParams()
  const queryClient = useQueryClient()

  // Using `useMutation` to toggle customer status
  const { mutate: toggleStatus, isPending: isTogglingStatus } = customerService.toggleCustomerStatus()

  // Define columns for the customers table
  const columns = [
    columnHelper.accessor('customerName', {
      header: 'Customer',
      cell: ({ row }) => (
        <div className='flex items-center gap-4'>
          {getAvatar({ avatar: null, fullName: row.original.customerName })}
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.customerName || 'N/A'}
            </Typography>
            <Typography variant='body2'>{row.original.customerCode || 'N/A'}</Typography>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('customerCategory', {
      header: 'Category',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Icon className='tabler-building-store' sx={{ color: 'var(--mui-palette-primary-main)' }} />
          <Typography className='capitalize' color='text.primary'>
            {row.original.customerCategory || 'N/A'}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('customerProvince', {
      header: 'Location',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {row.original.customerCity}, {row.original.customerProvince}
        </Typography>
      )
    }),
    columnHelper.accessor('customerPrimaryContact', {
      header: 'Contact',
      cell: ({ row }) => <Typography>{row.original.customerPrimaryContact || 'N/A'}</Typography>
    }),
    columnHelper.accessor('customerLicenseStatus', {
      header: 'License Status',
      cell: ({ row }) => {
        const status = row.original.customerLicenseStatus?.status || 'N/A'
        const daysRemaining = row.original.customerLicenseStatus?.daysRemaining

        let color = 'default'

        if (status === 'VALID') color = 'success'
        else if (status === 'URGENT') color = 'warning'
        else if (status === 'EXPIRED') color = 'error'
        else if (status === 'NOT_SET') color = 'secondary'

        return (
          <div className='flex items-center gap-3'>
            <Chip
              variant='tonal'
              label={`${status} ${daysRemaining ? `(${daysRemaining} days)` : ''}`}
              size='small'
              color={color}
              className='capitalize'
            />
          </div>
        )
      }
    }),
    columnHelper.accessor('customerStatus', {
      header: 'Status',
      cell: ({ row }) => {
        const customerId = row.original.id
        const isCurrentToggling = isTogglingStatus && toggledId === customerId

        const handleToggle = () => {
          setToggledId(customerId)
          toggleStatus(
            { id: customerId },
            {
              onSuccess: (response) => {
                const statusText = response.data.result.isActive ? 'activated' : 'deactivated'
                toast.success(`Customer ${statusText} successfully`)
                queryClient.invalidateQueries(['get-all-customers'])
              },
              onError: (error) => {
                console.error('Failed to toggle customer status', error)
                toast.error('Failed to update customer status')
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
                inputProps={{ 'aria-label': 'toggle customer status' }}
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
              setOneUser(row.original.id)
              setAddUserOpen(true)
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

  //Api call to get all provinces
  const { data: provincesData } = lookupService.getAllProvinces('get-all-provinces')

  useEffect(() => {
    if (provincesData?.data?.success) {
      setProvinces(provincesData.data.result)
    } else {
      setProvinces([])
    }
  }, [provincesData])

  //Api call to get all cities by province
  const { data: citiesData } = lookupService.getCitiesByProvince('get-cities-by-province', selectedProvince)

  useEffect(() => {
    if (citiesData?.data?.success) {
      setCities(citiesData.data.result)
    } else {
      setCities([])
    }
  }, [citiesData])

  // Define filters for the customers table
  const filters = {
    heading: 'Filters',
    filterArray: [
      {
        label: 'Province',
        dbColumn: 'customerProvince',
        placeholder: 'Select Province',
        options: provinces,
        onChange: value => {
          if (value == '') {
            setCities([])
          } else {
            setSelectedProvince(value)
          }
        }
      },
      {
        label: 'Cities',
        dbColumn: 'customerCity',
        placeholder: 'Select City',
        options: cities
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
      id: item.id,

      // Flatten license status for filtering
      licenseStatus: item.customerLicenseStatus?.status || 'N/A'
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
      {/* Top Section with Users heading and Add New User button */}
      <Card className='mb-6'>
        <div className='flex justify-between items-center p-6'>
          <Typography variant='h4' component='h1'>
            Users
          </Typography>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              setOneUser(null)
              setAddUserOpen(!addUserOpen)
            }}
            className='max-sm:is-full'
          >
            Add New User
          </Button>
        </div>
      </Card>

      {/* Custom Data Table */}
      <CustomDataTable
        apiURL='/customers'
        queryKey='get-all-customers'
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

      {/* Add User Drawer - Keep this if you have the component */}
      {addUserOpen && (
        <AddUserDrawer
          open={addUserOpen}
          stateChanger={() => setAddUserOpen(!addUserOpen)}
          oneUser={oneUser}
          setOneUser={setOneUser}
        />
      )}
    </>
  )
}

export default UsersPage
