import { useEffect, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'

// Component Imports
import * as Yup from 'yup'

import { useFormik } from 'formik'

import { toast } from 'react-toastify'

import { useQueryClient } from '@tanstack/react-query'

import CustomTextField from '@core/components/mui/TextField'

import FormikProvider from '@/contexts/formikContext'
import CustomInput from '@/components/custom-components/CustomInput'
import { lookupService } from '@/services/lookupService'
import { customerService } from '@/services/customerService'
import CustomSelect from '@/components/custom-components/CustomSelect'


import CustomButton from '@/components/custom-components/CustomButton'

const AddUserDrawer = props => {
  // Props
  const { open, stateChanger, oneUser, setOneUser } = props

  // States
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [categories, setCategories] = useState([])
  const [areas, setAreas] = useState([])
  const [subAreas, setSubAreas] = useState([])
  const [selectedArea, setSelectedArea] = useState('')
  const [oneUserData, setOneUserData] = useState(null)
  const queryClient = useQueryClient()

  //Api call to get one customer details
  const { data: fetchedOneUserData } = customerService.getOneCustomerDetails('get-one-customer', oneUser)

  useEffect(() => {
    if (fetchedOneUserData?.data?.success) {
      setOneUserData(fetchedOneUserData.data.result)
    }
  }, [fetchedOneUserData])

  useEffect(() => {
    if (oneUserData) {
      formik.setValues({
        customerName: oneUserData.customerName || null,
        customerProvince: oneUserData.customerProvince || '',
        customerCity: oneUserData.customerCity || '',
        customerAddress: oneUserData.customerAddress || null,
        customerCategory: oneUserData.customerCategory || '',
        customerArea: oneUserData.customerArea?._id || oneUserData.customerArea || null,
        customerSubArea: oneUserData.customerSubArea?._id || oneUserData.customerSubArea || '',
        customerPrimaryContact: oneUserData.customerPrimaryContact || null,
        customerSecondaryContact: oneUserData.customerSecondaryContact || '',
        customerCnic: oneUserData.customerCnic || null,
        customerLicenseNumber: oneUserData.customerLicenseNumber || null,
        customerLicenseExpiryDate: oneUserData.customerLicenseExpiryDate ? new Date(oneUserData.customerLicenseExpiryDate).toISOString().split('T')[0] : null
      })
    }
  }, [oneUserData])

  const { mutate: createCustomer, isPending: isCreatingCustomer } = customerService.createCustomer()
  const { mutate: updateCustomer, isPending: isUpdatingCustomer } = customerService.updateCustomer()

  //Api call to get all categories
  const { data: categoriesData, isFetching: categoriesLoading } = lookupService.getAllCategories('get-all-categories')

  useEffect(() => {
    if (categoriesData?.data?.success) {
      setCategories(categoriesData.data.result)
    } else {
      setCategories([])
    }
  }, [categoriesData])

  //Api call to get all provinces
  const { data: provincesData, isFetching: provincesLoading } = lookupService.getAllProvinces('get-all-provinces')

  useEffect(() => {
    if (provincesData?.data?.success) {
      setProvinces(provincesData.data.result)
    } else {
      setProvinces([])
    }
  }, [provincesData])

  //Api call to get all areas
  const { data: areasData, isFetching: areasLoading } = lookupService.getAreasLookup('get-all-areas')

  useEffect(() => {
    if (areasData?.data?.success) {
      setAreas(areasData.data.result)
    } else {
      setAreas([])
    }
  }, [areasData])

  //Api call to get sub areas by area
  const { data: subAreasData, isFetching: subAreasLoading } = lookupService.getSubAreasLookup(
    'get-sub-areas-by-area',
    selectedArea
  )

  useEffect(() => {
    if (subAreasData?.data?.success) {
      setSubAreas(subAreasData.data.result)
    } else {
      setSubAreas([])
    }
  }, [subAreasData])

  // Update selectedArea when oneUserData changes (for edit mode)
  useEffect(() => {
    if (oneUserData?.customerArea) {
      const areaId = oneUserData.customerArea?._id || oneUserData.customerArea;
      setSelectedArea(areaId);
    }
  }, [oneUserData])


  // Validation Schema
  const schema = Yup.object().shape({
    // Basic customer information
    customerName: Yup.string()
      .nullable()
      .required('Customer name is required')
      .trim()
      .max(200, 'Customer name cannot exceed 200 characters'),

    // Location information
    customerProvince: Yup.string(),

    customerCity: Yup.string(),

    customerAddress: Yup.string()
      .nullable()
      .required('Customer address is required')
      .trim()
      .max(500, 'Customer address cannot exceed 500 characters'),

    // Business classification
    customerCategory: Yup.string(),

    customerArea: Yup.string()
      .nullable()
      .required('Customer area is required')
      .trim()
      .max(100, 'Customer area cannot exceed 100 characters'),

    customerSubArea: Yup.string().trim().max(100, 'Customer sub area cannot exceed 100 characters'),

    // Contact information
    customerPrimaryContact: Yup.string()
      .nullable()
      .required('Primary contact is required')
      .trim()
      .max(20, 'Primary contact cannot exceed 20 characters'),

    customerSecondaryContact: Yup.string().trim().max(20, 'Secondary contact cannot exceed 20 characters'),

    // Legal information
    customerCnic: Yup.string()
      .nullable()
      .required('Customer CNIC is required')
      .trim(),

    customerLicenseNumber: Yup.string()
      .nullable()
      .required('License number is required')
      .trim()
      .max(100, 'License number cannot exceed 100 characters'),

    customerLicenseExpiryDate: Yup.date()
      .nullable()
      .required('License expiry date is required')
      .transform((curr, orig) => (orig === '' ? null : curr))
  })

  const formik = useFormik({
    initialValues: {
      customerName: null,
      customerProvince: '',
      customerCity: '',
      customerAddress: null,
      customerCategory: '',
      customerArea: null,
      customerSubArea: '',
      customerPrimaryContact: null,
      customerSecondaryContact: '',
      customerCnic: null,
      customerLicenseNumber: null,
      customerLicenseExpiryDate: null
    },
    validationSchema: schema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: values => {
      if (oneUser) {
        updateCustomer({ id: oneUser, customerData: values }, {
          onSuccess: (response) => {
            if (response.data.success) {
              toast.success(response.data.message)
              queryClient.refetchQueries({ queryKey: ['get-all-customers'] })
              closeModal()
            } else {
              toast.error(response.data.message)
            }
          }
        })
      } else {
        createCustomer(values, {
          onSuccess: (response) => {
            if (response.data.success) {
              toast.success(response.data.message)
              queryClient.refetchQueries({ queryKey: ['get-all-customers'] })
              closeModal()
            } else {
              toast.error(response.data.message)
            }
          },
          onError: (error) => {
            toast.error(error.response.data.message)
          }
        })
      }
    }
  })

  //Function to close modal
  function closeModal(){
    stateChanger()
    formik.handleReset()
    setOneUser(null)
    setOneUserData(null)
    setSelectedArea('')
  }

  // Handle area selection changes
  useEffect(() => {
    if (formik.values.customerArea !== selectedArea) {
      setSelectedArea(formik.values.customerArea)
      // Clear sub area when area changes
      if (formik.values.customerSubArea) {
        formik.setFieldValue('customerSubArea', '')
      }
    }
  }, [formik.values.customerArea, selectedArea])

  //Api call to get all cities by province
  const { data: citiesData, isFetching: isCitiesLoading } = lookupService.getCitiesByProvince(
    'get-cities-by-province',
    formik.values.customerProvince
  )

  useEffect(() => {
    if (citiesData?.data?.success) {
      setCities(citiesData.data.result)
    } else {
      setCities([])
    }
  }, [citiesData])

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={() => {
        closeModal()
      }}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between plb-5 pli-6'>
        <Typography variant='h5'>{oneUser ? 'Edit User' : 'Add New User'}</Typography>
        <IconButton size='small' onClick={() => {
          closeModal()
        }}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form className='flex flex-col gap-6 p-6'>
          <FormikProvider formik={{ ...formik, isLoading: isCreatingCustomer }}>
            <CustomInput name='customerName' label='Full Name' placeholder='John Doe' requiredField />

            <CustomSelect
              name='customerProvince'
              label='Province'
              placeholder='Select Province'
              options={provinces}
              loading={provincesLoading}
              autoComplete={true}
            />

            <CustomSelect
              name='customerCity'
              label='City'
              placeholder='Select City'
              options={cities}
              disabled={!formik.values.customerProvince}
              loading={isCitiesLoading}
              autoComplete={true}
            />

            <CustomInput name='customerAddress' label='Address' placeholder='123 Main St' requiredField />

            <CustomSelect
              name='customerCategory'
              label='Category'
              placeholder='Select Category'
              options={categories}
              loading={categoriesLoading}
              autoComplete={true}
            />

            <CustomSelect
              name='customerArea'
              label='Area'
              placeholder='Select Area'
              options={areas}
              requiredField
              loading={areasLoading}
              autoComplete={true}
            />

            <CustomSelect
              name='customerSubArea'
              label='Sub Area'
              placeholder='Select Sub Area'
              options={subAreas}
              disabled={!formik.values.customerArea}
              loading={subAreasLoading}
              autoComplete={true}
            />

            <CustomInput
              name='customerPrimaryContact'
              label='Primary Contact'
              placeholder='03__-_______'
              format='03##-#######'
              mask='_'
              requiredField
            />

            <CustomInput
              name='customerSecondaryContact'
              label='Secondary Contact'
              placeholder='03__-_______'
              format='03##-#######'
              mask='_'
            />

            <CustomInput
              name='customerCnic'
              label='CNIC'
              placeholder='12345-1234567-1'
              format='#####-#######-#'
              requiredField
            />

            <CustomInput
              name='customerLicenseNumber'
              label='License Number'
              placeholder='License Number'
              requiredField
            />

            <CustomInput
              name='customerLicenseExpiryDate'
              label='License Expiry Date'
              placeholder='License Expiry Date'
              requiredField
              type='date'
            />

            <div className='flex items-center gap-4'>
              <CustomButton onClick={() => {
                formik.handleSubmit()
              }} variant='contained' type='button' disabled={isCreatingCustomer || isUpdatingCustomer} loading={isCreatingCustomer || isUpdatingCustomer}>
                {oneUser ? 'Update' : 'Submit'}
              </CustomButton>
              <Button variant='tonal' color='error' type='button' onClick={() => closeModal()}>
                Cancel
              </Button>
            </div>
          </FormikProvider>
        </form>
      </div>
    </Drawer>
  )
}

export default AddUserDrawer
