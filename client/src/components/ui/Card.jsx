import { cn } from '@/utils/cn'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('bg-card rounded-xl shadow-sm border border-border/50 p-6 transition-shadow hover:shadow-md', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ className, children }) {
  return <h3 className={cn('text-lg font-semibold font-[family-name:var(--font-heading)]', className)}>{children}</h3>
}
