import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

function servicesRef(uid) {
  return collection(db, 'establishments', uid, 'services')
}

export async function getServices(uid) {
  const q = query(servicesRef(uid), orderBy('order', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createService(uid, data) {
  const ref = await addDoc(servicesRef(uid), {
    ...data,
    isActive: true,
    order: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateService(uid, serviceId, data) {
  const ref = doc(db, 'establishments', uid, 'services', serviceId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteService(uid, serviceId) {
  const ref = doc(db, 'establishments', uid, 'services', serviceId)
  await deleteDoc(ref)
}
