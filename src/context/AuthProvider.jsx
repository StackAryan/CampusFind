import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, signIn, signOut, verifyStudentOtp } from '../lib/api'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then((profile) => {
        if (active) setUser(profile)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email, password, expectedRole) => {
    const profile = await signIn(email, password)
    if (expectedRole && profile.role !== expectedRole) {
      await signOut().catch(() => {})
      throw new Error('This account is not an administrator. Use the student login tab instead.')
    }
    setUser(profile)
    return profile
  }, [])

  const loginWithOtp = useCallback(async (email, token) => {
    const profile = await verifyStudentOtp(email, token)
    setUser(profile)
    return profile
  }, [])

  const logout = useCallback(async () => {
    await signOut()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, loginWithOtp, logout }),
    [user, loading, login, loginWithOtp, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
