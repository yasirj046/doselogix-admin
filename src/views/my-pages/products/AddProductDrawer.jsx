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
import { lookupService } from '@/services/lookupService'

const AddProductDrawer = ({ open, stateChanger, oneProduct, setOneProduct }) => {
  // States
  const [brands, setBrands] = useState([])
  const [groups, setGroups] = useState([])
  const [subGroups, setSubGroups] = useState([])

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
    brandId: Yup.string()
      .required('Brand is required'),
    groupId: Yup.string()
      .nullable()
      .trim(),
    subGroupId: Yup.string()
      .nullable()
      .trim(),
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
      subGroupId: oneProduct?.subGroupId?._id || oneProduct?.subGroupId || '',
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
  const { data: brandsData } = lookupService.getBrandsLookup('get-brands-lookup')
  const { data: groupsData } = lookupService.getGroupsLookup('get-groups-lookup', formik.values.brandId)
  const { data: subGroupsData } = lookupService.getSubGroupsLookup('get-subgroups-lookup', formik.values.groupId, formik.values.brandId)

  // Set brands data
  useEffect(() => {
    if (brandsData?.data?.success) {
      setBrands(brandsData.data.result || [])
    } else {
      setBrands([])
    }
  }, [brandsData])

  // Set groups data based on selected brand
  useEffect(() => {
    if (groupsData?.data?.success) {
      setGroups(groupsData.data.result || [])
    } else {
      setGroups([])
    }
  }, [groupsData])

  // Set subgroups data based on selected group
  useEffect(() => {
    if (subGroupsData?.data?.success) {
      setSubGroups(subGroupsData.data.result || [])
    } else {
      setSubGroups([])
    }
  }, [subGroupsData])

  // Clear group and subgroup selection when brand changes
  useEffect(() => {
    if (formik.values.brandId && formik.values.groupId && groups.length > 0) {
      // Check if current group selection is valid for the selected brand
      const isValidGroup = groups.some(group => group.value === formik.values.groupId)
      if (!isValidGroup) {
        formik.setFieldValue('groupId', '')
        formik.setFieldValue('subGroupId', '')
      }
    }
  }, [formik.values.brandId, groups])

  // Clear subgroup selection when group changes
  useEffect(() => {
    if (formik.values.groupId && formik.values.subGroupId && subGroups.length > 0) {
      // Check if current subgroup selection is valid for the selected group
      const isValidSubGroup = subGroups.some(subGroup => subGroup.value === formik.values.subGroupId)
      if (!isValidSubGroup) {
        formik.setFieldValue('subGroupId', '')
      }
    }
  }, [formik.values.groupId, subGroups])

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
              autoComplete={true}
            />

            <CustomSelect
              fullWidth
              name='groupId'
              label='Group'
              placeholder={formik.values.brandId ? 'Select Group' : 'First select a brand'}
              options={groups}
              disabled={!formik.values.brandId}
              autoComplete={true}
            />

            <CustomSelect
              fullWidth
              name='subGroupId'
              label='Sub Group'
              placeholder={formik.values.groupId ? 'Select Sub Group' : 'First select a group'}
              options={subGroups}
              disabled={!formik.values.groupId}
              autoComplete={true}
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
