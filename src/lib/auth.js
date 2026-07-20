import { createContext, useContext } from 'react'

export const AuthContext = createContext({ user: null, roles: [], isAdmin: false })

export function useAuth() {
  return useContext(AuthContext)
}
