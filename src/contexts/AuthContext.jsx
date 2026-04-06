import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'
import { getEstablishment } from '../services/establishmentService'
import { slugExists, reserveSlug } from '../services/slugService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [establishment, setEstablishment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async firebaseUser => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const data = await getEstablishment(firebaseUser.uid)
        setEstablishment(data)
        // Auto-repair slug document if missing
        if (data?.slug) {
          slugExists(data.slug).then(exists => {
            if (!exists) reserveSlug(data.slug, data.uid, data.businessName).catch(() => {})
          }).catch(() => {})
        }
      } else {
        setEstablishment(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function refreshEstablishment() {
    if (!user) return
    const data = await getEstablishment(user.uid)
    setEstablishment(data)
    // Auto-repair slug document if missing
    if (data?.slug) {
      slugExists(data.slug).then(exists => {
        if (!exists) reserveSlug(data.slug, data.uid, data.businessName).catch(() => {})
      }).catch(() => {})
    }
  }

  return (
    <AuthContext.Provider value={{ user, establishment, loading, setEstablishment, refreshEstablishment }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
