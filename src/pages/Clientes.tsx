import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { EmptyState } from '../components/ui'
import { Pencil, Plus } from 'lucide-react'

type Client = Record<string, any>
type Integration = Record<string, any>

const PROVIDERS = [
  { key: 'meta_ads', label: 'Meta Ads', idLabel: 'ID da conta de anúncios (sem act_)' },
  { key: 'google_ads', label: 'Google Ads', idLabel: 'ID da conta Google Ads' },
  { key: 'ga4', label: 'Google Analytics (GA4)', idLabel: 'ID da propriedade GA4' },
  { key: 'instagram', label: 'Instagram', idLabel: 'ID da conta IG Business' },
]

export function ClientesPage() {
  const [clients, setClients] = useState<Client[] | null>(null)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [editing, setEditing] = useState<Client | 'new' | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function load() {
    const [{ data: cs, error: e1 }, { data: is }] = await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('integrations').select('*'),
    ])
    if (e1) setErro(e1.message)
    setClients(cs ?? [])
    setIntegrations(is ?? [])
  }
  useEffect(() => { load() }, [])

  if (erro) return <EmptyState title="Sem acesso à lista de clientes" hint={erro} />
  if (clients === null) return <div className="boot">Carregando clientes…</div>

  return (
    <>
      <div className="page-header">
        <h1>Clientes</h1>
        <button className="btn" onClick={() => setEditing('new')}><Plus size={14} /> Novo cliente</button>
      </div>

      {clients.length === 0 ? (
        <EmptyState title="Nenhum cliente cadastrado" hint="Crie o primeiro cliente para começar a conectar integrações." action={<button className="btn" onClick={() => setEditing('new')}>Criar cliente</button>} />
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Cliente</th><th>Slug</th><th>Integrações ativas</th><th /></tr></thead>
            <tbody>
              {clients.map(c => {
                const ativas = integrations.filter(i => i.client_id === c.id && i.status === 'connected')
                return (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td style={{ color: 'var(--text-3)' }}>{c.slug}</td>
                    <td>{ativas.length > 0 ? ativas.map(i => PROVIDERS.find(p => p.key === i.provider)?.label ?? i.provider).join(', ') : '—'}</td>
                    <td className="num"><button className="btn ghost" onClick={() => setEditing(c)}><Pencil size={13} /> Editar</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ClientModal
          client={editing === 'new' ? null : editing}
          integrations={editing === 'new' ? [] : integrations.filter(i => i.client_id === (editing as Client).id)}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </>
  )
}

function ClientModal({ client, integrations, onClose, onSaved }: {
  client: Client | null
  integrations: Integration[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<Client>(client ?? { name: '', slug: '' })
  const [ints, setInts] = useState<Record<string, { external_account_id: string; status: string }>>(
    Object.fromEntries(PROVIDERS.map(p => {
      const found = integrations.find(i => i.provider === p.key)
      return [p.key, { external_account_id: found?.external_account_id ?? '', status: found?.status ?? 'disconnected' }]
    }))
  )
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const set = (k: string, v: any) => setForm((f: Client) => ({ ...f, [k]: v }))
  const setInt = (p: string, k: string, v: any) => setInts(s => ({ ...s, [p]: { ...s[p], [k]: v } }))

  async function salvar() {
    if (!form.name?.trim()) { setErro('Nome é obrigatório.'); return }
    setBusy(true); setErro(null)
    const slug = (form.slug?.trim() || form.name).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const payload: Client = { name: form.name.trim(), slug }
    for (const k of ['razao_social', 'nome_fantasia', 'contact_email', 'whatsapp', 'business_type', 'pixel_id']) {
      if (form[k] !== undefined) payload[k] = form[k]
    }
    let clientId = client?.id
    if (clientId) {
      const { error } = await supabase.from('clients').update(payload).eq('id', clientId)
      if (error) { setErro(campoInexistente(error.message)); setBusy(false); return }
    } else {
      const { data, error } = await supabase.from('clients').insert(payload).select('id').single()
      if (error) { setErro(campoInexistente(error.message)); setBusy(false); return }
      clientId = data!.id
    }
    // upsert das integrações informadas
    for (const p of PROVIDERS) {
      const v = ints[p.key]
      if (!v.external_account_id && v.status !== 'connected') continue
      const existing = integrations.find(i => i.provider === p.key)
      const row = { client_id: clientId, provider: p.key, external_account_id: v.external_account_id || null, status: v.status }
      const { error } = existing
        ? await supabase.from('integrations').update(row).eq('id', existing.id)
        : await supabase.from('integrations').insert(row)
      if (error) { setErro(`Integração ${p.label}: ${error.message}`); setBusy(false); return }
    }
    setBusy(false)
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true">
        <h2>{client ? `Editar cliente — ${client.name}` : 'Novo cliente'}</h2>

        <div className="row">
          <label className="field">Nome*<input className="input" value={form.name ?? ''} onChange={e => set('name', e.target.value)} /></label>
          <label className="field">Slug<input className="input" value={form.slug ?? ''} onChange={e => set('slug', e.target.value)} placeholder="gerado do nome se vazio" /></label>
        </div>
        <div className="row">
          <label className="field">Razão social<input className="input" value={form.razao_social ?? ''} onChange={e => set('razao_social', e.target.value)} /></label>
          <label className="field">Nome fantasia<input className="input" value={form.nome_fantasia ?? ''} onChange={e => set('nome_fantasia', e.target.value)} /></label>
        </div>
        <div className="row">
          <label className="field">E-mail de contato<input className="input" value={form.contact_email ?? ''} onChange={e => set('contact_email', e.target.value)} /></label>
          <label className="field">WhatsApp<input className="input" value={form.whatsapp ?? ''} onChange={e => set('whatsapp', e.target.value)} placeholder="(11) 91234-5678" /></label>
        </div>
        <div className="row">
          <label className="field">Tipo de negócio<input className="input" value={form.business_type ?? ''} onChange={e => set('business_type', e.target.value)} placeholder="Serviços locais" /></label>
          <label className="field">Pixel (Meta)<input className="input" value={form.pixel_id ?? ''} onChange={e => set('pixel_id', e.target.value)} /></label>
        </div>

        <h2 style={{ fontSize: 14, marginTop: 8 }}>Integrações</h2>
        {PROVIDERS.map(p => (
          <div className="row" key={p.key}>
            <label className="field">{p.label} — {p.idLabel}
              <input className="input" value={ints[p.key].external_account_id} onChange={e => setInt(p.key, 'external_account_id', e.target.value)} />
            </label>
            <label className="field">Status
              <select className="input" value={ints[p.key].status} onChange={e => setInt(p.key, 'status', e.target.value)}>
                <option value="disconnected">desconectada</option>
                <option value="connected">conectada</option>
              </select>
            </label>
          </div>
        ))}

        <span className="sub" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
          O e-mail de <em>login</em> do cliente é gerenciado no Supabase (Authentication → Users).
        </span>
        {erro && <span className="form-error">{erro}</span>}
        <footer>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={salvar} disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
        </footer>
      </div>
    </div>
  )
}

function campoInexistente(msg: string) {
  if (msg.includes('column') && msg.includes('does not exist')) {
    return `${msg} — esse campo ainda não existe na tabela; me avise que eu aplico a migração.`
  }
  return msg
}
