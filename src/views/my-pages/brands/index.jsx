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

// Third-party Imports
import { createColumnHelper } from '@tanstack/react-table'
import { useQueryClient } from '@tanstack/react-query'

// Component Imports
import CustomDataTable from '@components/custom-components/CustomDataTable'
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'
import { brandService } from '@/services/brandService'
import AddBrandDrawer from './AddBrandDrawer'

// Styled Components
const Icon = styled('i')({})

// Column Definitions
const columnHelper = createColumnHelper()

const BrandsPage = () => {
  // States
  const [oneBrand, setOneBrand] = useState(null)
  const [addBrandOpen, setAddBrandOpen] = useState(false)
  const [toggledId, setToggledId] = useState(null)

  // Hooks
  const { lang: locale } = useParams()
  const queryClient = useQueryClient()

  // Using `useMutation` to toggle brand status
  const { mutate: toggleStatus, isPending: isTogglingStatus } = brandService.toggleBrandStatus()

  // Define columns for the brands table
  const columns = [
    columnHelper.accessor('brandName', {
      header: 'Brand',
      cell: ({ row }) => (
        <div className='flex items-center gap-4'>
          {getAvatar({ avatar: null, fullName: row.original.brandName })}
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.brandName || 'N/A'}
            </Typography>
            {/* <Typography variant='body2'>{row.original.brandCode || 'N/A'}</Typography> */}
          </div>
        </div>
      )
    }),
    columnHelper.accessor('address', {
      header: 'Address',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {row.original.address || 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('primaryContact', {
      header: 'Contact',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography color='text.primary'>{row.original.primaryContact || 'N/A'}</Typography>
          {row.original.secondaryContact && (
            <Typography variant='body2' color='text.secondary'>
              {row.original.secondaryContact}
            </Typography>
          )}
        </div>
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

  // Define filters for the brands table
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
      id: item.id
    }))
  }

  // Handle toggle status
  const handleToggleStatus = async id => {
    setToggledId(id)
    toggleStatus(id, {
      onSuccess: () => {
        queryClient.invalidateQueries(['get-all-brands'])
        toast.success('Brand status updated successfully')
      },
      onError: error => {
        toast.error(error.message || 'Error updating brand status')
      },
      onSettled: () => {
        setToggledId(null)
      }
    })
  }

  // Handle edit
  const handleEdit = brand => {
    setOneBrand(brand)
    setAddBrandOpen(true)
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
      {/* Top Section with Brands heading and Add New Brand button */}
      <Card className='mb-6'>
        <div className='flex justify-between items-center p-6'>
          <Typography variant='h4' component='h1'>
            Brands
          </Typography>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              setOneBrand(null)
              setAddBrandOpen(!addBrandOpen)
            }}
            className='max-sm:is-full'
          >
            Add New Brand
          </Button>
        </div>
      </Card>

      {/* Custom Data Table */}
      <CustomDataTable
        apiURL='/brands'
        queryKey='get-all-brands'
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

      {/* Add Brand Drawer */}
      {addBrandOpen && (
        <AddBrandDrawer
          open={addBrandOpen}
          stateChanger={() => setAddBrandOpen(!addBrandOpen)}
          oneBrand={oneBrand}
          setOneBrand={setOneBrand}
        />
      )}
    </>
  )
}

export default BrandsPage
