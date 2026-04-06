import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'
import { getEstablishment } from '../services/establishmentService'

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
