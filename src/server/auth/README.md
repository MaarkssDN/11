# Contrato de sessão e tenant

`requireAuth(request, env)` é a **única** forma de um handler obter identidade e tenant. O tipo estável está em `src/server/auth/requireAuth.ts`.

```ts
type Role = 'viewer' | 'operator' | 'admin';

interface AuthContext {
  readonly userId: string;
  readonly tenantId: string;
  readonly role: Role;
  readonly sessionId: string;
}
```

Não há papéis anteriores neste repositório. Estes três são o RBAC mínimo.

## De onde vem a identidade

O cliente apresenta apenas um **id opaco** de sessão:

- `Authorization: Bearer <id>`, ou
- cookie `b360_session=<id>` (na emissão: `HttpOnly`, sem `userId` nem `tenantId`).

`userId`, `tenantId` e `role` são lidos só do registro devolvido por `env.getSession(sessionId)`. Header, body, query e cookie legível **não** são fonte de identidade.

`tenant_id` / `tenantId` enviados pelo cliente são ignorados quando coincidem com a sessão. Se qualquer um divergir, a resposta é **403** (`tenant_mismatch`).

## Fail-closed

| Situação | HTTP | Código |
| --- | --- | --- |
| Sem credencial, sessão desconhecida, credenciais discordantes, expirada ou revogada | 401 | `unauthenticated` |
| Registro sem `userId`, sem `tenantId` ou sem papel conhecido | 403 | `incomplete_session` |
| `tenant_id` do cliente diverge do registro | 403 | `tenant_mismatch` |

Não existe tenant default. `expiresAt` e `revokedAt` são epoch em milissegundos. `revokedAt` nulo significa sessão ativa.

## O que este módulo não faz

Não registra rotas, não emite sessão e não escolhe armazenamento. A camada seguinte (memória local ou D1 com isolamento por tenant) injeta `AuthEnv.getSession` e persiste o `SessionRecord`. Handlers de `/api/*` devem receber `AuthContext` apenas do retorno de `requireAuth`.
