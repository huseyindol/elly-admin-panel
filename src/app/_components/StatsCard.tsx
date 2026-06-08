'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useAdminTheme } from '../_hooks'
import { Icons } from './Icons'
import { StatData } from './types'

interface StatsCardProps {
  stat: StatData
  index: number
}

export function StatsCard({ stat, index }: StatsCardProps) {
  const { isDarkMode } = useAdminTheme()
  const clickable = Boolean(stat.href)

  const card = (
    <div
      className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl p-4 transition-all duration-300 sm:gap-4 sm:p-5 ${
        clickable ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl' : ''
      } ${
        isDarkMode
          ? 'border border-slate-800/50 bg-slate-900/60 hover:border-slate-700/50 hover:shadow-violet-500/10'
          : 'border border-gray-200 bg-white hover:border-gray-300 hover:shadow-violet-500/20'
      }`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Gradient Accent */}
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-80`}
      />

      {/* İkon */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg sm:h-12 sm:w-12`}
      >
        <stat.icon />
      </div>

      {/* Başlık + değer */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[11px] font-medium uppercase tracking-wide sm:text-xs ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          {stat.title}
        </p>
        <div className="flex items-baseline gap-2">
          <p
            className={`text-2xl font-bold leading-tight ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {stat.value}
          </p>
          {stat.change && stat.trend && (
            <span
              className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                stat.trend === 'up'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {stat.trend === 'up' ? (
                <Icons.TrendingUp />
              ) : (
                <Icons.TrendingDown />
              )}
              {stat.change}
            </span>
          )}
        </div>
      </div>

      {/* Tıklanabilir kartlarda ok */}
      {clickable && (
        <ChevronRight
          className={`h-4 w-4 shrink-0 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 ${
            isDarkMode ? 'text-slate-500' : 'text-gray-400'
          }`}
          aria-hidden
        />
      )}
    </div>
  )

  if (stat.href) {
    return (
      <Link href={stat.href} aria-label={stat.title}>
        {card}
      </Link>
    )
  }
  return card
}

interface StatsGridProps {
  stats: StatData[]
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatsCard key={index} stat={stat} index={index} />
      ))}
    </div>
  )
}
