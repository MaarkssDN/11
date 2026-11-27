import {
  AuditRecord,
  ImportedConversationReport,
  MISSION_LIFECYCLE_STEPS,
  Mission,
  OperationalAgent,
  PreflightCheck,
} from '../shared/contracts';

// ============================================================================
// 1. VALIDAÇÃO DE PREFLIGHT OBRIGATÓRIO E ISOLAMENTO CONSTITUCIONAL
// ============================================================================

export interface PreflightEvaluationResult {
  passed: boolean;
  failedChecks: string[];
  isolationConflicts: string[];
}

export function evaluateMissionPreflight(
  mission: Mission,
  allActiveMissions: Mission[]
): PreflightEvaluationResult {
  const failedChecks: string[] = [];
  const isolationConflicts: string[] = [];

  const p: PreflightCheck = mission.preflight;

  if (!p.executorIdentityVerified) failedChecks.push('Identidade do executor não verificada.');
  if (!p.permissionsVerified) failedChecks.push('Permissões RBAC não verificadas.');
  if (!p.governanceInstructionsLoaded) failedChecks.push('Instruções constitucionais de governança não carregadas.');
  if (!p.resourceAvailabilityConfirmed) failedChecks.push('Disponibilidade de recursos não confirmada.');
  if (!p.repoStateClean) failedChecks.push('Estado do repositório não está limpo.');
  if (!p.exclusiveBranchAssigned) failedChecks.push('Branch exclusiva não atribuída.');
  if (!p.exclusiveWorktreeAssigned) failedChecks.push('Worktree exclusiva não atribuída.');
  if (!p.baseShaRecorded) failedChecks.push('SHA base não registrado.');
  if (!p.noUncommittedChanges) failedChecks.push('Existem alterações não commitadas na worktree.');
  if (!p.moduleOwnershipVerified) failedChecks.push('Ownership dos módulos não verificado.');
  if (!p.isolatedMutableDependencies) failedChecks.push('Dependências mutáveis (node_modules) não estão isoladas.');
  if (!p.noUnsafeSymlinksOrJunctions) failedChecks.push('Detectado symlink ou junction inseguro compartilhando dependências mutáveis.');
  if (!p.reservedPortAssigned) failedChecks.push('Porta exclusiva não reservada.');
  if (!p.isolatedTestDbSchemaAssigned) failedChecks.push('Schema/banco de testes isolado não atribuído.');
  if (!p.executionLeaseAcquired) failedChecks.push('Lease de execução não adquirido.');
  if (!p.acceptanceCriteriaDefined || mission.acceptanceCriteria.length === 0) {
    failedChecks.push('Critérios de aceite obrigatórios ausentes.');
  }
  if (!p.checklistAttached) failedChecks.push('Checklist técnico não anexado.');
  if (!p.independentAuditorAssigned) failedChecks.push('Auditor independente não designado.');

  // Regra Constitucional: Nenhum agente pode auditar/aprovar o próprio trabalho
  if (mission.executorAgentId === mission.auditorAgentId) {
    failedChecks.push(
      `Conflito de interesse constitucional: O agente executor (${mission.executorAgentId}) não pode ser o auditor da própria missão.`
    );
  }

  // Regra Constitucional: Isolamento contra missões concorrentes
  const concurrentMissions = allActiveMissions.filter(
    (other) =>
      other.id !== mission.id &&
      other.status !== 'CONCLUIDA' &&
      other.status !== 'PLANEJADA'
  );

  for (const other of concurrentMissions) {
    if (other.isolation.worktreePath === mission.isolation.worktreePath) {
      isolationConflicts.push(
        `Colisão de Worktree com a missão ${other.code} (${other.isolation.worktreePath}).`
      );
    }
    if (other.isolation.branchName === mission.isolation.branchName) {
      isolationConflicts.push(
        `Colisão de Branch com a missão ${other.code} (${other.isolation.branchName}).`
      );
    }
    if (other.isolation.reservedPort === mission.isolation.reservedPort) {
      isolationConflicts.push(
        `Colisão de Porta Reservada (${mission.isolation.reservedPort}) com a missão ${other.code}.`
      );
    }
    const overlappingModules = mission.isolation.ownedModules.filter((mod) =>
      other.isolation.ownedModules.includes(mod)
    );
    if (overlappingModules.length > 0) {
      isolationConflicts.push(
        `Colisão de Ownership nos módulos [${overlappingModules.join(', ')}] com a missão ${other.code}.`
      );
    }
  }

  return {
    passed: failedChecks.length === 0 && isolationConflicts.length === 0,
    failedChecks,
    isolationConflicts,
  };
}

