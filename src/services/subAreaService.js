import { useQuery, useMutation } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const subAreaService = {
  getAllSubAreas: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_SUB_AREAS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getOneSubAreaDetails: (queryKey, id) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_SUB_AREA_BY_ID}${id}`)
      },
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  createSubArea: () => {
    return useMutation({
      mutationFn: (subAreaData) => {
        return axios.post(`${API_BASE_URL}${API_URLS.CREATE_SUB_AREA}`, subAreaData)
      }
    })
  },
  updateSubArea: () => {
    return useMutation({
      mutationFn: ({ id, subAreaData }) => {
        return axios.put(`${API_BASE_URL}${API_URLS.UPDATE_SUB_AREA}${id}`, subAreaData)
      }
    })
  },
  toggleSubAreaStatus: () => {
    return useMutation({
      mutationFn: ({ id }) => {
        return axios.patch(`${API_BASE_URL}${API_URLS.TOGGLE_SUB_AREA_STATUS}${id}/toggle-status`)
      }
    })
  },
  getMySubAreas: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_MY_SUB_AREAS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getSubAreasByVendor: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_SUB_AREAS_BY_VENDOR}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getSubAreasByArea: (queryKey, areaId) => {
    return useQuery({
      queryKey: [queryKey, areaId],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_SUB_AREAS_BY_AREA}${areaId}`)
      },
      enabled: !!areaId,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getSubAreasByName: (queryKey, subAreaName) => {
    return useQuery({
      queryKey: [queryKey, subAreaName],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_SUB_AREAS_BY_NAME}${subAreaName}`)
      },
      enabled: !!subAreaName,
      retry: false,
      refetchOnWindowFocus: false
    })
  }
}
