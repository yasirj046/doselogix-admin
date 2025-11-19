import { useQuery } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const dashboardService = {
  // Get summary cards data
  getSummaryCards: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_DASHBOARD_SUMMARY_CARDS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get brand-wise sales data
  getBrandWiseSales: (queryKey, params = {}) => {
    return useQuery({
      // Use primitive queryKey entries for reliable cache keys
      queryKey: [queryKey, params.startDate || null, params.endDate || null, params.limit || null],
      queryFn: () => {
        const queryParams = new URLSearchParams()

        if (params.startDate) queryParams.append('startDate', params.startDate)
        if (params.endDate) queryParams.append('endDate', params.endDate)
        if (params.limit) queryParams.append('limit', params.limit)

        const url = `${API_BASE_URL}${API_URLS.GET_DASHBOARD_BRAND_SALES}${
          queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`

        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get top selling products
  getTopProducts: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params.startDate || null, params.endDate || null, params.limit || null],
      queryFn: () => {
        const queryParams = new URLSearchParams()

        if (params.startDate) queryParams.append('startDate', params.startDate)
        if (params.endDate) queryParams.append('endDate', params.endDate)
        if (params.limit) queryParams.append('limit', params.limit)

        const url = `${API_BASE_URL}${API_URLS.GET_DASHBOARD_TOP_PRODUCTS}${
          queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`

        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get receivables aging
  getReceivablesAging: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_DASHBOARD_RECEIVABLES_AGING}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get stock alerts
  getStockAlerts: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: () => {
        const queryParams = new URLSearchParams()

        if (params.limit) queryParams.append('limit', params.limit)

        const url = `${API_BASE_URL}${API_URLS.GET_DASHBOARD_STOCK_ALERTS}${
          queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`

        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get near expiry products
  getNearExpiryProducts: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: () => {
        const queryParams = new URLSearchParams()

        if (params.limit) queryParams.append('limit', params.limit)

        const url = `${API_BASE_URL}${API_URLS.GET_DASHBOARD_NEAR_EXPIRY}${
          queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`

        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get area-wise sales
  getAreaWiseSales: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params.startDate || null, params.endDate || null, params.limit || null],
      queryFn: () => {
        const queryParams = new URLSearchParams()

        if (params.startDate) queryParams.append('startDate', params.startDate)
        if (params.endDate) queryParams.append('endDate', params.endDate)
        if (params.limit) queryParams.append('limit', params.limit)

        const url = `${API_BASE_URL}${API_URLS.GET_DASHBOARD_AREA_SALES}${
          queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`

        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get invoice breakdown (Cash vs Credit)
  getInvoiceBreakdown: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params.startDate || null, params.endDate || null],
      queryFn: () => {
        const queryParams = new URLSearchParams()

        if (params.startDate) queryParams.append('startDate', params.startDate)
        if (params.endDate) queryParams.append('endDate', params.endDate)

        const url = `${API_BASE_URL}${API_URLS.GET_DASHBOARD_INVOICE_BREAKDOWN}${
          queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`

        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get complete dashboard data (all widgets in one call)
  getCompleteDashboard: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params.startDate || null, params.endDate || null],
      queryFn: () => {
        const queryParams = new URLSearchParams()

        if (params.startDate) queryParams.append('startDate', params.startDate)
        if (params.endDate) queryParams.append('endDate', params.endDate)

        const url = `${API_BASE_URL}${API_URLS.GET_DASHBOARD_COMPLETE}${
          queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`

        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get sales prediction for a product
  getSalesPrediction: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params.productId || null],
      queryFn: () => {
        const queryParams = new URLSearchParams()

        if (params.productId) queryParams.append('productId', params.productId)

        const url = `${API_BASE_URL}${API_URLS.GET_DASHBOARD_SALES_PREDICTION}${
          queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`

        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false,
      enabled: !!params.productId // Only fetch when productId is provided
    })
  },

  // Get list of products with sales history
  getProductsWithSales: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_DASHBOARD_PRODUCTS_WITH_SALES}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  }
}
