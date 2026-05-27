import { create } from 'zustand'
import { Client, type IFrame, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getGlobalCookies } from '@/context/CookieContext'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import { getMyUserId } from '@/utils/chat-role'
import type {
  ChatGroup,
  ChatMembershipEvent,
  ChatMessage,
  ChatPresence,
  ChatTyping,
  ChatWsError,
} from '@/types/chat'

interface ChatWsState {
  client: Client | null
  connected: boolean
  activeGroupId: string | null
  /** Aktif grubun tenantId'si — TC routing ve X-Tenant-Id header için */
  activeGroupTenantId: string | null
  messages: Record<string, ChatMessage[]>
  presence: Record<number, 'ONLINE' | 'OFFLINE'>
  typingUsers: Record<string, Set<string>>
  /** Yeni grup bildirim sinyali — sidebar dinler */
  newGroupSignal: ChatGroup | null
  newGroupSeq: number
  /** Silinen grup id — sidebar listeden kaldırır, işleyince null'a çeker */
  deletedGroupSignal: string | null
  /** Kullanıcı bir gruba davet edildiğinde */
  membershipJoinedSignal: ChatMembershipEvent | null
  membershipJoinedSeq: number
  /** Kullanıcı bir gruptan çıkarıldığında */
  membershipRemovedSignal: ChatMembershipEvent | null
  membershipRemovedSeq: number
  /** Mesaj gönderme reddedildiğinde kişisel hata kuyruğu */
  chatErrorSignal: ChatWsError | null
  chatErrorSeq: number
  /** groupId → okunmamış mesaj sayısı (sidebar badge için) */
  unreadCounts: Record<string, number>

  /** presence + /topic/groups/new gibi WS ömrü boyunca duran sub'lar */
  globalSubs: StompSubscription[]
  /** Yalnızca aktif grup için typing + read sub'ları */
  activeGroupSubs: StompSubscription[]
  /** Kullanıcının görebildiği tüm grupların mesaj sub'ları (sidebar badge için) */
  allGroupSubs: StompSubscription[]

  connect: () => void
  disconnect: () => void
  subscribeToGroup: (groupId: string, tenantId?: string | null) => void
  unsubscribeFromGroup: () => void
  subscribeToAllGroups: (groups: ChatGroup[], myRoleLevel: number) => void
  clearUnread: (groupId: string) => void
  sendTyping: (groupId: string) => void
  sendRead: (groupId: string) => void
  prependHistory: (groupId: string, messages: ChatMessage[]) => void
  markMessageDeleted: (groupId: string, messageId: string) => void
}

/** Aynı id'li mesajları birleştirir; createdAt'e göre sıralar. */
function mergeChatMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>()
  for (const message of existing) {
    byId.set(message.id, message)
  }
  for (const message of incoming) {
    byId.set(message.id, message)
  }
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

