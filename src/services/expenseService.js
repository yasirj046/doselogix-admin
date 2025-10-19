import { useQuery, useMutation } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'

import { API_BASE_URL, API_URLS } from '../contsants/api'

export const expenseService = {
  getAllExpenses: queryKey => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_EXPENSES}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  getOneExpenseDetails: (queryKey, id) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => {
        return axios.get(`${API_BASE_URL}${API_URLS.GET_EXPENSE_BY_ID}${id}`)
      },
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false
    })
  },
  createExpense: () => {
    return useMutation({
      mutationFn: (expenseData) => {
        return axios.post(`${API_BASE_URL}${API_URLS.CREATE_EXPENSE}`, expenseData)
      }
    })
  },
  updateExpense: () => {
    return useMutation({
      mutationFn: ({ id, data }) => {
        return axios.put(`${API_BASE_URL}${API_URLS.UPDATE_EXPENSE}${id}`, data)
      }
    })
  },
  toggleExpenseStatus: () => {
    return useMutation({
      mutationFn: (id) => {
        return axios.patch(`${API_BASE_URL}${API_URLS.TOGGLE_EXPENSE_STATUS}${id}/toggle-status`)
      }
    })
  }
}
