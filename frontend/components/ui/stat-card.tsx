import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  positive?: boolean
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  className?: string
}

export function StatCard({
  label, value, change, positive = true, icon: Icon, iconColor, iconBg, className
}: StatCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow duration-300',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-black text-gray-900">{value}</p>
          {change && (
            <p className={cn('text-xs font-medium mt-1.5', positive ? 'text-ci-green' : 'text-red-500')}>
              {positive ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0', iconBg ?? 'bg-ci-orange-light')}>
          <Icon size={20} className={iconColor ?? 'text-ci-orange'} />
        </div>
      </div>
    </div>
  )
}
