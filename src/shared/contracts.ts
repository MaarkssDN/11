import { z } from 'zod';

// ============================================================================
// 1. OS 40 MÓDULOS OBRIGATÓRIOS DA PLATAFORMA B360-AOC
// ============================================================================

export const ModuleCategorySchema = z.enum([
  'COMANDO_E_GESTAO',
  'PLANEJAMENTO_E_EXECUCAO',
  'OPERACAO_LOCAL_E_QUALIDADE',
  'INTEGRACAO_SEGURANCA_E_CONHECIMENTO',
]);

export type ModuleCategory = z.infer<typeof ModuleCategorySchema>;

export interface PlatformModuleDef {
  id: string;
  number: number;
  title: string;
  category: ModuleCategory;
  shortTitle: string;
  description: string;
  waveIntroduced: string;
  status: 'OPERACIONAL' | 'MODO_SEGURO_LEITURA' | 'AGUARDANDO_VERIFICACAO_LOCAL';
}

export const OFFICIAL_40_MODULES: PlatformModuleDef[] = [
  // Comando e Gestão (1-10)
  { id: 'mod-01', number: 1, title: 'Global Command Center', shortTitle: 'Global Command', category: 'COMANDO_E_GESTAO', description: 'Visão unificada dos 3 ambientes (Nuvem, Máquina Local Windows/Devin e GitHub) com controle de emergência.', waveIntroduced: 'Onda 01', status: 'OPERACIONAL' },
  { id: 'mod-02', number: 2, title: 'Dashboard Executivo', shortTitle: 'Dashboard Executivo', category: 'COMANDO_E_GESTAO', description: 'Indicadores operacionais, IAs, agentes, missões ativas/bloqueadas, ondas, auditorias e recursos locais.', waveIntroduced: 'Onda 05', status: 'OPERACIONAL' },
  { id: 'mod-03', number: 3, title: 'Central de Conversas entre IAs', shortTitle: 'Conversas entre IAs', category: 'COMANDO_E_GESTAO', description: 'Barramento corporativo de comunicação multi-IA com proveniência verificada e importador do Google Drive.', waveIntroduced: 'Onda 08', status: 'OPERACIONAL' },
  { id: 'mod-04', number: 4, title: 'Gerenciador de Inteligências Artificiais', shortTitle: 'Inteligências Artificiais', category: 'COMANDO_E_GESTAO', description: 'Catálogo oficial das 10 ferramentas de IA (IA-01 a IA-10), adaptadores e capacidades reais.', waveIntroduced: 'Onda 06', status: 'OPERACIONAL' },
  { id: 'mod-05', number: 5, title: 'Gerenciador de Contas e Assinaturas', shortTitle: 'Contas e Assinaturas', category: 'COMANDO_E_GESTAO', description: 'Controle das 4 contas Google AI Pro, ChatGPT Plus, Claude Pro, Copilot Pro, SuperGrok e política R$ 0,00.', waveIntroduced: 'Onda 06', status: 'OPERACIONAL' },
  { id: 'mod-06', number: 6, title: 'Gerenciador de Agentes', shortTitle: 'Agentes (00-100)', category: 'COMANDO_E_GESTAO', description: 'Preservação da identidade, numeração, memória e ownership do Agente 00 (Astra) ao Agente 100 (Catarina).', waveIntroduced: 'Onda 07', status: 'OPERACIONAL' },
  { id: 'mod-07', number: 7, title: 'Gerenciador de Squads', shortTitle: 'Squads Operacionais', category: 'COMANDO_E_GESTAO', description: 'Gestão dos 8 Squads oficiais de Comando, Nuvem, Auditoria Local, Catarina 100, Externa, Git, Infra e Segurança.', waveIntroduced: 'Onda 07', status: 'OPERACIONAL' },
  { id: 'mod-08', number: 8, title: 'Organograma Operacional', shortTitle: 'Organograma', category: 'COMANDO_E_GESTAO', description: 'Hierarquia constitucional liderada pelo Orquestrador Humano com separação de funções e cadeia de comando.', waveIntroduced: 'Onda 07', status: 'OPERACIONAL' },
  { id: 'mod-09', number: 9, title: 'Central de Missões', shortTitle: 'Central de Missões', category: 'COMANDO_E_GESTAO', description: 'Orquestração de missões com máquina de estados de 23 etapas, isolamento de worktree/branch e preflight.', waveIntroduced: 'Onda 10', status: 'OPERACIONAL' },
  { id: 'mod-10', number: 10, title: 'Gerenciador de Ondas', shortTitle: 'Ondas (00-19)', category: 'COMANDO_E_GESTAO', description: 'Planejamento, critérios de aceite, dependências e liberação progressiva das 20 ondas de construção.', waveIntroduced: 'Onda 10', status: 'OPERACIONAL' },

  // Planejamento e Execução (11-20)
  { id: 'mod-11', number: 11, title: 'Prompt Studio', shortTitle: 'Prompt Studio', category: 'PLANEJAMENTO_E_EXECUCAO', description: 'Engenharia, versionamento e compilação de prompts estruturados com restrições constitucionais e checklists.', waveIntroduced: 'Onda 10', status: 'OPERACIONAL' },
  { id: 'mod-12', number: 12, title: 'Biblioteca de Prompts', shortTitle: 'Biblioteca de Prompts', category: 'PLANEJAMENTO_E_EXECUCAO', description: 'Catálogo versionado de templates operacionais para desenvolvimento, auditoria, homologação e integração Git.', waveIntroduced: 'Onda 10', status: 'OPERACIONAL' },
  { id: 'mod-13', number: 13, title: 'Gerenciador de Checklists', shortTitle: 'Checklists', category: 'PLANEJAMENTO_E_EXECUCAO', description: 'Checklists persistentes obrigatórios para preflight, execução, auditoria local e quality gates.', waveIntroduced: 'Onda 11', status: 'OPERACIONAL' },
  { id: 'mod-14', number: 14, title: 'Central de Handoffs', shortTitle: 'Central de Handoffs', category: 'PLANEJAMENTO_E_EXECUCAO', description: 'Transferências formais de contexto, SHA base, artefatos e evidências entre IAs de Nuvem, Devin e Catarina.', waveIntroduced: 'Onda 11', status: 'OPERACIONAL' },
  { id: 'mod-15', number: 15, title: 'Gerenciador de Dependências entre Missões', shortTitle: 'Grafo de Missões', category: 'PLANEJAMENTO_E_EXECUCAO', description: 'Mapeamento de bloqueadores, pré-requisitos, locks de módulos e prevenção de colisão entre agentes.', waveIntroduced: 'Onda 11', status: 'OPERACIONAL' },
  { id: 'mod-16', number: 16, title: 'Kanban Operacional', shortTitle: 'Kanban Operacional', category: 'PLANEJAMENTO_E_EXECUCAO', description: 'Quadro visual sincronizado com a máquina de estados das missões, ondas e responsáveis.', waveIntroduced: 'Onda 10', status: 'OPERACIONAL' },
  { id: 'mod-17', number: 17, title: 'Calendário de Operações', shortTitle: 'Calendário & Janelas', category: 'PLANEJAMENTO_E_EXECUCAO', description: 'Cronograma de janelas de execução, renovações de cotas de assinaturas e ciclos de auditoria.', waveIntroduced: 'Onda 12', status: 'OPERACIONAL' },
  { id: 'mod-18', number: 18, title: 'Motor de Automação', shortTitle: 'Motor de Automação', category: 'PLANEJAMENTO_E_EXECUCAO', description: 'Filas persistentes, leases, locks, heartbeats, retries com backoff e suspensão global independente de chat.', waveIntroduced: 'Onda 12', status: 'OPERACIONAL' },
  { id: 'mod-19', number: 19, title: 'Central de Notificações', shortTitle: 'Notificações', category: 'PLANEJAMENTO_E_EXECUCAO', description: 'Alertas operacionais de bloqueio de preflight, reprovação de auditoria, conflito de SHA e solicitação humana.', waveIntroduced: 'Onda 12', status: 'OPERACIONAL' },
  { id: 'mod-20', number: 20, title: 'Central de Aprovações Humanas', shortTitle: 'Aprovações Humanas', category: 'PLANEJAMENTO_E_EXECUCAO', description: 'Deliberação exclusiva do Orquestrador Humano para merges, deploys, políticas constitucionais e exceções.', waveIntroduced: 'Onda 03', status: 'OPERACIONAL' },

  // Operação Local e Qualidade (21-30)
  { id: 'mod-21', number: 21, title: 'Devin Command Center', shortTitle: 'Devin Command', category: 'OPERACAO_LOCAL_E_QUALIDADE', description: 'Coordenação da operação local Windows (Unidades C:/D:, worktrees, runner local) com protocolo seguro de saída.', waveIntroduced: 'Onda 13', status: 'AGUARDANDO_VERIFICACAO_LOCAL' },
  { id: 'mod-22', number: 22, title: 'Catarina Command Center', shortTitle: 'Catarina (Agente 100)', category: 'OPERACAO_LOCAL_E_QUALIDADE', description: 'Mobilização seletiva de especialistas por domínio para análise técnica, validação e correções autorizadas.', waveIntroduced: 'Onda 14', status: 'OPERACIONAL' },
  { id: 'mod-23', number: 23, title: 'Central de Auditoria Independente', shortTitle: 'Auditoria Independente', category: 'OPERACAO_LOCAL_E_QUALIDADE', description: 'Fiscalização vinculada ao SHA auditado com proibição estrita de autoaprovação e classificação de achados.', waveIntroduced: 'Onda 15', status: 'OPERACIONAL' },
  { id: 'mod-24', number: 24, title: 'Central de Homologação', shortTitle: 'Homologação', category: 'OPERACAO_LOCAL_E_QUALIDADE', description: 'Validação de entregas da nuvem no ambiente real antes do encaminhamento ao Squad de Integração Git.', waveIntroduced: 'Onda 15', status: 'OPERACIONAL' },
  { id: 'mod-25', number: 25, title: 'Gerenciador de Worktrees', shortTitle: 'Worktrees Isoladas', category: 'OPERACAO_LOCAL_E_QUALIDADE', description: 'Fiscalização de worktrees exclusivas por missão sem compartilhamento inseguro de node_modules ou junctions.', waveIntroduced: 'Onda 13', status: 'OPERACIONAL' },
  { id: 'mod-26', number: 26, title: 'Gerenciador de Branches', shortTitle: 'Branches & SHAs', category: 'OPERACAO_LOCAL_E_QUALIDADE', description: 'Rastreamento de branches exclusivas por missão, SHA base, status de divergência e invalidação automática.', waveIntroduced: 'Onda 16', status: 'OPERACIONAL' },
  { id: 'mod-27', number: 27, title: 'Gerenciador de Dependências', shortTitle: 'Dependências & Isolamento', category: 'OPERACAO_LOCAL_E_QUALIDADE', description: 'Auditoria de pacotes, isolamento de dependências mutáveis e proibição de symlinks inseguros entre missões.', waveIntroduced: 'Onda 13', status: 'OPERACIONAL' },
  { id: 'mod-28', number: 28, title: 'Gerenciador de Ambientes', shortTitle: 'Ambientes & Portas', category: 'OPERACAO_LOCAL_E_QUALIDADE', description: 'Reserva de portas exclusivas, schemas de banco de testes isolados e variáveis de ambiente por missão.', waveIntroduced: 'Onda 02', status: 'OPERACIONAL' },
  { id: 'mod-29', number: 29, title: 'Monitoramento de Infraestrutura', shortTitle: 'Infraestrutura', category: 'OPERACAO_LOCAL_E_QUALIDADE', description: 'Telemetria declarada dos ambientes Nuvem (Cloudflare Pages/Workers/D1), Runner Local Windows e GitHub.', waveIntroduced: 'Onda 02', status: 'OPERACIONAL' },
  { id: 'mod-30', number: 30, title: 'Central de Testes e Quality Gates', shortTitle: 'Testes & Quality Gates', category: 'OPERACAO_LOCAL_E_QUALIDADE', description: 'Verificação real de Typecheck, Lint, Build, Testes Unitários, Integração, E2E, Acessibilidade e Segurança.', waveIntroduced: 'Onda 18', status: 'OPERACIONAL' },

  // Integração, Segurança e Conhecimento (31-40)
  { id: 'mod-31', number: 31, title: 'Git Integration Center', shortTitle: 'Git Integration', category: 'INTEGRACAO_SEGURANCA_E_CONHECIMENTO', description: 'Integração em modo seguro somente leitura com MaarkssDN/Birthub-360 e repositório Birthub-360-Operations.', waveIntroduced: 'Onda 16', status: 'MODO_SEGURO_LEITURA' },
  { id: 'mod-32', number: 32, title: 'Gerenciador de Pull Requests', shortTitle: 'Pull Requests', category: 'INTEGRACAO_SEGURANCA_E_CONHECIMENTO', description: 'Planos de integração controlada, verificação de SHA aprovado e bloqueio de merge sem autorização aplicável.', waveIntroduced: 'Onda 16', status: 'MODO_SEGURO_LEITURA' },
  { id: 'mod-33', number: 33, title: 'Monitoramento de GitHub Actions', shortTitle: 'GitHub Actions', category: 'INTEGRACAO_SEGURANCA_E_CONHECIMENTO', description: 'Acompanhamento de workflows de CI/CD e quality gates vinculados aos SHAs das entregas.', waveIntroduced: 'Onda 16', status: 'MODO_SEGURO_LEITURA' },
  { id: 'mod-34', number: 34, title: 'Central de Memória', shortTitle: 'Memória Estruturada', category: 'INTEGRACAO_SEGURANCA_E_CONHECIMENTO', description: 'Memória em 10 níveis (Global, Projeto, IA, Agente, Squad, Conversa, Missão, Onda, Auditoria e Integração).', waveIntroduced: 'Onda 17', status: 'OPERACIONAL' },
  { id: 'mod-35', number: 35, title: 'Biblioteca de Conhecimento', shortTitle: 'Conhecimento & Docs', category: 'INTEGRACAO_SEGURANCA_E_CONHECIMENTO', description: 'Documentação viva permanente: README, AGENTS, ARCHITECTURE, GOVERNANCE, SECURITY, ROADMAP e LOCAL-RUNNER.', waveIntroduced: 'Onda 17', status: 'OPERACIONAL' },
  { id: 'mod-36', number: 36, title: 'Central de Evidências', shortTitle: 'Evidências & Logs', category: 'INTEGRACAO_SEGURANCA_E_CONHECIMENTO', description: 'Repositório imutável de logs, códigos de saída, capturas e artefatos vinculados a cada missão e auditoria.', waveIntroduced: 'Onda 17', status: 'OPERACIONAL' },
  { id: 'mod-37', number: 37, title: 'Central de Governança', shortTitle: 'Governança Constitucional', category: 'INTEGRACAO_SEGURANCA_E_CONHECIMENTO', description: 'Regras constitucionais permanentes, rastreabilidade de alterações e fiscalização de escopo e ownership.', waveIntroduced: 'Onda 03', status: 'OPERACIONAL' },
  { id: 'mod-38', number: 38, title: 'Central de Segurança', shortTitle: 'Segurança & RBAC', category: 'INTEGRACAO_SEGURANCA_E_CONHECIMENTO', description: 'RBAC, privilégio mínimo, proteção contra prompt injection, cofre de segredos e botão de suspensão emergencial.', waveIntroduced: 'Onda 03', status: 'OPERACIONAL' },
  { id: 'mod-39', number: 39, title: 'Central Financeira e Consumo', shortTitle: 'Financeiro (R$ 0,00)', category: 'INTEGRACAO_SEGURANCA_E_CONHECIMENTO', description: 'Política constitucional de R$ 0,00 em gastos adicionais, monitoramento de cotas de assinaturas e bloqueio pago.', waveIntroduced: 'Onda 17', status: 'OPERACIONAL' },
  { id: 'mod-40', number: 40, title: 'Configurações e Administração', shortTitle: 'Administração', category: 'INTEGRACAO_SEGURANCA_E_CONHECIMENTO', description: 'Parâmetros de adaptadores, exportação de banco de dados compatível com Cloudflare D1 e diagnóstico da Central.', waveIntroduced: 'Onda 19', status: 'OPERACIONAL' },
];

