import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErro(null); setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setBusy(false)
    if (error) {
      setErro(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : `Não foi possível entrar: ${error.message}`)
      return
    }
    nav('/')
  }

  async function esqueci() {
    if (!email) { setErro('Digite seu e-mail acima para receber o link de recuperação.'); return }
    setBusy(true); setErro(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setBusy(false)
    if (error) setErro(`Não foi possível enviar o e-mail: ${error.message}`)
    else setMsg('E-mail de recuperação enviado. Confira sua caixa de entrada.')
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={entrar}>
        <div className="brand">Ezzos<sup>®</sup></div>
        <h1>Bem vindo de volta!</h1>
        <label className="field">Usuário ou Email
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="digite seu usuário ou email…" autoComplete="username" required />
        </label>
        <label className="field">Senha
          <input className="input" type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
        </label>
        {erro && <span className="form-error">{erro}</span>}
        {msg && <span className="form-ok">{msg}</span>}
        <button className="btn" disabled={busy}>{busy ? 'Entrando…' : 'Acessar'}</button>
        <button type="button" className="btn ghost" onClick={esqueci} disabled={busy}>Esqueci minha senha</button>
        <span className="sub">Área exclusiva para clientes<br />Ezzos © {new Date().getFullYear()} | Todos os direitos reservados.</span>
      </form>
      <div className="auth-art" aria-hidden />
    </div>
  )
}
