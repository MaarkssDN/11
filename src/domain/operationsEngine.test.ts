import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeContentFingerprint,
  computeNextMissionStep,
  evaluateMissionPreflight,
  parseHistoricalConversationDocument,
  selectCatarinaSpecialistsForModules,
  validateAuditApproval,
} from './operationsEngine';
import { AuditRecord, Mission, OperationalAgent } from '../shared/contracts';

function createBaseMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'MSN-TEST-01',
    code: 'B360-MSN-001',
    title: 'Implementar Contratos de Isolamento e Preflight',
    waveId: 'ONDA-01',
    stepNumber: 8,
    stepCode: '08_PREFLIGHT_OBRIGATORIO',
    status: 'PREFLIGHT_PENDENTE',
    executorProviderId: 'IA-07',
    executorAgentId: 'AG-012',
    auditorAgentId: 'AG-088',
    catarinaSpecialistIds: ['AG-100'],
    priority: 'CRITICA',
    acceptanceCriteria: ['Validar 18 itens de preflight', 'Impedir colisão de worktree'],
    dependencies: [],
    isolation: {
      worktreePath: 'D:/Birthub360/worktrees/msn-001',
      branchName: 'wave/01-isolation-contracts',
      baseSha: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4',
      currentHeadSha: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4',
      ownedModules: ['src/domain/operationsEngine.ts'],
      isolatedNodeModulesPath: 'D:/Birthub360/worktrees/msn-001/node_modules',
      reservedPort: 4101,
      testDbSchema: 'test_msn_001',
      leaseId: 'LEASE-001',
      leaseExpiresAt: '2026-12-01T00:00:00.000Z',
      cpuLimitPercent: 50,
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
    createdAt: '2026-11-25T10:00:00.000Z',
    updatedAt: '2026-11-25T10:00:00.000Z',
    ...overrides,
  };
}

test('Preflight aprova missão com isolamento completo e auditor independente', () => {
  const m1 = createBaseMission();
  const result = evaluateMissionPreflight(m1, [m1]);
  assert.equal(result.passed, true);
  assert.equal(result.failedChecks.length, 0);
  assert.equal(result.isolationConflicts.length, 0);
});

test('Preflight bloqueia autoaprovação (executor igual ao auditor) e colisão de worktree/porta/módulo', () => {
  const m1 = createBaseMission({
    executorAgentId: 'AG-012',
    auditorAgentId: 'AG-012', // Violação constitucional!
  });
  const m2 = createBaseMission({
    id: 'MSN-TEST-02',
    code: 'B360-MSN-002',
    status: 'EM_EXECUCAO',
  });

  const result = evaluateMissionPreflight(m1, [m1, m2]);
  assert.equal(result.passed, false);
  assert.ok(result.failedChecks.some((c) => c.includes('Conflito de interesse constitucional')));
  assert.ok(result.isolationConflicts.some((c) => c.includes('Colisão de Worktree')));
  assert.ok(result.isolationConflicts.some((c) => c.includes('Colisão de Porta Reservada')));
  assert.ok(result.isolationConflicts.some((c) => c.includes('Colisão de Ownership')));
});

test('Auditoria bloqueia aprovação quando SHA diverge ou existe teste não executado', () => {
  const mission = createBaseMission();
  const audit: AuditRecord = {
    id: 'AUD-01',
    missionId: mission.id,
    originalExecutorId: 'AG-012',
    responsibleAuditorId: 'AG-088',
    auditedSha: 'deadbeef1234567890', // Diverge do HEAD da missão
    scope: 'Auditoria de contratos',
    acceptanceCriteriaChecked: ['Critério 1'],
    analyzedFiles: ['src/domain/operationsEngine.ts'],
    executedTests: [
      {
        name: 'Unit Tests',
        command: 'npx tsx --test',
        exitCode: null,
        executed: false,
        result: 'NAO_EXECUTADO',
      },
    ],
    evidences: [],
    findings: [],
    state: 'EM_AUDITORIA',
    finalVerdict: 'Pendente',
    createdAt: '2026-11-25T10:00:00.000Z',
    updatedAt: '2026-11-25T10:00:00.000Z',
  };

  // Autoaprovação
  const selfApproval = validateAuditApproval(mission, audit, 'AG-012');
  assert.equal(selfApproval.allowed, false);
  assert.ok(selfApproval.reason.includes('Nenhum agente ou IA pode aprovar o próprio trabalho'));

  // SHA divergente
  const shaMismatch = validateAuditApproval(mission, audit, 'AG-088');
  assert.equal(shaMismatch.allowed, false);
  assert.ok(shaMismatch.reason.includes('Invalidação por SHA'));

  // SHA correto mas teste não executado
  audit.auditedSha = mission.isolation.currentHeadSha;
  const unexecutedTest = validateAuditApproval(mission, audit, 'AG-088');
  assert.equal(unexecutedTest.allowed, false);
  assert.ok(unexecutedTest.reason.includes('Nunca considerar teste não executado como aprovado'));

  // Teste executado com código 0
  audit.executedTests[0].executed = true;
  audit.executedTests[0].exitCode = 0;
  audit.executedTests[0].result = 'APROVADO';
  const validApproval = validateAuditApproval(mission, audit, 'AG-088');
  assert.equal(validApproval.allowed, true);
});

