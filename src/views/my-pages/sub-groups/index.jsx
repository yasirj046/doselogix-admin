'use client'

// React Imports
import { useEffect, useState } from 'react'

import { toast } from 'react-toastify'

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

// Util Imports
import { subGroupService } from '@/services/subGroupService'
import { lookupService } from '@/services/lookupService'
import AddSubGroupDrawer from './AddSubGroupDrawer'

// Styled Components
const Icon = styled('i')({})

// Column Definitions
const columnHelper = createColumnHelper()

const SubGroupsPage = () => {
  // States
  const [oneSubGroup, setOneSubGroup] = useState(null)
  const [addSubGroupOpen, setAddSubGroupOpen] = useState(false)
  const [brands, setBrands] = useState([])
  const [groups, setGroups] = useState([])
  const [toggledId, setToggledId] = useState(null)
  const [selectedBrandId, setSelectedBrandId] = useState('')

  // Hooks
  const queryClient = useQueryClient()

  // Using `useMutation` to toggle sub group status
  const { mutate: toggleStatus, isPending: isTogglingStatus } = subGroupService.toggleSubGroupStatus()

  // Define columns for the sub groups table
  const columns = [
    columnHelper.accessor('subGroupName', {
      header: 'Sub Group',
      cell: ({ row }) => (
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Icon className='tabler-category' sx={{ color: 'var(--mui-palette-primary-main)' }} />
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.subGroupName || 'N/A'}
              </Typography>
            </div>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('groupId', {
      header: 'Group',
      cell: ({ row }) => {
        // Get group name from populated groupId field
        let groupName = 'N/A'

        if (row.original.groupId) {
          // If groupId is populated (object), get groupName directly
          if (typeof row.original.groupId === 'object' && row.original.groupId.groupName) {
            groupName = row.original.groupId.groupName
          }
          // If groupId is just an ID string, find from groups array
          else if (typeof row.original.groupId === 'string') {
            const group = groups.find(g => g._id === row.original.groupId)
            groupName = group?.groupName || 'N/A'
          }
        }

        return (
          <div className='flex items-center gap-2'>
            <Icon className='tabler-stack-2' sx={{ color: 'var(--mui-palette-primary-main)' }} />
            <Typography className='capitalize' color='text.primary'>
              {groupName}
            </Typography>
          </div>
        )
      }
    }),
    columnHelper.accessor('brandId', {
      header: 'Brand',
      cell: ({ row }) => {
        // Get brand name from nested populated structure
        let brandName = 'N/A'

        if (row.original.groupId && typeof row.original.groupId === 'object') {
          if (row.original.groupId.brandId) {
            if (typeof row.original.groupId.brandId === 'object' && row.original.groupId.brandId.brandName) {
              brandName = row.original.groupId.brandId.brandName
            }
            else if (typeof row.original.groupId.brandId === 'string') {
              const brand = brands.find(b => b._id === row.original.groupId.brandId)
              brandName = brand?.brandName || 'N/A'
            }
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
        const subGroupId = row.original._id
        const isCurrentToggling = isTogglingStatus && toggledId === subGroupId

        const handleToggle = () => {
          setToggledId(subGroupId)
          toggleStatus(
            { id: subGroupId },
            {
              onSuccess: (response) => {
                const statusText = response.data.result.isActive ? 'activated' : 'deactivated'
                toast.success(`Sub group ${statusText} successfully`)
                queryClient.invalidateQueries(['get-all-sub-groups'])
              },
              onError: (error) => {
                console.error('Failed to toggle sub group status', error)
                toast.error('Failed to update sub group status')
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
                inputProps={{ 'aria-label': 'toggle sub group status' }}
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
              setOneSubGroup(row.original._id)
              setAddSubGroupOpen(true)
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

  // Api call to get all brands for filters
  const { data: brandsData } = lookupService.getBrandsLookup('get-brands-lookup')

  // Api call to get groups based on selected brand (dependent filter)
  const { data: groupsData } = lookupService.getGroupsLookup('get-groups-lookup', selectedBrandId)

  useEffect(() => {
    if (brandsData?.data?.success) {
      setBrands(brandsData.data.result.docs || brandsData.data.result || [])
    } else {
      setBrands([])
    }
  }, [brandsData])

  useEffect(() => {
    if (groupsData?.data?.success) {
      setGroups(groupsData.data.result.docs || groupsData.data.result || [])
    } else {
      setGroups([])
    }
  }, [groupsData])

  // Transform brands for filter options
  const brandOptions = brands.length > 0 ? brands.map(brand => ({
    value: brand.value || brand._id,
    label: brand.label || brand.brandName
  })) : []

  // Transform groups for filter options
  const groupOptions = groups.length > 0 ? groups.map(group => ({
    value: group.value || group._id,
    label: group.label || group.groupName
  })) : []

  // Define filters for the sub groups table
  const filters = {
    heading: 'Filters',
    filterArray: [
      {
        label: 'Brand',
        dbColumn: 'brandId',
        placeholder: 'Select Brand',
        options: brandOptions,
        onChange: (value) => {
          setSelectedBrandId(value)
          // Clear groups when brand changes to avoid stale data
          if (!value) {
            setGroups([])
          }
        }
      },
      {
        label: 'Group',
        dbColumn: 'groupId',
        placeholder: 'Select Group',
        options: groupOptions
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

  return (
    <>
      {/* Top Section with Sub Groups heading and Add New Sub Group button */}
      <Card className='mb-6'>
        <div className='flex justify-between items-center p-6'>
          <Typography variant='h4' component='h1'>
            Sub Groups
          </Typography>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              setOneSubGroup(null)
              setAddSubGroupOpen(!addSubGroupOpen)
            }}
            className='max-sm:is-full'
          >
            Add New Sub Group
          </Button>
        </div>
      </Card>

      {/* Custom Data Table */}
      <CustomDataTable
        apiURL='/subgroups'
        queryKey='get-all-sub-groups'
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

      {/* Add Sub Group Drawer */}
      {addSubGroupOpen && (
        <AddSubGroupDrawer
          open={addSubGroupOpen}
          stateChanger={() => setAddSubGroupOpen(!addSubGroupOpen)}
          oneSubGroup={oneSubGroup}
          setOneSubGroup={setOneSubGroup}
        />
      )}
    </>
  )
}

export default SubGroupsPage
