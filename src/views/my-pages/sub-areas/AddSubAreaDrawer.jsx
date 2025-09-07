import { useEffect, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Third-party Imports
import * as Yup from 'yup'
import { useFormik } from 'formik'

// Component Imports
import FormikProvider from '@/contexts/formikContext'
import CustomButton from '@/components/custom-components/CustomButton'
import CustomInput from '@/components/custom-components/CustomInput'

// Service Imports
import { lookupService } from '@/services/lookupService'
import { subAreaService } from '@/services/subAreaService'

// Utils
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'
import CustomSelect from '@/components/custom-components/CustomSelect'

const AddSubAreaDrawer = props => {
  // Props
  const { open, stateChanger, oneSubArea, setOneSubArea } = props

  // States
  const [areas, setAreas] = useState([])
  const [oneSubAreaData, setOneSubAreaData] = useState(null)
  const [selectedArea, setSelectedArea] = useState('')

  const queryClient = useQueryClient()

  // API call to get one sub area details
  const { data: fetchedOneSubAreaData } = subAreaService.getOneSubAreaDetails('get-one-sub-area', oneSubArea)

  useEffect(() => {
    if (fetchedOneSubAreaData?.data?.success) {
      setOneSubAreaData(fetchedOneSubAreaData.data.result)
    }
  }, [fetchedOneSubAreaData])

  useEffect(() => {
    if (oneSubAreaData) {
      // Handle both populated and unpopulated areaId
      const areaIdValue = oneSubAreaData.areaId?._id || oneSubAreaData.areaId?.id || oneSubAreaData.areaId || ''
      setSelectedArea(areaIdValue)
      formik.setValues({
        areaId: areaIdValue,
        subAreaName: oneSubAreaData.subAreaName || ''
      })
    }
  }, [oneSubAreaData])

  const { mutate: createSubArea, isPending: isCreatingSubArea } = subAreaService.createSubArea()
  const { mutate: updateSubArea, isPending: isUpdatingSubArea } = subAreaService.updateSubArea()

  // API call to get all areas lookup
  const { data: areasData, isFetching: areasLoading = false } = lookupService.getAreasLookup('get-areas-lookup')

  useEffect(() => {
    if (areasData?.data?.success) {
      setAreas(areasData.data.result || [])
    } else {
      setAreas([])
    }
  }, [areasData])

  // Validation Schema
  const schema = Yup.object().shape({
    areaId: Yup.string()
      .required('Area is required'),

    subAreaName: Yup.string()
      .required('Sub area name is required')
      .trim()
      .max(200, 'Sub area name cannot exceed 200 characters')
  })

  const formik = useFormik({
    initialValues: {
      areaId: '',
      subAreaName: ''
    },
    validationSchema: schema,
    onSubmit: values => {
      const formattedValues = {
        areaId: values.areaId.trim(),
        subAreaName: values.subAreaName.trim()
      }

      if (oneSubArea) {
        updateSubArea({ id: oneSubArea, subAreaData: formattedValues }, {
          onSuccess: (response) => {
            if (response.data.success) {
              toast.success(response.data.message)
              queryClient.refetchQueries({ queryKey: ['get-all-sub-areas'] })
              queryClient.refetchQueries({ queryKey: ['get-subareas-lookup'] })
              closeModal()
            } else {
              toast.error(response.data.message)
            }
          },
          onError: (error) => {
            toast.error(error.response?.data?.message || 'An error occurred')
          }
        })
      } else {
        createSubArea(formattedValues, {
          onSuccess: (response) => {
            if (response.data.success) {
              toast.success(response.data.message)
              queryClient.refetchQueries({ queryKey: ['get-all-sub-areas'] })
              queryClient.refetchQueries({ queryKey: ['get-subareas-lookup'] })
              closeModal()
            } else {
              toast.error(response.data.message)
            }
          },
          onError: (error) => {
            toast.error(error.response?.data?.message || 'An error occurred')
          }
        })
      }
    }
  })

  // Function to close modal
  function closeModal() {
    stateChanger()
    formik.handleReset()
    setOneSubArea(null)
    setOneSubAreaData(null)
    setSelectedArea('')
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
        <Typography variant='h5'>{oneSubArea ? 'Edit Sub Area' : 'Add New Sub Area'}</Typography>
        <IconButton size='small' onClick={() => {
          closeModal()
        }}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form className='flex flex-col gap-6 p-6'>
          <FormikProvider formik={{ ...formik, isLoading: isCreatingSubArea }}>
            {/* Area Field */}
            <CustomSelect
              name="areaId"
              label="Area"
              requiredField
              placeholder="Select area"
              options={areas.map(area => ({
                value: area.value || area.id || area._id,
                label: area.label || area.area || area.value
              }))}
              loading={areasLoading}
              onBlur={() => {
                // Handle area change for sub-area dependency
                const currentValue = formik.values.areaId
                if (currentValue !== selectedArea) {
                  setSelectedArea(currentValue)
                  // Reset sub area name when area changes
                  if (!oneSubArea) { // Only reset if not editing existing sub area
                    formik.setFieldValue('subAreaName', '')
                  }
                }
              }}
              autoComplete={true}
            />

            {/* Sub Area Name Field */}
            <CustomInput
              name="subAreaName"
              label="Sub Area Name"
              placeholder={!formik.values.areaId ? "Select area first" : "Enter sub area name"}
              requiredField
              disabled={!formik.values.areaId}
            />

            <div className='flex items-center gap-4'>
              <CustomButton
                onClick={() => {
                  formik.handleSubmit()
                }}
                variant='contained'
                type='button'
                disabled={isCreatingSubArea || isUpdatingSubArea}
                loading={isCreatingSubArea || isUpdatingSubArea}
              >
                {oneSubArea ? 'Update' : 'Submit'}
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

export default AddSubAreaDrawer
