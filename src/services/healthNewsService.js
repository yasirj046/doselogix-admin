import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '../libs/axiosInstance'
import { API_BASE_URL } from '../contsants/api'

const HEALTH_NEWS_API = `${API_BASE_URL}/health-news`

export const healthNewsService = {
  // Get all health news with pagination
  getAllHealthNews: (queryKey, params = {}) => {
    return useQuery({
      queryKey: [queryKey, params.pageNumber || 1, params.pageSize || 20, params.source || null],
      queryFn: () => {
        const queryParams = new URLSearchParams()

        if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber)
        if (params.pageSize) queryParams.append('pageSize', params.pageSize)
        if (params.source) queryParams.append('source', params.source)

        const url = `${HEALTH_NEWS_API}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

        return axios.get(url)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Get latest health news (for dashboard)
  getLatestHealthNews: (queryKey, limit = 10) => {
    return useQuery({
      queryKey: [queryKey, limit],
      queryFn: () => {
        return axios.get(`${HEALTH_NEWS_API}/latest?limit=${limit}`)
      },
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000 // 10 minutes
    })
  },

  // Get health news by source
  getHealthNewsBySource: (queryKey, source, limit = 10) => {
    return useQuery({
      queryKey: [queryKey, source, limit],
      queryFn: () => {
        return axios.get(`${HEALTH_NEWS_API}/source/${source}?limit=${limit}`)
      },
      retry: false,
      refetchOnWindowFocus: false
    })
  },

  // Sync health news from Python server
  useSyncHealthNews: () => {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: () => {
        return axios.post(`${HEALTH_NEWS_API}/sync`)
      },
      onSuccess: () => {
        // Invalidate and refetch health news queries
        queryClient.invalidateQueries({ queryKey: ['healthNews'] })
        queryClient.invalidateQueries({ queryKey: ['latestHealthNews'] })
      }
    })
  },

  // Refresh health news (trigger Python scraper)
  useRefreshHealthNews: () => {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: () => {
        return axios.post(`${HEALTH_NEWS_API}/refresh`)
      },
      onSuccess: () => {
        // Invalidate and refetch health news queries
        queryClient.invalidateQueries({ queryKey: ['healthNews'] })
        queryClient.invalidateQueries({ queryKey: ['latestHealthNews'] })
      }
    })
  },

  // Delete old health news
  useDeleteOldHealthNews: () => {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: daysOld => {
        return axios.delete(`${HEALTH_NEWS_API}/cleanup?daysOld=${daysOld}`)
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['healthNews'] })
      }
    })
  }
}

export default healthNewsService
