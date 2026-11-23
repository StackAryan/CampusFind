import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Plus,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import Logo from './Logo'
import Avatar from './Avatar'
import NotificationBell from './NotificationBell'
import { useAuth } from '../context/useAuth'
import { isDemoMode } from '../lib/api'
import { toast } from '../lib/toast'
import { cn } from '../lib/utils'

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'rounded-full px-3.5 py-2 text-sm font-medium transition',
          isActive
            ? 'bg-ink text-cream'
            : 'text-ink/65 hover:bg-ink/5 hover:text-ink',
        )
      }
    >
      {children}
    </NavLink>
  )
}

function MobileLink({ to, icon: Icon, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
          isActive ? 'bg-moss-soft text-moss' : 'text-ink/70 hover:bg-ink/5',
        )
      }
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </NavLink>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      toast.info('You have been signed out.')
      navigate('/')
    } catch (error) {
      toast.error(error.message || 'Could not sign out.')
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Logo />

        {isDemoMode && (
          <span
            title="Runs on local demo data until Supabase credentials are added"
            className="chip hidden bg-gold-soft text-yellow-800 lg:inline-flex"
          >
            Demo mode
          </span>
        )}

        <nav className="ml-5 hidden items-center gap-1 md:flex" aria-label="Main navigation">
          <NavItem to="/browse">Browse</NavItem>
          {user && <NavItem to="/matches">Matches</NavItem>}
          {user && <NavItem to="/dashboard">Dashboard</NavItem>}
          {user?.role === 'admin' && (
            <NavItem to="/admin">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Admin
              </span>
            </NavItem>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link to="/report" className="btn-primary hidden !px-4 md:inline-flex">
                <Plus className="h-4 w-4" /> Report item
              </Link>
              <NotificationBell />
              <div className="hidden items-center gap-2 border-l border-line pl-3 md:flex">
                <Avatar name={user.full_name} />
                <div className="hidden leading-tight xl:block">
                  <p className="max-w-32 truncate text-sm font-semibold">{user.full_name}</p>
                  <p className="text-[11px] text-ink/45">
                    {user.role === 'admin' ? 'Administrator' : 'Student'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="btn-ghost !p-2"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login?tab=admin" className="btn-ghost hidden md:inline-flex">
                Admin
              </Link>
              <Link to="/login" className="btn-primary hidden md:inline-flex">
                Student login
              </Link>
            </>
          )}

          <button
            onClick={() => setMenuOpen((current) => !current)}
            className="btn-ghost !p-2 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="animate-rise border-t border-line bg-paper px-4 py-4 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          {user && (
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-cream px-3 py-3">
              <Avatar name={user.full_name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{user.full_name}</p>
                <p className="truncate text-xs text-ink/50">{user.email}</p>
                <span className="chip mt-1 bg-moss-soft !px-2 !py-0.5 text-moss">
                  {user.role === 'admin' ? 'Administrator' : 'Student'}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <MobileLink to="/browse" icon={ScanSearch}>
              Browse listings
            </MobileLink>
            {user && (
              <>
                <MobileLink to="/matches" icon={Sparkles}>
                  Potential matches
                </MobileLink>
                <MobileLink to="/dashboard" icon={LayoutDashboard}>
                  My dashboard
                </MobileLink>
                <MobileLink to="/report?type=lost" icon={Plus}>
                  Report a lost item
                </MobileLink>
                <MobileLink to="/report?type=found" icon={Plus}>
                  Report a found item
                </MobileLink>
                {user.role === 'admin' && (
                  <MobileLink to="/admin" icon={ShieldCheck}>
                    Admin dashboard
                  </MobileLink>
                )}
              </>
            )}
          </div>

          <div className="mt-4 border-t border-line pt-3">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-coral transition hover:bg-coral-soft/60"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" className="btn-primary">
                  <LogIn className="h-4 w-4" /> Student login
                </Link>
                <Link to="/login?tab=admin" className="btn-outline">
                  <ShieldCheck className="h-4 w-4" /> Admin
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
