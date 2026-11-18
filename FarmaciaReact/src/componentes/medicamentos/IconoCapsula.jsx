export default function IconoCapsula({ color, tamano = 22 }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" aria-hidden="true">
      <g transform="rotate(-45 12 12)">
        <rect x="3" y="8" width="18" height="8" rx="4" fill="#ffffff" stroke={color} strokeWidth="1.6" />
        <path d="M7 8h5v8H7a4 4 0 0 1 0-8z" fill={color} />
      </g>
    </svg>
  )
}
