import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  CalendarDays, Clock, ChevronLeft, ChevronRight,
  CheckCircle, MessageCircle, Scissors, User, Phone,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getEstablishmentBySlug } from '../services/establishmentService'
import { getServices } from '../services/servicesService'
import { getAppointmentsByDate, createAppointment } from '../services/appointmentsService'
import { getEmployees } from '../services/employeesService'
import { getAvailableSlots, calculateEndTime } from '../utils/slotCalculator'
import { generateWhatsAppLink } from '../utils/whatsappHelper'
import { formatPrice, formatDuration, formatPhone, parsePhoneToE164 } from '../utils/formatters'
import { toDateString, formatDateLong, DAY_LABELS, DAY_NAMES } from '../utils/dateHelpers'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import Avatar from '../components/ui/Avatar'

// ─── Calendar Component ───────────────────────────────────────────────────────
function Calendar({ establishment, selectedDate, onSelect }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + (establishment.advanceDays || 30))

  const [viewDate, setViewDate] = useState(() => new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }

  function isDayAvailable(d) {
    const date = new Date(year, month, d)
    date.setHours(0, 0, 0, 0)
    if (date < today || date > maxDate) return false
    const dateStr = toDateString(date)
    if (establishment.blockedDates?.includes(dateStr)) return false
    const dayName = DAY_NAMES[date.getDay()]
    return !!establishment.workingHours?.[dayName]?.open
  }

  function handleSelect(d) {
    const date = new Date(year, month, d)
    if (!isDayAvailable(d)) return
    onSelect(toDateString(date))
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{monthName}</span>
        <button
          onClick={nextMonth}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} />
          const dateStr = toDateString(new Date(year, month, d))
          const available = isDayAvailable(d)
          const selected = selectedDate === dateStr
          const isToday = toDateString(new Date()) === dateStr

          return (
            <button
              key={d}
              onClick={() => handleSelect(d)}
              disabled={!available}
              className={`
                aspect-square flex items-center justify-center rounded-xl text-sm font-medium
                transition-all duration-150
                ${selected
                  ? 'bg-amber-400 text-amber-900 font-bold shadow-md shadow-amber-200 dark:shadow-amber-900'
                  : available
                    ? 'hover:bg-green-50 dark:hover:bg-green-950 text-gray-700 dark:text-gray-300 cursor-pointer'
                    : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                }
                ${isToday && !selected ? 'ring-2 ring-green-300 dark:ring-green-700' : ''}
              `}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step indicator ──────────────────────────────────────────────────────────
const STEPS = ['Serviço', 'Data & Hora', 'Seus dados', 'Confirmado']

function StepIndicator({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold
            transition-all duration-200
            ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}
          `}>
            {i < step ? <CheckCircle size={14} /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-0.5 rounded-full ${i < step ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main Booking Page ────────────────────────────────────────────────────────
export default function Booking() {
  const { slug } = useParams()
  const [loading, setLoading] = useState(true)
  const [establishment, setEstablishment] = useState(null)
  const [services, setServices] = useState([])
  const [employees, setEmployees] = useState([])
  const [notFound, setNotFound] = useState(false)

  // Wizard state
  const [step, setStep] = useState(0)
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null) // null = sem preferência
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [booking, setBooking] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  // Load establishment
  useEffect(() => {
    async function load() {
      try {
        const est = await getEstablishmentBySlug(slug)
        if (!est) { setNotFound(true); setLoading(false); return }
        const [svcs, emps] = await Promise.all([
          getServices(est.uid),
          getEmployees(est.uid),
        ])
        setEstablishment(est)
        setServices(svcs.filter(s => s.isActive))
        setEmployees(emps.filter(e => e.isActive))
        setLoading(false)
      } catch {
        setNotFound(true)
        setLoading(false)
      }
    }
    load()
  }, [slug])

  // Load slots when date changes
  useEffect(() => {
    if (!selectedDate || !establishment || selectedServices.length === 0) return
    async function loadSlots() {
      setSlotsLoading(true)
      const appts = await getAppointmentsByDate(establishment.uid, selectedDate)
      const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)
      const computed = getAvailableSlots({
        date: selectedDate,
        establishment,
        appointments: appts,
        requestedDuration: totalDuration,
      })
      setSlots(computed)
      setSelectedTime(null)
      setSlotsLoading(false)
    }
    loadSlots()
  }, [selectedDate, establishment, selectedServices])

  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)

  function toggleService(service) {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id)
      if (exists) return prev.filter(s => s.id !== service.id)
      return [...prev, service]
    })
    // Reset date/time if services change
    setSelectedDate(null)
    setSelectedTime(null)
    setSlots([])
  }

  async function handleConfirm({ name, phone }) {
    setSubmitting(true)
    try {
      const endTime = calculateEndTime(selectedTime, totalDuration)
      const phoneE164 = parsePhoneToE164(phone)

      const serviceNames = selectedServices.map(s => s.name).join(' + ')

      const apptId = await createAppointment(establishment.uid, {
        serviceId: selectedServices.map(s => s.id).join(','),
        serviceName: serviceNames,
        serviceDuration: totalDuration,
        servicePrice: totalPrice,
        customerName: name,
        customerPhone: phoneE164,
        date: selectedDate,
        startTime: selectedTime,
        endTime,
        employeeId: selectedEmployee?.id || null,
        employeeName: selectedEmployee?.name || null,
        notes: '',
      })

      // Generate WhatsApp link
      const waLink = generateWhatsAppLink({
        whatsapp: establishment.whatsapp,
        businessName: establishment.businessName,
        customerName: name,
        services: selectedServices,
        date: selectedDate,
        startTime: selectedTime,
        totalPrice,
      })

      setBooking({ id: apptId, waLink, name, phone })
      setStep(3)

      // Auto-redirect to WhatsApp
      setTimeout(() => window.open(waLink, '_blank'), 800)
    } catch {
      toast.error('Erro ao realizar agendamento. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 dark:bg-gray-950">
        <Spinner size="lg" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 dark:bg-gray-950 p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <CalendarDays size={36} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Estabelecimento não encontrado</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            O link que você acessou não existe ou foi removido.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-950 dark:to-green-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
          <Avatar src={establishment.logoUrl} name={establishment.businessName} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{establishment.businessName}</h1>
            {establishment.address && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{establishment.address}</p>
            )}
            {establishment.description && (
              <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{establishment.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Steps indicator */}
        {step < 3 && <StepIndicator step={step} />}

        {/* Step 0: Select service */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 text-center">
              Escolha o serviço
            </h2>

            {services.length === 0 ? (
              <div className="text-center py-12">
                <Scissors size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum serviço disponível no momento.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {services.map(service => {
                  const selected = selectedServices.some(s => s.id === service.id)
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service)}
                      className={`
                        w-full rounded-2xl text-left border-2 transition-all duration-150 overflow-hidden
                        ${selected
                          ? 'border-green-500 bg-green-50 dark:bg-green-950'
                          : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-green-200 dark:hover:border-green-800'
                        }
                      `}
                    >
                      {/* Photos */}
                      {service.photoUrls?.length > 0 && (
                        <div className={`grid ${service.photoUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5`}>
                          {service.photoUrls.map((url, i) => (
                            <img key={i} src={url} alt={service.name} className="w-full h-32 object-cover" />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex-1">
                          <p className={`font-semibold ${selected ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'}`}>
                            {service.name}
                          </p>
                          {service.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{service.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-sm font-bold ${selected ? 'text-amber-500 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
                              {formatPrice(service.price)}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                              {formatDuration(service.duration)}
                            </span>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selected ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selected && <CheckCircle size={14} className="text-white" />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Seleção de profissional — só aparece se houver funcionários */}
            {employees.length > 0 && selectedServices.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <User size={15} className="text-green-500" />
                  Escolha o profissional
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* Opção sem preferência */}
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all
                      ${selectedEmployee === null
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-green-200'
                      }
                    `}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                      <User size={18} />
                    </div>
                    <span className={`text-xs font-medium text-center ${selectedEmployee === null ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                      Sem preferência
                    </span>
                  </button>

                  {employees
                    .filter(emp => {
                      // Mostra funcionários que realizam pelo menos um dos serviços selecionados
                      if (!emp.serviceIds?.length) return true
                      return selectedServices.some(s => emp.serviceIds.includes(s.id))
                    })
                    .map(emp => {
                      const isSelected = selectedEmployee?.id === emp.id
                      return (
                        <button
                          key={emp.id}
                          onClick={() => setSelectedEmployee(isSelected ? null : emp)}
                          className={`
                            flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all
                            ${isSelected
                              ? 'border-green-500 bg-green-50 dark:bg-green-950'
                              : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-green-200'
                            }
                          `}
                        >
                          <Avatar name={emp.name} size="sm" />
                          <span className={`text-xs font-medium text-center leading-tight ${isSelected ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                            {emp.name.split(' ')[0]}
                          </span>
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {selectedServices.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-green-100 dark:border-green-900 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Total</span>
                  <span className="font-bold text-amber-500 dark:text-amber-400">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Duração</span>
                  <span className="text-gray-700 dark:text-gray-300">{formatDuration(totalDuration)}</span>
                </div>
                {selectedEmployee && (
                  <div className="flex justify-between text-sm border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
                    <span className="text-gray-500 dark:text-gray-400">Profissional</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">{selectedEmployee.name}</span>
                  </div>
                )}
              </div>
            )}

            <Button
              fullWidth
              size="lg"
              disabled={selectedServices.length === 0}
              onClick={() => setStep(1)}
            >
              Escolher data e horário
            </Button>
          </div>
        )}

        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 text-center">
              Escolha a data e o horário
            </h2>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 mb-4">
              <Calendar
                establishment={establishment}
                selectedDate={selectedDate}
                onSelect={d => { setSelectedDate(d); setSelectedTime(null) }}
              />
            </div>

            {selectedDate && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <Clock size={15} className="text-green-500" />
                  Horários disponíveis — {formatDateLong(selectedDate)}
                </h3>

                {slotsLoading ? (
                  <div className="flex justify-center py-6"><Spinner /></div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4 italic">
                    Nenhum horário disponível nesta data.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {slots.map(({ time, available }) => (
                      <button
                        key={time}
                        disabled={!available}
                        onClick={() => setSelectedTime(time)}
                        className={`
                          py-2.5 rounded-xl text-sm font-medium text-center transition-all
                          ${selectedTime === time
                            ? 'bg-amber-400 text-amber-900 font-bold shadow-md shadow-amber-200 dark:shadow-amber-900'
                            : available
                              ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed'
                          }
                        `}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(0)} fullWidth>
                Voltar
              </Button>
              <Button
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(2)}
                fullWidth
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Customer data */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
              Seus dados
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
              Para finalizar o agendamento
            </p>

            {/* Summary */}
            <div className="bg-green-50 dark:bg-green-950 rounded-2xl p-5 border border-green-100 dark:border-green-900 mb-5">
              <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-3">Resumo do agendamento</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Serviço</span>
                  <span className="text-gray-900 dark:text-white font-medium">{selectedServices.map(s => s.name).join(' + ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Data</span>
                  <span className="text-gray-900 dark:text-white">{formatDateLong(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Horário</span>
                  <span className="text-gray-900 dark:text-white">{selectedTime}</span>
                </div>
                {selectedEmployee && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Profissional</span>
                    <span className="text-gray-900 dark:text-white">{selectedEmployee.name}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-green-200 dark:border-green-800 pt-2 mt-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Total</span>
                  <span className="font-bold text-amber-500 dark:text-amber-400">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleConfirm)} className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <User size={14} className="text-green-500" /> Nome completo *
                  </label>
                  <input
                    placeholder="João Silva"
                    className={`w-full rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.name ? 'border-red-400' : ''}`}
                    {...register('name', { required: 'Nome obrigatório' })}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Phone size={14} className="text-green-500" /> WhatsApp *
                  </label>
                  <input
                    placeholder="(31) 99999-9999"
                    className={`w-full rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.phone ? 'border-red-400' : ''}`}
                    {...register('phone', {
                      required: 'Telefone obrigatório',
                      minLength: { value: 10, message: 'Número inválido' },
                    })}
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep(1)} fullWidth>
                  Voltar
                </Button>
                <Button type="submit" loading={submitting} fullWidth size="lg">
                  Confirmar pelo WhatsApp
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Confirmed */}
        {step === 3 && booking && (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-green-500" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Agendamento solicitado!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Sua solicitação foi enviada. Confirme diretamente pelo WhatsApp do estabelecimento.
            </p>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 mb-6 text-left max-w-sm mx-auto">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Serviço</span>
                  <span className="text-gray-900 dark:text-white font-medium">{selectedServices.map(s => s.name).join(' + ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Data</span>
                  <span className="text-gray-900 dark:text-white">{formatDateLong(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Horário</span>
                  <span className="text-gray-900 dark:text-white">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <Badge status="pending" />
                </div>
              </div>
            </div>

            <a href={booking.waLink} target="_blank" rel="noopener noreferrer">
              <Button fullWidth size="lg" icon={<MessageCircle size={18} />} className="bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200 dark:shadow-green-900">
                Abrir WhatsApp para confirmar
              </Button>
            </a>

            <button
              onClick={() => { setStep(0); setSelectedServices([]); setSelectedDate(null); setSelectedTime(null); setBooking(null) }}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Fazer outro agendamento
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 pb-10">
        <p className="text-xs text-gray-400">
          Agendamento via{' '}
          <a href="/" className="text-green-600 hover:underline font-medium">Agenda Uai</a>
        </p>
      </div>
    </div>
  )
}