test('Máquina de estados devolve entrega reprovada para Etapa 16 e invalida aprovação após novo commit', () => {
  const mission = createBaseMission({ stepNumber: 15, stepCode: '15_APROVACAO_OU_REPROVACAO', status: 'EM_AUDITORIA' });
  const rejected = computeNextMissionStep(mission, 'REPROVAR_ENTREGA');
  assert.equal(rejected.stepNumber, 16);
  assert.equal(rejected.status, 'REPROVADA_AUDITORIA');

  const approvedMission = createBaseMission({
    stepNumber: 19,
    stepCode: '19_PR_E_QUALITY_GATES',
    status: 'APROVADA_SHA',
    approvedSha: mission.isolation.currentHeadSha,
  });
  const invalidated = computeNextMissionStep(approvedMission, 'INVALIDAR_POR_NOVO_COMMIT', '9999888877776666');
  assert.equal(invalidated.stepNumber, 12);
  assert.equal(invalidated.approvedSha, null);
  assert.equal(invalidated.isolation.currentHeadSha, '9999888877776666');
});

test('Catarina (Agente 100) mobiliza apenas especialistas do domínio sem conflito de interesse', () => {
  const agents: OperationalAgent[] = [
    {
      id: 'AG-000',
      number: 0,
      name: 'Astra',
      operationalPersona: 'Comando Global',
      specialty: 'Orquestração Estratégica',
      responsibilities: ['Planejamento'],
      squadId: 'SQ-COMANDO',
      coordinatorId: 'ORQUESTRADOR_HUMANO',
      associatedProviderId: 'IA-01',
      ownedModules: ['mod-01'],
      permanentInstructions: 'Preservar constituição',
      operationalState: 'PRONTO_CATALOGO',
      activeMissionIds: [],
      completedMissionsCount: 12,
    },
    {
      id: 'AG-012',
      number: 12,
      name: 'Agente 12 — Arquitetura de Segurança',
      operationalPersona: 'Especialista RBAC',
      specialty: 'Segurança e Isolamento',
      responsibilities: ['Auditar RBAC'],
      squadId: 'SQ-CATARINA',
      coordinatorId: 'AG-100',
      associatedProviderId: 'IA-06',
      ownedModules: ['src/domain/security.ts'],
      permanentInstructions: 'Privilégio mínimo',
      operationalState: 'PRONTO_CATALOGO',
      activeMissionIds: [],
      completedMissionsCount: 5,
    },
    {
      id: 'AG-045',
      number: 45,
      name: 'Agente 45 — Especialista Banco D1',
      operationalPersona: 'Engenheiro de Dados',
      specialty: 'Migrations e Persistência SQL',
      responsibilities: ['Validar schemas D1'],
      squadId: 'SQ-CATARINA',
      coordinatorId: 'AG-100',
      associatedProviderId: 'IA-05',
      ownedModules: ['migrations/0001_initial_schema.sql'],
      permanentInstructions: 'Integridade referencial',
      operationalState: 'PRONTO_CATALOGO',
      activeMissionIds: [],
      completedMissionsCount: 8,
    },
  ];

  // Se AG-012 foi o executor, ele não pode ser selecionado para validar Segurança
  const selectedForSecurity = selectCatarinaSpecialistsForModules(['Segurança'], 'AG-012', agents);
  assert.equal(selectedForSecurity.length, 0);

  // Para migrations, seleciona apenas AG-045 (não mobiliza indiscriminadamente)
  const selectedForSql = selectCatarinaSpecialistsForModules(['migrations'], 'AG-012', agents);
  assert.equal(selectedForSql.length, 1);
  assert.equal(selectedForSql[0].id, 'AG-045');
});

