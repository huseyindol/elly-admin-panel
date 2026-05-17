import { create } from 'zustand'
import { Client, type IFrame, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getGlobalCookies } from '@/context/CookieContext'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import type {
  ChatGroup,
  ChatMessage,
  ChatPresence,
  ChatTyping,
} from '@/types/chat'

interface ChatWsState {
  client: Client | null
  connected: boolean
  activeGroupId: string | null
  messages: Record<string, ChatMessage[]>
  presence: Record<number, 'ONLINE' | 'OFFLINE'>
  typingUsers: Record<string, Set<string>>
  /** Yeni grup bildirim sinyali — sidebar dinler, işleyince null'a çeker */
  newGroupSignal: ChatGroup | null
  /** Silinen grup id — sidebar listeden kaldırır, işleyince null'a çeker */
  deletedGroupSignal: string | null
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
  subscribeToGroup: (groupId: string) => void
  unsubscribeFromGroup: () => void
  subscribeToAllGroups: (groups: ChatGroup[], myRoleLevel: number) => void
  clearUnread: (groupId: string) => void
  sendMessage: (
    groupId: string,
    content: string,
    contentType?: string,
    parentId?: string,
  ) => void
  sendTyping: (groupId: string) => void
  sendRead: (groupId: string) => void
  prependHistory: (groupId: string, messages: ChatMessage[]) => void
  markMessageDeleted: (groupId: string, messageId: string) => void
}

export const useChatWsStore = create<ChatWsState>((set, get) => ({
  client: null,
  connected: false,
  activeGroupId: null,
  messages: {},
  presence: {},
  typingUsers: {},
  newGroupSignal: null,
  deletedGroupSignal: null,
  unreadCounts: {},

  globalSubs: [],
  activeGroupSubs: [],
  allGroupSubs: [],

  connect: () => {
    if (get().client?.connected) return

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
            // Frontend visibilityLevel filtresi ChatSidebar'da yapılır
            set({ newGroupSignal: group })
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

        // Kullanıcı WS bağlanmadan önce bir grup açtıysa, typing/read sub'larını şimdi at
        const { activeGroupId } = get()
        if (activeGroupId) {
          attachActiveGroupSubs(client, activeGroupId, set)
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
      globalSubs: [],
      activeGroupSubs: [],
      allGroupSubs: [],
      unreadCounts: {},
      newGroupSignal: null,
      deletedGroupSignal: null,
    })
  },

  subscribeToGroup: (groupId: string) => {
    // activeGroupId her durumda set edilir — ChatWindow REST ile history yükler.
    // WS sub'lar bağlantı kuruluysa hemen atılır, değilse onConnect içinde yapılır.
    set({ activeGroupId: groupId })

    const { client } = get()
    if (client?.connected) {
      attachActiveGroupSubs(client, groupId, set)
    }
  },

  unsubscribeFromGroup: () => {
    const { activeGroupSubs } = get()
    activeGroupSubs.forEach(s => s.unsubscribe())
    set({ activeGroupId: null, activeGroupSubs: [] })
  },

  subscribeToAllGroups: (groups, _myRoleLevel) => {
    const { client, allGroupSubs } = get()
    if (!client?.connected) return

    // Önceki tüm grup sub'larını kapat
    allGroupSubs.forEach(s => s.unsubscribe())

    const subs: StompSubscription[] = groups.map(group =>
      client.subscribe(`/topic/group/${group.id}`, msg => {
        try {
          const data: ChatMessage = JSON.parse(msg.body)
          const { activeGroupId, messages, unreadCounts } = get()
          const existing = messages[group.id] ?? []
          // Aynı mesaj WS'den hem grup hem aktif sub üzerinden gelmesin diye id check
          if (existing.some(m => m.id === data.id)) return

          set({
            messages: {
              ...messages,
              [group.id]: [...existing, data],
            },
            unreadCounts:
              activeGroupId === group.id
                ? unreadCounts
                : {
                    ...unreadCounts,
                    [group.id]: (unreadCounts[group.id] ?? 0) + 1,
                  },
          })
        } catch {
          // ignore parse errors
        }
      }),
    )

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

  sendMessage: (groupId, content, contentType = 'TEXT', parentId) => {
    const { client } = get()
    if (!client?.connected) return
    client.publish({
      destination: `/app/chat/${groupId}/send`,
      body: JSON.stringify({ content, contentType, parentId }),
    })
  },

  sendTyping: (groupId: string) => {
    const { client } = get()
    if (!client?.connected) return
    client.publish({ destination: `/app/chat/${groupId}/typing`, body: '' })
  },

  sendRead: (groupId: string) => {
    const { client } = get()
    if (!client?.connected) return
    client.publish({ destination: `/app/chat/${groupId}/read`, body: '' })
  },

  prependHistory: (groupId, messages) => {
    set(s => ({
      messages: {
        ...s.messages,
        [groupId]: [...messages, ...(s.messages[groupId] ?? [])],
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

/**
 * Aktif grup için typing + read sub'larını kurar.
 * Mesaj sub'ı `allGroupSubs` tarafından ele alındığı için burada yok.
 */
function attachActiveGroupSubs(
  client: Client,
  groupId: string,
  set: (
    partial:
      | Partial<ChatWsState>
      | ((state: ChatWsState) => Partial<ChatWsState>),
  ) => void,
) {
  const subs: StompSubscription[] = []

  subs.push(
    client.subscribe(`/topic/group/${groupId}/typing`, msg => {
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
    client.subscribe(`/topic/group/${groupId}/read`, _msg => {
      // okundu göstergesi — genişletilebilir
    }),
  )

  // Önceki aktif grup sub'larını temizle
  set(s => {
    s.activeGroupSubs.forEach(sub => sub.unsubscribe())
    return { activeGroupSubs: subs }
  })
}
