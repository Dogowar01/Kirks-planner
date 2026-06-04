import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-bg-elevated rounded-card border border-white/10 shadow-2xl animate-in`}
           style={{ animation: 'slideUp 150ms ease' }}>
        <div className="flex items-center justify-between p-4 border-b border-white/8">
          <h2 className="font-display text-lg font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors p-1 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  )
}