// ============================================================================
// 2. OS 23 ESTADOS DO FLUXO OPERACIONAL AUTOMATIZADO
// ============================================================================

export const MISSION_LIFECYCLE_STEPS = [
  { step: 1, code: '01_SOLICITACAO_HUMANA', label: '01. Solicitação Humana', ownerRole: 'ORQUESTRADOR_HUMANO' },
  { step: 2, code: '02_ANALISE_SOLICITACAO', label: '02. Análise da Solicitação', ownerRole: 'SQUAD_COMANDO_GLOBAL' },
  { step: 3, code: '03_PLANEJAMENTO', label: '03. Planejamento', ownerRole: 'SQUAD_COMANDO_GLOBAL' },
  { step: 4, code: '04_DIVISAO_EM_ONDAS', label: '04. Divisão em Ondas', ownerRole: 'SQUAD_COMANDO_GLOBAL' },
  { step: 5, code: '05_CRIACAO_PROMPTS', label: '05. Criação dos Prompts', ownerRole: 'SQUAD_COMANDO_GLOBAL' },
  { step: 6, code: '06_CRIACAO_CHECKLISTS', label: '06. Criação dos Checklists', ownerRole: 'SQUAD_COMANDO_GLOBAL' },
  { step: 7, code: '07_SELECAO_IA_EXECUTORA', label: '07. Seleção da IA Executora', ownerRole: 'SQUAD_COMANDO_GLOBAL' },
  { step: 8, code: '08_PREFLIGHT_OBRIGATORIO', label: '08. Preflight Obrigatório', ownerRole: 'MOTOR_AUTOMACAO' },
  { step: 9, code: '09_EXECUCAO_NA_NUVEM', label: '09. Execução na Nuvem', ownerRole: 'SQUAD_DESENVOLVIMENTO_NUVEM' },
  { step: 10, code: '10_ENTREGA_ESTRUTURADA', label: '10. Entrega Estruturada', ownerRole: 'SQUAD_DESENVOLVIMENTO_NUVEM' },
  { step: 11, code: '11_ENCAMINHAMENTO_DEVIN', label: '11. Encaminhamento ao Devin', ownerRole: 'MOTOR_AUTOMACAO' },
  { step: 12, code: '12_AUDITORIA_LOCAL', label: '12. Auditoria Local', ownerRole: 'SQUAD_AUDITORIA_LOCAL' },
  { step: 13, code: '13_VALIDACAO_CATARINA', label: '13. Validação Especializada pela Catarina', ownerRole: 'SQUAD_CATARINA_100' },
  { step: 14, code: '14_PARECER_TECNICO', label: '14. Parecer Técnico', ownerRole: 'SQUAD_AUDITORIA_LOCAL' },
  { step: 15, code: '15_APROVACAO_OU_REPROVACAO', label: '15. Aprovação ou Reprovação', ownerRole: 'SQUAD_AUDITORIA_LOCAL' },
  { step: 16, code: '16_CORRECAO_QUANDO_NECESSARIA', label: '16. Correção, quando necessária', ownerRole: 'SQUAD_CATARINA_100' },
  { step: 17, code: '17_NOVA_AUDITORIA', label: '17. Nova Auditoria', ownerRole: 'SQUAD_AUDITORIA_EXTERNA' },
  { step: 18, code: '18_ENCAMINHAMENTO_SQUAD_INTEGRACAO', label: '18. Encaminhamento ao Squad de Integração', ownerRole: 'SQUAD_INTEGRACAO' },
  { step: 19, code: '19_PR_E_QUALITY_GATES', label: '19. Pull Request e Quality Gates', ownerRole: 'SQUAD_INTEGRACAO' },
  { step: 20, code: '20_AUTORIZACAO_GOVERNANCA', label: '20. Autorização conforme Governança', ownerRole: 'ORQUESTRADOR_HUMANO' },
  { step: 21, code: '21_INTEGRACAO', label: '21. Integração', ownerRole: 'SQUAD_INTEGRACAO' },
  { step: 22, code: '22_ENCERRAMENTO', label: '22. Encerramento', ownerRole: 'SQUAD_COMANDO_GLOBAL' },
  { step: 23, code: '23_LIBERACAO_PROXIMA_ONDA', label: '23. Liberação da Próxima Onda', ownerRole: 'SQUAD_COMANDO_GLOBAL' },
] as const;

