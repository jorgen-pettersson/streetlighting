import { doc, onSnapshot, type FirestoreError } from 'firebase/firestore'
import { db } from '../firebase'

export type Role = 'admin' | 'viewer'

export function listenToRole(
  email: string,
  onNext: (role: Role) => void,
  onError: (error: FirestoreError) => void,
) {
  const ref = doc(db, 'roles', email.toLowerCase())
  return onSnapshot(ref, (snap) => {
    const data = snap.data()
    if (!data) {
      console.info('[roles] no role doc, default viewer', { email: email.toLowerCase() })
      onNext('viewer')
      return
    }
    const role = (data.role as Role) ?? 'viewer'
    console.info('[roles] role loaded', { email: email.toLowerCase(), role })
    onNext(role)
  }, onError)
}
