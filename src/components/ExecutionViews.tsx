import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckSquare,
  FileCode2,
  GitCommit,
  Layers,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  B360DatabaseState,
  CreateMissionInput,
  CreateMissionInputSchema,
  MISSION_LIFECYCLE_STEPS,
} from '../shared/contracts';
import { evaluateMissionPreflight } from '../domain/operationsEngine';

interface ExecutionViewsProps {
  activeModuleId: string;
  db: B360DatabaseState;
  onCreateMission: (input: CreateMissionInput) => Promise<{ ok: boolean; error?: string }>;
  onTransitionMission: (
    missionId: string,
    action: 'EXECUTAR_PREFLIGHT' | 'AVANCAR_ETAPA' | 'REPROVAR_ENTREGA' | 'INVALIDAR_POR_NOVO_COMMIT',
    newCommitSha?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onToggleChecklistItem: (checklistId: string, itemId: string) => Promise<void>;
  onCreatePrompt: (payload: {
    title: string;
    waveId: string;
    targetProviderId: string;
    targetSquadId: string;
    objective: string;
    scopeModules: string[];
    acceptanceCriteria: string[];
    promptBody: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}

export const ExecutionViews: React.FC<ExecutionViewsProps> = ({
  activeModuleId,
  db,
  onCreateMission,
  onTransitionMission,
  onToggleChecklistItem,
  onCreatePrompt,
}) => {
  const [selectedMissionId, setSelectedMissionId] = useState<string>(
    db.missions[0]?.id || 'MSN-001'
  );
  const [formCode, setFormCode] = useState(
    `B360-MSN-${String(db.missions.length + 1).padStart(3, '0')}`
  );
  const [formTitle, setFormTitle] = useState('');
  const [formWaveId, setFormWaveId] = useState('ONDA-12');
  const [formSquadId, setFormSquadId] = useState('SQ-DEV-NUVEM');
  const [formProviderId, setFormProviderId] = useState('IA-07');
  const [formExecutorAgentId, setFormExecutorAgentId] = useState('AG-012');
  const [formAuditorAgentId, setFormAuditorAgentId] = useState('AG-088');
  const [formPriority, setFormPriority] = useState<'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA'>('ALTA');
  const [formBranch, setFormBranch] = useState('wave/12-persistent-queue-worker');
  const [formWorktree, setFormWorktree] = useState(
    'D:/Birthub360-Operations/worktrees/msn-003-queue'
  );
  const [formBaseSha, setFormBaseSha] = useState('8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b');
  const [formPort, setFormPort] = useState<number>(3103);
  const [formModules, setFormModules] = useState('src/server/queueWorker.ts');
  const [formCriteria, setFormCriteria] = useState(
    'Persistencia de fila verificada; Zero dependencia de janela de chat aberta'
  );
  const [formPreflightConfig, setFormPreflightConfig] = useState({
    repoStateClean: true,
    exclusiveWorktreeAssigned: true,
    isolatedMutableDependencies: true,
    noUnsafeSymlinksOrJunctions: true,
    executionLeaseAcquired: true,
    independentAuditorAssigned: true,
  });
  const [missionFeedback, setMissionFeedback] = useState<string | null>(null);
  const [missionError, setMissionError] = useState<string | null>(null);

  // Prompt Studio state
  const [promptTitle, setPromptTitle] = useState('');
  const [promptWaveId, setPromptWaveId] = useState('ONDA-14');
  const [promptProviderId, setPromptProviderId] = useState('IA-06');
  const [promptSquadId, setPromptSquadId] = useState('SQ-CATARINA-100');
  const [promptObjective, setPromptObjective] = useState('');
  const [promptModules, setPromptModules] = useState('src/domain/operationsEngine.ts');
  const [promptCriteria, setPromptCriteria] = useState(
    'Mobilizar apenas especialistas do domínio; Impedir autoaprovação'
  );
  const [promptBody, setPromptBody] = useState('');
  const [promptStatusMsg, setPromptStatusMsg] = useState<string | null>(null);

  const selectedMission =
    db.missions.find((m) => m.id === selectedMissionId) || db.missions[0];

  const handleSubmitNewMission = async (e: React.FormEvent) => {
    e.preventDefault();
    setMissionError(null);
    setMissionFeedback(null);

    const candidatePayload = {
      code: formCode.trim(),
      title: formTitle.trim(),
      waveId: formWaveId,
      squadId: formSquadId,
      executorProviderId: formProviderId,
      executorAgentId: formExecutorAgentId,
      auditorAgentId: formAuditorAgentId,
      priority: formPriority,
      branchName: formBranch.trim(),
      worktreePath: formWorktree.trim(),
      baseSha: formBaseSha.trim(),
      reservedPort: Number(formPort),
      ownedModules: formModules
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      acceptanceCriteria: formCriteria
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean),
      preflightConfig: {
        ...formPreflightConfig,
        independentAuditorAssigned:
          formPreflightConfig.independentAuditorAssigned &&
          formExecutorAgentId !== formAuditorAgentId,
      },
    };

    const parsed = CreateMissionInputSchema.safeParse(candidatePayload);
    if (!parsed.success) {
      const formattedIssues = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'campo'}: ${issue.message}`)
        .join(' | ');
      setMissionError(`Falha na validação Zod da missão: ${formattedIssues}`);
      return;
    }

    if (parsed.data.executorAgentId === parsed.data.auditorAgentId) {
      setMissionError(
        'Violação Constitucional (Seção 19): O Agente Executor não pode ser o próprio Auditor Independente da missão.'
      );
      return;
    }

    const result = await onCreateMission(parsed.data);

    if (!result.ok) {
      setMissionError(result.error || 'Erro ao criar missão.');
    } else {
      setMissionFeedback(
        `Missão ${parsed.data.code} criada com validação Zod, squad ${parsed.data.squadId}, preflight avaliado e registrada no banco persistente.`
      );
      setFormTitle('');
      setFormCode(`B360-MSN-${String(db.missions.length + 2).padStart(3, '0')}`);
      setFormPort((p) => p + 1);
    }
  };

  // ==========================================================================
  // MÓDULOS 09, 15 & 16: CENTRAL DE MISSÕES, PREFLIGHT, DEPENDÊNCIAS & KANBAN
  // ==========================================================================
  if (
    activeModuleId === 'mod-09' ||
    activeModuleId === 'mod-15' ||
    activeModuleId === 'mod-16'
  ) {
    const preflightEval = selectedMission
      ? evaluateMissionPreflight(selectedMission, db.missions)
      : null;

    return (
      <div className="space-y-8">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Seções 12, 14 e 15 · Máquina de Estados de 23 Etapas · Isolamento Obrigatório & Preflight
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
            {activeModuleId === 'mod-09' &&
              '09. Central de Missões & Máquina de Estados Operacional (23 Etapas)'}
            {activeModuleId === 'mod-15' &&
              '15. Gerenciador de Dependências entre Missões & Fiscalização de Colisões'}
            {activeModuleId === 'mod-16' && '16. Kanban Operacional Sincronizado por Etapa'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Cada missão exige worktree exclusiva, branch exclusiva, SHA base, ownership de módulos,
            porta reservada, schema de banco de testes isolado e auditor independente (proibido que
            o agente executor audite seu próprio trabalho).
          </p>
        </div>

        {/* Máquina de Estados de 23 Etapas da Missão Selecionada */}
        {selectedMission && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
                  MISSÃO SELECIONADA · {selectedMission.code} · {selectedMission.waveId}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedMission.title}
                </h2>
                <div className="text-xs font-mono text-slate-500 mt-1">
                  Branch: {selectedMission.isolation.branchName} · Worktree:{' '}
                  {selectedMission.isolation.worktreePath} · Porta:{' '}
                  {selectedMission.isolation.reservedPort} · SHA HEAD:{' '}
                  {selectedMission.isolation.currentHeadSha.slice(0, 10)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await onTransitionMission(
                      selectedMission.id,
                      'EXECUTAR_PREFLIGHT'
                    );
                    if (!res.ok) setMissionError(res.error || null);
                    else setMissionFeedback('Preflight reavaliado com sucesso.');
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  Reexecutar Preflight
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await onTransitionMission(selectedMission.id, 'AVANCAR_ETAPA');
                    if (!res.ok) setMissionError(res.error || null);
                    else setMissionFeedback('Missão avançada para a próxima etapa do fluxo.');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Avançar Etapa ({selectedMission.stepNumber}/23 →{' '}
                  {Math.min(23, selectedMission.stepNumber + 1)}/23)
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await onTransitionMission(selectedMission.id, 'REPROVAR_ENTREGA');
                    if (!res.ok) setMissionError(res.error || null);
                    else
                      setMissionFeedback(
                        'Entrega reprovada e devolvida automaticamente para a Etapa 16 (Correção).'
                      );
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Reprovar Entrega (Etapa 16)
                </button>
              </div>
            </div>

            {missionError && (
              <div
                role="alert"
                className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-800 dark:text-red-200"
              >
                {missionError}
              </div>
            )}
            {missionFeedback && (
              <div
                role="status"
                className="rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-200"
              >
                {missionFeedback}
              </div>
            )}

            {/* Trilha Visual das 23 Etapas (Seção 12) */}
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Fluxo Operacional Automatizado — 23 Etapas Persistentes (Etapa Atual:{' '}
                {selectedMission.stepNumber})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {MISSION_LIFECYCLE_STEPS.map((st) => {
                  const isCurrent = st.step === selectedMission.stepNumber;
                  const isDone = st.step < selectedMission.stepNumber;
                  return (
                    <div
                      key={st.code}
                      className={`rounded-lg border p-2 text-xs font-mono transition-colors ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-bold'
                          : isDone
                          ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <div className="truncate">{st.label}</div>
                      <div className="text-[11px] opacity-75 truncate">{st.ownerRole}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resultado da Verificação Técnica de Preflight e Isolamento */}
            {preflightEval && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    FISCALIZAÇÃO TÉCNICA DE PREFLIGHT E ISOLAMENTO (18 REQUISITOS)
                  </span>
                  <span
                    className={
                      preflightEval.passed
                        ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                        : 'text-red-600 dark:text-red-400 font-bold'
                    }
                  >
                    {preflightEval.passed
                      ? 'PREFLIGHT APROVADO — EXECUÇÃO LIBERADA'
                      : 'PREFLIGHT BLOQUEADO'}
                  </span>
                </div>
                {!preflightEval.passed && (
                  <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-300 space-y-1">
                    {preflightEval.failedChecks.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                    {preflightEval.isolationConflicts.map((c, i) => (
                      <li key={`conf-${i}`}>{c}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lista de Missões & Formulário de Criação com Isolamento e Validação Zod */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Catálogo de Missões Registradas (Clique para selecionar e operar a máquina de estados)
              </h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {db.missions.map((msn) => (
                <div
                  key={msn.id}
                  onClick={() => setSelectedMissionId(msn.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedMission?.id === msn.id
                      ? 'bg-blue-50/60 dark:bg-blue-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {msn.code} · {msn.waveId} · {msn.squadId || 'SQ-DEV-NUVEM'} · Prioridade{' '}
                      {msn.priority}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      Etapa {msn.stepNumber}/23 · {msn.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {msn.title}
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-500">
                    <div>Worktree: {msn.isolation.worktreePath}</div>
                    <div>Branch: {msn.isolation.branchName}</div>
                    <div>
                      Executor: {msn.executorAgentId} · Auditor: {msn.auditorAgentId}
                    </div>
                  </div>
                  <div className="mt-1.5 text-xs font-mono text-slate-500">
                    Módulos sob Ownership: {msn.isolation.ownedModules.join(', ')} · Especialistas
                    Catarina: {msn.catarinaSpecialistIds.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulário CRUD Real para Criar Nova Missão Isolada (Validação Zod + Preflight) */}
          <form
            onSubmit={handleSubmitNewMission}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Criar Nova Missão Isolada (Com Preflight & Validação Zod)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Contrato validado via CreateMissionInputSchema (identificação, prioridade, squad e preflight)
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label
                  htmlFor="msn-code"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Código (ID)
                </label>
                <input
                  id="msn-code"
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="B360-MSN-003"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="msn-title"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Título da Missão
                </label>
                <input
                  id="msn-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Implementar Fila Persistente de Leases"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="msn-priority"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Prioridade Operacional
                </label>
                <select
                  id="msn-priority"
                  value={formPriority}
                  onChange={(e) =>
                    setFormPriority(
                      e.target.value as 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA'
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="CRITICA">CRITICA (P0)</option>
                  <option value="ALTA">ALTA (P1)</option>
                  <option value="MEDIA">MEDIA (P2)</option>
                  <option value="BAIXA">BAIXA (P3)</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="msn-squad"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Squad Responsável
                </label>
                <select
                  id="msn-squad"
                  value={formSquadId}
                  onChange={(e) => setFormSquadId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  {db.squads.map((sq) => (
                    <option key={sq.id} value={sq.id}>
                      {sq.id} · {sq.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="msn-wave"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Onda Vinculada
                </label>
                <select
                  id="msn-wave"
                  value={formWaveId}
                  onChange={(e) => setFormWaveId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  {db.waves.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="msn-provider"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  IA Executora
                </label>
                <select
                  id="msn-provider"
                  value={formProviderId}
                  onChange={(e) => setFormProviderId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  {db.providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="msn-exec-agent"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Agente Executor
                </label>
                <select
                  id="msn-exec-agent"
                  value={formExecutorAgentId}
                  onChange={(e) => setFormExecutorAgentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  {db.agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} ({a.name.slice(0, 18)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="msn-aud-agent"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Auditor Independente
                </label>
                <select
                  id="msn-aud-agent"
                  value={formAuditorAgentId}
                  onChange={(e) => setFormAuditorAgentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  {db.agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} ({a.name.slice(0, 18)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="msn-branch"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Branch Exclusiva
                </label>
                <input
                  id="msn-branch"
                  type="text"
                  value={formBranch}
                  onChange={(e) => setFormBranch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label
                  htmlFor="msn-port"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Porta Reservada
                </label>
                <input
                  id="msn-port"
                  type="number"
                  value={formPort}
                  onChange={(e) => setFormPort(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="msn-worktree"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Worktree Exclusiva (Isolamento node_modules)
              </label>
              <input
                id="msn-worktree"
                type="text"
                value={formWorktree}
                onChange={(e) => setFormWorktree(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="msn-modules"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Módulos sob Ownership Exclusivo (separados por vírgula)
              </label>
              <input
                id="msn-modules"
                type="text"
                value={formModules}
                onChange={(e) => setFormModules(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Configuração de Preflight Técnico Obrigatório */}
            <fieldset className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3 space-y-1.5">
              <legend className="text-xs font-semibold text-slate-800 dark:text-slate-200 px-1">
                Configuração de Preflight Técnico (Seção 15)
              </legend>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPreflightConfig.repoStateClean}
                  onChange={(e) =>
                    setFormPreflightConfig((prev) => ({
                      ...prev,
                      repoStateClean: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300"
                />
                <span>Repositório limpo e sincronizado com SHA base</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPreflightConfig.exclusiveWorktreeAssigned}
                  onChange={(e) =>
                    setFormPreflightConfig((prev) => ({
                      ...prev,
                      exclusiveWorktreeAssigned: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300"
                />
                <span>Worktree exclusiva alocada sem sobreposição</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPreflightConfig.isolatedMutableDependencies}
                  onChange={(e) =>
                    setFormPreflightConfig((prev) => ({
                      ...prev,
                      isolatedMutableDependencies: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300"
                />
                <span>Dependências mutáveis isoladas (node_modules/.next/dist)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPreflightConfig.noUnsafeSymlinksOrJunctions}
                  onChange={(e) =>
                    setFormPreflightConfig((prev) => ({
                      ...prev,
                      noUnsafeSymlinksOrJunctions: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300"
                />
                <span>Zero junctions, symlinks ou hardlinks inseguros</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPreflightConfig.executionLeaseAcquired}
                  onChange={(e) =>
                    setFormPreflightConfig((prev) => ({
                      ...prev,
                      executionLeaseAcquired: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300"
                />
                <span>Lease de execução e porta reservada adquiridas</span>
              </label>
            </fieldset>

            <button
              type="submit"
              className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              Validar com Zod & Registrar Missão
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MÓDULOS 10 & 17: GERENCIADOR DAS 20 ONDAS (00-19) & CALENDÁRIO
  // ==========================================================================
  if (activeModuleId === 'mod-10' || activeModuleId === 'mod-17') {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Seção 27 · Roadmap Oficial de Construção em 20 Ondas (Onda 00 a Onda 19)
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
            {activeModuleId === 'mod-10'
              ? '10. Gerenciador de Ondas (Ondas 00 a 19 — Escopo, Critérios de Aceite, Riscos e Evidências)'
              : '17. Calendário de Operações & Janelas de Execução'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Cada onda possui escopo delimitado, critérios de aceite verificáveis, dependências,
            prompts associados, checklists, riscos e evidências.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/40">
                  <th className="py-2.5 px-4 font-medium">Onda</th>
                  <th className="py-2.5 px-4 font-medium">Título & Escopo</th>
                  <th className="py-2.5 px-4 font-medium">Critérios de Aceite & Riscos</th>
                  <th className="py-2.5 px-4 font-medium">Evidência Registrada</th>
                  <th className="py-2.5 px-4 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {db.waves.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {w.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {w.title}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 mt-0.5">{w.scope}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <div>Aceite: {w.acceptanceCriteria.join(' · ')}</div>
                      <div className="text-amber-700 dark:text-amber-400 mt-0.5">
                        Risco: {w.risks.join(' · ')}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{w.evidenceSummary}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span
                        className={
                          w.status === 'CONCLUIDA_FUNDACAO'
                            ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                            : w.status === 'EM_ANDAMENTO'
                            ? 'text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-500'
                        }
                      >
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MÓDULOS 11 & 12: PROMPT STUDIO & BIBLIOTECA DE PROMPTS
  // ==========================================================================
  if (activeModuleId === 'mod-11' || activeModuleId === 'mod-12') {
    const handleSavePrompt = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!promptTitle.trim() || !promptObjective.trim() || !promptBody.trim()) {
        setPromptStatusMsg('Preencha o título, objetivo e corpo do prompt.');
        return;
      }
      const res = await onCreatePrompt({
        title: promptTitle.trim(),
        waveId: promptWaveId,
        targetProviderId: promptProviderId,
        targetSquadId: promptSquadId,
        objective: promptObjective.trim(),
        scopeModules: promptModules
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        acceptanceCriteria: promptCriteria
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean),
        promptBody: promptBody.trim(),
      });
      if (res.ok) {
        setPromptStatusMsg('Prompt estruturado versionado e salvo na Biblioteca de Prompts.');
        setPromptTitle('');
        setPromptObjective('');
        setPromptBody('');
      } else {
        setPromptStatusMsg(res.error || 'Falha ao salvar prompt.');
      }
    };

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {activeModuleId === 'mod-11'
              ? '11. Prompt Studio — Compilador de Prompts Constitucionais por Onda'
              : '12. Biblioteca de Prompts Versionados'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Todo prompt gerado injeta automaticamente as restrições permanentes: gasto adicional R$
            0,00, isolamento de worktree/branch e auditoria independente vinculada ao SHA.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <form
            onSubmit={handleSavePrompt}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Compilar Novo Prompt Operacional
            </h2>

            {promptStatusMsg && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-3 text-xs text-blue-800 dark:text-blue-200">
                {promptStatusMsg}
              </div>
            )}

            <div>
              <label
                htmlFor="prm-title"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Título do Prompt
              </label>
              <input
                id="prm-title"
                type="text"
                value={promptTitle}
                onChange={(e) => setPromptTitle(e.target.value)}
                placeholder="Ex: Prompt de Validação Seletiva Onda 14 — Catarina 100"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label
                  htmlFor="prm-wave"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Onda
                </label>
                <select
                  id="prm-wave"
                  value={promptWaveId}
                  onChange={(e) => setPromptWaveId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 text-xs"
                >
                  {db.waves.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="prm-ia"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  IA Alvo
                </label>
                <select
                  id="prm-ia"
                  value={promptProviderId}
                  onChange={(e) => setPromptProviderId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 text-xs"
                >
                  {db.providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} ({p.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="prm-squad"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Squad Alvo
                </label>
                <select
                  id="prm-squad"
                  value={promptSquadId}
                  onChange={(e) => setPromptSquadId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 text-xs"
                >
                  {db.squads.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="prm-obj"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Objetivo Técnico
              </label>
              <input
                id="prm-obj"
                type="text"
                value={promptObjective}
                onChange={(e) => setPromptObjective(e.target.value)}
                placeholder="Descreva o objetivo verificável da missão/onda..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="prm-body"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Instruções Detalhadas do Prompt
              </label>
              <textarea
                id="prm-body"
                rows={4}
                value={promptBody}
                onChange={(e) => setPromptBody(e.target.value)}
                placeholder="Instruções passo a passo para a IA executora ou coordenadora..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Salvar Prompt na Biblioteca Persistente
            </button>
          </form>

          <div className="space-y-4">
            {db.prompts.map((prm) => (
              <div
                key={prm.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>
                    {prm.id} · v{prm.version} · {prm.waveId}
                  </span>
                  <span>
                    Alvo: {prm.targetProviderId} / {prm.targetSquadId}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {prm.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">{prm.objective}</p>
                <pre className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {prm.promptBody}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MÓDULOS 13, 14, 18, 19 & 20: CHECKLISTS, HANDOFFS, AUTOMAÇÃO E APROVAÇÕES
  // ==========================================================================
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {activeModuleId === 'mod-13' && '13. Gerenciador de Checklists Persistentes'}
          {activeModuleId === 'mod-14' && '14. Central de Handoffs entre IAs, Devin e Catarina'}
          {activeModuleId === 'mod-18' &&
            '18. Motor de Automação Independente de Sessão de Chat (Filas, Leases e Heartbeats)'}
          {activeModuleId === 'mod-19' && '19. Central de Notificações Operacionais'}
          {activeModuleId === 'mod-20' &&
            '20. Central de Aprovações Humanas (Exclusivo Orquestrador Humano)'}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Automação persistente com suporte a ambientes locais e remotos. Se o computador Windows
          estiver desligado, as missões locais permanecem preservadas na fila em estado{' '}
          <span className="font-mono">AGUARDANDO_MAQUINA_LOCAL</span>.
        </p>
      </div>

      {/* Checklists Persistentes Interativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {db.checklists.map((chk) => (
          <div
            key={chk.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span>
                {chk.id} · {chk.waveId}
              </span>
              <span>{chk.category}</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{chk.title}</h2>
            <div className="space-y-2 pt-2">
              {chk.items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggleChecklistItem(chk.id, item.id)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div
                      className={`font-medium ${
                        item.checked
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-slate-500 font-mono mt-0.5">
                      {item.checked
                        ? `Verificado por ${item.verifiedBy || 'Auditor'} · ${item.evidenceNote || ''}`
                        : `Pendente · ${item.evidenceNote || ''}`}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fila Persistente do Motor de Automação (Seção 13) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Fila Persistente do Motor de Automação (Leases, Heartbeats e Prevenção de Duplicidade)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ChatGPT (IA-05) e Claude (IA-06) atuam como coordenadores de automação; a
              indisponibilidade de uma IA não interrompe o motor central
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/40">
                <th className="py-2.5 px-4 font-medium">Job / Tarefa Persistente</th>
                <th className="py-2.5 px-4 font-medium">Gatilho & Coordenador</th>
                <th className="py-2.5 px-4 font-medium">Ambiente Alvo</th>
                <th className="py-2.5 px-4 font-medium">Idempotência / Lease</th>
                <th className="py-2.5 px-4 font-medium text-right">Estado / Retries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {db.automationJobs.map((job) => (
                <tr key={job.id}>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {job.id} · {job.title}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                    {job.triggerType} · Coord: {job.coordinatorProviderId}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {job.targetEnvironment}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    <div>Key: {job.idempotencyKey}</div>
                    <div>Lease: {job.leaseOwner || 'Aguardando worker'}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    <div className="font-semibold text-blue-600 dark:text-blue-400">
                      {job.status}
                    </div>
                    <div className="text-slate-500">
                      Tentativas: {job.retryCount}/{job.maxRetries}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
