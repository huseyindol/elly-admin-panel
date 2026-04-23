import { BaseResponse } from '@/types/BaseResponse'
import { MailAccount, MailAccountRequest } from '@/types/mail-account'
import { fetcher } from '@/utils/services/fetcher'

export const getMailAccountsService = async () => {
  const response: BaseResponse<MailAccount[]> = await fetcher(
    '/api/v1/mail-accounts',
    { method: 'GET' },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Mail hesapları yüklenemedi')
  }
  return response
}

export const getMailAccountByIdService = async (id: number) => {
  const response: BaseResponse<MailAccount> = await fetcher(
    `/api/v1/mail-accounts/${id}`,
    { method: 'GET' },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Mail hesabı yüklenemedi')
  }
  return response
}

export const createMailAccountService = async (data: MailAccountRequest) => {
  const response: BaseResponse<MailAccount> = await fetcher(
    '/api/v1/mail-accounts',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Mail hesabı oluşturulamadı')
  }
  return response
}

export const updateMailAccountService = async (
  id: number,
  data: MailAccountRequest,
) => {
  const response: BaseResponse<MailAccount> = await fetcher(
    `/api/v1/mail-accounts/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Mail hesabı güncellenemedi')
  }
  return response
}

export const deleteMailAccountService = async (id: number) => {
  const response: BaseResponse<boolean> = await fetcher(
    `/api/v1/mail-accounts/${id}`,
    { method: 'DELETE' },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Mail hesabı silinemedi')
  }
  return response
}

export const setDefaultMailAccountService = async (id: number) => {
  const response: BaseResponse<MailAccount> = await fetcher(
    `/api/v1/mail-accounts/${id}/default`,
    { method: 'PUT' },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Varsayılan hesap ayarlanamadı')
  }
  return response
}

export const testMailAccountService = async (id: number, testTo: string) => {
  const response: BaseResponse<string> = await fetcher(
    `/api/v1/mail-accounts/${id}/test`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testTo }),
    },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'SMTP testi başarısız')
  }
  return response
}

export const verifyMailAccountService = async (id: number) => {
  const response: BaseResponse<string> = await fetcher(
    `/api/v1/mail-accounts/${id}/verify`,
    { method: 'POST' },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'SMTP doğrulama başarısız')
  }
  return response
}

export const getActiveMailAccountsService = async () => {
  const response: BaseResponse<MailAccount[]> = await fetcher(
    '/api/v1/mail-accounts/active',
    { method: 'GET' },
  )
  if (!response.result) {
    throw new Error(response.message ?? 'Aktif mail hesapları yüklenemedi')
  }
  return response
}
