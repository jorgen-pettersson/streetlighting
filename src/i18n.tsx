import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react'

export type Locale = 'en' | 'sv'

type Dictionary = Record<string, string>

export const translations: Record<Locale, Dictionary> = {
  en: {
    appTitle: 'Streetlighting',
    subtitle: 'Map + Firestore',
    signedIn: 'Signed in',
    adminOnly: 'Admin only',
    signOut: 'Sign out',
    addPoint: 'Add point',
    placing: 'Placing…',
    badgePlacing: 'Move + click to set spot',
    badgeCentered: 'Centered on your location',
    badgeDenied: 'Location blocked; showing data',
    badgeDefault: 'Click a marker or add a point',
    pendingLocation: 'Pending location',
    confirmSpot: 'Confirm spot',
    cancel: 'Cancel',
    addFlowHint: 'Move the map and click to set a spot, then confirm to open the form.',
    formTitle: 'Add a point',
    formEditTitle: 'Update location',
    formLabelName: 'Title',
    formLabelDescription: 'Description',
    formLabelLat: 'Latitude',
    formLabelLng: 'Longitude',
    formLabelColor: 'Pin color',
    formLabelStatus: 'Status',
    journalTitle: 'Journal',
    journalAdd: 'Add entry',
    journalTitleLabel: 'Title',
    journalDescLabel: 'Description',
    journalImage1: 'Image (max ~250 KB)',
    journalEmpty: 'No journal entries yet.',
    journalSubmit: 'Save entry',
    journalBy: 'By',
    formPlaceholderName: 'Lamp post near station',
    formPlaceholderDesc: 'Notes, faults, access details',
    formAdd: 'Add point',
    formSave: 'Save changes',
    formSaving: 'Saving…',
    formViewOnly: 'View only',
    formPromptSelect: 'Select a point or confirm a spot to edit.',
    listEmptyEdit: 'Click add point to place one.',
    listEmptyView: 'Waiting for an admin to add points.',
    listEmptyTitle: 'No items yet',
    listDelete: 'Delete',
    popupUntitled: 'Untitled point',
    popupNoDescription: 'No description',
    popupPending: 'Pending spot',
    status_ok: 'OK',
    status_broken: 'Broken',
    status_action_required: 'Action required',
    loginTitle: 'Sign in to continue',
    loginSubtitle: 'Use Google to stay linked to your crew, or continue as a guest to try the map quickly.',
    loginGoogle: 'Sign in with Google',
    loginGuest: 'Continue as guest',
    loginWait: 'Please wait…',
    loginLoading: 'Loading…',
    notFoundTitle: 'Page not found',
    notFoundMessage: 'The route you tried to reach does not exist.',
    backToMap: 'Back to map',
    loadingPoints: 'Loading your points…',
    needAdminAdd: 'Only admins can add points.',
    needAdminSave: 'You need admin access to save points.',
    needAdminDelete: 'You need admin access to delete points.',
  },
  sv: {
    appTitle: 'Röröns Gatubelysning',
    subtitle: 'karta',
    signedIn: 'Inloggad',
    adminOnly: 'Endast admin',
    signOut: 'Logga ut',
    addPoint: 'Lägg till belysning',
    placing: 'Placerar…',
    badgePlacing: 'Flytta + klicka för att sätta plats',
    badgeCentered: 'Centrerad på din plats',
    badgeDenied: 'Platsblockerad; visar data',
    badgeDefault: 'Klicka en markör eller lägg till en belysning',
    pendingLocation: 'Välj plats',
    confirmSpot: 'Bekräfta plats',
    cancel: 'Avbryt',
    addFlowHint: 'Flytta kartan och klicka för att sätta en plats, bekräfta sedan för att öppna formuläret.',
    formTitle: 'Lägg till belysning',
    formEditTitle: 'Uppdatera belysning',
    formLabelName: 'Titel',
    formLabelDescription: 'Beskrivning',
    formLabelLat: 'Latitud',
    formLabelLng: 'Longitud',
    formLabelColor: 'Pinfärg',
    formLabelStatus: 'Status',
    journalTitle: 'Journal',
    journalAdd: 'Lägg till anteckning',
    journalTitleLabel: 'Titel',
    journalDescLabel: 'Beskrivning',
    journalImage1: 'Bild (max ~250 KB)',
    journalEmpty: 'Inga journalanteckningar ännu.',
    journalSubmit: 'Spara anteckning',
    journalBy: 'Av',
    formPlaceholderName: 'Lyktstolpe nära stationen',
    formPlaceholderDesc: 'Anteckningar, fel, åtkomst',
    formAdd: 'Lägg till belysning',
    formSave: 'Spara ändringar',
    formSaving: 'Sparar…',
    formViewOnly: 'Endast läsning',
    formPromptSelect: 'Välj en punkt eller bekräfta plats för att redigera.',
    listEmptyEdit: 'Klicka lägg till för att skapa en punkt.',
    listEmptyView: 'Väntar på att en admin lägger till punkter.',
    listEmptyTitle: 'Inga punkter ännu',
    listDelete: 'Ta bort',
    popupUntitled: 'Namnlös punkt',
    popupNoDescription: 'Ingen beskrivning',
    popupPending: 'Vald plats',
    status_ok: 'OK',
    status_broken: 'Trasig',
    status_action_required: 'Åtgärd krävs',
    loginTitle: 'Logga in för att fortsätta',
    loginSubtitle: 'Använd Google eller gå vidare som gäst för att prova kartan.',
    loginGoogle: 'Logga in med Google',
    loginGuest: 'Fortsätt som gäst',
    loginWait: 'Vänligen vänta…',
    loginLoading: 'Laddar…',
    notFoundTitle: 'Sidan finns inte',
    notFoundMessage: 'Rutten du försökte nå finns inte.',
    backToMap: 'Tillbaka till kartan',
    loadingPoints: 'Laddar dina punkter…',
    needAdminAdd: 'Endast admins kan lägga till punkter.',
    needAdminSave: 'Du behöver adminåtkomst för att spara.',
    needAdminDelete: 'Du behöver adminåtkomst för att ta bort.',
  },
}

export type TranslationKey = keyof typeof translations.en

type I18nContextValue = {
  locale: Locale
  t: (key: keyof typeof translations.en) => string
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'streetlighting_locale'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('sv')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && (stored === 'en' || stored === 'sv')) {
      setLocale(stored)
    }
  }, [])

  const t = (key: keyof typeof translations.en) => translations[locale][key] || key

  const value = useMemo(() => ({ locale, t, setLocale }), [locale])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export const locales: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'sv', label: 'Svenska' },
]
