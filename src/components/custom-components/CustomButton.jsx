'use client'

// React Imports
import { forwardRef } from 'react'

// MUI Imports
import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Third-party Imports
import classNames from 'classnames'

const StyledButton = styled(Button)(({ theme, loading }) => ({
  position: 'relative',
  minHeight: '40px', // Ensures consistent height during loading

  // Loading state styles
  ...(loading && {
    color: 'transparent !important', // Hide text during loading
    '& .MuiButton-startIcon, & .MuiButton-endIcon': {
      opacity: 0 // Hide icons during loading
    }
  }),

  // Enhanced hover and focus states
  '&:hover': {
    transform: 'translateY(-1px)',
    transition: 'all 0.2s ease-in-out',
    boxShadow: theme.shadows[4]
  },

  '&:active': {
    transform: 'translateY(0px)',
    transition: 'all 0.1s ease-in-out'
  },

  // Disabled state
  '&.Mui-disabled': {
    cursor: 'not-allowed',
    opacity: 0.6
  }
}))

const LoadingSpinner = styled(CircularProgress)(({ theme, buttonsize }) => ({
  color: '#ffffff !important',
  filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))',

  // Enhanced glow effect
  '& .MuiCircularProgress-circle': {
    filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))',
    strokeLinecap: 'round'
  },

  // Size based on button size
  ...(buttonsize === 'small' && {
    width: '16px !important',
    height: '16px !important'
  }),
  ...(buttonsize === 'medium' && {
    width: '20px !important',
    height: '20px !important'
  }),
  ...(buttonsize === 'large' && {
    width: '24px !important',
    height: '24px !important'
  })
}))

const CustomButton = forwardRef((props, ref) => {
  const {
    loading = false,
    loadingText = 'Loading...',
    disabled = false,
    size = 'medium',
    color = 'primary',
    variant = 'contained',
    className,
    children,
    onClick,
    type = 'button',
    fullWidth = false,
    startIcon,
    endIcon,
    showLoadingText = false,
    ...rest
  } = props

  // Determine if button should be disabled
  const isDisabled = disabled || loading

  // Handle click events
  const handleClick = event => {
    if (loading || disabled) {
      event.preventDefault()

      return
    }

    onClick?.(event)
  }

  return (
    <StyledButton
      ref={ref}
      disabled={isDisabled}
      size={size}
      color={color}
      variant={variant}
      fullWidth={fullWidth}
      className={classNames(className, {
        loading: loading
      })}
      onClick={handleClick}
      type={type}
      startIcon={!loading ? startIcon : undefined}
      endIcon={!loading ? endIcon : undefined}
      {...rest}
    >
      {/* Button content */}
      {children || 'Button'}

      {/* Loading text and spinner */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: showLoadingText && loadingText ? 1.5 : 0
          }}
        >
          {/* Loading text first */}
          {showLoadingText && loadingText && (
            <Box
              sx={{
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 500,
                opacity: 0.9,
                textShadow: '0 0 4px rgba(255, 255, 255, 0.5)',
                whiteSpace: 'nowrap'
              }}
            >
              {loadingText}
            </Box>
          )}

          {/* Spinner below text */}
          <LoadingSpinner size={size === 'small' ? 16 : size === 'large' ? 24 : 20} buttonsize={size} thickness={4} />
        </Box>
      )}
    </StyledButton>
  )
})

CustomButton.displayName = 'CustomButton'

export default CustomButton
