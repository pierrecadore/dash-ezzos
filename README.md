# Dash Ezzos

Dashboard de tráfego para clientes e gestores acompanharem métricas de Meta Ads, Google Ads, Google Analytics (GA4) e Instagram, com dados reais sincronizados via n8n para o Supabase.

## Stack
- **Front:** React + TypeScript + Vite
- **Gráficos:** Recharts
- **Banco / Auth:** Supabase
- **Automação de coleta:** n8n
- **Deploy:** container Docker (Nginx) no Portainer

## Rodando localmente
```bash
npm install
cp .env.example .env   # preencha com as credenciais do seu projeto Supabase
npm run dev
```

## Build de produção
```bash
npm run build          # gera a pasta dist/
npm run preview        # serve o build localmente
```

## Variáveis de ambiente
| Variável | Descrição |
|---|---|
| VITE_SUPABASE_URL | URL do projeto Supabase |
| VITE_SUPABASE_ANON_KEY | Chave pública (anon) do Supabase |

> Nunca commite o arquivo `.env`. A chave `service_role` nao deve aparecer no front - ela e usada apenas pelo n8n.

## Design
Tema escuro (base zinco #09090b, acento azul #38bdf8, fonte Inter). Regra do produto: somente dados reais - quando nao ha dado/integracao, os campos exibem "-" e as paginas mostram estado vazio, nunca valores ficticios.
