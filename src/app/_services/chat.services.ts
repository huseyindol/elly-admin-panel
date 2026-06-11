import { fetcher } from '@/utils/services/fetcher'
import { unwrapOrThrow } from '@/lib/api/api-error'
import type {
  ChatGroup,
  ChatGroupAccess,
  ChatMember,
  ChatMessage,
  DtoChatBan,
  SendMessagePayload,
} from '@/types/chat'
import type { BaseResponse } from '@/types/BaseResponse'

/**
 * AC → /api/v1/chat, TC → /api/v1/tenant-chat
 * TC çağrıları tenantToken ile Authorization header'ını override eder;
 * X-Tenant-Id header'ı artık kullanılmaz.
 */
const chatBase = (tenantId?: string | null) =>
  tenantId ? '/api/v1/tenant-chat' : '/api/v1/chat'

/** TC çağrılarında admin JWT yerine tenant-switch JWT kullanılır. */
const tcAuth = (tenantToken?: string | null): { overrideAuth?: string } =>
  tenantToken ? { overrideAuth: tenantToken } : {}

export const getMyGroupsService = async (
  tenantId?: string | null,
  tenantToken?: string | null,
): Promise<ChatGroup[]> => {
  const res: BaseResponse<ChatGroup[]> = await fetcher(
    `${chatBase(tenantId)}/groups`,
    { method: 'GET', ...tcAuth(tenantToken) },
  )
  if (!res.result) throw new Error(res.message ?? 'Gruplar yüklenemedi')
  return res.data
}

export const getGroupService = async (
  groupId: string,
  tenantId?: string | null,
  tenantToken?: string | null,
): Promise<ChatGroup> => {
  const res: BaseResponse<ChatGroup> = await fetcher(
    `${chatBase(tenantId)}/groups/${groupId}`,
    { method: 'GET', ...tcAuth(tenantToken) },
  )
  if (!res.result) throw new Error(res.message ?? 'Grup yüklenemedi')
  return res.data
}

export const getGroupAccessService = async (
  groupId: string,
  tenantId?: string | null,
  tenantToken?: string | null,
): Promise<ChatGroupAccess> => {
  const res: BaseResponse<ChatGroupAccess> = await fetcher(
    `${chatBase(tenantId)}/groups/${groupId}/access`,
    { method: 'GET', ...tcAuth(tenantToken) },
  )
  return unwrapOrThrow(res, 'Erişim bilgisi alınamadı')
}

export const getMembersService = async (
  groupId: string,
  tenantId?: string | null,
  tenantToken?: string | null,
): Promise<ChatMember[]> => {
  const res: BaseResponse<ChatMember[]> = await fetcher(
    `${chatBase(tenantId)}/groups/${groupId}/members`,
    { method: 'GET', ...tcAuth(tenantToken) },
  )
  if (!res.result) throw new Error(res.message ?? 'Üyeler yüklenemedi')
  return res.data
}

export const createGroupService = async (
  data: {
    name: string
    description?: string
    visibilityLevel?: number
    memberIds?: number[]
    tenantId?: string | null
    visitorAccess?: boolean
  },
  tenantToken?: string | null,
): Promise<ChatGroup> => {
  const { tenantId, ...body } = data
  const res: BaseResponse<ChatGroup> = await fetcher(
    `${chatBase(tenantId)}/groups`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, tenantId }),
      ...tcAuth(tenantToken),
    },
  )
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
  tenantToken?: string | null,
): Promise<ChatMessage[]> => {
  const params = new URLSearchParams({ limit: String(limit) })
  if (before) params.set('before', before)
  const res: BaseResponse<ChatMessage[]> = await fetcher(
    `${chatBase(tenantId)}/groups/${groupId}/messages?${params}`,
    { method: 'GET', ...tcAuth(tenantToken) },
  )
  if (!res.result) throw new Error(res.message ?? 'Mesajlar yüklenemedi')
  return res.data
}

