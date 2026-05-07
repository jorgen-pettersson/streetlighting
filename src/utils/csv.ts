import { type Location } from '../services/locations'

export function exportToCsv(locations: Location[], locale: 'en' | 'sv') {
  if (locations.length === 0) {
    console.warn('[csv] No locations to export')
    return
  }

  const headers = [
    'ID',
    'Name',
    'Description',
    'Latitude',
    'Longitude',
    'Color',
    'Status',
    'Created At',
    'Updated At',
  ]

  const rows = locations.map((loc) => [
    loc.id,
    escapeCsvField(loc.name),
    escapeCsvField(loc.description || ''),
    loc.lat.toString(),
    loc.lng.toString(),
    loc.color || '',
    loc.status || '',
    loc.createdAt?.toDate().toISOString() || '',
    loc.updatedAt?.toDate().toISOString() || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const filenameBase = locale === 'en' ? 'streetlighting-locations' : 'rorens-gatubelysning'
  const filename = `${filenameBase}_${new Date().toISOString().slice(0, 10)}.csv`

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

function escapeCsvField(value: string): string {
  if (!value) return ''
  const containsSpecialChars = /["\n,]/.test(value)
  if (!containsSpecialChars) return value
  return `"${value.replace(/"/g, '""')}"`
}
