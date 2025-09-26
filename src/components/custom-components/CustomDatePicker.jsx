'use client'

// React Imports
import { forwardRef } from 'react'

// MUI Imports
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'

// Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Styled Components
const CustomInput = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    color: 'var(--mui-palette-text-primary)',
    fontSize: '0.9375rem',
    fontWeight: theme.typography.body1.fontWeight,
    lineHeight: 1.467,
    '&::placeholder': {
      color: 'var(--mui-palette-text-secondary)',
      opacity: 1
    },
    '&:focus': {
      boxShadow: 'none'
    }
  }
}))

const PickerComponent = forwardRef(({ label, error, ...props }, ref) => {
  return (
    <CustomInput
      inputRef={ref}
      fullWidth
      label={label}
      size="small"
      autoComplete="off"
      {...props}
      error={error}
    />
  )
})

PickerComponent.displayName = 'PickerComponent'

const CustomDatePicker = ({
  selected,
  onChange,
  placeholder,
  label,
  error,
  helperText,
  dateFormat = "dd/MM/yyyy",
  isClearable = true,
  showMonthDropdown = true,
  showYearDropdown = true,
  dropdownMode = "select",
  ...props
}) => {
  return (
    <AppReactDatepicker
      selected={selected}
      onChange={onChange}
      placeholderText={placeholder}
      dateFormat={dateFormat}
      isClearable={isClearable}
      showMonthDropdown={showMonthDropdown}
      showYearDropdown={showYearDropdown}
      dropdownMode={dropdownMode}
      customInput={
        <PickerComponent
          label={label}
          error={error}
          helperText={helperText}
        />
      }
      {...props}
    />
  )
}

export default CustomDatePicker
