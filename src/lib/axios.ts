import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: true, // required for httpOnly cookie auth
  headers: { "Content-Type": "application/json" },
})

// On 401, redirect to /login (session expired or not authenticated)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Avoid redirect loop on the login page itself
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default api
