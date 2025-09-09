import { useAuth } from '../../contexts/AuthContext'
export default function RequirePaid({ children }) {
  const { user } = useAuth()
  if (!user?.entitlements?.includes('PAID')) return null
  return children
}
