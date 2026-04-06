import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'

// Public pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Booking from './pages/Booking'

// Protected pages
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/dashboard/Dashboard'
import Appointments from './pages/dashboard/Appointments'
import Services from './pages/dashboard/Services'
import Schedule from './pages/dashboard/Schedule'
import Profile from './pages/dashboard/Profile'

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/book/:slug" element={<Booking />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/appointments" element={<Appointments />} />
                <Route path="/dashboard/services" element={<Services />} />
                <Route path="/dashboard/schedule" element={<Schedule />} />
                <Route path="/dashboard/profile" element={<Profile />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white',
              duration: 3500,
              style: { borderRadius: '10px', fontFamily: 'Inter, sans-serif' },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}
