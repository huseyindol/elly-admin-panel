'use client'

import { Modal } from '@/app/_components'
import { useAdminTheme } from '@/app/_hooks'
import { createGroupService } from '@/app/_services/chat.services'
import type { ChatGroup } from '@/types/chat'
import { useMyRoleLevel, visibilityLabel } from '@/utils/chat-role'
import { getGlobalCookies } from '@/context/CookieContext'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: (group: ChatGroup) => void
}

type Scope = 'ADMIN' | 'TENANT'

export function CreateGroupDialog({ isOpen, onClose, onCreated }: Props) {
  const { isDarkMode } = useAdminTheme()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<Scope>('ADMIN')
  const [visitorAccess, setVisitorAccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const myLevel = useMyRoleLevel()
  // TC tenant'ı oturum cookie'sinden gelir; kullanıcı değiştiremez.
  const sessionTenantId = getGlobalCookies()[CookieEnum.TENANT_ID] || ''

  const inputClass = `w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500/30 ${
    isDarkMode
      ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500/50'
      : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-violet-300'
  }`

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Grup adı zorunlu'
    if (scope === 'TENANT' && !sessionTenantId)
      errs.tenantId = 'Oturumunuzda tenant bilgisi yok; TC grubu oluşturulamaz'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setScope('ADMIN')
    setVisitorAccess(false)
    setErrors({})
    onClose()
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const group = await createGroupService({
        name: name.trim(),
        description: description.trim() || undefined,
        ...(scope === 'TENANT' && {
          tenantId: sessionTenantId,
          visitorAccess,
        }),
      })
      onCreated(group)
      handleClose()
    } catch {
      // hata sessizce geçilir
    } finally {
      setLoading(false)
    }
  }

  const radioClass = (selected: boolean) =>
    `flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
      selected
        ? isDarkMode
          ? 'border-violet-500/50 bg-violet-500/10 text-white'
          : 'border-violet-300 bg-violet-50 text-gray-900'
        : isDarkMode
          ? 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
    }`

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Yeni Grup Oluştur">
      <div className="space-y-4">
        {/* Grup Adı */}
        <div>
          <label
            className={`mb-1.5 block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
          >
            Grup Adı <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="Grup adı girin"
            value={name}
            onChange={e => {
              setName(e.target.value)
              if (errors.name) setErrors(p => ({ ...p, name: '' }))
            }}
            className={inputClass}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-400">{errors.name}</p>
          )}
        </div>

        {/* Açıklama */}
        <div>
          <label
            className={`mb-1.5 block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
          >
            Açıklama{' '}
            <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>
              (isteğe bağlı)
            </span>
          </label>
          <textarea
            placeholder="Grup açıklaması"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Kapsam — sadece ADMIN+ için TC seçeneği */}
        <div>
          <label
            className={`mb-2 block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
          >
            Kapsam
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className={radioClass(scope === 'ADMIN')}>
              <input
                type="radio"
                name="scope"
                value="ADMIN"
                checked={scope === 'ADMIN'}
                onChange={() => {
                  setScope('ADMIN')
                  setVisitorAccess(false)
                  setErrors(p => ({ ...p, tenantId: '' }))
                }}
                className="sr-only"
              />
              <span
                className={`h-3 w-3 shrink-0 rounded-full border-2 ${
                  scope === 'ADMIN'
                    ? 'border-violet-500 bg-violet-500'
                    : isDarkMode
                      ? 'border-slate-500'
                      : 'border-gray-400'
                }`}
              />
              <span>
                <span className="block text-xs font-semibold">Admin Chat</span>
                <span
                  className={`block text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                >
                  Admin panelde görünür
                </span>
              </span>
            </label>

            {/* TC seçeneği yalnızca ADMIN+ (myLevel >= 3) */}
            {myLevel >= 3 && (
              <label className={radioClass(scope === 'TENANT')}>
                <input
                  type="radio"
                  name="scope"
                  value="TENANT"
                  checked={scope === 'TENANT'}
                  onChange={() => setScope('TENANT')}
                  className="sr-only"
                />
                <span
                  className={`h-3 w-3 shrink-0 rounded-full border-2 ${
                    scope === 'TENANT'
                      ? 'border-emerald-500 bg-emerald-500'
                      : isDarkMode
                        ? 'border-slate-500'
                        : 'border-gray-400'
                  }`}
                />
                <span>
                  <span className="block text-xs font-semibold">
                    Tenant Chat
                  </span>
                  <span
                    className={`block text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                  >
                    Tenant DB'sine kaydedilir
                  </span>
                </span>
              </label>
            )}
          </div>
        </div>

        {/* TC alanları — scope TENANT seçiliyse */}
        {scope === 'TENANT' && (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="tc-tenant"
                className={`mb-1.5 block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
              >
                Tenant <span className="text-rose-400">*</span>
              </label>
              <input
                id="tc-tenant"
                type="text"
                value={sessionTenantId}
                readOnly
                placeholder="(oturumda tenant bilgisi yok)"
                className={`${inputClass} cursor-not-allowed opacity-80`}
              />
              <p
                className={`mt-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
              >
                Oturumunuzdaki tenant otomatik kullanılır.
              </p>
              {errors.tenantId && (
                <p className="mt-1 text-xs text-rose-400">{errors.tenantId}</p>
              )}
            </div>

            <label
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={visitorAccess}
                onChange={e => setVisitorAccess(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
              />
              <span>
                <span
                  className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
                >
                  Ziyaretçilere açık
                </span>
                <span
                  className={`block text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                >
                  Website ziyaretçileri de bu gruba yazabilir
                </span>
              </span>
            </label>
          </div>
        )}

        {/* Görünürlük bilgisi — AC için */}
        {scope === 'ADMIN' && (
          <p
            className={`rounded-lg px-3 py-2 text-xs ${
              isDarkMode
                ? 'bg-slate-800 text-slate-400'
                : 'bg-gray-50 text-gray-500'
            }`}
          >
            Bu grup otomatik olarak <strong>{visibilityLabel(myLevel)}</strong>{' '}
            görünürlüğünde oluşturulacak.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
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
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Oluşturuluyor...
              </>
            ) : (
              'Oluştur'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
