const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-4',
}

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`${sizes[size]} border-violet-200 border-t-violet-600 rounded-full animate-spin ${className}`}
    />
  )
}
