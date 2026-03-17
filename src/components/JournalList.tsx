import type { JournalEntry } from '../services/journal'
import type { TranslationKey } from '../i18n'

type Props = {
  entries: JournalEntry[]
  t: (key: TranslationKey) => string
}

export function JournalList({ entries, t }: Props) {
  if (!entries.length) {
    return (
      <div className="card muted">
        <p className="eyebrow">{t('journalTitle')}</p>
        <p>{t('journalEmpty')}</p>
      </div>
    )
  }

  return (
    <div className="list">
      {entries.map((entry) => (
        <article key={entry.id} className="list-item">
          <div>
            <p className="eyebrow">
              {t('journalBy')} {entry.authorName || entry.authorEmail || entry.authorId || '—'}
            </p>
            <h4>{entry.title || t('journalTitle')}</h4>
            <p className="muted">{entry.description || '—'}</p>
            <p className="coords">
              {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleString() : ''}
            </p>
            <div className="journal-images">
              {entry.image1 && <img src={entry.image1} alt="journal" className="journal-thumb" loading="lazy" />}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default JournalList
