import { CreatePostInput, UpdatePostInput } from '@/schemas/post.schema'
import {
  BaseResponse,
  PostListResponseType,
  PostResponseType,
  PostSummaryListResponseType,
} from '@/types/BaseResponse'
import { fetcher } from '@/utils/services/fetcher'

// GET - Tüm postları listele
export const getPostService = async () => {
  try {
    const response: PostListResponseType = await fetcher('/api/v1/posts/list', {
      method: 'GET',
    })
    console.log('Get posts:', response)
    if (!response.result) {
      throw new Error('Error get posts', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get posts:', error)
    throw error
  }
}

// GET - Tek post getir (ID ile)
export const getPostByIdService = async (id: string) => {
  try {
    const response: PostResponseType = await fetcher(`/api/v1/posts/${id}`, {
      method: 'GET',
    })
    console.log('Get post by ID:', response)
    if (!response.result) {
      throw new Error('Error get post', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get post:', error)
    throw error
  }
}

// POST - Yeni post oluştur
export const createPostService = async (data: CreatePostInput) => {
  try {
    const response: PostResponseType = await fetcher('/api/v1/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    console.log('Creating post:', response)
    if (!response.result) {
      throw new Error('Error creating post', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error creating post:', error)
    throw error
  }
}

// PUT - Post güncelle
export const updatePostService = async (id: string, data: UpdatePostInput) => {
  try {
    const response: PostResponseType = await fetcher(`/api/v1/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    console.log('Updating post:', response)
    if (!response.result) {
      throw new Error('Error updating post', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error updating post:', error)
    throw error
  }
}

// DELETE - Post sil
export const deletePostService = async (id: string) => {
  try {
    const response: BaseResponse<null> = await fetcher(`/api/v1/posts/${id}`, {
      method: 'DELETE',
    })
    console.log('Deleting post:', response)
    if (!response.result) {
      throw new Error('Error deleting post', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error deleting post:', error)
    throw error
  }
}

// GET - Post özet listesi (Widget atamaları için)
export const getPostsSummaryService = async () => {
  try {
    const response: PostSummaryListResponseType = await fetcher(
      '/api/v1/posts/list/summary',
      {
        method: 'GET',
      },
    )
    console.log('Get posts summary:', response)
    if (!response.result) {
      throw new Error('Error get posts summary', {
        cause: response.message,
      })
    }
    return response
  } catch (error) {
    console.error('Error get posts summary:', error)
    throw error
  }
}
