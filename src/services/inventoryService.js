import { useQuery, useMutation } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const inventoryService = {
  // Get grouped inventory (main view)
  getGroupedInventory: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_GROUPED_INVENTORY}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get batch details by product ID (for modal)
  getBatchDetailsByProduct: (queryKey, productId) => {
    return useQuery({
      queryKey: [queryKey, productId],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_BATCH_DETAILS_BY_PRODUCT}${productId}`)
      },
      enabled: !!productId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get inventory summary/stats
  getInventorySummary: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_INVENTORY_SUMMARY}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get inventory value
  getInventoryValue: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_INVENTORY_VALUE}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get low stock items
  getLowStockItems: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_LOW_STOCK_ITEMS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get out of stock items
  getOutOfStockItems: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_OUT_OF_STOCK_ITEMS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get expiring products
  getExpiringProducts: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_EXPIRING_PRODUCTS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get expired products
  getExpiredProducts: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_EXPIRED_PRODUCTS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  }
}