export const useChatWsStore = create<ChatWsState>((set, get) => ({
  client: null,
  connected: false,
  activeGroupId: null,
  activeGroupTenantId: null,
  messages: {},
  presence: {},
  typingUsers: {},
  newGroupSignal: null,
  newGroupSeq: 0,
  deletedGroupSignal: null,
  membershipJoinedSignal: null,
  membershipJoinedSeq: 0,
  membershipRemovedSignal: null,
  membershipRemovedSeq: 0,
  chatErrorSignal: null,
  chatErrorSeq: 0,
  unreadCounts: {},

  globalSubs: [],
  activeGroupSubs: [],
  allGroupSubs: [],

  connect: () => {
    const { client: existingClient } = get()
    if (existingClient?.connected) return
    // Aktivasyon sürecinde ikinci client oluşturmayı önle
    if (existingClient) {
      if (!existingClient.active) existingClient.activate()
      return
    }

    const token = getGlobalCookies()[CookieEnum.ACCESS_TOKEN]
    if (!token) return

    const wsUrl = `${process.env.NEXT_PUBLIC_API}/ws`

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 25000,
      heartbeatOutgoing: 25000,

      onConnect: (_frame: IFrame) => {
        set({ connected: true })

        // Global sub: presence
        const presenceSub = client.subscribe('/topic/presence', msg => {
          const data: ChatPresence = JSON.parse(msg.body)
          set(s => ({
            presence: { ...s.presence, [data.userId]: data.status },
          }))
        })

        // Global sub: yeni grup bildirimleri
        const newGroupSub = client.subscribe('/topic/groups/new', msg => {
          try {
            const group: ChatGroup = JSON.parse(msg.body)
            set(s => ({
              newGroupSignal: group,
              newGroupSeq: s.newGroupSeq + 1,
            }))
          } catch {
            // ignore parse errors
          }
        })

        // Global sub: silinen grup bildirimleri (msg.body = groupId)
        const deletedGroupSub = client.subscribe(
          '/topic/groups/deleted',
          msg => {
            const groupId = (msg.body ?? '').trim()
            if (!groupId) return
            set({ deletedGroupSignal: groupId })
          },
        )

        set({ globalSubs: [presenceSub, newGroupSub, deletedGroupSub] })

        const personalSubs: StompSubscription[] = [
          // Tercih edilen: Spring user destination (userId hesaplamaya gerek yok)
          client.subscribe('/user/queue/groups/joined', msg => {
            try {
              const event = parseJoinedPayload(msg.body)
              if (event) emitMembershipJoined(event, set)
            } catch {
              // ignore parse errors
            }
          }),
          client.subscribe('/user/queue/groups/removed', msg => {
            try {
              const event = parseRemovedPayload(msg.body)
              if (event) emitMembershipRemoved(event, set)
            } catch {
              // ignore parse errors
            }
          }),
          client.subscribe('/user/queue/membership', msg => {
            try {
              const event = parseMembershipPayload(msg.body)
              if (event) dispatchMembershipEvent(event, set)
            } catch {
              // ignore parse errors
            }
          }),
          client.subscribe('/user/queue/chat-errors', msg => {
            try {
              const err: ChatWsError = JSON.parse(msg.body)
              emitChatError(err, set)
            } catch {
              // ignore parse errors
            }
          }),
        ]

        set(s => ({ globalSubs: [...s.globalSubs, ...personalSubs] }))

        // Legacy topic sub'ları (geriye dönük uyumluluk)
        getMyUserId()
          .then(userId => {
            if (!userId) return
            if (!get().client?.connected) return

            const legacySubs: StompSubscription[] = [
              client.subscribe(`/topic/user/${userId}/groups/joined`, msg => {
                try {
                  const event = parseJoinedPayload(msg.body, userId)
                  if (event) emitMembershipJoined(event, set)
                } catch {
                  // ignore parse errors
                }
              }),
              client.subscribe(`/topic/user/${userId}/groups/removed`, msg => {
                try {
                  const event = parseRemovedPayload(msg.body)
                  if (event) emitMembershipRemoved(event, set)
                } catch {
                  // ignore parse errors
                }
              }),
              client.subscribe(`/topic/user/${userId}/membership`, msg => {
                try {
                  const event = parseMembershipPayload(msg.body)
                  if (event) dispatchMembershipEvent(event, set)
                } catch {
                  // ignore parse errors
                }
              }),
            ]

            set(s => ({ globalSubs: [...s.globalSubs, ...legacySubs] }))
          })
          .catch(() => {
            // userId çekilemezse sessizce geç
          })

        // Kullanıcı WS bağlanmadan önce bir grup açtıysa, sub'ları şimdi at
        const { activeGroupId, activeGroupTenantId } = get()
        if (activeGroupId) {
          attachActiveGroupSubs(client, activeGroupId, activeGroupTenantId, set)
        }
      },

      onDisconnect: () => set({ connected: false }),
      onStompError: frame => {
        if (process.env.NODE_ENV === 'development') {
          console.error('STOMP error', frame)
        }
      },
    })

    client.activate()
    set({ client })
  },

  disconnect: () => {
    const { client, globalSubs, activeGroupSubs, allGroupSubs } = get()
    globalSubs.forEach(s => s.unsubscribe())
    activeGroupSubs.forEach(s => s.unsubscribe())
    allGroupSubs.forEach(s => s.unsubscribe())
    client?.deactivate()
    set({
      client: null,
      connected: false,
      activeGroupId: null,
      activeGroupTenantId: null,
      globalSubs: [],
      activeGroupSubs: [],
      allGroupSubs: [],
      unreadCounts: {},
      newGroupSignal: null,
      newGroupSeq: 0,
      deletedGroupSignal: null,
      membershipJoinedSignal: null,
      membershipJoinedSeq: 0,
      membershipRemovedSignal: null,
      membershipRemovedSeq: 0,
      chatErrorSignal: null,
      chatErrorSeq: 0,
    })
  },

  subscribeToGroup: (groupId: string, tenantId?: string | null) => {
    set({ activeGroupId: groupId, activeGroupTenantId: tenantId ?? null })

    const { client } = get()
    if (client?.connected) {
      attachActiveGroupSubs(client, groupId, tenantId ?? null, set)
    }
  },

  unsubscribeFromGroup: () => {
    const { activeGroupSubs } = get()
    activeGroupSubs.forEach(s => s.unsubscribe())
    set({ activeGroupId: null, activeGroupTenantId: null, activeGroupSubs: [] })
  },

  subscribeToAllGroups: (groups, _myRoleLevel) => {
    const { client, allGroupSubs } = get()
    if (!client?.connected) return

    // Önceki tüm grup sub'larını kapat
    allGroupSubs.forEach(s => s.unsubscribe())

    // Aynı gruba çift sub (duplicate mesaj) olmasın diye id bazlı tekilleştir
    const uniqueGroups = groups.filter(
      (group, index, arr) =>
        arr.findIndex(candidate => candidate.id === group.id) === index,
    )

    const subs: StompSubscription[] = uniqueGroups.map(group => {
      // TC grup: tenant-aware topic; AC grup: standart topic
      const topic = group.tenantId
        ? `/topic/tenant/${group.tenantId}/group/${group.id}`
        : `/topic/group/${group.id}`

      return client.subscribe(topic, msg => {
        try {
          const data: ChatMessage = JSON.parse(msg.body)
          set(s => {
            const existing = s.messages[group.id] ?? []
            if (existing.some(m => m.id === data.id)) return s

            return {
              messages: {
                ...s.messages,
                [group.id]: [...existing, data],
              },
              unreadCounts:
                s.activeGroupId === group.id
                  ? s.unreadCounts
                  : {
                      ...s.unreadCounts,
                      [group.id]: (s.unreadCounts[group.id] ?? 0) + 1,
                    },
            }
          })
        } catch {
          // ignore parse errors
        }
      })
    })

    set({ allGroupSubs: subs })
  },

  clearUnread: groupId => {
    set(s => {
      if (!s.unreadCounts[groupId]) return s
      const next = { ...s.unreadCounts }
      delete next[groupId]
      return { unreadCounts: next }
    })
  },

  sendTyping: (groupId: string) => {
    const { client, activeGroupTenantId } = get()
    if (!client?.connected) return

    const destination = activeGroupTenantId
      ? `/app/tenant-chat/${activeGroupTenantId}/${groupId}/typing`
      : `/app/chat/${groupId}/typing`

    client.publish({ destination, body: '' })
  },

  sendRead: (groupId: string) => {
    const { client, activeGroupTenantId } = get()
    if (!client?.connected) return

    const destination = activeGroupTenantId
      ? `/app/tenant-chat/${activeGroupTenantId}/${groupId}/read`
      : `/app/chat/${groupId}/read`

    client.publish({ destination, body: '' })
  },

  prependHistory: (groupId, messages) => {
    set(s => ({
      messages: {
        ...s.messages,
        [groupId]: mergeChatMessages(s.messages[groupId] ?? [], messages),
      },
    }))
  },

  markMessageDeleted: (groupId, messageId) => {
    set(s => ({
      messages: {
        ...s.messages,
        [groupId]: (s.messages[groupId] ?? []).map(m =>
          m.id === messageId ? { ...m, deleted: true } : m,
        ),
      },
    }))
  },
}))

