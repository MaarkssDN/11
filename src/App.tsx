import React, { useEffect, useState, useCallback } from 'react';
import {
  AlertOctagon,
  BookOpen,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Cpu,
  GitBranch,
  LayoutDashboard,
  Layers,
  MessageSquare,
  Monitor,
  Moon,
  Search,
  Shield,
  Sun,
  Terminal,
  Users,
} from 'lucide-react';
import {
  B360DatabaseState,
  CreateMissionInput,
  ModuleCategory,
  OFFICIAL_40_MODULES,
  SendMessageInput,
} from './shared/contracts';
import { apiFetch } from './mocks/browser';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { ExecutiveViews } from './components/ExecutiveViews';
import { ExecutionViews } from './components/ExecutionViews';
import { LocalAndGovernanceViews } from './components/LocalAndGovernanceViews';

const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  COMANDO_E_GESTAO: 'Comando e gestão',
  PLANEJAMENTO_E_EXECUCAO: 'Planejamento e execução',
  OPERACAO_LOCAL_E_QUALIDADE: 'Operação local e qualidade',
  INTEGRACAO_SEGURANCA_E_CONHECIMENTO: 'Integração, segurança e conhecimento',
};

const CATEGORY_ORDER: ModuleCategory[] = [
  'COMANDO_E_GESTAO',
  'PLANEJAMENTO_E_EXECUCAO',
  'OPERACAO_LOCAL_E_QUALIDADE',
  'INTEGRACAO_SEGURANCA_E_CONHECIMENTO',
];

const EXECUTIVE_MODULE_IDS = new Set([
  'mod-01',
  'mod-02',
  'mod-04',
  'mod-05',
  'mod-06',
  'mod-07',
  'mod-08',
  'mod-39',
]);

const EXECUTION_MODULE_IDS = new Set([
  'mod-09',
  'mod-10',
  'mod-11',
  'mod-12',
  'mod-13',
  'mod-14',
  'mod-15',
  'mod-16',
  'mod-17',
  'mod-18',
  'mod-19',
  'mod-20',
]);

function getModuleIcon(moduleId: string) {
  switch (moduleId) {
    case 'mod-01':
      return Layers;
    case 'mod-02':
      return LayoutDashboard;
    case 'mod-03':
      return MessageSquare;
    case 'mod-04':
    case 'mod-05':
      return Cpu;
    case 'mod-06':
    case 'mod-07':
    case 'mod-08':
      return Users;
    case 'mod-09':
    case 'mod-15':
    case 'mod-16':
    case 'mod-18':
      return Terminal;
    case 'mod-11':
    case 'mod-12':
    case 'mod-35':
      return BookOpen;
    case 'mod-13':
    case 'mod-20':
    case 'mod-23':
    case 'mod-24':
    case 'mod-30':
      return CheckSquare;
    case 'mod-21':
    case 'mod-25':
    case 'mod-27':
    case 'mod-28':
    case 'mod-29':
      return Monitor;
    case 'mod-26':
    case 'mod-31':
    case 'mod-32':
    case 'mod-33':
      return GitBranch;
    default:
      return Shield;
  }
}

