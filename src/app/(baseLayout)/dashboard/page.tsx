'use client'

import { Icons, StatsGrid, type StatData } from '@/app/_components'
import { useAdminTheme } from '@/app/_hooks'
import { getEmailLogsService } from '@/app/_services/email-logs.services'
import { getFormsSummaryService } from '@/app/_services/forms.services'
import { getActiveMailAccountsService } from '@/app/_services/mail-accounts.services'
import { getMyGroupsService } from '@/app/_services/chat.services'
import { getPostsSummaryService } from '@/app/_services/posts.services'
import { getUsersService } from '@/app/_services/users.services'
import type { EmailLogStatus } from '@/types/cms'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

const fmt = (n?: number) =>
  n == null ? '—' : new Intl.NumberFormat('tr-TR').format(n)

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const EMAIL_STATUS_LABEL: Record<EmailLogStatus, string> = {
  SENT: 'Gönderildi',
  FAILED: 'Başarısız',
  PENDING: 'Beklemede',
}

export default function DashboardPage() {
  const { isDarkMode } = useAdminTheme()

  const posts = useQuery({
    queryKey: ['dashboard', 'posts'],
    queryFn: async () => (await getPostsSummaryService()).data,
  })
  const forms = useQuery({
    queryKey: ['dashboard', 'forms'],
    queryFn: async () => (await getFormsSummaryService()).data,
  })
  const users = useQuery({
    queryKey: ['dashboard', 'users'],
    queryFn: async () => (await getUsersService()).data,
  })
  const activeMail = useQuery({
    queryKey: ['dashboard', 'active-mail'],
    queryFn: async () => (await getActiveMailAccountsService()).data,
  })
  const chatGroups = useQuery({
    queryKey: ['dashboard', 'chat-groups'],
    queryFn: () => getMyGroupsService(),
  })
  const emails = useQuery({
    queryKey: ['dashboard', 'emails'],
    queryFn: () => getEmailLogsService({ size: 8 }),
  })

  const stats: StatData[] = [
    {
      title: 'Yazılar',
      value: fmt(posts.data?.length),
      icon: Icons.File,
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      title: 'Formlar',
      value: fmt(forms.data?.length),
      icon: Icons.ClipboardList,
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'Kullanıcılar',
      value: fmt(users.data?.length),
      icon: Icons.Users,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Aktif Mail Hesabı',
      value: fmt(activeMail.data?.length),
      icon: Icons.AtSign,
      gradient: 'from-orange-500 to-rose-500',
    },
    {
      title: 'Chat Grupları',
      value: fmt(chatGroups.data?.length),
      icon: Icons.MessageSquare,
      gradient: 'from-fuchsia-500 to-pink-600',
    },
    {
      title: 'E-postalar',
      value: fmt(emails.data?.totalElements),
      icon: Icons.Inbox,
      gradient: 'from-amber-500 to-orange-600',
    },
  ]

  const cardClass = `rounded-2xl p-5 ${
    isDarkMode
      ? 'border border-slate-800/50 bg-slate-900/60'
      : 'border border-gray-200 bg-white'
  }`
  const mutedClass = isDarkMode ? 'text-slate-400' : 'text-gray-500'

  const recentPosts = posts.data?.slice(0, 8) ?? []
  const recentEmails = emails.data?.content ?? []

  return (
    <div className="space-y-6 p-6">
      {/* Stat Cards */}
      <StatsGrid stats={stats} />

      {/* Lists */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Son E-postalar */}
        <section className={cardClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2
              className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Son E-postalar
            </h2>
            <Link
              href="/email-logs"
              className="text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              Tümü →
            </Link>
          </div>

          {emails.isLoading && (
            <p className={`py-6 text-center text-sm ${mutedClass}`}>
              Yükleniyor...
            </p>
          )}
          {!emails.isLoading && recentEmails.length === 0 && (
            <p className={`py-6 text-center text-sm ${mutedClass}`}>
              Kayıt yok
            </p>
          )}
          <ul className="space-y-2">
            {recentEmails.map(log => (
              <li
                key={log.id}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${
                  isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}
                  >
                    {log.subject || '(konu yok)'}
                  </p>
                  <p className={`truncate text-xs ${mutedClass}`}>
                    {log.recipient} · {formatDateTime(log.createdAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    log.status === 'SENT'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : log.status === 'FAILED'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {EMAIL_STATUS_LABEL[log.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Son Yazılar */}
        <section className={cardClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2
              className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Son Yazılar
            </h2>
            <Link
              href="/posts"
              className="text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              Tümü →
            </Link>
          </div>

          {posts.isLoading && (
            <p className={`py-6 text-center text-sm ${mutedClass}`}>
              Yükleniyor...
            </p>
          )}
          {!posts.isLoading && recentPosts.length === 0 && (
            <p className={`py-6 text-center text-sm ${mutedClass}`}>
              Kayıt yok
            </p>
          )}
          <ul className="space-y-2">
            {recentPosts.map(post => (
              <li
                key={post.id}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${
                  isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}
                  >
                    {post.title}
                  </p>
                  <p className={`truncate text-xs ${mutedClass}`}>
                    {post.slug}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    post.status
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isDarkMode
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {post.status ? 'Yayında' : 'Taslak'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
