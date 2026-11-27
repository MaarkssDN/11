# CHANGELOG.md — Histórico Auditável de Entregas (B360-AOC)

## [0.2.0] — 2026-11-26 — Reativação da Ponte Runner Local Devin & 10 Passos Lógicos de Engenharia

### Implementado
- **Ponte Runner Local Windows com Devin (`IA-10`) Ativada**: Endpoint `POST /api/governance/devin-bridge`, estado `CONECTADO_API_LOCAL` (`API_NATIVA_ATIVA`) com 10 capacidades habilitadas e desbloqueio automático de preflight da Missão `B360-MSN-002`.
- **Agente Outbound PowerShell (`scripts/devin-local-runner.ps1`) & Endpoint `POST /api/runner/heartbeat`**: Coleta real de espaço livre nas unidades `C:` e `D:`, auditoria anti-junctions/symlinks em `node_modules` e sincronização outbound mTLS/HMAC sem exposição de terminal.
- **Motor de Automação (`transitionAutomationJobState` & `POST /api/automation-jobs/:id/action`)**: Aquisição de leases, heartbeats, retries com backoff, pausa e conclusão diretamente na UI.
- **Validador de Plano de Pull Request Git (`evaluateGitIntegrationPlan` & `GET /api/git/integration-plan/:missionId`)**: Verifica vínculo de SHA aprovado e 100% dos testes executados mantendo o repositório principal em modo seguro somente leitura.
- **Detector de Conflitos de Memória (`detectMemoryConflicts`)**: Identifica automaticamente contradições com regras constitucionais e marca registros conflitantes como `CONFLITO_DETECTADO`.
- **Motor de Liberação Progressiva de Ondas (`evaluateWaveReleaseProgression` & `POST /api/waves/:id/release-next`)** e **Exportador Determinístico SQL Cloudflare D1 (`generateCloudflareD1SqlSnapshot` & `GET /api/admin/export-d1-sql`)**.

## [0.1.0] — 2026-11-25 — Primeira Entrega Obrigatória (Fundação B360-AOC)

### Implementado
- Arquitetura full-stack modular em React 19 + TypeScript (`strict: true`) + Express (`server.ts`) + Tailwind CSS v4 + Zod (`src/shared/contracts.ts`).
- Mapeamento navegável e funcional dos **40 módulos obrigatórios** organizados nos 4 pilares operacionais + Command Palette (`Ctrl+K`).
- Cadastro oficial das **10 Inteligências Artificiais (`IA-01` a `IA-10`)** com matriz de 10 capacidades por adaptador e das **6 assinaturas** sob política financeira de **R$ 0,00**.
- Catálogo oficial de Agentes (**Agente 00 — Astra** a **Agente 100 — Catarina**), **8 Squads Operacionais** e Organograma Constitucional.
- **Central de Missões** com máquina de estados de **23 etapas**, verificador técnico de **Preflight (18 requisitos)** e detector de colisão de worktree, branch, porta e módulos.
- **Central de Conversas entre IAs** com proteção contra falsa atribuição ao Orquestrador Humano, hash anti-duplicidade e **Importador Idempotente** de conversas do Google Drive (15 dimensões extraídas).
- **Catarina Command Center** com seleção cirúrgica de especialistas por domínio e bloqueio de conflito de interesse.
- **Central de Auditoria Independente** vinculada ao SHA auditado com proibição técnica de autoaprovação e de aprovação com testes não executados.
- **Devin Command Center** (em estado explícito desabilitado até verificação contratual) e **Git Integration Center** (em modo seguro somente leitura).
- Migration SQL completa com as **45 entidades relacionais** para Cloudflare D1 (`migrations/0001_initial_schema.sql`) e suíte de testes unitários (`src/domain/operationsEngine.test.ts`).
