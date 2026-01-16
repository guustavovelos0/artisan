import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface LowStockContextType {
  hasLowStock: boolean
  lowStockCount: number
  refresh: () => Promise<void>
}

const LowStockContext = createContext<LowStockContextType | undefined>(undefined)

export function LowStockProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [hasLowStock, setHasLowStock] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)

  const fetchLowStock = async () => {
    if (!user) {
      setHasLowStock(false)
      setLowStockCount(0)
      return
    }

    try {
      const data = await api.get<{
        products: unknown[]
        materials: unknown[]
        hasLowStock: boolean
      }>('/dashboard/low-stock')
      setHasLowStock(data.hasLowStock)
      setLowStockCount(data.products.length + data.materials.length)
    } catch (err) {
      if (err instanceof ApiError) {
        console.error('Failed to fetch low stock data:', err.message)
      }
      setHasLowStock(false)
      setLowStockCount(0)
    }
  }

  useEffect(() => {
    fetchLowStock()
  }, [user])

  return (
    <LowStockContext.Provider value={{ hasLowStock, lowStockCount, refresh: fetchLowStock }}>
      {children}
    </LowStockContext.Provider>
  )
}

export function useLowStock() {
  const context = useContext(LowStockContext)
  if (context === undefined) {
    throw new Error('useLowStock must be used within a LowStockProvider')
  }
  return context
}
