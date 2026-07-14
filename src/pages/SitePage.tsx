import { EmptyState } from '../components/ui'

export function SitePage() {
  return (
    <>
      <div className="page-header"><h1>Site</h1></div>
      <EmptyState
        title="Google Analytics ainda não conectado"
        hint="Conecte a propriedade GA4 do cliente (service account como leitora) e ative a integração em Clientes. Sessões, usuários, origem do tráfego e conversões do site aparecem aqui com dados reais."
      />
    </>
  )
}
