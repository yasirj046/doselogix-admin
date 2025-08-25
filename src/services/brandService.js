import { useQuery, useMutation } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const brandService = {
  getAllBrands: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_BRANDS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getOneBrandDetails: (queryKey, id) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_BRAND_BY_ID}${id}`)
      },
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  createBrand: () => {
    return useMutation({
      mutationFn: (brandData) => {
        return axios.post(`${API_BASE_URL}${API_URLS.CREATE_BRAND}`, brandData)
      }
    })
  },
  updateBrand: () => {
    return useMutation({
      mutationFn: ({ id, data }) => {
        return axios.put(`${API_BASE_URL}${API_URLS.UPDATE_BRAND}${id}`, data)
      }
    })
  },
  toggleBrandStatus: () => {
    return useMutation({
      mutationFn: (id) => {
        return axios.patch(`${API_BASE_URL}${API_URLS.TOGGLE_BRAND_STATUS}${id}/toggle-status`)
      }
    })
  }
} 