import { useState } from 'react'
import type { JournalEntry } from '../services/journal'
import type { TranslationKey } from '../i18n'

type Props = {
  entries: JournalEntry[]
  t: (key: TranslationKey) => string
}

export function JournalList({ entries, t }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

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
      {entries.map((entry) => {
        const expanded = openId === entry.id
        const created = entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleString() : ''

        return (
          <article
            key={entry.id}
            className={`list-item ${expanded ? 'active' : ''}`}
            onClick={() => setOpenId(expanded ? null : entry.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setOpenId(expanded ? null : entry.id)
              }
            }}
          >
            <div>
              <div className="title-row">
                <h4>{entry.title || t('journalTitle')}</h4>
              </div>
              <p className="muted">
                {t('journalBy')} {entry.authorName || entry.authorEmail || entry.authorId || '—'}
              </p>
              <p className="coords">{created}</p>
              {expanded && (
                <>
                  <p className="muted">{entry.description || '—'}</p>
                  <div className="journal-images">
                    {entry.image1 && (
                      <img src={entry.image1} alt="journal" className="journal-thumb" loading="lazy" />
                    )}
                  </div>
                </>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default JournalList
