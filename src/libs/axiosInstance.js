import { API_BASE_URL } from '@/contsants/api'
import axios from 'axios'
import { getSession } from 'next-auth/react'

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL
})

axiosInstance.interceptors.request.use(
  async config => {
    const session = await getSession()

    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Add response interceptor for consistent error handling
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    let errorMessage = 'An unexpected error occurred'
    
    if (error.response) {
      // Server responded with error
      errorMessage = error.response.data?.message || error.response.data?.error || 'Server error'
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'No response from server. Please check your connection.'
    } else {
      // Request setup error
      errorMessage = error.message || 'Error preparing request'
    }

    return Promise.reject({
      ...error,
      message: errorMessage
    })
  }
)

export default axiosInstance 