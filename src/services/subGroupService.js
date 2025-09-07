import { useQuery, useMutation } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const subGroupService = {
  getAllSubGroups: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_SUB_GROUPS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getOneSubGroupDetails: (queryKey, id) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_SUB_GROUP_BY_ID}${id}`)
      },
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  createSubGroup: () => {
    return useMutation({
      mutationFn: (subGroupData) => {
        return axios.post(`${API_BASE_URL}${API_URLS.CREATE_SUB_GROUP}`, subGroupData)
      }
    })
  },
  updateSubGroup: () => {
    return useMutation({
      mutationFn: ({ id, subGroupData }) => {
        return axios.put(`${API_BASE_URL}${API_URLS.UPDATE_SUB_GROUP}${id}`, subGroupData)
      }
    })
  },
  toggleSubGroupStatus: () => {
    return useMutation({
      mutationFn: ({ id }) => {
        return axios.patch(`${API_BASE_URL}${API_URLS.TOGGLE_SUB_GROUP_STATUS}${id}/toggle-status`)
      }
    })
  },
  getMySubGroups: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_MY_SUB_GROUPS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  }
}
