"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import theme from "../theme"
import { OpenAPI } from "../client"

// Configure OpenAPI base URL
OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
OpenAPI.TOKEN = async () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token") || ""
  }
  return ""
}

// Add response interceptor to handle 401/403 errors
OpenAPI.interceptors.response.use((response) => {
  if (response.status === 401 || response.status === 403) {
    // Clear auth data and redirect to login
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      window.location.href = "/login"
    }
  }
  return response
})

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>{children}</ChakraProvider>
    </QueryClientProvider>
  )
}
