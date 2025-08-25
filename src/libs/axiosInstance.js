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

export default axiosInstance 