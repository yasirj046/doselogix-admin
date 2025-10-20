'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'

// Component Imports
import LedgerPage from '@/views/my-pages/ledger'

const Ledger = () => {
  // Hooks
  const { lang: locale } = useParams()

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <LedgerPage />
      </Grid>
    </Grid>
  )
}

export default Ledger
