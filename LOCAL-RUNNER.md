# LOCAL-RUNNER.md — Protocolo Seguro da Máquina Local Windows & Devin (B360-AOC)

## 1. Estado Inicial Obrigatório

Por determinação constitucional (Seção 4 e Seção 16):
- A integração com o **Devin (`IA-10`)** inicia **DESABILITADA** (`BLOQUEADO_VERIFICACAO_PENDENTE`) até que sua situação contratual e capacidades reais sejam verificadas pelo Orquestrador Humano.
- Se o computador Windows estiver desligado, as missões locais permanecem preservadas na fila persistente (`AGUARDANDO_MAQUINA_LOCAL`).

## 2. Arquitetura de Segurança do Runner Local Windows

- **Conexão Exclusivamente de Saída (Outbound Polling/WebSocket)**: O computador Windows inicia a conexão autenticada para a nuvem; nenhuma porta de entrada, terminal ou sistema de arquivos local é exposto à internet.
- **Isolamento nas Unidades `C:` e `D:`**:
  - `C:\` reservada ao sistema operacional e ferramentas base.
  - `D:\Birthub360-Operations\worktrees\<codigo-missao>` dedicada às worktrees exclusivas de cada missão.
- **Proibição de Junctions/Symlinks Mutáveis**: Cada worktree possui diretório `node_modules` independente quando houver dependências mutáveis, evitando contaminação cruzada entre missões concorrentes.
