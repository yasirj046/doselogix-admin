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
  },
  getAllDesignations: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.getAllDesignations}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getAllCities: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.getAllCities}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getAreasLookup: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.getAreasLookup}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getSubAreasLookup: (queryKey, area) => {
    return useQuery({
      queryKey: [queryKey, area],
      queryFn: () => {
        const url = area
          ? `${API_BASE_URL}${API_URLS.getSubAreasLookup}?area=${area}`
          : `${API_BASE_URL}${API_URLS.getSubAreasLookup}`
        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  }
}
