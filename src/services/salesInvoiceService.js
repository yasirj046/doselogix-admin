import { useQuery, useMutation } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const salesInvoiceService = {
  // Get all sales entries with pagination and filtering
  getAllSalesEntries: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_SALES_INVOICES}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get single sales invoice for editing
  getSalesInvoiceForEdit: (queryKey, id) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_SALES_INVOICE_BY_ID}${id}`)
      },
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Create new sales entry
  createSalesEntry: () => {
    return useMutation({
      mutationFn: salesEntryData => {
        return axios.post(`${API_BASE_URL}${API_URLS.CREATE_SALES_INVOICE}`, salesEntryData)
      }
    })
  },

  // Update existing sales entry
  updateSalesEntry: () => {
    return useMutation({
      mutationFn: ({ id, salesEntryData }) => {
        return axios.put(`${API_BASE_URL}${API_URLS.UPDATE_SALES_INVOICE}${id}`, salesEntryData)
      }
    })
  },

  // Toggle sales entry status (active/inactive)
  toggleSalesEntryStatus: () => {
    return useMutation({
      mutationFn: id => {
        return axios.patch(`${API_BASE_URL}${API_URLS.TOGGLE_SALES_INVOICE_STATUS}${id}`)
      }
    })
  },

  // Delete sales entry
  deleteSalesEntry: () => {
    return useMutation({
      mutationFn: id => {
        return axios.delete(`${API_BASE_URL}${API_URLS.DELETE_SALES_INVOICE}${id}`)
      }
    })
  },

  // Get sales statistics and analytics
  getSalesStatistics: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_SALES_STATISTICS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Add payment to credit (for existing sales invoices)
  addPaymentToCredit: () => {
    return useMutation({
      mutationFn: ({ salesInvoiceId, paymentData }) => {
        // Endpoint path expected: /sales-invoices/:id/add-payment
        return axios.post(`${API_BASE_URL}${API_URLS.ADD_SALES_PAYMENT}${salesInvoiceId}/add-payment`, paymentData)
      }
    })
  },

  // Remove payment from sales invoice
  removePaymentFromSalesInvoice: () => {
    return useMutation({
      mutationFn: ({ salesInvoiceId, paymentIndex }) => {
        // Endpoint path expected: /sales-invoices/:id/remove-payment/:paymentIndex
        return axios.delete(`${API_BASE_URL}${API_URLS.REMOVE_SALES_PAYMENT}${salesInvoiceId}/remove-payment/${paymentIndex}`)
      }
    })
  },

  // Get sales summary/reports
  getSalesSummary: (queryKey, filters) => {
    return useQuery({
      queryKey: [queryKey, filters],
      queryFn: () => {
        const params = new URLSearchParams(filters).toString()
        return axios.get(`${API_BASE_URL}${API_URLS.GET_SALES_SUMMARY}?${params}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get product sales analytics
  getProductSalesAnalytics: (queryKey, productId, dateRange) => {
    return useQuery({
      queryKey: [queryKey, productId, dateRange],
      queryFn: () => {
        const params = new URLSearchParams({ productId, ...dateRange }).toString()
        return axios.get(`${API_BASE_URL}${API_URLS.GET_PRODUCT_SALES_ANALYTICS}?${params}`)
      },
      enabled: !!productId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get low stock alerts based on sales velocity
  getLowStockAlerts: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_LOW_STOCK_ALERTS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get customer outstanding balance
  getCustomerBalance: (queryKey, customerId) => {
    return useQuery({
      queryKey: [queryKey, customerId],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_CUSTOMER_BALANCE}${customerId}`)
      },
      enabled: !!customerId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get available inventory for sales (FIFO sorted)
  getAvailableInventory: (queryKey, productId) => {
    return useQuery({
      queryKey: [queryKey, productId],
      queryFn: async () => {
        console.log('📡 Fetching inventory for product:', productId)
        const response = await axios.get(`${API_BASE_URL}${API_URLS.GET_AVAILABLE_INVENTORY}${productId}`)

        console.log('📦 Raw inventory response:', response.data)

        // Transform the inventory data for easier use in components
        if (response.data?.success) {
          const inventory = response.data.result || []
          console.log('📋 Inventory items count:', inventory.length)

          const transformedInventory = inventory.map(item => ({
            value: item._id || item.id,
            label: item.batchNumber,
            data: {
              ...item,
              batchNumber: item.batchNumber,
              currentQuantity: item.currentQuantity,
              expiryDate: item.expiryDate,
              salePrice: item.salePrice,
              minSalePrice: item.minSalePrice,
              price: item.price
            }
          }))

          console.log('✅ Transformed inventory:', transformedInventory)

          // Return the transformed data
          return {
            ...response.data,
            result: transformedInventory,
            originalResult: inventory
          }
        }

        console.log('❌ Inventory response not successful or missing data')
        return response.data
      },
      enabled: !!productId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get customer sales history
  getCustomerSalesHistory: (queryKey, customerId, filters) => {
    return useQuery({
      queryKey: [queryKey, customerId, filters],
      queryFn: () => {
        const params = new URLSearchParams(filters).toString()
        return axios.get(`${API_BASE_URL}${API_URLS.GET_CUSTOMER_SALES_HISTORY}${customerId}?${params}`)
      },
      enabled: !!customerId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get employee sales performance
  getEmployeeSalesPerformance: (queryKey, employeeId, dateRange) => {
    return useQuery({
      queryKey: [queryKey, employeeId, dateRange],
      queryFn: () => {
        const params = new URLSearchParams({ employeeId, ...dateRange }).toString()
        return axios.get(`${API_BASE_URL}${API_URLS.GET_EMPLOYEE_SALES_PERFORMANCE}?${params}`)
      },
      enabled: !!employeeId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get last invoice data by customer
  getLastInvoiceByCustomer: (queryKey, customerId) => {
    return useQuery({
      queryKey: [queryKey, customerId],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_LAST_INVOICE_BY_CUSTOMER}${customerId}`)
      },
      enabled: !!customerId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get last three prices for customer-product combination
  getLastThreePricesForCustomer: (queryKey, customerId, productId) => {
    return useQuery({
      queryKey: [queryKey, customerId, productId],
      queryFn: () => {
        const params = new URLSearchParams({ customerId, productId }).toString()
        return axios.get(`${API_BASE_URL}${API_URLS.GET_PRICE_HISTORY}?${params}`)
      },
      enabled: !!(customerId && productId),
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get next sales invoice number (preview only, not saved)
  getNextInvoiceNumber: (queryKey, date) => {
    return useQuery({
      queryKey: [queryKey, date],
      queryFn: async () => {
        const params = date ? new URLSearchParams({ date }).toString() : ''
        const url = params ? `${API_BASE_URL}${API_URLS.GET_NEXT_INVOICE_NUMBER}?${params}` : `${API_BASE_URL}${API_URLS.GET_NEXT_INVOICE_NUMBER}`
        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  }
}