export type MissionStepCode = (typeof MISSION_LIFECYCLE_STEPS)[number]['code'];

// ============================================================================
// 3. SCHEMAS ZOD DAS ENTIDADES CENTRAIS
// ============================================================================

export const AdapterCapabilitiesSchema = z.object({
  sendMission: z.enum(['SUPORTADO', 'MODO_ASSISTIDO', 'NAO_CONFIGURADO', 'NAO_SUPORTADO']),
  receiveResponse: z.enum(['SUPORTADO', 'MODO_ASSISTIDO', 'NAO_CONFIGURADO', 'NAO_SUPORTADO']),
  checkAvailability: z.enum(['SUPORTADO', 'MODO_ASSISTIDO', 'NAO_CONFIGURADO', 'NAO_SUPORTADO']),
  checkConsumption: z.enum(['SUPORTADO', 'MODO_ASSISTIDO', 'NAO_CONFIGURADO', 'NAO_SUPORTADO']),
  cancelExecution: z.enum(['SUPORTADO', 'MODO_ASSISTIDO', 'NAO_CONFIGURADO', 'NAO_SUPORTADO']),
  receiveEvents: z.enum(['SUPORTADO', 'MODO_ASSISTIDO', 'NAO_CONFIGURADO', 'NAO_SUPORTADO']),
  attachFiles: z.enum(['SUPORTADO', 'MODO_ASSISTIDO', 'NAO_CONFIGURADO', 'NAO_SUPORTADO']),
  queryResults: z.enum(['SUPORTADO', 'MODO_ASSISTIDO', 'NAO_CONFIGURADO', 'NAO_SUPORTADO']),
  supportAuth: z.enum(['SUPORTADO', 'MODO_ASSISTIDO', 'NAO_CONFIGURADO', 'NAO_SUPORTADO']),
  supportAutomation: z.enum(['SUPORTADO', 'MODO_ASSISTIDO', 'NAO_CONFIGURADO', 'NAO_SUPORTADO']),
});

