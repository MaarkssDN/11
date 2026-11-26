import { http, HttpResponse } from 'msw';
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

const STORAGE_KEY = 'b360_aoc_msw_db_v2';

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
        id: 'AG-001',
        number: 1,
        name: 'Agente 01 — Engenheiro de Prompt & Contratos',
        operationalPersona: 'Especialista em Especificação Formal e Prompts Determinísticos',
        specialty: 'Engenharia de Prompts, Checklists e Contratos de Handoff',
        responsibilities: ['Manter Prompt Studio e Biblioteca de Prompts'],
        squadId: 'SQ-COMANDO',
        coordinatorId: 'AG-000',
        associatedProviderId: 'IA-05',
        ownedModules: ['mod-11', 'mod-12', 'mod-13', 'mod-14'],
        permanentInstructions: 'Todo prompt deve incluir escopo e critérios de aceite.',
        operationalState: 'PRONTO_CATALOGO',
        activeMissionIds: [],
        completedMissionsCount: 9,
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
        id: 'AG-095',
        number: 95,
        name: 'Agente 95 — Auditor Externo de Alterações Críticas',
        operationalPersona: 'Revisor Independente de Segunda Instância',
        specialty: 'Reauditoria Pós-Correção Local e Mudanças Constitucionais',
        responsibilities: ['Auditar entregas corrigidas localmente pelo Squad Catarina 100'],
        squadId: 'SQ-AUDITORIA-EXTERNA',
        coordinatorId: 'ORQUESTRADOR_HUMANO',
        associatedProviderId: 'IA-03',
        ownedModules: ['mod-23'],
        permanentInstructions: 'Garantir dupla independência após intervenções corretivas locais.',
        operationalState: 'PRONTO_CATALOGO',
        activeMissionIds: [],
        completedMissionsCount: 4,
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
      { id: 'ONDA-00', number: 0, title: 'Onda 00 — Auditoria da Central existente e descoberta', scope: 'Levantamento de capacidades reais do Google AI Studio, inventário das 10 IAs, assinaturas e regras constitucionais.', status: 'CONCLUIDA_FUNDACAO', dependencies: [], acceptanceCriteria: ['Capacidades do ambiente registradas', 'Limitações documentadas sem simulações enganosas'], promptId: 'PRM-00', checklistId: 'CHK-00', risks: ['Presunção incorreta de APIs pagas'], evidenceSummary: 'Diagnóstico registrado em ARCHITECTURE.md e INTEGRATIONS.md.' },
      { id: 'ONDA-01', number: 1, title: 'Onda 01 — Arquitetura e contratos', scope: 'Definição dos contratos tipados Zod, 40 módulos, 23 estados operacionais e separação de domínios.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-00'], acceptanceCriteria: ['TypeScript strict ativo', 'Contratos compartilhados entre frontend e backend'], promptId: 'PRM-01', checklistId: 'CHK-01', risks: ['Acoplamento entre UI e regras de negócio'], evidenceSummary: 'Arquivo src/shared/contracts.ts validado com tsc --noEmit.' },
      { id: 'ONDA-02', number: 2, title: 'Onda 02 — Infraestrutura', scope: 'Servidor Express + Vite full-stack e preparação de adaptadores para Cloudflare Pages, Workers e D1.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-01'], acceptanceCriteria: ['API REST funcional em /api/*', 'Configuração compatível com futura migração Cloudflare'], promptId: 'PRM-02', checklistId: 'CHK-02', risks: ['Dependência de recursos exclusivos de container'], evidenceSummary: 'Servidor server.ts e adaptadores documentados.' },
      { id: 'ONDA-03', number: 3, title: 'Onda 03 — Autenticação e segurança', scope: 'RBAC, autoridade máxima do Orquestrador Humano, proteção contra prompt injection e Kill Switch global.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-02'], acceptanceCriteria: ['Botão de suspensão global funcional', 'Log de auditoria imutável por operação'], promptId: 'PRM-03', checklistId: 'CHK-03', risks: ['Escalonamento não autorizado de permissões por IA'], evidenceSummary: 'Módulos de Governança e Segurança operacionais.' },
      { id: 'ONDA-04', number: 4, title: 'Onda 04 — Banco de dados', scope: 'Persistência real local + Migration SQL completa das 45 entidades relacionais para Cloudflare D1.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-01'], acceptanceCriteria: ['45 tabelas definidas em migrations/0001_initial_schema.sql', 'Persistência real em disco'], promptId: 'PRM-04', checklistId: 'CHK-04', risks: ['Perda de estado entre reinicializações'], evidenceSummary: 'Banco persistente e schema SQL D1 criados.' },
      { id: 'ONDA-05', number: 5, title: 'Onda 05 — Estrutura visual e navegação', scope: 'Design system corporativo B360-AOC, sidebar recolhível, 40 módulos navegáveis, modo claro/escuro e Command Palette.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-01'], acceptanceCriteria: ['Contraste WCAG 2.2 AA', 'Navegação fluida pelos 40 módulos e Command Palette'], promptId: 'PRM-05', checklistId: 'CHK-05', risks: ['Poluição visual ou aparência genérica'], evidenceSummary: 'Layout empresarial com tokens do brandbook Birthub 360.' },
      { id: 'ONDA-06', number: 6, title: 'Onda 06 — Inteligências artificiais e contas', scope: 'Cadastro das 10 IAs oficiais (IA-01 a IA-10), adaptadores explícitos e gestão das assinaturas existentes.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-04', 'ONDA-05'], acceptanceCriteria: ['10 IAs cadastradas', 'Política de R$ 0,00 aplicada'], promptId: 'PRM-06', checklistId: 'CHK-06', risks: ['Confusão entre provedor de IA e agente operacional'], evidenceSummary: 'Gerenciador de IAs e Assinaturas ativo.' },
      { id: 'ONDA-07', number: 7, title: 'Onda 07 — Agentes e squads', scope: 'Catálogo preservando Astra (00), Catarina (100), especialistas e os 8 Squads operacionais + Organograma.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-06'], acceptanceCriteria: ['Numeração oficial preservada', 'CRUD de alocação e estado operacional'], promptId: 'PRM-07', checklistId: 'CHK-07', risks: ['Alteração não autorizada de identidade de agentes'], evidenceSummary: 'Gerenciador de Agentes, Squads e Organograma ativos.' },
      { id: 'ONDA-08', number: 8, title: 'Onda 08 — Conversas e mensagens', scope: 'Central de Conversas entre IAs com canais por missão/onda/squad, prevenção de duplicidade e autor real.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-07'], acceptanceCriteria: ['Nenhuma mensagem de IA atribuída ao Orquestrador Humano', 'Hash anti-duplicidade ativo'], promptId: 'PRM-08', checklistId: 'CHK-08', risks: ['Atribuição falsa de autoria'], evidenceSummary: 'Central de Conversas persistente operacional.' },
      { id: 'ONDA-09', number: 9, title: 'Onda 09 — Importação de históricos', scope: 'Importador idempotente para arquivos Markdown/TXT da pasta Google Drive CONVERSAS ENTRE MARCELO E IAS.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-08'], acceptanceCriteria: ['Extração dos 15 itens obrigatórios', 'Preservação integral do texto original'], promptId: 'PRM-09', checklistId: 'CHK-09', risks: ['Invenção de dados ausentes'], evidenceSummary: 'Motor parseHistoricalConversationDocument testado com node:test.' },
      { id: 'ONDA-10', number: 10, title: 'Onda 10 — Missões, ondas e prompts', scope: 'Central de Missões com máquina de estados de 23 etapas, Kanban, Gerenciador de Ondas e Prompt Studio.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-07'], acceptanceCriteria: ['Criação real de missões com validação Zod', 'Transição pelos 23 estados'], promptId: 'PRM-10', checklistId: 'CHK-10', risks: ['Execução sem preflight'], evidenceSummary: 'Central de Missões e Prompt Studio integrados.' },
      { id: 'ONDA-11', number: 11, title: 'Onda 11 — Checklists e dependências', scope: 'Checklists persistentes, Central de Handoffs e bloqueio de colisão de dependências entre missões.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-10'], acceptanceCriteria: ['Itens de checklist persistidos no backend', 'Detecção automática de colisão de módulos/portas'], promptId: 'PRM-11', checklistId: 'CHK-11', risks: ['Dois agentes editando o mesmo módulo sem coordenação'], evidenceSummary: 'Verificador de conflitos de isolamento testado.' },
      { id: 'ONDA-12', number: 12, title: 'Onda 12 — Motor de automação', scope: 'Filas persistentes, leases, heartbeats, retries e preservação de missões locais quando o PC está desligado.', status: 'EM_ANDAMENTO', dependencies: ['ONDA-11'], acceptanceCriteria: ['Independência de sessão de chat aberta', 'Respeito ao botão de suspensão emergencial'], promptId: 'PRM-12', checklistId: 'CHK-12', risks: ['Execução duplicada de jobs'], evidenceSummary: 'Fila persistente e controle de leases implementados.' },
      { id: 'ONDA-13', number: 13, title: 'Onda 13 — Devin Command Center', scope: 'Central da operação local Windows (C:/D:, worktrees, processos) e protocolo outbound seguro.', status: 'EM_ANDAMENTO', dependencies: ['ONDA-12'], acceptanceCriteria: ['Ponte local desabilitada por padrão até verificação real do Devin', 'Zero exposição direta de terminal'], promptId: 'PRM-13', checklistId: 'CHK-13', risks: ['Exposição indevida de serviços locais'], evidenceSummary: 'Devin Command Center e LOCAL-RUNNER.md disponíveis.' },
      { id: 'ONDA-14', number: 14, title: 'Onda 14 — Catarina Command Center', scope: 'Mobilização seletiva do Squad 100 por domínio, consolidação de pareceres e prevenção de conflito de interesse.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-07', 'ONDA-10'], acceptanceCriteria: ['Seleção cirúrgica por domínio', 'Bloqueio do agente executor na validação'], promptId: 'PRM-14', checklistId: 'CHK-14', risks: ['Mobilização indiscriminada de especialistas'], evidenceSummary: 'Catarina Command Center com seletor automático por domínio.' },
      { id: 'ONDA-15', number: 15, title: 'Onda 15 — Auditoria e homologação', scope: 'Central de Auditoria Independente vinculada ao SHA, 9 estados de auditoria e proibição de autoaprovação.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-10', 'ONDA-14'], acceptanceCriteria: ['Invalidação automática se SHA mudar', 'Proibição de aprovar teste não executado'], promptId: 'PRM-15', checklistId: 'CHK-15', risks: ['Falso positivo em testes não rodados'], evidenceSummary: 'Regras validateAuditApproval cobertas por testes unitários.' },
      { id: 'ONDA-16', number: 16, title: 'Onda 16 — Integração Git', scope: 'Git Integration Center em modo seguro somente leitura para MaarkssDN/Birthub-360 e Birthub-360-Operations.', status: 'EM_ANDAMENTO', dependencies: ['ONDA-15'], acceptanceCriteria: ['Modo somente leitura ativo por padrão', 'Planos de PR vinculados ao SHA auditado'], promptId: 'PRM-16', checklistId: 'CHK-16', risks: ['Modificação acidental do repositório principal do produto'], evidenceSummary: 'Trava somente leitura ativa para repositório principal.' },
      { id: 'ONDA-17', number: 17, title: 'Onda 17 — Memória, evidências e controle financeiro', scope: 'Memória estruturada nos 10 níveis com proveniência, Central de Evidências e trava financeira R$ 0,00.', status: 'CONCLUIDA_FUNDACAO', dependencies: ['ONDA-04'], acceptanceCriteria: ['10 níveis de memória operacionais', 'Trava R$ 0,00 inviolável por IAs'], promptId: 'PRM-17', checklistId: 'CHK-17', risks: ['Alucinação tratada como memória verificada'], evidenceSummary: 'Classificação explícita de Fato Verificado vs Afirmação de IA.' },
      { id: 'ONDA-18', number: 18, title: 'Onda 18 — Testes, segurança e performance', scope: 'Quality Gates reais (Typecheck, Lint, Build, Unit Tests node:test e verificação E2E Playwright).', status: 'EM_ANDAMENTO', dependencies: ['ONDA-15'], acceptanceCriteria: ['Zero erros de compilação TypeScript strict', 'Testes unitários passando com código 0'], promptId: 'PRM-18', checklistId: 'CHK-18', risks: ['Regressão silenciosa de contratos'], evidenceSummary: 'Suite operationsEngine.test.ts executável via tsx --test.' },
      { id: 'ONDA-19', number: 19, title: 'Onda 19 — Homologação e ativação progressiva', scope: 'Implantação em Cloudflare Pages/Workers/D1, conexão do Runner Local Windows e homologação final.', status: 'PLANEJADA', dependencies: ['ONDA-13', 'ONDA-16', 'ONDA-18'], acceptanceCriteria: ['Aprovação final do Orquestrador Humano', 'Checklist de produção concluído'], promptId: 'PRM-19', checklistId: 'CHK-19', risks: ['Ativação local sem verificação contratual do Devin'], evidenceSummary: 'Plano de ativação documentado em ROADMAP.md.' },
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
        acceptanceCriteria: [
          'TypeScript em modo strict sem erros (tsc --noEmit)',
          '40 módulos acessíveis e contratos de dados compartilhados',
          'Testes unitários reais executados com código de saída 0',
        ],
        dependencies: [],
        isolation: {
          worktreePath: 'D:/Birthub360-Operations/worktrees/msn-001-foundation',
          branchName: 'wave/01-b360-aoc-foundation',
          baseSha: '7f8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
          currentHeadSha: '4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
          ownedModules: ['src/shared/contracts.ts', 'src/domain/operationsEngine.ts', 'src/App.tsx'],
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
      {
        id: 'MSN-002',
        code: 'B360-MSN-002',
        title: 'Protocolo Seguro Outbound do Runner Local Windows e Homologação Devin',
        waveId: 'ONDA-13',
        squadId: 'SQ-INFRA',
        stepNumber: 8,
        stepCode: '08_PREFLIGHT_OBRIGATORIO',
        status: 'BLOQUEADA_ISOLAMENTO',
        executorProviderId: 'IA-10',
        executorAgentId: 'AG-070',
        auditorAgentId: 'AG-088',
        catarinaSpecialistIds: ['AG-100', 'AG-077'],
        priority: 'ALTA',
        acceptanceCriteria: [
          'Confirmar situação contratual e capacidades reais de integração do Devin',
          'Garantir conexão apenas de saída autenticada a partir do Windows',
          'Validar isolamento entre unidades C: e D: sem junctions de node_modules',
        ],
        dependencies: ['MSN-001'],
        isolation: {
          worktreePath: 'D:/Birthub360-Operations/worktrees/msn-002-local-runner',
          branchName: 'wave/13-devin-outbound-runner',
          baseSha: '4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
          currentHeadSha: '4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
          ownedModules: ['mod-21', 'LOCAL-RUNNER.md'],
          isolatedNodeModulesPath: 'D:/Birthub360-Operations/worktrees/msn-002-local-runner/node_modules',
          reservedPort: 3102,
          testDbSchema: 'd1_test_msn_002',
          leaseId: 'LEASE-B360-002',
          leaseExpiresAt: '2026-11-26T18:00:00.000Z',
          cpuLimitPercent: 50,
          memoryLimitMb: 2048,
        },
        preflight: {
          executorIdentityVerified: true,
          permissionsVerified: true,
          governanceInstructionsLoaded: true,
          resourceAvailabilityConfirmed: false,
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
          executionLeaseAcquired: false,
          acceptanceCriteriaDefined: true,
          checklistAttached: true,
          independentAuditorAssigned: true,
        },
        approvedSha: null,
        rejectionReason: 'Bloqueio preventivo de Preflight: Capacidades reais e situação contratual do Devin (IA-10) aguardam verificação formal.',
        createdAt: '2026-11-25T13:15:00.000Z',
        updatedAt: '2026-11-25T15:40:00.000Z',
      },
    ],
    messages: [
      {
        id: 'MSG-001',
        conversationId: 'CONV-COMANDO-GLOBAL',
        channelType: 'SQUAD',
        authorType: 'ORQUESTRADOR_HUMANO',
        authorId: 'HUMANO-MARCELO',
        authorName: 'Marcelo (Orquestrador Humano)',
        recipientIds: ['AG-000', 'AG-100', 'IA-07', 'IA-06'],
        missionId: 'MSN-001',
        waveId: 'ONDA-01',
        priority: 'URGENTE',
        messageKind: 'SOLICITACAO_APROVACAO',
        content: 'Determino o início imediato da construção da Central Birthub 360 — AI Operations Center (B360-AOC) em repositório independente, respeitando limite de R$ 0,00 em gastos adicionais e isolamento total por missão.',
        codeSnippet: null,
        relatedSha: '7f8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
        processingState: 'PROCESSADA',
        contentHash: 'fnv1a-msg001',
        createdAt: '2026-11-25T12:00:00.000Z',
      },
      {
        id: 'MSG-002',
        conversationId: 'CONV-COMANDO-GLOBAL',
        channelType: 'MISSAO',
        authorType: 'AGENTE_OPERACIONAL',
        authorId: 'AG-000',
        authorName: 'Agente 00 — Astra (Squad de Comando Global)',
        recipientIds: ['AG-010', 'IA-07', 'AG-088', 'AG-100'],
        missionId: 'MSN-001',
        waveId: 'ONDA-01',
        priority: 'ALTA',
        messageKind: 'HANDOFF',
        content: 'Missão B360-MSN-001 despachada para execução no Google AI Studio (IA-07) com worktree exclusiva, porta reservada 3101 e auditor independente designado (Agente 88).',
        codeSnippet: null,
        relatedSha: '4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
        processingState: 'PROCESSADA',
        contentHash: 'fnv1a-msg002',
        createdAt: '2026-11-25T13:05:00.000Z',
      },
      {
        id: 'MSG-003',
        conversationId: 'CONV-AUDITORIA-SHA',
        channelType: 'MISSAO',
        authorType: 'AGENTE_OPERACIONAL',
        authorId: 'AG-100',
        authorName: 'Agente 100 — Catarina (Squad de Especialistas)',
        recipientIds: ['AG-088', 'AG-045', 'AG-077'],
        missionId: 'MSN-001',
        waveId: 'ONDA-14',
        priority: 'ALTA',
        messageKind: 'PARECER_AUDITORIA',
        content: 'Mobilizados apenas os especialistas AG-045 (Persistência D1) e AG-077 (Segurança/RBAC). Conflito de interesse verificado: AG-010 (executor) excluído da banca avaliadora.',
        codeSnippet: 'npx --yes tsx --test src/domain/operationsEngine.test.ts',
        relatedSha: '4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
        processingState: 'NAO_RESPONDIDA',
        contentHash: 'fnv1a-msg003',
        createdAt: '2026-11-25T15:25:00.000Z',
      },
    ],
    importedConversations: [initialImport],
    audits: [
      {
        id: 'AUD-001',
        missionId: 'MSN-001',
        originalExecutorId: 'AG-010',
        responsibleAuditorId: 'AG-088',
        auditedSha: '4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
        scope: 'Auditoria da Fundação B360-AOC: Contratos Zod, Motor de Domínio, 40 Módulos, Persistência e Testes Unitários.',
        acceptanceCriteriaChecked: [
          'TypeScript em modo strict configurado em tsconfig.json',
          'Regras de preflight, isolamento e proibição de autoaprovação cobertas por testes unitários reais',
          'Estados explícitos de desconectado/modo assistido para integrações externas sem credenciais',
        ],
        analyzedFiles: [
          'src/shared/contracts.ts',
          'src/domain/operationsEngine.ts',
          'src/domain/operationsEngine.test.ts',
          'migrations/0001_initial_schema.sql',
        ],
        executedTests: [
          {
            name: 'Unit Tests (Motor de Operações, Preflight, Isolamento, SHA e Importador)',
            command: 'npx --yes tsx --test src/domain/operationsEngine.test.ts',
            exitCode: 0,
            executed: true,
            result: 'APROVADO',
          },
          {
            name: 'TypeScript Strict Typecheck',
            command: 'npm run lint',
            exitCode: 0,
            executed: true,
            result: 'APROVADO',
          },
          {
            name: 'Teste de Integração Real com Ponte Local Devin Windows',
            command: 'devin-local-runner --verify-handshake',
            exitCode: null,
            executed: false,
            result: 'NAO_EXECUTADO',
          },
        ],
        evidences: [
          '7 testes unitários executados via node:test com exit code 0',
          'Migration SQL 0001_initial_schema.sql validada com 45 tabelas relacionais',
        ],
        findings: [
          {
            id: 'FND-001',
            category: 'LIMITACAO_EVIDENCIA',
            severity: 'MEDIA',
            description: 'O teste de handshake com o Runner Local do Devin no Windows não foi executado porque a integração local está preventivamente desabilitada até verificação contratual.',
            fileOrModule: 'src/server/adapters.ts',
            recommendation: 'Manter estado explícito BLOQUEADO_VERIFICACAO_PENDENTE no Devin Command Center e não declarar o teste local como aprovado.',
            requiredFix: 'Nenhuma correção de código; aguardar verificação contratual pelo Orquestrador Humano.',
          },
        ],
        state: 'EM_AUDITORIA',
        finalVerdict: 'Em auditoria independente pelo Agente 88. Testes unitários e typecheck strict aprovados; teste de ponte local Devin corretamente marcado como NAO_EXECUTADO.',
        createdAt: '2026-11-25T14:00:00.000Z',
        updatedAt: '2026-11-25T15:45:00.000Z',
      },
    ],
    prompts: [
      {
        id: 'PRM-01',
        title: 'Prompt Mestre — Onda 01 a 05 (Fundação e Contratos Tipados B360-AOC)',
        waveId: 'ONDA-01',
        targetProviderId: 'IA-07',
        targetSquadId: 'SQ-DEV-NUVEM',
        version: 1,
        objective: 'Implementar os contratos tipados com Zod, motor de preflight e isolamento, persistência real e interface corporativa dos 40 módulos.',
        scopeModules: ['src/shared/contracts.ts', 'src/domain/operationsEngine.ts', 'server.ts', 'src/App.tsx'],
        constitutionalConstraints: [
          'TypeScript em modo strict obrigatório',
          'Limite financeiro de R$ 0,00 em gastos adicionais',
          'Nenhum agente pode aprovar o próprio trabalho',
        ],
        acceptanceCriteria: [
          'Compilação limpa em modo strict',
          'Testes unitários executados com exit code 0',
          'Persistência funcional via API REST',
        ],
        promptBody: 'Você é o Squad de Desenvolvimento na Nuvem operando no Google AI Studio (IA-07). Execute a missão vinculada à Onda 01 respeitando estritamente o isolamento de worktree e ownership de módulos.',
        updatedAt: '2026-11-25T12:30:00.000Z',
      },
      {
        id: 'PRM-13',
        title: 'Prompt de Homologação Local — Onda 13 (Devin Command Center & Runner Windows)',
        waveId: 'ONDA-13',
        targetProviderId: 'IA-10',
        targetSquadId: 'SQ-AUDITORIA-LOCAL',
        version: 1,
        objective: 'Auditar a entrega recebida da nuvem nas unidades C: e D: do computador Windows sem compartilhar node_modules mutáveis.',
        scopeModules: ['mod-21', 'mod-25', 'LOCAL-RUNNER.md'],
        constitutionalConstraints: [
          'Proibido usar junctions ou symlinks para node_modules mutáveis',
          'Conexão exclusivamente outbound autenticada',
        ],
        acceptanceCriteria: [
          'Worktree exclusiva criada em D:\\Birthub360-Operations\\worktrees\\<missao>',
          'Relatório de auditoria vinculado ao SHA exato',
        ],
        promptBody: 'Coordenador Local Devin (IA-10) e Squad de Auditoria Local: Verifique o SHA recebido da nuvem e provisione worktree isolada na Unidade D:.',
        updatedAt: '2026-11-25T14:10:00.000Z',
      },
    ],
    checklists: [
      {
        id: 'CHK-01',
        title: 'Checklist Constitucional de Preflight e Isolamento (Obrigatório antes da Etapa 09)',
        waveId: 'ONDA-01',
        missionId: 'MSN-001',
        category: 'PREFLIGHT',
        items: [
          { id: 'chk-item-1', label: 'Identidade do agente executor, permissões RBAC e instruções de governança carregadas', checked: true, verifiedBy: 'AG-000', evidenceNote: 'Verificado via evaluateMissionPreflight' },
          { id: 'chk-item-2', label: 'Worktree exclusiva, branch exclusiva e SHA base registrados sem alterações pendentes', checked: true, verifiedBy: 'AG-070', evidenceNote: 'Branch wave/01-b360-aoc-foundation' },
          { id: 'chk-item-3', label: 'Dependências mutáveis (node_modules) isoladas sem symlinks ou junctions compartilhadas', checked: true, verifiedBy: 'AG-070', evidenceNote: 'Isolamento validado' },
          { id: 'chk-item-4', label: 'Porta reservada (3101) e schema de banco de testes exclusivo (d1_test_msn_001) alocados', checked: true, verifiedBy: 'AG-070', evidenceNote: 'Sem colisão com missões concorrentes' },
          { id: 'chk-item-5', label: 'Auditor independente designado (AG-088 != AG-010) e critérios de aceite anexados', checked: true, verifiedBy: 'AG-088', evidenceNote: 'Separação de funções confirmada' },
        ],
      },
      {
        id: 'CHK-15',
        title: 'Checklist de Auditoria Independente e Quality Gates (Etapa 12 a 15)',
        waveId: 'ONDA-15',
        missionId: 'MSN-001',
        category: 'AUDITORIA_LOCAL_DEVIN',
        items: [
          { id: 'chk-aud-1', label: 'Confirmar que o SHA auditado corresponde exatamente ao HEAD atual da branch da missão', checked: true, verifiedBy: 'AG-088', evidenceNote: 'SHA 4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d' },
          { id: 'chk-aud-2', label: 'TypeScript strict typecheck (npm run lint) executado com código de saída 0', checked: true, verifiedBy: 'AG-088', evidenceNote: 'Exit code 0' },
          { id: 'chk-aud-3', label: 'Testes unitários do motor de domínio (node:test) executados com código de saída 0', checked: true, verifiedBy: 'AG-088', evidenceNote: '7/7 testes aprovados' },
          { id: 'chk-aud-4', label: 'Build de produção (npm run build) executado sem erros', checked: true, verifiedBy: 'AG-088', evidenceNote: 'Build Vite concluído' },
          { id: 'chk-aud-5', label: 'Homologação na máquina local Windows pelo Devin (Pendente de verificação contratual)', checked: false, verifiedBy: null, evidenceNote: 'Explicitamente marcado como não executado até habilitação local' },
        ],
      },
    ],
    memories: [
      {
        id: 'MEM-001',
        level: 'GLOBAL',
        entityRef: 'B360-AOC-CONSTITUTION',
        title: 'Política Financeira Permanente de R$ 0,00 em Gastos Adicionais',
        content: 'O limite de despesas adicionais é estritamente R$ 0,00. É proibido contratar APIs pagas automaticamente, comprar créditos ou utilizar múltiplas contas para burlar limites de provedores.',
        provenance: 'Instruções Constitucionais Permanentes — Seção 11 & Seção 21',
        verificationStatus: 'INSTRUCAO_CONSTITUCIONAL',
        version: 1,
        updatedAt: '2026-11-25T12:00:00.000Z',
      },
      {
        id: 'MEM-002',
        level: 'PROJETO',
        entityRef: 'Birthub-360-Operations',
        title: 'Independência Estrutural do Produto Principal Birthub 360',
        content: 'O repositório principal https://github.com/MaarkssDN/Birthub-360 permanece intocado e em modo seguro somente leitura. Toda a operação da Central ocorre em Birthub-360-Operations.',
        provenance: 'Instruções Constitucionais Permanentes — Seção 1 & Seção 5',
        verificationStatus: 'INSTRUCAO_CONSTITUCIONAL',
        version: 1,
        updatedAt: '2026-11-25T12:00:00.000Z',
      },
      {
        id: 'MEM-003',
        level: 'INTELIGENCIA_ARTIFICIAL',
        entityRef: 'IA-10 (Devin)',
        title: 'Bloqueio Preventivo da Ponte Local Windows do Devin',
        content: 'A integração com o Devin na máquina Windows deve permanecer desabilitada até que a situação contratual e as capacidades técnicas reais sejam verificadas pelo Orquestrador Humano.',
        provenance: 'Seção 4 e Seção 16 do Prompt Mestre',
        verificationStatus: 'INSTRUCAO_CONSTITUCIONAL',
        version: 1,
        updatedAt: '2026-11-25T12:10:00.000Z',
      },
      {
        id: 'MEM-004',
        level: 'AUDITORIA',
        entityRef: 'AUD-001',
        title: 'Proibição de Autoaprovação e Vínculo Obrigatório ao SHA',
        content: 'Toda aprovação está vinculada ao hash SHA efetivamente auditado. Qualquer novo commit na branch invalida automaticamente a aprovação anterior e retorna a missão à Etapa 12.',
        provenance: 'Verificação Técnica src/domain/operationsEngine.ts (SHA 4c5d6e7f8a)',
        verificationStatus: 'FATO_VERIFICADO_SHA',
        version: 1,
        updatedAt: '2026-11-25T15:00:00.000Z',
      },
    ],
    automationJobs: [
      {
        id: 'JOB-001',
        title: 'Verificador Contínuo de Preflight e Colisão de Worktrees/Portas',
        triggerType: 'EVENTO',
        coordinatorProviderId: 'IA-06',
        targetEnvironment: 'NUVEM',
        status: 'LEASE_ATIVO',
        priority: 1,
        retryCount: 0,
        maxRetries: 3,
        leaseOwner: 'AG-012',
        lastHeartbeatAt: '2026-11-25T16:00:00.000Z',
        idempotencyKey: 'idem-preflight-guard-v1',
      },
      {
        id: 'JOB-002',
        title: 'Pacote de Auditoria Local da Missão B360-MSN-001 para o Runner Windows',
        triggerType: 'FILA_LOCAL_DEVIN',
        coordinatorProviderId: 'IA-05',
        targetEnvironment: 'LOCAL_WINDOWS',
        status: 'AGUARDANDO_MAQUINA_LOCAL',
        priority: 2,
        retryCount: 0,
        maxRetries: 5,
        leaseOwner: null,
        lastHeartbeatAt: null,
        idempotencyKey: 'idem-local-queue-msn-001',
      },
    ],
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
      auditLogs: [
        {
          id: 'LOG-001',
          timestamp: '2026-11-25T12:00:00.000Z',
          actor: 'Marcelo (Orquestrador Humano)',
          action: 'INICIALIZACAO_CONSTITUCIONAL_B360_AOC',
          target: 'Birthub-360-Operations',
          shaOrRef: '7f8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
        },
        {
          id: 'LOG-002',
          timestamp: '2026-11-25T13:10:00.000Z',
          actor: 'AG-070 (Squad Infra)',
          action: 'BLOQUEIO_PREVENTIVO_PONTE_LOCAL_DEVIN',
          target: 'IA-10 (Devin Windows)',
          shaOrRef: '4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
        },
      ],
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

