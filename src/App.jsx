import React from 'react'
import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'

// Create query client instance outside component to prevent recreation on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Pages />
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
