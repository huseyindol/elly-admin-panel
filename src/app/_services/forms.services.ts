import { CreateFormInput, UpdateFormInput } from '@/schemas/form.schema'
import {
  BaseResponse,
  FormSchemaListResponseType,
  FormSchemaResponseType,
  FormSubmissionListResponseType,
  FormSubmissionResponseType,
} from '@/types/BaseResponse'
import { fetcher } from '@/utils/services/fetcher'

// ============================================
// Form Definition Services
// ============================================

// GET - Tüm formları listele
export const getFormsService = async () => {
  try {
    const response: FormSchemaListResponseType = await fetcher(
      '/api/v1/forms/list',
      {
        method: 'GET',
      },
    )
    console.log('Get forms:', response)
    if (!response.result) {
      throw new Error('Error get forms', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get forms:', error)
    throw error
  }
}

// GET - Form özet listesi (Component atamaları için)
export const getFormsSummaryService = async () => {
  try {
    const response: FormSchemaListResponseType = await fetcher(
      '/api/v1/forms/list',
      {
        method: 'GET',
      },
    )
    if (!response.result) {
      throw new Error('Error get forms summary', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get forms summary:', error)
    throw error
  }
}

// GET - Aktif formları listele
export const getActiveFormsService = async () => {
  try {
    const response: FormSchemaListResponseType = await fetcher(
      '/api/v1/forms/list/active',
      {
        method: 'GET',
      },
    )
    if (!response.result) {
      throw new Error('Error get active forms', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get active forms:', error)
    throw error
  }
}

// GET - Tek form getir (ID ile)
export const getFormByIdService = async (id: string) => {
  try {
    const response: FormSchemaResponseType = await fetcher(
      `/api/v1/forms/${id}`,
      {
        method: 'GET',
      },
    )
    if (!response.result) {
      throw new Error('Error get form', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get form:', error)
    throw error
  }
}

// POST - Yeni form oluştur
export const createFormService = async (data: CreateFormInput) => {
  try {
    const response: FormSchemaResponseType = await fetcher('/api/v1/forms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    console.log('Creating form:', response)
    if (!response.result) {
      throw new Error('Error creating form', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error creating form:', error)
    throw error
  }
}

// PUT - Form güncelle
export const updateFormService = async (id: string, data: UpdateFormInput) => {
  try {
    const response: FormSchemaResponseType = await fetcher(
      `/api/v1/forms/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    )
    console.log('Updating form:', response)
    if (!response.result) {
      throw new Error('Error updating form', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error updating form:', error)
    throw error
  }
}

// DELETE - Form sil
export const deleteFormService = async (id: string) => {
  try {
    const response: BaseResponse<null> = await fetcher(`/api/v1/forms/${id}`, {
      method: 'DELETE',
    })
    console.log('Deleting form:', response)
    if (!response.result) {
      throw new Error('Error deleting form', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error deleting form:', error)
    throw error
  }
}

// ============================================
// Form Submission Services
// ============================================

// POST - Form submit et
export const submitFormService = async (
  formId: string,
  data: Record<string, unknown>,
) => {
  try {
    const response: FormSubmissionResponseType = await fetcher(
      `/api/v1/forms/${formId}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payload: data }),
      },
    )
    console.log('Submitting form:', response)
    if (!response.result) {
      throw new Error('Error submitting form', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error submitting form:', error)
    throw error
  }
}

// GET - Form submissions listele
export const getFormSubmissionsService = async (formId: string) => {
  try {
    const response: FormSubmissionListResponseType = await fetcher(
      `/api/v1/forms/${formId}/submissions`,
      {
        method: 'GET',
      },
    )
    if (!response.result) {
      throw new Error('Error get form submissions', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get form submissions:', error)
    throw error
  }
}

// GET - Form submissions sayfalı listele
export const getFormSubmissionsPagedService = async (
  formId: string,
  page = 0,
  size = 10,
  sort = 'submittedAt,desc',
) => {
  try {
    const response: BaseResponse<{
      content: import('@/types/form').FormSubmission[]
      page: number
      size: number
      totalElements: number
      totalPages: number
      first: boolean
      last: boolean
    }> = await fetcher(
      `/api/v1/forms/${formId}/submissions/paged?page=${page}&size=${size}&sort=${sort}`,
      {
        method: 'GET',
      },
    )
    if (!response.result) {
      throw new Error('Error get paged submissions', {
        cause: response.message,
      })
    }
    return response
  } catch (error) {
    console.error('Error get paged submissions:', error)
    throw error
  }
}

// GET - Tek submission getir
export const getFormSubmissionByIdService = async (submissionId: string) => {
  try {
    const response: FormSubmissionResponseType = await fetcher(
      `/api/v1/forms/submissions/${submissionId}`,
      {
        method: 'GET',
      },
    )
    if (!response.result) {
      throw new Error('Error get form submission', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get form submission:', error)
    throw error
  }
}

// GET - Submission sayısı
export const getFormSubmissionCountService = async (formId: string) => {
  try {
    const response: BaseResponse<number> = await fetcher(
      `/api/v1/forms/${formId}/submissions/count`,
      {
        method: 'GET',
      },
    )
    if (!response.result) {
      throw new Error('Error get submission count', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get submission count:', error)
    throw error
  }
}
