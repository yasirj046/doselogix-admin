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
import { productService } from '@/services/productService'
import { brandService } from '@/services/brandService'
import { groupService } from '@/services/groupService'
import AddProductDrawer from './AddProductDrawer'

// Styled Components
const Icon = styled('i')({})

// Column Definitions
const columnHelper = createColumnHelper()

const ProductsPage = () => {
  // States
  const [oneProduct, setOneProduct] = useState(null)
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [toggledId, setToggledId] = useState(null)
  const [brands, setBrands] = useState([])
  const [groups, setGroups] = useState([])

  // Hooks
  const { lang: locale } = useParams()
  const queryClient = useQueryClient()

  // Using `useMutation` to toggle product status
  const { mutate: toggleStatus, isPending: isTogglingStatus } = productService.toggleProductStatus()

  // API calls for filter data
  const { data: brandsData } = brandService.getAllBrands('get-all-brands')
  const { data: groupsData } = groupService.getAllGroups('get-all-groups')

  useEffect(() => {
    if (brandsData?.data?.success) {
      setBrands(brandsData.data.result?.docs || brandsData.data.result || [])
    } else {
      setBrands([])
    }
  }, [brandsData])

  useEffect(() => {
    if (groupsData?.data?.success) {
      setGroups(groupsData.data.result?.docs || groupsData.data.result || [])
    } else {
      setGroups([])
    }
  }, [groupsData])

  // Define columns for the products table
  const columns = [
    columnHelper.accessor('productName', {
      header: 'Product',
      cell: ({ row }) => (
        <div className='flex items-center gap-4'>
          {getAvatar({ avatar: null, fullName: row.original.productName })}
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.productName || 'N/A'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {row.original.packingSize || 'N/A'}
            </Typography>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('brandId.brandName', {
      header: 'Brand',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Icon className='tabler-brand-tabler' sx={{ color: 'var(--mui-palette-primary-main)' }} />
          <Typography color='text.primary'>
            {row.original.brandId?.brandName || 'N/A'}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('groupId', {
      header: 'Group/Category',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography color='text.primary' className='font-medium'>
            {row.original.groupId?.group || 'N/A'}
          </Typography>
          {row.original.groupId?.subGroup && (
            <Typography variant='body2' color='text.secondary'>
              {row.original.groupId.subGroup}
            </Typography>
          )}
        </div>
      )
    }),
    columnHelper.accessor('packingSize', {
      header: 'Packaging',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography color='text.primary'>
            <strong>Pack:</strong> {row.original.packingSize || 'N/A'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            <strong>Carton:</strong> {row.original.cartonSize || 'N/A'}
          </Typography>
        </div>
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

  // Define filters for the products table
  const filters = {
    heading: 'Filters',
    filterArray: [
      {
        label: 'Brand',
        dbColumn: 'brandId',
        placeholder: 'Select Brand',
        options: brands.map(brand => ({
          value: brand._id,
          label: brand.brandName
        }))
      },
      {
        label: 'Group',
        dbColumn: 'groupId',
        placeholder: 'Select Group',
        options: groups.map(group => ({
          value: group._id,
          label: `${group.group}${group.subGroup ? ` - ${group.subGroup}` : ''}`
        }))
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
      id: item._id,
      // Add status for filtering
      status: item.isActive ? 'Active' : 'Inactive',
      // Flatten brand and group for filtering
      brandName: item.brandId?.brandName || '',
      groupName: item.groupId?.group || '',
      subGroupName: item.groupId?.subGroup || ''
    }))
  }

  // Handle toggle status
  const handleToggleStatus = async id => {
    setToggledId(id)
    toggleStatus(id, {
      onSuccess: () => {
        queryClient.invalidateQueries(['get-all-products'])
        toast.success('Product status updated successfully')
      },
      onError: error => {
        toast.error(error.message || 'Error updating product status')
      },
      onSettled: () => {
        setToggledId(null)
      }
    })
  }

  // Handle edit
  const handleEdit = product => {
    setOneProduct(product)
    setAddProductOpen(true)
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
      {/* Top Section with Products heading and Add New Product button */}
      <Card className='mb-6'>
        <div className='flex justify-between items-center p-6'>
          <Typography variant='h4' component='h1'>
            Products
          </Typography>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              setOneProduct(null)
              setAddProductOpen(!addProductOpen)
            }}
            className='max-sm:is-full'
          >
            Add New Product
          </Button>
        </div>
      </Card>

      {/* Custom Data Table */}
      <CustomDataTable
        apiURL='/products'
        queryKey='get-all-products'
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

      {/* Add Product Drawer */}
      {addProductOpen && (
        <AddProductDrawer
          open={addProductOpen}
          stateChanger={() => setAddProductOpen(!addProductOpen)}
          oneProduct={oneProduct}
          setOneProduct={setOneProduct}
        />
      )}
    </>
  )
}

export default ProductsPage