export type AdapterCapabilities = z.infer<typeof AdapterCapabilitiesSchema>;

export const AIProviderSchema = z.object({
  id: z.string(), // IA-01 .. IA-10
  name: z.string(),
  environment: z.string(),
  connectionStatus: z.enum(['CONECTADO_API_LOCAL', 'MODO_ASSISTIDO_HUMANO', 'DESCONECTADO_NAO_CONFIGURADO', 'BLOQUEADO_VERIFICACAO_PENDENTE']),
  roleDescription: z.string(),
  subscriptionSummary: z.string(),
  consumptionLimitNote: z.string(),
  inboxCount: z.number(),
  outboxCount: z.number(),
  capabilities: AdapterCapabilitiesSchema,
  integrationNotes: z.string(),
});

export type AIProvider = z.infer<typeof AIProviderSchema>;

export const SubscriptionAccountSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  title: z.string(),
  quantity: z.number(),
  tier: z.string(),
  additionalCostLimitBrl: z.number(),
  currentAdditionalSpendBrl: z.number(),
  quotaStatus: z.enum(['DISPONIVEL', 'MONITORAMENTO_MANUAL', 'VERIFICACAO_CONTRATUAL_PENDENTE', 'COTA_PAUSADA']),
  renewalPolicy: z.string(),
  antiAbuseRule: z.string(),
});

