export function EmptyState({ title = 'No data found', description = 'There is nothing to display here yet.', icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg className="w-24 h-24 mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="9" y1="12" x2="15" y2="12" strokeLinecap="round" />
        <line x1="9" y1="16" x2="13" y2="16" strokeLinecap="round" />
      </svg>
      {Icon && <Icon className="w-12 h-12 mb-4 text-gray-300" />}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-sm">{description}</p>
    </div>
  )
}
