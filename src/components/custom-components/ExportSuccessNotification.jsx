'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Fade from '@mui/material/Fade'
import Zoom from '@mui/material/Zoom'
import { styled } from '@mui/material/styles'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Toast Import
import { toast } from 'react-toastify'

// Styled Components
const NotificationCard = styled(Card)(({ theme }) => ({
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 9999,
  minWidth: 320,
  maxWidth: 400,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[12],
  border: `1px solid ${theme.palette.success.main}`,
  background: theme.palette.background.paper,
  backdropFilter: 'none',
}))

const ExportSuccessNotification = ({ 
  open, 
  onClose, 
  exportData = {},
  autoClose = false,
  autoCloseDelay = 5000 
}) => {
  const [progress, setProgress] = useState(0)

  const handleAutoClose = useCallback(() => {
    setTimeout(() => {
      onClose()
    }, 0)
  }, [onClose])

  useEffect(() => {
    if (open && autoClose) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleAutoClose()
            return 100
          }
          return prev + (100 / (autoCloseDelay / 100))
        })
      }, 100)

      return () => clearInterval(interval)
    } else if (open && !autoClose) {
      // Reset progress when auto-close is disabled
      setProgress(0)
    }
  }, [open, autoClose, autoCloseDelay, handleAutoClose])

  if (!open) return null

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFormatIcon = (format) => {
    const icons = {
      pdf: 'tabler-file-type-pdf',
      excel: 'tabler-file-type-xls',
      csv: 'tabler-file-type-csv',
      json: 'tabler-code'
    }
    return icons[format] || 'tabler-file'
  }

  const getFormatColor = (format) => {
    const colors = {
      pdf: 'error',
      excel: 'success',
      csv: 'info',
      json: 'secondary'
    }
    return colors[format] || 'primary'
  }

  return (
    <Zoom in={open} timeout={300}>
      <NotificationCard>
        <CardContent className='p-4'>
          <div className='flex items-start justify-between mb-3'>
            <div className='flex items-center gap-3'>
              <CustomAvatar skin='light' color='success' size={40}>
                <i className='tabler-check text-xl' />
              </CustomAvatar>
              <div>
                <Typography variant='h6' className='mb-1'>
                  Export Successful!
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Your ledger data has been exported
                </Typography>
              </div>
            </div>
            <IconButton size='small' onClick={onClose}>
              <i className='tabler-x text-lg' />
            </IconButton>
          </div>

          {/* Export Details */}
          <Fade in={true} timeout={500}>
            <Box className='mb-3'>
              <div className='flex items-center gap-2 mb-2'>
                <CustomAvatar
                  skin='light'
                  color={getFormatColor(exportData.format)}
                  size={24}
                >
                  <i className={getFormatIcon(exportData.format)} />
                </CustomAvatar>
                <Typography variant='body2' fontWeight='medium'>
                  {exportData.format?.toUpperCase()} File
                </Typography>
                {exportData.fileSize && (
                  <Chip
                    label={formatFileSize(exportData.fileSize)}
                    size='small'
                    variant='outlined'
                    color={getFormatColor(exportData.format)}
                  />
                )}
              </div>
              
              {exportData.recordCount && (
                <Typography variant='caption' color='text.secondary'>
                  {exportData.recordCount} records exported
                </Typography>
              )}
            </Box>
          </Fade>

          {/* Auto-close Progress */}
          {autoClose && (
            <Box className='mb-2'>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'var(--mui-palette-success-main)',
                    borderRadius: 2,
                  }
                }}
              />
            </Box>
          )}

          {/* Actions */}
          <div className='flex gap-2'>
            <Button
              size='small'
              variant='outlined'
              startIcon={<i className='tabler-folder-open' />}
              onClick={() => {
                // Open file location
                toast.info('File saved to Downloads folder')
                setTimeout(() => onClose(), 0)
              }}
            >
              Open Folder
            </Button>
            <Button
              size='small'
              variant='contained'
              color='success'
              onClick={() => setTimeout(() => onClose(), 0)}
            >
              Done
            </Button>
          </div>
        </CardContent>
      </NotificationCard>
    </Zoom>
  )
}

export default ExportSuccessNotification
