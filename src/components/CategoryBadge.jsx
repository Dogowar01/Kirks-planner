const CATS = {
  signal9:  { label: 'Signal9',  color: '#E8724A', bg: 'rgba(196,82,42,0.25)',  glow: 'rgba(196,82,42,0.3)' },
  app:      { label: 'App Dev',  color: '#60A5FA', bg: 'rgba(59,130,246,0.22)', glow: 'rgba(59,130,246,0.3)' },
  writing:  { label: 'Writing',  color: '#A78BFA', bg: 'rgba(124,58,237,0.22)', glow: 'rgba(124,58,237,0.3)' },
  personal: { label: 'Personal', color: '#9D95E8', bg: 'rgba(127,119,221,0.22)',glow: 'rgba(127,119,221,0.3)' },
}

export default function CategoryBadge({ category, size = 'sm' }) {
  const cat = CATS[category]
  if (!cat) return null
  const pad = size === 'xs' ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-xs'
  return (
    <span className={`badge ${pad} font-medium`}
      style={{
        backgroundColor: cat.bg,
        color: cat.color,
        fontFamily: '"DM Mono", monospace',
        letterSpacing: '0.05em',
        border: `0.5px solid ${cat.glow}`,
        boxShadow: `0 0 8px -2px ${cat.glow}`,
      }}>
      {cat.label}
    </span>
  )
}
