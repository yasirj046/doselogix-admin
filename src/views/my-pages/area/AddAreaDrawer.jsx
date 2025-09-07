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
import { areaService } from '@/services/areaService'

// Utils
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'

const AddAreaDrawer = props => {
  // Props
  const { open, stateChanger, oneArea, setOneArea } = props

  // States
  const [oneAreaData, setOneAreaData] = useState(null)

  const queryClient = useQueryClient()

  // API call to get one area details
  const { data: fetchedOneAreaData } = areaService.getOneAreaDetails('get-one-area', oneArea)

  useEffect(() => {
    if (fetchedOneAreaData?.data?.success) {
      setOneAreaData(fetchedOneAreaData.data.result)
    }
  }, [fetchedOneAreaData])

  useEffect(() => {
    if (oneAreaData) {
      formik.setValues({
        area: oneAreaData.area || '',
        subArea: oneAreaData.subArea || ''
      })
    }
  }, [oneAreaData])

  const { mutate: createArea, isPending: isCreatingArea } = areaService.createArea()
  const { mutate: updateArea, isPending: isUpdatingArea } = areaService.updateArea()

  // Validation Schema
  const schema = Yup.object().shape({
    area: Yup.string()
      .required('Area is required')
      .trim()
      .max(200, 'Area name cannot exceed 200 characters'),

    subArea: Yup.string()
      .trim()
      .max(200, 'Sub area cannot exceed 200 characters')
  })

  const formik = useFormik({
    initialValues: {
      area: '',
      subArea: ''
    },
    validationSchema: schema,
    onSubmit: values => {
      const formattedValues = {
        area: values.area.trim()
      }

      // Only include subArea if it has a value
      if (values.subArea && values.subArea.trim()) {
        formattedValues.subArea = values.subArea.trim()
      }

      if (oneArea) {
        updateArea({ id: oneArea, areaData: formattedValues }, {
          onSuccess: (response) => {
            if (response.data.success) {
              toast.success(response.data.message)
              queryClient.refetchQueries({ queryKey: ['get-all-areas'] })
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
        createArea(formattedValues, {
          onSuccess: (response) => {
            if (response.data.success) {
              toast.success(response.data.message)
              queryClient.refetchQueries({ queryKey: ['get-all-areas'] })
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
    setOneArea(null)
    setOneAreaData(null)
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
        <Typography variant='h5'>{oneArea ? 'Edit Area' : 'Add New Area'}</Typography>
        <IconButton size='small' onClick={() => {
          closeModal()
        }}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form className='flex flex-col gap-6 p-6'>
          <FormikProvider formik={{ ...formik, isLoading: isCreatingArea }}>
            {/* Area Field */}
            <CustomInput
              name="area"
              label="Area"
              requiredField
              placeholder="Enter area name"
              type="text"
            />

            {/* Sub Area Field */}
            {/* <CustomInput
              name="subArea"
              label="Sub Area"
              placeholder="Enter sub area name"
              type="text"
            /> */}

            <div className='flex items-center gap-4'>
              <CustomButton
                onClick={() => {
                  formik.handleSubmit()
                }}
                variant='contained'
                type='button'
                disabled={isCreatingArea || isUpdatingArea}
                loading={isCreatingArea || isUpdatingArea}
              >
                {oneArea ? 'Update' : 'Submit'}
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

export default AddAreaDrawer
