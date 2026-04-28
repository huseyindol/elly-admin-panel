'use client'

import {
  Column,
  DataTable,
  DualListbox,
  Modal,
  SearchInput,
} from '@/app/_components'
import { useAdminTheme, useDebounce } from '@/app/_hooks'
import { useAssignRoles, useRoles, useUsers } from '@/app/_hooks/useUsers'
import { usePermission } from '@/hooks/usePermission'
import type { AdminRole, AdminUser } from '@/types/user-management'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function UsersPage() {
  const { isDarkMode } = useAdminTheme()
  const { isSuperAdmin } = usePermission()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<AdminRole[]>([])

  // Yetki kontrolü — sadece SUPER_ADMIN
  useEffect(() => {
    if (!isSuperAdmin()) {
      redirect('/403')
    }
  }, [isSuperAdmin])

  // Fetch users & roles
  const { data: usersData, isLoading, isError, error } = useUsers()
  const { data: rolesData } = useRoles()
  const assignRoles = useAssignRoles()

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300)

  const users = usersData?.data ?? []
  const allRoles = rolesData?.data ?? []

  // Filtrele
  const filteredUsers = users.filter(
    user =>
      user.username.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(debouncedSearch.toLowerCase()),
  )

  // Rol atama modalı aç
  const handleOpenRoleModal = (user: AdminUser) => {
    setSelectedUser(user)
    // Kullanıcının mevcut rollerini bul
    const currentRoles = allRoles.filter(role => user.roles.includes(role.name))
    setSelectedRoleIds(currentRoles)
  }

  // Rol atamasını kaydet
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

  // Tablo kolonları
  const columns: Column<AdminUser>[] = [
    {
      key: 'username',
      header: 'Kullanıcı',
      render: user => (
        <div>
          <p
            className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {user.firstName} {user.lastName}
          </p>
          <p
            className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
          >
            @{user.username}
          </p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'E-posta',
      render: user => (
        <span className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
          {user.email}
        </span>
      ),
    },
    {
      key: 'roles',
      header: 'Roller',
      render: user => (
        <div className="flex flex-wrap gap-1">
          {user.roles.map(role => (
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
          {user.roles.length === 0 && (
            <span className="text-xs text-slate-500">Rol yok</span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Durum',
      render: user => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            user.isActive
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/20 text-rose-400'
          }`}
        >
          {user.isActive ? 'Aktif' : 'Pasif'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Kayıt Tarihi',
      render: user => (
        <span
          className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          {new Date(user.createdAt).toLocaleDateString('tr-TR')}
        </span>
      ),
    },
  ]

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Kullanıcı Yönetimi
            </h1>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
              Kullanıcıları görüntüleyin ve rol atayın
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Kullanıcı ara..."
          />
        </div>

        {/* Data Table */}
        {isError ? (
          <div
            className={`rounded-xl p-4 ${
              isDarkMode
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            Hata: {error?.message || 'Kullanıcılar yüklenirken bir hata oluştu'}
          </div>
        ) : (
          <DataTable
            data={filteredUsers}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={user => String(user.id)}
            emptyMessage="Kullanıcı bulunamadı"
            actions={{
              onEdit: user => handleOpenRoleModal(user),
            }}
          />
        )}
      </div>

      {/* Rol Atama Modalı */}
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
            rolleri seçin. Mevcut roller sağ tarafta görünür.
          </p>

          <DualListbox
            available={allRoles}
            selected={selectedRoleIds}
            onChange={setSelectedRoleIds}
            label="Roller"
            getItemLabel={role => role.name}
            getItemSubLabel={role => role.description}
            emptyLeftText="Tüm roller atanmış"
            emptyRightText="Rol seçin"
          />

          {/* Warning for SET semantics */}
          <div
            className={`rounded-lg p-3 text-xs ${
              isDarkMode
                ? 'bg-amber-500/10 text-amber-300'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            ⚠️ Kaydedildiğinde kullanıcının <strong>tüm rolleri</strong>{' '}
            yukarıdaki seçimle değiştirilir.
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedUser(null)
                setSelectedRoleIds([])
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleAssignRoles}
              disabled={assignRoles.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
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
