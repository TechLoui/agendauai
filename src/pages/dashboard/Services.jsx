import { useEffect, useState, useRef } from 'react'
import { Scissors, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, ImagePlus, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { getServices, createService, updateService, deleteService } from '../../services/servicesService'
import { uploadImage, deleteImage } from '../../services/storageService'
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

const MAX_PHOTOS = 2

function PhotoUploader({ uid, existingUrls = [], onChange }) {
  // urls: confirmed URLs (existing + newly uploaded)
  // previews: { file, previewUrl } for files selected but not yet uploaded
  const [urls, setUrls] = useState(existingUrls)
  const [previews, setPreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  const totalCount = urls.length + previews.length
  const canAdd = totalCount < MAX_PHOTOS

  function notifyParent(newUrls, newPreviews) {
    onChange({ confirmedUrls: newUrls, pendingFiles: newPreviews.map(p => p.file) })
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remaining = MAX_PHOTOS - urls.length - previews.length
    const toAdd = files.slice(0, remaining)

    const newPreviews = toAdd.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    const updated = [...previews, ...newPreviews]
    setPreviews(updated)
    notifyParent(urls, updated)
    e.target.value = ''
  }

  function removeUrl(idx) {
    const removed = urls[idx]
    const next = urls.filter((_, i) => i !== idx)
    setUrls(next)
    notifyParent(next, previews)
    // mark for deletion (passed up via onChange as removedUrls)
    onChange({ confirmedUrls: next, pendingFiles: previews.map(p => p.file), removedUrls: [removed] })
  }

  function removePreview(idx) {
    URL.revokeObjectURL(previews[idx].previewUrl)
    const next = previews.filter((_, i) => i !== idx)
    setPreviews(next)
    notifyParent(urls, next)
  }

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
        Fotos do serviço <span className="text-gray-400 font-normal">(máx. {MAX_PHOTOS})</span>
      </label>

      <div className="flex gap-3 flex-wrap">
        {/* Existing confirmed photos */}
        {urls.map((url, i) => (
          <div key={url} className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-700">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeUrl(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={11} />
            </button>
          </div>
        ))}

        {/* Pending previews */}
        {previews.map((p, i) => (
          <div key={p.previewUrl} className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-violet-200 dark:border-violet-700">
            <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-violet-600/10 flex items-center justify-center">
              <span className="text-xs text-violet-700 dark:text-violet-300 font-medium bg-white/80 dark:bg-gray-900/80 px-1.5 py-0.5 rounded">
                Novo
              </span>
            </div>
            <button
              type="button"
              onClick={() => removePreview(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={11} />
            </button>
          </div>
        ))}

        {/* Add button */}
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-violet-400 hover:text-violet-500 transition-colors"
          >
            <ImagePlus size={20} />
            <span className="text-xs">Adicionar</span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">JPG, PNG ou WebP • máx. 2MB por foto</p>
    </div>
  )
}

function ServiceForm({ uid, service, onSave }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: service ? {
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: (service.price / 100).toFixed(2),
    } : {},
  })

  const [loading, setLoading] = useState(false)
  const [photoData, setPhotoData] = useState({
    confirmedUrls: service?.photoUrls || [],
    pendingFiles: [],
    removedUrls: [],
  })

  async function onSubmit(data) {
    setLoading(true)
    try {
      // Validate file sizes
      for (const file of photoData.pendingFiles) {
        if (file.size > 2 * 1024 * 1024) {
          toast.error(`"${file.name}" excede 2MB.`)
          setLoading(false)
          return
        }
      }

      // Upload new files
      const uploadedUrls = await Promise.all(
        photoData.pendingFiles.map(file => uploadImage(uid, file, 'services'))
      )

      // Delete removed photos from Storage
      if (photoData.removedUrls?.length) {
        await Promise.allSettled(photoData.removedUrls.map(url => deleteImage(url)))
      }

      const finalPhotoUrls = [...photoData.confirmedUrls, ...uploadedUrls]

      await onSave({
        name: data.name,
        description: data.description,
        duration: Number(data.duration),
        price: Math.round(parseFloat(data.price.replace(',', '.')) * 100),
        photoUrls: finalPhotoUrls,
      })
    } catch {
      toast.error('Erro ao salvar fotos. Tente novamente.')
    } finally {
      setLoading(false)
    }
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
          label="Duração *"
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

      <PhotoUploader
        uid={uid}
        existingUrls={service?.photoUrls || []}
        onChange={data => setPhotoData(prev => ({ ...prev, ...data }))}
      />

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
  const [modal, setModal] = useState(null)
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
      // Delete photos from Storage
      if (service.photoUrls?.length) {
        await Promise.allSettled(service.photoUrls.map(url => deleteImage(url)))
      }
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
              {/* Photos strip */}
              {service.photoUrls?.length > 0 && (
                <div className={`grid ${service.photoUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5 rounded-t-2xl overflow-hidden`}>
                  {service.photoUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={service.name}
                      className="w-full h-36 object-cover"
                    />
                  ))}
                </div>
              )}

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
        size="md"
      >
        {modal && (
          <ServiceForm
            uid={user.uid}
            service={modal === 'create' ? null : modal}
            onSave={handleSave}
          />
        )}
      </Modal>
    </div>
  )
}