export function buildAdapterDiagnostics(providers: AIProvider[]) {
  const now = new Date().toISOString();
  return providers.map((provider) => ({
    providerId: provider.id,
    providerName: provider.name,
    checkedAt: now,
    reachable:
      provider.connectionStatus === 'CONECTADO_API_LOCAL' ||
      provider.connectionStatus === 'MODO_ASSISTIDO_HUMANO',
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
// PROCESSADOR DE ROTAS MOCK (Compartilhado entre MSW Handlers e Fallback Serverless)
// ============================================================================

export async function processMockApiRequest(
  path: string,
  method: string,
  rawBody?: unknown
): Promise<{ status: number; data: unknown }> {
  const cleanPath = path.split('?')[0];
  const upperMethod = method.toUpperCase();
  let body: unknown = rawBody;
  if (typeof rawBody === 'string' && rawBody.trim().length > 0) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = rawBody;
    }
  }

  if (upperMethod === 'GET' && cleanPath === '/api/state') {
    const db = getBrowserMockDb();
    return {
      status: 200,
      data: {
        modules: OFFICIAL_40_MODULES,
        lifecycleSteps: MISSION_LIFECYCLE_STEPS,
        adapterDiagnostics: buildAdapterDiagnostics(db.providers),
        db,
      },
    };
  }

  if (upperMethod === 'POST' && cleanPath === '/api/missions') {
    const parsed = CreateMissionInputSchema.safeParse(body);
    if (!parsed.success) {
      return {
        status: 400,
        data: {
          error: 'Falha de validação Zod nos dados da missão.',
          details: parsed.error.flatten().fieldErrors,
        },
      };
    }

    const db = getBrowserMockDb();
    if (db.governance.globalAutomationSuspended) {
      return {
        status: 403,
        data: {
          error: 'Operação bloqueada: Suspensão Global de Automações (Kill Switch) ativa.',
        },
      };
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
        executionLeaseAcquired: pf
          ? pf.executionLeaseAcquired && input.executorProviderId !== 'IA-10'
          : input.executorProviderId !== 'IA-10',
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
    return {
      status: 201,
      data: { mission: newMission, preflightEvaluation: preflightEval },
    };
  }

  const transitionMatch = cleanPath.match(/^\/api\/missions\/([^/]+)\/transition$/);
  if (upperMethod === 'POST' && transitionMatch) {
    const missionId = transitionMatch[1];
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
      return { status: 400, data: { error: 'Ação de transição inválida.' } };
    }

    const db = getBrowserMockDb();
    const idx = db.missions.findIndex((m) => m.id === missionId);
    if (idx === -1) {
      return { status: 404, data: { error: 'Missão não encontrada.' } };
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
      return {
        status: 200,
        data: { mission: current, preflightEvaluation: preflightEval },
      };
    }

    if (parsed.data.action === 'AVANCAR_ETAPA' && !preflightEval.passed) {
      return {
        status: 422,
        data: {
          error:
            'Bloqueio Constitucional de Preflight: Corrija as pendências de isolamento antes de avançar a missão.',
          preflightEvaluation: preflightEval,
        },
      };
    }

    const updated = computeNextMissionStep(
      current,
      parsed.data.action,
      parsed.data.newCommitSha
    );
    db.missions[idx] = updated;
    saveBrowserMockDb(db);
    return {
      status: 200,
      data: { mission: updated, preflightEvaluation: preflightEval },
    };
  }

  if (upperMethod === 'POST' && cleanPath === '/api/messages') {
    const parsed = SendMessageInputSchema.safeParse(body);
    if (!parsed.success) {
      return { status: 400, data: { error: 'Dados de mensagem inválidos.' } };
    }
    const input = parsed.data;
    if (
      input.authorType !== 'ORQUESTRADOR_HUMANO' &&
      /marcelo|orquestrador humano/i.test(input.authorName)
    ) {
      return {
        status: 403,
        data: {
          error:
            'Violação Constitucional (Seção 8): Nenhuma mensagem produzida por IA pode ser atribuída ao Orquestrador Humano.',
        },
      };
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
    return { status: 201, data: { message: newMsg } };
  }

  if (upperMethod === 'POST' && cleanPath === '/api/conversations/import') {
    const payload = (body || {}) as Record<string, string>;
    const db = getBrowserMockDb();
    const report = parseHistoricalConversationDocument(
      payload.fileName || 'conversa-importada.md',
      payload.rawText || '',
      payload.sourceFolderUrl
    );
    const existing = db.importedConversations.find(
      (item) => item.contentFingerprint === report.contentFingerprint
    );
    if (existing) {
      return { status: 200, data: { report: existing, idempotentReimport: true } };
    }
    db.importedConversations.unshift(report);
    saveBrowserMockDb(db);
    return { status: 201, data: { report, idempotentReimport: false } };
  }

  const auditVerdictMatch = cleanPath.match(/^\/api\/audits\/([^/]+)\/verdict$/);
  if (upperMethod === 'POST' && auditVerdictMatch) {
    const auditId = auditVerdictMatch[1];
    const payload = (body || {}) as Record<string, any>;
    const db = getBrowserMockDb();
    const audit = db.audits.find((a) => a.id === auditId);
    if (!audit) {
      return { status: 404, data: { error: 'Auditoria não encontrada.' } };
    }
    const mission = db.missions.find((m) => m.id === audit.missionId);
    if (!mission) {
      return { status: 404, data: { error: 'Missão não encontrada.' } };
    }
    if (payload.decision === 'APROVADA' || payload.decision === 'APROVADA_COM_RESSALVAS') {
      const validation = validateAuditApproval(mission, audit, payload.auditorAgentId);
      if (!validation.allowed) {
        return { status: 422, data: { error: validation.reason } };
      }
    }
    audit.state = payload.decision;
    audit.finalVerdict = payload.finalVerdict;
    saveBrowserMockDb(db);
    return { status: 200, data: { audit, mission } };
  }

  if (upperMethod === 'POST' && cleanPath === '/api/governance/kill-switch') {
    const payload = (body || {}) as Record<string, any>;
    const db = getBrowserMockDb();
    db.governance.globalAutomationSuspended = Boolean(payload.suspend);
    db.governance.emergencyKillSwitchReason = payload.suspend ? payload.reason : null;
    saveBrowserMockDb(db);
    return {
      status: 200,
      data: {
        governance: db.governance,
        automationJobs: db.automationJobs,
      },
    };
  }

  const checklistToggleMatch = cleanPath.match(
    /^\/api\/checklists\/([^/]+)\/items\/([^/]+)\/toggle$/
  );
  if (upperMethod === 'POST' && checklistToggleMatch) {
    const [, checklistId, itemId] = checklistToggleMatch;
    const db = getBrowserMockDb();
    const checklist = db.checklists.find((c) => c.id === checklistId);
    if (!checklist) {
      return { status: 404, data: { error: 'Checklist não encontrado.' } };
    }
    const item = checklist.items.find((i) => i.id === itemId);
    if (!item) {
      return { status: 404, data: { error: 'Item não encontrado.' } };
    }
    item.checked = !item.checked;
    item.verifiedBy = item.checked ? 'ORQUESTRADOR_HUMANO' : null;
    saveBrowserMockDb(db);
    return { status: 200, data: { checklist } };
  }

  if (upperMethod === 'POST' && cleanPath === '/api/prompts') {
    const payload = (body || {}) as Record<string, any>;
    const db = getBrowserMockDb();
    const newPrompt = {
      id: `PRM-${String(db.prompts.length + 1).padStart(2, '0')}`,
      title: payload.title || 'Novo Prompt Estruturado',
      waveId: payload.waveId || 'ONDA-01',
      targetProviderId: payload.targetProviderId || 'IA-07',
      targetSquadId: payload.targetSquadId || 'SQ-DEV-NUVEM',
      version: 1,
      objective: payload.objective || '',
      scopeModules: Array.isArray(payload.scopeModules) ? payload.scopeModules : [],
      constitutionalConstraints: [
        'TypeScript em modo strict obrigatório',
        'Limite financeiro de R$ 0,00 em gastos adicionais',
        'Nenhum agente pode aprovar o próprio trabalho',
      ],
      acceptanceCriteria: Array.isArray(payload.acceptanceCriteria)
        ? payload.acceptanceCriteria
        : [],
      promptBody: payload.promptBody || '',
      updatedAt: new Date().toISOString(),
    };
    db.prompts.unshift(newPrompt);
    saveBrowserMockDb(db);
    return { status: 201, data: { prompt: newPrompt } };
  }

  if (upperMethod === 'POST' && cleanPath === '/api/memories') {
    const payload = (body || {}) as Record<string, any>;
    const db = getBrowserMockDb();
    const newMemory = {
      id: `MEM-${String(db.memories.length + 1).padStart(3, '0')}`,
      level: payload.level || 'GLOBAL',
      entityRef: payload.entityRef || 'B360-AOC',
      title: payload.title || 'Registro de Memória',
      content: payload.content || '',
      provenance: payload.provenance || 'Orquestrador Humano',
      verificationStatus: payload.verificationStatus || 'FATO_VERIFICADO_SHA',
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    db.memories.unshift(newMemory);
    saveBrowserMockDb(db);
    return { status: 201, data: { memory: newMemory } };
  }

  return { status: 404, data: { error: `Rota mock não encontrada: ${cleanPath}` } };
}

// ============================================================================
// MSW HANDLERS OFICIAIS (Intercepta chamadas fetch no navegador / testes)
// ============================================================================

export const handlers = [
  http.get('/api/state', async () => {
    const res = await processMockApiRequest('/api/state', 'GET');
    return HttpResponse.json(res.data as Record<string, unknown>, { status: res.status });
  }),

  http.post('/api/missions', async ({ request }) => {
    const body = await request.json();
    const res = await processMockApiRequest('/api/missions', 'POST', body);
    return HttpResponse.json(res.data as Record<string, unknown>, { status: res.status });
  }),

  http.post('/api/missions/:id/transition', async ({ params, request }) => {
    const body = await request.json();
    const res = await processMockApiRequest(
      `/api/missions/${params.id}/transition`,
      'POST',
      body
    );
    return HttpResponse.json(res.data as Record<string, unknown>, { status: res.status });
  }),

  http.post('/api/messages', async ({ request }) => {
    const body = await request.json();
    const res = await processMockApiRequest('/api/messages', 'POST', body);
    return HttpResponse.json(res.data as Record<string, unknown>, { status: res.status });
  }),

  http.post('/api/conversations/import', async ({ request }) => {
    const body = await request.json();
    const res = await processMockApiRequest('/api/conversations/import', 'POST', body);
    return HttpResponse.json(res.data as Record<string, unknown>, { status: res.status });
  }),

  http.post('/api/audits/:id/verdict', async ({ params, request }) => {
    const body = await request.json();
    const res = await processMockApiRequest(
      `/api/audits/${params.id}/verdict`,
      'POST',
      body
    );
    return HttpResponse.json(res.data as Record<string, unknown>, { status: res.status });
  }),

  http.post('/api/governance/kill-switch', async ({ request }) => {
    const body = await request.json();
    const res = await processMockApiRequest('/api/governance/kill-switch', 'POST', body);
    return HttpResponse.json(res.data as Record<string, unknown>, { status: res.status });
  }),

  http.post('/api/checklists/:id/items/:itemId/toggle', async ({ params }) => {
    const res = await processMockApiRequest(
      `/api/checklists/${params.id}/items/${params.itemId}/toggle`,
      'POST'
    );
    return HttpResponse.json(res.data as Record<string, unknown>, { status: res.status });
  }),

  http.post('/api/prompts', async ({ request }) => {
    const body = await request.json();
    const res = await processMockApiRequest('/api/prompts', 'POST', body);
    return HttpResponse.json(res.data as Record<string, unknown>, { status: res.status });
  }),

  http.post('/api/memories', async ({ request }) => {
    const body = await request.json();
    const res = await processMockApiRequest('/api/memories', 'POST', body);
    return HttpResponse.json(res.data as Record<string, unknown>, { status: res.status });
  }),
];

/**
 * Instância MSW Worker para uso em navegadores e testes de interface sem backend.
 * Carrega msw/browser sob demanda no ambiente browser para manter compatibilidade com node:test.
 */
export const worker = {
  handlers,
  async start(options?: Record<string, unknown>) {
    if (typeof window === 'undefined') return undefined;
    const { setupWorker } = await import('msw/browser');
    const instance = setupWorker(...handlers);
    return instance.start(options);
  },
};

/**
 * Wrapper fetch resiliente: tenta o endpoint real/MSW Service Worker e, caso o backend não esteja
 * disponível (ou retorne HTML fallback em ambiente serverless), executa diretamente o processador
 * mock de src/mocks/browser.ts, garantindo 100% de testabilidade sem backend.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res;
    }
  } catch {
    // Backend indisponível — aciona fallback direto do MSW browser mock
  }

  let parsedBody: unknown = undefined;
  if (init?.body && typeof init.body === 'string') {
    try {
      parsedBody = JSON.parse(init.body);
    } catch {
      parsedBody = undefined;
    }
  }

  const mockResult = await processMockApiRequest(
    input,
    init?.method || 'GET',
    parsedBody
  );

  return new Response(JSON.stringify(mockResult.data), {
    status: mockResult.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