export type SubscriptionAccount = z.infer<typeof SubscriptionAccountSchema>;

export const OperationalAgentSchema = z.object({
  id: z.string(), // AG-000 .. AG-100
  number: z.number().min(0).max(100),
  name: z.string(),
  operationalPersona: z.string(),
  specialty: z.string(),
  responsibilities: z.array(z.string()),
  squadId: z.string(),
  coordinatorId: z.string(),
  associatedProviderId: z.string(),
  ownedModules: z.array(z.string()),
  permanentInstructions: z.string(),
  operationalState: z.enum(['PRONTO_CATALOGO', 'ALOCADO_MISSAO', 'EM_AUDITORIA', 'SUSPENSO_GOVERNANCA']),
  activeMissionIds: z.array(z.string()),
  completedMissionsCount: z.number(),
});

export type OperationalAgent = z.infer<typeof OperationalAgentSchema>;

export const OperationalSquadSchema = z.object({
  id: z.string(),
  name: z.string(),
  environment: z.enum(['NUVEM', 'LOCAL_WINDOWS', 'GITHUB', 'HIBRIDO']),
  coordinatorAgentId: z.string(),
  coordinatorProviderId: z.string(),
  missionScope: z.string(),
  memberAgentIds: z.array(z.string()),
  guardrails: z.array(z.string()),
});

