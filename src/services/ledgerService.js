import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/libs/axiosInstance'

// Ledger Service
export const ledgerService = {
  // Get ledger transactions
  getLedgerTransactions: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: async () => {
        const response = await api.get('/ledger/transactions', { params })
        return response.data
      },
      enabled: !!params.startDate && !!params.endDate,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  },

  // Get ledger summary
  getLedgerSummary: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: async () => {
        const response = await api.get('/ledger/summary', { params })
        return response.data
      },
      enabled: !!params.startDate && !!params.endDate,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  },

  // Get customer summary
  getCustomerSummary: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: async () => {
        const response = await api.get('/ledger/customer-summary', { params })
        return response.data
      },
      enabled: !!params.startDate && !!params.endDate,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  },

  // Get dashboard summary
  getDashboardSummary: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: async () => {
        const response = await api.get('/ledger/dashboard-summary', { params })
        return response.data
      },
      enabled: !!params.startDate && !!params.endDate,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  },

  // Get predefined date ranges
  getPredefinedDateRanges: (queryKey) => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: async () => {
        const response = await api.get('/ledger/date-ranges')
        return response.data
      },
      staleTime: 60 * 60 * 1000, // 1 hour
    })
  },

  // Get snapshots
  getSnapshots: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: async () => {
        const response = await api.get('/ledger/snapshots', { params })
        return response.data
      },
      enabled: !!params.startDate && !!params.endDate,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  },

  // Get latest snapshot
  getLatestSnapshot: (queryKey) => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: async () => {
        const response = await api.get('/ledger/snapshots/latest')
        return response.data
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  },

  // Get transaction by ID
  getTransactionById: (queryKey, id) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: async () => {
        const response = await api.get(`/ledger/transactions/${id}`)
        return response.data
      },
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  },

  // Export ledger data
  exportLedgerData: (params = {}) => {
    return useQuery({
      queryKey: ['ledger-export', params],
      queryFn: async () => {
        const response = await api.get('/ledger/export', { params })
        return response.data
      },
      enabled: false, // Only run when manually triggered
      staleTime: 0,
    })
  },

  // Mutations
  // Sync existing data
  syncExistingData: () => {
    return useMutation({
      mutationFn: async () => {
        const response = await api.post('/ledger/sync-data')
        return response.data
      },
    })
  },

  // Create daily snapshot
  createDailySnapshot: () => {
    return useMutation({
      mutationFn: async (date) => {
        const response = await api.post('/ledger/snapshots', { date })
        return response.data
      },
    })
  },

  // Export to PDF
  exportToPDF: () => {
    return useMutation({
      mutationFn: async (params) => {
        const response = await api.get('/ledger/export', { 
          params: { ...params, format: 'pdf' },
          responseType: 'blob'
        })
        return response.data
      },
    })
  },

  // Export to Excel
  exportToExcel: () => {
    return useMutation({
      mutationFn: async (params) => {
        const response = await api.get('/ledger/export', { 
          params: { ...params, format: 'excel' },
          responseType: 'blob'
        })
        return response.data
      },
    })
  }
}

export default ledgerService
