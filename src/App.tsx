import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/Login'
import { ResetPasswordPage } from './pages/ResetPassword'
import { VisaoGeral } from './pages/VisaoGeral'
import { MetaAdsPage } from './pages/MetaAds'
import { GoogleAdsPage } from './pages/GoogleAds'
import { InstagramPage } from './pages/InstagramPage'
import { SitePage } from './pages/SitePage'
import { ClientesPage } from './pages/Clientes'
import { PerfilPage } from './pages/Perfil'

function Protected({ children }: { children: React.ReactElement }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="boot">Carregando…</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
          <Route element={<Protected><AppLayout /></Protected>}>
            <Route path="/" element={<VisaoGeral />} />
            <Route path="/meta-ads" element={<MetaAdsPage />} />
            <Route path="/google-ads" element={<GoogleAdsPage />} />
            <Route path="/instagram" element={<InstagramPage />} />
            <Route path="/site" element={<SitePage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
