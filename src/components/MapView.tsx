import L, { type DivIcon, type LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { useEffect } from 'react'
import marker2x from 'leaflet/dist/images/marker-icon-2x.png'
import marker1x from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { Location } from '../services/locations'
import type { TranslationKey } from '../i18n'

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

function getIcon(status?: string) {
  return statusIcons[status ?? 'ok'] ?? defaultIcon
}

type Props = {
  locations: Location[]
  activeId: string | null
  center: { lat: number; lng: number }
  pendingCoords: { lat: number; lng: number }
  currentLocation: { lat: number; lng: number } | null
  placing: boolean
  onMapClick: (coords: { lat: number; lng: number }) => void
  onSelect: (id: string) => void
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
  currentLocation,
  placing,
  onMapClick,
  onSelect,
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
      <CenterWatcher enabled={placing} onCenterChange={onCenterChange} />
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
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.lat, location.lng]}
          opacity={activeId && activeId !== location.id ? 0.75 : 1}
          icon={getIcon(location.status)}
          eventHandlers={{ click: () => onSelect(location.id) }}
        >
          <Popup>
            <strong>{location.name || t('popupUntitled')}</strong>
            <div className="popup-text">{location.description || t('popupNoDescription')}</div>
            <div className="popup-meta">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </div>
            <div className="popup-meta">{t(`status_${location.status ?? 'ok'}` as any)}</div>
          </Popup>
        </Marker>
      ))}
      {activeId && null}
    </MapContainer>
  )
}

export default MapView
