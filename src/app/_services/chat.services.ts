import { fetcher } from '@/utils/services/fetcher'
import type { ChatGroup, ChatMember, ChatMessage } from '@/types/chat'
import type { BaseResponse } from '@/types/BaseResponse'

export const getMyGroupsService = async (): Promise<ChatGroup[]> => {
  const res: BaseResponse<ChatGroup[]> = await fetcher('/api/v1/chat/groups', {
    method: 'GET',
  })
  if (!res.result) throw new Error(res.message ?? 'Gruplar yüklenemedi')
  return res.data
}

export const getGroupService = async (groupId: string): Promise<ChatGroup> => {
  const res: BaseResponse<ChatGroup> = await fetcher(
    `/api/v1/chat/groups/${groupId}`,
    { method: 'GET' },
  )
  if (!res.result) throw new Error(res.message ?? 'Grup yüklenemedi')
  return res.data
}

export const getMembersService = async (
  groupId: string,
): Promise<ChatMember[]> => {
  const res: BaseResponse<ChatMember[]> = await fetcher(
    `/api/v1/chat/groups/${groupId}/members`,
    { method: 'GET' },
  )
  if (!res.result) throw new Error(res.message ?? 'Üyeler yüklenemedi')
  return res.data
}

export const createGroupService = async (data: {
  name: string
  description?: string
  visibilityLevel?: number
  memberIds?: number[]
}): Promise<ChatGroup> => {
  const res: BaseResponse<ChatGroup> = await fetcher('/api/v1/chat/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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
): Promise<ChatMessage[]> => {
  const params = new URLSearchParams({ limit: String(limit) })
  if (before) params.set('before', before)
  const res: BaseResponse<ChatMessage[]> = await fetcher(
    `/api/v1/chat/groups/${groupId}/messages?${params}`,
    { method: 'GET' },
  )
  if (!res.result) throw new Error(res.message ?? 'Mesajlar yüklenemedi')
  return res.data
}

export const editMessageService = async (
  messageId: string,
  content: string,
): Promise<ChatMessage> => {
  const res: BaseResponse<ChatMessage> = await fetcher(
    `/api/v1/chat/messages/${messageId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: content,
    },
  )
  if (!res.result) throw new Error(res.message ?? 'Mesaj düzenlenemedi')
  return res.data
}

export const deleteMessageService = async (
  messageId: string,
): Promise<void> => {
  await fetcher<null>(`/api/v1/chat/messages/${messageId}`, {
    method: 'DELETE',
  })
}

export const addMemberService = async (
  groupId: string,
  userId: number,
): Promise<ChatMember> => {
  const res: BaseResponse<ChatMember> = await fetcher(
    `/api/v1/chat/groups/${groupId}/members/${userId}`,
    { method: 'POST' },
  )
  if (!res.result) throw new Error(res.message ?? 'Üye eklenemedi')
  return res.data
}

export const removeMemberService = async (
  groupId: string,
  userId: number,
): Promise<void> => {
  await fetcher<null>(`/api/v1/chat/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  })
}

export const deleteGroupService = async (groupId: string): Promise<void> => {
  await fetcher<null>(`/api/v1/chat/groups/${groupId}`, { method: 'DELETE' })
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
