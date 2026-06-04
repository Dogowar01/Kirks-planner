import { STATUSES } from '../lib/constants'

export default function StatusBadge({ status }) {
  const s = STATUSES[status]
  if (!s) return null
  return (
    <span className="badge px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: s.color + '22', color: s.color }}>
      {s.label}
    </span>
  )
}
