'use client'

import {
  Column,
  DataTable,
  DestructiveConfirmDialog,
  DualListbox,
  Modal,
  SearchInput,
} from '@/app/_components'
import { useAdminTheme, useDebounce } from '@/app/_hooks'
import {
  useAssignRoles,
  useCreateUser,
  useDeleteUser,
  useRoles,
  useSetUserStatus,
  useUpdateUser,
  useUserProfile,
  useUsers,
} from '@/app/_hooks/useUsers'
import { usePermission } from '@/hooks/usePermission'
import type {
  AdminRole,
  AdminUpdateUserRequest,
  AdminUser,
} from '@/types/user-management'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type Tab = 'admin' | 'tenant'

export default function UsersPage() {
  const { isDarkMode } = useAdminTheme()
  const { isSuperAdmin } = usePermission()
  const [activeTab, setActiveTab] = useState<Tab>('admin')

  useEffect(() => {
    if (!isSuperAdmin()) {
      redirect('/403')
    }
  }, [isSuperAdmin])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1
          className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Kullanıcı Yönetimi
        </h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          Panel kullanıcıları (SUPER_ADMIN/ADMIN/EDITOR/VIEWER) ve tenant
          kullanıcıları (TENANT) ayrı sekmelerde
        </p>
      </div>

      {/* Tabs */}
      <div
        className={`flex w-fit gap-1 rounded-xl p-1 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}
      >
        {(['admin', 'tenant'] as Tab[]).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow'
                : isDarkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'admin' ? 'Panel Kullanıcıları' : 'Tenant Kullanıcıları'}
          </button>
        ))}
      </div>

      {activeTab === 'admin' ? <AdminUsersTab /> : <TenantUsersTab />}
    </div>
  )
}

/* ───────────────────── Panel Users Tab ─────────────────────
 * Backend: GET /api/v1/users?audience=panel — SUPER_ADMIN / ADMIN / EDITOR / VIEWER.
 * TENANT rolündeki kullanıcılar bu sekmede ASLA görünmez.
 */
interface CreateAdminFormData {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
}

function AdminUsersTab() {
  const { isDarkMode } = useAdminTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<AdminRole[]>([])
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createRoles, setCreateRoles] = useState<AdminRole[]>([])

  const { data: usersData, isLoading, isError, error } = useUsers('panel')
  const { data: rolesData } = useRoles()
  const { data: profileData } = useUserProfile()
  const assignRoles = useAssignRoles()
  const deleteUser = useDeleteUser()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const currentUserId = profileData?.data?.id

  const createForm = useForm<CreateAdminFormData>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  })

  const handleCreate = (data: CreateAdminFormData) => {
    createUser.mutate(
      {
        ...data,
        roleIds:
          createRoles.length > 0 ? createRoles.map(r => r.id) : undefined,
        audience: 'panel',
      },
      {
        onSuccess: () => {
          setCreateOpen(false)
          createForm.reset()
          setCreateRoles([])
        },
      },
    )
  }

  const debouncedSearch = useDebounce(searchQuery, 300)
  const users = usersData?.data ?? []
  // Rol atama dropdown'unda yalnız panel rolleri çıksın — TENANT atanmasın.
  const allRoles = (rolesData?.data ?? []).filter(r => r.name !== 'TENANT')

  const filteredUsers = users.filter(
    u =>
      u.username.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.firstName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(debouncedSearch.toLowerCase()),
  )

  const handleOpenRoleModal = (user: AdminUser) => {
    setSelectedUser(user)
    setSelectedRoleIds(allRoles.filter(r => user.roles.includes(r.name)))
  }

  // Alanlar + roller tek modal'da kaydedilir: önce profil update, sonra rol ataması.
  // Hata olursa hook toast'ları gösterir, modal açık kalır (kullanıcı düzeltip tekrar dener).
  const handleSaveUser = async (data: AdminUpdateUserRequest) => {
    if (!selectedUser) return
    try {
      await updateUser.mutateAsync({ userId: selectedUser.id, data })
      await assignRoles.mutateAsync({
        userId: selectedUser.id,
        data: { roleIds: selectedRoleIds.map(r => r.id) },
      })
      setSelectedUser(null)
      setSelectedRoleIds([])
    } catch {
      // toast'lar hook'larda
    }
  }

  const handleDeleteUser = () => {
    if (!deleteTarget) return
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'username',
      header: 'Kullanıcı',
      render: u => (
        <div>
          <p
            className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {u.firstName} {u.lastName}
          </p>
          <p
            className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
          >
            @{u.username}
          </p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'E-posta',
      render: u => (
        <span className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
          {u.email}
        </span>
      ),
    },
    {
      key: 'roles',
      header: 'Roller',
      render: u => (
        <div className="flex flex-wrap gap-1">
          {u.roles.map(role => (
            <span
              key={role}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                role === 'SUPER_ADMIN'
                  ? 'bg-violet-500/20 text-violet-400'
                  : role === 'ADMIN'
                    ? 'bg-blue-500/20 text-blue-400'
                    : role === 'EDITOR'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-500/20 text-slate-400'
              }`}
            >
              {role}
            </span>
          ))}
          {u.roles.length === 0 && (
            <span className="text-xs text-slate-500">Rol yok</span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Durum',
      render: u => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            u.isActive
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/20 text-rose-400'
          }`}
        >
          {u.isActive ? 'Aktif' : 'Pasif'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Kayıt Tarihi',
      render: u => (
        <span
          className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          {new Date(u.createdAt).toLocaleDateString('tr-TR')}
        </span>
      ),
    },
  ]

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`
  const labelClass = `block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="max-w-md flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Kullanıcı ara..."
          />
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="whitespace-nowrap rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow"
        >
          + Yeni Admin Ekle
        </button>
      </div>

      {isError ? (
        <div
          className={`rounded-xl p-4 ${isDarkMode ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700'}`}
        >
          Hata: {error?.message || 'Kullanıcılar yüklenirken bir hata oluştu'}
        </div>
      ) : (
        <DataTable
          data={filteredUsers}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={u => String(u.id)}
          emptyMessage="Panel kullanıcısı bulunamadı"
          actions={{
            onEdit: u => handleOpenRoleModal(u),
            onDelete: u => {
              if (currentUserId === u.id) {
                toast.error('Kendi hesabınızı silemezsiniz')
                return
              }
              setDeleteTarget(u)
            },
          }}
        />
      )}

      {/* Create Admin Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false)
          createForm.reset()
          setCreateRoles([])
        }}
        title="Yeni Admin Kullanıcısı"
        size="lg"
      >
        <form
          onSubmit={createForm.handleSubmit(handleCreate)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Ad</label>
              <input
                {...createForm.register('firstName')}
                className={inputClass}
                placeholder="Ad"
              />
            </div>
            <div>
              <label className={labelClass}>Soyad</label>
              <input
                {...createForm.register('lastName')}
                className={inputClass}
                placeholder="Soyad"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Kullanıcı Adı *</label>
            <input
              {...createForm.register('username', { required: true })}
              className={inputClass}
              placeholder="kullanici_adi"
            />
          </div>
          <div>
            <label className={labelClass}>E-posta *</label>
            <input
              type="email"
              {...createForm.register('email', { required: true })}
              className={inputClass}
              placeholder="ornek@email.com"
            />
          </div>
          <div>
            <label className={labelClass}>Şifre *</label>
            <input
              type="password"
              {...createForm.register('password', { required: true })}
              className={inputClass}
              placeholder="En az 8 karakter, büyük/küçük harf + rakam"
            />
          </div>
          <div>
            <label className={labelClass}>
              Roller (boş bırakılırsa ADMIN atanır)
            </label>
            <DualListbox
              available={allRoles}
              selected={createRoles}
              onChange={setCreateRoles}
              label=""
              getItemLabel={r => r.name}
              getItemSubLabel={r => r.description}
              emptyLeftText="Tüm roller seçili"
              emptyRightText="Default: ADMIN"
            />
          </div>
          <div
            className={`rounded-lg p-3 text-xs ${isDarkMode ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'}`}
          >
            ℹ️ Kullanıcı oluşturulduktan sonra panel domain'inden doğrulama
            e-postası gönderilir. TENANT rolü bu ekrandan atanamaz (tenant
            kullanıcısı public register ile oluşur).
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setCreateOpen(false)
                createForm.reset()
                setCreateRoles([])
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createUser.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {createUser.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Oluşturuluyor...
                </>
              ) : (
                'Oluştur'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal — alanlar + roller */}
      <UserEditModal
        user={selectedUser}
        onClose={() => {
          setSelectedUser(null)
          setSelectedRoleIds([])
        }}
        onSave={handleSaveUser}
        isPending={updateUser.isPending || assignRoles.isPending}
        roles={{
          all: allRoles,
          selected: selectedRoleIds,
          onChange: setSelectedRoleIds,
        }}
      />

      {/* Delete Confirm */}
      <DestructiveConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        title="Kullanıcıyı Sil"
        description={`@${deleteTarget?.username ?? ''} kullanıcısı kalıcı olarak silinecek. Aktif oturumları sonlanır. Bu işlem geri alınamaz.`}
        expectedText={deleteTarget?.username ?? ''}
        confirmText="Evet, Sil"
        isLoading={deleteUser.isPending}
      />
    </>
  )
}

