import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, CartesianGrid,
} from 'recharts'
import { useMetaMetrics, aggregateMeta, fmtBRL, fmtNum } from '../lib/metrics'
import { KpiCard, ChartCard, NoteBar, EmptyState } from '../components/ui'
import { usePeriodSelector } from './VisaoGeral'

const CHART = { accent: '#38bdf8', grid: '#27272a', text: '#71717a', up: '#10b981' }
const fmtDay = (d: string) => d.slice(8, 10)

export function MetaAdsPage() {
  const [period, periodEl] = usePeriodSelector()
  const { rows, loading, error } = useMetaMetrics(period)

  if (loading) return <div className="boot">Carregando métricas…</div>
  if (error) return <EmptyState title="Não foi possível carregar as métricas" hint={error} />

  const m = aggregateMeta(rows ?? [])
  const temDados = (rows ?? []).length > 0

  return (
    <>
      <div className="page-header"><h1>Meta Ads</h1>{periodEl}</div>

      <div className="kpi-grid">
        <KpiCard label="Investimento" value={temDados ? fmtBRL(m.spend) : null} />
        <KpiCard label="Leads" value={null} />
        <KpiCard label="Custo por lead" value={null} />
        <KpiCard label="Cliques no link" value={temDados ? fmtNum(m.clicks) : null} />
      </div>
      <div className="kpi-grid">
        <KpiCard label="Impressões" value={temDados ? fmtNum(m.impressions) : null} />
        <KpiCard label="CTR" value={temDados ? `${m.ctr.toFixed(2)}%` : null} />
        <KpiCard label="CPC" value={temDados ? fmtBRL(m.cpc) : null} />
        <KpiCard label="CPM médio" value={temDados && m.impressions > 0 ? fmtBRL((m.spend / m.impressions) * 1000) : null} />
      </div>
      <NoteBar>Leads/CPL aparecerão assim que o campo de conversões for incluído na sincronização (ajuste no n8n já mapeado).</NoteBar>

      {!temDados ? (
        <EmptyState title="Sem dados no período selecionado" hint="A conta conectada não teve veiculação nesse intervalo. Ajuste o período acima." />
      ) : (
        <>
          <ChartCard title="Cliques por dia">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={m.byDay}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={fmtDay} stroke={CHART.text} fontSize={11} />
                <YAxis stroke={CHART.text} fontSize={11} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelFormatter={d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')}
                  formatter={(v: any) => [fmtNum(v), 'Cliques']} />
                <Bar dataKey="clicks" fill={CHART.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Investimento x CPC">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={m.byDay.map(d => ({ ...d, cpc: d.clicks > 0 ? d.spend / d.clicks : null }))}>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={fmtDay} stroke={CHART.text} fontSize={11} />
                <YAxis yAxisId="l" stroke={CHART.accent} fontSize={11} tickFormatter={v => `R$${v}`} />
                <YAxis yAxisId="r" orientation="right" stroke={CHART.up} fontSize={11} tickFormatter={v => `R$${v}`} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelFormatter={d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')}
                  formatter={(v: any, n: any) => [fmtBRL(v ?? 0), n]} />
                <Legend />
                <Line yAxisId="l" dataKey="spend" name="Investimento (R$)" stroke={CHART.accent} strokeWidth={2} dot={false} />
                <Line yAxisId="r" dataKey="cpc" name="CPC (R$)" stroke={CHART.up} strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Campanhas no período">
            <table className="data-table">
              <thead>
                <tr><th>Campanha</th><th className="num">Investimento</th><th className="num">Cliques</th><th className="num">Impressões</th><th className="num">CPC</th></tr>
              </thead>
              <tbody>
                {m.byCampaign.map(c => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td className="num">{fmtBRL(c.spend)}</td>
                    <td className="num">{fmtNum(c.clicks)}</td>
                    <td className="num">{fmtNum(c.impressions)}</td>
                    <td className="num">{c.clicks > 0 ? fmtBRL(c.spend / c.clicks) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ChartCard>
        </>
      )}
    </>
  )
}
