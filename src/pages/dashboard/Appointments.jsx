import { useEffect, useState } from 'react'
import { CalendarDays, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getAppointmentsByDateRange, updateAppointmentStatus } from '../../services/appointmentsService'
import { todayString, weekRange, monthRange, formatDate, formatDateLabel } from '../../utils/dateHelpers'
import { formatPrice, formatDuration } from '../../utils/formatters'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

const FILTERS = [
  { label: 'Hoje', key: 'today' },
  { label: 'Esta semana', key: 'week' },
  { label: 'Este mês', key: 'month' },
]

const STATUS_FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'Cancelado', value: 'cancelled' },
  { label: 'Finalizado', value: 'completed' },
]

function getRange(filter) {
  if (filter === 'today') return { start: todayString(), end: todayString() }
  if (filter === 'week') return weekRange()
  return monthRange()
}

export default function Appointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('today')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState(null)

  async function fetchAppointments() {
    if (!user) return
    setLoading(true)
    const { start, end } = getRange(filter)
    const data = await getAppointmentsByDateRange(user.uid, start, end)
    setAppointments(data)
    setLoading(false)
  }

  useEffect(() => { fetchAppointments() }, [filter, user])

  async function handleStatusChange(apptId, status) {
    setUpdating(apptId)
    try {
      await updateAppointmentStatus(user.uid, apptId, status)
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status } : a))
      toast.success('Status atualizado!')
    } catch {
      toast.error('Erro ao atualizar status.')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = appointments.filter(a => {
    const matchStatus = !statusFilter || a.status === statusFilter
    const matchSearch = !search || a.customerName.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const grouped = filtered.reduce((acc, a) => {
    if (!acc[a.date]) acc[a.date] = []
    acc[a.date].push(a)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agendamentos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gerencie e confirme seus atendimentos</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f.key
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 sm:ml-auto flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === f.value
                    ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome do cliente..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : sortedDates.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={28} />}
          title="Nenhum agendamento encontrado"
          description="Não há agendamentos para o período selecionado."
        />
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {formatDateLabel(date)} — {formatDate(date)}
              </h3>
              <div className="space-y-3">
                {grouped[date]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map(appt => (
                    <Card key={appt.id} padding={false}>
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-green-50 dark:bg-green-950 flex flex-col items-center justify-center">
                            <span className="text-base font-bold text-green-700 dark:text-green-300">{appt.startTime}</span>
                            <span className="text-xs text-green-400">{appt.endTime}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{appt.customerName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{appt.serviceName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {formatDuration(appt.serviceDuration)} • {formatPrice(appt.servicePrice)}
                                </p>
                              </div>
                              <Badge status={appt.status} />
                            </div>

                            {appt.customerPhone && (
                              <a
                                href={`https://wa.me/${appt.customerPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:underline mt-2 inline-block"
                              >
                                📱 {appt.customerPhone}
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {(appt.status === 'pending' || appt.status === 'confirmed') && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            {appt.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="primary"
                                loading={updating === appt.id}
                                onClick={() => handleStatusChange(appt.id, 'confirmed')}
                              >
                                Confirmar
                              </Button>
                            )}
                            {appt.status === 'confirmed' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                loading={updating === appt.id}
                                onClick={() => handleStatusChange(appt.id, 'completed')}
                              >
                                Finalizar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="danger"
                              loading={updating === appt.id}
                              onClick={() => handleStatusChange(appt.id, 'cancelled')}
                            >
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
