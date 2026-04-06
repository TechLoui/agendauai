import { initials } from '../../utils/formatters'

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

export default function Avatar({ src, name, size = 'md', className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`
        ${sizes[size]} rounded-full flex-shrink-0
        bg-gradient-to-br from-green-400 to-emerald-600
        flex items-center justify-center
        text-white font-semibold
        ${className}
      `}
    >
      {initials(name)}
    </div>
  )
}
