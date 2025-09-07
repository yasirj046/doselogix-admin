'use client'

// React Imports
import { forwardRef, useContext, useState, useEffect } from 'react'

// MUI Imports
import { styled } from '@mui/material/styles'
import { createFilterOptions } from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import InputLabel from '@mui/material/InputLabel'
import FormHelperText from '@mui/material/FormHelperText'

// Third-party Imports
import { v4 as uuidv4 } from 'uuid'
import classNames from 'classnames'

// Components Imports
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import CustomTextField from '@core/components/mui/TextField'

// Context Imports
import { FormikContext } from '../../contexts/formikContext'

const AutocompleteStyled = styled(CustomAutocomplete)(({ theme }) => ({
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
  }
}))

const LoadingIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  right: '40px',
  transform: 'translateY(-50%)',
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}))

const filter = createFilterOptions()

const CustomSelectWithCreateAble = forwardRef((props, ref) => {
  const uniqueId = uuidv4()
  const formik = useContext(FormikContext)

  const {
    name,
    options = [],
    loading = false,
    placeholder = 'Select or create an option',
    label,
    requiredField,
    disabled = false,
    className,
    size = 'small',
    slotProps,
    onCreateOption,
    freeSolo = true,
    onBlur,
    ...rest
  } = props

  const [value, setValue] = useState(null)

  // If no formik context, show error
  if (!formik) {
    return (
      <div style={{ color: 'var(--mui-palette-error-main)', fontSize: '0.875rem' }}>FormikProvider is required</div>
    )
  }

  // Get formik field props
  const fieldProps = formik.getFieldProps(name)

  // Determine error state
  const hasError = formik.errors[name] && formik.touched[name]
  const errorMessage = formik.errors[name]

  // Update value when formik value or options change
  useEffect(() => {
    const selected = options.find(option => option.value == formik.values[name])
    setValue(selected || null)
  }, [formik.values[name], options])

  // Handle change
  const handleChange = (event, newValue) => {
    if (typeof newValue === 'string') {
      // Handle freeSolo string input
      setValue({ label: newValue, value: newValue })
      formik.setFieldValue(name, newValue)
    } else if (newValue && newValue.inputValue) {
      // Handle "Add new option" case
      const newOption = { label: newValue.inputValue, value: newValue.inputValue }
      setValue(newOption)
      formik.setFieldValue(name, newValue.inputValue)

      // Call onCreateOption if provided
      if (onCreateOption) {
        onCreateOption(newOption)
      }
    } else if (newValue) {
      // Handle selecting existing option
      setValue(newValue)
      formik.setFieldValue(name, newValue.value)
    } else {
      // Handle clearing selection
      setValue(null)
      formik.setFieldValue(name, '')
    }
  }

  // Handle blur
  const handleBlur = event => {
    formik.setFieldTouched(name, true)
    fieldProps.onBlur(event)
    onBlur && onBlur(event)
  }

  const isDisabled = disabled || loading || formik.isLoading

  return (
    <div className={classNames(className)}>
      {label && (
        <InputLabel
          htmlFor={uniqueId}
          sx={{
            transform: 'none',
            width: 'fit-content',
            maxWidth: '100%',
            lineHeight: 1.153,
            position: 'relative',
            fontSize: 'body2.fontSize',
            marginBottom: 1,
            color: 'text.primary',
            '&.Mui-error': {
              color: 'error.main'
            }
          }}
          error={hasError}
        >
          {label}
          {requiredField && <span style={{ marginLeft: '4px', color: 'var(--mui-palette-error-main)' }}>*</span>}
        </InputLabel>
      )}

      <Box sx={{ position: 'relative' }}>
        <AutocompleteStyled
          id={uniqueId}
          freeSolo={freeSolo}
          clearOnBlur
          value={value}
          handleHomeEndKeys
          options={options}
          disabled={isDisabled}
          loading={loading}
          size={size}
          renderOption={(props, option) => (
            <li {...props} key={option.value || option.inputValue}>
              {option.label || option.inputValue}
            </li>
          )}
          renderInput={params => (
            <CustomTextField
              {...params}
              placeholder={placeholder}
              error={hasError}
              variant='filled'
              fullWidth
              slotProps={{
                ...slotProps,
                inputLabel: { ...slotProps?.inputLabel, shrink: true }
              }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          getOptionLabel={option => {
            if (typeof option === 'string') {
              return option || ''
            }
            if (option.inputValue) {
              return option.inputValue || ''
            }
            return option.label || ''
          }}
          onChange={handleChange}
          onBlur={handleBlur}
          filterOptions={(options, params) => {
            const filtered = filter(options, params)
            const { inputValue } = params

            // Suggest the creation of a new value
            const isExisting = options.some(option => inputValue === option.label)
            if (inputValue !== '' && !isExisting) {
              filtered.push({
                inputValue,
                label: `Add "${inputValue}"`
              })
            }

            return filtered
          }}
          {...rest}
        />
      </Box>

      {hasError && errorMessage && (
        <FormHelperText
          error
          sx={{
            lineHeight: 1.154,
            margin: '4px 0 0',
            fontSize: 'body2.fontSize'
          }}
        >
          {errorMessage}
        </FormHelperText>
      )}
    </div>
  )
})

CustomSelectWithCreateAble.displayName = 'CustomSelectWithCreateAble'

export default CustomSelectWithCreateAble
