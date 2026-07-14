import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Megaphone, LineChart, Camera, Globe, User, LogOut, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useLastSync } from '../lib/metrics'

export function AppLayout() {
  const { profile } = useAuth()
  const nav = useNavigate()
  const lastSync = useLastSync()

  async function sair() {
    await supabase.auth.signOut()
    nav('/login')
  }

  const links = [
    { to: '/', label: 'Visão Geral', icon: LayoutDashboard, end: true },
    { to: '/meta-ads', label: 'Meta Ads', icon: Megaphone },
    { to: '/google-ads', label: 'Google Ads', icon: LineChart },
    { to: '/instagram', label: 'Instagram', icon: Camera },
    { to: '/site', label: 'Site', icon: Globe },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Ezzos<sup>®</sup></div>
        <nav>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
          {profile?.role === 'admin' && (
            <NavLink to="/clientes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={16} /> Clientes
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/perfil" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <User size={16} /> Perfil
          </NavLink>
          <button className="nav-item" onClick={sair}><LogOut size={16} /> Sair</button>
          <div className="user-card">
            <div className="avatar">{(profile?.full_name ?? 'U').slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{profile?.full_name ?? '—'}</strong>
              {lastSync && (
                <span className="last-sync">
                  Sync: {new Date(lastSync.finished_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {lastSync.status !== 'success' ? ' ⚠️' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