// ============================================================================
// 2. GOVERNANÇA DE AUDITORIA VINCULADA A SHA E PROIBIÇÃO DE AUTOAPROVAÇÃO
// ============================================================================

export interface AuditValidationOutcome {
  allowed: boolean;
  reason: string;
}

export function validateAuditApproval(
  mission: Mission,
  audit: AuditRecord,
  approvingAuditorId: string
): AuditValidationOutcome {
  if (approvingAuditorId === mission.executorAgentId || approvingAuditorId === audit.originalExecutorId) {
    return {
      allowed: false,
      reason: 'Violação Constitucional (Seção 9): Nenhum agente ou IA pode aprovar o próprio trabalho.',
    };
  }

  if (audit.auditedSha !== mission.isolation.currentHeadSha) {
    return {
      allowed: false,
      reason: `Invalidação por SHA (Seção 12): O SHA auditado (${audit.auditedSha}) difere do HEAD atual da missão (${mission.isolation.currentHeadSha}). Alterações posteriores invalidam aprovações anteriores.`,
    };
  }

  const unexecutedRequiredTests = audit.executedTests.filter((t) => !t.executed || t.result === 'NAO_EXECUTADO');
  if (unexecutedRequiredTests.length > 0) {
    return {
      allowed: false,
      reason: `Violação de Qualidade Técnica (Seção 18): ${unexecutedRequiredTests.length} teste(s) obrigatório(s) não foram executados. Nunca considerar teste não executado como aprovado.`,
    };
  }

  const failedTests = audit.executedTests.filter((t) => t.result === 'REPROVADO' || (t.exitCode !== null && t.exitCode !== 0));
  if (failedTests.length > 0) {
    return {
      allowed: false,
      reason: `Existem ${failedTests.length} teste(s) reprovado(s) com código de saída diferente de zero.`,
    };
  }

  return {
    allowed: true,
    reason: `Auditoria validada para o SHA ${audit.auditedSha} pelo auditor independente ${approvingAuditorId}.`,
  };
}

// ============================================================================
// 3. TRANSIÇÃO DA MÁQUINA DE ESTADOS DE 23 ETAPAS
// ============================================================================

