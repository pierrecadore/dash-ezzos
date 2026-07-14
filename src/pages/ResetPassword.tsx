import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Destino do link "Reset password" do e-mail.
 * O supabase-js detecta o token na URL (detectSessionInUrl) e cria uma
 * sessão temporária de recuperação; aqui o usuário define a nova senha.
 */
export function ResetPasswordPage() {
  const [pronto, setPronto] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setPronto(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setPronto(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 8) { setErro('A senha precisa ter pelo menos 8 caracteres.'); return }
    if (senha !== confirma) { setErro('As senhas não conferem.'); return }
    setBusy(true); setErro(null)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setBusy(false)
    if (error) { setErro(`Não foi possível salvar: ${error.message}`); return }
    nav('/')
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={salvar}>
        <div className="brand">Ezzos<sup>®</sup></div>
        <h1>Definir nova senha</h1>
        {!pronto ? (
          <span className="sub">
            Validando o link de recuperação… Se esta tela não avançar, o link pode ter expirado —
            volte ao login e clique em “Esqueci minha senha” para receber um novo.
          </span>
        ) : (
          <>
            <label className="field">Nova senha
              <input className="input" type="password" value={senha} onChange={e => setSenha(e.target.value)} autoComplete="new-password" required />
            </label>
            <label className="field">Confirmar nova senha
              <input className="input" type="password" value={confirma} onChange={e => setConfirma(e.target.value)} autoComplete="new-password" required />
            </label>
            {erro && <span className="form-error">{erro}</span>}
            <button className="btn" disabled={busy}>{busy ? 'Salvando…' : 'Salvar e entrar'}</button>
          </>
        )}
      </form>
      <div className="auth-art" aria-hidden />
    </div>
  )
}
