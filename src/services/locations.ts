import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type FirestoreError,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export type LocationInput = {
  name: string
  description?: string
  lat: number
  lng: number
  color?: string
  status?: 'ok' | 'broken' | 'action_required'
}

export type Location = LocationInput & {
  id: string
  ownerId: string
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
}

const COLLECTION = 'locations'

export function listenToLocations(
  onNext: (items: Location[]) => void,
  onError: (error: FirestoreError) => void,
) {
  const base = collection(db, COLLECTION)
  const q = query(base, orderBy('createdAt', 'desc'))

  return onSnapshot(q, (snapshot) => {
    const mapped = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        name: data.name ?? '',
        description: data.description ?? '',
        lat: Number(data.lat),
        lng: Number(data.lng),
        color: data.color ?? 'amber',
        status: (data.status as Location['status']) ?? 'ok',
        ownerId: data.ownerId,
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      } satisfies Location
    })

    onNext(mapped)
  }, onError)
}

export async function createLocation(input: LocationInput & { ownerId: string }) {
  const collectionRef = collection(db, COLLECTION)
  return addDoc(collectionRef, {
    ...input,
    color: input.color ?? 'amber',
    status: input.status ?? 'ok',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateLocation(id: string, input: Partial<LocationInput>) {
  const ref = doc(db, COLLECTION, id)
  return updateDoc(ref, {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteLocation(id: string) {
  const ref = doc(db, COLLECTION, id)
  return deleteDoc(ref)
}
