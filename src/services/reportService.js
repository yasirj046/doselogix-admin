import { useQuery } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'
import { API_BASE_URL, API_URLS } from '../contsants/api'

export const reportService = {
  // Customer Reports
  getCustomerReport: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: async () => {
        const queryString = new URLSearchParams(params).toString()
        const response = await axios.get(`${API_BASE_URL}${API_URLS.GET_CUSTOMER_REPORT}${queryString ? `?${queryString}` : ''}`)
        return response.data
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  getCustomerDetailedReport: (queryKey, customerId, params = {}) => {
    return useQuery({
      queryKey: [queryKey, customerId, params],
      queryFn: async () => {
        const queryString = new URLSearchParams(params).toString()
        const response = await axios.get(`${API_BASE_URL}${API_URLS.GET_CUSTOMER_DETAILED_REPORT}${customerId}${queryString ? `?${queryString}` : ''}`)
        return response.data
      },
      enabled: !!customerId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  getCustomerReportInvoice: (queryKey, invoiceId) => {
    return useQuery({
      queryKey: [queryKey, invoiceId],
      queryFn: async () => {
        const response = await axios.get(`${API_BASE_URL}${API_URLS.GET_CUSTOMER_REPORT_INVOICE}${invoiceId}`)
        return response.data
      },
      enabled: !!invoiceId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  exportCustomerReport: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await axios.get(`${API_BASE_URL}${API_URLS.EXPORT_CUSTOMER_REPORT}${queryString ? `?${queryString}` : ''}`)
    return response.data
  },

  // Brand Reports
  getBrandReport: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: async () => {
        const queryString = new URLSearchParams(params).toString()
        const response = await axios.get(`${API_BASE_URL}${API_URLS.GET_BRAND_REPORT}${queryString ? `?${queryString}` : ''}`)
        return response.data
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  getBrandDetailedReport: (queryKey, brandId, params = {}) => {
    return useQuery({
      queryKey: [queryKey, brandId, params],
      queryFn: async () => {
        const queryString = new URLSearchParams(params).toString()
        const response = await axios.get(`${API_BASE_URL}${API_URLS.GET_BRAND_DETAILED_REPORT}${brandId}${queryString ? `?${queryString}` : ''}`)
        return response.data
      },
      enabled: !!brandId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  getBrandReportInvoice: (queryKey, invoiceId) => {
    return useQuery({
      queryKey: [queryKey, invoiceId],
      queryFn: async () => {
        const response = await axios.get(`${API_BASE_URL}${API_URLS.GET_BRAND_REPORT_INVOICE}${invoiceId}`)
        return response.data
      },
      enabled: !!invoiceId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  exportBrandReport: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString()
      const response = await axios.get(
        `${API_BASE_URL}${API_URLS.EXPORT_BRAND_REPORT}${queryString ? `?${queryString}` : ''}`,
        { responseType: 'blob' }
      )

      // Create blob URL
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]))

      // If not for print, trigger download
      if (params.format !== 'print') {
        const link = document.createElement('a')
        link.href = blobUrl
        link.setAttribute('download', `brands-report.${params.format === 'pdf' ? 'pdf' : 'xlsx'}`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(blobUrl)
      }

      return { success: true, blobUrl }
    } catch (error) {
      console.error('Export error:', error)
      return { success: false, error: error.message }
    }
  },

  exportBrandDetailedReport: async (params = {}) => {
    try {
      const { brandId, ...otherParams } = params
      const queryString = new URLSearchParams(otherParams).toString()
      const response = await axios.get(
        `${API_BASE_URL}/reports/brands/${brandId}/export${queryString ? `?${queryString}` : ''}`,
        { responseType: 'blob' }
      )

      // Create blob URL
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]))

      // If not for print, trigger download
      if (params.format !== 'print') {
        const link = document.createElement('a')
        link.href = blobUrl
        link.setAttribute('download', `brand-detailed-report.${params.format === 'pdf' ? 'pdf' : 'xlsx'}`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(blobUrl)
      }

      return { success: true, blobUrl }
    } catch (error) {
      console.error('Export error:', error)
      return { success: false, error: error.message }
    }
  },

  // Product Reports
  getProductReport: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params],
      queryFn: async () => {
        const queryString = new URLSearchParams(params).toString()
        const response = await axios.get(`${API_BASE_URL}${API_URLS.GET_PRODUCT_REPORT}${queryString ? `?${queryString}` : ''}`)
        return response.data
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  getProductDetailedReport: (queryKey, productId, customerId, params = {}) => {
    return useQuery({
      queryKey: [queryKey, productId, customerId, params],
      queryFn: async () => {
        const queryString = new URLSearchParams(params).toString()
        const response = await axios.get(`${API_BASE_URL}${API_URLS.GET_PRODUCT_DETAILED_REPORT}${productId}/${customerId}${queryString ? `?${queryString}` : ''}`)
        return response.data
      },
      enabled: !!productId && !!customerId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  exportProductReport: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await axios.get(`${API_BASE_URL}${API_URLS.EXPORT_PRODUCT_REPORT}${queryString ? `?${queryString}` : ''}`)
    return response.data
  }
}
