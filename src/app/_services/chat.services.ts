import { fetcher } from '@/utils/services/fetcher'
import { unwrapOrThrow } from '@/lib/api/api-error'
import type {
  ChatGroup,
  ChatGroupAccess,
  ChatMember,
  ChatMessage,
  SendMessagePayload,
} from '@/types/chat'
import type { BaseResponse } from '@/types/BaseResponse'

/** TC isteklerinde X-Tenant-Id header'ı ekler; AC için boş obje döner. */
const tenantHeader = (tenantId?: string | null): Record<string, string> =>
  tenantId ? { 'X-Tenant-Id': tenantId } : {}

export const getMyGroupsService = async (): Promise<ChatGroup[]> => {
  const res: BaseResponse<ChatGroup[]> = await fetcher('/api/v1/chat/groups', {
    method: 'GET',
  })
  if (!res.result) throw new Error(res.message ?? 'Gruplar yüklenemedi')
  return res.data
}

export const getGroupService = async (
  groupId: string,
  tenantId?: string | null,
): Promise<ChatGroup> => {
  const res: BaseResponse<ChatGroup> = await fetcher(
    `/api/v1/chat/groups/${groupId}`,
    { method: 'GET', headers: tenantHeader(tenantId) },
  )
  if (!res.result) throw new Error(res.message ?? 'Grup yüklenemedi')
  return res.data
}

export const getGroupAccessService = async (
  groupId: string,
  tenantId?: string | null,
): Promise<ChatGroupAccess> => {
  const res: BaseResponse<ChatGroupAccess> = await fetcher(
    `/api/v1/chat/groups/${groupId}/access`,
    { method: 'GET', headers: tenantHeader(tenantId) },
  )
  return unwrapOrThrow(res, 'Erişim bilgisi alınamadı')
}

export const getMembersService = async (
  groupId: string,
  tenantId?: string | null,
): Promise<ChatMember[]> => {
  const res: BaseResponse<ChatMember[]> = await fetcher(
    `/api/v1/chat/groups/${groupId}/members`,
    { method: 'GET', headers: tenantHeader(tenantId) },
  )
  if (!res.result) throw new Error(res.message ?? 'Üyeler yüklenemedi')
  return res.data
}

export const createGroupService = async (data: {
  name: string
  description?: string
  visibilityLevel?: number
  memberIds?: number[]
  tenantId?: string | null
  visitorAccess?: boolean
}): Promise<ChatGroup> => {
  const { tenantId, ...body } = data
  const res: BaseResponse<ChatGroup> = await fetcher('/api/v1/chat/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...tenantHeader(tenantId),
    },
    body: JSON.stringify({ ...body, tenantId }),
  })
  if (!res.result) throw new Error(res.message ?? 'Grup oluşturulamadı')
  return res.data
}

export const getOrCreateDmService = async (
  targetUserId: number,
): Promise<ChatGroup> => {
  const res: BaseResponse<ChatGroup> = await fetcher(
    `/api/v1/chat/dm/${targetUserId}`,
    { method: 'POST' },
  )
  if (!res.result) throw new Error(res.message ?? 'DM açılamadı')
  return res.data
}

export const getHistoryService = async (
  groupId: string,
  before?: string,
  limit = 50,
  tenantId?: string | null,
): Promise<ChatMessage[]> => {
  const params = new URLSearchParams({ limit: String(limit) })
  if (before) params.set('before', before)
  const res: BaseResponse<ChatMessage[]> = await fetcher(
    `/api/v1/chat/groups/${groupId}/messages?${params}`,
    { method: 'GET', headers: tenantHeader(tenantId) },
  )
  if (!res.result) throw new Error(res.message ?? 'Mesajlar yüklenemedi')
  return res.data
}

/** REST POST ile mesaj gönderir — TC gruplar için X-Tenant-Id header'ı ekler. */
export const sendMessageService = async (
  groupId: string,
  payload: SendMessagePayload,
  tenantId?: string | null,
): Promise<ChatMessage> => {
  const res: BaseResponse<ChatMessage> = await fetcher(
    `/api/v1/chat/groups/${groupId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tenantHeader(tenantId),
      },
      body: JSON.stringify(payload),
    },
  )
  return unwrapOrThrow(res, 'Mesaj gönderilemedi')
}

export const editMessageService = async (
  messageId: string,
  content: string,
  tenantId?: string | null,
): Promise<ChatMessage> => {
  const res: BaseResponse<ChatMessage> = await fetcher(
    `/api/v1/chat/messages/${messageId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain', ...tenantHeader(tenantId) },
      body: content,
    },
  )
  if (!res.result) throw new Error(res.message ?? 'Mesaj düzenlenemedi')
  return res.data
}

export const deleteMessageService = async (
  messageId: string,
  tenantId?: string | null,
): Promise<void> => {
  await fetcher<null>(`/api/v1/chat/messages/${messageId}`, {
    method: 'DELETE',
    headers: tenantHeader(tenantId),
  })
}

export const addMemberService = async (
  groupId: string,
  userId: number,
  tenantId?: string | null,
): Promise<ChatMember> => {
  const res: BaseResponse<ChatMember> = await fetcher(
    `/api/v1/chat/groups/${groupId}/members/${userId}`,
    { method: 'POST', headers: tenantHeader(tenantId) },
  )
  if (!res.result) throw new Error(res.message ?? 'Üye eklenemedi')
  return res.data
}

export const removeMemberService = async (
  groupId: string,
  userId: number,
  tenantId?: string | null,
): Promise<void> => {
  await fetcher<null>(`/api/v1/chat/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
    headers: tenantHeader(tenantId),
  })
}

export const deleteGroupService = async (
  groupId: string,
  tenantId?: string | null,
): Promise<void> => {
  await fetcher<null>(`/api/v1/chat/groups/${groupId}`, {
    method: 'DELETE',
    headers: tenantHeader(tenantId),
  })
}

export const uploadChatFileService = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  const res: BaseResponse<string> = await fetcher('/api/v1/chat/files', {
    method: 'POST',
    body: formData,
  })
  if (!res.result) throw new Error(res.message ?? 'Dosya yüklenemedi')
  return res.data
}
