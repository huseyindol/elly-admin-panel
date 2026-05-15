export type ChatGroupType = 'GROUP' | 'DM'
export type ChatMessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
export type ChatMemberRole = 'OWNER' | 'MEMBER'
export type PresenceStatus = 'ONLINE' | 'OFFLINE'

export interface ChatGroup {
  id: string
  name: string | null
  description: string | null
  type: ChatGroupType
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface ChatMember {
  userId: number
  username: string
  firstName: string
  lastName: string
  role: ChatMemberRole
  joinedAt: string
}

export interface ChatMessage {
  id: string
  groupId: string
  senderId: number
  senderUsername: string
  content: string
  contentType: ChatMessageType
  fileUrl: string | null
  parentId: string | null
  deleted: boolean
  editedAt: string | null
  createdAt: string
}

export interface ChatPresence {
  userId: number
  username: string
  status: PresenceStatus
}

export interface ChatTyping {
  groupId: string
  userId: number
  username: string
  typing: boolean
}

export interface ChatRead {
  groupId: string
  userId: number
  username: string
}
