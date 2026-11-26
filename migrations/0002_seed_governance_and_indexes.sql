-- ============================================================================
-- BIRTHUB 360 — AI OPERATIONS CENTER (B360-AOC)
-- MIGRATION 0002: POLÍTICAS CONSTITUCIONAIS INICIAIS, RBAC E PROJETOS
-- Compatível com Cloudflare D1 (SQLite)
-- ============================================================================

INSERT OR IGNORE INTO Roles (id, code, name, description) VALUES
  ('ROLE-01', 'ORQUESTRADOR_HUMANO', 'Orquestrador Humano', 'Autoridade máxima constitucional sobre aprovações, merges, deploys e suspensão emergencial.'),
  ('ROLE-02', 'COMANDO_GLOBAL_ASTRA', 'Comando Global (Agente 00 Astra)', 'Planejamento estratégico, divisão em ondas, prompts e despacho multi-IA.'),
  ('ROLE-03', 'COORDENADOR_LOCAL_DEVIN', 'Coordenador Local Windows (Devin IA-10)', 'Coordenação de worktrees locais nas unidades C: e D:, testes reais e Squad de Auditoria Local.'),
  ('ROLE-04', 'LIDER_ESPECIALISTAS_CATARINA', 'Líder de Especialistas (Agente 100 Catarina)', 'Mobilização seletiva de especialistas por domínio e correções autorizadas sem conflito de interesse.'),
  ('ROLE-05', 'AUDITOR_INDEPENDENTE', 'Auditor Independente', 'Auditoria vinculada ao SHA com proibição estrita de autoaprovação.'),
  ('ROLE-06', 'AGENTE_EXECUTOR_NUVEM', 'Agente Executor na Nuvem', 'Desenvolvimento isolado por branch e worktree após aprovação de preflight.'),
  ('ROLE-07', 'INTEGRADOR_GIT', 'Squad de Integração Git', 'Operação em modo seguro somente leitura e preparação de PRs vinculados ao SHA auditado.');

INSERT OR IGNORE INTO Users (id, email, display_name, is_human_orchestrator, created_at) VALUES
  ('USR-MARCELO-001', 'marcelinmark@gmail.com', 'Marcelo (Orquestrador Humano)', 1, '2026-11-25T12:00:00.000Z');

INSERT OR IGNORE INTO Projects (id, code, name, repo_url, is_read_only_protected, created_at) VALUES
  ('PRJ-BIRTHUB-MAIN', 'B360-PROD', 'Birthub 360 (Produto Principal Protegido)', 'https://github.com/MaarkssDN/Birthub-360', 1, '2026-11-25T12:00:00.000Z'),
  ('PRJ-BIRTHUB-AOC', 'B360-AOC', 'Birthub 360 — AI Operations Center', 'Birthub-360-Operations', 0, '2026-11-25T12:00:00.000Z');

INSERT OR IGNORE INTO CostPolicies (id, max_additional_spend_brl, block_auto_paid_api, block_account_rotation_abuse, updated_at) VALUES
  ('COST-POLICY-001', 0.0, 1, 1, '2026-11-25T12:00:00.000Z');

INSERT OR IGNORE INTO GovernancePolicies (id, code, title, rule_body, enforced_technically) VALUES
  ('GOV-001', 'NO_SELF_APPROVAL', 'Proibição de Autoaprovação', 'Nenhum agente ou IA pode aprovar o próprio trabalho. Executor deve ser diferente do Auditor.', 1),
  ('GOV-002', 'SHA_BOUND_APPROVAL', 'Aprovação Vinculada ao SHA', 'Toda aprovação está vinculada ao SHA efetivamente auditado; novos commits invalidam a aprovação.', 1),
  ('GOV-003', 'ZERO_ADDITIONAL_SPEND', 'Limite Financeiro R$ 0,00', 'Gasto adicional bloqueado em R$ 0,00; proibido contratar APIs pagas automaticamente.', 1),
  ('GOV-004', 'MANDATORY_ISOLATION', 'Isolamento Obrigatório por Missão', 'Cada missão exige worktree exclusiva, branch exclusiva, porta reservada e node_modules isolado sem junctions.', 1),
  ('GOV-005', 'DEVIN_SAFE_DEFAULT', 'Ponte Local Devin Desabilitada por Padrão', 'A integração local Windows do Devin permanece desabilitada até verificação contratual e protocolo outbound.', 1);