/* ───────────────────── Tenant Users Tab ─────────────────────
 * Backend: GET /api/v1/users?audience=tenant — yalnız TENANT rolündekiler.
 * Tenant kullanıcısı public /auth/register ile VEYA buradan (audience=tenant) oluşur;
 * doğrulama maili o tenant'ın kendi frontend-url domain'inden gider.
 */
function TenantUsersTab() {
  const { isDarkMode } = useAdminTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: usersData, isLoading, isError, error } = useUsers('tenant')
  const { data: profileData } = useUserProfile()
  const deleteUser = useDeleteUser()
  const setUserStatus = useSetUserStatus()
  const updateUser = useUpdateUser()
  const createUser = useCreateUser()
  const currentUserId = profileData?.data?.id

  const createForm = useForm<CreateAdminFormData>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  })

  // TENANT rolü backend'de otomatik atanır; doğrulama maili login olunan tenant'ın
  // kendi frontend-url'inden gider (per-tenant env).
  const handleCreate = (data: CreateAdminFormData) => {
    createUser.mutate(
      { ...data, audience: 'tenant' },
      {
        onSuccess: () => {
          setCreateOpen(false)
          createForm.reset()
        },
      },
    )
  }

  const handleSaveUser = async (data: AdminUpdateUserRequest) => {
    if (!editTarget) return
    try {
      await updateUser.mutateAsync({ userId: editTarget.id, data })
      setEditTarget(null)
    } catch {
      // toast hook'ta
    }
  }

  const debouncedSearch = useDebounce(searchQuery, 300)
  const users = usersData?.data ?? []
  const filteredUsers = users.filter(
    u =>
      u.username.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.firstName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(debouncedSearch.toLowerCase()),
  )

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'username',
      header: 'Kullanıcı',
      render: u => (
        <div>
          <p
            className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {u.firstName} {u.lastName}
          </p>
          <p
            className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
          >
            @{u.username}
          </p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'E-posta',
      render: u => (
        <span className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
          {u.email}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Durum',
      render: u => (
        <button
          type="button"
          disabled={setUserStatus.isPending || currentUserId === u.id}
          onClick={() => {
            if (currentUserId === u.id) {
              toast.error('Kendi hesabınızı pasifleştiremezsiniz')
              return
            }
            setUserStatus.mutate({ userId: u.id, isActive: !u.isActive })
          }}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 ${
            u.isActive
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/20 text-rose-400'
          }`}
        >
          {u.isActive ? 'Aktif' : 'Pasif'}
        </button>
      ),
    },
    {
      key: 'createdAt',
      header: 'Kayıt Tarihi',
      render: u => (
        <span
          className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          {new Date(u.createdAt).toLocaleDateString('tr-TR')}
        </span>
      ),
    },
  ]

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`
  const labelClass = `block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="max-w-md flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tenant kullanıcısı ara..."
          />
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="whitespace-nowrap rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow"
        >
          + Yeni Tenant Kullanıcısı
        </button>
      </div>

      {isError ? (
        <div
          className={`rounded-xl p-4 ${isDarkMode ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700'}`}
        >
          Hata:{' '}
          {error?.message || 'Tenant kullanıcıları yüklenirken bir hata oluştu'}
        </div>
      ) : (
        <DataTable
          data={filteredUsers}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={u => String(u.id)}
          emptyMessage="Tenant kullanıcısı bulunamadı"
          actions={{
            onEdit: u => setEditTarget(u),
            onDelete: u => {
              if (currentUserId === u.id) {
                toast.error('Kendi hesabınızı silemezsiniz')
                return
              }
              setDeleteTarget(u)
            },
          }}
        />
      )}

      {/* Create Modal — TENANT rolü otomatik; mail tenant'ın kendi domain'inden */}
      <Modal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false)
          createForm.reset()
        }}
        title="Yeni Tenant Kullanıcısı"
        size="md"
      >
        <form
          onSubmit={createForm.handleSubmit(handleCreate)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Ad</label>
              <input
                {...createForm.register('firstName')}
                className={inputClass}
                placeholder="Ad"
              />
            </div>
            <div>
              <label className={labelClass}>Soyad</label>
              <input
                {...createForm.register('lastName')}
                className={inputClass}
                placeholder="Soyad"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Kullanıcı Adı *</label>
            <input
              {...createForm.register('username', { required: true })}
              className={inputClass}
              placeholder="kullanici_adi"
            />
          </div>
          <div>
            <label className={labelClass}>E-posta *</label>
            <input
              type="email"
              {...createForm.register('email', { required: true })}
              className={inputClass}
              placeholder="ornek@email.com"
            />
          </div>
          <div>
            <label className={labelClass}>Şifre *</label>
            <input
              type="password"
              {...createForm.register('password', { required: true })}
              className={inputClass}
              placeholder="En az 8 karakter, büyük/küçük harf + rakam"
              autoComplete="new-password"
            />
          </div>
          <div
            className={`rounded-lg p-3 text-xs ${isDarkMode ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'}`}
          >
            ℹ️ Kullanıcıya TENANT rolü atanır ve doğrulama e-postası bu
            tenant'ın kendi site domain'inden gönderilir.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setCreateOpen(false)
                createForm.reset()
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createUser.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {createUser.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Oluşturuluyor...
                </>
              ) : (
                'Oluştur'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal — sadece alanlar (tenant kullanıcısına rol atanmaz) */}
      <UserEditModal
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveUser}
        isPending={updateUser.isPending}
      />

      <DestructiveConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Tenant Kullanıcısını Sil"
        description={`@${deleteTarget?.username ?? ''} kullanıcısı kalıcı olarak silinecek. Aktif oturumları sonlanır. Bu işlem geri alınamaz.`}
        expectedText={deleteTarget?.username ?? ''}
        confirmText="Evet, Sil"
        isLoading={deleteUser.isPending}
      />
    </>
  )
}

