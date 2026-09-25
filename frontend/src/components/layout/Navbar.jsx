import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, Package, User, LogOut, Menu, X, Shield, Download } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getDashboard } from '../../services/admin.js'
import { Heart } from 'lucide-react'
import NotificationBell from './NotificationBell.jsx'
import Logo from '../common/Logo.jsx'
import usePWAInstall from '../../hooks/usePWAInstall.js'

export default function Navbar() {
  const { isAuthenticated, isAdmin, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const { canInstall, install } = usePWAInstall()

  // Charge le compteur d'éléments en attente pour l'admin
  useEffect(() => {
    if (!isAdmin) {
      setPendingCount(0)
      return
    }
    const fetchCount = () => {
      getDashboard()
        .then((r) => {
          const d = r.data || {}
          setPendingCount(
            (d.pending_documents || 0) +
            (d.pending_materials || 0) +
            (d.open_reports || 0)
          )
        })
        .catch(() => { })
    }
    fetchCount()
    const id = setInterval(fetchCount, 60_000)
    return () => clearInterval(id)
  }, [isAdmin])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1 ${isActive ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100'
    }`

  const Badge = () =>
    pendingCount > 0 ? (
      <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold">
        {pendingCount > 99 ? '99+' : pendingCount}
      </span>
    ) : null

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="DocuCamp — accueil">
          <Logo />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/documents" className={linkClass}>
            <BookOpen size={16} /> Documents
          </NavLink>
          <NavLink to="/materials" className={linkClass}>
            <Package size={16} /> Matériel
          </NavLink>

          {isAuthenticated ? (
            <>{isAuthenticated && (
              <>
                <NavLink to="/favorites" className={linkClass}>
                  <Heart size={16} /> Favoris
                </NavLink>
                <NotificationBell />
              </>
            )}
              {isAdmin && (
                <NavLink to="/admin" className={linkClass}>
                  <Shield size={16} /> Admin
                  <Badge />
                </NavLink>
              )}
              <NavLink to="/profile" className={linkClass}>
                <User size={16} />
                {profile?.full_name?.split(' ')[0] || 'Profil'}
              </NavLink>
              <button onClick={handleLogout} className="btn-secondary text-sm ml-2">
                <LogOut size={16} /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Connexion</NavLink>
              <NavLink to="/register" className="btn-primary text-sm ml-2">
                Inscription
              </NavLink>
            </>
          )}
          {canInstall && (
            <button
              type="button"
              onClick={install}
              className="btn-secondary text-sm ml-1"
              title="Installer l'application"
            >
              <Download size={16} /> Installer
            </button>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          <NavLink to="/documents" className={linkClass} onClick={() => setOpen(false)}>
            <BookOpen size={16} /> Documents
          </NavLink>
          <NavLink to="/materials" className={linkClass} onClick={() => setOpen(false)}>
            <Package size={16} /> Matériel
          </NavLink>
          {canInstall && (
            <button
              type="button"
              onClick={() => { setOpen(false); install() }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-brand-700 hover:bg-brand-50 inline-flex items-center gap-1"
            >
              <Download size={16} /> Installer l&apos;application
            </button>
          )}
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
                  <Shield size={16} /> Admin
                  <Badge />
                </NavLink>
              )}
              <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
                <User size={16} /> Profil
              </NavLink>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut size={16} className="inline mr-1" /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>Connexion</NavLink>
              <NavLink to="/register" className={linkClass} onClick={() => setOpen(false)}>Inscription</NavLink>
            </>
          )}
        </div>
      )}
    </header>
  )
}