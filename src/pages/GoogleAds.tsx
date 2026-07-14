import { EmptyState } from '../components/ui'

export function GoogleAdsPage() {
  return (
    <>
      <div className="page-header"><h1>Google Ads</h1></div>
      <EmptyState
        title="Google Ads ainda não conectado"
        hint="A integração com o Google Ads está na fila de ativação (aguarda o developer token da Google). Assim que conectada, investimento, conversões, CPC e os gráficos por tipo de campanha aparecem aqui automaticamente — com dados reais."
      />
    </>
  )
}
