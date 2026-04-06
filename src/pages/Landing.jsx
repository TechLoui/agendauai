import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Smartphone,
  BarChart3,
  Clock,
  Users,
  CheckCircle,
  Scissors,
  Star,
  ArrowRight,
  Zap,
} from 'lucide-react'
import Button from '../components/ui/Button'

const features = [
  {
    icon: CalendarDays,
    title: 'Agenda inteligente',
    desc: 'Controle completo dos seus horários. Bloqueie datas, defina intervalos e gerencie tudo num lugar só.',
  },
  {
    icon: Smartphone,
    title: 'WhatsApp integrado',
    desc: 'Clientes confirmam pelo WhatsApp com mensagem gerada automaticamente. Zero complicação.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard com métricas',
    desc: 'Acompanhe faturamento estimado, serviços mais agendados e histórico de clientes.',
  },
  {
    icon: Users,
    title: 'Gestão de clientes',
    desc: 'Histórico completo de cada cliente: frequência, último atendimento e serviços preferidos.',
  },
  {
    icon: Clock,
    title: 'Link exclusivo',
    desc: 'Cada estabelecimento tem sua página própria. Compartilhe no Instagram, WhatsApp e onde quiser.',
  },
  {
    icon: Zap,
    title: 'Configuração rápida',
    desc: 'Em menos de 5 minutos seu estabelecimento já está pronto para receber agendamentos online.',
  },
]

const niches = [
  'Barbearias', 'Salões de beleza', 'Manicures', 'Lash designers',
  'Sobrancelhas', 'Estética', 'Tatuadores', 'Massagistas',
]

const testimonials = [
  {
    name: 'Ana Paula',
    business: 'Studio AP - Cílios & Sobrancelhas',
    text: 'Reduzi em 80% o tempo que perdia gerenciando agenda pelo WhatsApp. Agora os clientes agendam sozinhos!',
    stars: 5,
  },
  {
    name: 'Rafael',
    business: 'Barbearia do Rafa',
    text: 'Interface super fácil. Em 10 minutos já tava com tudo configurado e link prontinho pra divulgar.',
    stars: 5,
  },
  {
    name: 'Camila',
    business: 'Espaço Beleza Camila',
    text: 'O melhor investimento que fiz pro meu salão. Cliente agenda, eu confirmo no painel, simples assim.',
    stars: 5,
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <img src="/Logo.png" alt="Agenda Uai" className="h-9 w-auto" />
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-green-950/30 dark:via-emerald-950/20 dark:to-gray-950 -z-10" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-green-300/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-amber-300/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Zap size={14} />
              Sem mensalidade no primeiro mês
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
              Agendamentos online{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                sem complicação
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              Crie sua página de agendamento em minutos. Seus clientes agendam online, confirmam pelo WhatsApp e você gerencia tudo num painel simples e elegante.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  Criar minha página grátis
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="/book/demo">
                <Button variant="secondary" size="lg">
                  Ver exemplo de página
                </Button>
              </a>
            </div>

            <p className="text-sm text-gray-400 mt-4">
              Sem cartão de crédito • Configuração em 5 minutos
            </p>
          </div>
        </div>
      </section>

      {/* Niches */}
      <section className="py-10 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-5 uppercase tracking-wider">
            Ideal para
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {niches.map(n => (
              <span key={n} className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm">
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Tudo que você precisa
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Do agendamento ao pagamento, temos as ferramentas certas para o seu negócio crescer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:shadow-green-100 dark:hover:shadow-green-900/20 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950 flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                <Icon size={22} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-emerald-700">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Como funciona</h2>
            <p className="text-green-200 max-w-xl mx-auto">Seu cliente agenda em menos de 2 minutos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: '1', title: 'Acessa o link', desc: 'Cliente clica no seu link exclusivo' },
              { n: '2', title: 'Escolhe o serviço', desc: 'Vê preços, duração e disponibilidade' },
              { n: '3', title: 'Seleciona horário', desc: 'Escolhe a data e horário livre' },
              { n: '4', title: 'Confirma no WhatsApp', desc: 'Mensagem automática gerada na hora' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                  {n}
                </div>
                <h3 className="text-white font-semibold mb-1">{title}</h3>
                <p className="text-green-200 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            O que nossos clientes dizem
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, business, text, stars }) => (
            <div key={name} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex mb-3">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">"{text}"</p>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{name}</p>
                <p className="text-xs text-gray-400">{business}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Plano simples e justo
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Sem taxas por agendamento. Pague uma mensalidade fixa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Gratuito</h3>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">R$0<span className="text-base font-normal text-gray-400">/mês</span></p>
              <p className="text-sm text-gray-500 mb-6">Para começar</p>
              <ul className="space-y-3 mb-8">
                {['Página de agendamento', 'Até 30 agendamentos/mês', 'WhatsApp integrado', 'Dashboard básico'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button variant="secondary" fullWidth>Começar grátis</Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
                MAIS POPULAR
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Pro</h3>
              <p className="text-3xl font-extrabold text-white mb-1">R$49<span className="text-base font-normal text-green-200">/mês</span></p>
              <p className="text-sm text-green-200 mb-6">Para profissionais</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Agendamentos ilimitados',
                  'Múltiplos funcionários',
                  'Relatórios avançados',
                  'Gestão de clientes',
                  'Suporte prioritário',
                  'Link personalizado',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-green-100">
                    <CheckCircle size={16} className="text-white flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button variant="secondary" fullWidth>Experimentar 30 dias</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 max-w-6xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-12 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-2xl" />
            <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-2xl" />
          </div>
          <div className="relative">
            <Scissors size={40} className="text-white/50 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para começar?
            </h2>
            <p className="text-green-200 text-lg mb-8 max-w-xl mx-auto">
              Junte-se a centenas de profissionais que já simplificaram seus agendamentos com o Agenda Uai.
            </p>
            <Link to="/register">
              <Button variant="secondary" size="lg" className="gap-2">
                Criar minha página agora
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <img src="/Logo.png" alt="Agenda Uai" className="h-7 w-auto" />
          <p>© 2026 Agenda Uai. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-green-600 transition-colors">Termos</a>
            <a href="#" className="hover:text-green-600 transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
