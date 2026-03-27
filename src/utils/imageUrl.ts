/**
 * Görsel URL'lerini işleyen helper fonksiyon
 * Eğer URL http veya https ile başlamıyorsa, NEXT_PUBLIC_API değerini başına ekler
 */
export function getImageUrl(path: string | undefined | null): string {
  if (!path) {
    return '/placeholder.jpg'
  }

  // Zaten tam URL ise olduğu gibi döndür
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Data URL ise olduğu gibi döndür
  if (path.startsWith('data:')) {
    return path
  }

  // API base URL'i al
  const apiBaseUrl = process.env.NEXT_PUBLIC_API || ''

  // Path'in başında / yoksa ekle
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${apiBaseUrl}${normalizedPath}`
}

/**
 * Banner images objesi için tüm URL'leri işler
 */
export function getBannerImageUrls(
  images:
    | {
        desktop?: string
        tablet?: string
        mobile?: string
      }
    | null
    | undefined,
): {
  desktop: string
  tablet: string
  mobile: string
} {
  return {
    desktop: getImageUrl(images?.desktop),
    tablet: getImageUrl(images?.tablet),
    mobile: getImageUrl(images?.mobile),
  }
}
