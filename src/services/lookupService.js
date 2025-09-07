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
  getSubAreasLookup: (queryKey, areaId) => {
    return useQuery({
      queryKey: [queryKey, areaId],
      queryFn: () => {
        const url = areaId
          ? `${API_BASE_URL}${API_URLS.getSubAreasLookup}?areaId=${areaId}`
          : `${API_BASE_URL}${API_URLS.getSubAreasLookup}`
        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false,
      enabled: !!areaId
    })
  },
  getBrandsLookup: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.getBrandsLookup}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getGroupsLookup: (queryKey, brandId) => {
    return useQuery({
      queryKey: [queryKey, brandId],
      queryFn: () => {
        const url = brandId
          ? `${API_BASE_URL}${API_URLS.getGroupsLookup}?brandId=${brandId}`
          : `${API_BASE_URL}${API_URLS.getGroupsLookup}`
        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getSubGroupsLookup: (queryKey, groupId, brandId) => {
    return useQuery({
      queryKey: [queryKey, groupId, brandId],
      queryFn: () => {
        let url = `${API_BASE_URL}${API_URLS.getSubGroupsLookup}`
        const params = []

        if (groupId) params.push(`groupId=${groupId}`)
        if (brandId) params.push(`brandId=${brandId}`)

        if (params.length > 0) {
          url += `?${params.join('&')}`
        }

        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  }
}