export type OperationalSquad = z.infer<typeof OperationalSquadSchema>;

export const PreflightCheckSchema = z.object({
  executorIdentityVerified: z.boolean(),
  permissionsVerified: z.boolean(),
  governanceInstructionsLoaded: z.boolean(),
  resourceAvailabilityConfirmed: z.boolean(),
  repoStateClean: z.boolean(),
  exclusiveBranchAssigned: z.boolean(),
  exclusiveWorktreeAssigned: z.boolean(),
  baseShaRecorded: z.boolean(),
  noUncommittedChanges: z.boolean(),
  moduleOwnershipVerified: z.boolean(),
  isolatedMutableDependencies: z.boolean(),
  noUnsafeSymlinksOrJunctions: z.boolean(),
  reservedPortAssigned: z.boolean(),
  isolatedTestDbSchemaAssigned: z.boolean(),
  executionLeaseAcquired: z.boolean(),
  acceptanceCriteriaDefined: z.boolean(),
  checklistAttached: z.boolean(),
  independentAuditorAssigned: z.boolean(),
});

export type PreflightCheck = z.infer<typeof PreflightCheckSchema>;

export const MissionIsolationConfigSchema = z.object({
  worktreePath: z.string(),
  branchName: z.string(),
  baseSha: z.string(),
  currentHeadSha: z.string(),
  ownedModules: z.array(z.string()),
  isolatedNodeModulesPath: z.string(),
  reservedPort: z.number(),
  testDbSchema: z.string(),
  leaseId: z.string(),
  leaseExpiresAt: z.string(),
  cpuLimitPercent: z.number(),
  memoryLimitMb: z.number(),
});

export type MissionIsolationConfig = z.infer<typeof MissionIsolationConfigSchema>;

export const MissionSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  waveId: z.string(),
  stepNumber: z.number().min(1).max(23),
  stepCode: z.string(),
  status: z.enum(['PLANEJADA', 'PREFLIGHT_PENDENTE', 'PREFLIGHT_APROVADO', 'EM_EXECUCAO', 'EM_AUDITORIA', 'APROVADA_SHA', 'REPROVADA_AUDITORIA', 'BLOQUEADA_ISOLAMENTO', 'CONCLUIDA']),
  executorProviderId: z.string(),
  executorAgentId: z.string(),
  auditorAgentId: z.string(),
  catarinaSpecialistIds: z.array(z.string()),
  priority: z.enum(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']),
  acceptanceCriteria: z.array(z.string()),
  dependencies: z.array(z.string()),
  isolation: MissionIsolationConfigSchema,
  preflight: PreflightCheckSchema,
  approvedSha: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Mission = z.infer<typeof MissionSchema>;

export const CreateMissionInputSchema = z.object({
  title: z.string().min(5, 'O título da missão deve ter pelo menos 5 caracteres.'),
  waveId: z.string().min(1, 'Selecione uma onda válida.'),
  executorProviderId: z.string().min(1, 'Selecione a IA executora.'),
  executorAgentId: z.string().min(1, 'Selecione o agente executor.'),
  auditorAgentId: z.string().min(1, 'Selecione o auditor independente.'),
  priority: z.enum(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']),
  branchName: z.string().min(3, 'Informe a branch exclusiva da missão.'),
  worktreePath: z.string().min(3, 'Informe o caminho da worktree exclusiva.'),
  baseSha: z.string().regex(/^[0-9a-f]{7,40}$/i, 'O SHA base deve ser um hash Git hexadecimal válido (7 a 40 caracteres).'),
  reservedPort: z.number().int().min(3001).max(65535),
  ownedModules: z.array(z.string()).min(1, 'Defina pelo menos um módulo sob ownership da missão.'),
  acceptanceCriteria: z.array(z.string()).min(1, 'Defina pelo menos um critério de aceite verificável.'),
});

export type CreateMissionInput = z.infer<typeof CreateMissionInputSchema>;

export const WaveSchema = z.object({
  id: z.string(), // ONDA-00 .. ONDA-19
  number: z.number().min(0).max(19),
  title: z.string(),
  scope: z.string(),
  status: z.enum(['CONCLUIDA_FUNDACAO', 'EM_ANDAMENTO', 'PLANEJADA', 'BLOQUEADA_DEPENDENCIA']),
  dependencies: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  promptId: z.string(),
  checklistId: z.string(),
  risks: z.array(z.string()),
  evidenceSummary: z.string(),
});

export type Wave = z.infer<typeof WaveSchema>;

export const InterAIMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  channelType: z.enum(['INDIVIDUAL', 'GRUPO', 'SQUAD', 'MISSAO', 'ONDA']),
  authorType: z.enum(['ORQUESTRADOR_HUMANO', 'PROVEDOR_IA', 'AGENTE_OPERACIONAL', 'MOTOR_AUTOMACAO']),
  authorId: z.string(),
  authorName: z.string(),
  recipientIds: z.array(z.string()),
  missionId: z.string().nullable(),
  waveId: z.string().nullable(),
  priority: z.enum(['URGENTE', 'ALTA', 'NORMAL', 'REGISTRO']),
  messageKind: z.enum(['MENSAGEM', 'PROMPT', 'CODIGO', 'EVIDENCIA', 'PARECER_AUDITORIA', 'SOLICITACAO_APROVACAO', 'HANDOFF']),
  content: z.string(),
  codeSnippet: z.string().nullable(),
  relatedSha: z.string().nullable(),
  processingState: z.enum(['NAO_RESPONDIDA', 'PROCESSADA', 'ENCAMINHADA', 'AGUARDANDO_APROVACAO_HUMANA']),
  contentHash: z.string(),
  createdAt: z.string(),
});

