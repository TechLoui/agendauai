import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, hint, prefix, suffix, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-gray-400 pointer-events-none text-sm">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-xl border bg-white dark:bg-gray-900
            border-gray-200 dark:border-gray-700
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-600
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            transition-all duration-150
            ${error ? 'border-red-400 focus:ring-red-400' : ''}
            ${prefix ? 'pl-9' : 'pl-4'}
            ${suffix ? 'pr-9' : 'pr-4'}
            py-2.5 text-sm
            ${className}
          `}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-gray-400 text-sm">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  )
})

export default Input
