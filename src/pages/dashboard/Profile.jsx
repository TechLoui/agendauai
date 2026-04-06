import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Camera, User, ExternalLink, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { updateEstablishment } from '../../services/establishmentService'
import { uploadImage } from '../../services/storageService'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Card from '../../components/ui/Card'
import Avatar from '../../components/ui/Avatar'

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

export default function Profile() {
  const { user, establishment, refreshEstablishment } = useAuth()
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef()

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      businessName: establishment?.businessName || '',
      category: establishment?.category || 'outro',
      description: establishment?.description || '',
      phone: establishment?.phone || '',
      whatsapp: establishment?.whatsapp || '',
      address: establishment?.address || '',
      instagram: establishment?.instagram || '',
    },
  })

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB.')
      return
    }

    setUploadingLogo(true)
    try {
      const url = await uploadImage(user.uid, file, 'logos')
      await updateEstablishment(user.uid, { logoUrl: url })
      await refreshEstablishment()
      toast.success('Logo atualizada!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao fazer upload. Verifique as regras do Storage.')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function onSubmit(data) {
    setSaving(true)
    try {
      await updateEstablishment(user.uid, data)
      await refreshEstablishment()
      toast.success('Perfil atualizado!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/book/${establishment?.slug}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Perfil</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Informações do seu estabelecimento</p>
      </div>

      {/* Link público */}
      {establishment?.slug && (
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Seu link de agendamento</h2>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-50 dark:bg-violet-950 border border-violet-100 dark:border-violet-900">
            <span className="flex-1 text-sm text-violet-700 dark:text-violet-300 font-mono truncate">
              {window.location.origin}/book/{establishment.slug}
            </span>
            <button
              onClick={copyLink}
              className="p-2 rounded-lg text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900 transition-colors"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
            <a
              href={`/book/${establishment.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900 transition-colors"
              title="Abrir página"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </Card>
      )}

      {/* Logo */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Logo</h2>
        <div className="flex items-center gap-5">
          <Avatar
            src={establishment?.logoUrl}
            name={establishment?.businessName}
            size="xl"
          />
          <div>
            {/* Input escondido — acionado via ref */}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              variant="secondary"
              size="sm"
              loading={uploadingLogo}
              icon={<Camera size={14} />}
              onClick={() => logoInputRef.current?.click()}
            >
              {uploadingLogo ? 'Enviando...' : 'Alterar logo'}
            </Button>
            <p className="text-xs text-gray-400 mt-2">JPG, PNG ou WebP • máx. 2MB</p>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <User size={18} className="text-violet-500" />
          Informações do negócio
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Nome do estabelecimento *"
              error={errors.businessName?.message}
              {...register('businessName', { required: 'Obrigatório' })}
            />
            <Select label="Categoria" {...register('category')}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Descrição"
            placeholder="Fale sobre seu estabelecimento..."
            rows={3}
            {...register('description')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="WhatsApp *"
              placeholder="31 99999-9999"
              error={errors.whatsapp?.message}
              {...register('whatsapp', { required: 'WhatsApp obrigatório' })}
            />
            <Input label="Telefone" placeholder="31 3333-3333" {...register('phone')} />
          </div>

          <Input label="Endereço" placeholder="Rua, número, bairro, cidade" {...register('address')} />

          <Input label="Instagram" placeholder="@seuperfil" {...register('instagram')} />

          <Button type="submit" loading={saving} size="lg">
            Salvar alterações
          </Button>
        </form>
      </Card>
    </div>
  )
}