export type InterAIMessage = z.infer<typeof InterAIMessageSchema>;

export const SendMessageInputSchema = z.object({
  conversationId: z.string().min(1),
  channelType: z.enum(['INDIVIDUAL', 'GRUPO', 'SQUAD', 'MISSAO', 'ONDA']),
  authorType: z.enum(['ORQUESTRADOR_HUMANO', 'PROVEDOR_IA', 'AGENTE_OPERACIONAL', 'MOTOR_AUTOMACAO']),
  authorId: z.string().min(1),
  authorName: z.string().min(1),
  recipientIds: z.array(z.string()).min(1, 'Selecione pelo menos um destinatário.'),
  missionId: z.string().nullable(),
  waveId: z.string().nullable(),
  priority: z.enum(['URGENTE', 'ALTA', 'NORMAL', 'REGISTRO']),
  messageKind: z.enum(['MENSAGEM', 'PROMPT', 'CODIGO', 'EVIDENCIA', 'PARECER_AUDITORIA', 'SOLICITACAO_APROVACAO', 'HANDOFF']),
  content: z.string().min(3, 'A mensagem não pode estar vazia.'),
  codeSnippet: z.string().nullable().optional(),
  relatedSha: z.string().nullable().optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

export const ImportedConversationReportSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  sourceFolderUrl: z.string(),
  contentFingerprint: z.string(),
  importedAt: z.string(),
  rawTextPreserved: z.string(),
  participantsIdentified: z.array(z.string()),
  chronologyEntries: z.array(z.string()),
  decisionsExtracted: z.array(z.string()),
  completedWork: z.array(z.string()),
  pendingWork: z.array(z.string()),
  blockersIdentified: z.array(z.string()),
  contradictionsDetected: z.array(z.string()),
  authorizationRequests: z.array(z.string()),
  branchesAndCommits: z.array(z.string()),
  evidencesReferenced: z.array(z.string()),
  diagnosticSummary: z.string(),
  proposedWaves: z.array(z.string()),
  generatedPrompts: z.array(z.string()),
  generatedChecklistItems: z.array(z.string()),
});

export type ImportedConversationReport = z.infer<typeof ImportedConversationReportSchema>;

