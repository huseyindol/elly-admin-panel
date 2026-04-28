'use client'

import { useAdminTheme } from '@/app/_hooks'
import { useUserProfile } from '@/app/_hooks/useUsers'
import { Icons } from '@/app/_components/Icons'
import { usePermissionStore } from '@/stores/permission-store'
import { MODULES } from '@/types/permissions'

/** Modül adını Türkçe'ye çeviren yardımcı */
const moduleLabels: Record<string, string> = {
  [MODULES.POSTS]: 'Yazılar',
  [MODULES.PAGES]: 'Sayfalar',
  [MODULES.COMPONENTS]: 'Bileşenler',
  [MODULES.WIDGETS]: "Widget'lar",
  [MODULES.BANNERS]: "Banner'lar",
  [MODULES.ASSETS]: 'Medya',
  [MODULES.COMMENTS]: 'Yorumlar',
  [MODULES.FORMS]: 'Formlar',
  [MODULES.RATINGS]: 'Puanlamalar',
  [MODULES.CONTENTS]: 'İçerikler',
  [MODULES.BASIC_INFOS]: 'Temel Bilgiler',
  [MODULES.MAIL]: 'Mail Hesapları',
  [MODULES.EMAILS]: 'E-postalar',
  [MODULES.EMAIL_TEMPLATES]: 'E-posta Şablonları',
  [MODULES.CACHE]: 'Cache',
  [MODULES.TENANTS]: "Tenant'lar",
  [MODULES.USERS]: 'Kullanıcılar',
  [MODULES.ROLES]: 'Roller',
  [MODULES.RABBIT]: 'RabbitMQ',
}

/** İzinleri modül bazında grupla */
function groupPermissionsByModule(permissions: string[]) {
  const groups: Record<string, string[]> = {}
  for (const perm of permissions) {
    const [module, action] = perm.split(':')
    if (!groups[module]) groups[module] = []
    groups[module].push(action)
  }
  return groups
}

/** Rol adını Türkçe etikete çevir */
function getRoleLabel(roles: string[]): string {
  if (roles.includes('SUPER_ADMIN')) return 'Süper Admin'
  if (roles.includes('ADMIN')) return 'Admin'
  if (roles.includes('EDITOR')) return 'Editör'
  if (roles.includes('VIEWER')) return 'Görüntüleyici'
  return roles.length > 0 ? roles[0] : 'Kullanıcı'
}

/** Rol adından badge CSS class'ı döndür */
function getRoleBadgeClass(role: string): string {
  const classMap: Record<string, string> = {
    SUPER_ADMIN: 'bg-violet-500/20 text-violet-300',
    ADMIN: 'bg-blue-500/20 text-blue-300',
    EDITOR: 'bg-emerald-500/20 text-emerald-300',
  }
  return classMap[role] ?? 'bg-slate-500/20 text-slate-300'
}

