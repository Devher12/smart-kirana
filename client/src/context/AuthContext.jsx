import { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

const initialState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  loading: true,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false }
    case 'LOGOUT':
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return { ...state, user: null, token: null, loading: false }
    case 'SET_USER':
      localStorage.setItem('user', JSON.stringify(action.payload))
      return { ...state, user: action.payload, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const init = async () => {
      if (state.token) {
        try {
          const { data } = await authAPI.getMe()
          dispatch({ type: 'SET_USER', payload: data.user })
        } catch {
          dispatch({ type: 'LOGOUT' })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
    init()
  }, [])

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    dispatch({ type: 'LOGIN', payload: data })
    return data.user
  }

  const logout = () => dispatch({ type: 'LOGOUT' })

  return (
    <AuthContext.Provider value={{ ...state, login, logout, dispatch }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
