import { useQuery, useMutation } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const purchaseInvoiceService = {
  getAllPurchaseEntries: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_PURCHASE_ENTRIES}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getOnePurchaseEntryDetails: (queryKey, id) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_PURCHASE_ENTRY_BY_ID}${id}`)
      },
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  createPurchaseEntry: () => {
    return useMutation({
      mutationFn: (purchaseData) => {
        return axios.post(`${API_BASE_URL}${API_URLS.CREATE_PURCHASE_ENTRY}`, purchaseData)
      }
    })
  },
  updatePurchaseEntry: () => {
    return useMutation({
      mutationFn: ({ id, purchaseData }) => {
        return axios.put(`${API_BASE_URL}${API_URLS.UPDATE_PURCHASE_ENTRY}${id}`, purchaseData)
      }
    })
  },
  deletePurchaseEntry: () => {
    return useMutation({
      mutationFn: (id) => {
        return axios.delete(`${API_BASE_URL}${API_URLS.DELETE_PURCHASE_ENTRY}${id}`)
      }
    })
  },
  togglePurchaseEntryStatus: () => {
    return useMutation({
      mutationFn: ({ id }) => {
        return axios.patch(`${API_BASE_URL}${API_URLS.TOGGLE_PURCHASE_ENTRY_STATUS}${id}/toggle-status`)
      }
    })
  },
  getPurchaseStatistics: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: () => {
        const queryString = new URLSearchParams(params).toString()
        return axios.get(`${API_BASE_URL}${API_URLS.GET_PURCHASE_STATS}${queryString ? `?${queryString}` : ''}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getPurchaseEntriesByDateRange: (queryKey, params) => {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: () => {
        const queryString = new URLSearchParams(params).toString()
        return axios.get(`${API_BASE_URL}${API_URLS.GET_PURCHASE_ENTRIES_BY_DATE_RANGE}?${queryString}`)
      },
      enabled: !!(params?.startDate && params?.endDate),
      retry: false,
      refetchOnWindowFocus: false
    })
  }
} 