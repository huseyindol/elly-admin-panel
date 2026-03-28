// Dashboard Types
import React from 'react'

export interface StatData {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: () => React.ReactNode
  gradient: string
}

export interface Order {
  id: string
  customer: string
  product: string
  amount: string
  status: 'Tamamlandı' | 'Beklemede' | 'İptal' | 'Kargoda'
  avatar: string
}

export interface Product {
  name: string
  sales: number
  revenue: string
  percentage: number
}

export interface Activity {
  action: string
  user: string
  time: string
  type: 'order' | 'payment' | 'warning' | 'user' | 'shipping'
}

// MenuItem is now internal to Sidebar component
