import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { enqueueForWhatsApp } from './whatsappService'

function apptRef(uid) {
  return collection(db, 'establishments', uid, 'appointments')
}

export async function getAppointmentsByDate(uid, date) {
  const q = query(apptRef(uid), where('date', '==', date))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getAppointmentsByDateRange(uid, startDate, endDate) {
  const q = query(
    apptRef(uid),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getAllAppointments(uid) {
  const q = query(apptRef(uid), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export function subscribeToTodayAppointments(uid, date, callback) {
  const q = query(apptRef(uid), where('date', '==', date), orderBy('startTime', 'asc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function createAppointment(uid, data) {
  const ref = await addDoc(apptRef(uid), {
    ...data,
    status: 'pending',
    source: 'web',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  // Dispara notificação WhatsApp para o estabelecimento (não bloqueia o fluxo)
  enqueueForWhatsApp(uid, ref.id, data)
  return ref.id
}

export async function updateAppointmentStatus(uid, appointmentId, status) {
  const ref = doc(db, 'establishments', uid, 'appointments', appointmentId)
  await updateDoc(ref, { status, updatedAt: serverTimestamp() })
}

export async function updateAppointment(uid, appointmentId, data) {
  const ref = doc(db, 'establishments', uid, 'appointments', appointmentId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}
