import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Receipt, Users,
  Truck, BarChart3, Settings, LogOut, Store, Menu, X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'

const ownerLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/pos', icon: ShoppingCart, label: 'POS' },
  { to: '/sales', icon: Receipt, label: 'Sales' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/suppliers', icon: Truck, label: 'Suppliers' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const cashierLinks = [
  { to: '/pos', icon: ShoppingCart, label: 'POS' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/sales', icon: Receipt, label: 'Sales' },
  { to: '/customers', icon: Users, label: 'Customers' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = user?.role === 'owner' ? ownerLinks : cashierLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-6 border-b border-white/10">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
          <Store className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg font-[family-name:var(--font-heading)]">Smart Kirana</h1>
          <p className="text-white/60 text-xs capitalize">{user?.role}</p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
              isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="px-4 py-2 mb-2">
          <p className="text-white text-sm font-medium truncate">{user?.name}</p>
          <p className="text-white/50 text-xs truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-primary">
        <NavContent />
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary border-t border-white/10 z-40 flex justify-around py-2 px-1">
        {links.slice(0, 5).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px]',
              isActive ? 'text-accent' : 'text-white/60'
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
        <button onClick={() => setMobileOpen(true)} className="flex flex-col items-center gap-0.5 px-2 py-1 text-white/60 text-[10px]">
          <Menu className="w-5 h-5" />
          More
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-primary flex flex-col">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-white">
              <X className="w-6 h-6" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
