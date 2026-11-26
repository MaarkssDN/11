import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import { z } from 'zod';
import {
  AIProvider,
  B360DatabaseState,
  CreateMissionInputSchema,
  MISSION_LIFECYCLE_STEPS,
  Mission,
  OFFICIAL_40_MODULES,
  SendMessageInputSchema,
} from '../shared/contracts';
import {
  computeContentFingerprint,
  computeNextMissionStep,
  evaluateMissionPreflight,
  parseHistoricalConversationDocument,
  selectCatarinaSpecialistsForModules,
  validateAuditApproval,
} from '../domain/operationsEngine';

const STORAGE_KEY = 'b360_aoc_msw_db_v1';

const INITIAL_SAMPLE_DRIVE_CONVERSATION = `2026-11-20 [09:15] CONVERSA IMPORTADA (PASTA GOOGLE DRIVE: CONVERSAS ENTRE MARCELO E IAS)
Participantes: Marcelo (Orquestrador Humano), Gemini, Claude, ChatGPT, Google AI Studio, Devin, Astra e Catarina.
Onda 00 — Auditoria da Central existente e descoberta
Decisão: A plataforma Birthub 360 — AI Operations Center (B360-AOC) será construída em repositório próprio (Birthub-360-Operations), independente do produto principal https://github.com/MaarkssDN/Birthub-360.
Decisão: Política financeira estrita de R$ 0,00 em gastos adicionais. Utilizar as 4 contas Google AI Pro, 1 ChatGPT Plus, 1 Claude Pro, 1 GitHub Copilot Pro e 1 SuperGrok.
Concluído: [x] Mapeamento dos 40 módulos obrigatórios e das 10 Inteligências Artificiais oficiais (IA-01 a IA-10).
Pendente: [ ] Verificar situação contratual e capacidades reais de integração local do Devin (IA-10) na máquina Windows.
Bloqueador: Ponte de execução local do Devin mantida desabilitada por segurança até homologação pela Catarina e autorização do Orquestrador Humano.
Branch: feat/b360-aoc-foundation commit 7f8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f
Evidência: Critérios constitucionais consolidados e verificados no manifesto inicial.`;

