import { useQuery, useMutation } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const customerService = {
  getAllCustomers: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_CUSTOMERS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getOneCustomerDetails: (queryKey, id) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_CUSTOMER_BY_ID}${id}`)
      },
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  createCustomer: () => {
    return useMutation({
      mutationFn: (customerData) => {
        return axios.post(`${API_BASE_URL}${API_URLS.CREATE_CUSTOMER}`, customerData)
      }
    })
  },
  updateCustomer: () => {
    return useMutation({
      mutationFn: ({ id, customerData }) => {
        return axios.put(`${API_BASE_URL}${API_URLS.UPDATE_CUSTOMER}${id}`, customerData)
      }
    })
  },
  toggleCustomerStatus: () => {
    return useMutation({
      mutationFn: ({ id }) => {
        return axios.patch(`${API_BASE_URL}${API_URLS.TOGGLE_CUSTOMER_STATUS}${id}/toggle-status`)
      }
    })
  }
} 