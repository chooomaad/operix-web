import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 15_000, // 15 s — fail fast rather than hang indefinitely
  headers: {
    'Accept': 'application/json',
  },
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('operix_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Let Axios set Content-Type automatically (multipart for FormData, json otherwise)
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('operix_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
