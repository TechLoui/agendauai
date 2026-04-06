import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarDays, Clock, CheckCircle, TrendingUp, ExternalLink, Plus, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeToTodayAppointments, getAppointmentsByDateRange } from '../../services/appointmentsService'
import { todayString, weekRange } from '../../utils/dateHelpers'
import { formatPrice } from '../../utils/formatters'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

function StatCard({ icon: Icon, label, value, sub, color = 'green' }) {
  const colors = {
    green:  'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400',
    amber:  'bg-amber-50 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400',
    blue:   'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
    emerald:'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { user, establishment } = useAuth()
  const [todayAppts, setTodayAppts] = useState([])
  const [weekRevenue, setWeekRevenue] = useState(0)
  const [weekCount, setWeekCount] = useState(0)

  const today = todayString()

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToTodayAppointments(user.uid, today, setTodayAppts)
    return unsub
  }, [user, today])

  useEffect(() => {
    if (!user) return
    const { start, end } = weekRange()
    getAppointmentsByDateRange(user.uid, start, end).then(appts => {
      const active = appts.filter(a => a.status !== 'cancelled')
      setWeekCount(active.length)
      setWeekRevenue(active.reduce((sum, a) => sum + (a.servicePrice || 0), 0))
    })
  }, [user])

  const pending = todayAppts.filter(a => a.status === 'pending')
  const confirmed = todayAppts.filter(a => a.status === 'confirmed')

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Olá, {establishment?.businessName || user?.displayName?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Aqui está o resumo de hoje
          </p>
        </div>

        {establishment?.slug && (
          <a
            href={`/book/${establishment.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" icon={<ExternalLink size={14} />}>
              Ver minha página
            </Button>
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarDays} label="Agendamentos hoje" value={todayAppts.length} color="green" />
        <StatCard icon={Clock} label="Pendentes" value={pending.length} color="amber" />
        <StatCard icon={CheckCircle} label="Confirmados" value={confirmed.length} color="emerald" />
        <StatCard
          icon={TrendingUp}
          label="Receita estimada (semana)"
          value={formatPrice(weekRevenue)}
          sub={`${weekCount} atendimentos`}
          color="amber"
        />
      </div>

      {/* Today's appointments */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Agendamentos de hoje</h2>
          <Link to="/dashboard/appointments">
            <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />}>
              Ver todos
            </Button>
          </Link>
        </div>

        {todayAppts.length === 0 ? (
          <div className="text-center py-10">
            <CalendarDays size={40} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum agendamento hoje.</p>
            <p className="text-xs text-gray-400 mt-1">Compartilhe seu link para receber agendamentos!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppts.map(appt => (
              <div
                key={appt.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400 leading-none">{appt.startTime}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{appt.customerName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{appt.serviceName}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge status={appt.status} />
                  <span className="text-xs text-gray-400">{formatPrice(appt.servicePrice)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Ações rápidas</h3>
          <div className="space-y-2">
            <Link to="/dashboard/services">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                <Plus size={16} className="text-green-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Adicionar serviço</span>
              </button>
            </Link>
            <Link to="/dashboard/schedule">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                <Clock size={16} className="text-green-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Configurar horários</span>
              </button>
            </Link>
          </div>
        </Card>

        {establishment?.slug && (
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Compartilhar link</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Envie para seus clientes no WhatsApp, Instagram ou onde preferir.
            </p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900">
              <span className="text-sm text-green-700 dark:text-green-300 flex-1 truncate font-mono">
                agendauai.com/book/{establishment.slug}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/book/${establishment.slug}`)
                  toast.success('Link copiado!')
                }}
                className="text-green-600 text-xs font-medium hover:underline flex-shrink-0"
              >
                Copiar
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
