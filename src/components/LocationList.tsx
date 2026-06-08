import { useRef, useEffect } from 'react'
import type { TranslationKey } from '../i18n'
import type { Location } from '../services/locations'
import type { JournalEntry } from '../services/journal'
import LocationForm from './LocationForm'
import JournalForm from './JournalForm'
import JournalList from './JournalList'

type Props = {
  locations: Location[]
  activeId: string | null
  onSelect: (id: string | null) => void
  onDelete: (id: string) => Promise<void>
  canEdit: boolean
  t: (key: TranslationKey) => string
  // Form props
  draftCoords: { lat: number; lng: number }
  saving: boolean
  onSubmit: (values: {
    name: string
    description: string
    lat: number
    lng: number
    color: string
    status: 'ok' | 'broken' | 'action_required'
    maintenanceResponsibility?: 'BTEA' | 'Röröns vägbelysning'
    electricSource?: string
  }) => Promise<void>
  onReset: () => void
  // Journal props
  journal: JournalEntry[]
  showJournalForm: boolean
  setShowJournalForm: (show: boolean) => void
  onJournalSubmit: (input: {
    title: string
    description: string
    imageData?: string
  }) => Promise<void>
}

export function LocationList({
  locations,
  activeId,
  onSelect,
  onDelete,
  canEdit,
  t,
  draftCoords,
  saving,
  onSubmit,
  onReset,
  journal,
  showJournalForm,
  setShowJournalForm,
  onJournalSubmit,
}: Props) {
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (activeId && itemRefs.current[activeId]) {
      itemRefs.current[activeId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [activeId])

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
      {locations.map((location) => {
        const isExpanded = activeId === location.id
        const activeLocation = isExpanded ? location : null
        const activeJournal = journal.filter(j => j.id === activeLocation?.id)

        const handleItemClick = () => {
          if (activeId === location.id) {
            onSelect(null) // Collapse on second click
          } else {
            onSelect(location.id)
          }
          setShowJournalForm(false)
        }

        return (
          <div key={location.id} ref={(el) => {
            itemRefs.current[location.id] = el
          }}>
            <article
              className={`list-item ${isExpanded ? 'expanded' : activeId === location.id ? 'active' : ''}`}
              onClick={handleItemClick}
            >
              <div className={`list-content ${isExpanded ? 'hidden' : ''}`}>
                <div>
                  <div className="title-row">
                    <span
                      className={`dot dot-${location.status ?? 'ok'}`}
                      aria-hidden
                      title={t(`status_${location.status ?? 'ok'}` as any)}
                    />
                    <span className="status-pill inline">{t(`status_${location.status ?? 'ok'}` as any)}</span>
                    {location.electricSource && (
                      <span className="electric-source">
                        <span className="flash-icon">⚡</span>
                        {location.electricSource}
                      </span>
                    )}
                    <h4>{location.name || 'Untitled point'}</h4>
                  </div>
                  {location.maintenanceResponsibility && (
                    <p className="maintenance-info">{location.maintenanceResponsibility}</p>
                  )}
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
              </div>
            </article>

            {isExpanded && (
              <div className="list-expanded">
                <LocationForm
                  initialCoords={draftCoords}
                  activeLocation={activeLocation}
                  loading={saving}
                  canEdit={canEdit}
                  t={t}
                  onSubmit={onSubmit}
                  onReset={onReset}
                />

                {activeLocation && (
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <p className="eyebrow">{t('journalTitle')}</p>
                        <h3>{activeLocation.name || t('popupUntitled')}</h3>
                      </div>
                      {canEdit && (
                        <button className="ghost" onClick={() => setShowJournalForm(true)}>
                          {t('journalAdd')}
                        </button>
                      )}
                    </div>
                    <JournalList entries={activeJournal} t={t} />
                    {canEdit && showJournalForm && (
                      <JournalForm
                        onSubmit={onJournalSubmit}
                        onCancel={() => setShowJournalForm(false)}
                        disabled={!canEdit}
                        t={t}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default LocationList
