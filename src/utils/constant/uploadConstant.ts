/**
 * Upload uzantı allowlist'i — backend FileService ile hizalı
 * (application.properties: file.upload.allowed-extensions). Aktif içerik
 * (svg/html/js/…) bilinçli olarak YOK: /assets/** anonim servis edildiği için
 * stored-XSS/RCE yüzeyi. Backend tarafı değişirse burayı da senkron güncelle.
 */
export const UPLOAD_ALLOWED_EXTENSIONS =
  '.jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.mp4,.wav,.webm,.zip'

/** Banner görsel upload'ı (backend saveImage) — allowlist'in resim alt kümesi. */
export const IMAGE_UPLOAD_ALLOWED_EXTENSIONS = '.jpg,.jpeg,.png,.gif,.webp'
