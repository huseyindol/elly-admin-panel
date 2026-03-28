import { CreateBannerInput, UpdateBannerInput } from '@/schemas/banner.schema'
import {
  BannerListResponseType,
  BannerResponseType,
  BannerSummaryListResponseType,
  BaseResponse,
} from '@/types/BaseResponse'
import { fetcher } from '@/utils/services/fetcher'

// GET - Tüm bannerları listele
export const getBannerService = async () => {
  try {
    const response: BannerListResponseType = await fetcher(
      '/api/v1/banners/list',
      {
        method: 'GET',
      },
    )
    console.log('Get banners:', response)
    if (!response.result) {
      throw new Error('Error get banners', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get banners:', error)
    throw error
  }
}

// GET - Tek banner getir (ID ile)
export const getBannerByIdService = async (id: string) => {
  try {
    const response: BannerResponseType = await fetcher(
      `/api/v1/banners/${id}`,
      {
        method: 'GET',
      },
    )
    console.log('Get banner by ID:', response)
    if (!response.result) {
      throw new Error('Error get banner', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error get banner:', error)
    throw error
  }
}

// Responsive image files interface
export interface BannerImageFiles {
  desktop?: File | null
  tablet?: File | null
  mobile?: File | null
}

// POST - Yeni banner oluştur (multipart/form-data)
// API expects: data (JSON string) + desktop, tablet, mobile (files)
export const createBannerService = async (
  data: CreateBannerInput,
  imageFiles: BannerImageFiles,
) => {
  try {
    const formData = new FormData()

    // Data field as JSON string (DtoBannerIU format)
    const jsonData = {
      title: data.title,
      altText: data.altText || '',
      link: data.link || '',
      target: data.target || '_blank',
      type: data.type || '',
      orderIndex: data.orderIndex || 0,
      status: data.status ?? true,
      subFolder: data.subFolder || '',
      images: data.images || {},
    }
    formData.append('data', JSON.stringify(jsonData))

    // Responsive image files
    if (imageFiles.desktop) {
      formData.append('desktop', imageFiles.desktop)
    }
    if (imageFiles.tablet) {
      formData.append('tablet', imageFiles.tablet)
    }
    if (imageFiles.mobile) {
      formData.append('mobile', imageFiles.mobile)
    }

    const response: BannerResponseType = await fetcher('/api/v1/banners', {
      method: 'POST',
      body: formData,
      // Content-Type otomatik olarak multipart/form-data olarak ayarlanır
    })
    console.log('Creating banner:', response)
    if (!response.result) {
      throw new Error('Error creating banner', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error creating banner:', error)
    throw error
  }
}

// PUT - Banner güncelle (multipart/form-data)
// API expects: data (JSON string) + desktop, tablet, mobile (files)
export const updateBannerService = async (
  id: string,
  data: UpdateBannerInput,
  imageFiles?: BannerImageFiles,
) => {
  try {
    const formData = new FormData()

    // Data field as JSON string (DtoBannerIU format)
    const jsonData = {
      title: data.title,
      altText: data.altText || '',
      link: data.link || '',
      target: data.target || '_blank',
      type: data.type || '',
      orderIndex: data.orderIndex || 0,
      status: data.status ?? true,
      subFolder: data.subFolder || '',
      images: data.images || {},
    }
    formData.append('data', JSON.stringify(jsonData))

    // Responsive image files
    if (imageFiles?.desktop) {
      formData.append('desktop', imageFiles.desktop)
    }
    if (imageFiles?.tablet) {
      formData.append('tablet', imageFiles.tablet)
    }
    if (imageFiles?.mobile) {
      formData.append('mobile', imageFiles.mobile)
    }

    const response: BannerResponseType = await fetcher(
      `/api/v1/banners/${id}`,
      {
        method: 'PUT',
        body: formData,
      },
    )
    console.log('Updating banner:', response)
    if (!response.result) {
      throw new Error('Error updating banner', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error updating banner:', error)
    throw error
  }
}

// DELETE - Banner sil
export const deleteBannerService = async (id: string) => {
  try {
    const response: BaseResponse<null> = await fetcher(
      `/api/v1/banners/${id}`,
      {
        method: 'DELETE',
      },
    )
    console.log('Deleting banner:', response)
    if (!response.result) {
      throw new Error('Error deleting banner', { cause: response.message })
    }
    return response
  } catch (error) {
    console.error('Error deleting banner:', error)
    throw error
  }
}

// GET - Banner özet listesi (Component atamaları için)
export const getBannersSummaryService = async () => {
  try {
    const response: BannerSummaryListResponseType = await fetcher(
      '/api/v1/banners/list/summary',
      {
        method: 'GET',
      },
    )
    console.log('Get banners summary:', response)
    if (!response.result) {
      throw new Error('Error get banners summary', {
        cause: response.message,
      })
    }
    return response
  } catch (error) {
    console.error('Error get banners summary:', error)
    throw error
  }
}

// GET - Sub-folder listesini getir
export const getSubFoldersService = async () => {
  try {
    const response: BaseResponse<string[]> = await fetcher(
      '/api/v1/banners/sub-folders',
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

// GET - Sub-folder'a göre bannerları getir
export const getBannersBySubFolderService = async (subFolder: string) => {
  try {
    // subFolder 'all' ise veya boş ise tüm listeyi getir
    if (!subFolder || subFolder === 'all') {
      return getBannerService()
    }

    const response: BannerListResponseType = await fetcher(
      `/api/v1/banners/list/${subFolder}`,
      {
        method: 'GET',
      },
    )
    console.log(`Get banners for ${subFolder}:`, response)
    if (!response.result) {
      throw new Error(`Error get banners for ${subFolder}`, {
        cause: response.message,
      })
    }
    return response
  } catch (error) {
    console.error(`Error get banners for ${subFolder}:`, error)
    throw error
  }
}

// GET - Sub-folder'a göre banner özet listesi (Component atamaları için)
// getBannersBySubFolderService kullanarak listeyi alır
export const getBannersSummaryBySubFolderService = async (
  subFolder: string,
): Promise<BannerSummaryListResponseType> => {
  try {
    // subFolder 'all' ise veya boş ise tüm özet listeyi getir
    if (!subFolder || subFolder === 'all') {
      return getBannersSummaryService()
    }

    // Sub-folder'a göre banner listesini al ve döndür
    const response = await getBannersBySubFolderService(subFolder)
    return response as unknown as BannerSummaryListResponseType
  } catch (error) {
    console.error(`Error get banners summary for ${subFolder}:`, error)
    throw error
  }
}
