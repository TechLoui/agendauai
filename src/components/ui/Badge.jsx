const styles = {
  pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  active:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  inactive:  'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  purple:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

const labels = {
  pending:   'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Finalizado',
  active:    'Ativo',
  inactive:  'Inativo',
}

export default function Badge({ status, label, className = '' }) {
  const style = styles[status] || styles.inactive
  const text = label ?? labels[status] ?? status

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {text}
    </span>
  )
}
