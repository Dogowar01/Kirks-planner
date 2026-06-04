export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={40} className="text-text-tertiary mb-4" />}
      <p className="text-text-secondary font-medium mb-1">{title}</p>
      {description && <p className="text-text-tertiary text-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}
