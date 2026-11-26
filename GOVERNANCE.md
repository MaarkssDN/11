# GOVERNANCE.md — Regras Constitucionais Permanentes (B360-AOC)

## 1. Autoridade e Separação de Funções

- **Autoridade Máxima**: O **Orquestrador Humano** detém autoridade suprema sobre aprovações críticas, merges, deploys, contratos e suspensão emergencial.
- **Proibição de Autoaprovação**: Nenhum agente ou IA pode auditar ou aprovar o próprio trabalho (`executorAgentId !== auditorAgentId`).
- **Vínculo Obrigatório ao SHA**: Toda aprovação técnica está vinculada ao hash SHA efetivamente auditado. Qualquer commit posterior invalida automaticamente a aprovação anterior e retorna a missão à Etapa 12.
- **Veracidade de Testes**: Nunca declarar um teste não executado como aprovado. Diferenciar explicitamente falha de produto, falha ambiental e limitação de evidência.

## 2. Política Financeira (R$ 0,00)

- Limite de gastos adicionais: **R$ 0,00**.
- Proibido contratar APIs pagas, ativar cobranças automáticas ou utilizar múltiplas contas para contornar limites dos provedores.
