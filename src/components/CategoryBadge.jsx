import { CATEGORIES } from '../lib/constants'

export default function CategoryBadge({ category, size = 'sm' }) {
  const cat = CATEGORIES[category]
  if (!cat) return null
  const pad = size === 'xs' ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs'
  return (
    <span className={`badge ${pad} font-medium`}
          style={{ backgroundColor: cat.light, color: cat.color }}>
      {cat.label}
    </span>
  )
}
