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

// Util Imports
import { lookupService } from '@/services/lookupService'
import AddAreaDrawer from './AddAreaDrawer'
import { areaService } from '@/services/areaService'

// Styled Components
const Icon = styled('i')({})

// Column Definitions
const columnHelper = createColumnHelper()

const AreasPage = () => {
  // States
  const [oneArea, setOneArea] = useState(null)
  const [addAreaOpen, setAddAreaOpen] = useState(false)
  const [areas, setAreas] = useState([])
  const [subareas, setSubareas] = useState([])
  const [selectedArea, setSelectedArea] = useState('')
  const [toggledId, setToggledId] = useState(null)

  // Hooks
  const { lang: locale } = useParams()
  const queryClient = useQueryClient()

  // Using `useMutation` to toggle area status
  const { mutate: toggleStatus, isPending: isTogglingStatus } = areaService.toggleAreaStatus()

  // Define columns for the areas table
  const columns = [
    columnHelper.accessor('area', {
      header: 'Area',
      cell: ({ row }) => (
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Icon className='tabler-map-pin' sx={{ color: 'var(--mui-palette-primary-main)' }} />
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.area || 'N/A'}
              </Typography>
            </div>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('subArea', {
      header: 'Sub Area',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Icon className='tabler-map-2' sx={{ color: 'var(--mui-palette-secondary-main)' }} />
          <Typography className='capitalize' color='text.primary'>
            {row.original.subArea || 'N/A'}
          </Typography>
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
        const areaId = row.original.id
        const isCurrentToggling = isTogglingStatus && toggledId === areaId

        const handleToggle = () => {
          setToggledId(areaId)
          toggleStatus(
            { id: areaId },
            {
              onSuccess: (response) => {
                const statusText = response.data.result.isActive ? 'activated' : 'deactivated'
                toast.success(`Area ${statusText} successfully`)
                queryClient.invalidateQueries(['get-all-areas'])
              },
              onError: (error) => {
                console.error('Failed to toggle area status', error)
                toast.error('Failed to update area status')
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
                inputProps={{ 'aria-label': 'toggle area status' }}
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
              setOneArea(row.original.id)
              setAddAreaOpen(true)
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

  //Api call to get all areas for lookup
  const { data: areasData, isLoading: areasLoading = false, error: areasError } = lookupService.getAreasLookup('get-areas-lookup')

  useEffect(() => {
    if (areasData?.data?.success) {
      setAreas(areasData.data.result || [])
    } else {
      setAreas([])
    }
  }, [areasData])

  //Api call to get all subareas for lookup (filtered by selected area)
  const { data: subareasData, isLoading: subareasLoading = false, error: subareasError } = lookupService.getSubAreasLookup('get-subareas-lookup', selectedArea)

  useEffect(() => {
    if (subareasData?.data?.success) {
      setSubareas(subareasData.data.result || [])
    } else {
      setSubareas([])
    }
  }, [subareasData, selectedArea])

  // Handle lookup errors
  useEffect(() => {
    if (areasError) {
      console.error('Error loading areas for lookup:', areasError)
      toast.error('Failed to load areas for filters')
    }
  }, [areasError])

  useEffect(() => {
    if (subareasError) {
      console.error('Error loading subareas for lookup:', subareasError)
      toast.error('Failed to load subareas for filters')
    }
  }, [subareasError])

  // Define filters for the areas table
  const filters = {
    heading: 'Filters',
    filterArray: [
      {
        label: 'Area',
        dbColumn: 'area',
        placeholder: areasLoading ? 'Loading areas...' : 'Select Area',
        options: areas.map(area => {
          if (typeof area === 'string') {
            return { value: area, label: area };
          }
          return {
            value: area.value || area.label || area,
            label: area.label || area.value || area
          };
        }),
        disabled: areasLoading,
        onChange: value => {
          if (value === '') {
            setSubareas([])
            setSelectedArea('')
          } else {
            setSelectedArea(value)
          }
        }
      },
      {
        label: 'Sub Area',
        dbColumn: 'subArea',
        placeholder: subareasLoading ? 'Loading subareas...' : 'Select Sub Area',
        options: subareas.map(subarea => {
          if (typeof subarea === 'string') {
            return { value: subarea, label: subarea };
          }
          return {
            value: subarea.value || subarea.label || subarea,
            label: subarea.label || subarea.value || subarea
          };
        }),
        disabled: subareasLoading
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

  return (
    <>
      {/* Top Section with Areas heading and Add New Area button */}
      <Card className='mb-6'>
        <div className='flex justify-between items-center p-6'>
          <Typography variant='h4' component='h1'>
            Areas
          </Typography>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              setOneArea(null)
              setAddAreaOpen(!addAreaOpen)
            }}
            className='max-sm:is-full'
          >
            Add New Area
          </Button>
        </div>
      </Card>

      {/* Custom Data Table */}
      <CustomDataTable
        apiURL='/areas'
        queryKey='get-all-areas'
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

      {/* Add Area Drawer */}
      {addAreaOpen && (
        <AddAreaDrawer
          open={addAreaOpen}
          stateChanger={() => setAddAreaOpen(!addAreaOpen)}
          oneArea={oneArea}
          setOneArea={setOneArea}
        />
      )}
    </>
  )
}

export default AreasPage
