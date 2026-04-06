import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { resetPassword } from '../services/authService'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  async function onSubmit({ email }) {
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch {
      toast.error('Erro ao enviar e-mail. Verifique o endereço.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-gray-950 dark:to-green-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <img src="/Logo (sem fundo).png" alt="Agenda Uai" className="h-14 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recuperar senha</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Enviaremos um link para redefinir sua senha
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">E-mail enviado!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Verifique sua caixa de entrada e siga as instruções para redefinir a senha.
              </p>
              <Link to="/login">
                <Button variant="outline" fullWidth>Voltar ao login</Button>
              </Link>
            </div>
          ) : (
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
              <Button type="submit" fullWidth loading={loading} size="lg">
                Enviar link de recuperação
              </Button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:underline">
            <ArrowLeft size={14} />
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  )
}
