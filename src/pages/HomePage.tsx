import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import LocationList from '../components/LocationList'
import MapView from '../components/MapView'
import {
  createLocation,
  deleteLocation,
  listenToLocations,
  updateLocation,
  type Location,
} from '../services/locations'
import { exportToCsv } from '../utils/csv'
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
  const [showJournalForm, setShowJournalForm] = useState(false)
  const [geoAttempted, setGeoAttempted] = useState(false)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'success' | 'denied' | 'unavailable' | 'error'>('idle')
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [moving, setMoving] = useState(false)
  const [moveCoords, setMoveCoords] = useState(DEFAULT_CENTER)
  const [originalCoords, setOriginalCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [journal, setJournal] = useState<JournalEntry[]>([])

  const isMobileDevice = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    const uaDataMobile = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile
    if (typeof uaDataMobile === 'boolean') return uaDataMobile
    const ua = navigator.userAgent || ''
    return /Android|iPhone|iPad|iPod|Mobile|Tablet|Windows Phone/i.test(ua) && !/Windows NT/i.test(ua)
  }, [])

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
    if (geoAttempted) return
    if (typeof window === 'undefined') return
    if (!navigator?.geolocation) {
      setGeoStatus('unavailable')
      setGeoAttempted(true)
      return
    }
    if (!isMobileDevice) return

    try {
      setGeoStatus('locating')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }
          setDraftCoords(coords)
          setPendingCoords(coords)
          setCurrentLocation(coords)
          setGeoStatus('success')
          setGeoAttempted(true)
        },
        (err) => {
          setGeoStatus(err.code === 1 ? 'denied' : 'error')
          setGeoAttempted(true)
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 },
      )
    } catch {
      setGeoStatus('error')
      setGeoAttempted(true)
    }
  }, [user, isMobileDevice, geoAttempted])

  const locateMe = () => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      setGeoStatus('unavailable')
      return
    }

    setGeoStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        setDraftCoords(coords)
        setPendingCoords(coords)
        setCurrentLocation(coords)
        setGeoStatus('success')
      },
      (err) => {
        setGeoStatus(err.code === 1 ? 'denied' : 'error')
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 },
    )
  }

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
    if (!locations.length) return
    if (!activeId) {
      const first = locations[0]
      setDraftCoords({ lat: first.lat, lng: first.lng })
      return
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

  }

  const confirmPlacement = () => {
    setDraftCoords(pendingCoords)
    setPlacing(false)
    setActiveId(null)
  }

  const cancelPlacement = () => {
    setPlacing(false)
    setPendingCoords(draftCoords)
  }

  const startMove = (id: string) => {
    const location = locations.find((l) => l.id === id)
    if (!location || !canEdit) {
      setError(t('needAdminAdd'))
      return
    }
    setError(null)
    setOriginalCoords({ lat: location.lat, lng: location.lng })
    setMoveCoords({ lat: location.lat, lng: location.lng })
    setMoving(true)
  }

  const confirmMove = async () => {
    if (!activeLocation || !moving || !canEdit) return
    setSaving(true)
    setError(null)

    try {
      await updateLocation(activeLocation.id, { lat: moveCoords.lat, lng: moveCoords.lng })
      setDraftCoords(moveCoords)
      setMoving(false)
      setOriginalCoords(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to move location'
      setError(message)
      setMoving(false)
      setOriginalCoords(null)
    } finally {
      setSaving(false)
    }
  }

  const cancelMove = () => {
    setMoving(false)
    setOriginalCoords(null)
    if (activeLocation) {
      setMoveCoords({ lat: activeLocation.lat, lng: activeLocation.lng })
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{t('appTitle')}</p>
          <h1>{t('subtitle')}</h1>
        </div>
        <div className="actions-row">
          {isMobileDevice && (
            <button className="ghost" onClick={locateMe} disabled={geoStatus === 'locating'}>
              {geoStatus === 'locating' ? 'Locating…' : 'Use my location'}
            </button>
          )}
          {!placing && (
            <button
              className="primary"
              onClick={startPlacement}
              disabled={saving || !canEdit || roleLoading}
            >
              {canEdit ? t('addPoint') : t('adminOnly')}
            </button>
          )}
          {canEdit && (
            <button
              className="ghost"
              onClick={() => exportToCsv(locations, locale)}
              disabled={loading || locations.length === 0}
            >
              {t('exportButton')}
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
              : moving
                ? t('badgeMoving')
                : geoStatus === 'success'
                  ? 'Location active'
                  : geoStatus === 'denied'
                    ? 'Location denied'
                    : geoStatus === 'unavailable'
                      ? 'Location unavailable'
                      : geoStatus === 'error'
                        ? 'Location failed'
                        : t('badgeDefault')}
          </div>
          {(placing || moving) && (
            <div className="crosshair-overlay">
              <div className="hair">
                <span className="dot" />
              </div>
            </div>
          )}
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
          {moving && (
            <div className={`move-controls ${isMobileDevice ? 'mobile' : 'desktop'}`}>
              <div className="move-controls-content">
                <div className="move-info">
                  <p className="eyebrow">{t('movingPoint')}</p>
                  <p className="coords">
                    {moveCoords.lat.toFixed(5)}, {moveCoords.lng.toFixed(5)}
                  </p>
                </div>
                <div className="move-actions">
                  <button className="primary" onClick={confirmMove} disabled={saving}>
                    {saving ? t('moving') : t('confirmMove')}
                  </button>
                  <button className="ghost" onClick={cancelMove} disabled={saving}>
                    {t('cancelMove')}
                  </button>
                </div>
              </div>
            </div>
          )}
          {moving && activeLocation && (
            <div className="crosshair-overlay">
              <div className="hair">
                <span className="dot" />
              </div>
              <div className="placement-card">
                <p className="eyebrow">Moving: {activeLocation.name || t('popupUntitled')}</p>
                <p className="coords">
                  {moveCoords.lat.toFixed(5)}, {moveCoords.lng.toFixed(5)}
                </p>
                <div className="placement-actions">
                  <button className="primary" onClick={confirmMove} disabled={saving}>
                    {saving ? t('moving') : t('confirmMove')}
                  </button>
                  <button className="ghost" onClick={cancelMove} disabled={saving}>
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
            moving={moving}
            pendingCoords={pendingCoords}
            moveCoords={moveCoords}
            originalCoords={originalCoords}
            currentLocation={currentLocation}
            canEdit={canEdit}
            t={t}
            onMapClick={(coords) => {
              if (placing) {
                setPendingCoords(coords)
              } else if (moving) {
                setMoveCoords(coords)
              } else {
                setDraftCoords(coords)
                setActiveId(null)
              }
            }}
            onSelect={(id) => {
              setActiveId(id)
              if (id) {
                const found = locations.find((item) => item.id === id)
                if (found) {
                  setDraftCoords({ lat: found.lat, lng: found.lng })
                }
              }
            }}
            onMoveStart={(id) => {
              startMove(id)
            }}
            onCenterChange={(coords) => {
              if (placing) {
                setPendingCoords(coords)
              } else if (moving) {
                setMoveCoords(coords)
              }
            }}
          />
        </section>

        <aside className="panel">
          {error && <div className="error">{error}</div>}
          {loading && <div className="muted">{t('loadingPoints')}</div>}
          {placing && (
            <div className="card muted">
              <p className="eyebrow">{t('pendingLocation')}</p>
              <p>{t('addFlowHint')}</p>
            </div>
          )}

          <LocationList
            locations={locations}
            activeId={activeId}
            onSelect={(id) => {
              setActiveId(id)
              if (id) {
                const found = locations.find((item) => item.id === id)
                if (found) setDraftCoords({ lat: found.lat, lng: found.lng })
              }
            }}
            onDelete={(id) => handleDelete(id)}
            canEdit={canEdit}
            t={t}
            draftCoords={draftCoords}
            saving={saving}
            onSubmit={handleSubmit}
            onReset={() => setActiveId(null)}
            journal={journal}
            showJournalForm={showJournalForm}
            setShowJournalForm={setShowJournalForm}
            onJournalSubmit={handleJournalSubmit}
          />
        </aside>
      </main>
    </div>
  )
}

export default HomePage
