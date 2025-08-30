import { useEffect, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import { styled } from '@mui/material/styles'

// Third-party Imports
import * as Yup from 'yup'
import { useFormik } from 'formik'

// Component Imports
import FormikProvider from '@/contexts/formikContext'
import CustomButton from '@/components/custom-components/CustomButton'

// Service Imports
import { lookupService } from '@/services/lookupService'
import { areaService } from '@/services/areaService'

// Utils
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'

// Styled Components
const TextFieldStyled = styled(TextField)(({ theme }) => ({
  '& .MuiInputLabel-root': {
    transform: 'none',
    width: 'fit-content',
    maxWidth: '100%',
    lineHeight: 1.153,
    position: 'relative',
    fontSize: theme.typography.body2.fontSize,
    marginBottom: theme.spacing(1),
    color: 'var(--mui-palette-text-primary)',
    '&:not(.Mui-error).MuiFormLabel-colorPrimary.Mui-focused': {
      color: 'var(--mui-palette-primary-main) !important'
    },
    '&.Mui-disabled': {
      color: 'var(--mui-palette-text-disabled)'
    },
    '&.Mui-error': {
      color: 'var(--mui-palette-error-main)'
    }
  },
  '& .MuiInputBase-root': {
    backgroundColor: 'transparent !important',
    border: `1px solid var(--mui-palette-customColors-inputBorder)`,
    '&:not(.Mui-focused):not(.Mui-disabled):not(.Mui-error):hover': {
      borderColor: 'var(--mui-palette-action-active)'
    },
    '&:before, &:after': {
      display: 'none'
    },
    '&.MuiInputBase-sizeSmall': {
      borderRadius: 'var(--mui-shape-borderRadius)'
    },
    '&.Mui-error': {
      borderColor: 'var(--mui-palette-error-main)'
    },
    '&.Mui-focused': {
      borderWidth: 2,
      '& .MuiInputBase-input:not(.MuiInputBase-readOnly):not([readonly])::placeholder': {
        transform: 'translateX(4px)'
      },
      '&:not(.Mui-error).MuiInputBase-colorPrimary': {
        borderColor: 'var(--mui-palette-primary-main)',
        boxShadow: 'var(--mui-customShadows-primary-sm)'
      }
    },
    '&.Mui-disabled': {
      backgroundColor: 'var(--mui-palette-action-hover) !important'
    }
  },
  '& .MuiInputBase-input': {
    '&:not(textarea).MuiInputBase-inputSizeSmall': {
      padding: '7.25px 14px'
    },
    '&:not(.MuiInputBase-readOnly):not([readonly])::placeholder': {
      transform: 'translateX(0px)',
      transition: theme.transitions.create(['transform'], {
        duration: theme.transitions.duration.shorter,
        easing: theme.transitions.easing.easeOut
      })
    }
  }
}))

const AddAreaDrawer = props => {
  // Props
  const { open, stateChanger, oneArea, setOneArea } = props

  // States
  const [areas, setAreas] = useState([])
  const [subAreas, setSubAreas] = useState([])
  const [oneAreaData, setOneAreaData] = useState(null)
  const [selectedArea, setSelectedArea] = useState('')
  const [areaInputValue, setAreaInputValue] = useState('')
  const [subAreaInputValue, setSubAreaInputValue] = useState('')

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
      setSelectedArea(oneAreaData.area || '')
      setAreaInputValue(oneAreaData.area || '')
      setSubAreaInputValue(oneAreaData.subArea || '')
      formik.setValues({
        area: oneAreaData.area || '',
        subArea: oneAreaData.subArea || ''
      })
    }
  }, [oneAreaData])

  const { mutate: createArea, isPending: isCreatingArea } = areaService.createArea()
  const { mutate: updateArea, isPending: isUpdatingArea } = areaService.updateArea()

  // API call to get all areas lookup
  const { data: areasData, isFetching: areasLoading = false } = lookupService.getAreasLookup('get-areas-lookup')

  useEffect(() => {
    if (areasData?.data?.success) {
      setAreas(areasData.data.result || [])
    } else {
      setAreas([])
    }
  }, [areasData])

  // API call to get sub areas based on selected area
  const { data: subAreasData, isFetching: subAreasLoading = false } = lookupService.getSubAreasLookup('get-sub-areas-lookup', selectedArea)

  useEffect(() => {
    if (subAreasData?.data?.success && selectedArea) {
      setSubAreas(subAreasData.data.result || [])
    } else {
      setSubAreas([])
    }
  }, [subAreasData, selectedArea])

  // Handle area selection change
  const handleAreaChange = (event, value, reason) => {
    if (reason === 'clear') {
      setSelectedArea('')
      setAreaInputValue('')
      formik.setFieldValue('area', '')
      formik.setFieldValue('subArea', '')
      setSubAreaInputValue('')
      return
    }

    const areaValue = typeof value === 'string' ? value : value?.value || value?.label || ''
    setSelectedArea(areaValue)
    setAreaInputValue(areaValue)
    formik.setFieldValue('area', areaValue)

    // Reset sub area when area changes
    formik.setFieldValue('subArea', '')
    setSubAreaInputValue('')
  }

  // Handle sub area selection change
  const handleSubAreaChange = (event, value, reason) => {
    if (reason === 'clear') {
      setSubAreaInputValue('')
      formik.setFieldValue('subArea', '')
      return
    }

    const subAreaValue = typeof value === 'string' ? value : value?.value || value?.label || ''
    setSubAreaInputValue(subAreaValue)
    formik.setFieldValue('subArea', subAreaValue)
  }

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
              queryClient.refetchQueries({ queryKey: ['get-areas-lookup'] })
              queryClient.refetchQueries({ queryKey: ['get-sub-areas-lookup'] })
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
              queryClient.refetchQueries({ queryKey: ['get-areas-lookup'] })
              queryClient.refetchQueries({ queryKey: ['get-sub-areas-lookup'] })
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
    setSelectedArea('')
    setAreaInputValue('')
    setSubAreaInputValue('')
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
            {/* Area Autocomplete */}
            <div className='flex flex-col gap-1'>
              <Typography variant='body2' component='label' className='font-medium'>
                Area <span className='text-red-500'>*</span>
              </Typography>
              <Autocomplete
                value={areaInputValue}
                onChange={handleAreaChange}
                inputValue={areaInputValue}
                onInputChange={(event, newInputValue) => {
                  setAreaInputValue(newInputValue)
                  formik.setFieldValue('area', newInputValue)
                }}
                options={areas.map(area => {
                  if (typeof area === 'string') return area;
                  return area.label || area.value || String(area);
                })}
                freeSolo
                loading={areasLoading}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.label || option.value || String(option);
                }}
                renderInput={(params) => (
                  <TextFieldStyled
                    {...params}
                    size="small"
                    placeholder='Select or type area name'
                    error={formik.touched.area && Boolean(formik.errors.area)}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {areasLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option}>
                    {option}
                  </li>
                )}
              />
              {formik.touched.area && formik.errors.area && (
                <Typography variant='caption' color='error'>
                  {formik.errors.area}
                </Typography>
              )}
            </div>

            {/* Sub Area Autocomplete */}
            <div className='flex flex-col gap-1'>
              <Typography variant='body2' component='label' className='font-medium'>
                Sub Area
              </Typography>
              <Autocomplete
                value={subAreaInputValue}
                onChange={handleSubAreaChange}
                inputValue={subAreaInputValue}
                onInputChange={(event, newInputValue) => {
                  setSubAreaInputValue(newInputValue)
                  formik.setFieldValue('subArea', newInputValue)
                }}
                options={subAreas.map(subArea => {
                  if (typeof subArea === 'string') return subArea;
                  return subArea.label || subArea.value || String(subArea);
                })}
                freeSolo
                loading={subAreasLoading}
                disabled={!selectedArea}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.label || option.value || String(option);
                }}
                renderInput={(params) => (
                  <TextFieldStyled
                    {...params}
                    size="small"
                    placeholder={!selectedArea ? 'Select area first' : 'Select or type sub area name'}
                    error={formik.touched.subArea && Boolean(formik.errors.subArea)}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {subAreasLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option}>
                    {option}
                  </li>
                )}
              />
              {formik.touched.subArea && formik.errors.subArea && (
                <Typography variant='caption' color='error'>
                  {formik.errors.subArea}
                </Typography>
              )}
            </div>

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
