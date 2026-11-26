import { z } from 'zod';
import {
  AIProviderSchema,
  AdapterCapabilitiesSchema,
  AuditFindingSchema,
  AuditRecordSchema,
  AutomationQueueJobSchema,
  ChecklistRecordSchema,
  GovernanceStateSchema,
  ImportedConversationReportSchema,
  InterAIMessageSchema,
  MemoryEntrySchema,
  MissionIsolationConfigSchema,
  MissionSchema,
  OperationalAgentSchema,
  OperationalSquadSchema,
  PreflightCheckSchema,
  PromptTemplateSchema,
  SubscriptionAccountSchema,
  WaveSchema,
} from '../shared/contracts';

// ============================================================================
// ESQUEMA COMPLETO DE ENTIDADES RELACIONAIS (45 ENTIDADES — SEÇÃO 25)
// Contratos de validação Zod + Interfaces TypeScript + Relações e Restrições
// ============================================================================

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(2),
  roleId: z.string().default('ORQUESTRADOR_HUMANO'),
  isHumanOrchestrator: z.boolean(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const RoleSchema = z.object({
  id: z.string().min(1),
  code: z.enum([
    'ORQUESTRADOR_HUMANO',
    'COMANDO_GLOBAL_ASTRA',
    'COORDENADOR_LOCAL_DEVIN',
    'LIDER_ESPECIALISTAS_CATARINA',
    'AUDITOR_INDEPENDENTE',
    'AGENTE_EXECUTOR_NUVEM',
    'INTEGRADOR_GIT',
  ]),
  name: z.string().min(2),
  description: z.string(),
});
export type Role = z.infer<typeof RoleSchema>;

export const PermissionSchema = z.object({
  id: z.string().min(1),
  roleId: z.string().min(1),
  resource: z.string().min(1),
  action: z.enum(['READ', 'WRITE', 'EXECUTE_PREFLIGHT', 'APPROVE_SHA', 'EMERGENCY_KILL_SWITCH']),
});
export type Permission = z.infer<typeof PermissionSchema>;

// Aliases explícitos solicitados pelo modelo de dados (Provider, ProviderAccount, Agent, Squad)
export const ProviderSchema = AIProviderSchema;
export type Provider = z.infer<typeof ProviderSchema>;
export type AIProvider = z.infer<typeof AIProviderSchema>;

export const ProviderAccountSchema = SubscriptionAccountSchema;
export type ProviderAccount = z.infer<typeof ProviderAccountSchema>;

export const AgentSchema = OperationalAgentSchema;
export type Agent = z.infer<typeof AgentSchema>;
export type OperationalAgent = z.infer<typeof OperationalAgentSchema>;

export const SquadSchema = OperationalSquadSchema;
export type Squad = z.infer<typeof SquadSchema>;
export type OperationalSquad = z.infer<typeof OperationalSquadSchema>;

export const AgentMembershipSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  squadId: z.string().min(1),
  roleInSquad: z.string().min(1),
  assignedAt: z.string(),
});
export type AgentMembership = z.infer<typeof AgentMembershipSchema>;

