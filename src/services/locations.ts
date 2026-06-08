import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
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
  maintenanceResponsibility?: 'BTEA' | 'Röröns vägbelysning'
  electricSource?: string
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
        maintenanceResponsibility: data.maintenanceResponsibility ?? undefined,
        electricSource: data.electricSource ?? undefined,
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

export async function updateLocation(id: string, input: Partial<LocationInput>, deleteFields: string[] = []) {
  const ref = doc(db, COLLECTION, id)
  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() }
  
  // Add fields to update
  Object.entries(input).forEach(([key, value]) => {
    updates[key] = value
  })
  
  // Mark fields to delete
  deleteFields.forEach((field) => {
    updates[field] = deleteField()
  })
  
  return updateDoc(ref, updates)
}

export async function deleteLocation(id: string) {
  const ref = doc(db, COLLECTION, id)
  return deleteDoc(ref)
}
