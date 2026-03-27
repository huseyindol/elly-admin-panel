import BaseAdminLayout from '@/app/(admin)/admin/_components/_layouts/BaseAdminLayout'

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return <BaseAdminLayout>{children}</BaseAdminLayout>
}

export default AdminLayout