test('Importador de conversas é idempotente e extrai participantes, decisões, pendências e bloqueadores', () => {
  const sampleMd = `
2026-11-24 [14:30] Reunião Marcelo, Gemini, Claude e Devin sobre Onda 13
Decisão: O Devin operará exclusivamente na máquina local Windows com conexão de saída autenticada.
Concluído: [x] Estrutura de 40 módulos e contratos Zod criada.
Pendente: [ ] Verificar contrato e API local do Devin no Windows.
Bloqueador: Porta local ainda aguardando homologação da Catarina.
Branch: feat/onda-13-devin-bridge commit a1b2c3d4e5f
Evidência: Teste unitário exit code 0 executado.
  `;

  const report1 = parseHistoricalConversationDocument('2026-11-24-alinhamento-onda13.md', sampleMd);
  const report2 = parseHistoricalConversationDocument('2026-11-24-alinhamento-onda13.md', sampleMd);

  assert.equal(report1.contentFingerprint, report2.contentFingerprint);
  assert.equal(report1.id, report2.id);
  assert.ok(report1.participantsIdentified.includes('Marcelo'));
  assert.ok(report1.participantsIdentified.includes('Devin'));
  assert.equal(report1.decisionsExtracted.length, 1);
  assert.equal(report1.completedWork.length, 1);
  assert.equal(report1.contentFingerprint, computeContentFingerprint(sampleMd));
});

test('Validação Zod de CreateMissionInputSchema e modelos de entidades de src/db/schema.ts', async () => {
  const { CreateMissionInputSchema } = await import('../shared/contracts');
  const { UserSchema, CostPolicySchema, OperationalSquadSchema } = await import('../db/schema');

  const validInput = CreateMissionInputSchema.safeParse({
    code: 'B360-MSN-005',
    title: 'Implementar MSW Browser Handler e Validação Zod de Missões',
    waveId: 'ONDA-12',
    squadId: 'SQ-DEV-NUVEM',
    executorProviderId: 'IA-07',
    executorAgentId: 'AG-012',
    auditorAgentId: 'AG-088',
    priority: 'ALTA',
    branchName: 'wave/12-msw-zod-validation',
    worktreePath: 'D:/Birthub360-Operations/worktrees/msn-005',
    baseSha: '8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
    reservedPort: 3105,
    ownedModules: ['src/mocks/browser.ts', 'src/db/schema.ts'],
    acceptanceCriteria: ['Validar contratos Zod', 'Persistir estado funcional'],
    preflightConfig: {
      repoStateClean: true,
      exclusiveWorktreeAssigned: true,
      isolatedMutableDependencies: true,
      noUnsafeSymlinksOrJunctions: true,
      executionLeaseAcquired: true,
      independentAuditorAssigned: true,
    },
  });
  assert.equal(validInput.success, true);

  const invalidCodeInput = CreateMissionInputSchema.safeParse({
    code: 'INVALID-CODE',
    title: 'Curto',
    waveId: 'ONDA-12',
    executorProviderId: 'IA-07',
    executorAgentId: 'AG-012',
    auditorAgentId: 'AG-088',
    priority: 'ALTA',
    branchName: 'b',
    worktreePath: 'w',
    baseSha: '123',
    reservedPort: 80,
    ownedModules: [],
    acceptanceCriteria: [],
  });
  assert.equal(invalidCodeInput.success, false);

  const validUser = UserSchema.safeParse({
    id: 'USR-001',
    email: 'marcelo@birthub360.local',
    displayName: 'Marcelo — Orquestrador Humano',
    isHumanOrchestrator: true,
    createdAt: '2026-11-25T08:00:00.000Z',
  });
  assert.equal(validUser.success, true);

  const validSquad = OperationalSquadSchema.safeParse({
    id: 'SQ-COMANDO',
    name: 'Squad de Comando Global',
    environment: 'HIBRIDO',
    coordinatorAgentId: 'AG-000',
    coordinatorProviderId: 'IA-01',
    missionScope: 'Orquestração estratégica global',
    memberAgentIds: ['AG-000', 'AG-001'],
    guardrails: ['Autoridade máxima: Orquestrador Humano'],
  });
  assert.equal(validSquad.success, true);

  const validCostPolicy = CostPolicySchema.safeParse({
    id: 'COST-POLICY-001',
    maxAdditionalSpendBrl: 0,
    blockAutoPaidApi: true,
    blockAccountRotationAbuse: true,
    updatedAt: '2026-11-25T08:00:00.000Z',
  });
  assert.equal(validCostPolicy.success, true);
});