/** Tam DtoChatMembershipEvent payload'unu parse eder. */
function parseMembershipPayload(body: string): ChatMembershipEvent | null {
  const parsed: unknown = JSON.parse(body)
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'action' in parsed &&
    'groupId' in parsed &&
    (parsed.action === 'JOINED' || parsed.action === 'REMOVED')
  ) {
    return parsed as ChatMembershipEvent
  }
  return null
}

/** JOINED — DtoChatGroup (legacy) veya DtoChatMembershipEvent. */
function parseJoinedPayload(
  body: string,
  userId = 0,
): ChatMembershipEvent | null {
  const membership = parseMembershipPayload(body)
  if (membership?.action === 'JOINED') return membership

  const parsed: unknown = JSON.parse(body)
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'id' in parsed &&
    typeof (parsed as ChatGroup).id === 'string'
  ) {
    const group = parsed as ChatGroup
    return {
      action: 'JOINED',
      groupId: group.id,
      userId,
      group,
      message: 'Gruba dahil edildiniz.',
    }
  }
  return null
}

/** REMOVED — DtoChatMembershipEvent. */
function parseRemovedPayload(body: string): ChatMembershipEvent | null {
  const event = parseMembershipPayload(body)
  if (!event || event.action !== 'REMOVED') return null
  return event
}

