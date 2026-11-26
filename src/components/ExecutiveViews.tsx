import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Cloud,
  Cpu,
  GitBranch,
  HardDrive,
  Lock,
  Monitor,
  Shield,
  ShieldAlert,
  Users,
} from 'lucide-react';
import {
  AIProvider,
  B360DatabaseState,
  OFFICIAL_40_MODULES,
  OperationalAgent,
} from '../shared/contracts';

interface ExecutiveViewsProps {
  activeModuleId: string;
  db: B360DatabaseState;
  adapterDiagnostics: Array<{
    providerId: string;
    providerName: string;
    checkedAt: string;
    reachable: boolean;
    mode: string;
    diagnosticMessage: string;
  }>;
  onSelectModule: (moduleId: string) => void;
  onToggleKillSwitch: (suspend: boolean, reason: string) => Promise<void>;
}

export const ExecutiveViews: React.FC<ExecutiveViewsProps> = ({
  activeModuleId,
  db,
  adapterDiagnostics,
  onSelectModule,
  onToggleKillSwitch,
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<string>('IA-07');
  const [agentSearch, setAgentSearch] = useState<string>('');
  const [selectedSquadFilter, setSelectedSquadFilter] = useState<string>('TODOS');
  const [killReason, setKillReason] = useState<string>(
    'Verificação preventiva solicitada pelo Orquestrador Humano'
  );

  const selectedProvider: AIProvider =
    db.providers.find((p) => p.id === selectedProviderId) || db.providers[0];

  const activeMissions = db.missions.filter((m) => m.status !== 'CONCLUIDA');
  const blockedMissions = db.missions.filter((m) => m.status === 'BLOQUEADA_ISOLAMENTO');
  const pendingAudits = db.audits.filter((a) => a.state === 'EM_AUDITORIA' || a.state === 'PENDENTE');
  const rejectedAudits = db.audits.filter((a) => a.state === 'REPROVADA');
  const activeWaves = db.waves.filter((w) => w.status === 'EM_ANDAMENTO' || w.status === 'CONCLUIDA_FUNDACAO');

  // ==========================================================================
  // MÓDULO 01 & MÓDULO 02: GLOBAL COMMAND CENTER & DASHBOARD EXECUTIVO
  // ==========================================================================
  if (activeModuleId === 'mod-01' || activeModuleId === 'mod-02') {
    return (
      <div className="space-y-8">
        {/* Banner de Identificação Transparente (Regra Seção 24: Dados demonstrativos vs Estado real) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Birthub 360 — AI Operations Center (B360-AOC) · Repositório Independente:{' '}
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {db.governance.operationsRepo}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
                {activeModuleId === 'mod-01'
                  ? '01. Global Command Center — Arquitetura Híbrida em 3 Ambientes'
                  : '02. Dashboard Executivo & Estado Real da Operação'}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                Autoridade Máxima: {db.governance.humanOrchestratorAuthority}. Política Financeira
                Permanente: R$ 0,00 em gastos adicionais. Os registros iniciais de missões e
                auditorias abaixo constituem a semente operacional verificável (identificada como
                carga fundacional); nenhuma integração externa desconectada é simulada como ativa.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onSelectModule('mod-09')}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0"
              >
                Orquestrar Missão (23 Etapas)
              </button>
              <button
                type="button"
                onClick={() => onSelectModule('mod-03')}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                Importar Conversas Drive
              </button>
            </div>
          </div>
        </div>

        {/* Arquitetura Operacional em 3 Ambientes (Seção 5) */}
        <section aria-label="Arquitetura Híbrida em Três Ambientes">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Topologia Híbrida Constitucional (Nuvem · Máquina Local Windows · GitHub)
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Isolamento de Repositório Principal Ativo
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Ambiente 1: Nuvem */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 min-w-0">
                    <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate">Ambiente 1 — Nuvem (Produção)</span>
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
                    OPERACIONAL
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Responsável por planejamento, desenvolvimento, comunicação entre IAs, motor de
                  automação, geração de prompts, memória em 10 níveis e produção de entregas.
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div>IAs de Nuvem Registradas: 9 ferramentas (IA-01 a IA-09)</div>
                  <div>Hospedagem Atual: Google AI Studio Container · Pronto para Cloudflare D1</div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-500 truncate">Astra (00) · Squad Comando</span>
                <button
                  type="button"
                  onClick={() => onSelectModule('mod-04')}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  Inspecionar IAs <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>

            {/* Ambiente 2: Máquina Local Windows (Devin + Catarina 100) */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 min-w-0">
                    <Monitor className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">Ambiente 2 — Local (Windows / Devin)</span>
                  </span>
                  <span className="font-mono text-amber-700 dark:text-amber-400 whitespace-nowrap shrink-0">
                    PONTE DESABILITADA
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Devin (IA-10) coordena o Squad de Auditoria Local e Catarina (Agente 100) para
                  homologar entregas da nuvem nas unidades C: e D: sem instalar as demais IAs.
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div>Protocolo: Conexão de saída autenticada (Zero terminal exposto)</div>
                  <div>Estado Contratual Devin: Verificação obrigatória pendente (Seção 4/16)</div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-500 truncate">Devin (IA-10) · Catarina (100)</span>
                <button
                  type="button"
                  onClick={() => onSelectModule('mod-21')}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  Devin Command <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>

            {/* Ambiente 3: GitHub */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 min-w-0">
                    <GitBranch className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Ambiente 3 — GitHub & Quality Gates</span>
                  </span>
                  <span className="font-mono text-blue-700 dark:text-blue-400 whitespace-nowrap shrink-0">
                    SOMENTE LEITURA
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Versionamento, branches exclusivas, Pull Requests e GitHub Actions. Produto
                  principal protegido contra qualquer modificação durante a construção da Central.
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="truncate">Produto: {db.governance.primaryProductRepo}</div>
                  <div>Central: {db.governance.operationsRepo} (Modo Seguro Ativo)</div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-500 truncate">Agente 60 · Squad Integração</span>
                <button
                  type="button"
                  onClick={() => onSelectModule('mod-31')}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  Git Integration <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Grade de Indicadores Executivos Obrigatórios (Seção 24 — Tabular Numerals, Zero Pill Clutter) */}
        <section aria-label="Indicadores Executivos da Operação">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Telemetria Verificada do Centro de Operações
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">IAs Oficiais</div>
              <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                {db.providers.length}
              </div>
              <div className="mt-1 text-xs text-slate-500">IA-01 a IA-10 cadastradas</div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Agentes & Squads</div>
              <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                {db.agents.length} / {db.squads.length}
              </div>
              <div className="mt-1 text-xs text-slate-500">Astra (00) a Catarina (100)</div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Missões Ativas / Bloq.</div>
              <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                {activeMissions.length} /{' '}
                <span className="text-amber-600 dark:text-amber-400">{blockedMissions.length}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">Preflight & Worktree ativa</div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Ondas Fundacionais</div>
              <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                {activeWaves.length} / {db.waves.length}
              </div>
              <div className="mt-1 text-xs text-slate-500">Ondas 00 a 19 estruturadas</div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Auditorias Pend. / Repr.</div>
              <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                {pendingAudits.length} /{' '}
                <span className="text-red-600 dark:text-red-400">{rejectedAudits.length}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">Vinculadas ao SHA auditado</div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Gasto Adicional</div>
              <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                R$ 0,00
              </div>
              <div className="mt-1 text-xs text-slate-500">Trava constitucional ativa</div>
            </div>
          </div>
        </section>

        {/* Tabela de Missões Ativas & Bloqueadas + Painel de Suspensão Emergencial */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Missões em Execução, Auditoria e Preflight
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Isolamento de worktree, branch exclusiva, porta reservada e auditor independente
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectModule('mod-09')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
              >
                Abrir Central de Missões
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-950/40">
                    <th className="py-2.5 px-4 font-medium">Código / Missão</th>
                    <th className="py-2.5 px-4 font-medium">Executor vs Auditor</th>
                    <th className="py-2.5 px-4 font-medium">Isolamento (Branch / Porta)</th>
                    <th className="py-2.5 px-4 font-medium text-right">Etapa / Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {db.missions.map((msn) => (
                    <tr
                      key={msn.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {msn.code} · {msn.waveId}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 mt-0.5">{msn.title}</div>
                        {msn.rejectionReason && (
                          <div className="text-amber-700 dark:text-amber-400 mt-1">
                            Motivo: {msn.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        <div>Exec: {msn.executorProviderId} / {msn.executorAgentId}</div>
                        <div>Aud: {msn.auditorAgentId} (Indep.)</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                        <div>{msn.isolation.branchName}</div>
                        <div>
                          Porta {msn.isolation.reservedPort} · SHA {msn.isolation.currentHeadSha.slice(0, 8)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          Etapa {msn.stepNumber}/23
                        </div>
                        <div
                          className={
                            msn.status === 'BLOQUEADA_ISOLAMENTO' || msn.status === 'REPROVADA_AUDITORIA'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }
                        >
                          {msn.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Controle Constitucional de Emergência & Últimos Logs Auditados */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 min-w-0">
                  <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span className="truncate">Controle de Suspensão Emergencial</span>
                </h3>
                <span className="text-xs font-mono text-slate-500 whitespace-nowrap shrink-0">
                  Seção 10 & 22
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Permite ao Orquestrador Humano suspender instantaneamente todas as filas do motor de
                automação, transições de estado e despachos entre IAs.
              </p>

              <div className="space-y-2 pt-1">
                <label
                  htmlFor="kill-switch-reason"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Motivo da Deliberação Humana
                </label>
                <input
                  id="kill-switch-reason"
                  type="text"
                  value={killReason}
                  onChange={(e) => setKillReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() =>
                    onToggleKillSwitch(!db.governance.globalAutomationSuspended, killReason)
                  }
                  className={`w-full py-2 px-4 rounded-lg text-xs font-semibold transition-colors ${
                    db.governance.globalAutomationSuspended
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {db.governance.globalAutomationSuspended
                    ? 'Retomar Operação Global das Automações'
                    : 'Acionar Suspensão Global de Automações'}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Trilha de Auditoria Imutável Recente
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {db.governance.auditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="text-xs text-slate-600 dark:text-slate-400">
                    <div className="font-mono text-slate-800 dark:text-slate-200">
                      {log.action} · {log.actor}
                    </div>
                    <div className="truncate text-slate-500">
                      {log.target} · Ref: {log.shaOrRef.slice(0, 14)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Catálogo Completo dos 40 Módulos Obrigatórios (Acesso Direto) */}
        <section aria-label="Mapa dos 40 Módulos Obrigatórios da Plataforma">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Arquitetura dos 40 Módulos Obrigatórios (Seção 7)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clique em qualquer um dos 40 módulos abaixo para acessar seu painel operacional dedicado
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {OFFICIAL_40_MODULES.map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => onSelectModule(mod.id)}
                className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-500 p-3.5 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span>MÓDULO {String(mod.number).padStart(2, '0')}</span>
                    <span>{mod.waveIntroduced}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {mod.title}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {mod.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between text-xs font-mono">
                  <span
                    className={
                      mod.status === 'OPERACIONAL'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : mod.status === 'MODO_SEGURO_LEITURA'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }
                  >
                    {mod.status}
                  </span>
                  <span className="text-slate-400">Abrir →</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ==========================================================================
  // MÓDULOS 04, 05 & 39: GERENCIADOR DE IAs, ASSINATURAS E CONTROLE FINANCEIRO
  // ==========================================================================
  if (activeModuleId === 'mod-04' || activeModuleId === 'mod-05' || activeModuleId === 'mod-39') {
    const diag = adapterDiagnostics.find((d) => d.providerId === selectedProvider.id);

    return (
      <div className="space-y-8">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Seções 3, 4, 21 e 26 · Separar Provedores de IA de Contas, Agentes, Squads e Sessões
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
            {activeModuleId === 'mod-04' && '04. Gerenciador das 10 Inteligências Artificiais Oficiais & Adaptadores'}
            {activeModuleId === 'mod-05' && '05. Gerenciador de Contas e Assinaturas Existentes'}
            {activeModuleId === 'mod-39' && '39. Central Financeira e Consumo (Política Constitucional R$ 0,00)'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Limite de despesas adicionais: <strong className="font-mono">R$ 0,00</strong>. Compra
            automática de créditos, upgrades pagos e rotação abusiva de contas estão tecnicamente
            bloqueados. Quando uma capacidade programática não está configurada, o adaptador retorna
            estado explícito de <span className="font-mono">MODO_ASSISTIDO</span>,{' '}
            <span className="font-mono">NAO_CONFIGURADO</span> ou{' '}
            <span className="font-mono">NAO_SUPORTADO</span>.
          </p>
        </div>

        {/* Tabela das 10 Inteligências Artificiais Oficiais */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Catálogo Oficial de Inteligências Artificiais (IA-01 a IA-10)
              </h2>
              <span className="text-xs font-mono text-slate-500">Clique para inspecionar adaptador</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/40">
                    <th className="py-2.5 px-4 font-medium">ID / Ferramenta</th>
                    <th className="py-2.5 px-4 font-medium">Ambiente Oficial</th>
                    <th className="py-2.5 px-4 font-medium">Assinatura Vinculada</th>
                    <th className="py-2.5 px-4 font-medium text-right">Inbox/Outbox · Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {db.providers.map((prov) => (
                    <tr
                      key={prov.id}
                      onClick={() => setSelectedProviderId(prov.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedProvider.id === prov.id
                          ? 'bg-blue-50/70 dark:bg-blue-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {prov.id} · {prov.name}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {prov.roleDescription}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {prov.environment}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {prov.subscriptionSummary}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <div className="text-slate-700 dark:text-slate-300">
                          In: {prov.inboxCount} / Out: {prov.outboxCount}
                        </div>
                        <div
                          className={
                            prov.connectionStatus === 'CONECTADO_API_LOCAL'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : prov.connectionStatus === 'MODO_ASSISTIDO_HUMANO'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }
                        >
                          {prov.connectionStatus}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matriz de Capacidades Reais do Adaptador (Seção 26) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div>
              <div className="text-xs font-mono text-blue-600 dark:text-blue-400">
                CONTRATO DE ADAPTADOR · {selectedProvider.id}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {selectedProvider.name} — Capacidades Declaradas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedProvider.integrationNotes}
              </p>
            </div>

            {diag && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs space-y-1">
                <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  Diagnóstico: {diag.mode}
                </div>
                <div className="text-slate-600 dark:text-slate-400">{diag.diagnosticMessage}</div>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                10 Capacidades Obrigatórias do Adaptador (Seção 26):
              </div>
              {Object.entries(selectedProvider.capabilities).map(([capKey, capStatus]) => (
                <div
                  key={capKey}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/70"
                >
                  <span className="text-slate-700 dark:text-slate-300 font-mono">{capKey}</span>
                  <span
                    className={`font-mono font-semibold ${
                      capStatus === 'SUPORTADO'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : capStatus === 'MODO_ASSISTIDO'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {capStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Assinaturas Disponíveis & Governança Financeira R$ 0,00 */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Assinaturas Existentes do Proprietário & Política de Gasto Adicional R$ 0,00 (Seção 4 e 21)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nenhuma métrica financeira inexistente é inventada quando o provedor não expõe telemetria de faturamento via API gratuita
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">
              LIMITE ADICIONAL: R$ 0,00
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/40">
                  <th className="py-2.5 px-4 font-medium">Assinatura / Plano</th>
                  <th className="py-2.5 px-4 font-medium text-right">Qtd. Contas</th>
                  <th className="py-2.5 px-4 font-medium">Estado da Cota</th>
                  <th className="py-2.5 px-4 font-medium">Regra Anti-Abuso e Renovação</th>
                  <th className="py-2.5 px-4 font-medium text-right">Gasto Extra (BRL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {db.subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {sub.title} ({sub.providerId})
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                      {sub.quantity}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={
                          sub.quotaStatus === 'DISPONIVEL'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {sub.quotaStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <div>{sub.renewalPolicy}</div>
                      <div className="text-slate-500">{sub.antiAbuseRule}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                      R$ {sub.currentAdditionalSpendBrl.toFixed(2)} / R${' '}
                      {sub.additionalCostLimitBrl.toFixed(2)}
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
  // MÓDULOS 06, 07 & 08: AGENTES (00-100), 8 SQUADS OFICIAIS & ORGANOGRAMA
  // ==========================================================================
  const filteredAgents: OperationalAgent[] = db.agents.filter((ag) => {
    const matchesSquad = selectedSquadFilter === 'TODOS' || ag.squadId === selectedSquadFilter;
    const q = agentSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      ag.name.toLowerCase().includes(q) ||
      ag.specialty.toLowerCase().includes(q) ||
      ag.id.toLowerCase().includes(q);
    return matchesSquad && matchesQuery;
  });

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Seções 10 e 11 · Preservação Constitucional da Identidade e Numeração dos Agentes (00 a 100)
        </div>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
          {activeModuleId === 'mod-06' && '06. Gerenciador de Agentes Operacionais (Agente 00 Astra ao Agente 100 Catarina)'}
          {activeModuleId === 'mod-07' && '07. Gerenciador dos 8 Squads Operacionais Oficiais'}
          {activeModuleId === 'mod-08' && '08. Organograma Operacional & Cadeia de Comando Constitucional'}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Não inventamos nomes para substituir o catálogo oficial de 100 agentes. Cada agente possui
          ownership explícito de módulos, provedor de IA associado, instruções permanentes e
          restrições de separação de funções.
        </p>
      </div>

      {/* Organograma Operacional (Sempre visível no mod-08 ou resumo nos demais) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Cadeia de Comando Constitucional (Organograma Operacional)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-4">
            <div className="font-mono text-blue-700 dark:text-blue-400 font-semibold">
              NÍVEL 1 · AUTORIDADE MÁXIMA
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
              Orquestrador Humano (Marcelo)
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Deliberação final sobre merges, deploys, contratos, exceções e Kill Switch global.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <div className="font-mono text-slate-500 font-semibold">
              NÍVEL 2 · COMANDO & PLANEJAMENTO
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
              Agente 00 — Astra & Squad Comando
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Decomposição em ondas, geração de prompts/checklists e coordenação na Nuvem (ChatGPT/Claude/Gemini).
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <div className="font-mono text-slate-500 font-semibold">
              NÍVEL 3 · EXECUÇÃO NUVEM vs LOCAL
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
              Squad Dev Nuvem ↔ Devin (Windows)
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Nuvem produz em branches isoladas; Devin recebe localmente para testes reais nas unidades C: e D:.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <div className="font-mono text-slate-500 font-semibold">
              NÍVEL 4 · HOMOLOGAÇÃO & GIT
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
              Catarina (100) · Auditores · Squad Git
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Validação especializada seletiva, aprovação vinculada ao SHA e Pull Request controlado.
            </p>
          </div>
        </div>
      </div>

      {/* Os 8 Squads Operacionais Oficiais (Seção 11) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Os 8 Squads Operacionais Oficiais (Clique para filtrar agentes)
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedSquadFilter('TODOS')}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                selectedSquadFilter === 'TODOS'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Todos os Squads ({db.squads.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {db.squads.map((sq) => (
            <button
              key={sq.id}
              type="button"
              onClick={() =>
                setSelectedSquadFilter(selectedSquadFilter === sq.id ? 'TODOS' : sq.id)
              }
              className={`text-left rounded-xl border p-4 transition-colors ${
                selectedSquadFilter === sq.id
                  ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>{sq.id}</span>
                <span>{sq.environment}</span>
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                {sq.name}
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {sq.missionScope}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-500">
                Coord: {sq.coordinatorAgentId} ({sq.coordinatorProviderId})
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Catálogo de Agentes Operacionais */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Agentes Operacionais Registrados ({filteredAgents.length} exibidos · Numeração 00 a 100 preservada)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Separados de provedores de IA, contas e sessões de execução
            </p>
          </div>
          <input
            type="text"
            value={agentSearch}
            onChange={(e) => setAgentSearch(e.target.value)}
            placeholder="Filtrar agente por número, nome ou especialidade..."
            aria-label="Filtrar agentes operacionais"
            className="w-full sm:w-72 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/40">
                <th className="py-2.5 px-4 font-medium">ID / Agente Oficial</th>
                <th className="py-2.5 px-4 font-medium">Squad & IA Associada</th>
                <th className="py-2.5 px-4 font-medium">Especialidade & Ownership</th>
                <th className="py-2.5 px-4 font-medium">Instrução Permanente</th>
                <th className="py-2.5 px-4 font-medium text-right">Estado / Missões</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredAgents.map((ag) => (
                <tr key={ag.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      #{String(ag.number).padStart(2, '0')} · {ag.name}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">{ag.operationalPersona}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    <div>{ag.squadId}</div>
                    <div className="text-slate-500">Provedor: {ag.associatedProviderId}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {ag.specialty}
                    </div>
                    <div className="font-mono text-slate-500 mt-0.5">
                      Módulos: {ag.ownedModules.join(', ')}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs">
                    {ag.permanentInstructions}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {ag.operationalState}
                    </div>
                    <div className="text-slate-500">
                      Concluídas: {ag.completedMissionsCount}
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
