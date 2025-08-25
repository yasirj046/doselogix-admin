import { useQuery } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const lookupService = {
  getAllProvinces: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.getAllProvinces}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getCitiesByProvince: (queryKey, province) => {
    return useQuery({
      queryKey: [queryKey, province],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.getCitiesByProvince}?provinceName=${province}`)
      },
      retry: false,
      refetchOnWindowFocus: false,
      enabled: !!province
    })
  },
  getAllCategories: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.getAllCategories}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  }
}
