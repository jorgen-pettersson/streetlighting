import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import type { TranslationKey } from '../i18n'
import type { Location } from '../services/locations'

type FormValues = {
  name: string
  description: string
  lat: string
  lng: string
  color: string
  status: 'ok' | 'broken' | 'action_required'
}

type Props = {
  initialCoords: { lat: number; lng: number }
  activeLocation: Location | null
  loading: boolean
  canEdit: boolean
  t: (key: TranslationKey) => string
  onSubmit: (values: {
    name: string
    description: string
    lat: number
    lng: number
    color: string
    status: 'ok' | 'broken' | 'action_required'
  }) => Promise<void>
  onReset: () => void
}

export function LocationForm({ initialCoords, activeLocation, loading, canEdit, onSubmit, onReset, t }: Props) {
  const [values, setValues] = useState<FormValues>({
    name: '',
    description: '',
    lat: initialCoords.lat.toFixed(5),
    lng: initialCoords.lng.toFixed(5),
    color: 'amber',
    status: 'ok',
  })

  useEffect(() => {
    if (activeLocation) {
      setValues({
        name: activeLocation.name,
        description: activeLocation.description ?? '',
        lat: activeLocation.lat.toFixed(5),
        lng: activeLocation.lng.toFixed(5),
        color: activeLocation.color ?? 'amber',
        status: activeLocation.status ?? 'ok',
      })
      return
    }

    setValues((prev) => ({
      ...prev,
      lat: initialCoords.lat.toFixed(5),
      lng: initialCoords.lng.toFixed(5),
      color: 'amber',
      status: 'ok',
    }))
  }, [activeLocation, initialCoords.lat, initialCoords.lng])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canEdit) return
    const lat = Number(values.lat)
    const lng = Number(values.lng)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      alert('Latitude and longitude must be numbers.')
      return
    }

    await onSubmit({
      name: values.name.trim() || 'Untitled point',
      description: values.description.trim(),
      lat,
      lng,
      color: values.color,
      status: values.status,
    })

    if (!activeLocation) {
      setValues((prev) => ({ ...prev, name: '', description: '' }))
    }
  }

  const handleChange = (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="card-header">
        <div>
          <p className="eyebrow">{t('appTitle')}</p>
          <h3>{activeLocation ? t('formEditTitle') : t('formTitle')}</h3>
        </div>
        {activeLocation && (
          <button type="button" className="ghost" onClick={onReset}>
            Clear
          </button>
        )}
      </div>
      <div className="form-grid">
        <label>
          <span>{t('formLabelName')}</span>
          <input
            type="text"
            name="name"
            value={values.name}
            onChange={handleChange('name')}
            placeholder={t('formPlaceholderName')}
            autoComplete="off"
            disabled={!canEdit}
          />
        </label>
        <label className="full">
          <span>{t('formLabelDescription')}</span>
          <textarea
            name="description"
            value={values.description}
            onChange={handleChange('description')}
            placeholder={t('formPlaceholderDesc')}
            rows={3}
            disabled={!canEdit}
          />
        </label>
        <label>
          <span>{t('formLabelColor')}</span>
          <select name="color" value={values.color} onChange={handleChange('color')} disabled={!canEdit}>
            <option value="amber">Amber</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="purple">Purple</option>
            <option value="red">Red</option>
          </select>
        </label>
        <label>
          <span>{t('formLabelStatus')}</span>
          <select
            name="status"
            value={values.status}
            onChange={handleChange('status')}
            disabled={!canEdit}
          >
            <option value="ok">{t('status_ok')}</option>
            <option value="broken">{t('status_broken')}</option>
            <option value="action_required">{t('status_action_required')}</option>
          </select>
        </label>
      </div>
      <p className="muted" style={{ marginTop: 8 }}>
        {t('badgePlacing')}
      </p>
      <div className="actions">
        <button className="primary" type="submit" disabled={loading || !canEdit}>
          {!canEdit
            ? t('formViewOnly')
            : loading
              ? t('formSaving')
              : activeLocation
                ? t('formSave')
                : t('formAdd')}
        </button>
      </div>
    </form>
  )
}

export default LocationForm
