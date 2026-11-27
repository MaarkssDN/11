/**
 * Contrato estável de sessão e tenant (Onda 03).
 *
 * `requireAuth` é a única forma de um handler obter identidade e tenant.
 * Handlers não leem `userId`, `tenantId` ou `role` de header, body, query
 * ou cookie. Esses campos saem exclusivamente do registro de sessão
 * devolvido por `AuthEnv.getSession`.
 *
 * A camada de persistência (memória, D1 ou outra) é injetada. Este módulo
 * não abre rotas, não emite sessão e não escolhe um tenant padrão.
 */

export const ROLES = ['viewer', 'operator', 'admin'] as const;

export type Role = (typeof ROLES)[number];

export interface AuthContext {
  readonly userId: string;
  readonly tenantId: string;
  readonly role: Role;
  readonly sessionId: string;
}

/**
 * Registro de sessão guardado no servidor.
 * `expiresAt` e `revokedAt` são epoch em milissegundos.
 * `role` é string para que um papel desconhecido falhe fechado em `requireAuth`.
 */
export interface SessionRecord {
  readonly sessionId: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly role: string;
  readonly expiresAt: number;
  readonly revokedAt?: number | null;
}

export interface AuthEnv {
  /** Relógio injetável. Padrão: `Date.now`. */
  readonly now?: () => number;
  /** Única fonte de identidade. Retorna o registro do servidor ou null. */
  readonly getSession: (
    sessionId: string,
  ) => Promise<SessionRecord | null | undefined> | SessionRecord | null | undefined;
}

/** Pedido mínimo. Compatível com `express.Request` (headers, query, body). */
export interface RequireAuthRequest {
  readonly headers?: { readonly [key: string]: unknown } | null;
  readonly query?: { readonly [key: string]: unknown } | null;
  readonly body?: unknown;
}

export type AuthFailureCode = 'unauthenticated' | 'tenant_mismatch' | 'incomplete_session';

export class AuthError extends Error {
  readonly status: 401 | 403;
  readonly code: AuthFailureCode;

  constructor(status: 401 | 403, code: AuthFailureCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/** Nome do cookie que pode carregar só o id opaco da sessão (HttpOnly na emissão). */
export const SESSION_COOKIE_NAME = 'b360_session';

const OPAQUE_SESSION_ID = /^[A-Za-z0-9_-]{16,128}$/;

const TENANT_HEADER_NAMES = ['x-tenant-id', 'x-tenant_id', 'tenant-id', 'tenant_id'];

/**
 * Resolve a sessão e devolve o contexto autenticado.
 *
 * @throws {AuthError} 401 quando não há credencial, a sessão não existe,
 * expirou, foi revogada, ou as credenciais apresentadas discordam.
 * @throws {AuthError} 403 quando o `tenant_id` enviado pelo cliente diverge
 * do tenant da sessão, ou quando o registro não tem `userId`, `tenantId`
 * ou um papel conhecido. Nunca substitui esses campos por um default.
 */
export async function requireAuth(request: RequireAuthRequest, env: AuthEnv): Promise<AuthContext> {
  const now = env.now ? env.now() : Date.now();
  const headers = request.headers ?? {};
  const sessionId = resolveOpaqueSessionId(headers);
  const record = await env.getSession(sessionId);

  if (!record || record.sessionId !== sessionId) {
    throw new AuthError(401, 'unauthenticated', 'Sessão ausente ou inválida.');
  }

  if (isRevoked(record.revokedAt)) {
    throw new AuthError(401, 'unauthenticated', 'Sessão revogada.');
  }

  if (!Number.isFinite(record.expiresAt) || record.expiresAt <= now) {
    throw new AuthError(401, 'unauthenticated', 'Sessão expirada.');
  }

  const userId = requiredIdentity(record.userId);
  const tenantId = requiredIdentity(record.tenantId);
  const role = knownRole(record.role);

  if (!userId || !tenantId || !role) {
    throw new AuthError(
      403,
      'incomplete_session',
      'Sessão sem tenant, usuário ou papel. Acesso negado.',
    );
  }

  const clientTenants = collectClientTenants(request);
  if (clientTenants.some((value) => value !== tenantId)) {
    throw new AuthError(
      403,
      'tenant_mismatch',
      'tenant_id do cliente diverge da sessão.',
    );
  }

  return {
    userId,
    tenantId,
    role,
    sessionId: record.sessionId,
  };
}

function requiredIdentity(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function knownRole(value: unknown): Role | null {
  if (typeof value !== 'string') return null;
  return (ROLES as readonly string[]).includes(value) ? (value as Role) : null;
}

function isRevoked(revokedAt: number | null | undefined): boolean {
  return revokedAt !== null && revokedAt !== undefined;
}

function resolveOpaqueSessionId(headers: { readonly [key: string]: unknown }): string {
  const bearer = parseBearer(headerValue(headers, 'authorization'));
  const cookies = parseCookieHeader(headerValue(headers, 'cookie'));
  const cookie = cookies[SESSION_COOKIE_NAME] ?? null;

  if (bearer && cookie && bearer !== cookie) {
    throw new AuthError(401, 'unauthenticated', 'Credenciais de sessão divergentes.');
  }

  const candidate = bearer ?? cookie;
  if (!candidate || !OPAQUE_SESSION_ID.test(candidate)) {
    throw new AuthError(401, 'unauthenticated', 'Sessão ausente ou inválida.');
  }

  return candidate;
}

function parseBearer(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(authorization);
  return match ? match[1] : null;
}

function headerValue(
  headers: { readonly [key: string]: unknown },
  name: string,
): string | undefined {
  const target = name.toLowerCase();
  for (const [key, raw] of Object.entries(headers)) {
    if (key.toLowerCase() !== target) continue;
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw)) {
      const first = raw.find((item) => typeof item === 'string');
      return typeof first === 'string' ? first : undefined;
    }
  }
  return undefined;
}

function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const cookies: Record<string, string> = {};
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator <= 0) continue;
    const key = part.slice(0, separator).trim();
    const rawValue = part.slice(separator + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(rawValue);
    } catch {
      throw new AuthError(401, 'unauthenticated', 'Cookie de sessão ilegível.');
    }
  }
  return cookies;
}

function collectClientTenants(request: RequireAuthRequest): string[] {
  const values: string[] = [];
  const push = (raw: unknown) => {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.length > 0) values.push(trimmed);
      return;
    }
    if (Array.isArray(raw)) raw.forEach(push);
  };

  const headers = request.headers ?? {};
  for (const name of TENANT_HEADER_NAMES) push(headerValue(headers, name));

  const query = request.query ?? {};
  push(query.tenant_id);
  push(query.tenantId);

  if (request.body && typeof request.body === 'object' && !Array.isArray(request.body)) {
    const body = request.body as { readonly [key: string]: unknown };
    push(body.tenant_id);
    push(body.tenantId);
  }

  const cookies = parseCookieHeader(headerValue(headers, 'cookie'));
  push(cookies.tenant_id);
  push(cookies.tenantId);

  return values;
}
