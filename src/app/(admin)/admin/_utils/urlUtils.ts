/**
 * Helper function to handle image URLs
 * @param url - The image URL path
 * @returns Full URL with API base if needed
 */
export const getImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${process.env.NEXT_PUBLIC_API}/${url}`
}
