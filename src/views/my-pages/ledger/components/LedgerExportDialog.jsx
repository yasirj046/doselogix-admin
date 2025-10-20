'use client'

// React Imports
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import StepContent from '@mui/material/StepContent'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import LinearProgress from '@mui/material/LinearProgress'
import Fade from '@mui/material/Fade'
import Zoom from '@mui/material/Zoom'
import { styled } from '@mui/material/styles'

// Third-party Imports
import { useMutation } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomDatePicker from '@/components/custom-components/CustomDatePicker'
import ExportSuccessNotification from '@/components/custom-components/ExportSuccessNotification'

// Util Imports
import api from '@/libs/axiosInstance'

// Styled Components
const ExportOptionCard = styled(Card)(({ theme, selected }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: selected 
    ? `2px solid ${theme.palette.primary.main}` 
    : `1px solid ${theme.palette.divider}`,
  background: selected 
    ? theme.palette.primary.light + '10' 
    : theme.palette.background.paper,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    border: `2px solid ${theme.palette.primary.main}`,
  }
}))

const ProgressContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  marginTop: theme.spacing(2)
}))

const LedgerExportDialog = ({ open, onClose, dateRange, filters }) => {
  // States
  const [activeStep, setActiveStep] = useState(0)
  const [exportFormat, setExportFormat] = useState('pdf')
  const [exportDateRange, setExportDateRange] = useState(dateRange)
  const [exportFilters, setExportFilters] = useState(filters)
  const [includeSummary, setIncludeSummary] = useState(true)
  const [includeTransactions, setIncludeTransactions] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStatus, setExportStatus] = useState('')
  const [exportError, setExportError] = useState(null)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [exportResult, setExportResult] = useState(null)

  // Hooks
  const { data: session } = useSession()

  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0)
      setExportFormat('pdf')
      setExportDateRange(dateRange)
      setExportFilters(filters)
      setIncludeSummary(true)
      setIncludeTransactions(true)
      setIsExporting(false)
      setExportProgress(0)
      setExportStatus('')
      setExportError(null)
      setExportSuccess(false)
      setShowSuccessNotification(false)
      setExportResult(null)
    }
  }, [open, dateRange, filters])

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async (exportParams) => {
      const params = new URLSearchParams({
        startDate: exportParams.dateRange.startDate.toISOString(),
        endDate: exportParams.dateRange.endDate.toISOString(),
        format: exportParams.format,
        includeSummary: exportParams.includeSummary.toString(),
        includeTransactions: exportParams.includeTransactions.toString(),
        ...(exportParams.filters.transactionType && { transactionType: exportParams.filters.transactionType }),
        ...(exportParams.filters.paymentStatus && { paymentStatus: exportParams.filters.paymentStatus }),
        ...(exportParams.filters.customerId && { customerId: exportParams.filters.customerId })
      })

      const response = await api.get(`/ledger/export?${params}`, {
        responseType: exportParams.format === 'json' ? 'json' : 'blob'
      })
      
      return { data: response.data, format: exportParams.format }
    },
    onSuccess: (result) => {
      setExportSuccess(true)
      setExportProgress(100)
      setExportStatus('Export completed successfully!')
      
      // Handle file download for all formats
      let blob, fileSize, recordCount
      
      if (result.format === 'json') {
        // For JSON format, create blob from the response data
        const jsonString = JSON.stringify(result.data, null, 2)
        blob = new Blob([jsonString], { type: 'application/json' })
        fileSize = blob.size
        recordCount = result.data?.data?.metadata?.recordCount || result.data?.metadata?.recordCount || 0
      } else {
        // For other formats, use the binary data directly
        blob = new Blob([result.data], { 
          type: result.format === 'pdf' ? 'application/pdf' : 
                result.format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                'text/csv'
        })
        fileSize = blob.size
        recordCount = result.data?.metadata?.recordCount || 0
      }
      
      // Download the file for all formats
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ledger-export-${new Date().toISOString().split('T')[0]}.${result.format === 'excel' ? 'xlsx' : result.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Set export result for notification
      setExportResult({
        format: result.format,
        fileSize: fileSize,
        recordCount: recordCount
      })
      
      // Show success notification
      setShowSuccessNotification(true)
      
      // Don't auto-close the modal - let user decide when to close
    },
    onError: (error) => {
      setExportError(error.message || 'Export failed')
      setExportStatus('Export failed')
      toast.error('Export failed: ' + (error.message || 'Unknown error'))
    }
  })

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)
    setExportStatus('Preparing export...')
    setExportError(null)
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, 200)

    try {
      const exportParams = {
        format: exportFormat,
        dateRange: exportDateRange,
        filters: exportFilters,
        includeSummary,
        includeTransactions
      }

      await exportMutation.mutateAsync(exportParams)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      clearInterval(progressInterval)
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    if (!isExporting) {
      onClose()
    }
  }

  const handleNext = () => {
    setActiveStep(prev => prev + 1)
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const exportOptions = [
    {
      value: 'pdf',
      label: 'PDF Document',
      description: 'Professional PDF report with summary and transactions',
      icon: 'tabler-file-type-pdf',
      color: 'error',
      features: ['Financial Summary', 'Transaction Details', 'Professional Layout']
    },
    {
      value: 'excel',
      label: 'Excel Spreadsheet',
      description: 'Comprehensive Excel workbook with multiple sheets',
      icon: 'tabler-file-type-xls',
      color: 'success',
      features: ['Summary Sheet', 'Transaction Sheet', 'Formulas & Totals']
    },
    {
      value: 'csv',
      label: 'CSV File',
      description: 'Simple CSV format for data analysis',
      icon: 'tabler-file-type-csv',
      color: 'info',
      features: ['Raw Data', 'Easy Import', 'Data Analysis']
    },
    {
      value: 'json',
      label: 'JSON Data',
      description: 'Structured JSON format for API integration',
      icon: 'tabler-code',
      color: 'secondary',
      features: ['API Ready', 'Structured Data', 'Developer Friendly']
    }
  ]

  const steps = [
    'Select Format',
    'Configure Options',
    'Review & Export'
  ]

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogTitle className='flex items-center justify-between p-4'>
        <Box className='flex items-center gap-3'>
          <CustomAvatar skin='light' color='primary' size={32}>
            <i className='tabler-download text-lg' />
          </CustomAvatar>
          <div>
            <Typography variant='h6' component='h2'>
              Export Ledger Data
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Export your financial data in multiple formats
            </Typography>
          </div>
        </Box>
        <IconButton onClick={handleClose} disabled={isExporting}>
          <i className='tabler-x text-lg' />
        </IconButton>
      </DialogTitle>

      <DialogContent className='p-4'>
        {/* Stepper */}
        <Stepper activeStep={activeStep} className='mb-4'>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content Container */}
        <Box sx={{ minHeight: activeStep === 0 ? '400px' : 'auto' }}>
          {/* Step 1: Format Selection */}
          {activeStep === 0 && (
            <Fade in={true}>
              <Box>
                <Typography variant='subtitle1' className='mb-3'>
                  Choose Export Format
                </Typography>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {exportOptions.map((option, index) => (
                    <Zoom in={true} key={option.value} style={{ transitionDelay: `${index * 100}ms` }}>
                      <ExportOptionCard
                        selected={exportFormat === option.value}
                        onClick={() => setExportFormat(option.value)}
                      >
                        <CardContent className='p-4'>
                          <div className='flex items-start gap-3'>
                            <CustomAvatar
                              skin='light'
                              color={option.color}
                              size={36}
                            >
                              <i className={`${option.icon} text-lg`} />
                            </CustomAvatar>
                            <div className='flex-1'>
                              <Typography variant='subtitle1' className='mb-1'>
                                {option.label}
                              </Typography>
                              <Typography variant='body2' color='text.secondary' className='mb-2'>
                                {option.description}
                              </Typography>
                              <div className='flex flex-wrap gap-1'>
                                {option.features.map((feature, idx) => (
                                  <Chip
                                    key={idx}
                                    label={feature}
                                    size='small'
                                    variant='outlined'
                                    color={option.color}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </ExportOptionCard>
                    </Zoom>
                  ))}
                </div>
              </Box>
            </Fade>
          )}

          {/* Step 2: Configuration */}
          {activeStep === 1 && (
            <Fade in={true}>
              <Box>
                <Typography variant='subtitle1' className='mb-3'>
                  Configure Export Options
                </Typography>
                
                {/* Date Range */}
                <Box className='mb-4'>
                  <Typography variant='body1' className='mb-2'>
                    Date Range
                  </Typography>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <CustomDatePicker
                      label='Start Date'
                      selected={exportDateRange.startDate}
                      onChange={(date) => setExportDateRange({
                        ...exportDateRange,
                        startDate: date
                      })}
                      dateFormat='dd/MM/yyyy'
                    />
                    <CustomDatePicker
                      label='End Date'
                      selected={exportDateRange.endDate}
                      onChange={(date) => setExportDateRange({
                        ...exportDateRange,
                        endDate: date
                      })}
                      dateFormat='dd/MM/yyyy'
                    />
                  </div>
                </Box>

                {/* Export Options */}
                <Box className='mb-4'>
                  <Typography variant='body1' className='mb-2'>
                    Include in Export
                  </Typography>
                  <div className='space-y-2'>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={includeSummary}
                          onChange={(e) => setIncludeSummary(e.target.checked)}
                          color='primary'
                        />
                      }
                      label={
                        <div>
                          <Typography variant='body1'>Financial Summary</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Include totals, profit/loss, and key metrics
                          </Typography>
                        </div>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={includeTransactions}
                          onChange={(e) => setIncludeTransactions(e.target.checked)}
                          color='primary'
                        />
                      }
                      label={
                        <div>
                          <Typography variant='body1'>Transaction Details</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            Include all transaction records
                          </Typography>
                        </div>
                      }
                    />
                  </div>
                </Box>

                {/* Active Filters */}
                {Object.values(exportFilters).some(value => value !== '') && (
                  <Box className='mb-3'>
                    <Typography variant='body1' className='mb-2'>
                      Active Filters
                    </Typography>
                    <div className='flex flex-wrap gap-2'>
                      {exportFilters.transactionType && (
                        <Chip
                          label={`Type: ${exportFilters.transactionType.replace('_', ' ')}`}
                          color='primary'
                          variant='outlined'
                          size='small'
                        />
                      )}
                      {exportFilters.paymentStatus && (
                        <Chip
                          label={`Status: ${exportFilters.paymentStatus}`}
                          color='secondary'
                          variant='outlined'
                          size='small'
                        />
                      )}
                      {exportFilters.customerId && (
                        <Chip
                          label={`Customer: ${exportFilters.customerId}`}
                          color='info'
                          variant='outlined'
                          size='small'
                        />
                      )}
                    </div>
                  </Box>
                )}
              </Box>
            </Fade>
          )}

          {/* Step 3: Review & Export */}
          {activeStep === 2 && (
            <Fade in={true}>
              <Box>
                <Typography variant='subtitle1' className='mb-3'>
                  Review Export Settings
                </Typography>
                
                {/* Export Preview */}
                <Card className='mb-4'>
                  <CardContent className='p-4'>
                    <Typography variant='body1' className='mb-3'>
                      Export Preview
                    </Typography>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      <div>
                        <Typography variant='body2' color='text.secondary'>
                          Date Range
                        </Typography>
                        <Typography variant='body1'>
                          {formatDate(exportDateRange.startDate)} - {formatDate(exportDateRange.endDate)}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant='body2' color='text.secondary'>
                          Format
                        </Typography>
                        <Typography variant='body1'>
                          {exportOptions.find(opt => opt.value === exportFormat)?.label}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant='body2' color='text.secondary'>
                          Includes
                        </Typography>
                        <Typography variant='body1'>
                          {[
                            includeSummary && 'Summary',
                            includeTransactions && 'Transactions'
                          ].filter(Boolean).join(', ')}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant='body2' color='text.secondary'>
                          Filters Applied
                        </Typography>
                        <Typography variant='body1'>
                          {Object.values(exportFilters).some(value => value !== '') ? 'Yes' : 'None'}
                        </Typography>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Export Progress */}
                {isExporting && (
                  <ProgressContainer>
                    <div className='flex items-center justify-between mb-2'>
                      <Typography variant='body2'>
                        {exportStatus}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {Math.round(exportProgress)}%
                      </Typography>
                    </div>
                    <LinearProgress 
                      variant="determinate" 
                      value={exportProgress} 
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </ProgressContainer>
                )}

                {/* Export Success */}
                {exportSuccess && (
                  <Alert severity="success" className='mb-3'>
                    <AlertTitle>Export Successful!</AlertTitle>
                    Your ledger data has been exported successfully.
                  </Alert>
                )}

                {/* Export Error */}
                {exportError && (
                  <Alert severity="error" className='mb-3'>
                    <AlertTitle>Export Failed</AlertTitle>
                    {exportError}
                  </Alert>
                )}
              </Box>
            </Fade>
          )}
        </Box>
      </DialogContent>

      <DialogActions className='p-4 pt-0'>
        <Button onClick={handleClose} disabled={isExporting}>
          Cancel
        </Button>
        
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={isExporting}>
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button
            variant='contained'
            onClick={handleNext}
            disabled={!exportFormat}
          >
            Next
          </Button>
        ) : (
          <Button
            variant='contained'
            onClick={handleExport}
            disabled={isExporting || (!includeSummary && !includeTransactions)}
            startIcon={isExporting ? <CircularProgress size={20} /> : <i className='tabler-download' />}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        )}
      </DialogActions>

      {/* Success Notification */}
      <ExportSuccessNotification
        open={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        exportData={exportResult}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </Dialog>
  )
}

export default LedgerExportDialog