export function computeNextMissionStep(
  mission: Mission,
  action: 'AVANCAR_ETAPA' | 'REPROVAR_ENTREGA' | 'INVALIDAR_POR_NOVO_COMMIT',
  newCommitSha?: string
): Mission {
  const now = new Date().toISOString();

  if (action === 'INVALIDAR_POR_NOVO_COMMIT' && newCommitSha) {
    const step12 = MISSION_LIFECYCLE_STEPS.find((s) => s.step === 12)!;
    return {
      ...mission,
      stepNumber: 12,
      stepCode: step12.code,
      status: 'EM_AUDITORIA',
      approvedSha: null,
      rejectionReason: `Aprovação anterior invalidada automaticamente: novo commit detectado (${newCommitSha}).`,
      isolation: {
        ...mission.isolation,
        currentHeadSha: newCommitSha,
      },
      updatedAt: now,
    };
  }

  if (action === 'REPROVAR_ENTREGA') {
    const step16 = MISSION_LIFECYCLE_STEPS.find((s) => s.step === 16)!;
    return {
      ...mission,
      stepNumber: 16,
      stepCode: step16.code,
      status: 'REPROVADA_AUDITORIA',
      approvedSha: null,
      rejectionReason: 'Entrega reprovada na auditoria local/especializada. Devolvida automaticamente para correção (Etapa 16).',
      updatedAt: now,
    };
  }

  const nextStepNum = Math.min(23, mission.stepNumber + 1);
  const nextStepObj = MISSION_LIFECYCLE_STEPS.find((s) => s.step === nextStepNum)!;

  let nextStatus = mission.status;
  if (nextStepNum === 8) nextStatus = 'PREFLIGHT_PENDENTE';
  else if (nextStepNum >= 9 && nextStepNum <= 11) nextStatus = 'EM_EXECUCAO';
  else if (nextStepNum >= 12 && nextStepNum <= 15) nextStatus = 'EM_AUDITORIA';
  else if (nextStepNum >= 18 && nextStepNum <= 21) nextStatus = 'APROVADA_SHA';
  else if (nextStepNum >= 22) nextStatus = 'CONCLUIDA';

  return {
    ...mission,
    stepNumber: nextStepObj.step,
    stepCode: nextStepObj.code,
    status: nextStatus,
    updatedAt: now,
  };
}

// ============================================================================
// 4. SELEÇÃO SELETIVA DE ESPECIALISTAS PELA CATARINA (AGENTE 100)
// ============================================================================

export function selectCatarinaSpecialistsForModules(
  targetModules: string[],
  executorAgentId: string,
  allAgents: OperationalAgent[]
): OperationalAgent[] {
  // Regra Constitucional Seção 17:
  // "Catarina não deverá mobilizar todos os especialistas indiscriminadamente.
  // Selecionar apenas os agentes necessários para cada entrega e identificar conflitos de interesse."
  const normalizedTargets = targetModules.map((m) => m.toLowerCase());

  return allAgents.filter((agent) => {
    if (agent.id === executorAgentId) return false; // Previne conflito de interesse
    if (agent.number === 0) return false; // Agente 00 Astra é comando estratégico

    const matchesOwnedModule = agent.ownedModules.some((owned) =>
      normalizedTargets.some((target) => owned.toLowerCase().includes(target) || target.includes(owned.toLowerCase()))
    );

    const matchesSpecialty = normalizedTargets.some(
      (target) =>
        agent.specialty.toLowerCase().includes(target) ||
        agent.responsibilities.some((r) => r.toLowerCase().includes(target))
    );

    return matchesOwnedModule || matchesSpecialty;
  });
}

// ============================================================================
// 5. IMPORTADOR IDEMPOTENTE DE CONVERSAS (GOOGLE DRIVE / MARKDOWN / TXT)
// ============================================================================

