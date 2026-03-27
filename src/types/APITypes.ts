export type APIResponseSuccessType<T = unknown> = {
  success: true
  data: T
  message: string
  status: number
}

export type APIResponseErrorType = {
  success: false
  error: string
  message: unknown
  status: number
}
