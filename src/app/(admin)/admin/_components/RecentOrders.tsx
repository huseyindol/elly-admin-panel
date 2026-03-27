'use client'

import { useAdminTheme } from '../_hooks'
import { Icons } from './Icons'
import { Order } from './types'

interface RecentOrdersProps {
  orders: Order[]
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Tamamlandı':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'Beklemede':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'İptal':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    case 'Kargoda':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const { isDarkMode } = useAdminTheme()

  return (
    <div
      className={`overflow-hidden rounded-2xl xl:col-span-2 ${
        isDarkMode
          ? 'border border-slate-800/50 bg-slate-900/60'
          : 'border border-gray-200 bg-white'
      } backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between border-b border-slate-800/50 p-6">
        <div>
          <h3
            className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Son Siparişler
          </h3>
          <p
            className={`text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            Son 24 saatteki siparişler
          </p>
        </div>
        <button className="flex items-center gap-1 text-sm font-medium text-violet-400 hover:text-violet-300">
          Tümünü Gör <Icons.ArrowUpRight />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className={`text-left text-sm ${
                isDarkMode
                  ? 'border-b border-slate-800/50 text-slate-400'
                  : 'border-b border-gray-200 text-gray-500'
              }`}
            >
              <th className="px-6 py-4 font-medium">Sipariş</th>
              <th className="px-6 py-4 font-medium">Müşteri</th>
              <th className="hidden px-6 py-4 font-medium md:table-cell">
                Ürün
              </th>
              <th className="px-6 py-4 font-medium">Tutar</th>
              <th className="px-6 py-4 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr
                key={index}
                className={`transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'
                }`}
              >
                <td
                  className={`px-6 py-4 font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {order.id}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-medium text-white">
                      {order.avatar}
                    </div>
                    <span
                      className={
                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                      }
                    >
                      {order.customer}
                    </span>
                  </div>
                </td>
                <td
                  className={`hidden px-6 py-4 md:table-cell ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}
                >
                  {order.product}
                </td>
                <td
                  className={`px-6 py-4 font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {order.amount}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(
                      order.status,
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
