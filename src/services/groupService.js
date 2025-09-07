import { useQuery, useMutation } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const groupService = {
  getAllGroups: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_GROUPS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getOneGroupDetails: (queryKey, id) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_GROUP_BY_ID}${id}`)
      },
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  createGroup: () => {
    return useMutation({
      mutationFn: (groupData) => {
        return axios.post(`${API_BASE_URL}${API_URLS.CREATE_GROUP}`, groupData)
      }
    })
  },
  updateGroup: () => {
    return useMutation({
      mutationFn: ({ id, groupData }) => {
        return axios.put(`${API_BASE_URL}${API_URLS.UPDATE_GROUP}${id}`, groupData)
      }
    })
  },
  toggleGroupStatus: () => {
    return useMutation({
      mutationFn: ({ id }) => {
        return axios.patch(`${API_BASE_URL}${API_URLS.TOGGLE_GROUP_STATUS}${id}/toggle-status`)
      }
    })
  },
  getMyGroups: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_MY_GROUPS}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getGroupsByBrand: (queryKey, brandId) => {
    return useQuery({
      queryKey: [queryKey, brandId],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_GROUPS_BY_BRAND}${brandId}`)
      },
      enabled: !!brandId,
      retry: false,
      refetchOnWindowFocus: false
    })
  }
}
