import { create } from 'zustand'
import { Client, type IFrame, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getGlobalCookies } from '@/context/CookieContext'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import type { ChatMessage, ChatPresence, ChatTyping } from '@/types/chat'

interface ChatWsState {
  client: Client | null
  connected: boolean
  activeGroupId: string | null
  messages: Record<string, ChatMessage[]>
  presence: Record<number, 'ONLINE' | 'OFFLINE'>
  typingUsers: Record<string, Set<string>>
  subscriptions: StompSubscription[]

  connect: () => void
  disconnect: () => void
  subscribeToGroup: (groupId: string) => void
  unsubscribeFromGroup: () => void
  sendMessage: (
    groupId: string,
    content: string,
    contentType?: string,
    parentId?: string,
  ) => void
  sendTyping: (groupId: string) => void
  sendRead: (groupId: string) => void
  prependHistory: (groupId: string, messages: ChatMessage[]) => void
}

export const useChatWsStore = create<ChatWsState>((set, get) => ({
  client: null,
  connected: false,
  activeGroupId: null,
  messages: {},
  presence: {},
  typingUsers: {},
  subscriptions: [],

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

        const presenceSub = client.subscribe('/topic/presence', msg => {
          const data: ChatPresence = JSON.parse(msg.body)
          set(s => ({
            presence: { ...s.presence, [data.userId]: data.status },
          }))
        })

        set(s => ({ subscriptions: [presenceSub, ...s.subscriptions] }))
      },

      onDisconnect: () => set({ connected: false }),
      onStompError: frame => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('STOMP error', frame)
        }
      },
    })

    client.activate()
    set({ client })
  },

  disconnect: () => {
    const { client, subscriptions } = get()
    subscriptions.forEach(s => s.unsubscribe())
    client?.deactivate()
    set({
      client: null,
      connected: false,
      subscriptions: [],
      activeGroupId: null,
    })
  },

  subscribeToGroup: (groupId: string) => {
    const { client, subscriptions } = get()
    if (!client?.connected) return

    subscriptions.slice(1).forEach(s => s.unsubscribe())

    const subs: StompSubscription[] = []

    subs.push(
      client.subscribe(`/topic/group/${groupId}`, msg => {
        const data: ChatMessage = JSON.parse(msg.body)
        set(s => ({
          messages: {
            ...s.messages,
            [groupId]: [...(s.messages[groupId] ?? []), data],
          },
        }))
      }),
    )

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

    set(s => ({
      activeGroupId: groupId,
      subscriptions: [s.subscriptions[0], ...subs],
    }))
  },

  unsubscribeFromGroup: () => {
    const { subscriptions } = get()
    subscriptions.slice(1).forEach(s => s.unsubscribe())
    set(s => ({
      activeGroupId: null,
      subscriptions: s.subscriptions.slice(0, 1),
    }))
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
}))
