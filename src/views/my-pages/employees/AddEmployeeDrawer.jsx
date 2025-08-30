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
import CustomTextField from '@core/components/mui/TextField'
import * as Yup from 'yup'
import { useFormik } from 'formik'
import FormikProvider from '@/contexts/formikContext'
import CustomInput from '@/components/custom-components/CustomInput'
import { lookupService } from '@/services/lookupService'
import { employeeService } from '@/services/EmployeeService'
import CustomSelect from '@/components/custom-components/CustomSelect'
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'
import CustomButton from '@/components/custom-components/CustomButton'

const AddEmployeeDrawer = props => {
  // Props
  const { open, stateChanger, oneEmployee, setOneEmployee } = props

  // States
  const [cities, setCities] = useState([])
  const [designations, setDesignations] = useState([])
  const [oneEmployeeData, setOneEmployeeData] = useState(null)
  const queryClient = useQueryClient()

  //Api call to get one employee details
  const { data: fetchedOneEmployeeData } = employeeService.getOneEmployeeDetails('get-one-employee', oneEmployee)

  useEffect(() => {
    if (fetchedOneEmployeeData?.data?.success) {
      setOneEmployeeData(fetchedOneEmployeeData.data.result)
    }
  }, [fetchedOneEmployeeData])

  useEffect(() => {
    if (oneEmployeeData) {
      formik.setValues({
        employeeName: oneEmployeeData.employeeName || '',
        city: oneEmployeeData.city || '',
        address: oneEmployeeData.address || '',
        primaryContact: oneEmployeeData.primaryContact || '',
        secondaryContact: oneEmployeeData.secondaryContact || '',
        cnic: oneEmployeeData.cnic || '',
        referencePerson: oneEmployeeData.referencePerson || '',
        referencePersonContact: oneEmployeeData.referencePersonContact || '',
        referencePersonAddress: oneEmployeeData.referencePersonAddress || '',
        salary: oneEmployeeData.salary || '',
        designation: oneEmployeeData.designation || ''
      })
    }
  }, [oneEmployeeData])

  const { mutate: createEmployee, isPending: isCreatingEmployee } = employeeService.createEmployee()
  const { mutate: updateEmployee, isPending: isUpdatingEmployee } = employeeService.updateEmployee()

  //Api call to get all designations
  const { data: designationsData, isFetching: designationsLoading } = lookupService.getAllDesignations('get-all-designations')

  useEffect(() => {
    if (designationsData?.data?.success) {
      setDesignations(designationsData.data.result)
    } else {
      setDesignations([])
    }
  }, [designationsData])

  //Api call to get all cities
  const { data: allCitiesData, isFetching: citiesLoading } = lookupService.getAllCities('get-all-cities')

  useEffect(() => {
    if (allCitiesData?.data?.success) {
      setCities(allCitiesData.data.result)
    } else {
      setCities([])
    }
  }, [allCitiesData])


  // Validation Schema
  const schema = Yup.object().shape({
    // Basic employee information
    employeeName: Yup.string()
      .required('Employee name is required')
      .trim()
      .max(100, 'Employee name cannot exceed 100 characters'),

    // Location information
    city: Yup.string().required('City is required'),

    address: Yup.string()
      .required('Address is required')
      .trim()
      .max(500, 'Address cannot exceed 500 characters'),

    // Contact information
    primaryContact: Yup.string()
      .required('Primary contact is required')
      .trim()
      .max(20, 'Primary contact cannot exceed 20 characters'),

    secondaryContact: Yup.string().trim().max(20, 'Secondary contact cannot exceed 20 characters'),

    // Personal information
    cnic: Yup.string()
      .required('CNIC is required')
      .trim()
      .test('cnic-format', 'CNIC format should be 12345-1234567-1', function(value) {
        if (!value) return false;
        // Check if it matches the formatted pattern (with dashes)
        const withDashes = /^\d{5}-\d{7}-\d{1}$/.test(value);
        // Check if it matches unformatted pattern (13 digits)
        const withoutDashes = /^\d{13}$/.test(value);
        return withDashes || withoutDashes;
      }),

    // Reference information
    referencePerson: Yup.string().trim().max(100, 'Reference person name cannot exceed 100 characters'),

    referencePersonContact: Yup.string().trim().max(20, 'Reference person contact cannot exceed 20 characters'),

    referencePersonAddress: Yup.string().trim().max(500, 'Reference person address cannot exceed 500 characters'),

    // Employment information
    salary: Yup.number()
      .required('Salary is required')
      .min(0, 'Salary cannot be negative'),

    designation: Yup.string().required('Designation is required')
  })
  const formik = useFormik({
    initialValues: {
      employeeName: '',
      city: '',
      address: '',
      primaryContact: '',
      secondaryContact: '',
      cnic: '',
      referencePerson: '',
      referencePersonContact: '',
      referencePersonAddress: '',
      salary: '',
      designation: ''
    },
    validationSchema: schema,
    onSubmit: values => {
      // Format CNIC to ensure it has dashes
      const formatCnic = (cnic) => {
        if (!cnic) return '';
        // Remove any existing dashes and spaces
        const cleanCnic = cnic.replace(/[-\s]/g, '');
        // Add dashes in the correct positions if it's 13 digits
        if (cleanCnic.length === 13 && /^\d{13}$/.test(cleanCnic)) {
          return `${cleanCnic.slice(0, 5)}-${cleanCnic.slice(5, 12)}-${cleanCnic.slice(12)}`;
        }
        // Return as is if already formatted correctly
        if (/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
          return cnic;
        }
        return cnic;
      };

      const formattedValues = {
        ...values,
        cnic: formatCnic(values.cnic)
      };

      if (oneEmployee) {
        updateEmployee({ id: oneEmployee, employeeData: formattedValues }, {
          onSuccess: (response) => {
            if (response.data.success) {
              toast.success(response.data.message)
              queryClient.refetchQueries({ queryKey: ['get-all-employees'] })
              closeModal()
            } else {
              toast.error(response.data.message)
            }
          }
        })
      } else {
        createEmployee(formattedValues, {
          onSuccess: (response) => {
            if (response.data.success) {
              toast.success(response.data.message)
              queryClient.refetchQueries({ queryKey: ['get-all-employees'] })
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
    setOneEmployee(null)
    setOneEmployeeData(null)
  }

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
        <Typography variant='h5'>{oneEmployee ? 'Edit Employee' : 'Add New Employee'}</Typography>
        <IconButton size='small' onClick={() => {
          closeModal()
        }}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form className='flex flex-col gap-6 p-6'>
          <FormikProvider formik={{ ...formik, isLoading: isCreatingEmployee }}>
            <CustomInput name='employeeName' label='Employee Name' placeholder='John Doe' requiredField />

            <CustomSelect
              name='city'
              label='City'
              placeholder='Select City'
              options={cities}
              requiredField
              loading={citiesLoading}
            />

            <CustomInput name='address' label='Address' placeholder='123 Main St' requiredField />

            <CustomInput
              name='primaryContact'
              label='Primary Contact'
              placeholder='Primary Contact'
              requiredField
            />

            <CustomInput
              name='secondaryContact'
              label='Secondary Contact'
              placeholder='Secondary Contact'
            />

            <CustomInput
              name='cnic'
              label='CNIC'
              placeholder='12345-1234567-1'
              format='#####-#######-#'
              requiredField
            />

            <CustomInput
              name='referencePerson'
              label='Reference Person'
              placeholder='Reference Person Name'
            />

            <CustomInput
              name='referencePersonContact'
              label='Reference Person Contact'
              placeholder='Reference Person Contact'
            />

            <CustomInput
              name='referencePersonAddress'
              label='Reference Person Address'
              placeholder='Reference Person Address'
            />

            <CustomInput
              name='salary'
              label='Salary'
              placeholder='Enter salary amount'
              type='number'
              requiredField
            />

            <CustomSelect
              name='designation'
              label='Designation'
              placeholder='Select Designation'
              options={designations}
              requiredField
              loading={designationsLoading}
            />

            <div className='flex items-center gap-4'>
              <CustomButton onClick={() => {
                formik.handleSubmit()
              }} variant='contained' type='button' disabled={isCreatingEmployee || isUpdatingEmployee} loading={isCreatingEmployee || isUpdatingEmployee}>
                {oneEmployee ? 'Update' : 'Submit'}
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

export default AddEmployeeDrawer
