'use client'

import { useAdminTheme } from '../_hooks'
import { Icons } from './Icons'
import { Product } from './types'

interface TopProductsProps {
  products: Product[]
}

export function TopProducts({ products }: TopProductsProps) {
  const { isDarkMode } = useAdminTheme()

  return (
    <div
      className={`rounded-2xl p-6 ${
        isDarkMode
          ? 'border border-slate-800/50 bg-slate-900/60'
          : 'border border-gray-200 bg-white'
      } backdrop-blur-sm`}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3
            className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            En Çok Satılanlar
          </h3>
          <p
            className={`text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            Bu ayki performans
          </p>
        </div>
        <button className="flex items-center gap-1 text-sm font-medium text-violet-400 hover:text-violet-300">
          Tümü <Icons.ChevronRight />
        </button>
      </div>

      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {product.name}
              </span>
              <span
                className={`text-sm ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}
              >
                {product.revenue}
              </span>
            </div>
            <div
              className={`h-2 overflow-hidden rounded-full ${
                isDarkMode ? 'bg-slate-800' : 'bg-gray-200'
              }`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-1000"
                style={{ width: `${product.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>
                {product.sales} satış
              </span>
              <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>
                {product.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
