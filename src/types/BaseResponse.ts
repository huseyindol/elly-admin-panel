export enum BaseErrorCode {
  AUTHENTICATION_FAILED = 'Authentication failed',
  BAD_CREDENTIALS = 'Invalid username/email or password',
  ACCOUNT_DISABLED = 'User account is disabled',
  ACCOUNT_LOCKED = 'User account is locked',
}

export interface BaseResponse<T> {
  data: T
  message: string | null
  result: boolean
  errorCode: BaseErrorCode
  error: string
  status: number
}

export interface SeoInfo {
  id: string
  title: string
  description: string
  keywords: string
  canonicalUrl: string
  noIndex: boolean
  noFollow: boolean
}

export enum ComponentTypeEnum {
  BANNER = 'banner',
  WIDGET = 'widget',
  FORM = 'form',
}

export enum WidgetTypeEnum {
  BANNER = 'banner',
  POST = 'post',
}

export interface BannerImages {
  desktop: string
  tablet: string
  mobile: string
}
export interface Banner {
  id: string
  title: string
  altText: string
  images: BannerImages
  link: string
  target: string
  type: string
  orderIndex: number
  status: boolean
  subFolder: string
}

export interface Post {
  id: string
  title: string
  content: string
  slug: string
  status: boolean
  orderIndex: number
  template?: string
  seoInfo: SeoInfo
}

export interface Widget {
  id: string
  name: string
  description: string
  type: WidgetTypeEnum
  content: string
  orderIndex: number
  status: boolean
  template?: string
  banners: Banner[]
  posts: Post[]
}

export interface Component {
  id: string
  name: string
  description: string
  type: ComponentTypeEnum
  content: string
  orderIndex: number
  status: boolean
  template?: string
  pageIds: number[]
  banners: Banner[]
  widgets: Widget[]
  forms: FormSchema[]
}

export interface Page {
  id: string
  title: string
  description: string
  slug: string
  status: boolean
  template?: string
  seoInfo: SeoInfo
  components: Component[]
}
export type PageResponseType = BaseResponse<Page>
export type PageListResponseType = BaseResponse<Page[]>
export type ComponentResponseType = BaseResponse<Component>
export type ComponentListResponseType = BaseResponse<Component[]>
export type PostResponseType = BaseResponse<Post>
export type PostListResponseType = BaseResponse<Post[]>
export type WidgetResponseType = BaseResponse<Widget>
export type WidgetListResponseType = BaseResponse<Widget[]>
export type BannerResponseType = BaseResponse<Banner>
export type BannerListResponseType = BaseResponse<Banner[]>

export interface ComponentSummary {
  id: number // Note: API returns number for summary
  name: string
  status: boolean
  type: ComponentTypeEnum
  orderIndex: number
}
export type ComponentSummaryListResponseType = BaseResponse<ComponentSummary[]>

export interface BannerSummary {
  id: number
  title: string
  status: boolean
  orderIndex: number
  subFolder: string
}
export type BannerSummaryListResponseType = BaseResponse<BannerSummary[]>

export interface WidgetSummary {
  id: number
  name: string
  type: WidgetTypeEnum
  status: boolean
  orderIndex: number
}
export type WidgetSummaryListResponseType = BaseResponse<WidgetSummary[]>

export interface PostSummary {
  id: number
  title: string
  slug: string
  status: boolean
  orderIndex: number
}
export type PostSummaryListResponseType = BaseResponse<PostSummary[]>

// Form Types
import type { FormSchema, FormSchemaSummary, FormSubmission } from './form'

export type FormSchemaResponseType = BaseResponse<FormSchema>
export type FormSchemaListResponseType = BaseResponse<FormSchema[]>
export type FormSchemaSummaryListResponseType = BaseResponse<
  FormSchemaSummary[]
>
export type FormSubmissionResponseType = BaseResponse<FormSubmission>
export type FormSubmissionListResponseType = BaseResponse<FormSubmission[]>
