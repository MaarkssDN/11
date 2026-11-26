import { AIProvider } from '../shared/contracts';

export interface ProviderHealthCheckResult {
  providerId: string;
  providerName: string;
  checkedAt: string;
  reachable: boolean;
  mode: 'API_NATIVA_ATIVA' | 'MODO_ASSISTIDO_HUMANO' | 'DESCONECTADO_NAO_CONFIGURADO' | 'BLOQUEADO_GOVERNANCA';
  diagnosticMessage: string;
}

/**
 * Camada oficial de Adaptadores dos 10 Provedores de IA (Seção 26).
 * Nunca inventa endpoints fictícios nem simula conexões não configuradas.
 */
export function evaluateProviderAdapterStatus(provider: AIProvider): ProviderHealthCheckResult {
  const now = new Date().toISOString();
  const hasGeminiEnvKey = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.trim().length > 5
  );

  if (provider.id === 'IA-07' || provider.id === 'IA-01') {
    return {
      providerId: provider.id,
      providerName: provider.name,
      checkedAt: now,
      reachable: hasGeminiEnvKey,
      mode: hasGeminiEnvKey ? 'API_NATIVA_ATIVA' : 'MODO_ASSISTIDO_HUMANO',
      diagnosticMessage: hasGeminiEnvKey
        ? 'Adaptador @google/genai disponível no backend (GEMINI_API_KEY detectada no ambiente seguro). Política R$ 0,00 ativa.'
        : 'Ambiente Google AI Studio pronto para chave GEMINI_API_KEY via Secrets ou operação via Modo Assistido sem custo adicional.',
    };
  }

  if (provider.id === 'IA-10') {
    return {
      providerId: provider.id,
      providerName: provider.name,
      checkedAt: now,
      reachable: false,
      mode: 'BLOQUEADO_GOVERNANCA',
      diagnosticMessage:
        'Integração local Devin permanece explicitamente DESABILITADA por regra constitucional (Seção 16) até verificação contratual e ativação do Runner Local Windows com conexão de saída autenticada.',
    };
  }

  if (provider.connectionStatus === 'MODO_ASSISTIDO_HUMANO') {
    return {
      providerId: provider.id,
      providerName: provider.name,
      checkedAt: now,
      reachable: true,
      mode: 'MODO_ASSISTIDO_HUMANO',
      diagnosticMessage:
        'Operando via Modo Assistido (Assinatura de Chat/Web existente). Sem contratação de API paga (Política Financeira R$ 0,00). Prompts e Handoffs estruturados prontos para despacho.',
    };
  }

  return {
    providerId: provider.id,
    providerName: provider.name,
    checkedAt: now,
    reachable: false,
    mode: 'DESCONECTADO_NAO_CONFIGURADO',
    diagnosticMessage:
      'Adaptador programático não configurado. Capacidades de API direta retornam estado explícito NAO_CONFIGURADO / NAO_SUPORTADO.',
  };
}
