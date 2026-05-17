'use client'

export function navToPost(id: string) {
  window.dispatchEvent(new CustomEvent('ces-navigate-post', { detail: { id } }))
}

export function PostRef({
  id, label, color, size = 11,
}: {
  id: string
  label?: string
  color: string
  size?: number
}) {
  return (
    <span
      onClick={(e) => { e.stopPropagation(); navToPost(id) }}
      title={`Jump to ${id} on the canvas`}
      style={{
        cursor: 'pointer',
        color,
        fontWeight: 700,
        textDecoration: 'underline',
        textDecorationStyle: 'dotted',
        textUnderlineOffset: '2px',
        fontSize: size,
      }}
    >
      {label ?? id}
    </span>
  )
}
