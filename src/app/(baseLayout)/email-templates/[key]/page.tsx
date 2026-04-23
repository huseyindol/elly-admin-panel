import { redirect } from 'next/navigation'

// v4 backend deploy edilene kadar bu sayfa devre dışı
export default function EmailTemplateDetailPage() {
  redirect('/email-templates')
}
