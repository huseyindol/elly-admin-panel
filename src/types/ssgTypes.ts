import React from 'react'

// SSG Example Types
export interface Todo {
  id: number
  todo: string
  completed: boolean
  userId: number
}

export interface TodosResponse {
  todos: Todo[]
  total: number
  skip: number
  limit: number
}

export interface Post {
  id: number
  title: string
  body: string
  tags: string[]
  reactions: {
    likes: number
    dislikes: number
  }
  views: number
  userId: number
}

export interface PostsResponse {
  posts: Post[]
  total: number
  skip: number
  limit: number
}

export interface Product {
  id: number
  title: string
  description: string
  price: number
  discountPercentage: number
  rating: number
  stock: number
  brand: string
  category: string
  thumbnail: string
  images: string[]
}

export interface ProductsResponse {
  products: Product[]
  total: number
  skip: number
  limit: number
}

// SSG Configuration Types
export interface SSGExampleData {
  slug: string
  title: string
  description: string
  content: React.JSX.Element
  techStack: string[]
  features: string[]
}

// Next.js SSG Types
export interface StaticParams {
  slug: string
}

export interface PageProps {
  params: Promise<StaticParams>
}

// ISR Configuration
export interface ISRConfig {
  revalidate: number | false
  tags?: string[]
}

// API Response Types
export interface APIError {
  error: string
  message: string
  status: number
}

// Cache Types
export type CacheStrategy = 'no-store' | 'force-cache' | 'default'

export interface FetchOptions {
  next?: {
    revalidate?: number | false
    tags?: string[]
  }
  cache?: CacheStrategy
}
