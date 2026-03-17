import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import LocationForm from '../components/LocationForm'
import LocationList from '../components/LocationList'
import MapView from '../components/MapView'
import JournalForm from '../components/JournalForm'
import JournalList from '../components/JournalList'
import {
  createLocation,
  deleteLocation,
  listenToLocations,
  updateLocation,
  type Location,
} from '../services/locations'
import { listenToRole, type Role } from '../services/roles'
import { locales, useI18n } from '../i18n'
import { addJournalEntry, listenToJournal, type JournalEntry } from '../services/journal'

const DEFAULT_CENTER = { lat: 51.5074, lng: -0.1278 }

export function HomePage() {
  const { user, signOutUser } = useAuth()
  const { t, locale, setLocale } = useI18n()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftCoords, setDraftCoords] = useState(DEFAULT_CENTER)
  const [pendingCoords, setPendingCoords] = useState(DEFAULT_CENTER)
  const [placing, setPlacing] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [role, setRole] = useState<Role>('viewer')
  const [roleLoading, setRoleLoading] = useState(true)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'success' | 'denied' | 'error'>('idle')
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [formReady, setFormReady] = useState(false)
  const [showJournalForm, setShowJournalForm] = useState(false)

  useEffect(() => {
    if (!user) return
    setRoleLoading(true)

    if (!user.email) {
      setRole('viewer')
      setRoleLoading(false)
      console.warn('[roles] user has no email, defaulting to viewer')
      return
    }

    const stop = listenToRole(
      user.email,
      (next) => {
        setRole(next)
        setRoleLoading(false)
        console.info('[roles] set role', { role: next })
      },
      (err) => {
        setRole('viewer')
        setRoleLoading(false)
        console.error('[roles] error loading role', err)
        setError(err.message)
      },
    )

    return () => stop()
  }, [user])

  useEffect(() => {
    if (!activeId) {
      setJournal([])
      setShowJournalForm(false)
      return
    }

    const stop = listenToJournal(
      activeId,
      (items) => setJournal(items),
      (err) => {
        console.error('[journal] error', err)
      },
    )

    return () => stop()
  }, [activeId])

  useEffect(() => {
    if (!user) return
    if (geoStatus === 'success' || geoStatus === 'denied') return

    if (!navigator.geolocation) {
      setGeoStatus('error')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        setDraftCoords(coords)
        setPendingCoords(coords)
        setGeoStatus('success')
      },
      (err) => {
        console.warn('[geo] denied/error', err)
        setGeoStatus(err.code === 1 ? 'denied' : 'error')
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    )
  }, [user, geoStatus])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError(null)

    const unsub = listenToLocations(
      (items) => {
        setLocations(items)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )

    return () => unsub()
  }, [user])

  const activeLocation = useMemo(
    () => locations.find((item) => item.id === activeId) ?? null,
    [locations, activeId],
  )

  const canEdit = role === 'admin' && !roleLoading

  useEffect(() => {
    if (!activeId && locations.length) {
      const first = locations[0]
      setDraftCoords({ lat: first.lat, lng: first.lng })
    }
  }, [activeId, locations])

  const handleSubmit = async (values: {
    name: string
    description: string
    lat: number
    lng: number
    color: string
    status: 'ok' | 'broken' | 'action_required'
  }) => {
    if (!user || !canEdit) {
      setError(t('needAdminSave'))
      return
    }
    setPlacing(false)
    setSaving(true)
    setError(null)

    try {
      if (activeLocation) {
        await updateLocation(activeLocation.id, values)
      } else {
        await createLocation({ ...values, ownerId: user.uid })
        setActiveId(null)
        setFormReady(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save location'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!canEdit) {
      setError(t('needAdminDelete'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await deleteLocation(id)
      if (activeId === id) {
        setActiveId(null)
        setFormReady(false)
        setShowJournalForm(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete location'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const userLabel = user?.displayName || user?.email || 'Guest'

  const handleJournalSubmit = async (input: {
    title: string
    description: string
    imageData?: string
  }) => {
    if (!user || !canEdit || !activeId) return
    const entryId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`

    await addJournalEntry(activeId, {
      title: input.title,
      description: input.description,
      image1: input.imageData,
      authorId: user.uid,
      authorName: user.displayName,
      authorEmail: user.email,
    }, entryId)
    setShowJournalForm(false)
  }

  const startPlacement = () => {
    if (!canEdit) {
      setError(t('needAdminAdd'))
      return
    }
    setError(null)
    setActiveId(null)
    setPlacing(true)
    setPendingCoords(draftCoords)
    setFormReady(false)
  }

  const confirmPlacement = () => {
    setDraftCoords(pendingCoords)
    setPlacing(false)
    setActiveId(null)
    setFormReady(true)
  }

  const cancelPlacement = () => {
    setPlacing(false)
    setPendingCoords(draftCoords)
    setFormReady(false)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{t('appTitle')}</p>
          <h1>{t('subtitle')}</h1>
        </div>
        <div className="actions-row">
          {!placing && (
            <button
              className="primary"
              onClick={startPlacement}
              disabled={saving || !canEdit || roleLoading}
            >
              {canEdit ? t('addPoint') : t('adminOnly')}
            </button>
          )}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as typeof locale)}
            className="ghost"
          >
            {locales.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="user-chip">
            <div>
              <p className="eyebrow">{t('signedIn')} · {roleLoading ? '...' : role}</p>
              <strong>{userLabel}</strong>
            </div>
            <button className="ghost" onClick={() => void signOutUser()}>
              {t('signOut')}
            </button>
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="map-wrapper">
          <div className="badge">
            {placing
              ? t('badgePlacing')
              : geoStatus === 'success'
                ? t('badgeCentered')
                : geoStatus === 'denied'
                  ? t('badgeDenied')
                  : t('badgeDefault')}
          </div>
          {placing && (
            <div className="crosshair-overlay">
              <div className="hair">
                <span className="dot" />
              </div>
              <div className="placement-card">
                <p className="eyebrow">Pending location</p>
                <p className="coords">
                  {pendingCoords.lat.toFixed(5)}, {pendingCoords.lng.toFixed(5)}
                </p>
                <div className="placement-actions">
                  <button className="primary" onClick={confirmPlacement}>
                    {t('confirmSpot')}
                  </button>
                  <button className="ghost" onClick={cancelPlacement}>
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}
          <MapView
            locations={locations}
            activeId={activeId}
            center={draftCoords}
            placing={placing}
            pendingCoords={pendingCoords}
            t={t}
            onMapClick={(coords) => {
              if (placing) {
                setPendingCoords(coords)
              } else {
                setDraftCoords(coords)
                setActiveId(null)
                setFormReady(false)
              }
            }}
            onSelect={(id) => {
              setActiveId(id)
              const found = locations.find((item) => item.id === id)
              if (found) {
                setDraftCoords({ lat: found.lat, lng: found.lng })
                setFormReady(true)
              }
            }}
            onCenterChange={(coords) => {
              if (placing) {
                setPendingCoords(coords)
              }
            }}
          />
        </section>

        <aside className="panel">
          {error && <div className="error">{error}</div>}
          {loading && <div className="muted">{t('loadingPoints')}</div>}

          <LocationList
            locations={locations}
            activeId={activeId}
            onSelect={(id) => {
              setActiveId(id)
              const found = locations.find((item) => item.id === id)
              if (found) setDraftCoords({ lat: found.lat, lng: found.lng })
              setFormReady(true)
              setShowJournalForm(false)
            }}
            onDelete={(id) => handleDelete(id)}
            canEdit={canEdit}
            t={t}
          />

          {!placing && formReady ? (
            <LocationForm
              initialCoords={draftCoords}
              activeLocation={activeLocation}
              loading={saving}
              canEdit={canEdit}
              t={t}
              onSubmit={handleSubmit}
              onReset={() => setActiveId(null)}
            />
          ) : (
            <div className="card muted">
              <p className="eyebrow">{t('pendingLocation')}</p>
              <p>{placing ? t('addFlowHint') : t('formPromptSelect')}</p>
            </div>
          )}

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
              <JournalList entries={journal} t={t} />
              {canEdit && showJournalForm && (
                <JournalForm
                  onSubmit={handleJournalSubmit}
                  onCancel={() => setShowJournalForm(false)}
                  disabled={!canEdit}
                  t={t}
                />
              )}
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}

export default HomePage
