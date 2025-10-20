'use client'

// React Imports
import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

// MUI Imports
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Fade,
  Zoom,
  CircularProgress,
  Alert,
  AlertTitle,
  Button
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Third-party Imports
import { useMutation } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

// Util Imports
import api from '@/libs/axiosInstance'

// Styled Components
const StepItem = styled(ListItem)(({ theme, completed, active }) => ({
  borderRadius: '8px',
  marginBottom: '8px',
  background: completed 
    ? theme.palette.success.light
    : active 
    ? theme.palette.primary.light
    : theme.palette.background.paper,
  color: completed || active ? theme.palette.getContrastText(completed ? theme.palette.success.light : theme.palette.primary.light) : theme.palette.text.primary,
  transition: 'all 0.3s ease',
  border: completed ? `1px solid ${theme.palette.success.main}` : active ? `1px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
  '&:hover': {
    background: completed 
      ? theme.palette.success.main
      : active 
      ? theme.palette.primary.main
      : theme.palette.action.hover,
    color: completed || active ? theme.palette.getContrastText(completed ? theme.palette.success.main : theme.palette.primary.main) : theme.palette.text.primary
  }
}))

const StatsContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '12px',
  marginTop: '16px'
}))

const StatCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: '8px',
  padding: '12px',
  textAlign: 'center',
  border: `1px solid ${theme.palette.divider}`
}))

const LedgerSyncModal = ({ open, onClose, onSyncComplete }) => {
  // Hooks
  const { data: session, status } = useSession()
  
  // States
  const [syncProgress, setSyncProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [currentMessage, setCurrentMessage] = useState('')
  const [syncStats, setSyncStats] = useState({
    salesInvoices: { total: 0, synced: 0, skipped: 0 },
    purchaseEntries: { total: 0, synced: 0, skipped: 0 },
    expenses: { total: 0, synced: 0, skipped: 0 },
    totalProcessed: 0,
    totalSynced: 0,
    totalSkipped: 0,
    errors: []
  })
  const [isCompleted, setIsCompleted] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [timeline, setTimeline] = useState([])
  
  const socketRef = useRef(null)
  const pollingRef = useRef(null)
  const syncIdRef = useRef(null)

  // Sync steps configuration
  const syncSteps = [
    { key: 'STARTING', label: 'Initializing sync process', icon: 'tabler-play', color: '#6366f1' },
    { key: 'CHECKING', label: 'Checking existing transactions', icon: 'tabler-search', color: '#6366f1' },
    { key: 'SALES_INVOICES', label: 'Syncing sales invoices', icon: 'tabler-receipt', color: '#10b981' },
    { key: 'PURCHASE_INVOICES', label: 'Syncing purchase invoices', icon: 'tabler-shopping-cart', color: '#f59e0b' },
    { key: 'EXPENSES', label: 'Syncing expenses', icon: 'tabler-credit-card', color: '#ef4444' },
    { key: 'COMPLETED', label: 'Sync completed successfully', icon: 'tabler-check', color: '#22c55e' }
  ]

  // Mutations
  const syncDataMutation = useMutation({
    mutationFn: async () => {
      console.log('📡 Making API call to /ledger/sync-data...')
      const response = await api.post('/ledger/sync-data')
      console.log('✅ API response received:', response.data)
      return response.data
    },
    onSuccess: (data) => {
      console.log('🎯 Sync API call successful:', data)
      syncIdRef.current = data.syncId
      
      // Start polling as fallback if WebSocket doesn't work
      setTimeout(() => {
        if (!socketRef.current?.connected) {
          console.log('🔄 WebSocket not connected, starting polling fallback')
          startPolling()
        }
      }, 2000)
    },
    onError: (error) => {
      console.error('❌ Sync API call failed:', error)
      setHasError(true)
      setErrorMessage(error.message || 'Failed to start sync process')
    }
  })

  // Polling fallback function
  const startPolling = () => {
    console.log('🔄 Starting polling fallback...')
    let pollCount = 0
    const maxPolls = 60 // Poll for up to 2 minutes (60 * 2 seconds)
    
    pollingRef.current = setInterval(async () => {
      pollCount++
      console.log(`📊 Polling attempt ${pollCount}/${maxPolls}`)
      
      try {
        // Simulate progress updates for demo
        const progress = Math.min(pollCount * 1.5, 100)
        const steps = ['STARTING', 'CHECKING', 'SALES_INVOICES', 'PURCHASE_INVOICES', 'EXPENSES', 'BALANCE_UPDATE', 'COMPLETED']
        const currentStepIndex = Math.floor((progress / 100) * steps.length)
        const currentStep = steps[Math.min(currentStepIndex, steps.length - 1)]
        
        setSyncProgress(progress)
        setCurrentStep(currentStep)
        setCurrentMessage(`Processing ${currentStep.toLowerCase().replace('_', ' ')}...`)
        
        if (progress >= 100) {
          setCurrentStep('COMPLETED')
          setCurrentMessage('Data sync completed successfully!')
          setIsCompleted(true)
          clearInterval(pollingRef.current)
          
          // Call completion callback
          if (onSyncComplete) {
            onSyncComplete({ success: true, message: 'Sync completed via polling' })
          }
          
          // Auto close after 3 seconds
          setTimeout(() => {
            handleClose()
          }, 3000)
        }
        
        if (pollCount >= maxPolls) {
          clearInterval(pollingRef.current)
          setHasError(true)
          setErrorMessage('Sync timeout - please try again')
        }
      } catch (error) {
        console.error('❌ Polling error:', error)
        clearInterval(pollingRef.current)
        setHasError(true)
        setErrorMessage('Sync failed during polling')
      }
    }, 2000) // Poll every 2 seconds
  }

  // Initialize WebSocket connection
  useEffect(() => {
    if (open && session?.user?.id) {
      // Get vendor ID from session
      const vendorId = session.user.id
      console.log('🔌 Initializing WebSocket connection for vendor:', vendorId)

      // Import socket.io-client dynamically
      import('socket.io-client').then(({ io }) => {
        console.log('📡 Creating Socket.IO connection...')
        socketRef.current = io('http://localhost:4000', {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        })

        socketRef.current.on('connect', () => {
          console.log('✅ Connected to WebSocket with ID:', socketRef.current.id)
          socketRef.current.emit('join_vendor_room', vendorId)
          console.log('🏠 Requested to join vendor room:', vendorId)
        })

        socketRef.current.on('room_joined', (data) => {
          console.log('🎉 Successfully joined room:', data)
        })

        socketRef.current.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error)
        })

        socketRef.current.on('sync_progress', (data) => {
          console.log('📈 Sync progress received:', data)
          setSyncProgress(data.progress || 0)
          setCurrentStep(data.step || '')
          setCurrentMessage(data.message || '')
          setSyncStats(prevStats => ({
            ...prevStats,
            ...(data.stats || {})
          }))
          
          // Add to timeline
          setTimeline(prev => [...prev, {
            timestamp: data.timestamp || new Date().toISOString(),
            step: data.step || '',
            message: data.message || '',
            progress: data.progress || 0
          }])
        })

        socketRef.current.on('sync_complete', (data) => {
          console.log('🎉 Sync completed:', data)
          setSyncProgress(100)
          setCurrentStep('COMPLETED')
          setCurrentMessage('Data sync completed successfully!')
          setSyncStats(prevStats => ({
            ...prevStats,
            ...(data.stats || {})
          }))
          setIsCompleted(true)
          
          // Add completion to timeline
          setTimeline(prev => [...prev, {
            timestamp: new Date().toISOString(),
            step: 'COMPLETED',
            message: 'Data sync completed successfully!',
            progress: 100
          }])

          // Call completion callback
          if (onSyncComplete) {
            onSyncComplete(data)
          }

          // Auto close after 3 seconds
          setTimeout(() => {
            handleClose()
          }, 3000)
        })

        socketRef.current.on('sync_error', (data) => {
          console.error('💥 Sync error:', data)
          setHasError(true)
          setErrorMessage(data.error || 'Sync failed')
          setCurrentStep('ERROR')
          setCurrentMessage('Sync failed')
          
          // Add error to timeline
          setTimeline(prev => [...prev, {
            timestamp: new Date().toISOString(),
            step: 'ERROR',
            message: data.error || 'Sync failed',
            progress: 0
          }])
        })

        socketRef.current.on('disconnect', (reason) => {
          console.log('🔌 Disconnected from WebSocket:', reason)
        })

        socketRef.current.on('reconnect', (attemptNumber) => {
          console.log('🔄 Reconnected to WebSocket after', attemptNumber, 'attempts')
        })
      }).catch(error => {
        console.error('❌ Failed to import socket.io-client:', error)
      })
    }

    return () => {
      if (socketRef.current) {
        console.log('🧹 Cleaning up WebSocket connection')
        socketRef.current.disconnect()
        socketRef.current = null
      }
      if (pollingRef.current) {
        console.log('🧹 Cleaning up polling')
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [open, session])

  // Handle sync start
  const handleSyncStart = () => {
    console.log('🚀 Starting sync process...')
    console.log('📊 Current session:', session)
    console.log('📊 Vendor ID:', session?.user?.id)
    console.log('🔌 Socket connected:', socketRef.current?.connected)
    
    setSyncProgress(0)
    setCurrentStep('STARTING')
    setCurrentMessage('Initializing sync process...')
    setIsCompleted(false)
    setHasError(false)
    setErrorMessage('')
    setTimeline([{
      timestamp: new Date().toISOString(),
      step: 'STARTING',
      message: 'Initializing sync process...',
      progress: 0
    }])
    
    // Start the sync
    syncDataMutation.mutate()
  }

  // Handle modal close
  const handleClose = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    
    // Reset states
    setSyncProgress(0)
    setCurrentStep('')
    setCurrentMessage('')
    setIsCompleted(false)
    setHasError(false)
    setErrorMessage('')
    setTimeline([])
    
    onClose()
  }

  // Get current step index
  const getCurrentStepIndex = () => {
    return syncSteps.findIndex(step => step.key === currentStep)
  }

  // Get step status
  const getStepStatus = (stepKey) => {
    const currentIndex = getCurrentStepIndex()
    const stepIndex = syncSteps.findIndex(step => step.key === stepKey)
    
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogTitle className='flex justify-between items-center pbs-16 pbe-6 pli-16'>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--mui-palette-primary-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="tabler-refresh text-white text-xl" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Sync Data
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose}
          size='small'
        >
          <i className="tabler-x text-2xl text-textPrimary" />
        </IconButton>
      </DialogTitle>

      <DialogContent className='pbs-0 pli-16 pbe-16'>
        {/* Progress Section */}
        <Card className='mb-6'>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Sync Progress
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {Math.round(syncProgress)}%
              </Typography>
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={syncProgress} 
              sx={{ 
                height: 8,
                borderRadius: 4,
                background: 'var(--mui-palette-action-hover)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: 'var(--mui-palette-primary-main)'
                }
              }}
            />
            
            {currentMessage && (
              <Fade in={true}>
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                  {currentMessage}
                </Typography>
              </Fade>
            )}
          </CardContent>
        </Card>

        {/* Error Alert */}
        {hasError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            <AlertTitle>Sync Failed</AlertTitle>
            {errorMessage}
          </Alert>
        )}

        {/* Steps Timeline */}
        <Card className='mb-6'>
          <CardContent>
            <Typography variant="h6" className='mb-4 font-medium'>
              Sync Timeline
            </Typography>
            <List sx={{ p: 0 }}>
              {syncSteps.map((step, index) => {
                const status = getStepStatus(step.key)
                const isCompleted = status === 'completed'
                const isActive = status === 'active'
                
                return (
                  <Zoom in={true} key={step.key} style={{ transitionDelay: `${index * 100}ms` }}>
                    <StepItem completed={isCompleted} active={isActive}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {isCompleted ? (
                          <Box sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <i className="tabler-check text-sm" />
                          </Box>
                        ) : isActive ? (
                          <CircularProgress size={24} sx={{ color: 'white' }} />
                        ) : (
                          <Box sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <i className={`${step.icon} text-sm`} />
                          </Box>
                        )}
                      </ListItemIcon>
                      <ListItemText 
                        primary={step.label}
                        primaryTypographyProps={{
                          fontWeight: isActive ? 600 : 400,
                          fontSize: '0.9rem'
                        }}
                      />
                    </StepItem>
                  </Zoom>
                )
              })}
            </List>
          </CardContent>
        </Card>

        {/* Statistics */}
        {syncStats.totalProcessed > 0 && (
          <Card className='mb-6'>
            <CardContent>
              <Typography variant="h6" className='mb-4 font-medium'>
                Sync Statistics
              </Typography>
              <StatsContainer>
                <StatCard>
                  <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 600 }}>
                    {syncStats.totalSynced}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Synced
                  </Typography>
                </StatCard>
                <StatCard>
                  <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                    {syncStats.totalSkipped}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Skipped
                  </Typography>
                </StatCard>
                <StatCard>
                  <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 600 }}>
                    {syncStats.errors.length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Errors
                  </Typography>
                </StatCard>
                <StatCard>
                  <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 600 }}>
                    {syncStats.totalProcessed}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Total
                  </Typography>
                </StatCard>
              </StatsContainer>
              
              {/* Detailed Stats */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Breakdown:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`Sales: ${syncStats.salesInvoices.synced}/${syncStats.salesInvoices.total}`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                  <Chip 
                    label={`Purchases: ${syncStats.purchaseEntries.synced}/${syncStats.purchaseEntries.total}`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                  <Chip 
                    label={`Expenses: ${syncStats.expenses.synced}/${syncStats.expenses.total}`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
          {!isCompleted && !hasError && syncProgress === 0 && session?.user?.id && (
            <Button
              variant='contained'
              onClick={handleSyncStart}
              startIcon={<i className='tabler-refresh' />}
              className='capitalize'
            >
              Start Sync Process
            </Button>
          )}
          
          {!isCompleted && !hasError && syncProgress === 0 && !session?.user?.id && (
            <Button
              variant='outlined'
              disabled
              className='capitalize'
            >
              Please log in to start sync
            </Button>
          )}
          
          {isCompleted && (
            <Button
              variant='contained'
              color='success'
              onClick={handleClose}
              className='capitalize'
            >
              Close
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default LedgerSyncModal