export const ConversationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  channelType: z.enum(['INDIVIDUAL', 'GRUPO', 'SQUAD', 'MISSAO', 'ONDA']),
  missionId: z.string().nullable(),
  waveId: z.string().nullable(),
  createdAt: z.string(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const ConversationParticipantSchema = z.object({
  id: z.string().min(1),
  conversationId: z.string().min(1),
  participantType: z.enum(['ORQUESTRADOR_HUMANO', 'PROVEDOR_IA', 'AGENTE_OPERACIONAL']),
  participantId: z.string().min(1),
});
export type ConversationParticipant = z.infer<typeof ConversationParticipantSchema>;

export const MessageSchema = InterAIMessageSchema;
export type Message = z.infer<typeof MessageSchema>;
export type InterAIMessage = z.infer<typeof InterAIMessageSchema>;

export const AttachmentSchema = z.object({
  id: z.string().min(1),
  messageId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  contentFingerprint: z.string().min(1),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const ProjectSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(2),
  name: z.string().min(2),
  repoUrl: z.string().min(1),
  isPrimaryProductProtected: z.boolean(),
  readOnlyMode: z.boolean(),
  createdAt: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;

export type Mission = z.infer<typeof MissionSchema>;
export type Wave = z.infer<typeof WaveSchema>;

export const TaskSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  assignedAgentId: z.string().min(1),
  title: z.string().min(3),
  status: z.enum(['PENDENTE', 'EM_EXECUCAO', 'CONCLUIDA', 'BLOQUEADA']),
  modulePath: z.string().min(1),
  createdAt: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

export const PromptSchema = PromptTemplateSchema;
export type Prompt = z.infer<typeof PromptSchema>;
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

export const PromptVersionSchema = z.object({
  id: z.string().min(1),
  promptId: z.string().min(1),
  versionNumber: z.number().int().positive(),
  promptBody: z.string().min(10),
  createdByAgentId: z.string().min(1),
  createdAt: z.string(),
});
export type PromptVersion = z.infer<typeof PromptVersionSchema>;

export const ChecklistSchema = ChecklistRecordSchema;
export type Checklist = z.infer<typeof ChecklistSchema>;
export type ChecklistRecord = z.infer<typeof ChecklistRecordSchema>;

export const ChecklistItemSchema = z.object({
  id: z.string().min(1),
  checklistId: z.string().min(1),
  label: z.string().min(3),
  checked: z.boolean(),
  verifiedBy: z.string().nullable(),
  evidenceNote: z.string(),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const MissionDependencySchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  dependsOnMissionId: z.string().min(1),
  dependencyType: z.enum(['BLOQUEANTE', 'ORDEM_ONDA', 'OWNERSHIP_MODULO']),
});
export type MissionDependency = z.infer<typeof MissionDependencySchema>;

export const ExecutionSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  providerId: z.string().min(1),
  agentId: z.string().min(1),
  environmentId: z.string().min(1),
  baseSha: z.string().min(7),
  producedSha: z.string().nullable(),
  status: z.enum(['INICIADA', 'CONCLUIDA', 'FALHOU', 'CANCELADA']),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
});
export type Execution = z.infer<typeof ExecutionSchema>;

export const EnvironmentSchema = z.object({
  id: z.string().min(1),
  code: z.enum(['AMBIENTE_1_NUVEM', 'AMBIENTE_2_LOCAL_WINDOWS', 'AMBIENTE_3_GITHUB']),
  name: z.string().min(2),
  hostDetails: z.string(),
  status: z.enum(['OPERACIONAL', 'MODO_SEGURO_LEITURA', 'PONTE_DESABILITADA']),
});
export type Environment = z.infer<typeof EnvironmentSchema>;

export const WorktreeSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  path: z.string().min(3),
  driveLetter: z.enum(['C:', 'D:', 'CLOUD_VOLUME']),
  isolatedNodeModulesPath: z.string().min(3),
  hasUnsafeSymlinkOrJunction: z.literal(false),
  status: z.enum(['ATIVA', 'ARQUIVADA', 'BLOQUEADA']),
});
export type Worktree = z.infer<typeof WorktreeSchema>;

export const BranchSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  branchName: z.string().min(3),
  baseSha: z.string().min(7),
  headSha: z.string().min(7),
  isProtected: z.boolean(),
});
export type Branch = z.infer<typeof BranchSchema>;

export const ResourceLeaseSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  holderAgentId: z.string().min(1),
  reservedPort: z.number().int().min(1024).max(65535),
  testDbSchema: z.string().min(1),
  ownedModulesJson: z.string().min(2),
  acquiredAt: z.string(),
  expiresAt: z.string(),
});
export type ResourceLease = z.infer<typeof ResourceLeaseSchema>;

export const AuditSchema = AuditRecordSchema;
export type Audit = z.infer<typeof AuditSchema>;
export type AuditRecord = z.infer<typeof AuditRecordSchema>;
export type AuditFinding = z.infer<typeof AuditFindingSchema>;

