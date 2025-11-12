'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
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
  Zoom,
  Fade,
  CircularProgress,
  Alert,
  AlertTitle,
  Button
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { useMutation } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import api from '@/libs/axiosInstance'

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

const DeliveryLogSyncModal = ({ open, onClose, onSyncComplete }) => {
  const { data: session } = useSession()

  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState({ total: 0, linked: 0, checked: 0, skipped: 0, errors: [] })
  const [isCompleted, setIsCompleted] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const socketRef = useRef(null)
  const pollingRef = useRef(null)
  const syncIdRef = useRef(null)

  const steps = [
    { key: 'STARTING', label: 'Initializing', icon: 'tabler-play' },
    { key: 'CHECKING', label: 'Checking invoices', icon: 'tabler-search' },
    { key: 'LINKING', label: 'Linking invoices', icon: 'tabler-link' },
    { key: 'COMPLETED', label: 'Completed', icon: 'tabler-check' }
  ]

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/delivery-logs/sync-missing-invoices')
      return res.data
    },
    onSuccess: (data) => {
      console.log('Delivery log sync API started, response:', data)
      // store syncId if backend provides one (ledger modal uses this pattern)
      if (data?.syncId) syncIdRef.current = data.syncId
      // If backend returns stats immediately
      if (data?.result) {
        setStats(prev => ({ ...prev, ...data.result }))
      }

      // Fallback to polling if sockets are not connected
      setTimeout(() => {
        if (!socketRef.current?.connected) {
          console.log('Socket not connected, starting polling fallback')
          startPolling()
        }
      }, 1500)
    },
    onError: (err) => {
      setHasError(true)
      setErrorMessage(err?.response?.data?.message || err.message || 'Sync failed')
    }
  })

  const startPolling = () => {
    let count = 0
    const max = 60
    pollingRef.current = setInterval(async () => {
      count++
      const fakeProgress = Math.min(count * 2, 100)
      setProgress(fakeProgress)
      setMessage('Processing...')
      if (fakeProgress >= 100) {
        clearInterval(pollingRef.current)
        setIsCompleted(true)
        setCurrentStep('COMPLETED')
        setMessage('Sync completed')
        if (onSyncComplete) onSyncComplete({ success: true })

      }
      if (count >= max) {
        clearInterval(pollingRef.current)
        setHasError(true)
        setErrorMessage('Sync timeout')
      }
    }, 2000)
  }

  useEffect(() => {
    if (open && session?.user?.id) {
      import('socket.io-client').then(({ io }) => {
        socketRef.current = io('http://localhost:4000', { transports: ['websocket', 'polling'] })

        socketRef.current.on('connect', () => {
          socketRef.current.emit('join_vendor_room', session.user.id)
        })

        // Listen to generic sync events (same as Ledger modal)
        socketRef.current.on('sync_progress', (data) => {
          console.log('Received sync_progress event:', data)
          setProgress(data.progress || 0)
          setCurrentStep(data.step || '')
          setMessage(data.message || '')
          if (data.stats) setStats(prev => ({ ...prev, ...data.stats }))
        })

            socketRef.current.on('sync_complete', (data) => {
              console.log('Received sync_complete event:', data)
              setProgress(100)
              setCurrentStep('COMPLETED')
              setMessage('Sync completed')
              setIsCompleted(true)
              if (data?.stats) setStats(prev => ({ ...prev, ...data.stats }))
              if (onSyncComplete) onSyncComplete(data)
              // Do NOT auto-close the modal; user should close explicitly
            })

        socketRef.current.on('sync_error', (data) => {
          console.error('Received sync_error event:', data)
          setHasError(true)
          setErrorMessage(data?.error || 'Sync failed')
        })
      }).catch(err => console.error('Failed to init socket', err))
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [open, session])

  const handleStart = () => {
    setProgress(0)
    setCurrentStep('STARTING')
    setMessage('Starting sync...')
    setIsCompleted(false)
    setHasError(false)
    setErrorMessage('')
    syncMutation.mutate()
  }

  const handleClose = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setProgress(0)
    setCurrentStep('')
    setMessage('')
    setStats({ total: 0, linked: 0, checked: 0, skipped: 0, errors: [] })
    setIsCompleted(false)
    setHasError(false)
    setErrorMessage('')
    onClose()
  }

  const getStepStatus = (key) => {
    const order = steps.map(s => s.key)
    const currentIndex = order.indexOf(currentStep)
    const stepIndex = order.indexOf(key)
  // If overall sync completed (or progress reached 100), mark the COMPLETED step as completed
  if (key === 'COMPLETED' && (isCompleted || progress >= 100)) return 'completed'

    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        // Prevent closing via backdrop click or escape key. Only close when user clicks Close button.
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return
        handleClose()
      }}
      maxWidth='md'
      fullWidth
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogTitle className='flex justify-between items-center pbs-16 pbe-6 pli-16'>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--mui-palette-primary-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className='tabler-refresh text-white text-xl' />
          </Box>
          <Typography variant='h4' sx={{ fontWeight: 600 }}>Sync Missing Invoices</Typography>
        </Box>
        <IconButton onClick={handleClose} size='small'><i className='tabler-x text-2xl text-textPrimary' /></IconButton>
      </DialogTitle>
      <DialogContent className='pbs-0 pli-16 pbe-16'>
        <Card className='mb-6'>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>Sync Progress</Typography>
              <Typography variant='body2' sx={{ color: 'text.secondary' }}>{Math.round(progress)}%</Typography>
            </Box>
            <LinearProgress variant='determinate' value={progress} sx={{ height: 8, borderRadius: 4, background: 'var(--mui-palette-action-hover)', '& .MuiLinearProgress-bar': { borderRadius: 4, background: 'var(--mui-palette-primary-main)' } }} />
            {message && (<Fade in={true}><Typography variant='body2' sx={{ mt: 2, color: 'text.secondary', fontStyle: 'italic' }}>{message}</Typography></Fade>)}
          </CardContent>
        </Card>

        {hasError && (<Alert severity='error' sx={{ mb: 2, borderRadius: 2 }}><AlertTitle>Sync Failed</AlertTitle>{errorMessage}</Alert>)}

        <Card className='mb-6'>
          <CardContent>
            <Typography variant='h6' className='mb-4 font-medium'>Sync Timeline</Typography>
            <List sx={{ p: 0 }}>
              {steps.map((step, idx) => {
                const status = getStepStatus(step.key)
                const isCompleted = status === 'completed'
                const isActive = status === 'active'
                return (
                  <Zoom in={true} key={step.key} style={{ transitionDelay: `${idx * 80}ms` }}>
                    <StepItem completed={isCompleted} active={isActive}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {isCompleted ? <Box sx={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className='tabler-check text-sm' /></Box> : isActive ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <Box sx={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className={`${step.icon} text-sm`} /></Box>}
                      </ListItemIcon>
                      <ListItemText primary={step.label} primaryTypographyProps={{ fontWeight: isActive ? 600 : 400, fontSize: '0.9rem' }} />
                    </StepItem>
                  </Zoom>
                )
              })}
            </List>
          </CardContent>
        </Card>

        {stats.total > 0 && (
          <Card className='mb-6'>
            <CardContent>
              <Typography variant='h6' className='mb-4 font-medium'>Sync Statistics</Typography>
              <StatsContainer>
                <StatCard><Typography variant='h6' sx={{ color: '#10b981', fontWeight: 600 }}>{stats.linked}</Typography><Typography variant='caption' sx={{ color: 'text.secondary' }}>Linked</Typography></StatCard>
                <StatCard><Typography variant='h6' sx={{ color: '#f59e0b', fontWeight: 600 }}>{stats.skipped}</Typography><Typography variant='caption' sx={{ color: 'text.secondary' }}>Skipped</Typography></StatCard>
                <StatCard><Typography variant='h6' sx={{ color: '#ef4444', fontWeight: 600 }}>{stats.errors?.length || 0}</Typography><Typography variant='caption' sx={{ color: 'text.secondary' }}>Errors</Typography></StatCard>
                <StatCard><Typography variant='h6' sx={{ color: '#6366f1', fontWeight: 600 }}>{stats.total}</Typography><Typography variant='caption' sx={{ color: 'text.secondary' }}>Total</Typography></StatCard>
              </StatsContainer>
              <Box sx={{ mt: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>Breakdown:</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`Checked: ${stats.checked || 0}`} size='small' variant='outlined' />
                  <Chip label={`Linked: ${stats.linked || 0}`} size='small' color='success' variant='outlined' />
                  <Chip label={`Skipped: ${stats.skipped || 0}`} size='small' color='warning' variant='outlined' />
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
          {!isCompleted && !hasError && progress === 0 && session?.user?.id && (
            <Button variant='contained' onClick={handleStart} startIcon={<i className='tabler-refresh' />} className='capitalize'>Start Sync Process</Button>
          )}
          {!isCompleted && !hasError && progress === 0 && !session?.user?.id && (
            <Button variant='outlined' disabled className='capitalize'>Please log in to start sync</Button>
          )}
          {isCompleted && (<Button variant='contained' color='success' onClick={handleClose} className='capitalize'>Close</Button>)}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default DeliveryLogSyncModal
