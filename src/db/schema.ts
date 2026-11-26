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
// Contratos de validação Zod + Interfaces TypeScript geradas
// ============================================================================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().min(2),
  isHumanOrchestrator: z.boolean(),
  createdAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const RoleSchema = z.object({
  id: z.string(),
  code: z.enum([
    'ORQUESTRADOR_HUMANO',
    'COMANDO_GLOBAL_ASTRA',
    'COORDENADOR_LOCAL_DEVIN',
    'LIDER_ESPECIALISTAS_CATARINA',
    'AUDITOR_INDEPENDENTE',
    'AGENTE_EXECUTOR_NUVEM',
    'INTEGRADOR_GIT',
  ]),
  name: z.string(),
  description: z.string(),
});
export type Role = z.infer<typeof RoleSchema>;

export const PermissionSchema = z.object({
  id: z.string(),
  roleId: z.string(),
  resource: z.string(),
  action: z.enum(['READ', 'WRITE', 'EXECUTE_PREFLIGHT', 'APPROVE_SHA', 'EMERGENCY_KILL_SWITCH']),
});
export type Permission = z.infer<typeof PermissionSchema>;

export const AgentMembershipSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  squadId: z.string(),
  roleInSquad: z.string(),
  assignedAt: z.string(),
});
export type AgentMembership = z.infer<typeof AgentMembershipSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  channelType: z.enum(['INDIVIDUAL', 'GRUPO', 'SQUAD', 'MISSAO', 'ONDA']),
  missionId: z.string().nullable(),
  waveId: z.string().nullable(),
  createdAt: z.string(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const ConversationParticipantSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  participantType: z.enum(['ORQUESTRADOR_HUMANO', 'PROVEDOR_IA', 'AGENTE_OPERACIONAL']),
  participantId: z.string(),
});
export type ConversationParticipant = z.infer<typeof ConversationParticipantSchema>;

export const AttachmentSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  contentFingerprint: z.string(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  repoUrl: z.string(),
  isReadOnlyProtected: z.boolean(),
  createdAt: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  assignedAgentId: z.string(),
  title: z.string(),
  status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'BLOQUEADA']),
  createdAt: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

export const PromptVersionSchema = z.object({
  id: z.string(),
  promptId: z.string(),
  versionNumber: z.number().int().positive(),
  objective: z.string(),
  scopeModules: z.array(z.string()),
  constitutionalConstraints: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  promptBody: z.string(),
  createdAt: z.string(),
});
export type PromptVersion = z.infer<typeof PromptVersionSchema>;

export const ChecklistItemSchema = z.object({
  id: z.string(),
  checklistId: z.string(),
  label: z.string(),
  checked: z.boolean(),
  verifiedBy: z.string().nullable(),
  evidenceNote: z.string().nullable(),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const MissionDependencySchema = z.object({
  id: z.string(),
  missionId: z.string(),
  dependsOnMissionId: z.string(),
  dependencyType: z.enum(['BLOQUEANTE_HARD', 'ORDEM_ONDA', 'OWNERSHIP_MODULO']),
});
export type MissionDependency = z.infer<typeof MissionDependencySchema>;

export const ExecutionSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  providerId: z.string(),
  agentId: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  outputSha: z.string().nullable(),
  exitCode: z.number().int().nullable(),
  status: z.enum(['EM_EXECUCAO', 'SUCESSO', 'FALHA', 'CANCELADA']),
});
export type Execution = z.infer<typeof ExecutionSchema>;

export const EnvironmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.enum(['NUVEM', 'LOCAL_WINDOWS', 'GITHUB']),
  reservedPort: z.number().int().nullable(),
  testDbSchema: z.string().nullable(),
  status: z.enum(['OPERACIONAL', 'MODO_SEGURO_LEITURA', 'DESABILITADO_VERIFICACAO']),
});
export type Environment = z.infer<typeof EnvironmentSchema>;

export const WorktreeSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  worktreePath: z.string(),
  isolatedNodeModulesPath: z.string(),
  hasUnsafeSymlinks: z.literal(false),
  createdAt: z.string(),
});
export type Worktree = z.infer<typeof WorktreeSchema>;

export const BranchSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  branchName: z.string(),
  baseSha: z.string(),
  currentHeadSha: z.string(),
  isProtected: z.boolean(),
});
export type Branch = z.infer<typeof BranchSchema>;

export const ResourceLeaseSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  resourceKey: z.string(),
  leaseOwner: z.string(),
  expiresAt: z.string(),
});
export type ResourceLease = z.infer<typeof ResourceLeaseSchema>;

