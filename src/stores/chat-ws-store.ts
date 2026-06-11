import { create } from 'zustand'
import { Client, type IFrame, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getGlobalCookies } from '@/context/CookieContext'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import { banKey, getMyUserId } from '@/utils/chat-role'
import { refreshAccessToken } from '@/utils/services/fetcher'
import { getTenantTokenService } from '@/app/_services/tenant.services'
import type {
  ChatBanEvent,
  ChatGroup,
  ChatMembershipEvent,
  ChatMessage,
  ChatPresence,
  ChatTyping,
  ChatWsError,
} from '@/types/chat'
import type { AppNotification } from '@/types/notification'

interface ChatWsState {
  client: Client | null
  connected: boolean
  /** Her başarılı (re)connect'te artar — abonelikleri yeniden kurmak için tetik */
  connectedSeq: number
  activeGroupId: string | null
  /** Aktif grubun tenantId'si — TC endpoint routing için */
  activeGroupTenantId: string | null
  /** TC REST çağrıları için tenant-switch JWT (kısa ömürlü, persist edilmez) */
  activeTenantToken: string | null
  messages: Record<string, ChatMessage[]>
  presence: Record<number, 'ONLINE' | 'OFFLINE'>
  /** groupId → (userId → username). userId ile anahtarlı ki mesaj gelince
   *  senderId ile güvenilir şekilde temizlenebilsin (username uyuşmazlığı olmaz). */
  typingUsers: Record<string, Map<number, string>>
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
  /** Yeni bildirim sinyali (WS /user/queue/notifications) — Header tüketir */
  notificationSignal: AppNotification | null
  notificationSeq: number
  /** WS'ten gelen okunmamış bildirim sayısı (kaynak-doğruluk) */
  notificationUnreadCount: number | null
  /** groupId → okunmamış mesaj sayısı (sidebar badge için) */
  unreadCounts: Record<string, number>
  /** Aktif TC grubunun banlı anahtarları (s:<sessionId> / v:<visitorId>) */
  bannedKeys: Set<string>

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
  /** Tek mesaj ekler (REST gönderim yanıtı için optimistic insert; id ile dedup) */
  addMessage: (groupId: string, message: ChatMessage) => void
  markMessageDeleted: (groupId: string, messageId: string) => void
  /** Aktif grup açılışında ban listesini (listBans) set eder */
  setBannedKeys: (keys: Set<string>) => void
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
  connectedSeq: 0,
  activeGroupId: null,
  activeGroupTenantId: null,
  activeTenantToken: null,
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
  notificationSignal: null,
  notificationSeq: 0,
  notificationUnreadCount: null,
  unreadCounts: {},
  bannedKeys: new Set<string>(),

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

      // Her (yeniden) bağlanmadan önce token'ı tazele. Token süresi dolduğunda
      // (örn. heartbeat sırasında server bağlantıyı kapatınca) STOMP eski token'la
      // yeniden bağlanmaya çalışır; burada sessizce /api/auth/refresh ile yenileyip
      // yeni token'la bağlanırız → logout olmadan. HttpOnly refreshToken proxy'de
      // server-side okunur, HttpOnly cookie'ler korunur.
      beforeConnect: async () => {
        let accessToken = getGlobalCookies()[CookieEnum.ACCESS_TOKEN]
        const expiredDate = Number(getGlobalCookies()[CookieEnum.EXPIRED_DATE])
        const needsRefresh =
          !accessToken ||
          !Number.isFinite(expiredDate) ||
          Date.now() >= expiredDate - 5000

        if (needsRefresh) {
          try {
            const res = await refreshAccessToken()
            accessToken =
              res.data?.token ?? getGlobalCookies()[CookieEnum.ACCESS_TOKEN]
          } catch {
            // refresh gerçekten başarısız (refreshToken da geçersiz) → oturum bitti
            if (
              typeof window !== 'undefined' &&
              !window.location.pathname.startsWith('/login')
            ) {
              window.location.replace('/api/auth/logout')
            }
            return
          }
        }

        if (accessToken) {
          client.connectHeaders = { Authorization: `Bearer ${accessToken}` }
        }
      },

