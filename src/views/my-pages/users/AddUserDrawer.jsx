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
        customerName: oneUserData.customerName || '',
        customerSeq: oneUserData.customerSeq || oneUserData.customerCode || '',
        customerProvince: oneUserData.customerProvince || '',
        customerCity: oneUserData.customerCity || '',
        customerAddress: oneUserData.customerAddress || '',
        customerCategory: oneUserData.customerCategory || '',
        customerArea: oneUserData.customerArea || '',
        customerSubArea: oneUserData.customerSubArea || '',
        customerPrimaryContact: oneUserData.customerPrimaryContact || '',
        customerSecondaryContact: oneUserData.customerSecondaryContact || '',
        customerCnic: oneUserData.customerCnic || '',
        customerLicenseNumber: oneUserData.customerLicenseNumber || '',
        customerLicenseExpiryDate: oneUserData.customerLicenseExpiryDate ? new Date(oneUserData.customerLicenseExpiryDate).toISOString().split('T')[0] : ''
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


  // Validation Schema
  const schema = Yup.object().shape({
    // Basic customer information
    customerName: Yup.string()
      .required('Customer name is required')
      .trim()
      .max(200, 'Customer name cannot exceed 200 characters'),

    customerSeq: Yup.string()
      .trim()
      .max(50, 'Customer sequence cannot exceed 50 characters'),

    // Location information
    customerProvince: Yup.string().required('Customer province is required'),

    customerCity: Yup.string().required('Customer city is required'),

    customerAddress: Yup.string()
      .required('Customer address is required')
      .trim()
      .max(500, 'Customer address cannot exceed 500 characters'),

    // Business classification
    customerCategory: Yup.string().required('Customer category is required'),

    customerArea: Yup.string()
      .required('Customer area is required')
      .trim()
      .max(100, 'Customer area cannot exceed 100 characters'),

    customerSubArea: Yup.string().trim().max(100, 'Customer sub area cannot exceed 100 characters'),

    // Contact information
    customerPrimaryContact: Yup.string()
      .required('Primary contact is required')
      .trim()
      .max(20, 'Primary contact cannot exceed 20 characters'),

    customerSecondaryContact: Yup.string().trim().max(20, 'Secondary contact cannot exceed 20 characters'),

    // Legal information
    customerCnic: Yup.string()
      .required('Customer CNIC is required')
      .trim(),

    customerLicenseNumber: Yup.string().trim().max(100, 'License number cannot exceed 100 characters'),

    customerLicenseExpiryDate: Yup.date()
      .nullable()
      .transform((curr, orig) => (orig === '' ? null : curr))
  })

  // Function to generate customer sequence if not provided
  const generateCustomerSeq = () => {
    const timestamp = Date.now().toString().slice(-6)

    
return `CUST-${timestamp}`
  }

  const formik = useFormik({
    initialValues: {
      customerName: '',
      customerSeq: '',
      customerProvince: '',
      customerCity: '',
      customerAddress: '',
      customerCategory: '',
      customerArea: '',
      customerSubArea: '',
      customerPrimaryContact: '',
      customerSecondaryContact: '',
      customerCnic: '',
      customerLicenseNumber: '',
      customerLicenseExpiryDate: ''
    },
    validationSchema: schema,
    onSubmit: values => {
      // Auto-generate customerSeq if not provided and it's a new customer
      if (!oneUser && !values.customerSeq) {
        values.customerSeq = generateCustomerSeq()
      }
      
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
  }

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

            <CustomInput name='customerSeq' label='Customer Sequence' placeholder='SEQ001' />

            <CustomSelect
              name='customerProvince'
              label='Province'
              placeholder='Select Province'
              options={provinces}
              requiredField
              loading={provincesLoading}
            />

            <CustomSelect
              name='customerCity'
              label='City'
              placeholder='Select City'
              options={cities}
              requiredField
              disabled={!formik.values.customerProvince}
              loading={isCitiesLoading}
            />

            <CustomInput name='customerAddress' label='Address' placeholder='123 Main St' requiredField />

            <CustomSelect
              name='customerCategory'
              label='Category'
              placeholder='Select Category'
              options={categories}
              requiredField
              loading={categoriesLoading}
            />

            <CustomInput name='customerArea' label='Area' placeholder='Select Area' requiredField />

            <CustomInput name='customerSubArea' label='Sub Area' placeholder='Select Sub Area' requiredField />

            <CustomInput
              name='customerPrimaryContact'
              label='Primary Contact'
              placeholder='Primary Contact'
              requiredField
            />

            <CustomInput
              name='customerSecondaryContact'
              label='Secondary Contact'
              placeholder='Secondary Contact'
              requiredField
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
