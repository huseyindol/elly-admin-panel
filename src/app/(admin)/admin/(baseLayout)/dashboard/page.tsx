'use client'

import {
  Activity,
  ActivityFeed,
  Icons,
  Order,
  Product,
  RecentOrders,
  RevenueChart,
  StatData,
  StatsGrid,
  TopProducts,
} from '@/app/(admin)/admin/_components'

// Sample Data - İleride DB'den gelecek
const statsData: StatData[] = [
  {
    title: 'Toplam Gelir',
    value: '₺847,291',
    change: '+12.5%',
    trend: 'up',
    icon: Icons.DollarSign,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Aktif Kullanıcılar',
    value: '24,847',
    change: '+4.3%',
    trend: 'up',
    icon: Icons.Users,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    title: 'Toplam Sipariş',
    value: '12,543',
    change: '-2.1%',
    trend: 'down',
    icon: Icons.ShoppingCart,
    gradient: 'from-orange-500 to-rose-500',
  },
  {
    title: 'Sayfa Görüntülenme',
    value: '1.2M',
    change: '+18.7%',
    trend: 'up',
    icon: Icons.Eye,
    gradient: 'from-cyan-500 to-blue-600',
  },
]

const recentOrders: Order[] = [
  {
    id: '#ORD-7291',
    customer: 'Ahmet Yılmaz',
    product: "MacBook Pro 14''",
    amount: '₺42,999',
    status: 'Tamamlandı',
    avatar: 'AY',
  },
  {
    id: '#ORD-7290',
    customer: 'Elif Demir',
    product: 'iPhone 15 Pro',
    amount: '₺64,999',
    status: 'Beklemede',
    avatar: 'ED',
  },
  {
    id: '#ORD-7289',
    customer: 'Mehmet Kaya',
    product: 'AirPods Pro 2',
    amount: '₺7,499',
    status: 'İptal',
    avatar: 'MK',
  },
  {
    id: '#ORD-7288',
    customer: 'Zeynep Arslan',
    product: 'Apple Watch Ultra',
    amount: '₺27,999',
    status: 'Kargoda',
    avatar: 'ZA',
  },
  {
    id: '#ORD-7287',
    customer: 'Can Öztürk',
    product: "iPad Pro 12.9''",
    amount: '₺38,999',
    status: 'Tamamlandı',
    avatar: 'CÖ',
  },
]

const topProducts: Product[] = [
  { name: 'iPhone 15 Pro Max', sales: 1243, revenue: '₺80.8M', percentage: 85 },
  { name: "MacBook Pro 16''", sales: 856, revenue: '₺62.4M', percentage: 72 },
  {
    name: 'Apple Watch Series 9',
    sales: 2341,
    revenue: '₺35.1M',
    percentage: 58,
  },
  { name: 'AirPods Pro 2', sales: 4521, revenue: '₺33.9M', percentage: 45 },
]

const activities: Activity[] = [
  {
    action: 'Yeni sipariş oluşturuldu',
    user: 'Ahmet Yılmaz',
    time: '2 dk önce',
    type: 'order',
  },
  {
    action: 'Ödeme alındı',
    user: 'Elif Demir',
    time: '15 dk önce',
    type: 'payment',
  },
  {
    action: 'Ürün stok uyarısı',
    user: 'Sistem',
    time: '1 saat önce',
    type: 'warning',
  },
  {
    action: 'Yeni kullanıcı kaydoldu',
    user: 'Mehmet Kaya',
    time: '2 saat önce',
    type: 'user',
  },
  {
    action: 'Sipariş kargoya verildi',
    user: 'Zeynep Arslan',
    time: '3 saat önce',
    type: 'shipping',
  },
]

export default function DashboardPage() {
  return (
    <>
      {/* Dashboard Content */}
      <div className="space-y-6 p-6">
        {/* Stats Cards */}
        <StatsGrid stats={statsData} />

        {/* Charts and Tables Row */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Revenue Chart */}
          <RevenueChart />

          {/* Top Products */}
          <TopProducts products={topProducts} />
        </div>

        {/* Orders and Activity Row */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Recent Orders */}
          <RecentOrders orders={recentOrders} />

          {/* Activity Feed */}
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </>
  )
}
