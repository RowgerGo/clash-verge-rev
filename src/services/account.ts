import { fetch } from '@tauri-apps/plugin-http'

export interface AccountSession {
  token: string
  expires_at: string
  identity: {
    user_id: string
    username: string
    role: 'admin' | 'user'
  }
}

type AccountErrorCode =
  | 'unauthorized'
  | 'rate_limited'
  | 'tls_required'
  | 'network'
  | 'request_failed'

export class AccountRequestError extends Error {
  constructor(readonly code: AccountErrorCode) {
    super(code)
    this.name = 'AccountRequestError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isAccountSession(value: unknown): value is AccountSession {
  if (!isRecord(value) || !isRecord(value.identity)) return false

  const { token, expires_at, identity } = value
  return (
    typeof token === 'string' &&
    /^\S+$/.test(token) &&
    typeof expires_at === 'string' &&
    Number.isFinite(Date.parse(expires_at)) &&
    typeof identity.user_id === 'string' &&
    typeof identity.username === 'string' &&
    identity.username.length > 0 &&
    (identity.role === 'admin' || identity.role === 'user')
  )
}

async function postAccount(
  action: 'login' | 'logout',
  headers: Record<string, string>,
  body?: string,
): Promise<unknown> {
  const url = new URL(
    `/api/auth/${action}`,
    import.meta.env.XRAY_ACCOUNT_API_URL,
  )
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', ...headers },
      body,
      connectTimeout: 10_000,
      maxRedirections: 0,
      signal: controller.signal,
    })

    if (!response.ok && response.status !== 400) {
      void response.body?.cancel().catch(() => {})
      if (response.status === 401) throw new AccountRequestError('unauthorized')
      if (response.status === 429) throw new AccountRequestError('rate_limited')
      throw new AccountRequestError('request_failed')
    }

    const result: unknown = await response.json()
    if (!isRecord(result)) throw new AccountRequestError('request_failed')

    if (response.status === 400 && result.error === 'tls_required') {
      throw new AccountRequestError('tls_required')
    }
    if (!response.ok || result.error !== '' || !('data' in result)) {
      throw new AccountRequestError('request_failed')
    }

    return result.data
  } catch (error) {
    if (error instanceof AccountRequestError) throw error
    throw new AccountRequestError(
      error instanceof SyntaxError ? 'request_failed' : 'network',
    )
  } finally {
    clearTimeout(timeout)
  }
}

export async function loginAccount(
  username: string,
  password: string,
): Promise<AccountSession> {
  const session = await postAccount(
    'login',
    { 'Content-Type': 'application/json' },
    JSON.stringify({ username, password }),
  )
  if (!isAccountSession(session))
    throw new AccountRequestError('request_failed')
  return session
}

export async function logoutAccount(token: string): Promise<void> {
  try {
    await postAccount('logout', { Authorization: `Bearer ${token}` })
  } catch (error) {
    if (error instanceof AccountRequestError && error.code === 'unauthorized') {
      return
    }
    throw error
  }
}
