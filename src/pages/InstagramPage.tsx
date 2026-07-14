import { EmptyState } from '../components/ui'

export function InstagramPage() {
  return (
    <>
      <div className="page-header"><h1>Instagram</h1></div>
      <EmptyState
        title="Instagram ainda não conectado"
        hint="Vincule a conta do Instagram ao usuário do sistema na Business Manager e ative a integração em Clientes. Seguidores, alcance e engajamento passam a ser sincronizados diariamente — sem números simulados."
      />
    </>
  )
}
