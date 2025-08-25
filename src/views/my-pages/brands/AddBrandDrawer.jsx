'use client'

// React Imports
import { useEffect } from 'react'
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
import CustomTextField from '@core/components/mui/TextField'
import CustomInput from '@/components/custom-components/CustomInput'

// Service Imports
import { brandService } from '@/services/brandService'

const AddBrandDrawer = ({ open, stateChanger, oneBrand, setOneBrand }) => {
  // Hooks
  const { lang: locale } = useParams()
  const queryClient = useQueryClient()

  // API mutations
  const { mutate: createBrand, isPending: isCreatingBrand } = brandService.createBrand()
  const { mutate: updateBrand, isPending: isUpdatingBrand } = brandService.updateBrand()

  // Form validation schema
  const validationSchema = Yup.object().shape({
    brandName: Yup.string().required('Brand name is required').max(200, 'Brand name cannot exceed 200 characters'),
    address: Yup.string().required('Address is required').max(500, 'Address cannot exceed 500 characters'),
    primaryContact: Yup.string().max(20, 'Primary contact cannot exceed 20 characters'),
    secondaryContact: Yup.string().max(20, 'Secondary contact cannot exceed 20 characters')
  })

  // Formik instance
  const formik = useFormik({
    initialValues: {
      brandName: oneBrand?.brandName || '',
      address: oneBrand?.address || '',
      primaryContact: oneBrand?.primaryContact || '',
      secondaryContact: oneBrand?.secondaryContact || ''
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      const payload = {
        ...values
      }

      if (oneBrand) {
        updateBrand(
          { id: oneBrand._id, data: payload },
          {
            onSuccess: () => {
              toast.success('Brand updated successfully')
              queryClient.invalidateQueries(['get-all-brands'])
              handleClose()
            },
            onError: error => {
              toast.error(error.message || 'Error updating brand')
            }
          }
        )
      } else {
        createBrand(payload, {
          onSuccess: () => {
            toast.success('Brand created successfully')
            queryClient.invalidateQueries(['get-all-brands'])
            handleClose()
          },
          onError: error => {
            toast.error(error.message || 'Error creating brand')
          }
        })
      }
    }
  })

  // Close drawer handler
  const handleClose = () => {
    formik.resetForm()
    setOneBrand(null)
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
        <Typography variant='h5'>{oneBrand ? 'Edit Brand' : 'Add New Brand'}</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form onSubmit={formik.handleSubmit} className='flex flex-col gap-6 p-6'>
          <FormikProvider formik={{ ...formik, isLoading: isCreatingBrand || isUpdatingBrand }}>
            <CustomInput
              fullWidth
              name='brandName'
              label='Brand Name'
              placeholder='Enter brand name'
              requiredField
            />

            <CustomInput
              fullWidth
              multiline
              rows={3}
              name='address'
              label='Address'
              placeholder='Enter address'
              requiredField
            />

            <CustomInput
              fullWidth
              name='primaryContact'
              label='Primary Contact'
              placeholder='Enter primary contact'
            />

            <CustomInput
              fullWidth
              name='secondaryContact'
              label='Secondary Contact'
              placeholder='Enter secondary contact'
            />

            <LoadingButton
              fullWidth
              type='submit'
              variant='contained'
              loading={isCreatingBrand || isUpdatingBrand}
            >
              {oneBrand ? 'Update' : 'Submit'}
            </LoadingButton>
          </FormikProvider>
        </form>
      </div>
    </Drawer>
  )
}

export default AddBrandDrawer 