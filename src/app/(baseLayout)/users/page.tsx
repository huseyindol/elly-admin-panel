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
  useCreateTenantUser,
  useDeleteTenantUser,
  useRoles,
  useTenantUsers,
  useUpdateTenantUser,
  useUpdateTenantUserStatus,
  useUserProfile,
  useUsers,
} from '@/app/_hooks/useUsers'
import { usePermission } from '@/hooks/usePermission'
import type { AdminRole, AdminUser, TenantUser } from '@/types/user-management'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

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
          Admin ve tenant kullanıcılarını yönetin
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
            {tab === 'admin' ? 'Admin Kullanıcıları' : 'Tenant Kullanıcıları'}
          </button>
        ))}
      </div>

      {activeTab === 'admin' ? <AdminUsersTab /> : <TenantUsersTab />}
    </div>
  )
}

/* ───────────────────── Admin Users Tab ───────────────────── */
function AdminUsersTab() {
  const { isDarkMode } = useAdminTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<AdminRole[]>([])

  const { data: usersData, isLoading, isError, error } = useUsers()
  const { data: rolesData } = useRoles()
  const assignRoles = useAssignRoles()

  const debouncedSearch = useDebounce(searchQuery, 300)
  const users = usersData?.data ?? []
  const allRoles = rolesData?.data ?? []

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

  const handleAssignRoles = () => {
    if (!selectedUser) return
    assignRoles.mutate(
      {
        userId: selectedUser.id,
        data: { roleIds: selectedRoleIds.map(r => r.id) },
      },
      {
        onSuccess: () => {
          setSelectedUser(null)
          setSelectedRoleIds([])
        },
      },
    )
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

  return (
    <>
      <div className="max-w-md">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Kullanıcı ara..."
        />
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
          emptyMessage="Kullanıcı bulunamadı"
          actions={{ onEdit: u => handleOpenRoleModal(u) }}
        />
      )}

      <Modal
        isOpen={!!selectedUser}
        onClose={() => {
          setSelectedUser(null)
          setSelectedRoleIds([])
        }}
        title={`Rol Ata — ${selectedUser?.firstName ?? ''} ${selectedUser?.lastName ?? ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <p
            className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            <strong>@{selectedUser?.username}</strong> kullanıcısına atanacak
            rolleri seçin.
          </p>
          <DualListbox
            available={allRoles}
            selected={selectedRoleIds}
            onChange={setSelectedRoleIds}
            label="Roller"
            getItemLabel={r => r.name}
            getItemSubLabel={r => r.description}
            emptyLeftText="Tüm roller atanmış"
            emptyRightText="Rol seçin"
          />
          <div
            className={`rounded-lg p-3 text-xs ${isDarkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}
          >
            ⚠️ Kaydedildiğinde kullanıcının <strong>tüm rolleri</strong>{' '}
            yukarıdaki seçimle değiştirilir.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedUser(null)
                setSelectedRoleIds([])
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleAssignRoles}
              disabled={assignRoles.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 disabled:opacity-50"
            >
              {assignRoles.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Kaydediliyor...
                </>
              ) : (
                'Rolleri Kaydet'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/* ───────────────────── Tenant Users Tab ───────────────────── */

interface TenantUserFormData {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
}

interface TenantUserEditData {
  firstName: string
  lastName: string
  email: string
  isActive: boolean
}

function TenantUsersTab() {
  const { isDarkMode } = useAdminTheme()
  const { data: profileData } = useUserProfile()
  const managedTenants = profileData?.data?.managedTenants ?? []

  const activeTenantId = managedTenants[0] ?? null

  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<TenantUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<TenantUser | null>(null)

  const {
    data: tenantUsersData,
    isLoading,
    isError,
  } = useTenantUsers(activeTenantId)
  const createMutation = useCreateTenantUser(activeTenantId)
  const updateMutation = useUpdateTenantUser(activeTenantId)
  const deleteMutation = useDeleteTenantUser(activeTenantId)
  const statusMutation = useUpdateTenantUserStatus(activeTenantId)

  const createForm = useForm<TenantUserFormData>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  })
  const editForm = useForm<TenantUserEditData>({
    defaultValues: { firstName: '', lastName: '', email: '', isActive: true },
  })

  const tenantUsers = tenantUsersData?.data ?? []

  const handleCreateSubmit = (data: TenantUserFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setCreateOpen(false)
        createForm.reset()
      },
    })
  }

  const handleEditOpen = (user: TenantUser) => {
    setEditUser(user)
    editForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isActive: user.isActive,
    })
  }

  const handleEditSubmit = (data: TenantUserEditData) => {
    if (!editUser) return
    updateMutation.mutate(
      { userId: editUser.id, data },
      { onSuccess: () => setEditUser(null) },
    )
  }

  const handleDelete = () => {
    if (!deleteUser) return
    deleteMutation.mutate(deleteUser.id, {
      onSuccess: () => setDeleteUser(null),
    })
  }

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`
  const labelClass = `block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`

  const columns: Column<TenantUser>[] = [
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
          onClick={() =>
            statusMutation.mutate({ userId: u.id, isActive: !u.isActive })
          }
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-70 ${
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

  return (
    <div className="space-y-4">
      {/* Kullanıcı listesi */}
      {activeTenantId && (
        <>
          <div className="flex items-center justify-between">
            <p
              className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
            >
              <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                {activeTenantId}
              </strong>{' '}
              tenant kullanıcıları
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow"
            >
              + Yeni Kullanıcı
            </button>
          </div>

          {isError ? (
            <div
              className={`rounded-xl p-4 ${isDarkMode ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700'}`}
            >
              Kullanıcılar yüklenirken hata oluştu.
            </div>
          ) : (
            <DataTable
              data={tenantUsers}
              columns={columns}
              isLoading={isLoading}
              keyExtractor={u => String(u.id)}
              emptyMessage="Bu tenant'ta kullanıcı bulunamadı"
              actions={{
                onEdit: u => handleEditOpen(u),
                onDelete: u => setDeleteUser(u),
              }}
            />
          )}
        </>
      )}

      {/* Create Modal */}
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
          onSubmit={createForm.handleSubmit(handleCreateSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Ad *</label>
              <input
                {...createForm.register('firstName', { required: true })}
                className={inputClass}
                placeholder="Ad"
              />
            </div>
            <div>
              <label className={labelClass}>Soyad *</label>
              <input
                {...createForm.register('lastName', { required: true })}
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
              {...createForm.register('password', {
                required: true,
                minLength: 6,
              })}
              className={inputClass}
              placeholder="Min. 6 karakter"
            />
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
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {createMutation.isPending ? (
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

      {/* Edit Modal */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title={`Düzenle — @${editUser?.username ?? ''}`}
        size="md"
      >
        <form
          onSubmit={editForm.handleSubmit(handleEditSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Ad</label>
              <input
                {...editForm.register('firstName')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Soyad</label>
              <input
                {...editForm.register('lastName')}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>E-posta</label>
            <input
              type="email"
              {...editForm.register('email')}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="edit-isActive"
              type="checkbox"
              {...editForm.register('isActive')}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-violet-500"
            />
            <label
              htmlFor="edit-isActive"
              className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
            >
              Aktif
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditUser(null)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {updateMutation.isPending ? (
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

      {/* Delete Confirm */}
      <DestructiveConfirmDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Kullanıcıyı Sil"
        description={`@${deleteUser?.username ?? ''} kullanıcısı kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        expectedText={deleteUser?.username ?? ''}
        confirmText="Evet, Sil"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
