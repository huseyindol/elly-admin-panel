import { BaseResponse } from '@/types/BaseResponse'
import { fetcher } from '@/utils/services/fetcher'

export interface AssetResponse {
  id: number
  path: string
  type: string
  name: string
  extension: string
  subFolder: string
}

export type AssetResponseType = BaseResponse<AssetResponse>
export type MultiAssetResponseType = BaseResponse<AssetResponse[]>

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}
export type AssetPagedResponseType = BaseResponse<PagedResponse<AssetResponse>>

// GET - Sayfalı asset listesi
export const getAssetsPagedService = async (
  page = 0,
  size = 10,
  sort = 'id,asc',
) => {
  try {
    const response: AssetPagedResponseType = await fetcher(
      `/api/v1/assets/list/paged?page=${page}&size=${size}&sort=${sort}`,
      {
        method: 'GET',
      },
    )
    console.log('Get assets paged:', response)
    if (!response.result) {
      throw new Error('Error get assets paged', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get assets paged:', error)
    throw error
  }
}

// GET - İsme göre sayfalı asset ara
export const searchAssetsByNamePagedService = async (
  name: string,
  page = 0,
  size = 10,
  sort = 'id,asc',
) => {
  try {
    const response: AssetPagedResponseType = await fetcher(
      `/api/v1/assets/${encodeURIComponent(name)}/paged?page=${page}&size=${size}&sort=${sort}`,
      {
        method: 'GET',
      },
    )
    console.log('Search assets by name paged:', response)
    if (!response.result) {
      throw new Error('Error search assets by name', {
        cause: response.message,
      })
    }
    return response
  } catch (error) {
    console.error('Error search assets by name paged:', error)
    throw error
  }
}

// GET - SubFolder ve isme göre sayfalı asset ara
export const searchAssetsBySubFolderAndNameService = async (
  subFolder: string,
  name: string,
  page = 0,
  size = 10,
  sort = 'id,asc',
) => {
  try {
    const response: AssetPagedResponseType = await fetcher(
      `/api/v1/assets/${encodeURIComponent(subFolder)}/${encodeURIComponent(name)}/paged?page=${page}&size=${size}&sort=${sort}`,
      {
        method: 'GET',
      },
    )
    console.log('Search assets by subfolder and name paged:', response)
    if (!response.result) {
      throw new Error('Error search assets by subfolder and name', {
        cause: response.message,
      })
    }
    return response
  } catch (error) {
    console.error('Error search assets by subfolder and name paged:', error)
    throw error
  }
}

// GET - SubFolder listesi
export type SubFoldersResponseType = BaseResponse<string[]>
export const getSubFoldersService = async () => {
  try {
    const response: SubFoldersResponseType = await fetcher(
      '/api/v1/assets/sub-folders',
      {
        method: 'GET',
      },
    )
    console.log('Get sub-folders:', response)
    if (!response.result) {
      throw new Error('Error get sub-folders', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get sub-folders:', error)
    throw error
  }
}

// GET - Asset getir (ID ile)
export const getAssetByIdService = async (id: string | number) => {
  try {
    const response: AssetResponseType = await fetcher(
      `/api/v1/assets/id/${id}`,
      {
        method: 'GET',
      },
    )
    console.log('Get asset by ID:', response)
    if (!response.result) {
      throw new Error('Error get asset', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get asset by ID:', error)
    throw error
  }
}

// GET - Asset getir (isim ile)
export const getAssetByNameService = async (name: string) => {
  try {
    const response: AssetResponseType = await fetcher(
      `/api/v1/assets/${name}`,
      {
        method: 'GET',
      },
    )
    console.log('Get asset by name:', response)
    if (!response.result) {
      throw new Error('Error get asset', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get asset by name:', error)
    throw error
  }
}

// POST - Asset yükle (multipart/form-data)
export const uploadAssetService = async (file: File, subFolder?: string) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    if (subFolder) {
      formData.append('subFolder', subFolder)
    }

    const response: AssetResponseType = await fetcher('/api/v1/assets', {
      method: 'POST',
      body: formData,
    })
    console.log('Upload asset:', response)
    if (!response.result) {
      throw new Error('Error upload asset', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error upload asset:', error)
    throw error
  }
}

// POST - Birden fazla asset yükle
export const uploadMultiAssetsService = async (
  files: File[],
  subFolder?: string,
) => {
  try {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    if (subFolder) {
      formData.append('subFolder', subFolder)
    }

    const response: MultiAssetResponseType = await fetcher(
      '/api/v1/assets/multi',
      {
        method: 'POST',
        body: formData,
      },
    )
    console.log('Upload multi assets:', response)
    if (!response.result) {
      throw new Error('Error upload multi assets', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error upload multi assets:', error)
    throw error
  }
}

// PUT - Asset güncelle (multipart/form-data)
export const updateAssetService = async (id: string | number, file: File) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response: AssetResponseType = await fetcher(`/api/v1/assets/${id}`, {
      method: 'PUT',
      body: formData,
    })
    console.log('Update asset:', response)
    if (!response.result) {
      throw new Error('Error update asset', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error update asset:', error)
    throw error
  }
}

// DELETE - Asset sil
export const deleteAssetService = async (id: string | number) => {
  try {
    const response: BaseResponse<null> = await fetcher(`/api/v1/assets/${id}`, {
      method: 'DELETE',
    })
    console.log('Delete asset:', response)
    if (!response.result) {
      throw new Error('Error delete asset', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error delete asset:', error)
    throw error
  }
}
