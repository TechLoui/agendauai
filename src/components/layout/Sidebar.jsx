import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Clock,
  User,
  LogOut,
  Sun,
  Moon,
  X,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { logout } from '../../services/authService'
import Avatar from '../ui/Avatar'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/appointments', icon: CalendarDays, label: 'Agendamentos' },
  { to: '/dashboard/services', icon: Scissors, label: 'Serviços' },
  { to: '/dashboard/schedule', icon: Clock, label: 'Agenda' },
  { to: '/dashboard/profile', icon: User, label: 'Perfil' },
]

export default function Sidebar({ open, onClose }) {
  const { establishment, user } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
    toast.success('Até logo!')
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-40
          bg-white dark:bg-gray-950
          border-r border-gray-100 dark:border-gray-800
          flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo & close */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <CalendarDays size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
              Agenda <span className="text-violet-600">Uai</span>
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Business info */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <Avatar src={establishment?.logoUrl} name={establishment?.businessName || user?.displayName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {establishment?.businessName || 'Meu negócio'}
              </p>
              {establishment?.slug && (
                <a
                  href={`/book/${establishment.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1 hover:underline"
                >
                  Ver página <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150
                ${isActive
                  ? 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <button
            onClick={toggle}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {dark ? 'Modo claro' : 'Modo escuro'}
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