export const EvidenceSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  auditId: z.string().nullable(),
  title: z.string().min(3),
  commandExecuted: z.string().nullable(),
  exitCode: z.number().int().nullable(),
  artifactHash: z.string().min(4),
  createdAt: z.string(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const QualityGateSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  gateType: z.enum([
    'TYPESCRIPT_STRICT',
    'LINT',
    'BUILD',
    'UNIT_TESTS',
    'INTEGRATION_TESTS',
    'E2E_PLAYWRIGHT',
    'WCAG_AA',
    'SECURITY_SCAN',
  ]),
  executed: z.boolean(),
  exitCode: z.number().int().nullable(),
  verdict: z.enum(['APROVADO', 'REPROVADO', 'NAO_EXECUTADO']),
  checkedSha: z.string().min(7),
});
export type QualityGate = z.infer<typeof QualityGateSchema>;

export const PullRequestSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  repoName: z.string().min(2),
  sourceBranch: z.string().min(2),
  targetBranch: z.string().min(2),
  approvedSha: z.string().min(7),
  status: z.enum(['PLANO_SOMENTE_LEITURA', 'AGUARDANDO_APROVACAO_HUMANA', 'INTEGRADO', 'BLOQUEADO']),
});
export type PullRequest = z.infer<typeof PullRequestSchema>;

export const ApprovalSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  approverType: z.enum(['ORQUESTRADOR_HUMANO', 'AUDITOR_INDEPENDENTE', 'CATARINA_100']),
  approverId: z.string().min(1),
  approvedSha: z.string().min(7),
  decision: z.enum(['APROVADO', 'REPROVADO', 'INVALIDADO_POR_NOVO_COMMIT']),
  createdAt: z.string(),
});
export type Approval = z.infer<typeof ApprovalSchema>;

export const HandoffSchema = z.object({
  id: z.string().min(1),
  missionId: z.string().min(1),
  fromActorId: z.string().min(1),
  toActorId: z.string().min(1),
  stepFrom: z.number().int().min(1).max(23),
  stepTo: z.number().int().min(1).max(23),
  payloadSha: z.string().min(7),
  notes: z.string(),
  createdAt: z.string(),
});
export type Handoff = z.infer<typeof HandoffSchema>;

export const MemorySchema = MemoryEntrySchema;
export type Memory = z.infer<typeof MemorySchema>;
export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

export const KnowledgeDocumentSchema = z.object({
  id: z.string().min(1),
  fileName: z.string().min(3),
  title: z.string().min(3),
  category: z.enum([
    'README',
    'AGENTS',
    'ARCHITECTURE',
    'GOVERNANCE',
    'SECURITY',
    'ROADMAP',
    'INTEGRATIONS',
    'LOCAL_RUNNER',
    'CHANGELOG',
  ]),
  lastUpdatedAt: z.string(),
});
export type KnowledgeDocument = z.infer<typeof KnowledgeDocumentSchema>;

export const AutomationSchema = AutomationQueueJobSchema;
export type Automation = z.infer<typeof AutomationSchema>;

export const AutomationRunSchema = z.object({
  id: z.string().min(1),
  automationId: z.string().min(1),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  status: z.enum(['SUCESSO', 'FALHA', 'PAUSADO_KILL_SWITCH']),
  logOutput: z.string(),
});
export type AutomationRun = z.infer<typeof AutomationRunSchema>;

export const NotificationSchema = z.object({
  id: z.string().min(1),
  severity: z.enum(['INFO', 'ALERTA', 'CRITICO']),
  title: z.string().min(3),
  message: z.string().min(3),
  relatedMissionId: z.string().nullable(),
  acknowledged: z.boolean(),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const RunnerSchema = z.object({
  id: z.string().min(1),
  hostName: z.string().min(2),
  osName: z.string().min(2),
  coordinatorProviderId: z.literal('IA-10'),
  outboundAuthOnly: z.literal(true),
  directTerminalExposed: z.literal(false),
  bridgeEnabled: z.boolean(),
});
export type Runner = z.infer<typeof RunnerSchema>;

export const RunnerHeartbeatSchema = z.object({
  id: z.string().min(1),
  runnerId: z.string().min(1),
  cpuUsagePercent: z.number().nullable(),
  ramUsageMb: z.number().nullable(),
  driveCFreeGb: z.number().nullable(),
  driveDFreeGb: z.number().nullable(),
  activeWorktreesCount: z.number().int().nonnegative(),
  reportedAt: z.string(),
});
export type RunnerHeartbeat = z.infer<typeof RunnerHeartbeatSchema>;

export const UsageRecordSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  accountId: z.string().min(1),
  missionId: z.string().nullable(),
  additionalCostBrl: z.literal(0),
  recordedAt: z.string(),
});
export type UsageRecord = z.infer<typeof UsageRecordSchema>;

