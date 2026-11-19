import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { BasePage } from '@/components/base'
import { signIn, signOut, useAccountState } from '@/store/account'

const AccountPage = () => {
  const { t } = useTranslation()
  const { session, pending, message } = useAccountState()

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const username = formData.get('username')
    const password = formData.get('password')
    if (typeof username !== 'string' || typeof password !== 'string') return

    if (await signIn(username, password)) form.reset()
  }

  return (
    <BasePage title={t('layout.components.navigation.tabs.account')}>
      <Paper variant="outlined" sx={{ maxWidth: 440, mx: 'auto', p: 3 }}>
        {session ? (
          <Stack spacing={2}>
            <div>
              <Typography variant="subtitle1" sx={{ overflowWrap: 'anywhere' }}>
                {session.identity.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {session.identity.role === 'admin'
                  ? t('layout.account.roles.admin')
                  : t('layout.account.roles.user')}
              </Typography>
            </div>
            <Typography variant="body2" color="text.secondary">
              {t('layout.account.expiresAt', {
                date: new Date(session.expires_at).toLocaleString(),
              })}
            </Typography>
            <Button
              variant="outlined"
              loading={pending === 'logout'}
              onClick={() => void signOut()}
              sx={{ alignSelf: 'flex-start' }}
            >
              {t('layout.account.logout')}
            </Button>
          </Stack>
        ) : (
          <Stack
            component="form"
            method="post"
            spacing={2}
            onSubmit={handleSubmit}
          >
            {message && (
              <Alert
                severity={
                  message === 'expired' || message === 'logout_failed'
                    ? 'warning'
                    : 'error'
                }
              >
                {t(`layout.account.messages.${message}`)}
              </Alert>
            )}
            <TextField
              id="account-username"
              name="username"
              label={t('layout.account.username')}
              autoComplete="username"
              disabled={pending === 'login'}
              required
            />
            <TextField
              id="account-password"
              name="password"
              label={t('shared.labels.password')}
              type="password"
              autoComplete="current-password"
              disabled={pending === 'login'}
              required
            />
            <Button
              type="submit"
              variant="contained"
              loading={pending === 'login'}
            >
              {t('layout.account.login')}
            </Button>
          </Stack>
        )}
      </Paper>
    </BasePage>
  )
}

export default AccountPage
