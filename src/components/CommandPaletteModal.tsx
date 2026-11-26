import React, { useState, useMemo } from 'react';
import { Search, X, ArrowRight, Terminal, ShieldAlert, Cpu, Layers } from 'lucide-react';
import {
  AIProvider,
  Mission,
  OFFICIAL_40_MODULES,
  OperationalAgent,
  PlatformModuleDef,
} from '../shared/contracts';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (moduleId: string) => void;
  providers: AIProvider[];
  agents: OperationalAgent[];
  missions: Mission[];
  onTriggerKillSwitch: () => void;
  globalSuspended: boolean;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  providers,
  agents,
  missions,
  onTriggerKillSwitch,
  globalSuspended,
}) => {
  const [query, setQuery] = useState('');

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return OFFICIAL_40_MODULES.slice(0, 12);
    return OFFICIAL_40_MODULES.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        String(m.number).includes(q)
    );
  }, [query]);

  const filteredProviders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return providers.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }, [query, providers]);

  const filteredAgents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.specialty.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    );
  }, [query, agents]);

  const filteredMissions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return missions.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.isolation.branchName.toLowerCase().includes(q)
    );
  }, [query, missions]);

  if (!isOpen) return null;

  const handleGoToModule = (mod: PlatformModuleDef) => {
    onSelectModule(mod.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 pt-16 px-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette e Pesquisa Global B360-AOC"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-3.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar entre os 40 módulos, 10 IAs, Agentes (00-100), Missões, SHAs ou comandos..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            autoFocus
            aria-label="Campo de pesquisa do Command Palette"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
            aria-label="Fechar Command Palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-3 space-y-4">
          <div>
            <div className="px-2 pb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              Ações Constitucionais Rápidas
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectModule('mod-09');
                  onClose();
                }}
                className="flex items-center justify-between px-3 py-2 text-left text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Nova Missão Isolada (Preflight)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onTriggerKillSwitch();
                  onClose();
                }}
                className="flex items-center justify-between px-3 py-2 text-left text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-700 dark:text-red-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {globalSuspended ? 'Retomar Automações Globais' : 'Suspensão Emergencial (Kill Switch)'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <div className="px-2 pb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              Módulos da Plataforma ({filteredModules.length} exibidos de 40)
            </div>
            <div className="space-y-1">
              {filteredModules.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => handleGoToModule(mod)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {String(mod.number).padStart(2, '0')}. {mod.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {mod.description}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 shrink-0">{mod.waveIntroduced}</span>
                </button>
              ))}
            </div>
          </div>

          {filteredProviders.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                Inteligências Artificiais Oficiais
              </div>
              <div className="space-y-1">
                {filteredProviders.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectModule('mod-04');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="flex items-center gap-2 text-xs font-medium text-slate-900 dark:text-slate-100">
                      <Cpu className="w-3.5 h-3.5 text-blue-500" />
                      {p.id} · {p.name} ({p.environment})
                    </span>
                    <span className="text-xs font-mono text-slate-500">{p.connectionStatus}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredAgents.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                Agentes Operacionais Encontrados
              </div>
              <div className="space-y-1">
                {filteredAgents.map((ag) => (
                  <button
                    key={ag.id}
                    type="button"
                    onClick={() => {
                      onSelectModule('mod-06');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      {ag.name} — {ag.specialty}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{ag.associatedProviderId}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredMissions.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                Missões Relacionadas
              </div>
              <div className="space-y-1">
                {filteredMissions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectModule('mod-09');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="flex items-center gap-2 text-xs font-medium text-slate-900 dark:text-slate-100">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      {m.code} · {m.title}
                    </span>
                    <span className="text-xs font-mono text-slate-500">Etapa {m.stepNumber}/23</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 py-2.5 text-xs text-slate-500">
          <span>Navegação unificada pelos 40 módulos obrigatórios B360-AOC</span>
          <span className="font-mono">ESC para fechar</span>
        </div>
      </div>
    </div>
  );
};
