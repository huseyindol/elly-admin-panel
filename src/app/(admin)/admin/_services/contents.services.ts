import {
  ContentInput,
  ContentListResponse,
  ContentPagedResponse,
  ContentResponse,
} from '@/types/content'
import { fetcher } from '@/utils/services/fetcher'

// GET - Section'a göre içerikleri getir
export const getContentsBySectionService = async <T = Record<string, unknown>>(
  sectionKey: string,
) => {
  try {
    const response: ContentListResponse<T> = await fetcher(
      `/api/v1/contents/section/${sectionKey}`,
      {
        method: 'GET',
      },
    )
    console.log(`Get contents for section ${sectionKey}:`, response)
    if (!response.result) {
      throw new Error(`Error getting contents for section ${sectionKey}`)
    }
    return response
  } catch (error) {
    console.error(`Error getting contents for section ${sectionKey}:`, error)
    throw error
  }
}

// GET - Tekil içerik getir (UUID ile)
export const getContentByIdService = async <T = Record<string, unknown>>(
  id: string,
) => {
  try {
    const response: ContentResponse<T> = await fetcher(
      `/api/v1/contents/${id}`,
      {
        method: 'GET',
      },
    )
    console.log('Get content by ID:', response)
    if (!response.result) {
      throw new Error('Error getting content')
    }
    return response
  } catch (error) {
    console.error('Error getting content:', error)
    throw error
  }
}

// GET - Tüm içerikleri listele
export const getContentsListService = async <T = Record<string, unknown>>() => {
  try {
    const response: ContentListResponse<T> = await fetcher(
      '/api/v1/contents/list',
      {
        method: 'GET',
      },
    )
    console.log('Get all contents:', response)
    if (!response.result) {
      throw new Error('Error getting contents list')
    }
    return response
  } catch (error) {
    console.error('Error getting contents list:', error)
    throw error
  }
}

// GET - Sayfalı içerik listesi
export const getContentsPagedService = async <T = Record<string, unknown>>(
  page = 0,
  size = 10,
  sort = 'sortOrder,asc',
) => {
  try {
    const response: ContentPagedResponse<T> = await fetcher(
      `/api/v1/contents/list/paged?page=${page}&size=${size}&sort=${sort}`,
      {
        method: 'GET',
      },
    )
    console.log('Get paged contents:', response)
    if (!response.result) {
      throw new Error('Error getting paged contents')
    }
    return response
  } catch (error) {
    console.error('Error getting paged contents:', error)
    throw error
  }
}

// POST - İçerik oluştur
export const createContentService = async (data: ContentInput) => {
  try {
    const response: ContentResponse = await fetcher('/api/v1/contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    console.log('Creating content:', response)
    if (!response.result) {
      throw new Error('Error creating content')
    }
    return response
  } catch (error) {
    console.error('Error creating content:', error)
    throw error
  }
}

// PUT - İçerik güncelle
export const updateContentService = async (id: string, data: ContentInput) => {
  try {
    const response: ContentResponse = await fetcher(`/api/v1/contents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    console.log('Updating content:', response)
    if (!response.result) {
      throw new Error('Error updating content')
    }
    return response
  } catch (error) {
    console.error('Error updating content:', error)
    throw error
  }
}

// DELETE - İçerik sil
export const deleteContentService = async (id: string) => {
  try {
    const response: { result: boolean } = await fetcher(
      `/api/v1/contents/${id}`,
      {
        method: 'DELETE',
      },
    )
    console.log('Deleting content:', response)
    if (!response.result) {
      throw new Error('Error deleting content')
    }
    return response
  } catch (error) {
    console.error('Error deleting content:', error)
    throw error
  }
}
