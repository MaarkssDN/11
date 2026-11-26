# ARCHITECTURE.md — Arquitetura Híbrida e Decisões Técnicas (B360-AOC)

## 1. Topologia em Três Ambientes

1. **Ambiente 1 — Nuvem**: Planejamento, desenvolvimento, barramento de conversas entre IAs, Prompt Studio, motor de automação e memória em 10 níveis.
2. **Ambiente 2 — Máquina Local (Windows / Devin)**: Homologação no ambiente real nas unidades `C:` e `D:`, Squad de Auditoria Local e Catarina (Agente 100). Conexão exclusivamente de saída autenticada (desabilitada por padrão até verificação contratual do Devin).
3. **Ambiente 3 — GitHub**: Versionamento, branches exclusivas, Pull Requests e Quality Gates. O repositório principal `https://github.com/MaarkssDN/Birthub-360` permanece intocado e em modo somente leitura.

## 2. Adaptação para o Ambiente Google AI Studio e Preparação Cloudflare

- O container Google AI Studio executa Node.js + Express (`server.ts`) com Vite na porta `3000`.
- Toda a lógica de domínio (`src/domain/operationsEngine.ts`) e os contratos Zod (`src/shared/contracts.ts`) são agnósticos de runtime, permitindo portabilidade direta para **Cloudflare Pages + Workers**.
- A migration SQL (`migrations/0001_initial_schema.sql`) utiliza dialeto SQLite/D1 estrito com as **45 entidades relacionais** exigidas na Seção 25.
