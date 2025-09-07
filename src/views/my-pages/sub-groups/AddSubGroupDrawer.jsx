'use client'

// React Imports
import { useEffect, useState } from 'react'

import { toast } from 'react-toastify'

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
import { subGroupService } from '@/services/subGroupService'
import { lookupService } from '@/services/lookupService'

const AddSubGroupDrawer = ({ open, stateChanger, oneSubGroup, setOneSubGroup }) => {
  // States
  const [groups, setGroups] = useState([])
  const [oneSubGroupData, setOneSubGroupData] = useState(null)

  // Hooks
  const queryClient = useQueryClient()

  // Form validation schema
  const validationSchema = Yup.object().shape({
    groupId: Yup.string().required('Group is required'),
    subGroupName: Yup.string()
      .required('Sub group name is required')
      .trim()
      .max(200, 'Sub group name cannot exceed 200 characters')
  })

  // Formik instance
  const formik = useFormik({
    initialValues: {
      groupId: '',
      subGroupName: ''
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      const payload = {
        groupId: values.groupId,
        subGroupName: values.subGroupName
      }

      if (oneSubGroup) {
        updateSubGroup(
          { id: oneSubGroup, subGroupData: payload },
          {
            onSuccess: (response) => {
              if (response.data.success) {
                toast.success(response.data.message || 'Sub group updated successfully')
                queryClient.invalidateQueries(['get-all-sub-groups'])
                closeModal()
              } else {
                toast.error(response.data.message || 'Error updating sub group')
              }
            },
            onError: error => {
              toast.error(error.response?.data?.message || error.message || 'Error updating sub group')
            }
          }
        )
      } else {
        createSubGroup(payload, {
          onSuccess: (response) => {
            if (response.data.success) {
              toast.success(response.data.message || 'Sub group created successfully')
              queryClient.invalidateQueries(['get-all-sub-groups'])
              closeModal()
            } else {
              toast.error(response.data.message || 'Error creating sub group')
            }
          },
          onError: error => {
            toast.error(error.response?.data?.message || error.message || 'Error creating sub group')
          }
        })
      }
    }
  })

  // API mutations
  const { mutate: createSubGroup, isPending: isCreatingSubGroup } = subGroupService.createSubGroup()
  const { mutate: updateSubGroup, isPending: isUpdatingSubGroup } = subGroupService.updateSubGroup()

  // API call to get one sub group details (conditionally enabled)
  const { data: fetchedOneSubGroupData } = subGroupService.getOneSubGroupDetails('get-one-sub-group', oneSubGroup)

  // API call to get all groups (with brand info for display)
  const { data: groupsData, isFetching: groupsLoading } = lookupService.getGroupsLookup('get-groups-lookup', null)

  useEffect(() => {
    if (groupsData?.data?.success) {
      setGroups(groupsData.data.result || [])
    } else {
      setGroups([])
    }
  }, [groupsData])

  useEffect(() => {
    if (fetchedOneSubGroupData?.data?.success) {
      setOneSubGroupData(fetchedOneSubGroupData.data.result)
    }
  }, [fetchedOneSubGroupData])

  useEffect(() => {
    if (oneSubGroupData) {
      formik.setValues({
        groupId: (typeof oneSubGroupData.groupId === 'object' ? oneSubGroupData.groupId._id : oneSubGroupData.groupId) || '',
        subGroupName: oneSubGroupData.subGroupName || ''
      })
    }
  }, [oneSubGroupData])

  // Function to close modal
  function closeModal() {
    stateChanger()
    formik.resetForm()
    setOneSubGroup(null)
    setOneSubGroupData(null)
  }

  // Transform groups for dropdown options (showing brand info for clarity)
  const groupOptions = groups.map(group => ({
    value: group.value,
    label: `${group.label} (${group.brandName || 'Brand N/A'})`
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
        <Typography variant='h5'>
          {oneSubGroup ? 'Edit Sub Group' : 'Add New Sub Group'}
        </Typography>
        <IconButton onClick={closeModal}>
          <i className='tabler-x' />
        </IconButton>
      </div>
      <Divider />

      <div className='p-6'>
        <form onSubmit={formik.handleSubmit}>
          <FormikProvider formik={{ ...formik, isLoading: isCreatingSubGroup || isUpdatingSubGroup }}>
            <div className='flex flex-col gap-6'>

              {/* Group Selection */}
              <CustomSelect
                fullWidth
                name='groupId'
                label='Group'
                placeholder='Select Group'
                options={groupOptions}
                loading={groupsLoading}
                requiredField
                autoComplete={true}
              />

              {/* Sub Group Name */}
              <CustomInput
                fullWidth
                name='subGroupName'
                label='Sub Group Name'
                placeholder='Enter sub group name'
                requiredField
              />

              {/* Submit Button */}
              <div className='flex items-center gap-4'>
                <CustomButton
                  variant='contained'
                  type='submit'
                  loading={isCreatingSubGroup || isUpdatingSubGroup}
                  fullWidth
                >
                  {oneSubGroup ? 'Update' : 'Submit'}
                </CustomButton>
                <Button
                  variant='outlined'
                  color='secondary'
                  onClick={closeModal}
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
            </div>
          </FormikProvider>
        </form>
      </div>
    </Drawer>
  )
}

export default AddSubGroupDrawer
