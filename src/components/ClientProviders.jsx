'use client'

// Third-party Imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// QueryClient Provider Wrapper Component
const ClientProviders = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient())

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export default ClientProviders
