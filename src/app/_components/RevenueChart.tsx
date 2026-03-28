'use client'

import { useAdminTheme } from '../_hooks'
import { Icons } from './Icons'

interface RevenueChartProps {
  data?: number[]
}

export function RevenueChart({
  data = [65, 45, 78, 52, 88, 72, 95],
}: Readonly<RevenueChartProps>) {
  const { isDarkMode } = useAdminTheme()
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  return (
    <div
      className={`rounded-2xl p-6 xl:col-span-2 ${
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
            Gelir Grafiği
          </h3>
          <p
            className={`text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            Son 7 günlük gelir analizi
          </p>
        </div>
        <button
          className={`rounded-lg p-2 transition-colors ${
            isDarkMode
              ? 'text-slate-400 hover:bg-slate-800'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Icons.MoreHorizontal />
        </button>
      </div>

      {/* Chart Visualization */}
      <div className="flex h-64 items-end justify-between gap-4 px-4">
        {data.map((height, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-xl bg-gradient-to-t from-violet-500 to-purple-400 transition-all duration-500 hover:from-violet-400 hover:to-purple-300"
              style={{ height: `${height}%` }}
            />
            <span
              className={`text-xs ${
                isDarkMode ? 'text-slate-500' : 'text-gray-400'
              }`}
            >
              {days[index]}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-8 border-t border-slate-800/50 pt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
          <span
            className={`text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            Gelir
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
          <span
            className={`text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            Gider
          </span>
        </div>
      </div>
    </div>
  )
}
