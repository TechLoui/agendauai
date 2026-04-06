import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { register as registerUser } from '../services/authService'
import { createEstablishment } from '../services/establishmentService'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  async function onSubmit({ name, email, password }) {
    setLoading(true)
    try {
      const user = await registerUser(email, password, name)
      await createEstablishment(user.uid, {
        ownerName: name,
        businessName: '',
        phone: '',
        whatsapp: '',
        address: '',
        description: '',
        slug: '',
        category: 'outro',
      })
      navigate('/onboarding')
      toast.success('Conta criada! Configure seu estabelecimento.')
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Este e-mail já está cadastrado.'
        : 'Erro ao criar conta. Tente novamente.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-gray-950 dark:to-green-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <img src="/Logo.png" alt="Agenda Uai" className="h-14 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Criar conta</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Comece a receber agendamentos hoje</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Seu nome"
              type="text"
              placeholder="João Silva"
              prefix={<User size={16} />}
              error={errors.name?.message}
              {...register('name', { required: 'Nome obrigatório', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
            />

            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              prefix={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email', {
                required: 'E-mail obrigatório',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'E-mail inválido' },
              })}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              prefix={<Lock size={16} />}
              error={errors.password?.message}
              {...register('password', { required: 'Senha obrigatória', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
            />

            <Input
              label="Confirmar senha"
              type="password"
              placeholder="Repita a senha"
              prefix={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Confirme a senha',
                validate: v => v === password || 'Senhas não coincidem',
              })}
            />

            <Button type="submit" fullWidth loading={loading} size="lg">
              Criar conta grátis
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-green-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
