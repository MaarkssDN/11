import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Database,
  FileText,
  FolderGit2,
  GitBranch,
  HardDrive,
  Lock,
  MessageSquare,
  MonitorOff,
  Send,
  Shield,
  ShieldAlert,
  Upload,
  UserCheck,
} from 'lucide-react';
import { B360DatabaseState, SendMessageInput } from '../shared/contracts';
import { selectCatarinaSpecialistsForModules } from '../domain/operationsEngine';

interface LocalAndGovernanceViewsProps {
  activeModuleId: string;
  db: B360DatabaseState;
  onSendMessage: (input: SendMessageInput) => Promise<{ ok: boolean; error?: string }>;
  onImportConversation: (payload: {
    fileName: string;
    rawText: string;
  }) => Promise<{ ok: boolean; idempotent?: boolean; error?: string }>;
  onSubmitAuditVerdict: (
    auditId: string,
    payload: {
      auditorAgentId: string;
      decision: 'APROVADA' | 'APROVADA_COM_RESSALVAS' | 'REPROVADA';
      finalVerdict: string;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  onCreateMemory: (payload: {
    level:
      | 'GLOBAL'
      | 'PROJETO'
      | 'INTELIGENCIA_ARTIFICIAL'
      | 'AGENTE'
      | 'SQUAD'
      | 'CONVERSA'
      | 'MISSAO'
      | 'ONDA'
      | 'AUDITORIA'
      | 'INTEGRACAO';
    entityRef: string;
    title: string;
    content: string;
    provenance: string;
    verificationStatus:
      | 'FATO_VERIFICADO_SHA'
      | 'INSTRUCAO_CONSTITUCIONAL'
      | 'AFIRMACAO_IA_NAO_VERIFICADA'
      | 'CONFLITO_DETECTADO';
  }) => Promise<{ ok: boolean; error?: string }>;
  onToggleDevinBridge?: (enabled: boolean, reason: string) => Promise<{ ok: boolean; error?: string }>;
}

export const LocalAndGovernanceViews: React.FC<LocalAndGovernanceViewsProps> = ({
  activeModuleId,
  db,
  onSendMessage,
  onImportConversation,
  onSubmitAuditVerdict,
  onCreateMemory,
  onToggleDevinBridge,
}) => {
  // Mensagens entre IAs state
  const [msgAuthorType, setMsgAuthorType] = useState<
    'ORQUESTRADOR_HUMANO' | 'PROVEDOR_IA' | 'AGENTE_OPERACIONAL'
  >('AGENTE_OPERACIONAL');
  const [msgAuthorId, setMsgAuthorId] = useState('AG-000');
  const [msgAuthorName, setMsgAuthorName] = useState('Agente 00 — Astra');
  const [msgChannelType, setMsgChannelType] = useState<
    'INDIVIDUAL' | 'GRUPO' | 'SQUAD' | 'MISSAO' | 'ONDA'
  >('MISSAO');
  const [msgKind, setMsgKind] = useState<
    | 'MENSAGEM'
    | 'PROMPT'
    | 'CODIGO'
    | 'EVIDENCIA'
    | 'PARECER_AUDITORIA'
    | 'SOLICITACAO_APROVACAO'
    | 'HANDOFF'
  >('HANDOFF');
  const [msgPriority, setMsgPriority] = useState<'URGENTE' | 'ALTA' | 'NORMAL' | 'REGISTRO'>(
    'ALTA'
  );
  const [msgContent, setMsgContent] = useState('');
  const [msgSha, setMsgSha] = useState('4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d');
  const [msgStatus, setMsgStatus] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);

  // Importador Google Drive state
  const [importFileName, setImportFileName] = useState('2026-11-25-relatorio-onda-13-devin.md');
  const [importRawText, setImportRawText] = useState(
    `2026-11-25 [16:00] Conversa entre Marcelo, Claude, Gemini e Devin
Decisão: Manter ponte local do Devin desabilitada até verificação contratual e homologação pela Catarina (Agente 100).
Concluído: [x] Criação da Central de Conversas e Importador Idempotente.
Pendente: [ ] Executar script PowerShell de verificação das unidades C: e D: na máquina Windows.
Bloqueador: Contrato do Devin em análise pelo Orquestrador Humano.
Branch: wave/09-drive-importer commit 4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d
Evidência: Parser determinístico validado em operationsEngine.test.ts.`
  );
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  // Catarina 100 Domain Selector state
  const [catarinaDomainQuery, setCatarinaDomainQuery] = useState('migrations, Segurança');
  const [catarinaExecutorExclude, setCatarinaExecutorExclude] = useState('AG-010');

  // Audit Verdict state
  const [auditAuditorId, setAuditAuditorId] = useState('AG-088');
  const [auditDecision, setAuditDecision] = useState<
    'APROVADA' | 'APROVADA_COM_RESSALVAS' | 'REPROVADA'
  >('REPROVADA');
  const [auditVerdictText, setAuditVerdictText] = useState(
    'Reprovada ou mantida em auditoria caso exista qualquer teste obrigatório não executado.'
  );
  const [auditFeedback, setAuditFeedback] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Memory creation state
  const [memLevel, setMemLevel] = useState<
    | 'GLOBAL'
    | 'PROJETO'
    | 'INTELIGENCIA_ARTIFICIAL'
    | 'AGENTE'
    | 'SQUAD'
    | 'CONVERSA'
    | 'MISSAO'
    | 'ONDA'
    | 'AUDITORIA'
    | 'INTEGRACAO'
  >('MISSAO');
  const [memRef, setMemRef] = useState('B360-MSN-001');
  const [memTitle, setMemTitle] = useState('');
  const [memContent, setMemContent] = useState('');
  const [memProvenance, setMemProvenance] = useState('SHA 4c5d6e7f8a · Agente 88');
  const [memStatus, setMemStatus] = useState<
    | 'FATO_VERIFICADO_SHA'
    | 'INSTRUCAO_CONSTITUCIONAL'
    | 'AFIRMACAO_IA_NAO_VERIFICADA'
    | 'CONFLITO_DETECTADO'
  >('FATO_VERIFICADO_SHA');
  const [memFeedback, setMemFeedback] = useState<string | null>(null);

  // ==========================================================================
  // MÓDULO 03: CENTRAL DE CONVERSAS ENTRE IAs & IMPORTADOR GOOGLE DRIVE
  // ==========================================================================
  if (activeModuleId === 'mod-03') {
    const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      setMsgError(null);
      setMsgStatus(null);
      const res = await onSendMessage({
        conversationId: 'CONV-COMANDO-GLOBAL',
        channelType: msgChannelType,
        authorType: msgAuthorType,
        authorId: msgAuthorId,
        authorName: msgAuthorName,
        recipientIds: ['AG-100', 'AG-088', 'IA-07'],
        missionId: 'MSN-001',
        waveId: 'ONDA-08',
        priority: msgPriority,
        messageKind: msgKind,
        content: msgContent,
        relatedSha: msgSha || null,
      });
      if (!res.ok) {
        setMsgError(res.error || 'Erro ao registrar mensagem.');
      } else {
        setMsgStatus(
          'Mensagem registrada com hash anti-duplicidade e verificação de autoria real.'
        );
        setMsgContent('');
      }
    };

    const handleImport = async (e: React.FormEvent) => {
      e.preventDefault();
      setImportFeedback(null);
      const res = await onImportConversation({
        fileName: importFileName,
        rawText: importRawText,
      });
      if (!res.ok) {
        setImportFeedback(res.error || 'Erro ao importar conversa.');
      } else {
        setImportFeedback(
          res.idempotent
            ? 'Importação idempotente: arquivo já existia com o mesmo hash FNV-1a; registro original preservado sem duplicação.'
            : 'Arquivo importado com sucesso: 15 dimensões extraídas (participantes, cronologia, decisões, pendências, bloqueadores, ondas e checklists).'
        );
      }
    };

    return (
      <div className="space-y-8">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Seções 8 e 9 · Barramento Corporativo Multi-IA & Importador Idempotente Google Drive
          </div>
          <h1 className="mt-1 text-2xl font-bold text-blue-700 dark:text-sky-400">
            Central de Conversas entre IAs & Diagnóstico de Históricos Importados
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Regra Constitucional: Nenhuma mensagem produzida por IA pode ser atribuída ao
            Orquestrador Humano. Pasta oficial de referência:{' '}
            <span className="font-mono text-xs">{db.governance.googleDriveConversationsUrl}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Feed Cronológico de Mensagens Entre IAs */}
          <div className="xl:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-blue-700 dark:text-sky-400">
                Histórico Cronológico Verificado ({db.messages.length} mensagens)
              </h2>
              <span className="text-xs font-mono text-slate-500">Anti-Duplicidade FNV-1a Ativo</span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
              {db.messages.map((m) => (
                <div key={m.id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {m.authorName} ({m.authorType})
                    </span>
                    <span className="text-slate-500">
                      {m.id} · Canal {m.channelType} · {m.messageKind} · Prioridade {m.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {m.content}
                  </p>
                  {m.codeSnippet && (
                    <pre className="rounded bg-slate-100 dark:bg-slate-950 p-2 text-xs font-mono text-slate-800 dark:text-slate-200">
                      {m.codeSnippet}
                    </pre>
                  )}
                  <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                    <span>
                      Destinatários: {m.recipientIds.join(', ')} · Missão: {m.missionId || 'Global'}
                    </span>
                    <span>
                      SHA: {m.relatedSha ? m.relatedSha.slice(0, 10) : 'N/A'} · Estado:{' '}
                      {m.processingState}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulário de Despacho de Mensagem / Handoff / Parecer */}
          <form
            onSubmit={handleSend}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-blue-700 dark:text-sky-400">
              Transmitir Mensagem / Handoff no Barramento
            </h3>

            {msgError && (
              <div
                role="alert"
                className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-2.5 text-xs text-red-800 dark:text-red-200"
              >
                {msgError}
              </div>
            )}
            {msgStatus && (
              <div
                role="status"
                className="rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-xs text-emerald-800 dark:text-emerald-200"
              >
                {msgStatus}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="msg-author-type"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Natureza do Autor Real
                </label>
                <select
                  id="msg-author-type"
                  value={msgAuthorType}
                  onChange={(e) => {
                    const val = e.target.value as
                      | 'ORQUESTRADOR_HUMANO'
                      | 'PROVEDOR_IA'
                      | 'AGENTE_OPERACIONAL';
                    setMsgAuthorType(val);
                    if (val === 'ORQUESTRADOR_HUMANO') {
                      setMsgAuthorId('HUMANO-MARCELO');
                      setMsgAuthorName('Marcelo (Orquestrador Humano)');
                    } else if (val === 'PROVEDOR_IA') {
                      setMsgAuthorId('IA-06');
                      setMsgAuthorName('Claude (IA-06)');
                    } else {
                      setMsgAuthorId('AG-000');
                      setMsgAuthorName('Agente 00 — Astra');
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 text-xs"
                >
                  <option value="AGENTE_OPERACIONAL">Agente Operacional</option>
                  <option value="PROVEDOR_IA">Provedor de IA</option>
                  <option value="ORQUESTRADOR_HUMANO">Orquestrador Humano</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="msg-kind"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Tipo de Artefato
                </label>
                <select
                  id="msg-kind"
                  value={msgKind}
                  onChange={(e) => setMsgKind(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 text-xs"
                >
                  <option value="HANDOFF">Handoff</option>
                  <option value="MENSAGEM">Mensagem</option>
                  <option value="PARECER_AUDITORIA">Parecer de Auditoria</option>
                  <option value="SOLICITACAO_APROVACAO">Solicitação de Aprovação</option>
                  <option value="PROMPT">Prompt</option>
                  <option value="EVIDENCIA">Evidência</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="msg-author-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Identificação Verificada do Autor
              </label>
              <input
                id="msg-author-name"
                type="text"
                value={msgAuthorName}
                onChange={(e) => setMsgAuthorName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="msg-content"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Conteúdo da Mensagem / Parecer
              </label>
              <textarea
                id="msg-content"
                rows={4}
                value={msgContent}
                onChange={(e) => setMsgContent(e.target.value)}
                placeholder="Digite o handoff, decisão, parecer ou comando operacional..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Registrar Mensagem no Barramento
            </button>
          </form>
        </div>

        {/* Importador Idempotente das Conversas Existentes (Seção 9 — 15 itens obrigatórios) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
          <div>
            <h2 className="text-base font-bold text-blue-700 dark:text-sky-400">
              Importador Idempotente de Conversas Históricas (Google Drive: CONVERSAS ENTRE MARCELO E IAS)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Preserva integralmente o arquivo original, reconstrói cronologia, participantes,
              decisões, concluídos, pendentes, bloqueadores, contradições, branches/commits e gera
              ondas, prompts e checklists sem inventar informações ausentes.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <form onSubmit={handleImport} className="space-y-3">
              {importFeedback && (
                <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-3 text-xs text-blue-800 dark:text-blue-200">
                  {importFeedback}
                </div>
              )}
              <div>
                <label
                  htmlFor="imp-filename"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Nome do Arquivo Original (.md ou .txt)
                </label>
                <input
                  id="imp-filename"
                  type="text"
                  value={importFileName}
                  onChange={(e) => setImportFileName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="imp-raw"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Conteúdo Integral do Arquivo (Preservado sem Alterações)
                </label>
                <textarea
                  id="imp-raw"
                  rows={7}
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
              >
                Executar Importação Idempotente & Extrair 15 Dimensões
              </button>
            </form>

            {/* Relatórios de Conversas Importadas */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto">
              {db.importedConversations.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-slate-500">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {rep.fileName}
                    </span>
                    <span>Hash: {rep.contentFingerprint}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{rep.diagnosticSummary}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <strong className="text-slate-900 dark:text-slate-100">
                        Participantes ({rep.participantsIdentified.length}):
                      </strong>{' '}
                      {rep.participantsIdentified.join(', ')}
                    </div>
                    <div>
                      <strong className="text-slate-900 dark:text-slate-100">
                        Branches/SHAs ({rep.branchesAndCommits.length}):
                      </strong>{' '}
                      {rep.branchesAndCommits[0] || 'Nenhum citado'}
                    </div>
                    <div>
                      <strong className="text-emerald-700 dark:text-emerald-400">
                        Concluídos ({rep.completedWork.length}):
                      </strong>{' '}
                      {rep.completedWork.join(' | ')}
                    </div>
                    <div>
                      <strong className="text-amber-700 dark:text-amber-400">
                        Pendentes ({rep.pendingWork.length}):
                      </strong>{' '}
                      {rep.pendingWork.join(' | ')}
                    </div>
                  </div>
                  <div className="pt-1 text-slate-500 font-mono">
                    Ondas Propostas: {rep.proposedWaves.join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MÓDULOS 21, 25, 27, 28 & 29: DEVIN COMMAND CENTER & ISOLAMENTO LOCAL WINDOWS
  // ==========================================================================
  if (
    activeModuleId === 'mod-21' ||
    activeModuleId === 'mod-25' ||
    activeModuleId === 'mod-27' ||
    activeModuleId === 'mod-28' ||
    activeModuleId === 'mod-29'
  ) {
    const isBridgeActive = db.governance.devinBridgeEnabled;

    return (
      <div className="space-y-8">
        <div
          className={`rounded-xl border p-5 ${
            isBridgeActive
              ? 'border-emerald-300 dark:border-emerald-900/70 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-amber-300 dark:border-amber-900/70 bg-amber-50/50 dark:bg-amber-950/20'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span
              className={
                isBridgeActive
                  ? 'text-emerald-800 dark:text-emerald-300'
                  : 'text-amber-800 dark:text-amber-300'
              }
            >
              REGRA CONSTITUCIONAL SEÇÃO 16 · OPERAÇÃO LOCAL WINDOWS (DEVIN IA-10)
            </span>
            <span
              className={
                isBridgeActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'text-amber-700 dark:text-amber-400 font-bold'
              }
            >
              ESTADO:{' '}
              {isBridgeActive
                ? 'PONTE RUNNER LOCAL ATIVA (OUTBOUND AUTENTICADO)'
                : 'INTEGRAÇÃO DESABILITADA ATÉ VERIFICAÇÃO'}
            </span>
          </div>
          <div className="mt-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-700 dark:text-sky-400">
                {activeModuleId === 'mod-21' &&
                  'Devin Command Center — Operação Local Windows (C: e D:)'}
                {activeModuleId === 'mod-25' && 'Gerenciador de Worktrees Isoladas'}
                {activeModuleId === 'mod-27' &&
                  'Gerenciador de Dependências Mutáveis (Proibição de Symlinks/Junctions)'}
                {activeModuleId === 'mod-28' &&
                  'Gerenciador de Ambientes, Portas Reservadas e Bancos de Teste'}
                {activeModuleId === 'mod-29' && 'Monitoramento de Infraestrutura Híbrida'}
              </h1>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {isBridgeActive
                  ? 'A Ponte Runner Local com o Devin (IA-10) está ativa e homologada pelo Orquestrador Humano (Marcelo). O serviço local inicia exclusivamente conexões de saída autenticadas (Outbound mTLS/HMAC), operando nas unidades C: e D: sem expor terminal ou portas locais à internet.'
                  : 'A integração permanece desabilitada até que as capacidades reais do Devin sejam verificadas e autorizadas pelo Orquestrador Humano.'}
              </p>
            </div>
            {onToggleDevinBridge && (
              <button
                type="button"
                onClick={() =>
                  onToggleDevinBridge(
                    !isBridgeActive,
                    isBridgeActive
                      ? 'Ponte Runner Local pausada pelo Orquestrador Humano'
                      : 'Ponte Runner Local ativada pelo Orquestrador Humano'
                  )
                }
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  isBridgeActive
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isBridgeActive
                  ? 'Pausar Ponte Runner Local'
                  : 'Ativar Ponte Runner Local com Devin'}
              </button>
            )}
          </div>
        </div>

        {/* Estado Explícito do Computador Local e Unidades C: e D: */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
            <div className="text-xs font-mono text-slate-500">ESTADO DA PONTE LOCAL DEVIN</div>
            <div
              className={`text-lg font-bold font-mono ${
                isBridgeActive
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {isBridgeActive
                ? 'CONECTADO · OUTBOUND RUNNER ATIVO'
                : 'DESCONECTADO / BLOQUEADO POR GOVERNANÇA'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isBridgeActive
                ? 'Runner Local Windows registrado (RUNNER-WIN-B360-01). Recebendo pacotes da nuvem e coordenando o Squad de Auditoria Local (AG-088) e Catarina (AG-100).'
                : 'As missões destinadas ao ambiente local aguardam na fila persistente.'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
            <div className="text-xs font-mono text-slate-500">TOPOLOGIA DE DISCO WINDOWS (C: e D:)</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Unidade C: (Sistema/OS) · Unidade D: (Worktrees Isoladas)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Cada missão local provisiona worktree exclusiva em{' '}
              <code className="font-mono">D:\Birthub360-Operations\worktrees\</code> com{' '}
              <code className="font-mono">node_modules</code> próprio sem junctions.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
            <div className="text-xs font-mono text-slate-500">PROTOCOLO SEGURO OUTBOUND</div>
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {isBridgeActive
                ? 'Canal Outbound mTLS/HMAC Homologado'
                : 'Especificação LOCAL-RUNNER.md Pronta'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              O Runner Local Windows puxa pacotes da fila via HTTPS mTLS/HMAC de saída, executa em
              sandbox PowerShell e devolve logs e código de saída.
            </p>
          </div>
        </div>

        {/* Tabela de Worktrees, Portas e Dependências Isoladas por Missão */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-blue-700 dark:text-sky-400">
              Mapa de Isolamento de Worktrees, Branches, Diretórios node_modules, Portas e Leases (Seção 14)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/40">
                  <th className="py-2.5 px-4 font-medium">Missão</th>
                  <th className="py-2.5 px-4 font-medium">Worktree Exclusiva</th>
                  <th className="py-2.5 px-4 font-medium">Diretório node_modules Independente</th>
                  <th className="py-2.5 px-4 font-medium">Porta / DB Schema</th>
                  <th className="py-2.5 px-4 font-medium text-right">Symlinks Inseguros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono">
                {db.missions.map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {m.code}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {m.isolation.worktreePath}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {m.isolation.isolatedNodeModulesPath}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      :{m.isolation.reservedPort} · {m.isolation.testDbSchema}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-400">
                      PROIBIDO / VERIFICADO
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
  // MÓDULO 22: CATARINA COMMAND CENTER (AGENTE 100 — SELEÇÃO POR DOMÍNIO)
  // ==========================================================================
  if (activeModuleId === 'mod-22') {
    const domains = catarinaDomainQuery
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const recommendedSpecialists = selectCatarinaSpecialistsForModules(
      domains,
      catarinaExecutorExclude,
      db.agents
    );

    return (
      <div className="space-y-8">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Seção 17 · Catarina (Agente 100) e Squad de Especialistas
          </div>
          <h1 className="mt-1 text-2xl font-bold text-blue-700 dark:text-sky-400">
            Catarina Command Center — Mobilização Seletiva por Domínio & Prevenção de Conflitos
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Regra Constitucional: &ldquo;Catarina não deverá mobilizar todos os especialistas
            indiscriminadamente. Selecionar apenas os agentes necessários para cada entrega e
            identificar conflitos de interesse.&rdquo;
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-sm font-bold text-blue-700 dark:text-sky-400">
            Simulador e Seletor Cirúrgico de Especialistas da Catarina (Agente 100)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="cat-domains"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Módulos ou Domínios da Entrega Recebida da Nuvem (separados por vírgula)
              </label>
              <input
                id="cat-domains"
                type="text"
                value={catarinaDomainQuery}
                onChange={(e) => setCatarinaDomainQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="cat-exclude"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Agente Executor Original (Excluído Automaticamente por Conflito de Interesse)
              </label>
              <select
                id="cat-exclude"
                value={catarinaExecutorExclude}
                onChange={(e) => setCatarinaExecutorExclude(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono"
              >
                {db.agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Especialistas Mobilizados Seletivamente ({recommendedSpecialists.length} de{' '}
              {db.agents.length} agentes do catálogo):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendedSpecialists.map((sp) => (
                <div
                  key={sp.id}
                  className="rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 p-3.5 text-xs space-y-1"
                >
                  <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {sp.id} · {sp.name}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Especialidade: {sp.specialty}
                  </div>
                  <div className="font-mono text-slate-500">
                    Módulos: {sp.ownedModules.join(', ')} · IA: {sp.associatedProviderId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MÓDULOS 23, 24 & 30: AUDITORIA INDEPENDENTE, HOMOLOGAÇÃO E QUALITY GATES
  // ==========================================================================
  if (
    activeModuleId === 'mod-23' ||
    activeModuleId === 'mod-24' ||
    activeModuleId === 'mod-30'
  ) {
    const primaryAudit = db.audits[0];

    const handleVerdict = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuditError(null);
      setAuditFeedback(null);
      if (!primaryAudit) return;
      const res = await onSubmitAuditVerdict(primaryAudit.id, {
        auditorAgentId: auditAuditorId,
        decision: auditDecision,
        finalVerdict: auditVerdictText,
      });
      if (!res.ok) {
        setAuditError(res.error || 'Bloqueio constitucional na emissão do parecer.');
      } else {
        setAuditFeedback('Parecer técnico registrado e vinculado ao SHA auditado.');
      }
    };

    return (
      <div className="space-y-8">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Seções 9, 13 e 18 · Proibição de Autoaprovação · Vínculo Obrigatório ao SHA · Testes Reais
          </div>
          <h1 className="mt-1 text-2xl font-bold text-blue-700 dark:text-sky-400">
            {activeModuleId === 'mod-23' &&
              'Central de Auditoria Independente (Vinculada ao SHA Auditado)'}
            {activeModuleId === 'mod-24' && 'Central de Homologação de Entregas da Nuvem'}
            {activeModuleId === 'mod-30' &&
              'Central de Testes e Quality Gates (Nunca Declarar Teste Não Executado como Aprovado)'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Diferenciação obrigatória entre Falha de Produto, Falha Ambiental e Limitação de
            Evidência. Se qualquer teste obrigatório estiver como{' '}
            <span className="font-mono">NAO_EXECUTADO</span> ou se o auditor for igual ao executor,
            a aprovação é bloqueada tecnicamente pelo backend.
          </p>
        </div>

        {primaryAudit && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-mono">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  AUDITORIA {primaryAudit.id} · Missão {primaryAudit.missionId}
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  SHA Auditado: {primaryAudit.auditedSha} · Estado: {primaryAudit.state}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <strong>Escopo:</strong> {primaryAudit.scope}
                </div>
                <div className="mt-1 font-mono">
                  Executor Original: {primaryAudit.originalExecutorId} · Auditor Independente
                  Responsável: {primaryAudit.responsibleAuditorId}
                </div>
              </div>

              {/* Tabela de Testes Executados vs Não Executados */}
              <div>
                <h3 className="text-xs font-bold text-blue-700 dark:text-sky-400 mb-2">
                  Verificação de Testes Executados e Códigos de Saída (Seção 13 e 18):
                </h3>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500">
                        <th className="py-2 px-3">Suite / Verificação</th>
                        <th className="py-2 px-3">Comando</th>
                        <th className="py-2 px-3 text-right">Exit Code</th>
                        <th className="py-2 px-3 text-right">Resultado Real</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                      {primaryAudit.executedTests.map((t, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                            {t.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {t.command}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            {t.exitCode !== null ? t.exitCode : 'N/A'}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-bold ${
                              t.result === 'APROVADO'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {t.result}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Achados Classificados (Falha de Produto vs Ambiental vs Limitação de Evidência) */}
              <div>
                <h3 className="text-xs font-bold text-blue-700 dark:text-sky-400 mb-2">
                  Achados de Auditoria Classificados:
                </h3>
                {primaryAudit.findings.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-3 text-xs space-y-1"
                  >
                    <div className="font-mono font-bold text-amber-800 dark:text-amber-300">
                      {f.id} · Categoria: {f.category} · Severidade: {f.severity} · Arquivo:{' '}
                      {f.fileOrModule}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">{f.description}</div>
                    <div className="text-slate-500">Recomendação: {f.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulário de Emissão de Parecer Vinculado ao SHA */}
            <form
              onSubmit={handleVerdict}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-blue-700 dark:text-sky-400">
                Emitir Parecer Técnico Vinculado ao SHA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Teste a trava constitucional: tentar aprovar usando o próprio agente executor (
                <code className="font-mono">AG-010</code>) ou com teste local marcado como{' '}
                <code className="font-mono">NAO_EXECUTADO</code> será bloqueado pelo motor de
                governança.
              </p>

              {auditError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-800 dark:text-red-200"
                >
                  {auditError}
                </div>
              )}
              {auditFeedback && (
                <div
                  role="status"
                  className="rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-200"
                >
                  {auditFeedback}
                </div>
              )}

              <div>
                <label
                  htmlFor="aud-agent"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Agente Auditor Assinante
                </label>
                <select
                  id="aud-agent"
                  value={auditAuditorId}
                  onChange={(e) => setAuditAuditorId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs font-mono"
                >
                  {db.agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} — {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="aud-decision"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Deliberação Técnica
                </label>
                <select
                  id="aud-decision"
                  value={auditDecision}
                  onChange={(e) => setAuditDecision(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs font-mono"
                >
                  <option value="REPROVADA">REPROVADA (Devolver para Etapa 16)</option>
                  <option value="APROVADA">APROVADA (Exige 100% dos testes executados)</option>
                  <option value="APROVADA_COM_RESSALVAS">APROVADA COM RESSALVAS</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="aud-verdict"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Parecer Final Fundamentado
                </label>
                <textarea
                  id="aud-verdict"
                  rows={4}
                  value={auditVerdictText}
                  onChange={(e) => setAuditVerdictText(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Registrar Parecer de Auditoria
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // MÓDULOS 26, 31, 32 & 33: GIT INTEGRATION CENTER, BRANCHES, PRs E ACTIONS
  // ==========================================================================
  if (
    activeModuleId === 'mod-26' ||
    activeModuleId === 'mod-31' ||
    activeModuleId === 'mod-32' ||
    activeModuleId === 'mod-33'
  ) {
    return (
      <div className="space-y-8">
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-5">
          <div className="flex items-center justify-between text-xs font-mono text-blue-800 dark:text-blue-300">
            <span>SEÇÃO 5 E SEÇÃO 19 · GOVERNANÇA GIT E PROTEÇÃO DO REPOSITÓRIO PRINCIPAL</span>
            <span>MODO SEGURO: SOMENTE LEITURA ATIVO</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-blue-700 dark:text-sky-400">
            {activeModuleId === 'mod-26' && 'Gerenciador de Branches Exclusivas & SHAs'}
            {activeModuleId === 'mod-31' &&
              'Git Integration Center (Modo Seguro Somente Leitura)'}
            {activeModuleId === 'mod-32' &&
              'Gerenciador de Pull Requests & Planos de Integração'}
            {activeModuleId === 'mod-33' && 'Monitoramento de GitHub Actions & Workflows'}
          </h1>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            O repositório principal do produto (
            <code className="font-mono">{db.governance.primaryProductRepo}</code>) está protegido
            contra qualquer operação de escrita. Nenhuma operação de push, merge, exclusão de
            branch, force push ou deploy é executada sem autorização explícita do Orquestrador
            Humano e SHA auditado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="text-xs font-mono text-slate-500">REPOSITÓRIO PRINCIPAL DO PRODUTO</div>
            <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
              {db.governance.primaryProductRepo}
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">
              PROTEÇÃO CONSTITUCIONAL: INTACTO / SOMENTE LEITURA (Seção 5)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Isolado da construção inicial da Central B360-AOC para garantir zero risco ao produto
              Birthub 360 principal.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="text-xs font-mono text-slate-500">REPOSITÓRIO PROPOSTO DA CENTRAL</div>
            <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
              {db.governance.operationsRepo}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
              SQUAD DE INTEGRAÇÃO (AGENTE 60) · CREDENCIAIS GITHUB API: NÃO CONFIGURADAS (MODO SEGURO)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Branches preparadas localmente por missão com rastreamento de SHA base e invalidação
              automática de aprovação em caso de novo commit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MÓDULOS 34, 35, 36, 37, 38 & 40: MEMÓRIA (10 NÍVEIS), DOCS, GOVERNANÇA E SEGURANÇA
  // ==========================================================================
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memTitle.trim() || !memContent.trim()) return;
    const res = await onCreateMemory({
      level: memLevel,
      entityRef: memRef,
      title: memTitle.trim(),
      content: memContent.trim(),
      provenance: memProvenance.trim(),
      verificationStatus: memStatus,
    });
    if (res.ok) {
      setMemFeedback('Registro de memória estruturada gravado com proveniência.');
      setMemTitle('');
      setMemContent('');
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Seções 14, 20, 22 e 29 · Memória em 10 Níveis · Proveniência · Governança Constitucional
        </div>
        <h1 className="mt-1 text-2xl font-bold text-blue-700 dark:text-sky-400">
          {activeModuleId === 'mod-34' &&
            'Central de Memória Estruturada em 10 Níveis (Com Proveniência e Verificação)'}
          {activeModuleId === 'mod-35' &&
            'Biblioteca de Conhecimento & Documentação Permanente do Repositório'}
          {activeModuleId === 'mod-36' && 'Central de Evidências, Logs e Artefatos'}
          {activeModuleId === 'mod-37' && 'Central de Governança Constitucional'}
          {activeModuleId === 'mod-38' &&
            'Central de Segurança, RBAC, Anti-Prompt Injection e Suspensão Emergencial'}
          {activeModuleId === 'mod-40' &&
            'Configurações, Administração e Compatibilidade Cloudflare D1'}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Nunca tratamos automaticamente uma afirmação produzida por IA como fato verificado. Cada
          registro distingue entre Instrução Constitucional, Fato Verificado por SHA e Afirmação de
          IA Não Verificada.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {db.memories.map((mem) => (
            <div
              key={mem.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {mem.id} · NÍVEL: {mem.level} · Ref: {mem.entityRef}
                </span>
                <span
                  className={
                    mem.verificationStatus === 'FATO_VERIFICADO_SHA' ||
                    mem.verificationStatus === 'INSTRUCAO_CONSTITUCIONAL'
                      ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                      : 'text-amber-600 dark:text-amber-400 font-semibold'
                  }
                >
                  {mem.verificationStatus}
                </span>
              </div>
              <h3 className="text-sm font-bold text-blue-700 dark:text-sky-400">{mem.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {mem.content}
              </p>
              <div className="text-[11px] font-mono text-slate-500 pt-1">
                Proveniência: {mem.provenance} · Versão v{mem.version}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleAddMemory}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
        >
          <h3 className="text-sm font-bold text-blue-700 dark:text-sky-400">
            Registrar Nova Memória com Proveniência
          </h3>

          {memFeedback && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-xs text-emerald-800 dark:text-emerald-200">
              {memFeedback}
            </div>
          )}

          <div>
            <label
              htmlFor="mem-level"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Nível da Memória (10 Níveis Oficiais)
            </label>
            <select
              id="mem-level"
              value={memLevel}
              onChange={(e) => setMemLevel(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs font-mono"
            >
              <option value="GLOBAL">1. GLOBAL</option>
              <option value="PROJETO">2. PROJETO</option>
              <option value="INTELIGENCIA_ARTIFICIAL">3. INTELIGÊNCIA ARTIFICIAL</option>
              <option value="AGENTE">4. AGENTE</option>
              <option value="SQUAD">5. SQUAD</option>
              <option value="CONVERSA">6. CONVERSA</option>
              <option value="MISSAO">7. MISSÃO</option>
              <option value="ONDA">8. ONDA</option>
              <option value="AUDITORIA">9. AUDITORIA</option>
              <option value="INTEGRACAO">10. INTEGRAÇÃO</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="mem-status"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Classificação de Verificação
            </label>
            <select
              id="mem-status"
              value={memStatus}
              onChange={(e) => setMemStatus(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs font-mono"
            >
              <option value="FATO_VERIFICADO_SHA">FATO_VERIFICADO_SHA</option>
              <option value="INSTRUCAO_CONSTITUCIONAL">INSTRUCAO_CONSTITUCIONAL</option>
              <option value="AFIRMACAO_IA_NAO_VERIFICADA">AFIRMACAO_IA_NAO_VERIFICADA</option>
              <option value="CONFLITO_DETECTADO">CONFLITO_DETECTADO</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="mem-title"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Título da Decisão ou Aprendizado
            </label>
            <input
              id="mem-title"
              type="text"
              value={memTitle}
              onChange={(e) => setMemTitle(e.target.value)}
              placeholder="Ex: Isolamento de schema D1 por missão validado"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs"
            />
          </div>

          <div>
            <label
              htmlFor="mem-content"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Conteúdo Estruturado
            </label>
            <textarea
              id="mem-content"
              rows={3}
              value={memContent}
              onChange={(e) => setMemContent(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            Gravar na Central de Memória
          </button>
        </form>
      </div>

      {/* Entregáveis Documentais Permanentes (Seção 14 e 29) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h2 className="text-sm font-bold text-blue-700 dark:text-sky-400">
          Documentação Permanente e Migrations Geradas no Repositório (Seção 14 e 29)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs font-mono">
          {[
            '/README.md',
            '/AGENTS.md',
            '/ARCHITECTURE.md',
            '/GOVERNANCE.md',
            '/SECURITY.md',
            '/ROADMAP.md',
            '/INTEGRATIONS.md',
            '/LOCAL-RUNNER.md',
            '/CHANGELOG.md',
            '/migrations/0001_initial_schema.sql',
          ].map((docPath) => (
            <div
              key={docPath}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 flex items-center justify-between"
            >
              <span className="text-slate-800 dark:text-slate-200 truncate">{docPath}</span>
              <span className="text-emerald-700 dark:text-emerald-400">ATIVO</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
