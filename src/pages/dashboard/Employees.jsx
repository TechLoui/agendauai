import { useEffect, useState } from 'react'
import { Users, Plus, Edit2, Trash2, Phone, Scissors, ToggleLeft, ToggleRight } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../services/employeesService'
import { getServices } from '../../services/servicesService'
import { formatPhone } from '../../utils/formatters'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'

const ROLES = [
  { value: 'barbeiro', label: 'Barbeiro' },
  { value: 'cabeleireiro', label: 'Cabeleireiro(a)' },
  { value: 'manicure', label: 'Manicure' },
  { value: 'esteticista', label: 'Esteticista' },
  { value: 'tatuador', label: 'Tatuador(a)' },
  { value: 'massagista', label: 'Massagista' },
  { value: 'lash', label: 'Lash Designer' },
  { value: 'sobrancelha', label: 'Designer de Sobrancelha' },
  { value: 'outro', label: 'Outro' },
]

function EmployeeForm({ employee, services, onSave, loading }) {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: employee ? {
      name: employee.name,
      role: employee.role,
      phone: employee.phone || '',
      serviceIds: employee.serviceIds || [],
    } : { serviceIds: [] },
  })

  async function onSubmit(data) {
    await onSave(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Nome completo *"
        placeholder="Ex: João Silva"
        error={errors.name?.message}
        {...register('name', { required: 'Nome obrigatório' })}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Função *</label>
        <select
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          {...register('role', { required: 'Função obrigatória' })}
        >
          <option value="">Selecione...</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
      </div>

      <Input
        label="Telefone / WhatsApp"
        placeholder="(31) 99999-9999"
        {...register('phone')}
      />

      {/* Services */}
      {services.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Serviços que realiza
          </label>
          <Controller
            control={control}
            name="serviceIds"
            render={({ field }) => (
              <div className="space-y-2">
                {services.map(service => {
                  const checked = field.value?.includes(service.id)
                  return (
                    <label
                      key={service.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                        ${checked
                          ? 'border-violet-400 bg-violet-50 dark:bg-violet-950'
                          : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        className="accent-violet-600 w-4 h-4"
                        checked={checked}
                        onChange={e => {
                          const next = e.target.checked
                            ? [...(field.value || []), service.id]
                            : (field.value || []).filter(id => id !== service.id)
                          field.onChange(next)
                        }}
                      />
                      <span className={`text-sm font-medium ${checked ? 'text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {service.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          />
        </div>
      )}

      <Button type="submit" fullWidth loading={loading}>
        {employee ? 'Salvar alterações' : 'Adicionar funcionário'}
      </Button>
    </form>
  )
}

export default function Employees() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  async function fetchData() {
    if (!user) return
    setLoading(true)
    const [emps, svcs] = await Promise.all([
      getEmployees(user.uid),
      getServices(user.uid),
    ])
    setEmployees(emps)
    setServices(svcs.filter(s => s.isActive))
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [user])

  async function handleSave(data) {
    setSaving(true)
    try {
      if (modal === 'create') {
        await createEmployee(user.uid, data)
        toast.success('Funcionário adicionado!')
      } else {
        await updateEmployee(user.uid, modal.id, data)
        toast.success('Funcionário atualizado!')
      }
      setModal(null)
      fetchData()
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(emp) {
    try {
      await updateEmployee(user.uid, emp.id, { isActive: !emp.isActive })
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, isActive: !e.isActive } : e))
    } catch {
      toast.error('Erro ao atualizar.')
    }
  }

  async function handleDelete(emp) {
    if (!confirm(`Remover "${emp.name}"?`)) return
    setDeleting(emp.id)
    try {
      await deleteEmployee(user.uid, emp.id)
      setEmployees(prev => prev.filter(e => e.id !== emp.id))
      toast.success('Funcionário removido.')
    } catch {
      toast.error('Erro ao remover.')
    } finally {
      setDeleting(null)
    }
  }

  function getEmployeeServices(emp) {
    return services.filter(s => emp.serviceIds?.includes(s.id))
  }

  function getRoleLabel(value) {
    return ROLES.find(r => r.value === value)?.label || value
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Funcionários</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gerencie sua equipe e os serviços de cada um
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setModal('create')}>
          Adicionar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : employees.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={28} />}
            title="Nenhum funcionário cadastrado"
            description="Adicione sua equipe para que os clientes possam escolher o profissional na hora de agendar."
            action={
              <Button icon={<Plus size={16} />} onClick={() => setModal('create')}>
                Adicionar primeiro funcionário
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map(emp => {
            const empServices = getEmployeeServices(emp)
            return (
              <Card key={emp.id} padding={false}>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar name={emp.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{emp.name}</h3>
                        <Badge status={emp.isActive ? 'active' : 'inactive'} />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{getRoleLabel(emp.role)}</p>
                      {emp.phone && (
                        <a
                          href={`https://wa.me/${emp.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          <Phone size={11} /> {emp.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {empServices.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                        <Scissors size={11} /> Serviços
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {empServices.map(s => (
                          <span key={s.id} className="text-xs bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => handleToggle(emp)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                        emp.isActive
                          ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {emp.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {emp.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => setModal(emp)}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(emp)}
                        disabled={deleting === emp.id}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      >
                        {deleting === emp.id ? <Spinner size="sm" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Novo funcionário' : 'Editar funcionário'}
      >
        {modal && (
          <EmployeeForm
            employee={modal === 'create' ? null : modal}
            services={services}
            onSave={handleSave}
            loading={saving}
          />
        )}
      </Modal>
    </div>
  )
}
