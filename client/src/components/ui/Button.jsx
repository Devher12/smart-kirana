import { cn } from '@/utils/cn'

const variants = {
  default: 'bg-primary text-white hover:bg-primary-light',
  accent: 'bg-accent text-white hover:bg-amber-600',
  outline: 'border border-border bg-white hover:bg-gray-50 text-foreground',
  ghost: 'hover:bg-gray-100 text-foreground',
  danger: 'bg-danger text-white hover:bg-red-700',
}

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4',
  lg: 'h-12 px-6 text-lg',
}

export function Button({ className, variant = 'default', size = 'md', children, disabled, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