export default function App() {
  const [db, setDb] = useState<B360DatabaseState | null>(null);
  const [adapterDiagnostics, setAdapterDiagnostics] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeModuleId, setActiveModuleId] = useState<string>('mod-02');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<ModuleCategory | 'TODOS'>('TODOS');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  const fetchState = useCallback(async () => {
    try {
      const res = await apiFetch('/api/state');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDb(data.db);
      setAdapterDiagnostics(data.adapterDiagnostics || []);
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err?.message || 'Erro ao carregar estado da Central B360-AOC.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleToggleKillSwitch = async (suspend: boolean, reason: string) => {
    const res = await apiFetch('/api/governance/kill-switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suspend, reason }),
    });
    if (res.ok) {
      await fetchState();
    }
  };

  const handleCreateMission = async (input: CreateMissionInput) => {
    const res = await apiFetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'Falha ao criar missão.' };
    }
    await fetchState();
    return { ok: true };
  };

  const handleTransitionMission = async (
    missionId: string,
    action: 'EXECUTAR_PREFLIGHT' | 'AVANCAR_ETAPA' | 'REPROVAR_ENTREGA' | 'INVALIDAR_POR_NOVO_COMMIT',
    newCommitSha?: string
  ) => {
    const res = await apiFetch(`/api/missions/${missionId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, newCommitSha }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'Falha na transição de estado.' };
    }
    await fetchState();
    return { ok: true };
  };

  const handleToggleChecklistItem = async (checklistId: string, itemId: string) => {
    await apiFetch(`/api/checklists/${checklistId}/items/${itemId}/toggle`, {
      method: 'POST',
    });
    await fetchState();
  };

  const handleCreatePrompt = async (payload: any) => {
    const res = await apiFetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    await fetchState();
    return { ok: true };
  };

  const handleSendMessage = async (input: SendMessageInput) => {
    const res = await apiFetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    await fetchState();
    return { ok: true };
  };

  const handleImportConversation = async (payload: { fileName: string; rawText: string }) => {
    const res = await apiFetch('/api/conversations/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    await fetchState();
    return { ok: true, idempotent: Boolean(data.idempotentReimport) };
  };

  const handleSubmitAuditVerdict = async (auditId: string, payload: any) => {
    const res = await apiFetch(`/api/audits/${auditId}/verdict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    await fetchState();
    return { ok: true };
  };

  const handleCreateMemory = async (payload: any) => {
    const res = await apiFetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    await fetchState();
    return { ok: true };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 p-6">
        <div className="max-w-md w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
          <div className="text-xs font-mono text-blue-600 dark:text-sky-400">
            B360-AOC · INICIALIZANDO CENTRO DE COMANDO
          </div>
          <div className="text-base font-bold text-blue-700 dark:text-sky-400">
            Carregando módulos operacionais, 10 IAs oficiais e estado persistente...
          </div>
          <div className="h-2 w-full rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full w-2/3 bg-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 p-6">
        <div className="max-w-md w-full rounded-xl border border-red-300 dark:border-red-900 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="text-sm font-bold text-red-600 dark:text-red-400">
            Falha de Conexão com o Servidor B360-AOC
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">{loadError}</p>
          <button
            type="button"
            onClick={fetchState}
            className="px-4 py-2 rounded-lg bg-blue-600 text-sky-100 text-xs font-semibold"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const currentModule =
    OFFICIAL_40_MODULES.find((m) => m.id === activeModuleId) || OFFICIAL_40_MODULES[1];

  const categoriesToDisplay =
    activeCategoryTab === 'TODOS' ? CATEGORY_ORDER : [activeCategoryTab];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300">
      {/* Sidebar Corporativa Recolhível com todos os Módulos em Ordem Oficial (Sem numeração 1-40) */}
      <aside
        aria-label="Navegação Principal dos Módulos B360-AOC"
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-72'
        } shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between transition-all`}
      >
        {/* Identidade B360-AOC */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-sm font-bold tracking-tight text-blue-700 dark:text-sky-400 truncate">
                  BIRTHUB 360 · AOC
                </div>
                <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 truncate">
                  B360-AOC · AI Operations Center
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Filtro por Domínio + Lista Integral Ordenada dos Módulos (Sem Numeração 1 a 40) */}
          {!sidebarCollapsed && (
            <div className="p-3 flex-1 flex flex-col min-h-0">
              <div className="px-2 pb-1.5 text-[11px] font-mono font-semibold text-blue-700 dark:text-sky-400">
                MÓDULOS DA PLATAFORMA
              </div>
              <select
                aria-label="Filtrar módulos por domínio"
                value={activeCategoryTab}
                onChange={(e) => setActiveCategoryTab(e.target.value as any)}
                className="w-full mb-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-blue-700 dark:text-sky-300 font-medium shrink-0"
              >
                <option value="TODOS">Todos os Módulos</option>
                <option value="COMANDO_E_GESTAO">{CATEGORY_LABELS.COMANDO_E_GESTAO}</option>
                <option value="PLANEJAMENTO_E_EXECUCAO">
                  {CATEGORY_LABELS.PLANEJAMENTO_E_EXECUCAO}
                </option>
                <option value="OPERACAO_LOCAL_E_QUALIDADE">
                  {CATEGORY_LABELS.OPERACAO_LOCAL_E_QUALIDADE}
                </option>
                <option value="INTEGRACAO_SEGURANCA_E_CONHECIMENTO">
                  {CATEGORY_LABELS.INTEGRACAO_SEGURANCA_E_CONHECIMENTO}
                </option>
              </select>

              <nav
                aria-label="Lista ordenada de módulos"
                className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[calc(100vh-14rem)]"
              >
                {categoriesToDisplay.map((categoryKey) => {
                  const categoryModules = OFFICIAL_40_MODULES.filter(
                    (m) => m.category === categoryKey
                  );
                  return (
                    <div key={categoryKey} className="space-y-1">
                      <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {CATEGORY_LABELS[categoryKey]}
                      </div>
                      {categoryModules.map((mod) => {
                        const Icon = getModuleIcon(mod.id);
                        const active = activeModuleId === mod.id;
                        return (
                          <button
                            key={mod.id}
                            type="button"
                            onClick={() => setActiveModuleId(mod.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                              active
                                ? 'bg-blue-600/15 dark:bg-sky-500/20 text-blue-700 dark:text-sky-300 border border-blue-500/30 font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-sky-300'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-sky-400" />
                            <span className="truncate">{mod.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Rodapé Constitucional da Sidebar */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 space-y-1 shrink-0">
            <div>Política Adicional: R$ 0,00</div>
            <div>Git Principal: Somente Leitura</div>
            <div>Devin Windows: Desabilitado</div>
          </div>
        )}
      </aside>

      {/* Área Principal (Top Bar Contract + Viewport) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract (3 Zonas: Breadcrumb Contextual · Links Rápidos de Domínio · Command Palette & Tema) */}
        <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-8">
          {/* Zona 1: Breadcrumb Contextual */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
            <span className="font-bold text-blue-700 dark:text-sky-400">B360-AOC</span>
            <span aria-hidden="true">/</span>
            <span className="text-indigo-600 dark:text-indigo-400">
              {CATEGORY_LABELS[currentModule.category]}
            </span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-blue-600 dark:text-sky-400 truncate max-w-xs">
              {currentModule.title}
            </span>
          </div>

          {/* Zona 2: 4 Links Concisos de Domínio (Single-line) */}
          <nav
            aria-label="Pilares Operacionais"
            className="hidden xl:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300"
          >
            <button
              type="button"
              onClick={() => setActiveModuleId('mod-02')}
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0"
            >
              Comando
            </button>
            <button
              type="button"
              onClick={() => setActiveModuleId('mod-09')}
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0"
            >
              Missões
            </button>
            <button
              type="button"
              onClick={() => setActiveModuleId('mod-23')}
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0"
            >
              Auditoria
            </button>
            <button
              type="button"
              onClick={() => setActiveModuleId('mod-34')}
              className="hover:text-blue-600 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0"
            >
              Governança
            </button>
          </nav>

          {/* Zona 3: Pesquisa Global / Command Palette & Tema */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-blue-700 dark:text-sky-400 transition-colors whitespace-nowrap shrink-0"
              aria-label="Abrir Command Palette e Pesquisa Global"
            >
              <Search className="w-3.5 h-3.5 text-blue-500 dark:text-sky-400" />
              <span>Command Palette (Ctrl+K)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-700 dark:text-sky-400 transition-colors shrink-0"
              aria-label={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Alerta Global se o Kill Switch estiver ativo */}
        {db.governance.globalAutomationSuspended && (
          <div
            role="alert"
            className="bg-red-950/90 text-red-200 border-b border-red-800 px-6 py-2.5 text-xs font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0 text-red-400" />
              SUSPENSÃO EMERGENCIAL GLOBAL ATIVA (KILL SWITCH): Todas as filas de automação e
              novas transições estão pausadas. Motivo: {db.governance.emergencyKillSwitchReason}
            </span>
            <button
              type="button"
              onClick={() =>
                handleToggleKillSwitch(false, 'Retomada autorizada pelo Orquestrador Humano')
              }
              className="px-3 py-1 rounded bg-red-800 text-amber-200 font-bold text-xs whitespace-nowrap"
            >
              Retomar Operação
            </button>
          </div>
        )}

        {/* Conteúdo Principal do Módulo Selecionado */}
        <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto">
          {EXECUTIVE_MODULE_IDS.has(activeModuleId) ? (
            <ExecutiveViews
              activeModuleId={activeModuleId}
              db={db}
              adapterDiagnostics={adapterDiagnostics}
              onSelectModule={setActiveModuleId}
              onToggleKillSwitch={handleToggleKillSwitch}
            />
          ) : EXECUTION_MODULE_IDS.has(activeModuleId) ? (
            <ExecutionViews
              activeModuleId={activeModuleId}
              db={db}
              onCreateMission={handleCreateMission}
              onTransitionMission={handleTransitionMission}
              onToggleChecklistItem={handleToggleChecklistItem}
              onCreatePrompt={handleCreatePrompt}
            />
          ) : (
            <LocalAndGovernanceViews
              activeModuleId={activeModuleId}
              db={db}
              onSendMessage={handleSendMessage}
              onImportConversation={handleImportConversation}
              onSubmitAuditVerdict={handleSubmitAuditVerdict}
              onCreateMemory={handleCreateMemory}
            />
          )}
        </main>

        {/* Footer Discreto (Sem Tickers Falsos de Telemetria) */}
        <footer className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-blue-700 dark:text-sky-400 font-medium">
            Birthub 360 — AI Operations Center (B360-AOC) · Projeto Independente do Produto
            Principal Birthub 360
          </div>
          <div className="font-mono text-emerald-700 dark:text-emerald-400">
            Orquestrador Humano: Autoridade Máxima · Gasto Adicional: R$ 0,00
          </div>
        </footer>
      </div>

      {/* Modal Command Palette */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectModule={setActiveModuleId}
        providers={db.providers}
        agents={db.agents}
        missions={db.missions}
        onTriggerKillSwitch={() =>
          handleToggleKillSwitch(
            !db.governance.globalAutomationSuspended,
            'Acionado via Command Palette pelo Orquestrador Humano'
          )
        }
        globalSuspended={db.governance.globalAutomationSuspended}
      />
    </div>
  );
}