export function computeContentFingerprint(text: string): string {
  const normalized = text.trim().replace(/\r\n/g, '\n');
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function parseHistoricalConversationDocument(
  fileName: string,
  rawText: string,
  sourceFolderUrl = 'https://drive.google.com/drive/folders/1GQNRJFUxO3WNgct8SChRRJkwnA_vsMAW'
): ImportedConversationReport {
  const fingerprint = computeContentFingerprint(rawText);
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const knownParticipantTokens = [
    'Marcelo',
    'Orquestrador Humano',
    'Gemini',
    'Gemini Spark',
    'Grok',
    'Antigravity',
    'ChatGPT',
    'Claude',
    'Google AI Studio',
    'Codex',
    'GitHub Copilot',
    'Devin',
    'Astra',
    'Catarina',
  ];

  const participantsIdentified = knownParticipantTokens.filter((token) =>
    new RegExp(`\\b${token}\\b`, 'i').test(rawText)
  );

  const chronologyEntries: string[] = [];
  const decisionsExtracted: string[] = [];
  const completedWork: string[] = [];
  const pendingWork: string[] = [];
  const blockersIdentified: string[] = [];
  const contradictionsDetected: string[] = [];
  const authorizationRequests: string[] = [];
  const branchesAndCommits: string[] = [];
  const evidencesReferenced: string[] = [];

  for (const line of lines) {
    if (/^\d{4}-\d{2}-\d{2}|^\[\d{2}:\d{2}\]|^Onda\s+\d+/i.test(line)) {
      chronologyEntries.push(line);
    }
    if (/decis[aã]o:|definido:|aprovado:|regra:/i.test(line)) {
      decisionsExtracted.push(line);
    }
    if (/conclu[ií]do:|implementado:|entregue:|\[x\]/i.test(line)) {
      completedWork.push(line);
    }
    if (/pendente:|falta:|todo:|\[ \]/i.test(line)) {
      pendingWork.push(line);
    }
    if (/bloqueador:|bloqueado:|erro:|falha:/i.test(line)) {
      blockersIdentified.push(line);
    }
    if (/contradi[cç][aã]o:|conflito:|diverg[eê]ncia:/i.test(line)) {
      contradictionsDetected.push(line);
    }
    if (/autoriza[cç][aã]o:|aprova[cç][aã]o humana:|solicito permiss[aã]o:/i.test(line)) {
      authorizationRequests.push(line);
    }
    if (/\b(branch|feat\/|fix\/|wave\/|commit|sha)\b|[0-9a-f]{7,40}/i.test(line)) {
      branchesAndCommits.push(line);
    }
    if (/evid[eê]ncia:|log:|teste:|exit code|screenshot/i.test(line)) {
      evidencesReferenced.push(line);
    }
  }

  const proposedWaves =
    pendingWork.length > 0
      ? pendingWork.map((item, idx) => `Onda Proposta ${idx + 1}: Resolver item pendente -> ${item}`)
      : ['Nenhuma onda adicional extraída além do Roadmap Oficial (Ondas 00 a 19).'];

  const generatedPrompts = proposedWaves.map(
    (waveDesc, idx) =>
      `[PROMPT ONDA IMPORTADA #${idx + 1}] Contexto: ${fileName} (${fingerprint}). Objetivo: ${waveDesc}. Restrições: Isolamento de worktree obrigatório, gasto R$ 0,00, auditoria independente vinculada ao SHA.`
  );

  const generatedChecklistItems = [
    `Verificar preservação integral do arquivo original ${fileName} (${fingerprint})`,
    ...pendingWork.map((p) => `Validar entrega pendente: ${p}`),
    ...blockersIdentified.map((b) => `Mitigar bloqueador identificado: ${b}`),
  ];

  const diagnosticSummary = `Arquivo "${fileName}" analisado de forma determinística e idempotente (Hash ${fingerprint}). Participantes detectados: ${
    participantsIdentified.length > 0 ? participantsIdentified.join(', ') : 'Não especificados explicitamente'
  }. Concluídos: ${completedWork.length} · Pendentes: ${pendingWork.length} · Bloqueadores: ${blockersIdentified.length} · Contradições: ${contradictionsDetected.length}. Nenhuma informação ausente foi inventada.`;

  return {
    id: `IMP-${fingerprint}`,
    fileName,
    sourceFolderUrl,
    contentFingerprint: fingerprint,
    importedAt: new Date().toISOString(),
    rawTextPreserved: rawText,
    participantsIdentified,
    chronologyEntries,
    decisionsExtracted,
    completedWork,
    pendingWork,
    blockersIdentified,
    contradictionsDetected,
    authorizationRequests,
    branchesAndCommits,
    evidencesReferenced,
    diagnosticSummary,
    proposedWaves,
    generatedPrompts,
    generatedChecklistItems,
  };
}

// ============================================================================
// 6. MOTOR DE AUTOMAÇÃO: AQUISIÇÃO DE LEASE, HEARTBEAT, RETRY E BACKOFF (SEÇÃO 13)
// ============================================================================

export function transitionAutomationJobState(
  job: import('../shared/contracts').AutomationQueueJob,
  action: 'ACQUIRE_LEASE' | 'HEARTBEAT' | 'COMPLETE' | 'FAIL_AND_RETRY' | 'PAUSE' | 'RESUME',
  actorId = 'IA-10 (Devin Local Runner)',
  globalSuspended = false,
  devinBridgeEnabled = true
): { job: import('../shared/contracts').AutomationQueueJob; allowed: boolean; reason: string } {
  const now = new Date().toISOString();

  if (globalSuspended) {
    return {
      job: { ...job, status: 'BLOQUEADA_SUSPENSAO_GLOBAL' },
      allowed: false,
      reason: 'Operação bloqueada: Suspensão Global de Automações (Kill Switch) está ativa.',
    };
  }

  if (job.targetEnvironment === 'LOCAL_WINDOWS' && !devinBridgeEnabled) {
    return {
      job: { ...job, status: 'AGUARDANDO_MAQUINA_LOCAL', leaseOwner: null },
      allowed: false,
      reason: 'Ponte Runner Local Windows desabilitada: tarefa preservada em AGUARDANDO_MAQUINA_LOCAL.',
    };
  }

  if (action === 'ACQUIRE_LEASE') {
    return {
      job: {
        ...job,
        status: 'LEASE_ATIVO',
        leaseOwner: actorId,
        lastHeartbeatAt: now,
      },
      allowed: true,
      reason: `Lease adquirido por ${actorId} com idempotencyKey ${job.idempotencyKey}.`,
    };
  }

  if (action === 'HEARTBEAT') {
    return {
      job: {
        ...job,
        status: 'LEASE_ATIVO',
        leaseOwner: job.leaseOwner || actorId,
        lastHeartbeatAt: now,
      },
      allowed: true,
      reason: `Heartbeat registrado para ${job.id} em ${now}.`,
    };
  }

  if (action === 'COMPLETE') {
    return {
      job: {
        ...job,
        status: 'CONCLUIDA',
        lastHeartbeatAt: now,
      },
      allowed: true,
      reason: `Job ${job.id} concluído com sucesso.`,
    };
  }

  if (action === 'FAIL_AND_RETRY') {
    const nextRetry = job.retryCount + 1;
    const exhausted = nextRetry >= job.maxRetries;
    return {
      job: {
        ...job,
        retryCount: nextRetry,
        status: exhausted ? 'PAUSADA' : 'NA_FILA',
        leaseOwner: null,
        lastHeartbeatAt: now,
      },
      allowed: true,
      reason: exhausted
        ? `Limite de tentativas (${job.maxRetries}) atingido; job pausado para escalonamento humano.`
        : `Falha registrada. Reenfileirado com backoff (tentativa ${nextRetry}/${job.maxRetries}).`,
    };
  }

  if (action === 'PAUSE') {
    return {
      job: { ...job, status: 'PAUSADA', leaseOwner: null },
      allowed: true,
      reason: `Job ${job.id} pausado.`,
    };
  }

  return {
    job: { ...job, status: 'NA_FILA' },
    allowed: true,
    reason: `Job ${job.id} retomado na fila.`,
  };
}

// ============================================================================
// 7. PLANO DE INTEGRAÇÃO GIT SOMENTE LEITURA E VALIDAÇÃO DE QUALITY GATES (SEÇÃO 19)
// ============================================================================

export interface GitIntegrationPlanEvaluation {
  readyForHumanApproval: boolean;
  targetRepoProtected: boolean;
  shaVerified: boolean;
  allAuditsPassed: boolean;
  blockingReasons: string[];
  planSummary: string;
}

export function evaluateGitIntegrationPlan(
  mission: Mission,
  audits: AuditRecord[],
  gitSafeReadOnlyMode: boolean
): GitIntegrationPlanEvaluation {
  const blockingReasons: string[] = [];
  const missionAudits = audits.filter((a) => a.missionId === mission.id);

  if (!mission.approvedSha) {
    blockingReasons.push('A missão ainda não possui SHA formalmente aprovado por auditor independente.');
  }

  if (mission.approvedSha && mission.approvedSha !== mission.isolation.currentHeadSha) {
    blockingReasons.push(
      `Divergência de SHA: O SHA aprovado (${mission.approvedSha}) difere do HEAD atual (${mission.isolation.currentHeadSha}).`
    );
  }

  const validAudit = missionAudits.find(
    (a) =>
      (a.state === 'APROVADA' || a.state === 'APROVADA_COM_RESSALVAS') &&
      a.auditedSha === mission.isolation.currentHeadSha &&
      a.executedTests.every((t) => t.executed && t.result === 'APROVADO' && t.exitCode === 0)
  );

  if (!validAudit) {
    blockingReasons.push('Nenhuma auditoria independente aprovada com 100% dos testes executados para o SHA atual.');
  }

  const readyForHumanApproval = blockingReasons.length === 0;

  return {
    readyForHumanApproval,
    targetRepoProtected: gitSafeReadOnlyMode,
    shaVerified: Boolean(mission.approvedSha && mission.approvedSha === mission.isolation.currentHeadSha),
    allAuditsPassed: Boolean(validAudit),
    blockingReasons,
    planSummary: readyForHumanApproval
      ? `Plano de PR pronto para deliberação do Orquestrador Humano: branch ${mission.isolation.branchName} @ SHA ${mission.isolation.currentHeadSha.slice(0, 10)} (Modo Seguro Somente Leitura ativo).`
      : `Integração bloqueada por ${blockingReasons.length} pendência(s) constitucional(is).`,
  };
}

// ============================================================================
// 8. DETECTOR DE CONFLITOS DE MEMÓRIA E PROVENIÊNCIA (SEÇÃO 20)
// ============================================================================

export function detectMemoryConflicts(
  candidate: {
    level: import('../shared/contracts').MemoryEntry['level'];
    entityRef: string;
    title: string;
    content: string;
    verificationStatus: import('../shared/contracts').MemoryEntry['verificationStatus'];
  },
  existingMemories: import('../shared/contracts').MemoryEntry[]
): { hasConflict: boolean; conflictingMemoryIds: string[]; recommendedStatus: import('../shared/contracts').MemoryEntry['verificationStatus'] } {
  const sameScope = existingMemories.filter(
    (m) =>
      m.level === candidate.level &&
      m.entityRef.toLowerCase() === candidate.entityRef.toLowerCase()
  );

  const conflictingMemoryIds: string[] = [];
  const candidateLower = candidate.content.toLowerCase();

  for (const mem of sameScope) {
    const existingLower = mem.content.toLowerCase();
    const flipsEnablement =
      (candidateLower.includes('desabilitad') && existingLower.includes('ativ')) ||
      (candidateLower.includes('ativ') && existingLower.includes('desabilitad')) ||
      (candidateLower.includes('r$ 0,00') === false && candidateLower.includes('api paga'));

    if (flipsEnablement && mem.verificationStatus === 'INSTRUCAO_CONSTITUCIONAL') {
      conflictingMemoryIds.push(mem.id);
    }
  }

  return {
    hasConflict: conflictingMemoryIds.length > 0,
    conflictingMemoryIds,
    recommendedStatus:
      conflictingMemoryIds.length > 0 ? 'CONFLITO_DETECTADO' : candidate.verificationStatus,
  };
}

// ============================================================================
// 9. LIBERAÇÃO PROGRESSIVA DE ONDAS (ETAPA 23 — SEÇÃO 12 E 27)
// ============================================================================

export function evaluateWaveReleaseProgression(
  waveId: string,
  waves: import('../shared/contracts').Wave[],
  missions: Mission[]
): { canCompleteWave: boolean; nextWaveReleasedId: string | null; reason: string } {
  const wave = waves.find((w) => w.id === waveId);
  if (!wave) {
    return { canCompleteWave: false, nextWaveReleasedId: null, reason: 'Onda não encontrada.' };
  }

  const waveMissions = missions.filter((m) => m.waveId === waveId);
  const blockingMissions = waveMissions.filter(
    (m) => m.status !== 'APROVADA_SHA' && m.status !== 'CONCLUIDA'
  );

  if (blockingMissions.length > 0) {
    return {
      canCompleteWave: false,
      nextWaveReleasedId: null,
      reason: `Existem ${blockingMissions.length} missão(ões) na ${waveId} aguardando aprovação de SHA ou conclusão (${blockingMissions.map((m) => m.code).join(', ')}).`,
    };
  }

  const nextWave = waves.find((w) => w.number === wave.number + 1);
  return {
    canCompleteWave: true,
    nextWaveReleasedId: nextWave ? nextWave.id : null,
    reason: nextWave
      ? `Onda ${wave.id} homologada. Próxima onda liberada: ${nextWave.id} (${nextWave.title}).`
      : `Onda final ${wave.id} concluída com sucesso.`,
  };
}

// ============================================================================
// 10. EXPORTADOR SQL D1 DETERMINÍSTICO DO ESTADO PERSISTENTE (SEÇÃO 6 E 25)
// ============================================================================

export function generateCloudflareD1SqlSnapshot(
  db: import('../shared/contracts').B360DatabaseState
): string {
  const esc = (val: string | null | undefined) =>
    val === null || val === undefined ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;

  const lines: string[] = [
    '-- ============================================================================',
    '-- B360-AOC CLOUDFLARE D1 SNAPSHOT EXPORT (GERADO DETERMINISTICAMENTE)',
    `-- Timestamp: ${new Date().toISOString()}`,
    `-- Politica Financeira Adicional: R$ ${db.governance.additionalSpendLimitBrl.toFixed(2)}`,
    `-- Ponte Runner Local Devin Ativa: ${db.governance.devinBridgeEnabled ? 'SIM' : 'NAO'}`,
    '-- ============================================================================',
    'PRAGMA foreign_keys = ON;',
    '',
  ];

  for (const p of db.providers) {
    lines.push(
      `INSERT OR REPLACE INTO Providers (id, name, environment, connection_status, role_description, capabilities_json, integration_notes) VALUES (${esc(p.id)}, ${esc(p.name)}, ${esc(p.environment)}, ${esc(p.connectionStatus)}, ${esc(p.roleDescription)}, ${esc(JSON.stringify(p.capabilities))}, ${esc(p.integrationNotes)});`
    );
  }

  for (const m of db.missions) {
    lines.push(
      `INSERT OR REPLACE INTO Missions (id, code, project_id, wave_id, title, step_number, step_code, status, executor_provider_id, executor_agent_id, auditor_agent_id, priority, acceptance_criteria_json, preflight_json, approved_sha, rejection_reason, created_at, updated_at) VALUES (${esc(m.id)}, ${esc(m.code)}, 'PRJ-B360-AOC', ${esc(m.waveId)}, ${esc(m.title)}, ${m.stepNumber}, ${esc(m.stepCode)}, ${esc(m.status)}, ${esc(m.executorProviderId)}, ${esc(m.executorAgentId)}, ${esc(m.auditorAgentId)}, ${esc(m.priority)}, ${esc(JSON.stringify(m.acceptanceCriteria))}, ${esc(JSON.stringify(m.preflight))}, ${esc(m.approvedSha)}, ${esc(m.rejectionReason)}, ${esc(m.createdAt)}, ${esc(m.updatedAt)});`
    );
  }

  for (const mem of db.memories) {
    lines.push(
      `INSERT OR REPLACE INTO Memories (id, memory_level, entity_ref, title, content, provenance, verification_status, version, updated_at) VALUES (${esc(mem.id)}, ${esc(mem.level)}, ${esc(mem.entityRef)}, ${esc(mem.title)}, ${esc(mem.content)}, ${esc(mem.provenance)}, ${esc(mem.verificationStatus)}, ${mem.version}, ${esc(mem.updatedAt)});`
    );
  }

  return lines.join('\n');
}