export const AuditFindingSchema = z.object({
  id: z.string(),
  category: z.enum(['FALHA_PRODUTO', 'FALHA_AMBIENTAL', 'LIMITACAO_EVIDENCIA']),
  severity: z.enum(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']),
  description: z.string(),
  fileOrModule: z.string(),
  recommendation: z.string(),
  requiredFix: z.string(),
});

export type AuditFinding = z.infer<typeof AuditFindingSchema>;

export const AuditRecordSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  originalExecutorId: z.string(),
  responsibleAuditorId: z.string(),
  auditedSha: z.string(),
  scope: z.string(),
  acceptanceCriteriaChecked: z.array(z.string()),
  analyzedFiles: z.array(z.string()),
  executedTests: z.array(z.object({
    name: z.string(),
    command: z.string(),
    exitCode: z.number().nullable(),
    executed: z.boolean(),
    result: z.enum(['APROVADO', 'REPROVADO', 'NAO_EXECUTADO']),
  })),
  evidences: z.array(z.string()),
  findings: z.array(AuditFindingSchema),
  state: z.enum([
    'PENDENTE',
    'EM_AUDITORIA',
    'BLOQUEADA',
    'APROVADA',
    'APROVADA_COM_RESSALVAS',
    'REPROVADA',
    'AGUARDANDO_CORRECAO',
    'AGUARDANDO_RETESTE',
    'INVALIDADA',
  ]),
  finalVerdict: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AuditRecord = z.infer<typeof AuditRecordSchema>;

export const PromptTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  waveId: z.string(),
  targetProviderId: z.string(),
  targetSquadId: z.string(),
  version: z.number(),
  objective: z.string(),
  scopeModules: z.array(z.string()),
  constitutionalConstraints: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  promptBody: z.string(),
  updatedAt: z.string(),
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

export const ChecklistRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  waveId: z.string(),
  missionId: z.string().nullable(),
  category: z.enum(['PREFLIGHT', 'EXECUCAO_NUVEM', 'AUDITORIA_LOCAL_DEVIN', 'VALIDACAO_CATARINA_100', 'INTEGRACAO_GIT']),
  items: z.array(z.object({
    id: z.string(),
    label: z.string(),
    checked: z.boolean(),
    verifiedBy: z.string().nullable(),
    evidenceNote: z.string().nullable(),
  })),
});

export type ChecklistRecord = z.infer<typeof ChecklistRecordSchema>;

export const MemoryEntrySchema = z.object({
  id: z.string(),
  level: z.enum([
    'GLOBAL',
    'PROJETO',
    'INTELIGENCIA_ARTIFICIAL',
    'AGENTE',
    'SQUAD',
    'CONVERSA',
    'MISSAO',
    'ONDA',
    'AUDITORIA',
    'INTEGRACAO',
  ]),
  entityRef: z.string(),
  title: z.string(),
  content: z.string(),
  provenance: z.string(),
  verificationStatus: z.enum(['FATO_VERIFICADO_SHA', 'INSTRUCAO_CONSTITUCIONAL', 'AFIRMACAO_IA_NAO_VERIFICADA', 'CONFLITO_DETECTADO']),
  version: z.number(),
  updatedAt: z.string(),
});

export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

export const AutomationQueueJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  triggerType: z.enum(['EVENTO', 'AGENDAMENTO_CRON', 'HANDOFF_IA', 'FILA_LOCAL_DEVIN']),
  coordinatorProviderId: z.string(), // IA-05 ChatGPT, IA-06 Claude, etc.
  targetEnvironment: z.enum(['NUVEM', 'LOCAL_WINDOWS', 'GITHUB']),
  status: z.enum(['NA_FILA', 'LEASE_ATIVO', 'PAUSADA', 'BLOQUEADA_SUSPENSAO_GLOBAL', 'CONCLUIDA', 'AGUARDANDO_MAQUINA_LOCAL']),
  priority: z.number(),
  retryCount: z.number(),
  maxRetries: z.number(),
  leaseOwner: z.string().nullable(),
  lastHeartbeatAt: z.string().nullable(),
  idempotencyKey: z.string(),
});

export type AutomationQueueJob = z.infer<typeof AutomationQueueJobSchema>;

export const GovernanceStateSchema = z.object({
  humanOrchestratorAuthority: z.string(),
  globalAutomationSuspended: z.boolean(),
  emergencyKillSwitchReason: z.string().nullable(),
  additionalSpendLimitBrl: z.number(),
  currentAdditionalSpendBrl: z.number(),
  autoPaidApiBlocked: z.boolean(),
  gitSafeReadOnlyMode: z.boolean(),
  devinBridgeEnabled: z.boolean(),
  devinContractVerified: z.boolean(),
  primaryProductRepo: z.string(),
  operationsRepo: z.string(),
  googleDriveConversationsUrl: z.string(),
  auditLogs: z.array(z.object({
    id: z.string(),
    timestamp: z.string(),
    actor: z.string(),
    action: z.string(),
    target: z.string(),
    shaOrRef: z.string(),
  })),
});

export type GovernanceState = z.infer<typeof GovernanceStateSchema>;

export interface B360DatabaseState {
  providers: AIProvider[];
  subscriptions: SubscriptionAccount[];
  agents: OperationalAgent[];
  squads: OperationalSquad[];
  missions: Mission[];
  waves: Wave[];
  messages: InterAIMessage[];
  importedConversations: ImportedConversationReport[];
  audits: AuditRecord[];
  prompts: PromptTemplate[];
  checklists: ChecklistRecord[];
  memories: MemoryEntry[];
  automationJobs: AutomationQueueJob[];
  governance: GovernanceState;
}
