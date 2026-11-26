# Birthub 360 — AI Operations Center (B360-AOC)

Plataforma empresarial de comando, comunicação, coordenação, automação, auditoria, homologação e integração multiagentes do ecossistema **Birthub 360**.

> **Independência Estrutural**: Este projeto (`Birthub-360-Operations`) é independente do produto principal `https://github.com/MaarkssDN/Birthub-360`, que permanece em modo seguro somente leitura.

## 1. Visão Geral e Arquitetura

- **Frontend**: React 19 + TypeScript (`strict: true`) + Vite + Tailwind CSS v4 + Lucide Icons + Design Tokens centralizados preparados para o brandbook oficial do Birthub 360.
- **Backend & Contratos**: Express (`server.ts`) com contratos compartilhados e validação Zod (`src/shared/contracts.ts`).
- **Motor de Domínio Desacoplado**: Regras puras em `src/domain/operationsEngine.ts` cobertas por testes unitários reais (`node:test`).
- **Persistência**: Armazenamento persistente local (`data/b360-aoc-db.json`) e schema relacional completo com **45 tabelas** compatível com **Cloudflare D1** em `migrations/0001_initial_schema.sql`.

## 2. Instruções de Execução

```bash
# Instalar dependências
npm install

# Executar verificação de tipos TypeScript em modo strict
npm run lint

# Executar suíte de testes unitários reais do motor de operações
npx --yes tsx --test src/domain/operationsEngine.test.ts

# Executar build de produção
npm run build

# Iniciar servidor full-stack na porta 3000
npm run dev
```

## 3. Instruções de Implantação Futura (Cloudflare Pages, Workers e D1)

1. Criar banco D1: `wrangler d1 create b360-aoc-db`
2. Aplicar a migration das 45 entidades: `wrangler d1 execute b360-aoc-db --file=./migrations/0001_initial_schema.sql`
3. Configurar variáveis sem segredos no Git conforme `.env.example`.
