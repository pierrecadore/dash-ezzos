import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Pencil } from 'lucide-react'

export function PerfilPage() {
  const { session, profile } = useAuth()
  const [client, setClient] = useState<Record<string, any> | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function load() {
    // cliente vinculado ao usuário logado (via client_users) ou primeiro cliente para admin
    const { data: link } = await supabase.from('client_users').select('client_id').eq('user_id', session?.user.id ?? '').maybeSingle()
    let clientId = link?.client_id
    if (!clientId) {
      const { data } = await supabase.from('clients').select('*').limit(1)
      setClient(data?.[0] ?? null)
      return
    }
    const { data } = await supabase.from('clients').select('*').eq('id', clientId).single()
    setClient(data ?? null)
  }
  useEffect(() => { if (session) load() }, [session?.user?.id])

  function abrirEdicao() { setForm(client ?? {}); setEditing(true); setErro(null) }

  async function salvar() {
    setBusy(true); setErro(null)
    const payload: Record<string, any> = {}
    for (const k of ['razao_social', 'nome_fantasia', 'contact_email', 'whatsapp', 'business_type']) {
      if (form[k] !== undefined) payload[k] = form[k]
    }
    const { error } = await supabase.from('clients').update(payload).eq('id', client!.id)
    setBusy(false)
    if (error) { setErro(error.message); return }
    setEditing(false); load()
  }

  const nome = profile?.full_name ?? 'Usuário'
  const iniciais = nome.split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      <div className="page-header"><h1>Perfil</h1></div>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2>Meu Perfil</h2>
          <button className="btn ghost" onClick={abrirEdicao}><Pencil size={13} /> Editar</button>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center', marginTop: 'var(--sp-4)' }}>
          <div className="avatar" style={{ width: 64, height: 64, fontSize: 20 }}>{iniciais}</div>
          <div>
            <strong style={{ fontSize: 20 }}>{nome}</strong>
            <div style={{ color: 'var(--text-3)', fontSize: 13 }}>{session?.user.email}</div>
            {client?.business_type && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>{client.business_type}</div>}
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Informação do Negócio</h2>
        <div className="info-grid" style={{ marginTop: 'var(--sp-4)' }}>
          <div><span className="lbl">Razão Social</span><strong>{client?.razao_social ?? '—'}</strong></div>
          <div><span className="lbl">Nome Fantasia</span><strong>{client?.nome_fantasia ?? '—'}</strong></div>
          <div><span className="lbl">E-mail</span><strong>{client?.contact_email ?? '—'}</strong></div>
          <div><span className="lbl">Whatsapp</span><strong className="wa">{client?.whatsapp ?? '—'}</strong></div>
          <div><span className="lbl">Tipo de negócio</span><strong>{client?.business_type ?? '—'}</strong></div>
        </div>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditing(false) }}>
          <div className="modal" role="dialog" aria-modal="true">
            <h2>Editar informações do negócio</h2>
            <div className="row">
              <label className="field">Razão Social<input className="input" value={form.razao_social ?? ''} onChange={e => setForm({ ...form, razao_social: e.target.value })} /></label>
              <label className="field">Nome Fantasia<input className="input" value={form.nome_fantasia ?? ''} onChange={e => setForm({ ...form, nome_fantasia: e.target.value })} /></label>
            </div>
            <div className="row">
              <label className="field">E-mail<input className="input" value={form.contact_email ?? ''} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></label>
              <label className="field">Whatsapp<input className="input" value={form.whatsapp ?? ''} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></label>
            </div>
            <label className="field">Tipo de negócio<input className="input" value={form.business_type ?? ''} onChange={e => setForm({ ...form, business_type: e.target.value })} /></label>
            {erro && <span className="form-error">{erro}</span>}
            <footer>
              <button className="btn ghost" onClick={() => setEditing(false)}>Cancelar</button>
              <button className="btn" onClick={salvar} disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
