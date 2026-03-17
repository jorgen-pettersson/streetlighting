import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

export function NotFoundPage() {
  const { t } = useI18n()
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">404</p>
        <h1>{t('notFoundTitle')}</h1>
        <p className="muted">{t('notFoundMessage')}</p>
        <Link className="primary" to="/">
          {t('backToMap')}
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
