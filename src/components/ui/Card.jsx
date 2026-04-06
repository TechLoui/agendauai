export default function Card({ children, className = '', padding = true }) {
  return (
    <div
      className={`
        bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800
        shadow-sm
        ${padding ? 'p-6' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