export const EvidenceSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  auditId: z.string().nullable(),
  commandExecuted: z.string(),
  exitCode: z.number().int().nullable(),
  artifactRef: z.string(),
  recordedAt: z.string(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const QualityGateSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  gateType: z.enum(['TYPECHECK', 'LINT', 'BUILD', 'UNIT_TEST', 'INTEGRATION_TEST', 'E2E', 'ACCESSIBILITY', 'SECURITY']),
  executed: z.boolean(),
  exitCode: z.number().int().nullable(),
  status: z.enum(['APROVADO', 'REPROVADO', 'NAO_EXECUTADO']),
  evaluatedSha: z.string(),
});
export type QualityGate = z.infer<typeof QualityGateSchema>;

export const PullRequestSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  branchId: z.string(),
  targetRepo: z.string(),
  approvedSha: z.string(),
  status: z.enum(['RASCUNHO_READONLY', 'AGUARDANDO_AUTORIZACAO_HUMANA', 'INTEGRADO', 'BLOQUEADO']),
  humanAuthorized: z.boolean(),
});
export type PullRequest = z.infer<typeof PullRequestSchema>;

export const ApprovalSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  approverId: z.string(),
  approverRole: z.string(),
  approvedSha: z.string(),
  decision: z.enum(['APROVADO', 'REPROVADO', 'APROVADO_COM_RESSALVAS']),
  createdAt: z.string(),
});
export type Approval = z.infer<typeof ApprovalSchema>;

export const HandoffSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  fromEntityId: z.string(),
  toEntityId: z.string(),
  payloadSha: z.string(),
  notes: z.string(),
  createdAt: z.string(),
});
export type Handoff = z.infer<typeof HandoffSchema>;

export const KnowledgeDocumentSchema = z.object({
  id: z.string(),
  path: z.string(),
  title: z.string(),
  contentHash: z.string(),
  updatedAt: z.string(),
});
export type KnowledgeDocument = z.infer<typeof KnowledgeDocumentSchema>;

export const AutomationSchema = z.object({
  id: z.string(),
  title: z.string(),
  triggerType: z.enum(['EVENTO', 'AGENDAMENTO_CRON', 'HANDOFF_IA', 'FILA_LOCAL_DEVIN']),
  coordinatorProviderId: z.string(),
  targetEnvironment: z.enum(['NUVEM', 'LOCAL_WINDOWS', 'GITHUB']),
  isEnabled: z.boolean(),
});
export type Automation = z.infer<typeof AutomationSchema>;

export const AutomationRunSchema = AutomationQueueJobSchema;
export type AutomationRun = z.infer<typeof AutomationRunSchema>;

export const NotificationSchema = z.object({
  id: z.string(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  title: z.string(),
  body: z.string(),
  acknowledged: z.boolean(),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const RunnerSchema = z.object({
  id: z.string(),
  hostname: z.string(),
  osPlatform: z.string(),
  connectionMode: z.literal('OUTBOUND_AUTHENTICATED_ONLY'),
  isEnabled: z.boolean(),
});
export type Runner = z.infer<typeof RunnerSchema>;

export const RunnerHeartbeatSchema = z.object({
  id: z.string(),
  runnerId: z.string(),
  driveCFreeGb: z.number().nullable(),
  driveDFreeGb: z.number().nullable(),
  activeWorktreesCount: z.number().int().nonnegative(),
  reportedAt: z.string(),
});
export type RunnerHeartbeat = z.infer<typeof RunnerHeartbeatSchema>;

export const UsageRecordSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  accountId: z.string(),
  missionId: z.string().nullable(),
  additionalCostBrl: z.literal(0),
  recordedAt: z.string(),
});
export type UsageRecord = z.infer<typeof UsageRecordSchema>;

export const CostPolicySchema = z.object({
  id: z.string(),
  maxAdditionalSpendBrl: z.literal(0),
  blockAutoPaidApi: z.literal(true),
  blockAccountRotationAbuse: z.literal(true),
  updatedAt: z.string(),
});
export type CostPolicy = z.infer<typeof CostPolicySchema>;

export const GovernancePolicySchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  ruleBody: z.string(),
  enforcedTechnically: z.boolean(),
});
export type GovernancePolicy = z.infer<typeof GovernancePolicySchema>;

export const AuditLogSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  actor: z.string(),
  action: z.string(),
  target: z.string(),
  shaOrRef: z.string(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

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
  SubscriptionAccountSchema as ProviderAccountSchema,
  WaveSchema,
};
