import { CreateComponentInput, UpdateComponentInput } from '@/schemas/component'
import {
  BaseResponse,
  ComponentListResponseType,
  ComponentResponseType,
  ComponentSummaryListResponseType,
} from '@/types/BaseResponse'
import { fetcher } from '@/utils/services/fetcher'

// GET - Tüm componentleri listele
export const getComponentService = async () => {
  try {
    const response: ComponentListResponseType = await fetcher(
      '/api/v1/components/list',
      {
        method: 'GET',
      },
    )
    console.log('Get components:', response)
    if (!response.result) {
      throw new Error('Error get components', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get components:', error)
    throw error
  }
}

// GET - Tek component getir (ID ile)
export const getComponentByIdService = async (id: string) => {
  try {
    const response: ComponentResponseType = await fetcher(
      `/api/v1/components/${id}`,
      {
        method: 'GET',
      },
    )
    console.log('Get component by ID:', response)
    if (!response.result) {
      throw new Error('Error get component', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get component:', error)
    throw error
  }
}

// POST - Yeni component oluştur
export const createComponentService = async (data: CreateComponentInput) => {
  try {
    const response: ComponentResponseType = await fetcher(
      '/api/v1/components',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    )
    console.log('Creating component:', response)
    if (!response.result) {
      throw new Error('Error creating component', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error creating component:', error)
    throw error
  }
}

// PUT - Component güncelle
export const updateComponentService = async (
  id: string,
  data: UpdateComponentInput,
) => {
  try {
    const response: ComponentResponseType = await fetcher(
      `/api/v1/components/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    )
    console.log('Updating component:', response)
    if (!response.result) {
      throw new Error(response.message || 'Error updating component', {
        cause: response.errorCode,
      })
    }
    return response
  } catch (error) {
    console.error('Error updating component:', error)
    throw error
  }
}

// DELETE - Component sil
export const deleteComponentService = async (id: string) => {
  try {
    const response: BaseResponse<null> = await fetcher(
      `/api/v1/components/${id}`,
      {
        method: 'DELETE',
      },
    )
    console.log('Deleting component:', response)
    if (!response.result) {
      throw new Error(response.message || 'Error deleting component', {
        cause: response.errorCode,
      })
    }
    return response
  } catch (error) {
    console.error('Error deleting component:', error)
    throw error
  }
}
// GET - Component özet listesi (Sayfa atamaları için)
export const getComponentsSummaryService = async () => {
  try {
    const response: ComponentSummaryListResponseType = await fetcher(
      '/api/v1/components/list/summary',
      {
        method: 'GET',
      },
    )
    console.log('Get components summary:', response)
    if (!response.result) {
      throw new Error('Error get components summary', {
        cause: response.message,
      })
    }
    return response
  } catch (error) {
    console.error('Error get components summary:', error)
    throw error
  }
}
