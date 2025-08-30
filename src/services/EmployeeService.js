import { useQuery, useMutation } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const employeeService = {
  getAllemployees: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_EMPLOYEES}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getOneEmployeeDetails: (queryKey, id) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_EMPLOYEE_BY_ID}${id}`)
      },
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  createEmployee: () => {
    return useMutation({
      mutationFn: (employeeData) => {
        return axios.post(`${API_BASE_URL}${API_URLS.CREATE_EMPLOYEE}`, employeeData)
      }
    })
  },
  updateEmployee: () => {
    return useMutation({
      mutationFn: ({ id, employeeData }) => {
        return axios.put(`${API_BASE_URL}${API_URLS.UPDATE_EMPLOYEE}${id}`, employeeData)
      }
    })
  },
  toggleEmployeeStatus: () => {
    return useMutation({
      mutationFn: ({ id }) => {
        return axios.patch(`${API_BASE_URL}${API_URLS.TOGGLE_EMPLOYEE_STATUS}${id}/toggle-status`)
      }
    })
  }
}