export const CostPolicySchema = z.object({
  id: z.string().min(1),
  maxAdditionalSpendBrl: z.literal(0),
  blockAutoPaidApi: z.literal(true),
  blockAccountRotationAbuse: z.literal(true),
  updatedAt: z.string(),
});
export type CostPolicy = z.infer<typeof CostPolicySchema>;

export const GovernancePolicySchema = z.object({
  id: z.string().min(1),
  code: z.string().min(2),
  title: z.string().min(3),
  ruleBody: z.string().min(5),
  enforcedTechnically: z.boolean(),
});
export type GovernancePolicy = z.infer<typeof GovernancePolicySchema>;

export const AuditLogSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string(),
  actor: z.string().min(1),
  action: z.string().min(1),
  target: z.string().min(1),
  shaOrRef: z.string().min(1),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

// ============================================================================
// DEFINIÇÃO DE RELACIONAMENTOS E RESTRIÇÕES DE INTEGRIDADE (SEÇÃO 25)
// ============================================================================

export const DATABASE_RELATIONS = {
  users: { references: ['roles.id'] },
  permissions: { references: ['roles.id'] },
  providerAccounts: { references: ['providers.id'] },
  agents: { references: ['squads.id', 'providers.id'] },
  agentMemberships: { references: ['agents.id', 'squads.id'] },
  conversations: { references: ['missions.id', 'waves.id'] },
  conversationParticipants: { references: ['conversations.id'] },
  messages: { references: ['conversations.id', 'missions.id', 'waves.id'] },
  attachments: { references: ['messages.id'] },
  missions: {
    references: ['waves.id', 'squads.id', 'providers.id', 'agents.id'],
    invariants: [
      'executorAgentId !== auditorAgentId (Proibição constitucional de autoaprovação)',
      'isolation.worktreePath UNIQUE entre missões ativas',
      'isolation.branchName UNIQUE entre missões ativas',
      'isolation.reservedPort UNIQUE entre missões ativas',
    ],
  },
  tasks: { references: ['missions.id', 'agents.id'] },
  prompts: { references: ['waves.id', 'providers.id', 'squads.id'] },
  promptVersions: { references: ['prompts.id', 'agents.id'] },
  checklists: { references: ['waves.id', 'missions.id'] },
  checklistItems: { references: ['checklists.id'] },
  missionDependencies: { references: ['missions.id'] },
  executions: { references: ['missions.id', 'providers.id', 'agents.id', 'environments.id'] },
  worktrees: { references: ['missions.id'] },
  branches: { references: ['missions.id'] },
  resourceLeases: { references: ['missions.id', 'agents.id'] },
  audits: {
    references: ['missions.id', 'agents.id'],
    invariants: [
      'originalExecutorId !== responsibleAuditorId',
      'auditedSha === mission.isolation.currentHeadSha para aprovação válida',
    ],
  },
  evidences: { references: ['missions.id', 'audits.id'] },
  qualityGates: { references: ['missions.id'] },
  pullRequests: { references: ['missions.id'] },
  approvals: { references: ['missions.id'] },
  handoffs: { references: ['missions.id'] },
  automationRuns: { references: ['automations.id'] },
  runnerHeartbeats: { references: ['runners.id'] },
  usageRecords: { references: ['providers.id', 'providerAccounts.id', 'missions.id'] },
} as const;

export {
  AIProviderSchema,
  AdapterCapabilitiesSchema,
  AuditFindingSchema,
  AuditRecordSchema,
  AutomationQueueJobSchema,
  ChecklistRecordSchema,
  GovernanceStateSchema,
  ImportedConversationReportSchema,
  InterAIMessageSchema,
  MemoryEntrySchema,
  MissionIsolationConfigSchema,
  MissionSchema,
  OperationalAgentSchema,
  OperationalSquadSchema,
  PreflightCheckSchema,
  PromptTemplateSchema,
  SubscriptionAccountSchema,
  WaveSchema,
};
