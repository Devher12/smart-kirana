import { cn } from '@/utils/cn'

const variants = {
  default: 'bg-gray-100 text-foreground',
  success: 'bg-green-100 text-success',
  warning: 'bg-amber-100 text-warning',
  danger: 'bg-red-100 text-danger',
  primary: 'bg-primary/10 text-primary',
}

export function Badge({ className, variant = 'default', children }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
