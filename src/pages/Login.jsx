import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CalendarDays, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { login } from '../services/authService'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  async function onSubmit({ email, password }) {
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'E-mail ou senha incorretos.'
        : 'Erro ao entrar. Tente novamente.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 dark:from-gray-950 dark:to-violet-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <CalendarDays size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Agenda <span className="text-violet-600">Uai</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entrar na conta</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Acesse o painel do seu estabelecimento</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              placeholder="••••••••"
              prefix={<Lock size={16} />}
              error={errors.password?.message}
              {...register('password', { required: 'Senha obrigatória' })}
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-violet-600 hover:underline">
                Esqueci a senha
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg">
              Entrar
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Não tem conta?{' '}
          <Link to="/register" className="text-violet-600 font-medium hover:underline">
            Cadastrar estabelecimento
          </Link>
        </p>
      </div>
    </div>
  )
}
