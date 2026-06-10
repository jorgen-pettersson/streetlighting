import L, { type DivIcon, type LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
  Polyline,
} from 'react-leaflet'
import { useEffect } from 'react'
import marker2x from 'leaflet/dist/images/marker-icon-2x.png'
import marker1x from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { Location } from '../services/locations'
import type { TranslationKey } from '../i18n'

const lineColor = 'rgba(255, 140, 66, 0.6)'
const lineWeight = 3

const defaultIcon = new L.Icon({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -28],
  shadowSize: [41, 41],
})

const statusIcons: Record<string, DivIcon> = {
  ok: L.divIcon({ className: 'marker-dot dot-ok' }),
  broken: L.divIcon({ className: 'marker-dot dot-broken' }),
  action_required: L.divIcon({ className: 'marker-dot dot-action' }),
}

const currentLocationIcon = L.divIcon({ className: 'marker-dot dot-current' })

const electricSourceRingClasses: Record<string, string> = {
  'Network A': 'ring-source1',
  'Network B': 'ring-source2',
  'Network C': 'ring-source3',
}

function getElectricSourceRingClass(electricSource?: string): string {
  if (!electricSource) return ''
  return electricSourceRingClasses[electricSource] || ''
}

function getIcon(status?: string, electricSource?: string) {
  const baseIcon = statusIcons[status ?? 'ok'] ?? defaultIcon
  
  if (!electricSource) return baseIcon
  
  const ringClass = getElectricSourceRingClass(electricSource)
  if (!ringClass) return baseIcon
  
  return L.divIcon({ className: `${baseIcon.options.className} ${ringClass}` })
}

type Props = {
  locations: Location[]
  activeId: string | null
  center: { lat: number; lng: number }
  pendingCoords: { lat: number; lng: number }
  moveCoords: { lat: number; lng: number }
  originalCoords: { lat: number; lng: number } | null
  currentLocation: { lat: number; lng: number } | null
  placing: boolean
  moving: boolean
  canEdit: boolean
  onMapClick: (coords: { lat: number; lng: number }) => void
  onSelect: (id: string | null) => void
  onMoveStart: (id: string) => void
  onCenterChange: (coords: { lat: number; lng: number }) => void
  t: (key: TranslationKey) => string
}

function Recenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng])
  }, [center.lat, center.lng, map])
  return null
}

function MapClicks({ onClick }: { onClick: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onClick({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })
  return null
}

function CenterWatcher({
  enabled,
  onCenterChange,
}: {
  enabled: boolean
  onCenterChange: (coords: { lat: number; lng: number }) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!enabled) return
    const c = map.getCenter()
    onCenterChange({ lat: c.lat, lng: c.lng })
  }, [enabled, map, onCenterChange])

  useMapEvents({
    move() {
      if (!enabled) return
      const c = map.getCenter()
      onCenterChange({ lat: c.lat, lng: c.lng })
    },
    zoom() {
      if (!enabled) return
      const c = map.getCenter()
      onCenterChange({ lat: c.lat, lng: c.lng })
    },
  })

  return null
}

export function MapView({
  locations,
  activeId,
  center,
  pendingCoords,
  moveCoords,
  originalCoords,
  currentLocation,
  placing,
  moving,
  canEdit,
  onMapClick,
  onSelect,
  onMoveStart,
  onCenterChange,
  t,
}: Props) {
  useEffect(() => {
    // prewarm the tile server a touch
    fetch('https://tile.openstreetmap.org/0/0/0.png').catch(() => {})
  }, [])

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom
      className="map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} />
      <CenterWatcher enabled={placing || moving} onCenterChange={onCenterChange} />
      <MapClicks onClick={onMapClick} />
      {currentLocation && (
        <Marker position={[currentLocation.lat, currentLocation.lng]} opacity={0.95} icon={currentLocationIcon}>
          <Popup>{t('popupCurrentLocation')}</Popup>
        </Marker>
      )}
      {placing && (
        <Marker position={[pendingCoords.lat, pendingCoords.lng]} opacity={0.9} icon={getIcon('action_required')}>
          <Popup>{t('popupPending')}</Popup>
        </Marker>
      )}
      {moving && originalCoords && (
        <>
          <Polyline
            positions={[
              [originalCoords.lat, originalCoords.lng],
              [moveCoords.lat, moveCoords.lng],
            ]}
            color={lineColor}
            weight={lineWeight}
            dashArray="8, 8"
          />
          <Marker position={[originalCoords.lat, originalCoords.lng]} opacity={0.3} icon={getIcon('action_required')} />
          <Marker position={[moveCoords.lat, moveCoords.lng]} opacity={0.9} icon={getIcon('action_required')}>
            <Popup>{t('popupPending')}</Popup>
          </Marker>
        </>
      )}
      {locations.map((location) => {
        const isMovingTarget = moving && activeId === location.id
        const isDimmed = (moving && activeId !== location.id) || (! moving && activeId && activeId !== location.id)
        
        if (isMovingTarget) return null
          
        return (
          <Marker
            key={location.id}
            position={[location.lat, location.lng]}
            opacity={isDimmed ? 0.4 : 1}
            icon={getIcon(location.status, location.electricSource)}
            eventHandlers={{ click: () => onSelect(location.id) }}
          >
            <Popup>
              <strong>{location.name || t('popupUntitled')}</strong>
              <div className="popup-text">{location.description || t('popupNoDescription')}</div>
              <div className="popup-meta">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </div>
              <div className="popup-meta">{t(`status_${location.status ?? 'ok'}` as any)}</div>
              {canEdit && activeId === location.id && !placing && !moving && (
                <div style={{ marginTop: 8 }}>
                  <button
                    style={{
                      background: 'rgba(255, 140, 66, 0.2)',
                      border: '1px solid rgba(255, 140, 66, 0.5)',
                      color: '#ff8c42',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onMoveStart(location.id)
                    }}
                  >
                    {t('popupMove')}
                  </button>
                </div>
              )}
            </Popup>
          </Marker>
        )
      })}
      {activeId && null}
    </MapContainer>
  )
}

export default MapView
