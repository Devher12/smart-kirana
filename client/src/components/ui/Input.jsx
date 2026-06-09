import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export const Input = forwardRef(function Input({ className, label, error, ...props }, ref) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full h-10 px-3 rounded-xl border border-border bg-white text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
          error && 'border-danger focus:ring-danger/30',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
})
