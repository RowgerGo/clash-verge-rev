import { useSyncExternalStore } from 'react'

import {
  AccountRequestError,
  type AccountSession,
  loginAccount,
  logoutAccount,
} from '@/services/account'
import { mutate } from '@/services/mutate'

type AccountMessage = AccountRequestError['code'] | 'expired' | 'logout_failed'

interface AccountState {
  readonly session: AccountSession | null
  readonly pending: 'login' | 'logout' | null
  readonly message: AccountMessage | null
}

const accountIntent = { id: 'account-session', errorNotice: false } as const
const subscribers = new Set<() => void>()
let state: AccountState = { session: null, pending: null, message: null }
let expiryTimer: number | undefined

const publish = (next: AccountState) => {
  state = next
  subscribers.forEach((subscriber) => subscriber())
}

const subscribe = (subscriber: () => void) => {
  subscribers.add(subscriber)
  return () => {
    subscribers.delete(subscriber)
  }
}

const getSnapshot = () => state

export const useAccountState = () =>
  useSyncExternalStore(subscribe, getSnapshot)

export async function signIn(username: string, password: string) {
  if (state.pending || state.session) return false
  publish({ session: null, pending: 'login', message: null })

  try {
    const { value: session } = await mutate(
      () => loginAccount(username, password),
      accountIntent,
    )
    const timeUntilExpiry = Date.parse(session.expires_at) - Date.now()
    if (timeUntilExpiry <= 0) {
      publish({ session: null, pending: null, message: 'expired' })
      return false
    }

    expiryTimer = window.setTimeout(() => {
      if (state.session === session && !state.pending) {
        publish({ session: null, pending: null, message: 'expired' })
      }
    }, timeUntilExpiry)
    publish({ session, pending: null, message: null })
    return true
  } catch (error) {
    publish({
      session: null,
      pending: null,
      message:
        error instanceof AccountRequestError ? error.code : 'request_failed',
    })
    return false
  }
}

export async function signOut() {
  const { session, pending } = state
  if (!session || pending) return
  window.clearTimeout(expiryTimer)
  publish({ session, pending: 'logout', message: null })

  let message: AccountMessage | null = null
  try {
    await mutate(() => logoutAccount(session.token), accountIntent)
  } catch {
    message = 'logout_failed'
  } finally {
    publish({ session: null, pending: null, message })
  }
}
