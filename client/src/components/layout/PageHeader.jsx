import { cn } from '@/utils/cn'

export function PageHeader({ title, description, breadcrumbs, actions, className }) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs && (
        <div className="text-sm text-muted mb-1">{breadcrumbs}</div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-foreground">{title}</h1>
          {description && <p className="text-muted mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
