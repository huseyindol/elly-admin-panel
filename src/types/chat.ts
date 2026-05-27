export type ChatGroupType = 'GROUP' | 'DM'
export type ChatMessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
export type ChatMessageSenderType = 'ADMIN' | 'VISITOR'
export type ChatMemberRole = 'OWNER' | 'MEMBER'
export type PresenceStatus = 'ONLINE' | 'OFFLINE'
// Role hierarchy: VIEWER=1, EDITOR=2, ADMIN=3, SUPER_ADMIN=4
export type RoleLevel = 1 | 2 | 3 | 4

export interface ChatGroup {
  id: string
  name: string | null
  description: string | null
  type: ChatGroupType
  createdBy: number
  visibilityLevel: number // 1=public, 2=EDITOR+, 3=ADMIN+, 4=private
  /** NULL = Admin Chat; "tenant1" gibi = Tenant Chat */
  tenantId: string | null
  /** TRUE ise web sitesi ziyaretçileri de yazabilir */
  visitorAccess: boolean
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
  /** ADMIN = yönetici, VISITOR = tenant ziyaretçisi */
  senderType: ChatMessageSenderType
  /** Admin ise basedb users.id; visitor ise null */
  senderId: number | null
  /** Visitor ise tenant DB visitor_identities.id; admin ise null */
  visitorId: number | null
  senderUsername: string
  content: string
  contentType: ChatMessageType
  fileUrl: string | null
  parentId: string | null
  deleted: boolean
  editedAt: string | null
  createdAt: string
}

export interface SendMessagePayload {
  content: string
  contentType?: ChatMessageType
  fileUrl?: string
  parentId?: string
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

/** WebSocket /topic/user/{userId}/groups/joined|removed payload */
export interface ChatMembershipEvent {
  action: 'JOINED' | 'REMOVED'
  groupId: string
  userId: number
  group?: ChatGroup
  message: string
}

/** GET /groups/{id}/access yanıtı */
export interface ChatGroupAccess {
  groupId: string
  member: boolean
  canRead: boolean
  canWrite: boolean
  denialMessage: string | null
  denialCode: string | null
}

/** WebSocket /user/queue/chat-errors payload */
export interface ChatWsError {
  errorCode: string
  message: string
  groupId: string | null
}
