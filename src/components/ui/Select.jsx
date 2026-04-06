import { forwardRef } from 'react'

const Select = forwardRef(function Select(
  { label, error, hint, children, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full rounded-xl border bg-white dark:bg-gray-900
          border-gray-200 dark:border-gray-700
          text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
          transition-all duration-150 px-4 py-2.5 text-sm
          ${error ? 'border-red-400 focus:ring-red-400' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  )
})

export default Select
