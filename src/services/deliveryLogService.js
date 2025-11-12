import { useQuery, useMutation } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const deliveryLogService = {
  // Get all delivery logs with pagination and filtering
  getAllDeliveryLogs: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_DELIVERY_LOGS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get single delivery log by ID
  getDeliveryLogById: (queryKey, id) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_DELIVERY_LOG_BY_ID}${id}`)
      },
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Create new delivery log
  createDeliveryLog: () => {
    return useMutation({
      mutationFn: deliveryLogData => {
        return axios.post(`${API_BASE_URL}${API_URLS.CREATE_DELIVERY_LOG}`, deliveryLogData)
      }
    })
  },

  // Update existing delivery log
  updateDeliveryLog: () => {
    return useMutation({
      mutationFn: ({ id, deliveryLogData }) => {
        return axios.put(`${API_BASE_URL}${API_URLS.UPDATE_DELIVERY_LOG}${id}`, deliveryLogData)
      }
    })
  },

  // Delete delivery log
  deleteDeliveryLog: () => {
    return useMutation({
      mutationFn: id => {
        return axios.delete(`${API_BASE_URL}${API_URLS.DELETE_DELIVERY_LOG}${id}`)
      }
    })
  },

  // Toggle delivery log status
  toggleDeliveryLogStatus: () => {
    return useMutation({
      mutationFn: id => {
        return axios.patch(`${API_BASE_URL}${API_URLS.TOGGLE_DELIVERY_LOG_STATUS}${id}/toggle-status`)
      }
    })
  },

  // Recalculate delivery log total
  recalculateTotal: () => {
    return useMutation({
      mutationFn: id => {
        return axios.post(`${API_BASE_URL}${API_URLS.RECALCULATE_DELIVERY_LOG_TOTAL}${id}/recalculate`)
      }
    })
  },

  // Get delivery logs by date range
  getDeliveryLogsByDateRange: (queryKey, filters) => {
    return useQuery({
      queryKey: [queryKey, filters],
      queryFn: () => {
        const params = new URLSearchParams(filters).toString()
        return axios.get(`${API_BASE_URL}${API_URLS.GET_DELIVERY_LOGS_BY_DATE_RANGE}?${params}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get delivery log statistics
  getDeliveryLogStats: (queryKey, filters) => {
    return useQuery({
      queryKey: [queryKey, filters],
      queryFn: () => {
        const params = filters ? new URLSearchParams(filters).toString() : ''
        const url = params
          ? `${API_BASE_URL}${API_URLS.GET_DELIVERY_LOG_STATS}?${params}`
          : `${API_BASE_URL}${API_URLS.GET_DELIVERY_LOG_STATS}`
        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Sync missing invoices into delivery logs
  syncMissingInvoices: () => {
    return axios.post(`${API_BASE_URL}${API_URLS.SYNC_MISSING_INVOICES}`)
  },

  // Preview delivery log number for selected employee and date
  getDeliveryLogNumber: (queryKey, salesmanId, date) => {
    return useQuery({
      queryKey: [queryKey, salesmanId, date],
      queryFn: async () => {
        const params = new URLSearchParams({ salesmanId, date }).toString()
        const url = `${API_BASE_URL}${API_URLS.GET_DELIVERY_LOG_PREVIEW_NUMBER}?${params}`
        const response = await axios.get(url)
        return response
      },
      enabled: !!salesmanId && !!date,
      retry: false,
      refetchOnWindowFocus: false
    })
  }
}
