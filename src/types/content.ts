// Basic Info Model
export interface BasicInfo {
  id: string
  sectionKey: string
  title: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

// CMS Content Item - API response model
export interface ContentItem<T = Record<string, unknown>> {
  id: string // UUID
  basicInfo: BasicInfo
  contentType: string
  metadata: T
  createdAt: string
  updatedAt: string
}

// CMS Content Create/Update Input
export interface ContentInput {
  basicInfoId?: string
  basicInfo?: Omit<BasicInfo, 'id' | 'createdAt' | 'updatedAt'>
  contentType: string
  metadata: Record<string, unknown>
}

// CMS Content List Response
export interface ContentListResponse<T = Record<string, unknown>> {
  result: boolean
  data: ContentItem<T>[]
}

// CMS Content Single Response
export interface ContentResponse<T = Record<string, unknown>> {
  result: boolean
  data: ContentItem<T>
}

// CMS Content Paged Response
export interface ContentPagedResponse<T = Record<string, unknown>> {
  result: boolean
  data: {
    content: ContentItem<T>[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
  }
}

// Error Response
export interface ContentErrorResponse {
  result: false
  status: number
  error: string
  errorCode: string
  message: string
}

// Section bilgisi - title ve description icin
export interface SectionInfo {
  title: string
  description?: string
}

// Section verisi + item listesi (SSR icin)
export interface SectionData<T = Record<string, unknown>> {
  sectionInfo: SectionInfo
  items: T[]
}
