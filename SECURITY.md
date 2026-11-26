# SECURITY.md — Segurança, Isolamento e Suspensão Emergencial (B360-AOC)

## 1. Princípios de Segurança

1. **Zero Credenciais no Frontend ou Git**: Todas as chaves residem exclusivamente em variáveis de ambiente do servidor. O arquivo `.env.example` contém apenas placeholders documentados.
2. **Validação Estrita com Zod**: Todas as rotas `/api/*` validam payloads com schemas Zod tipados.
3. **Prevenção de Atribuição Falsa**: O backend rejeita com `HTTP 403` qualquer tentativa de atribuir mensagem produzida por IA ou agente ao Orquestrador Humano.
4. **Proteção contra Prompt Injection**: Mensagens externas e importações do Google Drive são tratadas como dados não confiáveis e filtradas antes do armazenamento.
5. **Isolamento local seguro**: A ponte local Windows do Devin jamais expõe terminal, shell ou sistema de arquivos diretamente à internet.
6. **Botão de Emergência (Kill Switch)**: Disponível no Global Command Center, no Command Palette (`Ctrl+K`) e via `POST /api/governance/kill-switch`, pausando imediatamente todas as filas de automação e transições.
