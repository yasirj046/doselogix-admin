'use client'

// React Imports
import { forwardRef, useContext, useState, useEffect } from 'react'

// MUI Imports
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import InputLabel from '@mui/material/InputLabel'
import FormHelperText from '@mui/material/FormHelperText'

// Third-party Imports
import { v4 as uuidv4 } from 'uuid'
import classNames from 'classnames'

// Context Imports
import { FormikContext } from '../../contexts/formikContext'

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
      '& :not(textarea).MuiFilledInput-input': {
        padding: '6.25px 13px'
      },
      '&:not(.Mui-error).MuiInputBase-colorPrimary': {
        borderColor: 'var(--mui-palette-primary-main)',
        boxShadow: 'var(--mui-customShadows-primary-sm)'
      },
      '&.MuiInputBase-colorSecondary': {
        borderColor: 'var(--mui-palette-secondary-main)'
      },
      '&.MuiInputBase-colorInfo': {
        borderColor: 'var(--mui-palette-info-main)'
      },
      '&.MuiInputBase-colorSuccess': {
        borderColor: 'var(--mui-palette-success-main)'
      },
      '&.MuiInputBase-colorWarning': {
        borderColor: 'var(--mui-palette-warning-main)'
      },
      '&.MuiInputBase-colorError': {
        borderColor: 'var(--mui-palette-error-main)'
      },
      '&.Mui-error': {
        borderColor: 'var(--mui-palette-error-main)'
      }
    },
    '&.Mui-disabled': {
      backgroundColor: 'var(--mui-palette-action-hover) !important'
    }
  },

  // For Select
  '& .MuiSelect-select.MuiInputBase-inputSizeSmall, & .MuiNativeSelect-select.MuiInputBase-inputSizeSmall': {
    '& ~ i, & ~ svg': {
      inlineSize: '1.125rem',
      blockSize: '1.125rem'
    }
  },
  '& .MuiSelect-select': {
    minHeight: 'unset !important',
    lineHeight: '1.4375em',
    '&.MuiInputBase-input': {
      paddingInlineEnd: '32px !important'
    }
  },
  '& .Mui-focused .MuiSelect-select': {
    '& ~ i, & ~ svg': {
      right: '0.9375rem'
    }
  },
  '& .MuiSelect-select:focus, & .MuiNativeSelect-select:focus': {
    backgroundColor: 'transparent'
  },

  '& .MuiInputBase-input': {
    '&:not(textarea).MuiInputBase-inputSizeSmall': {
      padding: '7.25px 14px'
    }
  },
  '& :not(.MuiInputBase-sizeSmall).MuiInputBase-root': {
    borderRadius: '8px',
    fontSize: '17px',
    lineHeight: '1.41',
    '& .MuiInputBase-input': {
      padding: '10.8px 16px'
    },
    '&.Mui-focused': {
      '& .MuiInputBase-input': {
        padding: '9.8px 15px'
      }
    }
  },
  '& .MuiFormHelperText-root': {
    lineHeight: 1.154,
    margin: theme.spacing(1, 0, 0),
    fontSize: theme.typography.body2.fontSize,
    '&.Mui-error': {
      color: 'var(--mui-palette-error-main)'
    },
    '&.Mui-disabled': {
      color: 'var(--mui-palette-text-disabled)'
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

const CustomSelect = forwardRef((props, ref) => {
  const uniqueId = uuidv4()
  const formik = useContext(FormikContext)

  const {
    name,
    options = [],
    loading = false,
    placeholder = 'Select an option',
    label,
    requiredField,
    disabled = false,
    className,
    size = 'small',
    slotProps,
    updateOnLoad,
    handleInputChange,
    defaultValue,
    onBlur,
    ...rest
  } = props

  const [selectedOption, setSelectedOption] = useState(null)

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

  // Update selected option when formik value or options change
  useEffect(() => {
    const selected = options.find(option => option.value == formik.values[name])
    setSelectedOption(selected || null)
  }, [formik.values[name], options])

  // Handle change
  const handleChange = event => {
    const value = event.target.value
    formik.setFieldValue(name, value)

    // Find the selected option and update local state
    const selected = options.find(option => option.value === value)
    setSelectedOption(selected || null)
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
        <TextFieldStyled
          id={uniqueId}
          select
          size={size}
          inputRef={ref}
          name={name}
          value={loading ? '' : formik.values[name] || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={hasError}
          disabled={isDisabled}
          placeholder={placeholder}
          variant='filled'
          fullWidth
          slotProps={{
            ...slotProps,
            inputLabel: { ...slotProps?.inputLabel, shrink: true }
          }}
          {...rest}
        >
          {loading ? (
            <MenuItem disabled>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>Loading...</Box>
            </MenuItem>
          ) : options.length > 0 ? (
            [
              placeholder && (
                <MenuItem key='placeholder' value='' disabled>
                  <Box sx={{ color: 'text.secondary' }}>{placeholder}</Box>
                </MenuItem>
              ),
              ...options.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))
            ].filter(Boolean)
          ) : (
            <MenuItem disabled>
              <Box sx={{ color: 'text.secondary' }}>No options available</Box>
            </MenuItem>
          )}
        </TextFieldStyled>

        {loading && (
          <LoadingIndicator>
            <CircularProgress
              size={16}
              thickness={4}
              sx={{
                color: 'primary.main',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round'
                }
              }}
            />
          </LoadingIndicator>
        )}
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

CustomSelect.displayName = 'CustomSelect'

export default CustomSelect