export function createBrowserMockSeedState(): B360DatabaseState {
  const initialImport = parseHistoricalConversationDocument(
    '00-CONSOLIDADO-MARCELO-E-IAS-DRIVE.md',
    INITIAL_SAMPLE_DRIVE_CONVERSATION,
    'https://drive.google.com/drive/folders/1GQNRJFUxO3WNgct8SChRRJkwnA_vsMAW'
  );

  return {
    providers: [
      {
        id: 'IA-01',
        name: 'Gemini',
        environment: 'Nuvem',
        connectionStatus: 'MODO_ASSISTIDO_HUMANO',
        roleDescription: 'Planejamento estratégico, arquitetura multimodal e geração de ondas.',
        subscriptionSummary: '4 contas Google AI Pro ativas',
        consumptionLimitNote: 'Cota incluída nas 4 assinaturas Google AI Pro (R$ 0,00 adicional).',
        inboxCount: 3,
        outboxCount: 5,
        capabilities: {
          sendMission: 'MODO_ASSISTIDO',
          receiveResponse: 'MODO_ASSISTIDO',
          checkAvailability: 'SUPORTADO',
          checkConsumption: 'MODO_ASSISTIDO',
          cancelExecution: 'NAO_SUPORTADO',
          receiveEvents: 'NAO_CONFIGURADO',
          attachFiles: 'MODO_ASSISTIDO',
          queryResults: 'MODO_ASSISTIDO',
          supportAuth: 'MODO_ASSISTIDO',
          supportAutomation: 'MODO_ASSISTIDO',
        },
        integrationNotes: 'Integrado via despacho assistido e sincronizado com Google AI Studio.',
      },
      {
        id: 'IA-02',
        name: 'Gemini Spark',
        environment: 'Nuvem',
        connectionStatus: 'MODO_ASSISTIDO_HUMANO',
        roleDescription: 'Prototipação rápida e validação de fluxos na nuvem.',
        subscriptionSummary: 'Vinculado ao Google AI Pro (R$ 0,00)',
        consumptionLimitNote: 'Sujeito aos limites padrão da assinatura Google AI Pro.',
        inboxCount: 1,
        outboxCount: 2,
        capabilities: {
          sendMission: 'MODO_ASSISTIDO',
          receiveResponse: 'MODO_ASSISTIDO',
          checkAvailability: 'MODO_ASSISTIDO',
          checkConsumption: 'NAO_SUPORTADO',
          cancelExecution: 'NAO_SUPORTADO',
          receiveEvents: 'NAO_SUPORTADO',
          attachFiles: 'MODO_ASSISTIDO',
          queryResults: 'MODO_ASSISTIDO',
          supportAuth: 'MODO_ASSISTIDO',
          supportAutomation: 'NAO_CONFIGURADO',
        },
        integrationNotes: 'Modo Assistido ativo com pacotes de prompt padronizados.',
      },
      {
        id: 'IA-03',
        name: 'Grok',
        environment: 'Nuvem',
        connectionStatus: 'MODO_ASSISTIDO_HUMANO',
        roleDescription: 'Análise crítica adversarial e revisão de premissas arquiteturais.',
        subscriptionSummary: '1 assinatura SuperGrok ativa',
        consumptionLimitNote: 'Utilização restrita à assinatura SuperGrok existente (R$ 0,00).',
        inboxCount: 1,
        outboxCount: 1,
        capabilities: {
          sendMission: 'MODO_ASSISTIDO',
          receiveResponse: 'MODO_ASSISTIDO',
          checkAvailability: 'MODO_ASSISTIDO',
          checkConsumption: 'MODO_ASSISTIDO',
          cancelExecution: 'NAO_SUPORTADO',
          receiveEvents: 'NAO_SUPORTADO',
          attachFiles: 'MODO_ASSISTIDO',
          queryResults: 'MODO_ASSISTIDO',
          supportAuth: 'NAO_CONFIGURADO',
          supportAutomation: 'NAO_CONFIGURADO',
        },
        integrationNotes: 'Operação via Modo Assistido SuperGrok.',
      },
      {
        id: 'IA-04',
        name: 'Antigravity',
        environment: 'Nuvem, conforme disponibilidade',
        connectionStatus: 'DESCONECTADO_NAO_CONFIGURADO',
        roleDescription: 'Ambiente experimental de agentes na nuvem conforme disponibilidade.',
        subscriptionSummary: 'Camada experimental conforme disponibilidade (R$ 0,00)',
        consumptionLimitNote: 'Disponibilidade variável conforme janela operacional.',
        inboxCount: 0,
        outboxCount: 0,
        capabilities: {
          sendMission: 'NAO_CONFIGURADO',
          receiveResponse: 'NAO_CONFIGURADO',
          checkAvailability: 'MODO_ASSISTIDO',
          checkConsumption: 'NAO_SUPORTADO',
          cancelExecution: 'NAO_SUPORTADO',
          receiveEvents: 'NAO_SUPORTADO',
          attachFiles: 'NAO_CONFIGURADO',
          queryResults: 'NAO_CONFIGURADO',
          supportAuth: 'NAO_CONFIGURADO',
          supportAutomation: 'NAO_CONFIGURADO',
        },
        integrationNotes: 'Estado explícito: Desconectado / Aguardando disponibilidade.',
      },
      {
        id: 'IA-05',
        name: 'ChatGPT',
        environment: 'Nuvem e coordenação de automações locais',
        connectionStatus: 'MODO_ASSISTIDO_HUMANO',
        roleDescription: 'Coordenação de automações locais/remotas, prompts e checklists.',
        subscriptionSummary: '1 assinatura ChatGPT Plus ativa',
        consumptionLimitNote: 'Assinatura ChatGPT Plus sem contratação de API paga (R$ 0,00).',
        inboxCount: 4,
        outboxCount: 6,
        capabilities: {
          sendMission: 'MODO_ASSISTIDO',
          receiveResponse: 'MODO_ASSISTIDO',
          checkAvailability: 'SUPORTADO',
          checkConsumption: 'MODO_ASSISTIDO',
          cancelExecution: 'MODO_ASSISTIDO',
          receiveEvents: 'NAO_CONFIGURADO',
          attachFiles: 'MODO_ASSISTIDO',
          queryResults: 'MODO_ASSISTIDO',
          supportAuth: 'MODO_ASSISTIDO',
          supportAutomation: 'MODO_ASSISTIDO',
        },
        integrationNotes: 'Coordenador de Automação via pacotes estruturados.',
      },
      {
        id: 'IA-06',
        name: 'Claude',
        environment: 'Nuvem e coordenação de automações locais',
        connectionStatus: 'MODO_ASSISTIDO_HUMANO',
        roleDescription: 'Coordenação de automações locais/remotas e auditoria de código.',
        subscriptionSummary: '1 assinatura Claude Pro ativa',
        consumptionLimitNote: 'Assinatura Claude Pro sujeita a janelas de cota; sem API paga.',
        inboxCount: 5,
        outboxCount: 7,
        capabilities: {
          sendMission: 'MODO_ASSISTIDO',
          receiveResponse: 'MODO_ASSISTIDO',
          checkAvailability: 'SUPORTADO',
          checkConsumption: 'MODO_ASSISTIDO',
          cancelExecution: 'MODO_ASSISTIDO',
          receiveEvents: 'NAO_CONFIGURADO',
          attachFiles: 'MODO_ASSISTIDO',
          queryResults: 'MODO_ASSISTIDO',
          supportAuth: 'MODO_ASSISTIDO',
          supportAutomation: 'MODO_ASSISTIDO',
        },
        integrationNotes: 'Coordenador oficial de automações e revisões especializadas.',
      },
      {
        id: 'IA-07',
        name: 'Google AI Studio',
        environment: 'Nuvem',
        connectionStatus: 'CONECTADO_API_LOCAL',
        roleDescription: 'Ambiente principal de construção full-stack na nuvem.',
        subscriptionSummary: 'Camada gratuita / 4 contas Google AI Pro',
        consumptionLimitNote: 'Execução ativa no container de desenvolvimento (R$ 0,00).',
        inboxCount: 6,
        outboxCount: 8,
        capabilities: {
          sendMission: 'SUPORTADO',
          receiveResponse: 'SUPORTADO',
          checkAvailability: 'SUPORTADO',
          checkConsumption: 'MODO_ASSISTIDO',
          cancelExecution: 'SUPORTADO',
          receiveEvents: 'SUPORTADO',
          attachFiles: 'SUPORTADO',
          queryResults: 'SUPORTADO',
          supportAuth: 'SUPORTADO',
          supportAutomation: 'SUPORTADO',
        },
        integrationNotes: 'Ambiente hospedeiro ativo desta Central B360-AOC.',
      },
      {
        id: 'IA-08',
        name: 'Codex',
        environment: 'Nuvem',
        connectionStatus: 'DESCONECTADO_NAO_CONFIGURADO',
        roleDescription: 'Execução de tarefas de geração e refatoração isolada na nuvem.',
        subscriptionSummary: 'Vinculado ao ChatGPT Plus',
        consumptionLimitNote: 'Sujeito às cotas incluídas na assinatura ChatGPT Plus.',
        inboxCount: 0,
        outboxCount: 0,
        capabilities: {
          sendMission: 'MODO_ASSISTIDO',
          receiveResponse: 'MODO_ASSISTIDO',
          checkAvailability: 'NAO_CONFIGURADO',
          checkConsumption: 'NAO_SUPORTADO',
          cancelExecution: 'NAO_CONFIGURADO',
          receiveEvents: 'NAO_CONFIGURADO',
          attachFiles: 'MODO_ASSISTIDO',
          queryResults: 'MODO_ASSISTIDO',
          supportAuth: 'NAO_CONFIGURADO',
          supportAutomation: 'NAO_CONFIGURADO',
        },
        integrationNotes: 'Disponível via despacho assistido.',
      },
      {
        id: 'IA-09',
        name: 'GitHub Copilot',
        environment: 'Nuvem',
        connectionStatus: 'MODO_ASSISTIDO_HUMANO',
        roleDescription: 'Assistência em Pull Requests e suporte ao Squad de Integração.',
        subscriptionSummary: '1 assinatura GitHub Copilot Pro ativa',
        consumptionLimitNote: 'Incluído na assinatura GitHub Copilot Pro existente (R$ 0,00).',
        inboxCount: 2,
        outboxCount: 2,
        capabilities: {
          sendMission: 'MODO_ASSISTIDO',
          receiveResponse: 'MODO_ASSISTIDO',
          checkAvailability: 'MODO_ASSISTIDO',
          checkConsumption: 'MODO_ASSISTIDO',
          cancelExecution: 'NAO_SUPORTADO',
          receiveEvents: 'NAO_CONFIGURADO',
          attachFiles: 'MODO_ASSISTIDO',
          queryResults: 'MODO_ASSISTIDO',
          supportAuth: 'NAO_CONFIGURADO',
          supportAutomation: 'MODO_ASSISTIDO',
        },
        integrationNotes: 'Atua nos repositórios GitHub sob supervisão do Squad de Integração.',
      },
      {
        id: 'IA-10',
        name: 'Devin',
        environment: 'Operação local (Windows)',
        connectionStatus: 'BLOQUEADO_VERIFICACAO_PENDENTE',
        roleDescription: 'Coordenador principal da operação local no computador Windows.',
        subscriptionSummary: 'VERIFICAÇÃO CONTRATUAL PENDENTE',
        consumptionLimitNote: 'Integração desabilitada até verificação contratual.',
        inboxCount: 2,
        outboxCount: 0,
        capabilities: {
          sendMission: 'NAO_CONFIGURADO',
          receiveResponse: 'NAO_CONFIGURADO',
          checkAvailability: 'NAO_CONFIGURADO',
          checkConsumption: 'NAO_CONFIGURADO',
          cancelExecution: 'NAO_CONFIGURADO',
          receiveEvents: 'NAO_CONFIGURADO',
          attachFiles: 'NAO_CONFIGURADO',
          queryResults: 'NAO_CONFIGURADO',
          supportAuth: 'NAO_CONFIGURADO',
          supportAutomation: 'NAO_CONFIGURADO',
        },
        integrationNotes: 'Bloqueio constitucional preventivo até confirmação do Orquestrador Humano.',
      },
    ],
    subscriptions: [
      {
        id: 'SUB-01',
        providerId: 'IA-01',
        title: 'Google AI Pro (Pool de 4 Contas)',
        quantity: 4,
        tier: 'Google AI Pro',
        additionalCostLimitBrl: 0,
        currentAdditionalSpendBrl: 0,
        quotaStatus: 'DISPONIVEL',
        renewalPolicy: 'Assinaturas pré-existentes do proprietário. Custo adicional R$ 0,00.',
        antiAbuseRule: 'Proibido rotacionar contas para contornar limites de API.',
      },
      {
        id: 'SUB-02',
        providerId: 'IA-05',
        title: 'ChatGPT Plus',
        quantity: 1,
        tier: 'Plus',
        additionalCostLimitBrl: 0,
        currentAdditionalSpendBrl: 0,
        quotaStatus: 'DISPONIVEL',
        renewalPolicy: 'Assinatura mensal existente sem cobrança extra.',
        antiAbuseRule: 'Não presumir acesso ilimitado à API paga.',
      },
      {
        id: 'SUB-03',
        providerId: 'IA-06',
        title: 'Claude Pro',
        quantity: 1,
        tier: 'Pro',
        additionalCostLimitBrl: 0,
        currentAdditionalSpendBrl: 0,
        quotaStatus: 'DISPONIVEL',
        renewalPolicy: 'Assinatura existente com renovação de janela a cada 5h.',
        antiAbuseRule: 'Preservar progresso na fila persistente quando atingir limite.',
      },
      {
        id: 'SUB-04',
        providerId: 'IA-09',
        title: 'GitHub Copilot Pro',
        quantity: 1,
        tier: 'Pro',
        additionalCostLimitBrl: 0,
        currentAdditionalSpendBrl: 0,
        quotaStatus: 'DISPONIVEL',
        renewalPolicy: 'Assinatura existente vinculada ao GitHub.',
        antiAbuseRule: 'Uso restrito às operações autorizadas pelo Squad de Integração.',
      },
      {
        id: 'SUB-05',
        providerId: 'IA-03',
        title: 'SuperGrok',
        quantity: 1,
        tier: 'SuperGrok',
        additionalCostLimitBrl: 0,
        currentAdditionalSpendBrl: 0,
        quotaStatus: 'DISPONIVEL',
        renewalPolicy: 'Assinatura existente.',
        antiAbuseRule: 'Sem contratação de API paga adicional.',
      },
      {
        id: 'SUB-06',
        providerId: 'IA-10',
        title: 'Devin (Operação Local Windows)',
        quantity: 1,
        tier: 'Situação Contratual em Verificação',
        additionalCostLimitBrl: 0,
        currentAdditionalSpendBrl: 0,
        quotaStatus: 'VERIFICACAO_CONTRATUAL_PENDENTE',
        renewalPolicy: 'Verificar situação contratual antes de habilitar ponte local.',
        antiAbuseRule: 'Integração mantida desabilitada até confirmação formal.',
      },
    ],
    squads: [
      {
        id: 'SQ-COMANDO',
        name: 'Squad de Comando Global',
        environment: 'NUVEM',
        coordinatorAgentId: 'AG-000',
        coordinatorProviderId: 'IA-01',
        missionScope: 'Planejamento, governança, priorização e despacho.',
        memberAgentIds: ['AG-000', 'AG-001'],
        guardrails: ['Subordinação ao Orquestrador Humano', 'Limite financeiro R$ 0,00'],
      },
      {
        id: 'SQ-DEV-NUVEM',
        name: 'Squad de Desenvolvimento na Nuvem',
        environment: 'NUVEM',
        coordinatorAgentId: 'AG-010',
        coordinatorProviderId: 'IA-07',
        missionScope: 'Implementar funcionalidades e produzir entregas estruturadas.',
        memberAgentIds: ['AG-010', 'AG-012', 'AG-045'],
        guardrails: ['Preflight obrigatório', 'Proibido autoaprovar entregas'],
      },
      {
        id: 'SQ-AUDITORIA-LOCAL',
        name: 'Squad de Auditoria Local',
        environment: 'LOCAL_WINDOWS',
        coordinatorAgentId: 'AG-088',
        coordinatorProviderId: 'IA-10',
        missionScope: 'Auditar e testar entregas da nuvem no ambiente local Windows.',
        memberAgentIds: ['AG-088'],
        guardrails: ['Nunca aprovar teste não executado', 'Vincular parecer ao SHA'],
      },
      {
        id: 'SQ-CATARINA-100',
        name: 'Squad Catarina — Agente 100',
        environment: 'LOCAL_WINDOWS',
        coordinatorAgentId: 'AG-100',
        coordinatorProviderId: 'IA-06',
        missionScope: 'Mobilizar especialistas seletivamente por domínio.',
        memberAgentIds: ['AG-100', 'AG-045', 'AG-077'],
        guardrails: ['Não mobilizar indiscriminadamente', 'Bloquear conflitos de interesse'],
      },
      {
        id: 'SQ-AUDITORIA-EXTERNA',
        name: 'Squad de Auditoria Externa',
        environment: 'HIBRIDO',
        coordinatorAgentId: 'AG-095',
        coordinatorProviderId: 'IA-03',
        missionScope: 'Revisão independente de alterações críticas.',
        memberAgentIds: ['AG-095'],
        guardrails: ['Independência total dos executores'],
      },
      {
        id: 'SQ-INTEGRACAO',
        name: 'Squad de Integração',
        environment: 'GITHUB',
        coordinatorAgentId: 'AG-060',
        coordinatorProviderId: 'IA-09',
        missionScope: 'Branches, commits, pull requests e integração autorizada.',
        memberAgentIds: ['AG-060'],
        guardrails: ['Modo seguro somente leitura por padrão'],
      },
      {
        id: 'SQ-INFRA',
        name: 'Squad de Infraestrutura',
        environment: 'HIBRIDO',
        coordinatorAgentId: 'AG-070',
        coordinatorProviderId: 'IA-05',
        missionScope: 'Isolamento de worktrees, dependências e portas reservadas.',
        memberAgentIds: ['AG-070'],
        guardrails: ['Proibir junctions ou symlinks inseguros'],
      },
      {
        id: 'SQ-SEGURANCA',
        name: 'Squad de Segurança e Preservação',
        environment: 'HIBRIDO',
        coordinatorAgentId: 'AG-077',
        coordinatorProviderId: 'IA-06',
        missionScope: 'RBAC, proteção de segredos e botão de suspensão emergencial.',
        memberAgentIds: ['AG-077'],
        guardrails: ['Zero segredos no frontend ou Git'],
      },
    ],
    agents: [
      {
        id: 'AG-000',
        number: 0,
        name: 'Agente 00 — Astra',
        operationalPersona: 'Arquiteta-Chefe de Coordenação Global',
        specialty: 'Orquestração Estratégica e Planejamento de Ondas',
        responsibilities: ['Coordenar o Squad de Comando Global'],
        squadId: 'SQ-COMANDO',
        coordinatorId: 'ORQUESTRADOR_HUMANO',
        associatedProviderId: 'IA-01',
        ownedModules: ['mod-01', 'mod-02', 'mod-09', 'mod-10'],
        permanentInstructions: 'Preservar identidade oficial dos 100 agentes.',
        operationalState: 'ALOCADO_MISSAO',
        activeMissionIds: ['MSN-001'],
        completedMissionsCount: 14,
      },
      {
        id: 'AG-010',
        number: 10,
        name: 'Agente 10 — Líder Full-Stack Nuvem',
        operationalPersona: 'Engenheiro React, TypeScript Strict e Cloudflare D1',
        specialty: 'Desenvolvimento Modular Full-Stack e Contratos Zod',
        responsibilities: ['Liderar o Squad de Desenvolvimento na Nuvem'],
        squadId: 'SQ-DEV-NUVEM',
        coordinatorId: 'AG-000',
        associatedProviderId: 'IA-07',
        ownedModules: ['src/App.tsx', 'server.ts', 'src/shared/contracts.ts'],
        permanentInstructions: 'Executar typecheck, lint e testes antes do handoff.',
        operationalState: 'ALOCADO_MISSAO',
        activeMissionIds: ['MSN-001'],
        completedMissionsCount: 11,
      },
      {
        id: 'AG-012',
        number: 12,
        name: 'Agente 12 — Especialista Máquina de Estados',
        operationalPersona: 'Arquiteto de Motores de Estado e Preflight',
        specialty: 'Máquina de Estados de 23 Etapas e Motor de Automação',
        responsibilities: ['Implementar preflight técnico e verificação de isolamento'],
        squadId: 'SQ-DEV-NUVEM',
        coordinatorId: 'AG-010',
        associatedProviderId: 'IA-07',
        ownedModules: ['src/domain/operationsEngine.ts', 'mod-18'],
        permanentInstructions: 'Bloquear execução se preflight falhar.',
        operationalState: 'ALOCADO_MISSAO',
        activeMissionIds: ['MSN-002'],
        completedMissionsCount: 7,
      },
      {
        id: 'AG-045',
        number: 45,
        name: 'Agente 45 — Especialista Persistência & D1',
        operationalPersona: 'Arquiteto de Dados Relacionais e Migrations SQL',
        specialty: 'Modelagem Relacional (45 Entidades) e Migrations D1',
        responsibilities: ['Manter migrations SQL compatíveis com Cloudflare D1'],
        squadId: 'SQ-CATARINA-100',
        coordinatorId: 'AG-100',
        associatedProviderId: 'IA-05',
        ownedModules: ['migrations/0001_initial_schema.sql', 'src/db/schema.ts'],
        permanentInstructions: 'Garantir integridade referencial.',
        operationalState: 'PRONTO_CATALOGO',
        activeMissionIds: [],
        completedMissionsCount: 6,
      },
      {
        id: 'AG-060',
        number: 60,
        name: 'Agente 60 — Coordenador Integração Git',
        operationalPersona: 'Guardião de Versionamento e Quality Gates',
        specialty: 'Governança Git e Integração Controlada',
        responsibilities: ['Operar Git Integration Center em modo seguro'],
        squadId: 'SQ-INTEGRACAO',
        coordinatorId: 'AG-000',
        associatedProviderId: 'IA-09',
        ownedModules: ['mod-26', 'mod-31', 'mod-32'],
        permanentInstructions: 'Jamais executar push/merge sem autorização.',
        operationalState: 'PRONTO_CATALOGO',
        activeMissionIds: [],
        completedMissionsCount: 8,
      },
      {
        id: 'AG-070',
        number: 70,
        name: 'Agente 70 — Guardião de Isolamento e Worktrees',
        operationalPersona: 'Engenheiro de Ambientes Windows C:/D:',
        specialty: 'Isolamento de Worktrees e Portas Reservadas',
        responsibilities: ['Fiscalizar diretórios node_modules independentes'],
        squadId: 'SQ-INFRA',
        coordinatorId: 'AG-000',
        associatedProviderId: 'IA-05',
        ownedModules: ['mod-21', 'mod-25', 'mod-27'],
        permanentInstructions: 'Proibir junctions mutáveis compartilhadas.',
        operationalState: 'PRONTO_CATALOGO',
        activeMissionIds: [],
        completedMissionsCount: 5,
      },
      {
        id: 'AG-077',
        number: 77,
        name: 'Agente 77 — Auditor de Segurança e RBAC',
        operationalPersona: 'Especialista em Segurança Defensiva e Kill Switch',
        specialty: 'RBAC, Privilégio Mínimo e Anti-Prompt Injection',
        responsibilities: ['Operar Central de Segurança e Governança'],
        squadId: 'SQ-SEGURANCA',
        coordinatorId: 'AG-100',
        associatedProviderId: 'IA-06',
        ownedModules: ['mod-37', 'mod-38', 'mod-39'],
        permanentInstructions: 'Nunca expor chaves no frontend.',
        operationalState: 'PRONTO_CATALOGO',
        activeMissionIds: [],
        completedMissionsCount: 10,
      },
      {
        id: 'AG-088',
        number: 88,
        name: 'Agente 88 — Auditor Líder Independente',
        operationalPersona: 'Inspetor de Evidências e Conformidade SHA',
        specialty: 'Auditoria Técnica Independente',
        responsibilities: ['Executar auditorias vinculadas ao SHA'],
        squadId: 'SQ-AUDITORIA-LOCAL',
        coordinatorId: 'AG-000',
        associatedProviderId: 'IA-06',
        ownedModules: ['mod-23', 'mod-24', 'mod-30'],
        permanentInstructions: 'Proibido auditar missão em que atuou como executor.',
        operationalState: 'EM_AUDITORIA',
        activeMissionIds: ['MSN-001'],
        completedMissionsCount: 15,
      },
      {
        id: 'AG-100',
        number: 100,
        name: 'Agente 100 — Catarina (Líder Especialistas)',
        operationalPersona: 'Coordenadora de Validação Especializada',
        specialty: 'Mobilização Seletiva por Domínio e Homologação',
        responsibilities: ['Selecionar especialistas necessários por domínio'],
        squadId: 'SQ-CATARINA-100',
        coordinatorId: 'ORQUESTRADOR_HUMANO',
        associatedProviderId: 'IA-06',
        ownedModules: ['mod-22', 'mod-24'],
        permanentInstructions: 'Não mobilizar especialistas indiscriminadamente.',
        operationalState: 'ALOCADO_MISSAO',
        activeMissionIds: ['MSN-001'],
        completedMissionsCount: 19,
      },
    ],
    waves: [
      { id: 'ONDA-00', number: 0, title: 'Onda 00 — Auditoria da Central existente e descoberta', scope: 'Inventário das 10 IAs, assinaturas e regras constitucionais.', status: 'CONCLUIDA_FUNDACAO', dependencies: [], acceptanceCriteria: ['Capacidades do ambiente registradas'], promptId: 'PRM-00', checklistId: 'CHK-00', risks: ['Presunção de APIs pagas'], evidenceSummary: 'Diagnóstico registrado em ARCHITECTURE.md.' },
      { id: 'ONDA-01', number: 1, title: 'Onda 01 — Arquitetura e contratos', scope: 'Contratos tipados Zod, 40 módulos e 23 estados.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-00'], acceptanceCriteria: ['TypeScript strict ativo'], promptId: 'PRM-01', checklistId: 'CHK-01', risks: ['Acoplamento UI/domínio'], evidenceSummary: 'src/shared/contracts.ts validado.' },
      { id: 'ONDA-04', number: 4, title: 'Onda 04 — Banco de dados e Schema 45 Entidades', scope: 'Modelos Zod em src/db/schema.ts e migrations SQL D1.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-01'], acceptanceCriteria: ['45 tabelas em migrations/0001_initial_schema.sql'], promptId: 'PRM-04', checklistId: 'CHK-04', risks: ['Perda de estado'], evidenceSummary: 'Migrations 0001 e 0002 prontas.' },
      { id: 'ONDA-12', number: 12, title: 'Onda 12 — Motor de automação', scope: 'Filas persistentes, leases e heartbeats.', status: 'EM_ANDAMENTO', dependencies: ['ONDA-04'], acceptanceCriteria: ['Independência de sessão de chat'], promptId: 'PRM-12', checklistId: 'CHK-12', risks: ['Execução duplicada'], evidenceSummary: 'Fila persistente ativa.' },
      { id: 'ONDA-13', number: 13, title: 'Onda 13 — Devin Command Center', scope: 'Operação local Windows (C:/D:) e protocolo outbound.', status: 'BLOQUEADA_DEPENDENCIA', dependencies: ['ONDA-12'], acceptanceCriteria: ['Ponte local desabilitada até verificação do Devin'], promptId: 'PRM-13', checklistId: 'CHK-13', risks: ['Exposição local'], evidenceSummary: 'Aguardando verificação contratual Devin.' },
      { id: 'ONDA-19', number: 19, title: 'Onda 19 — Homologação e ativação progressiva', scope: 'Implantação Cloudflare Pages/Workers/D1.', status: 'PLANEJADA', dependencies: ['ONDA-13'], acceptanceCriteria: ['Aprovação final do Orquestrador Humano'], promptId: 'PRM-19', checklistId: 'CHK-19', risks: ['Ativação precoce'], evidenceSummary: 'Plano documentado em ROADMAP.md.' },
    ],
    missions: [
      {
        id: 'MSN-001',
        code: 'B360-MSN-001',
        title: 'Fundação Arquitetural B360-AOC, Contratos Zod e 40 Módulos Integrados',
        waveId: 'ONDA-01',
        squadId: 'SQ-DEV-NUVEM',
        stepNumber: 13,
        stepCode: '13_VALIDACAO_CATARINA',
        status: 'EM_AUDITORIA',
        executorProviderId: 'IA-07',
        executorAgentId: 'AG-010',
        auditorAgentId: 'AG-088',
        catarinaSpecialistIds: ['AG-100', 'AG-045', 'AG-077'],
        priority: 'CRITICA',
        acceptanceCriteria: ['TypeScript strict sem erros', '40 módulos integrados'],
        dependencies: [],
        isolation: {
          worktreePath: 'D:/Birthub360-Operations/worktrees/msn-001-foundation',
          branchName: 'wave/01-b360-aoc-foundation',
          baseSha: '7f8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
          currentHeadSha: '4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
          ownedModules: ['src/shared/contracts.ts', 'src/domain/operationsEngine.ts'],
          isolatedNodeModulesPath: 'D:/Birthub360-Operations/worktrees/msn-001-foundation/node_modules',
          reservedPort: 3101,
          testDbSchema: 'd1_test_msn_001',
          leaseId: 'LEASE-B360-001',
          leaseExpiresAt: '2026-11-26T18:00:00.000Z',
          cpuLimitPercent: 60,
          memoryLimitMb: 2048,
        },
        preflight: {
          executorIdentityVerified: true,
          permissionsVerified: true,
          governanceInstructionsLoaded: true,
          resourceAvailabilityConfirmed: true,
          repoStateClean: true,
          exclusiveBranchAssigned: true,
          exclusiveWorktreeAssigned: true,
          baseShaRecorded: true,
          noUncommittedChanges: true,
          moduleOwnershipVerified: true,
          isolatedMutableDependencies: true,
          noUnsafeSymlinksOrJunctions: true,
          reservedPortAssigned: true,
          isolatedTestDbSchemaAssigned: true,
          executionLeaseAcquired: true,
          acceptanceCriteriaDefined: true,
          checklistAttached: true,
          independentAuditorAssigned: true,
        },
        approvedSha: null,
        rejectionReason: null,
        createdAt: '2026-11-25T12:00:00.000Z',
        updatedAt: '2026-11-25T15:30:00.000Z',
      },
    ],
    messages: [],
    importedConversations: [initialImport],
    audits: [],
    prompts: [],
    checklists: [],
    memories: [],
    automationJobs: [],
    governance: {
      humanOrchestratorAuthority: 'Marcelo — Orquestrador Humano (Autoridade Constitucional Máxima)',
      globalAutomationSuspended: false,
      emergencyKillSwitchReason: null,
      additionalSpendLimitBrl: 0.0,
      currentAdditionalSpendBrl: 0.0,
      autoPaidApiBlocked: true,
      gitSafeReadOnlyMode: true,
      devinBridgeEnabled: false,
      devinContractVerified: false,
      primaryProductRepo: 'https://github.com/MaarkssDN/Birthub-360',
      operationsRepo: 'Birthub-360-Operations',
      googleDriveConversationsUrl: 'https://drive.google.com/drive/folders/1GQNRJFUxO3WNgct8SChRRJkwnA_vsMAW',
      auditLogs: [],
    },
  };
}

