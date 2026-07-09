import React, { createContext, useContext, useEffect, useState } from "react"
import { authApi } from "@/services/api"
import { TOKEN_KEY } from "@/lib/axios"
import type { UserResponse } from "@/types"

interface AuthContextValue {
  user: UserResponse | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<UserResponse>
  logout: () => Promise<void>
  setUser: React.Dispatch<React.SetStateAction<UserResponse | null>>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session on mount — token already in localStorage, axios attaches it
  useEffect(() => {
    authApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string): Promise<UserResponse> => {
    const res = await authApi.login(email, password)
    localStorage.setItem(TOKEN_KEY, res.data.access_token)
    const { access_token: _, ...userOnly } = res.data
    setUser(userOnly)
    return userOnly
  }

  const logout = async () => {
    await authApi.logout()
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
