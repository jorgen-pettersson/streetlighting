import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { TranslationKey } from '../i18n'
import { compressImage } from '../utils/image'

type Props = {
  onSubmit: (input: { title: string; description: string; imageData?: string }) => Promise<void>
  onCancel: () => void
  disabled: boolean
  t: (key: TranslationKey) => string
}

export function JournalForm({ onSubmit, onCancel, disabled, t }: Props) {
  const [values, setValues] = useState({ title: '', description: '' })
  const [file1, setFile1] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: keyof typeof values) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleFile = (setter: (file: File | null) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (f && f.size > 10_000_000) {
      setError(t('imageTooLarge'))
      setter(null)
      return
    }
    setError(null)
    setter(f)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (disabled) return
    setSaving(true)
    setError(null)
    let imageData: string | undefined
    if (file1) {
      try {
        setError(t('imageProcessing'))
        imageData = await compressImage(file1, { maxEdge: 1280, maxBytes: 250_000, quality: 0.7, minQuality: 0.4 })
        setError(null)
        if (!imageData) {
          throw new Error('Failed to process image')
        }
        if (imageData.length * 0.75 > 260_000) {
          throw new Error(t('imageStillTooLarge'))
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Image processing failed'
        setError(message)
        setSaving(false)
        return
      }
    }

    await onSubmit({
      title: values.title.trim() || t('journalTitle'),
      description: values.description.trim(),
      imageData,
    })
    setValues({ title: '', description: '' })
    setFile1(null)
    setSaving(false)
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="card-header">
        <div>
          <p className="eyebrow">{t('journalTitle')}</p>
          <h3>{t('journalAdd')}</h3>
        </div>
      </div>
      <div className="form-grid">
        <label>
          <span>{t('journalTitleLabel')}</span>
          <input
            type="text"
            value={values.title}
            onChange={handleChange('title')}
            disabled={disabled}
          />
        </label>
        <label className="full">
          <span>{t('journalDescLabel')}</span>
          <textarea
            value={values.description}
            rows={3}
            onChange={handleChange('description')}
            disabled={disabled}
          />
        </label>
        <label>
          <span>{t('journalImage1')}</span>
          <input type="file" accept="image/*" onChange={handleFile(setFile1)} disabled={disabled} />
        </label>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="actions">
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ghost" type="button" onClick={onCancel} disabled={saving}>
            {t('cancel')}
          </button>
          <button className="primary" type="submit" disabled={disabled || saving}>
            {saving ? t('formSaving') : t('journalSubmit')}
          </button>
        </div>
      </div>
    </form>
  )
}

export default JournalForm
