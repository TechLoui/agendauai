import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

const DEFAULT_WORKING_HOURS = {
  monday:    { open: true,  start: '09:00', end: '18:00' },
  tuesday:   { open: true,  start: '09:00', end: '18:00' },
  wednesday: { open: true,  start: '09:00', end: '18:00' },
  thursday:  { open: true,  start: '09:00', end: '18:00' },
  friday:    { open: true,  start: '09:00', end: '18:00' },
  saturday:  { open: true,  start: '09:00', end: '13:00' },
  sunday:    { open: false, start: '09:00', end: '13:00' },
}

export async function getEstablishment(uid) {
  const snap = await getDoc(doc(db, 'establishments', uid))
  return snap.exists() ? snap.data() : null
}

export async function getEstablishmentBySlug(slug) {
  const slugSnap = await getDoc(doc(db, 'slugs', slug))
  if (!slugSnap.exists()) return null
  const { uid } = slugSnap.data()
  return getEstablishment(uid)
}

export async function createEstablishment(uid, data) {
  const payload = {
    uid,
    ...data,
    workingHours: DEFAULT_WORKING_HOURS,
    slotDuration: 30,
    blockedDates: [],
    advanceDays: 30,
    isActive: true,
    plan: 'free',
    logoUrl: null,
    bannerUrl: null,
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(doc(db, 'establishments', uid), payload)
  return payload
}

export async function updateEstablishment(uid, data) {
  const ref = doc(db, 'establishments', uid)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function completeOnboarding(uid, data) {
  await updateEstablishment(uid, { ...data, onboardingCompleted: true })
}
