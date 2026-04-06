import { useEffect, useState } from 'react'
import { Scissors, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getServices, createService, updateService, deleteService } from '../../services/servicesService'
import { formatPrice, formatDuration } from '../../utils/formatters'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'

function ServiceForm({ service, onSave, onClose }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: service ? {
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: (service.price / 100).toFixed(2),
    } : {},
  })
  const [loading, setLoading] = useState(false)

  async function onSubmit(data) {
    setLoading(true)
    await onSave({
      name: data.name,
      description: data.description,
      duration: Number(data.duration),
      price: Math.round(parseFloat(data.price.replace(',', '.')) * 100),
    })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nome do serviço *"
        placeholder="Ex: Corte + Barba"
        error={errors.name?.message}
        {...register('name', { required: 'Nome obrigatório' })}
      />

      <Textarea
        label="Descrição"
        placeholder="Descreva o que está incluso..."
        {...register('description')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Duração (minutos) *"
          error={errors.duration?.message}
          {...register('duration', { required: 'Obrigatório' })}
        >
          <option value="">Selecione</option>
          {Array.from({ length: 18 }, (_, i) => (i + 1) * 20).map(d => (
            <option key={d} value={d}>{formatDuration(d)}</option>
          ))}
        </Select>

        <Input
          label="Preço (R$) *"
          type="text"
          placeholder="50,00"
          prefix="R$"
          error={errors.price?.message}
          {...register('price', {
            required: 'Preço obrigatório',
            pattern: { value: /^\d+([.,]\d{1,2})?$/, message: 'Preço inválido' },
          })}
        />
      </div>

      <Button type="submit" fullWidth loading={loading}>
        {service ? 'Salvar alterações' : 'Criar serviço'}
      </Button>
    </form>
  )
}

export default function Services() {
  const { user } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | service object
  const [deleting, setDeleting] = useState(null)

  async function fetchServices() {
    if (!user) return
    setLoading(true)
    const data = await getServices(user.uid)
    setServices(data)
    setLoading(false)
  }

  useEffect(() => { fetchServices() }, [user])

  async function handleSave(data) {
    try {
      if (modal === 'create') {
        await createService(user.uid, data)
        toast.success('Serviço criado!')
      } else {
        await updateService(user.uid, modal.id, data)
        toast.success('Serviço atualizado!')
      }
      setModal(null)
      fetchServices()
    } catch {
      toast.error('Erro ao salvar serviço.')
    }
  }

  async function handleToggle(service) {
    try {
      await updateService(user.uid, service.id, { isActive: !service.isActive })
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: !s.isActive } : s))
    } catch {
      toast.error('Erro ao atualizar.')
    }
  }

  async function handleDelete(service) {
    if (!confirm(`Excluir "${service.name}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(service.id)
    try {
      await deleteService(user.uid, service.id)
      setServices(prev => prev.filter(s => s.id !== service.id))
      toast.success('Serviço excluído.')
    } catch {
      toast.error('Erro ao excluir.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Serviços</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gerencie os serviços que você oferece</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setModal('create')}>
          Novo serviço
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : services.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Scissors size={28} />}
            title="Nenhum serviço cadastrado"
            description="Crie seus serviços para que os clientes possam agendá-los."
            action={
              <Button icon={<Plus size={16} />} onClick={() => setModal('create')}>
                Criar primeiro serviço
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map(service => (
            <Card key={service.id} padding={false}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {service.name}
                      </h3>
                      <Badge status={service.isActive ? 'active' : 'inactive'} />
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                        {formatPrice(service.price)}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        {formatDuration(service.duration)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleToggle(service)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                      service.isActive
                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950'
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    title={service.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {service.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {service.isActive ? 'Ativo' : 'Inativo'}
                  </button>

                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => setModal(service)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(service)}
                      disabled={deleting === service.id}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      {deleting === service.id ? <Spinner size="sm" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Novo serviço' : 'Editar serviço'}
      >
        {modal && (
          <ServiceForm
            service={modal === 'create' ? null : modal}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}