export const sendMessageService = async (
  groupId: string,
  payload: SendMessagePayload,
  tenantId?: string | null,
  tenantToken?: string | null,
): Promise<ChatMessage> => {
  const res: BaseResponse<ChatMessage> = await fetcher(
    `${chatBase(tenantId)}/groups/${groupId}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      ...tcAuth(tenantToken),
    },
  )
  return unwrapOrThrow(res, 'Mesaj gönderilemedi')
}

export const editMessageService = async (
  messageId: string,
  content: string,
  tenantId?: string | null,
  tenantToken?: string | null,
): Promise<ChatMessage> => {
  const res: BaseResponse<ChatMessage> = await fetcher(
    `${chatBase(tenantId)}/messages/${messageId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: content,
      ...tcAuth(tenantToken),
    },
  )
  if (!res.result) throw new Error(res.message ?? 'Mesaj düzenlenemedi')
  return res.data
}

export const deleteMessageService = async (
  messageId: string,
  tenantId?: string | null,
  tenantToken?: string | null,
): Promise<void> => {
  await fetcher<null>(`${chatBase(tenantId)}/messages/${messageId}`, {
    method: 'DELETE',
    ...tcAuth(tenantToken),
  })
}

export const addMemberService = async (
  groupId: string,
  userId: number,
  tenantId?: string | null,
  tenantToken?: string | null,
): Promise<ChatMember> => {
  const res: BaseResponse<ChatMember> = await fetcher(
    `${chatBase(tenantId)}/groups/${groupId}/members/${userId}`,
    { method: 'POST', ...tcAuth(tenantToken) },
  )
  if (!res.result) throw new Error(res.message ?? 'Üye eklenemedi')
  return res.data
}

export const removeMemberService = async (
  groupId: string,
  userId: number,
  tenantId?: string | null,
  tenantToken?: string | null,
): Promise<void> => {
  await fetcher<null>(
    `${chatBase(tenantId)}/groups/${groupId}/members/${userId}`,
    { method: 'DELETE', ...tcAuth(tenantToken) },
  )
}

export const deleteGroupService = async (
  groupId: string,
  tenantId?: string | null,
  tenantToken?: string | null,
): Promise<void> => {
  await fetcher<null>(`${chatBase(tenantId)}/groups/${groupId}`, {
    method: 'DELETE',
    ...tcAuth(tenantToken),
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

// ===== TC (tenant chat) ban — yalnız TC gruplarında, tenant-switch JWT ile =====

export const banUserService = async (
  groupId: string,
  body: { sessionId?: string; visitorId?: number; reason?: string },
  tenantId?: string | null,
  tenantToken?: string | null,
): Promise<DtoChatBan> => {
  const res: BaseResponse<DtoChatBan> = await fetcher(
    `${chatBase(tenantId)}/groups/${groupId}/bans`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      ...tcAuth(tenantToken),
    },
  )
  if (!res.result) throw new Error(res.message ?? 'Kullanıcı banlanamadı')
  return res.data
}

export const unbanUserService = async (
  groupId: string,
  target: { sessionId?: string; visitorId?: number },
  tenantId?: string | null,
  tenantToken?: string | null,
): Promise<void> => {
  const params = new URLSearchParams()
  if (target.sessionId) params.set('sessionId', target.sessionId)
  if (target.visitorId != null)
    params.set('visitorId', String(target.visitorId))
  await fetcher<null>(
    `${chatBase(tenantId)}/groups/${groupId}/bans?${params.toString()}`,
    { method: 'DELETE', ...tcAuth(tenantToken) },
  )
}

export const listBansService = async (
  groupId: string,
  tenantId?: string | null,
  tenantToken?: string | null,
): Promise<DtoChatBan[]> => {
  const res: BaseResponse<DtoChatBan[]> = await fetcher(
    `${chatBase(tenantId)}/groups/${groupId}/bans`,
    { method: 'GET', ...tcAuth(tenantToken) },
  )
  if (!res.result) throw new Error(res.message ?? 'Ban listesi alınamadı')
  return res.data
}
