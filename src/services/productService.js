import { useQuery, useMutation } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const productService = {
  getAllProducts: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_PRODUCTS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getOneProductDetails: (queryKey, id) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_PRODUCT_BY_ID}${id}`)
      },
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getMyProducts: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_MY_PRODUCTS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getProductStats: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_PRODUCT_STATS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getProductsByBrand: (queryKey, brandId) => {
    return useQuery({
      queryKey: [queryKey, brandId],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_PRODUCTS_BY_BRAND}${brandId}`)
      },
      enabled: !!brandId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getProductsByGroup: (queryKey, groupId) => {
    return useQuery({
      queryKey: [queryKey, groupId],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_PRODUCTS_BY_GROUP}${groupId}`)
      },
      enabled: !!groupId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getProductsBySubGroup: (queryKey, subGroupId) => {
    return useQuery({
      queryKey: [queryKey, subGroupId],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_PRODUCTS_BY_SUBGROUP}${subGroupId}`)
      },
      enabled: !!subGroupId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  createProduct: () => {
    return useMutation({
      mutationFn: (productData) => {
        return axios.post(`${API_BASE_URL}${API_URLS.CREATE_PRODUCT}`, productData)
      }
    })
  },
  updateProduct: () => {
    return useMutation({
      mutationFn: ({ id, data }) => {
        return axios.put(`${API_BASE_URL}${API_URLS.UPDATE_PRODUCT}${id}`, data)
      }
    })
  },
  toggleProductStatus: () => {
    return useMutation({
      mutationFn: (id) => {
        return axios.patch(`${API_BASE_URL}${API_URLS.TOGGLE_PRODUCT_STATUS}${id}/toggle-status`)
      }
    })
  },
  deleteProduct: () => {
    return useMutation({
      mutationFn: (id) => {
        return axios.delete(`${API_BASE_URL}${API_URLS.DELETE_PRODUCT}${id}`)
      }
    })
  }
}