export function getBrowserMockDb(): B360DatabaseState {
  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as B360DatabaseState;
      } catch {
        // Fallback to seed
      }
    }
  }
  const seed = createBrowserMockSeedState();
  saveBrowserMockDb(seed);
  return seed;
}

export function saveBrowserMockDb(db: B360DatabaseState): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
}

function buildAdapterDiagnostics(providers: AIProvider[]) {
  const now = new Date().toISOString();
  return providers.map((provider) => ({
    providerId: provider.id,
    providerName: provider.name,
    checkedAt: now,
    reachable: provider.connectionStatus === 'CONECTADO_API_LOCAL' || provider.connectionStatus === 'MODO_ASSISTIDO_HUMANO',
    mode:
      provider.id === 'IA-10'
        ? 'BLOQUEADO_GOVERNANCA'
        : provider.connectionStatus === 'CONECTADO_API_LOCAL'
        ? 'API_NATIVA_ATIVA'
        : provider.connectionStatus === 'MODO_ASSISTIDO_HUMANO'
        ? 'MODO_ASSISTIDO_HUMANO'
        : 'DESCONECTADO_NAO_CONFIGURADO',
    diagnosticMessage: provider.integrationNotes,
  }));
}

// ============================================================================
// MSW HANDLERS OFICIAIS (Compatíveis com src/shared/contracts.ts)
// ============================================================================