export default function ProfilePage() {
  const { isDarkMode } = useAdminTheme()
  const { data, isLoading, isError } = useUserProfile()
  const permissions = usePermissionStore(s => s.permissions)
  const roles = usePermissionStore(s => s.roles)

  const profile = data?.data

  // İzinleri grupla
  const permissionGroups = groupPermissionsByModule(permissions)
  const sortedModules = Object.keys(permissionGroups).sort((a, b) =>
    a.localeCompare(b),
  )

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-violet-500 border-t-transparent" />
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
            Profil yükleniyor...
          </span>
        </div>
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="p-6">
        <div
          className={`rounded-xl p-4 ${
            isDarkMode
              ? 'bg-rose-500/20 text-rose-300'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          Profil bilgileri yüklenirken bir hata oluştu.
        </div>
      </div>
    )
  }

  const roleLabel = getRoleLabel(roles)

  const initials =
    `${profile.firstName?.charAt(0) ?? ''}${profile.lastName?.charAt(0) ?? ''}`.toUpperCase() ||
    profile.username.charAt(0).toUpperCase()

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Profilim
        </h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          Hesap bilgileriniz ve izinleriniz
        </p>
      </div>

      {/* Profile Card */}
      <div
        className={`rounded-2xl p-6 ${
          isDarkMode
            ? 'border border-slate-800/50 bg-slate-900/60'
            : 'border border-gray-200 bg-white'
        }`}
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-2xl font-bold text-white shadow-lg shadow-violet-500/30">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2
              className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {profile.firstName} {profile.lastName}
            </h2>
            <p
              className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
            >
              @{profile.username}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-400">
                <Icons.Shield />
                {roleLabel}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  profile.isActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {profile.isActive ? '● Aktif' : '● Pasif'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Kişisel Bilgiler */}
        <div
          className={`rounded-2xl p-6 ${
            isDarkMode
              ? 'border border-slate-800/50 bg-slate-900/60'
              : 'border border-gray-200 bg-white'
          }`}
        >
          <h3
            className={`mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            <Icons.User />
            Kişisel Bilgiler
          </h3>
          <dl className="space-y-3">
            <InfoRow
              label="Ad"
              value={profile.firstName}
              isDarkMode={isDarkMode}
            />
            <InfoRow
              label="Soyad"
              value={profile.lastName}
              isDarkMode={isDarkMode}
            />
            <InfoRow
              label="E-posta"
              value={profile.email}
              isDarkMode={isDarkMode}
            />
            <InfoRow
              label="Kullanıcı Adı"
              value={profile.username}
              isDarkMode={isDarkMode}
            />
          </dl>
        </div>

        {/* Hesap Bilgileri */}
        <div
          className={`rounded-2xl p-6 ${
            isDarkMode
              ? 'border border-slate-800/50 bg-slate-900/60'
              : 'border border-gray-200 bg-white'
          }`}
        >
          <h3
            className={`mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            <Icons.Settings />
            Hesap Bilgileri
          </h3>
          <dl className="space-y-3">
            <InfoRow
              label="Giriş Yöntemi"
              value={
                profile.provider === 'local'
                  ? 'E-posta / Şifre'
                  : profile.provider
              }
              isDarkMode={isDarkMode}
            />
            <InfoRow
              label="Kayıt Tarihi"
              value={new Date(profile.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              isDarkMode={isDarkMode}
            />
            <InfoRow
              label="Tenant'lar"
              value={profile.managedTenants?.join(', ') || '—'}
              isDarkMode={isDarkMode}
            />
          </dl>
        </div>
      </div>

      {/* Roller */}
      <div
        className={`rounded-2xl p-6 ${
          isDarkMode
            ? 'border border-slate-800/50 bg-slate-900/60'
            : 'border border-gray-200 bg-white'
        }`}
      >
        <h3
          className={`mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          <Icons.Shield />
          Roller
        </h3>
        <div className="flex flex-wrap gap-2">
          {roles.map(role => (
            <span
              key={role}
              className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium ${getRoleBadgeClass(role)}`}
            >
              {role}
            </span>
          ))}
          {roles.length === 0 && (
            <p
              className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
            >
              Atanmış rol bulunmuyor.
            </p>
          )}
        </div>
      </div>

      {/* İzinler — Modül bazlı */}
      <div
        className={`rounded-2xl p-6 ${
          isDarkMode
            ? 'border border-slate-800/50 bg-slate-900/60'
            : 'border border-gray-200 bg-white'
        }`}
      >
        <h3
          className={`mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          <Icons.Shield />
          İzinler
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-xs font-normal ${
              isDarkMode
                ? 'bg-slate-700 text-slate-400'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {permissions.length} izin
          </span>
        </h3>

        {sortedModules.length === 0 ? (
          <p
            className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
          >
            Atanmış izin bulunmuyor.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedModules.map(module => (
              <div
                key={module}
                className={`rounded-xl p-3 ${
                  isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'
                }`}
              >
                <p
                  className={`mb-1.5 text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}
                >
                  {moduleLabels[module] ?? module}
                </p>
                <div className="flex flex-wrap gap-1">
                  {permissionGroups[module].map(action => (
                    <span
                      key={`${module}:${action}`}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                        isDarkMode
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-white text-gray-600 shadow-sm'
                      }`}
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Bilgi satırı yardımcı bileşeni */
function InfoRow({
  label,
  value,
  isDarkMode,
}: Readonly<{ label: string; value: string; isDarkMode: boolean }>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt
        className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
      >
        {label}
      </dt>
      <dd
        className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
      >
        {value || '—'}
      </dd>
    </div>
  )
}
