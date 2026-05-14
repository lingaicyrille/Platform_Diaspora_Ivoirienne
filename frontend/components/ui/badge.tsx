import { cn } from '@/lib/utils'

type BadgeVariant = 'orange' | 'green' | 'blue' | 'purple' | 'gray' | 'red'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const styles: Record<BadgeVariant, string> = {
  orange: 'bg-ci-orange-light text-ci-orange',
  green: 'bg-ci-green-light text-ci-green',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-50 text-red-600',
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
      styles[variant],
      className
    )}>
      {children}
    </span>
  )
}
