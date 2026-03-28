import { CreatePageInput, UpdatePageInput } from '@/schemas/page'
import {
  BaseResponse,
  PageListResponseType,
  PageResponseType,
} from '@/types/BaseResponse'
import { fetcher } from '@/utils/services/fetcher'

// GET - Tüm sayfaları listele
export const getPageService = async () => {
  try {
    const response: PageListResponseType = await fetcher('/api/v1/pages/list', {
      method: 'GET',
    })
    console.log('Get pages:', response)
    if (!response.result) {
      throw new Error('Error get pages', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get pages:', error)
    throw error
  }
}

// GET - Tek sayfa getir (slug ile)
export const getPageBySlugService = async (slug: string) => {
  try {
    const response: PageResponseType = await fetcher(`/api/v1/pages/${slug}`, {
      method: 'GET',
    })
    if (!response.result) {
      throw new Error('Error get page', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get page:', error)
    throw error
  }
}

// POST - Yeni sayfa oluştur
export const createPageService = async (data: CreatePageInput) => {
  try {
    const response: PageResponseType = await fetcher('/api/v1/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    console.log('Creating page:', response)
    if (!response.result) {
      throw new Error('Error creating page', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error creating page:', error)
    throw error
  }
}

// PUT - Sayfa güncelle
export const updatePageService = async (id: string, data: UpdatePageInput) => {
  try {
    const response: PageResponseType = await fetcher(`/api/v1/pages/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    console.log('Updating page:', response)
    if (!response.result) {
      throw new Error('Error updating page', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error updating page:', error)
    throw error
  }
}

// DELETE - Sayfa sil
export const deletePageService = async (id: string) => {
  try {
    const response: BaseResponse<null> = await fetcher(`/api/v1/pages/${id}`, {
      method: 'DELETE',
    })
    console.log('Deleting page:', response)
    if (!response.result) {
      throw new Error('Error deleting page', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error deleting page:', error)
    throw error
  }
}