      onConnect: (_frame: IFrame) => {
        // connectedSeq her başarılı bağlantıda artar → ChatSidebar abonelik
        // effect'i, `connected` zaten true kalmış olsa bile yeniden tetiklenir.
        set(s => ({ connected: true, connectedSeq: s.connectedSeq + 1 }))

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
          // Bildirimler — chat ile aynı WS bağlantısı (yeni bağlantı yok)
          client.subscribe('/user/queue/notifications', msg => {
            try {
              const n: AppNotification = JSON.parse(msg.body)
              set(s => ({
                notificationSignal: n,
                notificationSeq: s.notificationSeq + 1,
              }))
            } catch {
              // ignore parse errors
            }
          }),
          client.subscribe('/user/queue/notifications/unread-count', msg => {
            try {
              const data = JSON.parse(msg.body) as { count: number }
              set({ notificationUnreadCount: data.count })
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
      activeTenantToken: null,
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
      notificationSignal: null,
      notificationSeq: 0,
      notificationUnreadCount: null,
    })
  },

  subscribeToGroup: (groupId: string, tenantId?: string | null) => {
    // Grup değişiminde token + ban listesini sıfırla — ChatWindow yeniden yükler.
    set({
      activeGroupId: groupId,
      activeGroupTenantId: tenantId ?? null,
      activeTenantToken: null,
      bannedKeys: new Set<string>(),
    })

    const { client } = get()
    if (client?.connected) {
      attachActiveGroupSubs(client, groupId, tenantId ?? null, set)
    }

    // TC grubu için tenant-switch JWT al (async, fire-and-forget)
    if (tenantId) {
      getTenantTokenService(tenantId)
        .then(token => {
          // Kullanıcı başka gruba geçtiyse eski token'ı yazma
          if (get().activeGroupId === groupId) {
            set({ activeTenantToken: token })
          }
        })
        .catch(() => {})
    }
  },

  unsubscribeFromGroup: () => {
    const { activeGroupSubs } = get()
    activeGroupSubs.forEach(s => s.unsubscribe())
    set({
      activeGroupId: null,
      activeGroupTenantId: null,
      activeTenantToken: null,
      activeGroupSubs: [],
    })
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

            // Mesaj geldi → gönderenin "yazıyor"unu hemen temizle (userId ile)
            const typingMap = new Map(s.typingUsers[group.id] ?? [])
            if (data.senderId != null) typingMap.delete(data.senderId)

            return {
              messages: {
                ...s.messages,
                [group.id]: [...existing, data],
              },
              typingUsers: { ...s.typingUsers, [group.id]: typingMap },
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

  addMessage: (groupId, message) => {
    set(s => {
      // Gönderince kendi "yazıyor"unu da temizle (userId ile)
      const typingMap = new Map(s.typingUsers[groupId] ?? [])
      if (message.senderId != null) typingMap.delete(message.senderId)
      return {
        messages: {
          ...s.messages,
          [groupId]: mergeChatMessages(s.messages[groupId] ?? [], [message]),
        },
        typingUsers: { ...s.typingUsers, [groupId]: typingMap },
      }
    })
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

  setBannedKeys: keys => set({ bannedKeys: keys }),
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

  // Aktif grubun mesajları — allGroupSubs zamanlamasından bağımsız garanti.
  // Aynı mesaj allGroupSubs'tan da gelebilir; id ile dedup edilir (çift yok).
  subs.push(
    client.subscribe(baseTopic, msg => {
      try {
        const data: ChatMessage = JSON.parse(msg.body)
        set(s => {
          const existing = s.messages[groupId] ?? []
          if (existing.some(m => m.id === data.id)) return s
          // Mesaj geldi → gönderenin "yazıyor"unu temizle (userId ile)
          const typingMap = new Map(s.typingUsers[groupId] ?? [])
          if (data.senderId != null) typingMap.delete(data.senderId)
          return {
            messages: { ...s.messages, [groupId]: [...existing, data] },
            typingUsers: { ...s.typingUsers, [groupId]: typingMap },
          }
        })
      } catch {
        // ignore parse errors
      }
    }),
  )

  subs.push(
    client.subscribe(`${baseTopic}/typing`, msg => {
      const data: ChatTyping = JSON.parse(msg.body)
      set(s => {
        const map = new Map(s.typingUsers[groupId] ?? [])
        if (data.typing) {
          map.set(data.userId, data.username)
          setTimeout(() => {
            set(prev => {
              const m = new Map(prev.typingUsers[groupId] ?? [])
              m.delete(data.userId)
              return { typingUsers: { ...prev.typingUsers, [groupId]: m } }
            })
          }, 2500)
        } else {
          map.delete(data.userId)
        }
        return { typingUsers: { ...s.typingUsers, [groupId]: map } }
      })
    }),
  )

  subs.push(
    client.subscribe(`${baseTopic}/read`, _msg => {
      // okundu göstergesi — genişletilebilir
    }),
  )

  // Ban/unban olayları — yalnızca TC grupları (tenantId var). Mesaj listesine
  // DOKUNMA; sadece bannedKeys'i günceller (rozet + input kilidi için).
  if (tenantId) {
    subs.push(
      client.subscribe(`${baseTopic}/bans`, msg => {
        try {
          const ev: ChatBanEvent = JSON.parse(msg.body)
          const key = banKey(ev.sessionId, ev.visitorId)
          if (!key) return
          set(s => {
            const next = new Set(s.bannedKeys)
            if (ev.action === 'BANNED') next.add(key)
            else next.delete(key)
            return { bannedKeys: next }
          })
        } catch {
          // ignore parse errors
        }
      }),
    )
  }

  // Önceki aktif grup sub'larını temizle
  set(s => {
    s.activeGroupSubs.forEach(sub => sub.unsubscribe())
    return { activeGroupSubs: subs }
  })
}
