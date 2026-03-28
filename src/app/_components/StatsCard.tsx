'use client'

import { useAdminTheme } from '../_hooks'
import { Icons } from './Icons'
import { StatData } from './types'

interface StatsCardProps {
  stat: StatData
  index: number
}

export function StatsCard({ stat, index }: StatsCardProps) {
  const { isDarkMode } = useAdminTheme()

  return (
    <div
      className={`group relative cursor-pointer rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
        isDarkMode
          ? 'border border-slate-800/50 bg-slate-900/60 hover:border-slate-700/50 hover:shadow-violet-500/10'
          : 'border border-gray-200 bg-white hover:border-gray-300 hover:shadow-violet-500/20'
      } backdrop-blur-sm`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Gradient Accent */}
      <div
        className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${stat.gradient} opacity-80`}
      />

      <div className="mb-4 flex items-start justify-between">
        <div
          className={`rounded-xl bg-gradient-to-br p-3 ${stat.gradient} shadow-lg`}
        >
          <stat.icon />
        </div>
        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            stat.trend === 'up'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/20 text-rose-400'
          }`}
        >
          {stat.trend === 'up' ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
          {stat.change}
        </div>
      </div>
      <h3
        className={`mb-1 text-sm font-medium ${
          isDarkMode ? 'text-slate-400' : 'text-gray-500'
        }`}
      >
        {stat.title}
      </h3>
      <p
        className={`text-2xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}
      >
        {stat.value}
      </p>
    </div>
  )
}

interface StatsGridProps {
  stats: StatData[]
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatsCard key={index} stat={stat} index={index} />
      ))}
    </div>
  )
}
