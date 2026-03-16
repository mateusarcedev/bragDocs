# Plano de Implementação - Brag Docs (Vite + React + Fastify)

Este plano descreve as etapas para implementar o sistema de gerenciamento de Brag Docs conforme especificado.

## Fase 1: Configuração do Monorepo e Estrutura Base

### 1.1. Inicialização do Projeto

* [ ] Inicializar o `package.json` na raiz.

* [ ] Configurar workspaces para `apps/web`, `apps/api` e `packages/shared`.

* [ ] Criar a estrutura de pastas:

  * `apps/web`

  * `apps/api`

  * `packages/shared`

* [ ] Instalar dependências raiz (`concurrently`, `typescript`, `eslint`, etc.).

* [ ] Criar `tsconfig.base.json` e estender nos pacotes.

### 1.2. Pacote Shared (`packages/shared`)

* [ ] Inicializar pacote TypeScript.

* [ ] Definir interfaces DTO para comunicação API-Frontend (ex: `Entry`, `Task`, `Settings`, `AnalysisType`).

* [ ] Exportar tipos para uso no backend e frontend.

## Fase 2: Backend (Fastify + SQLite) - `apps/api`

### 2.1. Configuração Básica

* [ ] Inicializar projeto Fastify com TypeScript.

* [ ] Instalar dependências: `fastify`, `@fastify/cors`, `zod`, `fastify-type-provider-zod`, `better-sqlite3`.

* [ ] Configurar servidor básico e CORS (apenas `localhost:5173`).

### 2.2. Camada de Dados (SQLite)

* [ ] Criar módulo de conexão com o banco (`src/db/index.ts`).

* [ ] Implementar script de migração/inicialização para criar as tabelas:

  * `entries`, `tasks`, `activities`, `settings`.

  * Índices necessários.

* [ ] Implementar repositórios ou funções de acesso a dados.

### 2.3. Lógica de Negócio e Parser

* [ ] Implementar `src/lib/parser.ts` para processar arquivos Markdown.

  * Extração de data, seções de projeto, tasks (ticket ID) e atividades.

  * Tratamento de erros por arquivo.

* [ ] Implementar `src/lib/sync.ts` para varrer diretórios e orquestrar o parser e upsert no banco.

### 2.4. Implementação das Rotas

* [ ] **Settings**: `GET /settings`, `PUT /settings` (validação com Zod).

* [ ] **Sync**: `POST /sync` (chama o serviço de sync).

* [ ] **Entries**: `GET /entries` (filtros: from, to, project, week).

* [ ] **Metrics**: `GET /metrics` (agregações para widgets).

* [ ] **AI**:

  * `GET /ai/models` (proxy para Open WebUI).

  * `POST /ai/analyze` (construção de contexto e chamada à Open WebUI).

### 2.5. Preparação para Integrações Futuras

* [ ] Criar estrutura de pastas `src/lib/integrations/` com arquivos placeholders (`gitlab.ts`, `bitbucket.ts`).

* [ ] Garantir que a tabela `settings` suporte tokens futuros.

## Fase 3: Frontend (React + Vite) - `apps/web`

### 3.1. Configuração Inicial

* [ ] Inicializar projeto Vite com React e TypeScript.

* [ ] Instalar e configurar Tailwind CSS.

* [ ] Instalar e configurar `shadcn/ui` (componentes base).

* [ ] Configurar `zustand` para gerenciamento de estado global.

* [ ] Configurar cliente HTTP (ex: `fetch` ou `axios`) tipado com DTOs do `shared`.

### 3.2. Implementação das Telas

* [ ] **Settings**: Formulário para configurar `vault_path`, `ai_host`, `ai_token`.

* [ ] **Dashboard**:

  * Widgets de métricas (Tasks/semana, Distribuição por projeto, Heatmap, Streaks).

* [ ] **Entries List**: Visualização das notas processadas com filtros.

* [ ] **AI Analysis**: Interface para solicitar análise (resumo semanal, review, etc.) e exibir resultado.

### 3.3. Integração com Backend

* [ ] Conectar formulário de settings com API.

* [ ] Implementar botão de "Sincronizar Agora" que chama `/sync`.

* [ ] Alimentar dashboard e listas com dados reais da API.

## Fase 4: Finalização e Testes

### 4.1. Scripts e Execução

* [ ] Configurar script `dev` no `package.json` raiz para rodar front e back via `concurrently`.

* [ ] Testar fluxo completo: Configurar Vault -> Sync -> Visualizar Dados -> Gerar Análise AI.

