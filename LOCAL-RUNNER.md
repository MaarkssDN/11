# LOCAL-RUNNER.md — Protocolo Seguro da Máquina Local Windows & Devin (B360-AOC)

## 1. Estado Operacional Ativo

Por deliberação e autorização direta do **Orquestrador Humano (Marcelo)**:
- A ponte do **Runner Local Windows com o Devin (`IA-10`)** encontra-se **ATIVA E HOMOLOGADA** (`CONECTADO_API_LOCAL`, `devinBridgeEnabled = true`, `devinContractVerified = true`).
- O controle de ativação/pausa da ponte está disponível tanto no **Devin Command Center (`mod-21`)** quanto via endpoint `POST /api/governance/devin-bridge`.
- Se o computador Windows estiver desligado ou a ponte for pausada, as missões locais permanecem preservadas na fila persistente (`AGUARDANDO_MAQUINA_LOCAL`).

## 2. Arquitetura de Segurança do Runner Local Windows

- **Conexão Exclusivamente de Saída (Outbound Polling/WebSocket)**: O computador Windows inicia a conexão autenticada para a nuvem; nenhuma porta de entrada, terminal ou sistema de arquivos local é exposto à internet.
- **Isolamento nas Unidades `C:` e `D:`**:
  - `C:\` reservada ao sistema operacional e ferramentas base.
  - `D:\Birthub360-Operations\worktrees\<codigo-missao>` dedicada às worktrees exclusivas de cada missão.
- **Proibição de Junctions/Symlinks Mutáveis**: Cada worktree possui diretório `node_modules` independente quando houver dependências mutáveis, evitando contaminação cruzada entre missões concorrentes.
