import { useQuery, useMutation } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const areaService = {
  getAllAreas: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_AREAS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getOneAreaDetails: (queryKey, id) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_AREA_BY_ID}${id}`)
      },
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  createArea: () => {
    return useMutation({
      mutationFn: (areaData) => {
        return axios.post(`${API_BASE_URL}${API_URLS.CREATE_AREA}`, areaData)
      }
    })
  },
  updateArea: () => {
    return useMutation({
      mutationFn: ({ id, areaData }) => {
        return axios.put(`${API_BASE_URL}${API_URLS.UPDATE_AREA}${id}`, areaData)
      }
    })
  },
  toggleAreaStatus: () => {
    return useMutation({
      mutationFn: ({ id }) => {
        return axios.patch(`${API_BASE_URL}${API_URLS.TOGGLE_AREA_STATUS}${id}/toggle-status`)
      }
    })
  }
}
