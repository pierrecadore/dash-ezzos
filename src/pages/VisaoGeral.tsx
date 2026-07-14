import { useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, CartesianGrid,
} from 'recharts'
import { useMetaMetrics, aggregateMeta, lastNDays, fmtBRL, fmtNum, type Period } from '../lib/metrics'
import { KpiCard, ChartCard, NoteBar, EmptyState } from '../components/ui'

const CHART = { accent: '#38bdf8', grid: '#27272a', text: '#71717a', up: '#10b981' }

export function usePeriodSelector(): [Period, ReactElement] {
  const [days, setDays] = useState(30)
  const period = useMemo(() => lastNDays(days), [days])
  const el = (
    <span className="period-chip">
      Período:
      <select value={days} onChange={e => setDays(Number(e.target.value))}>
        <option value={7}>últimos 7 dias</option>
        <option value={30}>últimos 30 dias</option>
        <option value={90}>últimos 90 dias</option>
      </select>
    </span>
  )
  return [period, el]
}

const fmtDay = (d: string) => d.slice(8, 10)

export function VisaoGeral() {
  const [period, periodEl] = usePeriodSelector()
  const { rows, loading, error } = useMetaMetrics(period)

  if (loading) return <div className="boot">Carregando métricas…</div>
  if (error) return <EmptyState title="Não foi possível carregar as métricas" hint={error} />

  const meta = aggregateMeta(rows ?? [])
  const temDados = (rows ?? []).length > 0

  // Canais sem integração ativa ainda: valores reais = inexistentes → "—"
  const canais = [
    { canal: 'Meta Ads', investimento: temDados ? fmtBRL(meta.spend) : null, resultado: null, custo: null, cliques: temDados ? fmtNum(meta.clicks) : null, imp: temDados ? fmtNum(meta.impressions) : null },
    { canal: 'Google Ads', investimento: null, resultado: null, custo: null, cliques: null, imp: null },
    { canal: 'Instagram', investimento: null, resultado: null, custo: null, cliques: null, imp: null },
    { canal: 'Site', investimento: null, resultado: null, custo: null, cliques: null, imp: null },
  ]

  return (
    <>
      <div className="page-header"><h1>Visão geral</h1>{periodEl}</div>

      <div className="kpi-grid">
        <KpiCard label="Total investido" value={temDados ? fmtBRL(meta.spend) : null} />
        <KpiCard label="Leads/Conversões gerados" value={null} />
        <KpiCard label="Custo por lead (média)" value={null} />
        <KpiCard label="Cliques no anúncio" value={temDados ? fmtNum(meta.clicks) : null} />
      </div>
      <div className="kpi-grid">
        <KpiCard label="Impressões totais" value={temDados ? fmtNum(meta.impressions) : null} />
        <KpiCard label="CTR médio" value={temDados ? `${meta.ctr.toFixed(2)}%` : null} />
        <KpiCard label="CPC médio" value={temDados ? fmtBRL(meta.cpc) : null} />
        <KpiCard label="Conversões registradas no site" value={null} />
      </div>
      <NoteBar>Observação: quando a métrica for custo, como CPL, CPC ou CPA, uma variação negativa é positiva, pois significa redução de custo. Campos com “—” ainda não têm integração/dado no período.</NoteBar>

      {!temDados ? (
        <EmptyState
          title="Sem dados no período selecionado"
          hint="A conta conectada não teve veiculação nesse intervalo. Ajuste o período acima ou confira a integração em Clientes."
        />
      ) : (
        <>
          <ChartCard title="Evolução diária: investimento x cliques" period={`${period.from.split('-').reverse().join('/')} a ${period.to.split('-').reverse().join('/')}`}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={meta.byDay}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={fmtDay} stroke={CHART.text} fontSize={11} />
                <YAxis yAxisId="l" stroke={CHART.accent} fontSize={11} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="r" orientation="right" stroke={CHART.up} fontSize={11} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelFormatter={d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')}
                  formatter={(v: any, n: any) => n.includes('Investimento') ? [fmtBRL(v), n] : [fmtNum(v), n]} />
                <Legend />
                <Line yAxisId="l" dataKey="spend" name="Investimento (R$)" stroke={CHART.accent} strokeWidth={2} dot={false} />
                <Line yAxisId="r" dataKey="clicks" name="Cliques" stroke={CHART.up} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Investimento por dia (Meta Ads)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={meta.byDay}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={fmtDay} stroke={CHART.text} fontSize={11} />
                <YAxis stroke={CHART.text} fontSize={11} tickFormatter={v => `R$${v}`} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelFormatter={d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')}
                  formatter={(v: any) => [fmtBRL(v), 'Investimento']} />
                <Bar dataKey="spend" fill={CHART.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}

      <ChartCard title="Resultado por canal">
        <table className="data-table">
          <thead>
            <tr><th>Canal</th><th className="num">Investimento</th><th className="num">Resultado principal</th><th className="num">Custo médio</th><th className="num">Cliques</th><th className="num">Impressões/visualizações</th></tr>
          </thead>
          <tbody>
            {canais.map(c => (
              <tr key={c.canal}>
                <td>{c.canal}</td>
                <td className="num">{c.investimento ?? '—'}</td>
                <td className="num">{c.resultado ?? '—'}</td>
                <td className="num">{c.custo ?? '—'}</td>
                <td className="num">{c.cliques ?? '—'}</td>
                <td className="num">{c.imp ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ChartCard>
    </>
  )
}
