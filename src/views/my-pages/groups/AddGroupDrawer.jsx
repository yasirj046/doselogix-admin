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
import Button from '@mui/material/Button'

// Third-party Imports
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useQueryClient } from '@tanstack/react-query'

// Component Imports
import FormikProvider from '@/contexts/formikContext'
import CustomInput from '@/components/custom-components/CustomInput'
import CustomSelect from '@/components/custom-components/CustomSelect'
import CustomButton from '@/components/custom-components/CustomButton'

// Service Imports
import { groupService } from '@/services/groupService'
import { brandService } from '@/services/brandService'

const AddGroupDrawer = ({ open, stateChanger, oneGroup, setOneGroup }) => {
  // States
  const [brands, setBrands] = useState([])
  const [oneGroupData, setOneGroupData] = useState(null)

  // Hooks
  const { lang: locale } = useParams()
  const queryClient = useQueryClient()

  // API mutations
  const { mutate: createGroup, isPending: isCreatingGroup } = groupService.createGroup()
  const { mutate: updateGroup, isPending: isUpdatingGroup } = groupService.updateGroup()

  // API call to get one group details
  const { data: fetchedOneGroupData } = groupService.getOneGroupDetails('get-one-group', oneGroup)

  // API call to get all brands
  const { data: brandsData, isFetching: brandsLoading } = brandService.getAllBrands('get-all-brands')

  useEffect(() => {
    if (brandsData?.data?.success) {
      setBrands(brandsData.data.result.docs || brandsData.data.result || [])
    } else {
      setBrands([])
    }
  }, [brandsData])

  useEffect(() => {
    if (fetchedOneGroupData?.data?.success) {
      setOneGroupData(fetchedOneGroupData.data.result)
    }
  }, [fetchedOneGroupData])

  useEffect(() => {
    if (oneGroupData) {
      formik.setValues({
        brandId: (typeof oneGroupData.brandId === 'object' ? oneGroupData.brandId._id : oneGroupData.brandId) || '',
        group: oneGroupData.group || '',
        subGroup: oneGroupData.subGroup || ''
      })
    }
  }, [oneGroupData])

  // Form validation schema
  const validationSchema = Yup.object().shape({
    brandId: Yup.string().required('Brand is required'),
    group: Yup.string()
      .required('Group name is required')
      .trim()
      .max(200, 'Group name cannot exceed 200 characters'),
    subGroup: Yup.string()
      .required('Sub group is required')
      .trim()
      .max(200, 'Sub group cannot exceed 200 characters')
  })

  // Formik instance
  const formik = useFormik({
    initialValues: {
      brandId: '',
      group: '',
      subGroup: ''
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      const payload = {
        ...values
      }

      if (oneGroup) {
        updateGroup(
          { id: oneGroup, groupData: payload },
          {
            onSuccess: (response) => {
              if (response.data.success) {
                toast.success(response.data.message || 'Group updated successfully')
                queryClient.invalidateQueries(['get-all-groups'])
                queryClient.invalidateQueries(['get-all-unique-groups'])
                closeModal()
              } else {
                toast.error(response.data.message || 'Error updating group')
              }
            },
            onError: error => {
              toast.error(error.response?.data?.message || error.message || 'Error updating group')
            }
          }
        )
      } else {
        createGroup(payload, {
          onSuccess: (response) => {
            if (response.data.success) {
              toast.success(response.data.message || 'Group created successfully')
              queryClient.invalidateQueries(['get-all-groups'])
              queryClient.invalidateQueries(['get-all-unique-groups'])
              closeModal()
            } else {
              toast.error(response.data.message || 'Error creating group')
            }
          },
          onError: error => {
            toast.error(error.response?.data?.message || error.message || 'Error creating group')
          }
        })
      }
    }
  })

  // Function to close modal
  function closeModal() {
    stateChanger()
    formik.resetForm()
    setOneGroup(null)
    setOneGroupData(null)
  }

  // Transform brands for dropdown options
  const brandOptions = brands.map(brand => ({
    value: brand._id,
    label: brand.brandName
  }))

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={closeModal}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between plb-5 pli-6'>
        <Typography variant='h5'>{oneGroup ? 'Edit Group' : 'Add New Group'}</Typography>
        <IconButton size='small' onClick={closeModal}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form className='flex flex-col gap-6 p-6'>
          <FormikProvider formik={{ ...formik, isLoading: isCreatingGroup || isUpdatingGroup }}>
            <CustomSelect
              name='brandId'
              label='Brand'
              placeholder='Select Brand'
              options={brandOptions}
              requiredField
              loading={brandsLoading}
            />

            <CustomInput
              name='group'
              label='Group Name'
              placeholder='Enter group name'
              requiredField
            />

            <CustomInput
              name='subGroup'
              label='Sub Group'
              placeholder='Enter sub group name'
              requiredField
            />

            <div className='flex items-center gap-4'>
              <CustomButton
                onClick={() => {
                  formik.handleSubmit()
                }}
                variant='contained'
                type='button'
                disabled={isCreatingGroup || isUpdatingGroup}
                loading={isCreatingGroup || isUpdatingGroup}
              >
                {oneGroup ? 'Update' : 'Submit'}
              </CustomButton>
              <Button variant='tonal' color='error' type='button' onClick={closeModal}>
                Cancel
              </Button>
            </div>
          </FormikProvider>
        </form>
      </div>
    </Drawer>
  )
}

export default AddGroupDrawer