export const handlers = [
  http.get('/api/state', () => {
    const db = getBrowserMockDb();
    return HttpResponse.json({
      modules: OFFICIAL_40_MODULES,
      lifecycleSteps: MISSION_LIFECYCLE_STEPS,
      adapterDiagnostics: buildAdapterDiagnostics(db.providers),
      db,
    });
  }),

  http.post('/api/missions', async ({ request }) => {
    const body = await request.json();
    const parsed = CreateMissionInputSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json(
        {
          error: 'Falha de validação Zod nos dados da missão.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const db = getBrowserMockDb();
    if (db.governance.globalAutomationSuspended) {
      return HttpResponse.json(
        { error: 'Operação bloqueada: Suspensão Global de Automações (Kill Switch) ativa.' },
        { status: 403 }
      );
    }

    const input = parsed.data;
    const nextNum = db.missions.length + 1;
    const code = input.code || `B360-MSN-${String(nextNum).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const specialists = selectCatarinaSpecialistsForModules(
      input.ownedModules,
      input.executorAgentId,
      db.agents
    );

    const pf = input.preflightConfig;
    const newMission: Mission = {
      id: `MSN-${String(nextNum).padStart(3, '0')}`,
      code,
      title: input.title,
      waveId: input.waveId,
      squadId: input.squadId || 'SQ-DEV-NUVEM',
      stepNumber: 8,
      stepCode: '08_PREFLIGHT_OBRIGATORIO',
      status: 'PREFLIGHT_PENDENTE',
      executorProviderId: input.executorProviderId,
      executorAgentId: input.executorAgentId,
      auditorAgentId: input.auditorAgentId,
      catarinaSpecialistIds: Array.from(new Set(['AG-100', ...specialists.map((s) => s.id)])),
      priority: input.priority,
      acceptanceCriteria: input.acceptanceCriteria,
      dependencies: [],
      isolation: {
        worktreePath: input.worktreePath,
        branchName: input.branchName,
        baseSha: input.baseSha,
        currentHeadSha: input.baseSha,
        ownedModules: input.ownedModules,
        isolatedNodeModulesPath: `${input.worktreePath.replace(/\/$/, '')}/node_modules`,
        reservedPort: input.reservedPort,
        testDbSchema: `d1_test_msn_${String(nextNum).padStart(3, '0')}`,
        leaseId: `LEASE-B360-${String(nextNum).padStart(3, '0')}`,
        leaseExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        cpuLimitPercent: 50,
        memoryLimitMb: 2048,
      },
      preflight: {
        executorIdentityVerified: true,
        permissionsVerified: true,
        governanceInstructionsLoaded: true,
        resourceAvailabilityConfirmed: input.executorProviderId !== 'IA-10',
        repoStateClean: pf ? pf.repoStateClean : true,
        exclusiveBranchAssigned: true,
        exclusiveWorktreeAssigned: pf ? pf.exclusiveWorktreeAssigned : true,
        baseShaRecorded: true,
        noUncommittedChanges: pf ? pf.repoStateClean : true,
        moduleOwnershipVerified: true,
        isolatedMutableDependencies: pf ? pf.isolatedMutableDependencies : true,
        noUnsafeSymlinksOrJunctions: pf ? pf.noUnsafeSymlinksOrJunctions : true,
        reservedPortAssigned: true,
        isolatedTestDbSchemaAssigned: true,
        executionLeaseAcquired: pf ? pf.executionLeaseAcquired && input.executorProviderId !== 'IA-10' : input.executorProviderId !== 'IA-10',
        acceptanceCriteriaDefined: input.acceptanceCriteria.length > 0,
        checklistAttached: true,
        independentAuditorAssigned:
          (pf ? pf.independentAuditorAssigned : true) &&
          input.executorAgentId !== input.auditorAgentId,
      },
      approvedSha: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
    };

    const preflightEval = evaluateMissionPreflight(newMission, db.missions);
    if (!preflightEval.passed) {
      newMission.status = 'BLOQUEADA_ISOLAMENTO';
      newMission.rejectionReason = [
        ...preflightEval.failedChecks,
        ...preflightEval.isolationConflicts,
      ].join(' | ');
    } else {
      newMission.status = 'PREFLIGHT_APROVADO';
    }

    db.missions.unshift(newMission);
    saveBrowserMockDb(db);
    return HttpResponse.json({ mission: newMission, preflightEvaluation: preflightEval }, { status: 201 });
  }),

  http.post('/api/missions/:id/transition', async ({ params, request }) => {
    const body = (await request.json()) as any;
    const schema = z.object({
      action: z.enum([
        'EXECUTAR_PREFLIGHT',
        'AVANCAR_ETAPA',
        'REPROVAR_ENTREGA',
        'INVALIDAR_POR_NOVO_COMMIT',
      ]),
      newCommitSha: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json({ error: 'Ação de transição inválida.' }, { status: 400 });
    }

    const db = getBrowserMockDb();
    const idx = db.missions.findIndex((m) => m.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: 'Missão não encontrada.' }, { status: 404 });
    }

    const current = db.missions[idx];
    const preflightEval = evaluateMissionPreflight(current, db.missions);

    if (parsed.data.action === 'EXECUTAR_PREFLIGHT') {
      current.status = preflightEval.passed ? 'PREFLIGHT_APROVADO' : 'BLOQUEADA_ISOLAMENTO';
      current.rejectionReason = preflightEval.passed
        ? null
        : [...preflightEval.failedChecks, ...preflightEval.isolationConflicts].join(' | ');
      db.missions[idx] = current;
      saveBrowserMockDb(db);
      return HttpResponse.json({ mission: current, preflightEvaluation: preflightEval });
    }

    if (parsed.data.action === 'AVANCAR_ETAPA' && !preflightEval.passed) {
      return HttpResponse.json(
        {
          error:
            'Bloqueio Constitucional de Preflight: Corrija as pendências de isolamento antes de avançar a missão.',
          preflightEvaluation: preflightEval,
        },
        { status: 422 }
      );
    }

    const updated = computeNextMissionStep(
      current,
      parsed.data.action,
      parsed.data.newCommitSha
    );
    db.missions[idx] = updated;
    saveBrowserMockDb(db);
    return HttpResponse.json({ mission: updated, preflightEvaluation: preflightEval });
  }),

  http.post('/api/messages', async ({ request }) => {
    const body = await request.json();
    const parsed = SendMessageInputSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json({ error: 'Dados de mensagem inválidos.' }, { status: 400 });
    }
    const input = parsed.data;
    if (
      input.authorType !== 'ORQUESTRADOR_HUMANO' &&
      /marcelo|orquestrador humano/i.test(input.authorName)
    ) {
      return HttpResponse.json(
        {
          error:
            'Violação Constitucional (Seção 8): Nenhuma mensagem produzida por IA pode ser atribuída ao Orquestrador Humano.',
        },
        { status: 403 }
      );
    }
    const db = getBrowserMockDb();
    const contentHash = computeContentFingerprint(
      `${input.authorId}:${input.conversationId}:${input.content}`
    );
    const newMsg = {
      id: `MSG-${String(db.messages.length + 1).padStart(3, '0')}`,
      conversationId: input.conversationId,
      channelType: input.channelType,
      authorType: input.authorType,
      authorId: input.authorId,
      authorName: input.authorName,
      recipientIds: input.recipientIds,
      missionId: input.missionId,
      waveId: input.waveId,
      priority: input.priority,
      messageKind: input.messageKind,
      content: input.content,
      codeSnippet: input.codeSnippet ?? null,
      relatedSha: input.relatedSha ?? null,
      processingState: 'NAO_RESPONDIDA' as const,
      contentHash,
      createdAt: new Date().toISOString(),
    };
    db.messages.unshift(newMsg);
    saveBrowserMockDb(db);
    return HttpResponse.json({ message: newMsg }, { status: 201 });
  }),

  http.post('/api/conversations/import', async ({ request }) => {
    const body = (await request.json()) as any;
    const db = getBrowserMockDb();
    const report = parseHistoricalConversationDocument(
      body.fileName || 'conversa-importada.md',
      body.rawText || '',
      body.sourceFolderUrl
    );
    const existing = db.importedConversations.find(
      (item) => item.contentFingerprint === report.contentFingerprint
    );
    if (existing) {
      return HttpResponse.json({ report: existing, idempotentReimport: true });
    }
    db.importedConversations.unshift(report);
    saveBrowserMockDb(db);
    return HttpResponse.json({ report, idempotentReimport: false }, { status: 201 });
  }),

  http.post('/api/audits/:id/verdict', async ({ params, request }) => {
    const body = (await request.json()) as any;
    const db = getBrowserMockDb();
    const audit = db.audits.find((a) => a.id === params.id);
    if (!audit) {
      return HttpResponse.json({ error: 'Auditoria não encontrada.' }, { status: 404 });
    }
    const mission = db.missions.find((m) => m.id === audit.missionId);
    if (!mission) {
      return HttpResponse.json({ error: 'Missão não encontrada.' }, { status: 404 });
    }
    if (body.decision === 'APROVADA' || body.decision === 'APROVADA_COM_RESSALVAS') {
      const validation = validateAuditApproval(mission, audit, body.auditorAgentId);
      if (!validation.allowed) {
        return HttpResponse.json({ error: validation.reason }, { status: 422 });
      }
    }
    audit.state = body.decision;
    audit.finalVerdict = body.finalVerdict;
    saveBrowserMockDb(db);
    return HttpResponse.json({ audit, mission });
  }),

  http.post('/api/governance/kill-switch', async ({ request }) => {
    const body = (await request.json()) as any;
    const db = getBrowserMockDb();
    db.governance.globalAutomationSuspended = Boolean(body.suspend);
    db.governance.emergencyKillSwitchReason = body.suspend ? body.reason : null;
    saveBrowserMockDb(db);
    return HttpResponse.json({
      governance: db.governance,
      automationJobs: db.automationJobs,
    });
  }),
];

/**
 * Instância MSW Worker para uso em navegadores / testes de UI independentes do backend.
 */
export const worker = typeof window !== 'undefined' ? setupWorker(...handlers) : null;
