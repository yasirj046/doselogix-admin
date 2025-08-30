'use client'

// React Imports
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import LoadingButton from '@mui/lab/LoadingButton'

// Third-party Imports
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useQueryClient } from '@tanstack/react-query'

// Component Imports
import FormikProvider from '@/contexts/formikContext'
import CustomInput from '@/components/custom-components/CustomInput'
import CustomSelect from '@/components/custom-components/CustomSelect'

// Service Imports
import { productService } from '@/services/productService'
import { brandService } from '@/services/brandService'
import { groupService } from '@/services/groupService'

const AddProductDrawer = ({ open, stateChanger, oneProduct, setOneProduct }) => {
  // States
  const [brands, setBrands] = useState([])
  const [groups, setGroups] = useState([])

  // Hooks
  const { lang: locale } = useParams()
  const queryClient = useQueryClient()

  // API mutations
  const { mutate: createProduct, isPending: isCreatingProduct } = productService.createProduct()
  const { mutate: updateProduct, isPending: isUpdatingProduct } = productService.updateProduct()

  // Form validation schema
  const validationSchema = Yup.object().shape({
    productName: Yup.string()
      .required('Product name is required')
      .trim()
      .max(200, 'Product name cannot exceed 200 characters'),
    brandId: Yup.string().required('Brand is required'),
    groupId: Yup.string().required('Group is required'),
    packingSize: Yup.string()
      .required('Packing size is required')
      .trim()
      .max(100, 'Packing size cannot exceed 100 characters'),
    cartonSize: Yup.string()
      .required('Carton size is required')
      .trim()
      .max(100, 'Carton size cannot exceed 100 characters')
  })

  // Formik instance
  const formik = useFormik({
    initialValues: {
      productName: oneProduct?.productName || '',
      brandId: oneProduct?.brandId?._id || oneProduct?.brandId || '',
      groupId: oneProduct?.groupId?._id || oneProduct?.groupId || '',
      packingSize: oneProduct?.packingSize || '',
      cartonSize: oneProduct?.cartonSize || ''
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      const payload = {
        ...values,
        productName: values.productName.trim(),
        packingSize: values.packingSize.trim(),
        cartonSize: values.cartonSize.trim()
      }

      if (oneProduct) {
        updateProduct(
          { id: oneProduct._id, data: payload },
          {
            onSuccess: () => {
              toast.success('Product updated successfully')
              queryClient.invalidateQueries(['get-all-products'])
              handleClose()
            },
            onError: error => {
              const errorMessage = error?.response?.data?.error || error.message || 'Error updating product'
              toast.error(errorMessage)
            }
          }
        )
      } else {
        createProduct(payload, {
          onSuccess: () => {
            toast.success('Product created successfully')
            queryClient.invalidateQueries(['get-all-products'])
            handleClose()
          },
          onError: error => {
            const errorMessage = error?.response?.data?.error || error.message || 'Error creating product'
            toast.error(errorMessage)
          }
        })
      }
    }
  })

  // API calls for dropdown data
  const { data: brandsData } = brandService.getAllBrands('get-all-brands')
  const { data: groupsData } = groupService.getGroupsByBrand('get-groups-by-brand', formik.values.brandId)

  // Set brands data
  useEffect(() => {
    if (brandsData?.data?.success) {
      const brandOptions = (brandsData.data.result?.docs || brandsData.data.result || []).map(brand => ({
        value: brand._id,
        label: brand.brandName
      }))
      setBrands(brandOptions)
    } else {
      setBrands([])
    }
  }, [brandsData])

  // Set groups data based on selected brand
  useEffect(() => {
    if (groupsData?.data?.success) {
      const groupOptions = (groupsData.data.result?.docs || groupsData.data.result || []).map(group => ({
        value: group._id,
        label: `${group.group}${group.subGroup ? ` - ${group.subGroup}` : ''}`
      }))
      setGroups(groupOptions)
    } else {
      setGroups([])
    }
  }, [groupsData])

  // Clear group selection when brand changes
  useEffect(() => {
    if (formik.values.brandId && formik.values.groupId && groups.length > 0) {
      // Check if current group selection is valid for the selected brand
      const isValidGroup = groups.some(group => group.value === formik.values.groupId)
      if (!isValidGroup) {
        formik.setFieldValue('groupId', '')
      }
    }
  }, [formik.values.brandId, groups])

  // Close drawer handler
  const handleClose = () => {
    formik.resetForm()
    setOneProduct(null)
    stateChanger()
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between plb-5 pli-6'>
        <Typography variant='h5'>{oneProduct ? 'Edit Product' : 'Add New Product'}</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form onSubmit={formik.handleSubmit} className='flex flex-col gap-6 p-6'>
          <FormikProvider formik={{ ...formik, isLoading: isCreatingProduct || isUpdatingProduct }}>
            <CustomInput
              fullWidth
              name='productName'
              label='Product Name'
              placeholder='Enter product name'
              requiredField
            />

            <CustomSelect
              fullWidth
              name='brandId'
              label='Brand'
              placeholder='Select Brand'
              options={brands}
              requiredField
            />

            <CustomSelect
              fullWidth
              name='groupId'
              label='Group/Category'
              placeholder={formik.values.brandId ? 'Select Group' : 'First select a brand'}
              options={groups}
              requiredField
              disabled={!formik.values.brandId}
            />

            <CustomInput
              fullWidth
              name='packingSize'
              label='Packing Size'
              placeholder='Enter packing size (e.g., 10 tablets, 500ml)'
              requiredField
            />

            <CustomInput
              fullWidth
              name='cartonSize'
              label='Carton Size'
              placeholder='Enter carton size (e.g., 10 boxes, 24 bottles)'
              requiredField
            />

            <LoadingButton
              fullWidth
              type='submit'
              variant='contained'
              loading={isCreatingProduct || isUpdatingProduct}
            >
              {oneProduct ? 'Update Product' : 'Add Product'}
            </LoadingButton>
          </FormikProvider>
        </form>
      </div>
    </Drawer>
  )
}

export default AddProductDrawer
