# AuditorIA

**AuditorIA** é uma plataforma de análise automatizada de repositórios de código utilizando agentes de IA. O sistema orquestra múltiplos agentes especializados para avaliar segurança, arquitetura, qualidade do código, desempenho e dependências de um projeto.

## Repositório da API dependida

Todas as abas consomem dados de uma API REST (skills, workflow, histórico, integrações,
configurações e formatos de saída). O repositório dela:

```
git@github.com:kellermanm0ta/auditor-ia-backend.git
```

Em desenvolvimento, o Next.js faz proxy de `/api/*` → `http://localhost:8000/api/*` (ver
`next.config.ts`). Certifique-se de que o backend, o banco e o Keycloak (via `../infra`)
estejam rodando.

> **IDs:** todos os identificadores (e chaves estrangeiras como `dependeDe` e `outputFormatId`)
> são `string` geradas pelo backend. Ao criar registros, **omita o `id`** do corpo da requisição —
> o backend gera e devolve o id no response.

### Autenticação (Keycloak)

O dashboard exige login OIDC antes de renderizar qualquer aba (`components/AuthGate.tsx`).
Fluxo **Authorization Code + PKCE (S256)** via `oidc-client-ts` + `react-oidc-context`; o
`UserManager` é criado no cliente (`lib/auth.ts`) a partir das variáveis `NEXT_PUBLIC_KEYCLOAK_*`
(inlined no build). O access token é anexado como `Authorization: Bearer` em todas as chamadas de
`lib/api.ts`.

### Funcionalidades

- **Autenticação OIDC** — login via Keycloak (Authorization Code + PKCE); o access token é enviado em todas as chamadas à API
- **Tela de análise** — informe um repositório e visualize um relatório de exemplo renderizado em Markdown (a execução real dos agentes ainda não está ligada ao backend)
- **Skills customizáveis** — crie, edite e exclua skills, ative/desative cada uma e escreva prompts em Markdown com visualização renderizada
- **Pipeline visual** — grafo interativo de agentes (React Flow) com arrasto, edição e exclusão de nós
- **Histórico de análises** — consulte resultados anteriores com busca
- **Integrações CI/CD** — catálogo (GitHub Actions, GitLab CI, Jenkins, webhook, CLI, Slack) com passos e snippets copiáveis
- **Tema claro/escuro** — interface Bootstrap 5 com alternância de tema

### Skills disponíveis

| Skill | Descrição |
|---|---|
| Análise de Segurança | Identifica SQL injection, XSS, secrets expostos e OWASP Top 10 |
| Análise de Arquitetura | Avalia acoplamento, coesão e padrões de projeto |
| Code Smell | Detecta duplicação, métodos longos e complexidade alta |
| Análise de Desempenho | Aponta queries N+1, falta de cache e gargalos |
| Dependências | Verifica versões, vulnerabilidades e licenças |

---

## Pré-requisitos

- **Node.js** versão 18 ou superior
- **npm** (acompanha o Node.js) ou **yarn** / **pnpm**
- **Keycloak + PostgreSQL** — orquestrados por `../infra` (`docker compose up -d postgres keycloak`).
  O app exige login OIDC e a API responde `401` sem token.

## Como executar

> **Nota:** Todas as abas consomem dados de uma API REST. Em desenvolvimento, o Next.js faz proxy de `/api/*` para `http://localhost:8000/api/*` (configurado em `next.config.ts`). Certifique-se de que o backend esteja rodando na porta 8000.

### Linux / macOS / Windows (comando único)

```bash
# 1. Instalar as dependências
npm install

# 2. Configurar o ambiente (modelo com as variáveis do Keycloak)
cp .env.example .env.local

# 3. Subir Keycloak + PostgreSQL (a partir de ../infra)
cd ../infra && docker compose up -d postgres keycloak && cd ../frontend

# 4. Iniciar o servidor de desenvolvimento
npm run dev
```

