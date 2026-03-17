import type { TranslationKey } from '../i18n'
import type { Location } from '../services/locations'

type Props = {
  locations: Location[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => Promise<void>
  canEdit: boolean
  t: (key: TranslationKey) => string
}

export function LocationList({ locations, activeId, onSelect, onDelete, canEdit, t }: Props) {
  if (!locations.length) {
    return (
      <div className="card muted">
        <p className="eyebrow">{t('listEmptyTitle')}</p>
        <p>{canEdit ? t('listEmptyEdit') : t('listEmptyView')}</p>
      </div>
    )
  }

  return (
    <div className="list">
      {locations.map((location) => (
        <article
          key={location.id}
          className={`list-item ${activeId === location.id ? 'active' : ''}`}
          onClick={() => onSelect(location.id)}
        >
          <div>
            <div className="title-row">
              <span
                className={`dot dot-${location.status ?? 'ok'}`}
                aria-hidden
                title={t(`status_${location.status ?? 'ok'}` as any)}
              />
              <span className="status-pill inline">{t(`status_${location.status ?? 'ok'}` as any)}</span>
              <h4>{location.name || 'Untitled point'}</h4>
            </div>
            <p className="muted">{location.description || t('popupNoDescription')}</p>
          </div>
          {canEdit && (
            <button
              className="ghost"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                void onDelete(location.id)
              }}
            >
              {t('listDelete')}
            </button>
          )}
        </article>
      ))}
    </div>
  )
}

export default LocationList
