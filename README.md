# Brag Docs

Monorepo com:
- **Web** (Vite + React) em `apps/web`
- **API** (Fastify + SQLite) em `apps/api`
- **Tipos compartilhados** em `packages/shared`

O objetivo é importar notas do Obsidian (Markdown), extrair tasks/atividades e gerar métricas + análises com IA.

## Requisitos

- Node.js 20+
- npm 9+

## Rodar localmente (sem Docker)

```bash
npm install
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:8089` (padrão local; pode mudar via env)

### Importar dados do Obsidian

Opção A (recomendado no browser): **Configurações → Importar via seletor de pasta**  
Isso lê os `.md` no navegador e envia para a API importar.

Opção B (caminho absoluto): **Configurações → Caminho do Vault (absoluto)** + **Sincronizar agora**  
Isso faz a API ler os arquivos direto do filesystem local.

## Docker (multi-stage) + Docker Compose

O compose sobe:
- Web em `http://localhost:8088`
- API em `http://localhost:8089`

Portas **não** usam `3000`, `3001` ou `3030`.

### Subir

```bash
docker compose up --build
```

Se sua instalação não tiver `docker compose`, use:

```bash
docker-compose up --build
```

### Persistência

O compose cria um diretório `./data` no host para:
- `./data/brag-docs.db` (SQLite)
- `./data/vault-imports` (cópia do vault importado via seletor)

## Variáveis de ambiente (API)

- `PORT`: porta do servidor (default: 8089)
- `HOST`: host do bind (default: 0.0.0.0)
- `WEB_ORIGIN`: origin permitido no CORS (default: http://localhost:5173)
- `DB_PATH`: caminho do SQLite (default: `./brag-docs.db` relativo ao cwd)

## Estrutura esperada do vault (sync via filesystem)

Por padrão, o sync via filesystem procura por:

```
<vault_path>/
  daily/
    Week 01/
      01-01-2026.md
```

Formato do filename: `DD-MM-YYYY.md`.
