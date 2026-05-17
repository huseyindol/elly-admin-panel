import type { Field } from '@/types/form'

/**
 * Form payload'undaki ham değeri, ilgili field tanımına göre kullanıcı
 * dostu bir string'e çevirir.
 *
 * Kurallar:
 *   - null / undefined / boş → "—"
 *   - Dizi (multi_checkbox vb.) → option label'larıyla virgülle birleştir
 *   - select / radio → option label'ını bul
 *   - boolean → "Evet" / "Hayır"
 *   - diğer → String(value)
 */
export function formatPayloadValue(
  value: unknown,
  field: Field | undefined,
): string {
  if (value === null || value === undefined || value === '') return '—'

  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    if (!field?.options) return value.map(v => String(v)).join(', ')
    return value
      .map(
        v =>
          field.options?.find(o => String(o.value) === String(v))?.label ??
          String(v),
      )
      .join(', ')
  }

  if (field?.options) {
    const match = field.options.find(o => String(o.value) === String(value))
    if (match) return match.label
  }

  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır'

  return String(value)
}
