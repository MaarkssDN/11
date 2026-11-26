# INTEGRATIONS.md — Contratos de Adaptadores das 10 IAs e Assinaturas (B360-AOC)

## 1. Inteligências Artificiais Oficiais (`IA-01` a `IA-10`)

| ID | Ferramenta | Ambiente | Assinatura Existente | Modo de Integração Atual |
| :--- | :--- | :--- | :--- | :--- |
| **IA-01** | Gemini | Nuvem | 4 contas Google AI Pro | Modo Assistido / Sincronizado |
| **IA-02** | Gemini Spark | Nuvem | Google AI Pro | Modo Assistido |
| **IA-03** | Grok | Nuvem | 1 assinatura SuperGrok | Modo Assistido |
| **IA-04** | Antigravity | Nuvem (conforme disp.) | Camada experimental | Desconectado / Não Configurado |
| **IA-05** | ChatGPT | Nuvem e coord. local | 1 assinatura ChatGPT Plus | Modo Assistido / Coordenador |
| **IA-06** | Claude | Nuvem e coord. local | 1 assinatura Claude Pro | Modo Assistido / Coordenador |
| **IA-07** | Google AI Studio | Nuvem | Camada gratuita / AI Pro | Conectado (Ambiente Hospedeiro) |
| **IA-08** | Codex | Nuvem | Vinculado ao ChatGPT Plus | Desconectado / Modo Assistido |
| **IA-09** | GitHub Copilot | Nuvem | 1 assinatura Copilot Pro | Modo Assistido (GitHub Read-Only) |
| **IA-10** | Devin | Operação local (Windows) | Verificação pendente | Bloqueado até verificação contratual |

## 2. Pasta Histórica Google Drive

- Pasta alvo: `CONVERSAS ENTRE MARCELO E IAS` (`https://drive.google.com/drive/folders/1GQNRJFUxO3WNgct8SChRRJkwnA_vsMAW`).
- O importador idempotente (`POST /api/conversations/import`) processa arquivos `.md` e `.txt`, calcula hash determinístico FNV-1a, preserva o texto original e extrai as 15 dimensões exigidas na Seção 9.
