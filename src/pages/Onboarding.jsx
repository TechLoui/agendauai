import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Store, MapPin, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { completeOnboarding } from '../services/establishmentService'
import { slugExists, reserveSlug } from '../services/slugService'
import { generateUniqueSlug } from '../utils/slugify'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Toggle from '../components/ui/Toggle'

const CATEGORIES = [
  { value: 'barbearia', label: 'Barbearia' },
  { value: 'salao', label: 'Salão de Beleza' },
  { value: 'manicure', label: 'Manicure / Nail Designer' },
  { value: 'lash', label: 'Lash Designer' },
  { value: 'sobrancelha', label: 'Designer de Sobrancelha' },
  { value: 'estetica', label: 'Clínica de Estética' },
  { value: 'tatuagem', label: 'Tatuador(a)' },
  { value: 'massagem', label: 'Massagista' },
  { value: 'outro', label: 'Outro' },
]

const DEFAULT_HOURS = {
  monday:    { open: true,  start: '09:00', end: '18:00' },
  tuesday:   { open: true,  start: '09:00', end: '18:00' },
  wednesday: { open: true,  start: '09:00', end: '18:00' },
  thursday:  { open: true,  start: '09:00', end: '18:00' },
  friday:    { open: true,  start: '09:00', end: '18:00' },
  saturday:  { open: true,  start: '09:00', end: '13:00' },
  sunday:    { open: false, start: '09:00', end: '13:00' },
}

const DAY_LABELS = {
  monday: 'Segunda-feira', tuesday: 'Terça-feira', wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira', friday: 'Sexta-feira', saturday: 'Sábado', sunday: 'Domingo',
}

const steps = [
  { icon: Store, label: 'Seu negócio' },
  { icon: MapPin, label: 'Endereço & contato' },
  { icon: Clock, label: 'Horários' },
  { icon: CheckCircle, label: 'Pronto!' },
]

export default function Onboarding() {
  const { user, refreshEstablishment } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [workingHours, setWorkingHours] = useState(DEFAULT_HOURS)
  const [formData, setFormData] = useState({})

  const { register, handleSubmit, formState: { errors } } = useForm()

  function handleHourChange(day, field, value) {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  async function onStep0(data) {
    setFormData(prev => ({ ...prev, ...data }))
    setStep(1)
  }

  async function onStep1(data) {
    setFormData(prev => ({ ...prev, ...data }))
    setStep(2)
  }

  async function finishOnboarding() {
    setLoading(true)
    try {
      const slug = await generateUniqueSlug(formData.businessName, slugExists)
      const payload = { ...formData, slug, workingHours, slotDuration: 20 }
      await completeOnboarding(user.uid, payload)
      await reserveSlug(slug, user.uid, formData.businessName)
      await refreshEstablishment()
      setStep(3)
    } catch (err) {
      toast.error('Erro ao salvar. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #14532d 0%, #1a1a1a 40%, #111827 60%, #78350f 100%)'}}>
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/Logo (sem fundo).png" alt="Agenda Uai" className="h-12 w-auto" />
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {steps.map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${i === step
                  ? 'bg-green-600 text-white'
                  : i < step
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }
              `}>
                <Icon size={12} />
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-6 h-0.5 rounded-full ${i < step ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0 */}
        {step === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Sobre seu negócio</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Essas informações aparecerão na sua página pública.</p>

            <form onSubmit={handleSubmit(onStep0)} className="space-y-5">
              <Input
                label="Nome do estabelecimento *"
                placeholder="Ex: Barbearia do João"
                error={errors.businessName?.message}
                {...register('businessName', { required: 'Nome obrigatório' })}
              />
              <Select
                label="Categoria *"
                error={errors.category?.message}
                {...register('category', { required: 'Categoria obrigatória' })}
              >
                <option value="">Selecione...</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
              <Input
                label="Descrição"
                placeholder="Conte um pouco sobre seu trabalho..."
                {...register('description')}
              />
              <Button type="submit" fullWidth size="lg">Próximo</Button>
            </form>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Contato e endereço</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Seu WhatsApp receberá as confirmações dos clientes.</p>

            <form onSubmit={handleSubmit(onStep1)} className="space-y-5">
              <Input
                label="WhatsApp (com DDD) *"
                placeholder="31 99999-9999"
                error={errors.whatsapp?.message}
                {...register('whatsapp', { required: 'WhatsApp obrigatório', minLength: { value: 10, message: 'Número inválido' } })}
              />
              <Input label="Telefone" placeholder="31 3333-3333" {...register('phone')} />
              <Input label="Endereço" placeholder="Rua, número, bairro" {...register('address')} />
              <Input label="Instagram" placeholder="@seuperfil" {...register('instagram')} />
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep(0)} fullWidth>Voltar</Button>
                <Button type="submit" fullWidth>Próximo</Button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Horários de funcionamento</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Defina quando você atende. Pode ajustar depois.</p>

            <div className="space-y-4 mb-6">
              {Object.entries(workingHours).map(([day, config]) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-32 flex-shrink-0">
                    <Toggle
                      label={DAY_LABELS[day]}
                      checked={config.open}
                      onChange={v => handleHourChange(day, 'open', v)}
                    />
                  </div>
                  {config.open && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={config.start}
                        onChange={e => handleHourChange(day, 'start', e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <span className="text-gray-400 text-sm">até</span>
                      <input
                        type="time"
                        value={config.end}
                        onChange={e => handleHourChange(day, 'end', e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                  {!config.open && <span className="text-sm text-gray-400 italic">Fechado</span>}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)} fullWidth>Voltar</Button>
              <Button onClick={finishOnboarding} loading={loading} fullWidth>Finalizar configuração</Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tudo pronto!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Seu estabelecimento está configurado. Agora adicione seus serviços e comece a receber agendamentos!
            </p>
            <Button fullWidth size="lg" onClick={() => navigate('/dashboard')}>
              Ir para o painel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
