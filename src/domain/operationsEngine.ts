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