function emitMembershipJoined(
  event: ChatMembershipEvent,
  set: (
    partial:
      | Partial<ChatWsState>
      | ((state: ChatWsState) => Partial<ChatWsState>),
  ) => void,
) {
  set(s => ({
    membershipJoinedSignal: event,
    membershipJoinedSeq: s.membershipJoinedSeq + 1,
  }))
}

function emitMembershipRemoved(
  event: ChatMembershipEvent,
  set: (
    partial:
      | Partial<ChatWsState>
      | ((state: ChatWsState) => Partial<ChatWsState>),
  ) => void,
) {
  set(s => ({
    membershipRemovedSignal: event,
    membershipRemovedSeq: s.membershipRemovedSeq + 1,
  }))
}

function emitChatError(
  err: ChatWsError,
  set: (
    partial:
      | Partial<ChatWsState>
      | ((state: ChatWsState) => Partial<ChatWsState>),
  ) => void,
) {
  set(s => ({
    chatErrorSignal: err,
    chatErrorSeq: s.chatErrorSeq + 1,
  }))
}

function dispatchMembershipEvent(
  event: ChatMembershipEvent,
  set: (
    partial:
      | Partial<ChatWsState>
      | ((state: ChatWsState) => Partial<ChatWsState>),
  ) => void,
) {
  if (event.action === 'JOINED') {
    emitMembershipJoined(event, set)
  } else {
    emitMembershipRemoved(event, set)
  }
}

/**
 * Aktif grup için typing + read sub'larını kurar.
 * TC grup ise tenant-aware topic kullanır.
 * Mesaj sub'ı `allGroupSubs` tarafından ele alındığı için burada yok.
 */
function attachActiveGroupSubs(
  client: Client,
  groupId: string,
  tenantId: string | null,
  set: (
    partial:
      | Partial<ChatWsState>
      | ((state: ChatWsState) => Partial<ChatWsState>),
  ) => void,
) {
  const subs: StompSubscription[] = []

  // TC grup: tenant-aware topic; AC grup: standart topic
  const baseTopic = tenantId
    ? `/topic/tenant/${tenantId}/group/${groupId}`
    : `/topic/group/${groupId}`

  subs.push(
    client.subscribe(`${baseTopic}/typing`, msg => {
      const data: ChatTyping = JSON.parse(msg.body)
      set(s => {
        const typingSet = new Set(s.typingUsers[groupId] ?? [])
        if (data.typing) {
          typingSet.add(data.username)
          setTimeout(() => {
            set(prev => {
              const t = new Set(prev.typingUsers[groupId] ?? [])
              t.delete(data.username)
              return { typingUsers: { ...prev.typingUsers, [groupId]: t } }
            })
          }, 5500)
        } else {
          typingSet.delete(data.username)
        }
        return { typingUsers: { ...s.typingUsers, [groupId]: typingSet } }
      })
    }),
  )

  subs.push(
    client.subscribe(`${baseTopic}/read`, _msg => {
      // okundu göstergesi — genişletilebilir
    }),
  )

  // Önceki aktif grup sub'larını temizle
  set(s => {
    s.activeGroupSubs.forEach(sub => sub.unsubscribe())
    return { activeGroupSubs: subs }
  })
}
