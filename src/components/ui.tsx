import type { ReactNode } from 'react'

/** Card de KPI. `value` só recebe dado real; sem dado, mostra "—". */
export function KpiCard({ label, value, delta }: { label: string; value: string | null; delta?: number | null }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value tnum">{value ?? '—'}</strong>
      {typeof delta === 'number' && isFinite(delta) ? (
        <span className={`kpi-delta ${delta >= 0 ? 'up' : 'down'}`}>
          {delta >= 0 ? '+' : ''}{delta.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
        </span>
      ) : (
        <span className="kpi-delta neutral">sem comparativo</span>
      )}
    </div>
  )
}

export function ChartCard({ title, period, children }: { title: string; period?: string; children: ReactNode }) {
  return (
    <section className="chart-card">
      <header>
        <h2>{title}</h2>
        {period && <span className="chart-period">Período: {period}</span>}
      </header>
      <div className="chart-body">{children}</div>
    </section>
  )
}

/** Estado vazio padrão — nunca inventamos número. */
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-dot" />
      <h2>{title}</h2>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  )
}

export function NoteBar({ children }: { children: ReactNode }) {
  return <div className="note-bar">{children}</div>
}
