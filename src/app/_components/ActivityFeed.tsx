'use client'

import { useAdminTheme } from '../_hooks'
import { Activity } from './types'

interface ActivityFeedProps {
  activities: Activity[]
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'order':
      return '🛒'
    case 'payment':
      return '💰'
    case 'warning':
      return '⚠️'
    case 'user':
      return '👤'
    case 'shipping':
      return '📦'
    default:
      return '📌'
  }
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
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
            Son Aktiviteler
          </h3>
          <p
            className={`text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            Gerçek zamanlı güncellemeler
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${
              isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'
            }`}
          >
            <span className="text-xl">{getActivityIcon(activity.type)}</span>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {activity.action}
              </p>
              <p
                className={`text-xs ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}
              >
                {activity.user}
              </p>
            </div>
            <span
              className={`whitespace-nowrap text-xs ${
                isDarkMode ? 'text-slate-500' : 'text-gray-400'
              }`}
            >
              {activity.time}
            </span>
          </div>
        ))}
      </div>

      <button
        className={`mt-4 w-full rounded-xl py-3 text-sm font-medium transition-all ${
          isDarkMode
            ? 'border border-slate-700/50 bg-slate-800/50 text-slate-300 hover:bg-slate-800'
            : 'border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Tüm Aktiviteleri Gör
      </button>
    </div>
  )
}