5. Abra [http://localhost:3000](http://localhost:3000) no navegador. O app redireciona para o
   Keycloak (`http://localhost:8080`): faça login com um usuário do realm `auditoria`.

### Passo a passo (Linux)

```bash
# Atualizar pacotes (Debian/Ubuntu)
sudo apt update && sudo apt install nodejs npm -y

# Verificar versão
node --version   # deve ser >= 18

# Clonar o projeto e entrar no diretório
cd auditor-ia

# Configurar o ambiente (Keycloak)
cp .env.example .env.local

# Subir Keycloak + PostgreSQL (repositório infra/)
cd ../infra && docker compose up -d postgres keycloak && cd ../frontend

# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev
```

### Passo a passo (Windows)

1. Instale o Node.js em [nodejs.org](https://nodejs.org/)
2. Abra o **PowerShell** ou **Command Prompt**
3. Navegue até a pasta do projeto:

```powershell
cd C:\caminho\para\auditor-ia
```

4. Configure o ambiente (`Copy-Item .env.example .env.local`) e garanta Keycloak + PostgreSQL no ar
   (`cd ..\infra; docker compose up -d postgres keycloak`).

5. Instale as dependências e inicie:

```powershell
npm install
npm run dev
```

6. Acesse `http://localhost:3000` e faça login pelo Keycloak.

### Comandos úteis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera a build de produção |
| `npm run start` | Inicia o servidor com a build de produção |
| `npm run lint` | Verifica problemas no código |

## Tecnologias

- **Next.js 16** — framework React com App Router
- **React 19** — biblioteca de UI
- **react-router-dom** — roteamento SPA (client-side)
- **Bootstrap 5.3** — framework CSS (tema claro/escuro)
- **Bootstrap Icons** — ícones
- **react-markdown** + **remark-gfm** — renderização de markdown (com tabelas)
- **SWR** — data fetching e cache (stale-while-revalidate)
- **@xyflow/react** — grafo de workflow interativo (drag, zoom, nós customizados)
- **oidc-client-ts** + **react-oidc-context** — autenticação OIDC/Keycloak
- **TypeScript** — tipagem estática

## Estrutura do projeto

```
auditor-ia/
├── app/
│   ├── [[...slug]]/
│   │   └── page.tsx       # Entrada que monta o react-router
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout raiz com Bootstrap
│   └── providers.tsx      # Providers client-side (OIDC/Keycloak)
├── components/
│   ├── AuthGate.tsx           # Gate de autenticação OIDC
│   ├── config/
│   │   ├── ConfigFormatoSaida.tsx   # Card formato de saída
│   │   ├── ConfigModoExecucao.tsx   # Card modo de execução
│   │   └── ConfigSkillsPadrao.tsx   # Card skills padrão
│   ├── shared/
│   │   ├── AppTemplate.tsx    # Template de layout
│   │   ├── AsyncWrapper.tsx   # Loading/error states reutilizável
│   │   ├── ConfirmModal.tsx   # Modal de confirmação genérico
│   │   ├── Sidebar.tsx        # Navegação lateral
│   │   ├── Toast.tsx          # Notificações toast
│   │   └── TopNavbar.tsx      # Barra superior (mobile)
│   ├── workflow/
│   │   ├── AgentModal.tsx         # Modal de criação/edição de agente
│   │   ├── WorkflowAgentNode.tsx  # Nó customizado do ReactFlow
│   │   ├── WorkflowFlow.tsx       # Grafo ReactFlow com layout
│   │   ├── WorkflowFlowContext.tsx # Contexto para ações do nó
│   │   └── WorkflowTab.tsx        # Aba de orquestração (ponto de entrada)
│   ├── HomeTab.tsx            # Tela de análise
│   ├── SkillsTab.tsx          # Gerenciamento de skills (CRUD)
│   ├── SkillModal.tsx         # Modal de criação/edição de skill (abas Principal/Prompt)
│   ├── HistoryTab.tsx         # Histórico de análises
│   ├── IntegrationsTab.tsx    # Integrações CI/CD
│   └── ConfigTab.tsx          # Configurações
├── hooks/
│   ├── useConfig.ts           # Fetch + update das configurações (/api/config)
│   ├── useSkills.ts           # Fetch + CRUD das skills (/api/skills)
│   ├── useHistory.ts          # Fetch do histórico (/api/history)
│   ├── useIntegrations.ts     # Fetch das integrações (/api/integrations)
│   ├── useLocalStorage.ts     # Estado persistido em localStorage
│   ├── useOutputFormats.ts    # Fetch dos formatos de saída (/api/output-formats)
│   └── useWorkflowAgents.ts   # Fetch + CRUD de agentes (/api/workflow-agents)
├── lib/
│   ├── api.ts                 # Fetcher/Putter/Poster/Deleter genéricos + authHeaders
│   ├── auth.ts                # UserManager OIDC (Keycloak)
│   ├── routes.tsx             # Rotas do app (react-router)
│   ├── types.ts               # Tipos TypeScript compartilhados
│   └── workflowLayout.ts      # Conversão de agentes → nós/arestas ReactFlow
├── public/
│   └── analysis.md            # Relatório de exemplo (markdown)
├── next.config.ts         # Rewrites de API (proxy em dev)
└── package.json
```