import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { locales, useI18n } from '../i18n'

export function LoginPage() {
  const { signInWithGoogle, signInAsGuest, loading, user } = useAuth()
  const { t, locale, setLocale } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleGoogle = async () => {
    setBusy(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const handleGuest = async () => {
    setBusy(true)
    setError(null)
    try {
      await signInAsGuest()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Guest sign-in failed'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const disabled = loading || busy

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <p className="eyebrow">{t('appTitle')}</p>
            <h1>{t('loginTitle')}</h1>
          </div>
          <select value={locale} onChange={(e) => setLocale(e.target.value as typeof locale)}>
            {locales.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <p className="muted">{t('loginSubtitle')}</p>
        {error && <div className="error">{error}</div>}
        <div className="auth-actions">
          <button className="primary" onClick={() => void handleGoogle()} disabled={disabled}>
            {disabled ? t('loginWait') : t('loginGoogle')}
          </button>
          <button className="ghost" onClick={() => void handleGuest()} disabled={disabled}>
            {disabled ? t('loginLoading') : t('loginGuest')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
