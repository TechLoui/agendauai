export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center text-violet-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-5">{description}</p>
      )}
      {action}
    </div>
  )
}
