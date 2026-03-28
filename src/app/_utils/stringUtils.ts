/**
 * String utility functions for admin panel
 */

/**
 * Turkish character mapping for slug generation
 */
const TURKISH_CHAR_MAP: Record<string, string> = {
  ğ: 'g',
  ü: 'u',
  ş: 's',
  ı: 'i',
  ö: 'o',
  ç: 'c',
  Ğ: 'G',
  Ü: 'U',
  Ş: 'S',
  İ: 'I',
  Ö: 'O',
  Ç: 'C',
}

/**
 * Replace Turkish characters with their ASCII equivalents
 */
function replaceTurkishChars(text: string): string {
  let result = text
  for (const [turkish, ascii] of Object.entries(TURKISH_CHAR_MAP)) {
    result = result.replaceAll(turkish, ascii)
  }
  return result
}

/**
 * Generate a URL-friendly slug from a title
 * Handles Turkish characters, removes special characters, and normalizes spaces/dashes
 *
 * @param title - The title to convert to a slug
 * @returns A URL-friendly slug
 *
 * @example
 * generateSlug('Merhaba Dünya!') // 'merhaba-dunya'
 * generateSlug('Türkçe Başlık') // 'turkce-baslik'
 */
export function generateSlug(title: string): string {
  return replaceTurkishChars(title)
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-')
    .trim()
}
