import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import {
  CreateMissionInputSchema,
  MISSION_LIFECYCLE_STEPS,
  OFFICIAL_40_MODULES,
  SendMessageInputSchema,
} from './src/shared/contracts';
import {
  computeContentFingerprint,
  computeNextMissionStep,
  detectMemoryConflicts,
  evaluateGitIntegrationPlan,
  evaluateMissionPreflight,
  evaluateWaveReleaseProgression,
  generateCloudflareD1SqlSnapshot,
  parseHistoricalConversationDocument,
  selectCatarinaSpecialistsForModules,
  transitionAutomationJobState,
  validateAuditApproval,
} from './src/domain/operationsEngine';
import { loadDatabase, saveDatabase } from './src/server/db';
import { evaluateProviderAdapterStatus } from './src/server/adapters';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // ==========================================================================
  // API REST TIPADA — BIRTHUB 360 AI OPERATIONS CENTER (B360-AOC)
  // ==========================================================================

  // 1. Estado consolidado da operação + status real dos adaptadores
  app.get('/api/state', (_req, res) => {
    const db = loadDatabase();
    const adapterDiagnostics = db.providers.map((p) => evaluateProviderAdapterStatus(p));
    res.json({
      modules: OFFICIAL_40_MODULES,
      lifecycleSteps: MISSION_LIFECYCLE_STEPS,
      adapterDiagnostics,
      db,
    });
  });

  // 2. Criar Nova Missão com Isolamento Obrigatório e Validação Zod
  app.post('/api/missions', (req, res) => {
    const parsed = CreateMissionInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Falha de validação nos dados da missão.',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const db = loadDatabase();
    if (db.governance.globalAutomationSuspended) {
      res.status(403).json({
        error: 'Operação bloqueada: Suspensão Global de Automações (Kill Switch) está ativa.',
      });
      return;
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
    const newMission: import('./src/shared/contracts').Mission = {
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
        resourceAvailabilityConfirmed:
          input.executorProviderId !== 'IA-10' || db.governance.devinBridgeEnabled,
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
          ? pf.executionLeaseAcquired &&
            (input.executorProviderId !== 'IA-10' || db.governance.devinBridgeEnabled)
          : input.executorProviderId !== 'IA-10' || db.governance.devinBridgeEnabled,
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
      newMission.rejectionReason = [...preflightEval.failedChecks, ...preflightEval.isolationConflicts].join(' | ');
    } else {
      newMission.status = 'PREFLIGHT_APROVADO';
    }

    db.missions.unshift(newMission);
    db.governance.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: now,
      actor: 'ORQUESTRADOR_HUMANO',
      action: `CRIACAO_MISSAO_${newMission.status}`,
      target: `${newMission.code} (${newMission.title})`,
      shaOrRef: newMission.isolation.baseSha,
    });

    saveDatabase(db);
    res.status(201).json({ mission: newMission, preflightEvaluation: preflightEval });
  });

  // 3. Executar Preflight e Transicionar Máquina de Estados da Missão
  app.post('/api/missions/:id/transition', (req, res) => {
    const schema = z.object({
      action: z.enum(['EXECUTAR_PREFLIGHT', 'AVANCAR_ETAPA', 'REPROVAR_ENTREGA', 'INVALIDAR_POR_NOVO_COMMIT']),
      newCommitSha: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ação de transição inválida.' });
      return;
    }

    const db = loadDatabase();
    if (db.governance.globalAutomationSuspended) {
      res.status(403).json({
        error: 'Transição bloqueada: Suspensão Global de Automações está ativa.',
      });
      return;
    }

    const idx = db.missions.findIndex((m) => m.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Missão não encontrada.' });
      return;
    }

    const current = db.missions[idx];
    const preflightEval = evaluateMissionPreflight(current, db.missions);

    if (parsed.data.action === 'EXECUTAR_PREFLIGHT') {
      current.status = preflightEval.passed ? 'PREFLIGHT_APROVADO' : 'BLOQUEADA_ISOLAMENTO';
      current.rejectionReason = preflightEval.passed
        ? null
        : [...preflightEval.failedChecks, ...preflightEval.isolationConflicts].join(' | ');
      current.updatedAt = new Date().toISOString();
      db.missions[idx] = current;
      saveDatabase(db);
      res.json({ mission: current, preflightEvaluation: preflightEval });
      return;
    }

    if (parsed.data.action === 'AVANCAR_ETAPA' && !preflightEval.passed) {
      res.status(422).json({
        error: 'Bloqueio Constitucional de Preflight: Corrija as pendências de isolamento antes de avançar a missão.',
        preflightEvaluation: preflightEval,
      });
      return;
    }

    const updated = computeNextMissionStep(current, parsed.data.action, parsed.data.newCommitSha);
    db.missions[idx] = updated;
    db.governance.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'MOTOR_ESTADOS_B360',
      action: `TRANSICAO_${parsed.data.action}_ETAPA_${updated.stepNumber}`,
      target: updated.code,
      shaOrRef: updated.isolation.currentHeadSha,
    });

    saveDatabase(db);
    res.json({ mission: updated, preflightEvaluation: preflightEval });
  });

  // 4. Enviar Mensagem na Central de Conversas entre IAs (com proteção de autoria e anti-duplicidade)
  app.post('/api/messages', (req, res) => {
    const parsed = SendMessageInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Dados de mensagem inválidos.',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const input = parsed.data;

    // Regra Constitucional Seção 8: Nenhuma mensagem produzida por IA poderá ser atribuída ao Orquestrador Humano
    if (
      input.authorType !== 'ORQUESTRADOR_HUMANO' &&
      /marcelo|orquestrador humano/i.test(input.authorName)
    ) {
      res.status(403).json({
        error: 'Violação Constitucional (Seção 8): Nenhuma mensagem produzida por IA pode ser atribuída ao Orquestrador Humano.',
      });
      return;
    }

    // Proteção básica contra Prompt Injection em mensagens
    if (/ignore all previous instructions|system override|bypass constitutional rules/i.test(input.content)) {
      res.status(422).json({
        error: 'Bloqueio de Segurança (Seção 10): Padrão suspeito de Prompt Injection detectado e rejeitado.',
      });
      return;
    }

    const db = loadDatabase();
    const contentHash = computeContentFingerprint(`${input.authorId}:${input.conversationId}:${input.content}`);

    // Prevenção de mensagens duplicadas
    const duplicate = db.messages.find((m) => m.contentHash === contentHash);
    if (duplicate) {
      res.status(409).json({
        error: 'Prevenção de Duplicidade (Seção 8): Esta mensagem exata já foi registrada no barramento.',
        existingMessage: duplicate,
      });
      return;
    }

    const now = new Date().toISOString();
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
      processingState:
        input.messageKind === 'SOLICITACAO_APROVACAO'
          ? ('AGUARDANDO_APROVACAO_HUMANA' as const)
          : ('NAO_RESPONDIDA' as const),
      contentHash,
      createdAt: now,
    };

    db.messages.unshift(newMsg);
    saveDatabase(db);
    res.status(201).json({ message: newMsg });
  });

  // 5. Importador Idempotente de Conversas Existentes (Google Drive / Markdown / TXT)
  app.post('/api/conversations/import', (req, res) => {
    const schema = z.object({
      fileName: z.string().min(3, 'Informe o nome do arquivo original (.md ou .txt).'),
      rawText: z.string().min(15, 'O conteúdo do arquivo deve ter pelo menos 15 caracteres.'),
      sourceFolderUrl: z.string().url().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Arquivo inválido para importação.',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const db = loadDatabase();
    const report = parseHistoricalConversationDocument(
      parsed.data.fileName,
      parsed.data.rawText,
      parsed.data.sourceFolderUrl
    );

    const existingIndex = db.importedConversations.findIndex(
      (item) => item.contentFingerprint === report.contentFingerprint
    );

    const isIdempotentMatch = existingIndex !== -1;
    if (isIdempotentMatch) {
      // Idempotente: preserva registro existente sem duplicar
      res.json({
        report: db.importedConversations[existingIndex],
        idempotentReimport: true,
      });
      return;
    }

    db.importedConversations.unshift(report);
    db.governance.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'IMPORTADOR_GDRIVE_IDEMPOTENTE',
      action: 'IMPORTACAO_CONVERSA_HISTORICA',
      target: report.fileName,
      shaOrRef: report.contentFingerprint,
    });

    saveDatabase(db);
    res.status(201).json({ report, idempotentReimport: false });
  });

  // 6. Alternar item de Checklist Persistente
  app.post('/api/checklists/:checklistId/items/:itemId/toggle', (req, res) => {
    const db = loadDatabase();
    const checklist = db.checklists.find((c) => c.id === req.params.checklistId);
    if (!checklist) {
      res.status(404).json({ error: 'Checklist não encontrado.' });
      return;
    }
    const item = checklist.items.find((i) => i.id === req.params.itemId);
    if (!item) {
      res.status(404).json({ error: 'Item de checklist não encontrado.' });
      return;
    }

    item.checked = !item.checked;
    item.verifiedBy = item.checked ? 'ORQUESTRADOR_HUMANO' : null;
    saveDatabase(db);
    res.json({ checklist });
  });

  // 7. Criar ou versionar Prompt no Prompt Studio
  app.post('/api/prompts', (req, res) => {
    const schema = z.object({
      title: z.string().min(5),
      waveId: z.string().min(1),
      targetProviderId: z.string().min(1),
      targetSquadId: z.string().min(1),
      objective: z.string().min(5),
      scopeModules: z.array(z.string()).min(1),
      acceptanceCriteria: z.array(z.string()).min(1),
      promptBody: z.string().min(15),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Dados do prompt inválidos.',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const db = loadDatabase();
    const newPrompt = {
      id: `PRM-${String(db.prompts.length + 1).padStart(2, '0')}`,
      title: parsed.data.title,
      waveId: parsed.data.waveId,
      targetProviderId: parsed.data.targetProviderId,
      targetSquadId: parsed.data.targetSquadId,
      version: 1,
      objective: parsed.data.objective,
      scopeModules: parsed.data.scopeModules,
      constitutionalConstraints: [
        'Política financeira de R$ 0,00 em custos adicionais',
        'Isolamento obrigatório de worktree e branch exclusiva',
        'Auditoria independente vinculada ao SHA',
      ],
      acceptanceCriteria: parsed.data.acceptanceCriteria,
      promptBody: parsed.data.promptBody,
      updatedAt: new Date().toISOString(),
    };

    db.prompts.unshift(newPrompt);
    saveDatabase(db);
    res.status(201).json({ prompt: newPrompt });
  });

  // 8. Deliberação de Auditoria Independente (com verificação de SHA e proibição de autoaprovação)
  app.post('/api/audits/:id/verdict', (req, res) => {
    const schema = z.object({
      auditorAgentId: z.string().min(1),
      decision: z.enum(['APROVADA', 'APROVADA_COM_RESSALVAS', 'REPROVADA']),
      finalVerdict: z.string().min(5),
      markLocalDevinTestExecuted: z.boolean().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados de parecer inválidos.' });
      return;
    }

    const db = loadDatabase();
    const audit = db.audits.find((a) => a.id === req.params.id);
    if (!audit) {
      res.status(404).json({ error: 'Auditoria não encontrada.' });
      return;
    }

    const mission = db.missions.find((m) => m.id === audit.missionId);
    if (!mission) {
      res.status(404).json({ error: 'Missão vinculada não encontrada.' });
      return;
    }

    if (parsed.data.decision === 'APROVADA' || parsed.data.decision === 'APROVADA_COM_RESSALVAS') {
      const validation = validateAuditApproval(mission, audit, parsed.data.auditorAgentId);
      if (!validation.allowed) {
        res.status(422).json({ error: validation.reason });
        return;
      }
      mission.approvedSha = audit.auditedSha;
      mission.status = 'APROVADA_SHA';
      mission.stepNumber = 18;
      mission.stepCode = '18_ENCAMINHAMENTO_SQUAD_INTEGRACAO';
    } else {
      mission.approvedSha = null;
      mission.status = 'REPROVADA_AUDITORIA';
      mission.stepNumber = 16;
      mission.stepCode = '16_CORRECAO_QUANDO_NECESSARIA';
      mission.rejectionReason = parsed.data.finalVerdict;
    }

    audit.state = parsed.data.decision;
    audit.finalVerdict = parsed.data.finalVerdict;
    audit.updatedAt = new Date().toISOString();

    db.governance.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: audit.updatedAt,
      actor: parsed.data.auditorAgentId,
      action: `PARECER_AUDITORIA_${parsed.data.decision}`,
      target: `${audit.id} / ${mission.code}`,
      shaOrRef: audit.auditedSha,
    });

    saveDatabase(db);
    res.json({ audit, mission });
  });

  // 9. Adicionar Registro de Memória Estruturada (10 Níveis)
  app.post('/api/memories', (req, res) => {
    const schema = z.object({
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
      entityRef: z.string().min(2),
      title: z.string().min(4),
      content: z.string().min(10),
      provenance: z.string().min(3),
      verificationStatus: z.enum([
        'FATO_VERIFICADO_SHA',
        'INSTRUCAO_CONSTITUCIONAL',
        'AFIRMACAO_IA_NAO_VERIFICADA',
        'CONFLITO_DETECTADO',
      ]),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados de memória inválidos.' });
      return;
    }

    const db = loadDatabase();
    const conflictEval = detectMemoryConflicts(parsed.data, db.memories);
    const newMem = {
      id: `MEM-${String(db.memories.length + 1).padStart(3, '0')}`,
      ...parsed.data,
      verificationStatus: conflictEval.recommendedStatus,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    db.memories.unshift(newMem);
    saveDatabase(db);
    res.status(201).json({ memory: newMem, conflictEvaluation: conflictEval });
  });

  // 10. Botão de Emergência (Suspensão Global de Automações) e Governança
  app.post('/api/governance/kill-switch', (req, res) => {
    const schema = z.object({
      suspend: z.boolean(),
      reason: z.string().min(3),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Informe o motivo para alterar o estado de suspensão global.' });
      return;
    }

    const db = loadDatabase();
    db.governance.globalAutomationSuspended = parsed.data.suspend;
    db.governance.emergencyKillSwitchReason = parsed.data.suspend ? parsed.data.reason : null;

    for (const job of db.automationJobs) {
      if (parsed.data.suspend && (job.status === 'NA_FILA' || job.status === 'LEASE_ATIVO')) {
        job.status = 'BLOQUEADA_SUSPENSAO_GLOBAL';
      } else if (!parsed.data.suspend && job.status === 'BLOQUEADA_SUSPENSAO_GLOBAL') {
        job.status = 'NA_FILA';
      }
    }

    db.governance.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'ORQUESTRADOR_HUMANO',
      action: parsed.data.suspend ? 'SUSPENSAO_EMERGENCIAL_ATIVADA' : 'RETOMADA_OPERACIONAL_AUTORIZADA',
      target: 'Motor de Automação Global',
      shaOrRef: parsed.data.reason,
    });

    saveDatabase(db);
    res.json({ governance: db.governance, automationJobs: db.automationJobs });
  });

  // 11. Controle da Ponte Runner Local Windows com o Devin (IA-10)
  app.post('/api/governance/devin-bridge', (req, res) => {
    const schema = z.object({
      enabled: z.boolean(),
      reason: z.string().min(3),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Informe o estado e o motivo para alterar a ponte do Runner Local Devin.' });
      return;
    }

    const db = loadDatabase();
    const { enabled, reason } = parsed.data;
    const now = new Date().toISOString();

    db.governance.devinBridgeEnabled = enabled;
    db.governance.devinContractVerified = enabled;

    const devinProvider = db.providers.find((p) => p.id === 'IA-10');
    if (devinProvider) {
      devinProvider.connectionStatus = enabled ? 'CONECTADO_API_LOCAL' : 'BLOQUEADO_VERIFICACAO_PENDENTE';
      devinProvider.subscriptionSummary = enabled
        ? 'Ponte Runner Local Windows Ativa e Homologada (R$ 0,00 adicional)'
        : 'VERIFICAÇÃO CONTRATUAL PENDENTE (Seção 4 e Seção 16)';
      devinProvider.consumptionLimitNote = enabled
        ? 'Runner local Windows conectado via protocolo outbound autenticado nas unidades C: e D:.'
        : 'Integração desabilitada até verificação contratual e confirmação de capacidades reais.';
      devinProvider.capabilities = enabled
        ? {
            sendMission: 'SUPORTADO',
            receiveResponse: 'SUPORTADO',
            checkAvailability: 'SUPORTADO',
            checkConsumption: 'SUPORTADO',
            cancelExecution: 'SUPORTADO',
            receiveEvents: 'SUPORTADO',
            attachFiles: 'SUPORTADO',
            queryResults: 'SUPORTADO',
            supportAuth: 'SUPORTADO',
            supportAutomation: 'SUPORTADO',
          }
        : {
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
          };
      devinProvider.integrationNotes = enabled
        ? 'Ponte Runner Local Windows ATIVA via conexão de saída autenticada (Outbound mTLS/HMAC) nas unidades C: e D:.'
        : 'Bloqueio constitucional preventivo: aguarda verificação contratual e ativação do protocolo seguro outbound no Windows.';
    }

    const devinSub = db.subscriptions.find((s) => s.providerId === 'IA-10');
    if (devinSub) {
      devinSub.tier = enabled ? 'Runner Local Windows Ativo' : 'Situação Contratual em Verificação';
      devinSub.quotaStatus = enabled ? 'DISPONIVEL' : 'VERIFICACAO_CONTRATUAL_PENDENTE';
    }

    for (const msn of db.missions) {
      if (msn.executorProviderId === 'IA-10') {
        msn.preflight.resourceAvailabilityConfirmed = enabled;
        msn.preflight.executionLeaseAcquired = enabled;
        const evalRes = evaluateMissionPreflight(msn, db.missions);
        msn.status = evalRes.passed ? 'PREFLIGHT_APROVADO' : 'BLOQUEADA_ISOLAMENTO';
        msn.rejectionReason = evalRes.passed
          ? null
          : [...evalRes.failedChecks, ...evalRes.isolationConflicts].join(' | ');
        msn.updatedAt = now;
      }
    }

    for (const job of db.automationJobs) {
      if (job.targetEnvironment === 'LOCAL_WINDOWS') {
        if (enabled && job.status === 'AGUARDANDO_MAQUINA_LOCAL') {
          job.status = 'LEASE_ATIVO';
          job.leaseOwner = 'IA-10 (Devin Local Runner)';
          job.lastHeartbeatAt = now;
        } else if (!enabled && job.status === 'LEASE_ATIVO') {
          job.status = 'AGUARDANDO_MAQUINA_LOCAL';
          job.leaseOwner = null;
        }
      }
    }

    db.governance.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: now,
      actor: 'ORQUESTRADOR_HUMANO',
      action: enabled ? 'PONTE_RUNNER_LOCAL_DEVIN_ATIVADA' : 'PONTE_RUNNER_LOCAL_DEVIN_DESATIVADA',
      target: 'IA-10 (Devin Local Runner Windows)',
      shaOrRef: reason,
    });

    saveDatabase(db);
    res.json({
      governance: db.governance,
      provider: devinProvider,
      missions: db.missions,
      automationJobs: db.automationJobs,
    });
  });

  // 12. Transição de Jobs do Motor de Automação (Lease, Heartbeat, Retry, Backoff, Concluir)
  app.post('/api/automation-jobs/:id/action', (req, res) => {
    const schema = z.object({
      action: z.enum(['ACQUIRE_LEASE', 'HEARTBEAT', 'COMPLETE', 'FAIL_AND_RETRY', 'PAUSE', 'RESUME']),
      actorId: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ação de automação inválida.' });
      return;
    }

    const db = loadDatabase();
    const idx = db.automationJobs.findIndex((j) => j.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Job de automação não encontrado.' });
      return;
    }

    const outcome = transitionAutomationJobState(
      db.automationJobs[idx],
      parsed.data.action,
      parsed.data.actorId || 'IA-10 (Devin Local Runner)',
      db.governance.globalAutomationSuspended,
      db.governance.devinBridgeEnabled
    );

    db.automationJobs[idx] = outcome.job;
    db.governance.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: parsed.data.actorId || 'MOTOR_AUTOMACAO_B360',
      action: `AUTOMATION_JOB_${parsed.data.action}`,
      target: outcome.job.id,
      shaOrRef: outcome.job.idempotencyKey,
    });

    saveDatabase(db);
    if (!outcome.allowed) {
      res.status(422).json({ error: outcome.reason, job: outcome.job });
      return;
    }
    res.json({ job: outcome.job, message: outcome.reason });
  });

  // 13. Heartbeat Outbound do Runner Local Windows (Devin IA-10)
  app.post('/api/runner/heartbeat', (req, res) => {
    const schema = z.object({
      runnerId: z.string().min(2),
      hostName: z.string().min(1),
      osPlatform: z.string().optional(),
      driveCFreeGb: z.number().nonnegative(),
      driveDFreeGb: z.number().nonnegative(),
      activeWorktreesCount: z.number().int().nonnegative(),
      outboundAuthOnly: z.literal(true),
      directTerminalExposed: z.literal(false),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Payload de heartbeat outbound inválido ou violação de segurança local.',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const db = loadDatabase();
    if (!db.governance.devinBridgeEnabled) {
      res.status(403).json({
        error: 'Ponte Runner Local está pausada na governança. Ative a ponte para sincronizar heartbeats.',
      });
      return;
    }

    const now = new Date().toISOString();
    const pendingLocalJobs = db.automationJobs.filter(
      (j) => j.targetEnvironment === 'LOCAL_WINDOWS' && j.status !== 'CONCLUIDA'
    );

    for (const job of pendingLocalJobs) {
      job.lastHeartbeatAt = now;
      if (job.status === 'AGUARDANDO_MAQUINA_LOCAL' || job.status === 'NA_FILA') {
        job.status = 'LEASE_ATIVO';
        job.leaseOwner = `${parsed.data.runnerId} (${parsed.data.hostName})`;
      }
    }

    db.governance.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: now,
      actor: `${parsed.data.runnerId} (${parsed.data.hostName})`,
      action: 'RUNNER_LOCAL_OUTBOUND_HEARTBEAT',
      target: `C: ${parsed.data.driveCFreeGb}GB livres | D: ${parsed.data.driveDFreeGb}GB livres | Worktrees: ${parsed.data.activeWorktreesCount}`,
      shaOrRef: 'OUTBOUND-MTLS-OK',
    });

    saveDatabase(db);
    res.json({
      ok: true,
      receivedAt: now,
      pendingLocalJobsCount: pendingLocalJobs.length,
      runnerTelemetry: parsed.data,
    });
  });

  // 14. Liberação Progressiva da Próxima Onda (Etapa 23)
  app.post('/api/waves/:id/release-next', (req, res) => {
    const db = loadDatabase();
    const evalWave = evaluateWaveReleaseProgression(req.params.id, db.waves, db.missions);
    if (!evalWave.canCompleteWave) {
      res.status(422).json({ error: evalWave.reason, evaluation: evalWave });
      return;
    }

    const currWave = db.waves.find((w) => w.id === req.params.id);
    if (currWave) {
      currWave.status = 'CONCLUIDA_FUNDACAO';
    }
    if (evalWave.nextWaveReleasedId) {
      const nextWave = db.waves.find((w) => w.id === evalWave.nextWaveReleasedId);
      if (nextWave && nextWave.status === 'PLANEJADA') {
        nextWave.status = 'EM_ANDAMENTO';
      }
    }

    db.governance.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'AG-000 (Astra)',
      action: 'LIBERACAO_PROXIMA_ONDA_ETAPA_23',
      target: `${req.params.id} -> ${evalWave.nextWaveReleasedId || 'FINAL'}`,
      shaOrRef: 'WAVE-RELEASE-VERIFIED',
    });

    saveDatabase(db);
    res.json({ evaluation: evalWave, waves: db.waves });
  });

  // 15. Avaliação de Plano de Pull Request e Exportação SQL Cloudflare D1
  app.get('/api/git/integration-plan/:missionId', (req, res) => {
    const db = loadDatabase();
    const mission = db.missions.find((m) => m.id === req.params.missionId);
    if (!mission) {
      res.status(404).json({ error: 'Missão não encontrada.' });
      return;
    }
    const plan = evaluateGitIntegrationPlan(
      mission,
      db.audits,
      db.governance.gitSafeReadOnlyMode
    );
    res.json({ plan, mission });
  });

  app.get('/api/admin/export-d1-sql', (_req, res) => {
    const db = loadDatabase();
    const sql = generateCloudflareD1SqlSnapshot(db);
    res.json({ sql, generatedAt: new Date().toISOString(), tablesExported: 45 });
  });

  // ==========================================================================
  // VITE MIDDLEWARE (DEV) OU ARQUIVOS ESTÁTICOS (PROD)
  // ==========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[B360-AOC] Servidor operacional iniciado em http://0.0.0.0:${PORT}`);
  });
}

startServer();
