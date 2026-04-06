import { useState } from 'react'
import { Clock, Ban, Save, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { updateEstablishment } from '../../services/establishmentService'
import { toDateString } from '../../utils/dateHelpers'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Select from '../../components/ui/Select'
import Toggle from '../../components/ui/Toggle'

const DAY_LABELS = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function Schedule() {
  const { user, establishment, refreshEstablishment } = useAuth()

  const [workingHours, setWorkingHours] = useState(
    establishment?.workingHours || {}
  )
  const [slotDuration, setSlotDuration] = useState(
    String(establishment?.slotDuration || 30)
  )
  const [advanceDays, setAdvanceDays] = useState(
    String(establishment?.advanceDays || 30)
  )
  const [blockedDates, setBlockedDates] = useState(
    establishment?.blockedDates || []
  )
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [saving, setSaving] = useState(false)

  function handleHourChange(day, field, value) {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  function addBlockedDate() {
    if (!newBlockedDate) return
    if (blockedDates.includes(newBlockedDate)) {
      toast.error('Esta data já está bloqueada.')
      return
    }
    setBlockedDates(prev => [...prev, newBlockedDate].sort())
    setNewBlockedDate('')
  }

  function removeBlockedDate(date) {
    setBlockedDates(prev => prev.filter(d => d !== date))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateEstablishment(user.uid, {
        workingHours,
        slotDuration: Number(slotDuration),
        advanceDays: Number(advanceDays),
        blockedDates,
      })
      await refreshEstablishment()
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurar Agenda</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Defina seus horários, intervalos e datas bloqueadas
          </p>
        </div>
        <Button icon={<Save size={16} />} loading={saving} onClick={handleSave}>
          Salvar
        </Button>
      </div>

      {/* General settings */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <Clock size={18} className="text-violet-500" />
          Configurações gerais
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Select
            label="Duração padrão do slot"
            value={slotDuration}
            onChange={e => setSlotDuration(e.target.value)}
            hint="Granularidade da grade de horários"
          >
            <option value="20">20 minutos</option>
            <option value="40">40 minutos</option>
            <option value="60">1 hora</option>
            <option value="80">1h 20min</option>
            <option value="120">2 horas</option>
          </Select>

          <Select
            label="Agendamentos com antecedência"
            value={advanceDays}
            onChange={e => setAdvanceDays(e.target.value)}
            hint="Quantos dias no futuro o cliente pode agendar"
          >
            <option value="7">7 dias</option>
            <option value="14">14 dias</option>
            <option value="30">30 dias</option>
            <option value="60">60 dias</option>
            <option value="90">90 dias</option>
          </Select>
        </div>
      </Card>

      {/* Working hours */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <Clock size={18} className="text-violet-500" />
          Horários de funcionamento
        </h2>

        <div className="space-y-4">
          {DAY_ORDER.map(day => {
            const config = workingHours[day] || { open: false, start: '09:00', end: '18:00' }
            return (
              <div
                key={day}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl transition-colors ${
                  config.open
                    ? 'bg-violet-50 dark:bg-violet-950/40'
                    : 'bg-gray-50 dark:bg-gray-900'
                }`}
              >
                <div className="w-40 flex-shrink-0">
                  <Toggle
                    label={DAY_LABELS[day]}
                    checked={config.open}
                    onChange={v => handleHourChange(day, 'open', v)}
                  />
                </div>

                {config.open ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={config.start}
                      onChange={e => handleHourChange(day, 'start', e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <span className="text-gray-400 text-sm font-medium">até</span>
                    <input
                      type="time"
                      value={config.end}
                      onChange={e => handleHourChange(day, 'end', e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Fechado neste dia</span>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Blocked dates */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Ban size={18} className="text-violet-500" />
          Datas bloqueadas
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Feriados, férias ou qualquer dia que você não vai atender.
        </p>

        <div className="flex gap-3 mb-5">
          <input
            type="date"
            value={newBlockedDate}
            min={toDateString(new Date())}
            onChange={e => setNewBlockedDate(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <Button icon={<Plus size={16} />} onClick={addBlockedDate}>
            Bloquear
          </Button>
        </div>

        {blockedDates.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-4">Nenhuma data bloqueada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {blockedDates.map(date => (
              <div
                key={date}
                className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-full text-sm"
              >
                <span>{new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                <button
                  onClick={() => removeBlockedDate(date)}
                  className="text-red-400 hover:text-red-600 ml-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
