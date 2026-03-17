import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type FirestoreError,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export type JournalEntryInput = {
  title: string
  description: string
  image1?: string
  authorId: string
  authorName?: string | null
  authorEmail?: string | null
}

export type JournalEntry = JournalEntryInput & {
  id: string
  createdAt?: Timestamp | null
}

export function listenToJournal(
  locationId: string,
  onNext: (items: JournalEntry[]) => void,
  onError: (error: FirestoreError) => void,
) {
  const base = collection(db, 'locations', locationId, 'journal')
  const q = query(base, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        title: data.title ?? '',
        description: data.description ?? '',
        image1: data.image1 ?? '',
        authorId: data.authorId ?? '',
        authorName: data.authorName ?? '',
        authorEmail: data.authorEmail ?? '',
        createdAt: data.createdAt ?? null,
      } satisfies JournalEntry
    })
    onNext(items)
  }, onError)
}

export function addJournalEntry(locationId: string, input: JournalEntryInput, id?: string) {
  const base = collection(db, 'locations', locationId, 'journal')
  const payload: Record<string, unknown> = {
    ...input,
    createdAt: serverTimestamp(),
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === '') {
      delete payload[key]
    }
  })

  if (id) {
    const ref = doc(base, id)
    return setDoc(ref, payload)
  }

  return addDoc(base, payload)
}
