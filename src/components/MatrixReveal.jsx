import { useState, useEffect, useRef } from 'react'

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&'

/**
 * MatrixReveal — scrambles through katakana/alphanumeric characters
 * then resolves to the real text, character by character.
 *
 * Props:
 *  text      — the final string to reveal
 *  delay     — seconds before scramble starts (default 0)
 *  duration  — ms for full resolution (default 1200)
 *  color     — CSS colour for resolved characters (default '#EDE8E0')
 *  style     — extra inline styles on the outer span
 *  className — extra class names
 */
export default function MatrixReveal({ text, delay = 0, duration = 1200, color = '#EDE8E0', style = {}, className = '' }) {
  const [display, setDisplay] = useState(() => text.split('').map(() => ' '))
  const scrambleRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    const chars = text.split('')
    const resolved = new Array(chars.length).fill(false)
    const resolveTimes = chars.map((_, i) => (i / Math.max(chars.length - 1, 1)) * duration)

    function scramble() {
      setDisplay(chars.map((ch, i) => {
        if (resolved[i]) return ch
        if (ch === ' ') return ' '
        return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
      }))
    }

    timeoutRef.current = setTimeout(() => {
      scrambleRef.current = setInterval(scramble, 40)
      chars.forEach((_, i) => {
        setTimeout(() => {
          resolved[i] = true
          if (resolved.every(Boolean)) {
            clearInterval(scrambleRef.current)
            setDisplay(chars)
          }
        }, resolveTimes[i])
      })
    }, delay * 1000)

    return () => {
      clearTimeout(timeoutRef.current)
      clearInterval(scrambleRef.current)
    }
  }, [text, delay, duration])

  return (
    <span style={{ color, fontVariantNumeric: 'tabular-nums', ...style }} className={className}>
      {display.map((ch, i) => (
        <span key={i} style={{
          color: ch !== text[i] && ch !== ' ' ? 'rgba(0,255,100,0.85)' : 'inherit',
          textShadow: ch !== text[i] && ch !== ' ' ? '0 0 8px rgba(0,255,100,0.9)' : 'none',
        }}>{ch}</span>
      ))}
    </span>
  )
}