/* ───────────────────── Ortak: Kullanıcı Düzenleme Modal'ı ─────────────────────
 * Panel sekmesi roles prop'uyla rol bölümünü de gösterir; tenant sekmesi yalnız alanlar.
 * newPassword boş bırakılırsa şifre değişmez; doluysa admin şifre sıfırlaması yapılır
 * (backend eski şifre sormaz, kullanıcının açık oturumları sonlanır).
 */
interface UserEditFormData {
  username: string
  email: string
  firstName: string
  lastName: string
  newPassword: string
}

function UserEditModal({
  user,
  onClose,
  onSave,
  isPending,
  roles,
}: {
  user: AdminUser | null
  onClose: () => void
  onSave: (data: AdminUpdateUserRequest) => void
  isPending: boolean
  roles?: {
    all: AdminRole[]
    selected: AdminRole[]
    onChange: (roles: AdminRole[]) => void
  }
}) {
  const { isDarkMode } = useAdminTheme()
  const form = useForm<UserEditFormData>({
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      newPassword: '',
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        email: user.email,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        newPassword: '',
      })
    }
  }, [user, form])

  const submit = (d: UserEditFormData) => {
    onSave({
      username: d.username.trim() || undefined,
      email: d.email.trim() || undefined,
      firstName: d.firstName,
      lastName: d.lastName,
      newPassword: d.newPassword.trim() || undefined,
    })
  }

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`
  const labelClass = `block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`

  return (
    <Modal
      isOpen={!!user}
      onClose={onClose}
      title={`Düzenle — @${user?.username ?? ''}`}
      size="lg"
    >
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Ad</label>
            <input
              {...form.register('firstName')}
              className={inputClass}
              placeholder="Ad"
            />
          </div>
          <div>
            <label className={labelClass}>Soyad</label>
            <input
              {...form.register('lastName')}
              className={inputClass}
              placeholder="Soyad"
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Kullanıcı Adı</label>
          <input
            {...form.register('username')}
            className={inputClass}
            placeholder="kullanici_adi"
          />
        </div>
        <div>
          <label className={labelClass}>E-posta</label>
          <input
            type="email"
            {...form.register('email')}
            className={inputClass}
            placeholder="ornek@email.com"
          />
        </div>
        <div>
          <label className={labelClass}>
            Yeni Şifre (boş bırakılırsa değişmez)
          </label>
          <input
            type="password"
            {...form.register('newPassword')}
            className={inputClass}
            placeholder="En az 8 karakter, büyük/küçük harf + rakam"
            autoComplete="new-password"
          />
        </div>
        {roles && (
          <div>
            <label className={labelClass}>Roller</label>
            <DualListbox
              available={roles.all}
              selected={roles.selected}
              onChange={roles.onChange}
              label=""
              getItemLabel={r => r.name}
              getItemSubLabel={r => r.description}
              emptyLeftText="Tüm roller atanmış"
              emptyRightText="Rol seçin"
            />
            <p
              className={`mt-2 rounded-lg p-3 text-xs ${isDarkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}
            >
              ⚠️ Kaydedildiğinde kullanıcının <strong>tüm rolleri</strong>{' '}
              yukarıdaki seçimle değiştirilir.
            </p>
          </div>
        )}
        <div
          className={`rounded-lg p-3 text-xs ${isDarkMode ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'}`}
        >
          ℹ️ Şifre sıfırlanırsa kullanıcının açık oturumları sonlanır ve yeni
          şifreyle giriş yapması gerekir.
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Kaydediliyor...
              </>
            ) : (
              'Kaydet'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
