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
import Chip from '@mui/material/Chip'
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
import { groupService } from '@/services/groupService'
import { brandService } from '@/services/brandService'
import AddGroupDrawer from './AddGroupDrawer'

// Styled Components
const Icon = styled('i')({})

// Column Definitions
const columnHelper = createColumnHelper()

const GroupsPage = () => {
  // States
  const [oneGroup, setOneGroup] = useState(null)
  const [addGroupOpen, setAddGroupOpen] = useState(false)
  const [brands, setBrands] = useState([])
  const [uniqueGroups, setUniqueGroups] = useState([])
  const [toggledId, setToggledId] = useState(null)

  // Hooks
  const { lang: locale } = useParams()
  const queryClient = useQueryClient()

  // Using `useMutation` to toggle group status
  const { mutate: toggleStatus, isPending: isTogglingStatus } = groupService.toggleGroupStatus()

  // Define columns for the groups table
  const columns = [
    columnHelper.accessor('group', {
      header: 'Group',
      cell: ({ row }) => (
        <div className='flex items-center gap-4'>
          {getAvatar({ avatar: null, fullName: row.original.group })}
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.group || 'N/A'}
            </Typography>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('subGroup', {
      header: 'Sub Group',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {row.original.subGroup || 'N/A'}
        </Typography>
      )
    }),
    columnHelper.accessor('brandId', {
      header: 'Brand',
      cell: ({ row }) => {
        // Get brand name from populated brandId field or fallback to brands array lookup
        let brandName = 'N/A'

        if (row.original.brandId) {
          // If brandId is populated (object), get brandName directly
          if (typeof row.original.brandId === 'object' && row.original.brandId.brandName) {
            brandName = row.original.brandId.brandName
          }
          // If brandId is just an ID string, find from brands array
          else if (typeof row.original.brandId === 'string') {
            const brand = brands.find(b => b._id === row.original.brandId)
            brandName = brand?.brandName || 'N/A'
          }
        }

        return (
          <div className='flex items-center gap-2'>
            <Icon className='tabler-building-store' sx={{ color: 'var(--mui-palette-primary-main)' }} />
            <Typography className='capitalize' color='text.primary'>
              {brandName}
            </Typography>
          </div>
        )
      }
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ row }) => {
        const groupId = row.original._id
        const isCurrentToggling = isTogglingStatus && toggledId === groupId

        const handleToggle = () => {
          setToggledId(groupId)
          toggleStatus(
            { id: groupId },
            {
              onSuccess: (response) => {
                const statusText = response.data.result.isActive ? 'activated' : 'deactivated'
                toast.success(`Group ${statusText} successfully`)
                queryClient.invalidateQueries(['get-all-groups'])
              },
              onError: (error) => {
                console.error('Failed to toggle group status', error)
                toast.error('Failed to update group status')
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
                inputProps={{ 'aria-label': 'toggle group status' }}
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
              setOneGroup(row.original._id)
              setAddGroupOpen(true)
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

  //Api call to get all brands
  const { data: brandsData } = brandService.getAllBrands('get-all-brands')

  //Api call to get all unique groups for filter
  const { data: uniqueGroupsData } = groupService.getAllUniqueGroups('get-all-unique-groups')

  useEffect(() => {
    if (brandsData?.data?.success) {
      setBrands(brandsData.data.result.docs || brandsData.data.result || [])
    } else {
      setBrands([])
    }
  }, [brandsData])

  useEffect(() => {
    if (uniqueGroupsData?.data?.success) {
      // Transform unique groups for dropdown options
      const result = uniqueGroupsData.data.result
      const groupOptions = Array.isArray(result) ? result.map(group => ({
        value: typeof group === 'string' ? group : group.group || group.value || group,
        label: typeof group === 'string' ? group : group.group || group.label || group
      })) : []
      setUniqueGroups(groupOptions)
    } else {
      setUniqueGroups([])
    }
  }, [uniqueGroupsData])

  // Transform brands for filter options - ensure brands array is populated
  const brandOptions = brands.length > 0 ? brands.map(brand => ({
    value: brand._id,
    label: brand.brandName
  })) : []

  // Define filters for the groups table
  const filters = {
    heading: 'Filters',
    filterArray: [
      {
        label: 'Brand',
        dbColumn: 'brandId',
        placeholder: 'Select Brand',
        options: brandOptions
      },
      {
        label: 'Group',
        dbColumn: 'group',
        placeholder: 'Select Group',
        options: uniqueGroups
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
      id: item._id
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
      {/* Top Section with Groups heading and Add New Group button */}
      <Card className='mb-6'>
        <div className='flex justify-between items-center p-6'>
          <Typography variant='h4' component='h1'>
            Groups
          </Typography>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              setOneGroup(null)
              setAddGroupOpen(!addGroupOpen)
            }}
            className='max-sm:is-full'
          >
            Add New Group
          </Button>
        </div>
      </Card>

      {/* Custom Data Table */}
      <CustomDataTable
        apiURL='/groups'
        queryKey='get-all-groups'
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

      {/* Add Group Drawer */}
      {addGroupOpen && (
        <AddGroupDrawer
          open={addGroupOpen}
          stateChanger={() => setAddGroupOpen(!addGroupOpen)}
          oneGroup={oneGroup}
          setOneGroup={setOneGroup}
        />
      )}
    </>
  )
}

export default GroupsPage
