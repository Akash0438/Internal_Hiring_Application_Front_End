import axios from "axios"

export const TOKEN_KEY = "access_token"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
})

// Attach Bearer token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear token and redirect to /login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes("/login")) {
        localStorage.removeItem(TOKEN_KEY)
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default api
