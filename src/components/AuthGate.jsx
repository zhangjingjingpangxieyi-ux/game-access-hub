import { useEffect, useState } from 'react'
import { baas } from '../lib/supabase'
import { AuthContext } from '../lib/auth'

const TEXT = {
  unknownError: '\u672a\u77e5\u9519\u8bef',
  loading: '\u6b63\u5728\u9a8c\u8bc1\u4f01\u4e1a\u8eab\u4efd...',
  loginTitle: '\u65e0\u6cd5\u767b\u5f55\u63a5\u5165\u5de5\u4f5c\u53f0',
  loginDesc: '\u8bf7\u4f7f\u7528\u4f01\u4e1a\u9489\u9489\u8d26\u53f7\u767b\u5f55\u540e\u91cd\u8bd5\u3002',
  retry: '\u91cd\u65b0\u767b\u5f55',
}

function getErrorMessage(error) {
  if (!error) return TEXT.unknownError
  if (error.message) return error.message
  return String(error)
}

export default function AuthGate({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, roles: [], error: '' })

  useEffect(() => {
    let active = true

    async function authenticate() {
      try {
        let user = baas.auth.currentUser()
        if (!user) {
          await baas.auth.sso({ redirectOnGuest: true })
          user = baas.auth.currentUser()
        }

        if (!user) return

        let roles = []
        try {
          roles = await baas.auth.roles()
        } catch (roleError) {
          console.warn('Load roles failed, continue as normal user:', roleError)
        }

        if (active) setState({ status: 'ready', user, roles: roles || [], error: '' })
      } catch (error) {
        console.error('SSO login failed:', error)
        if (active) setState({ status: 'error', user: null, roles: [], error: getErrorMessage(error) })
      }
    }

    authenticate()
    return () => { active = false }
  }, [])

  if (state.status === 'loading') {
    return <div className="min-h-screen grid place-items-center bg-gray-50 text-sm text-gray-500">{TEXT.loading}</div>
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-base font-semibold text-gray-900">{TEXT.loginTitle}</h1>
          <p className="mt-2 text-sm text-gray-500">{TEXT.loginDesc}</p>
          <p className="mt-3 break-all rounded bg-gray-50 px-3 py-2 text-left text-xs text-gray-500">{state.error}</p>
          <button className="mt-5 rounded-md bg-primary-500 px-4 py-2 text-sm text-white" onClick={() => location.reload()}>{TEXT.retry}</button>
        </div>
      </div>
    )
  }

  const roleKeys = state.roles.map(role => typeof role === 'string' ? role : role.role_key || role.key)
  async function logout() {
    await baas.auth.logout()
    location.reload()
  }

  const value = { user: state.user, roles: roleKeys, isAdmin: roleKeys.includes('admin') || roleKeys.includes('owner'), logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
