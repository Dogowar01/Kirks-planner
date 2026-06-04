const CATS = {
  signal9:  { label: 'Signal9',  color: '#C4522A', bg: 'rgba(196,82,42,0.15)' },
  app:      { label: 'App Dev',  color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  writing:  { label: 'Writing',  color: '#7C3AED', bg: 'rgba(124,58,237,0.15)' },
  personal: { label: 'Personal', color: '#7F77DD', bg: 'rgba(127,119,221,0.15)' },
}

export default function CategoryBadge({ category, size = 'sm' }) {
  const cat = CATS[category]
  if (!cat) return null
  const pad = size === 'xs' ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-xs'
  return (
    <span className={`badge ${pad} font-medium`}
      style={{ backgroundColor: cat.bg, color: cat.color, fontFamily: '"DM Mono", monospace', letterSpacing: '0.05em' }}>
      {cat.label}
    </span>
  )
}
