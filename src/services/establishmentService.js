import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'
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
  // Fast path: slugs collection
  const slugSnap = await getDoc(doc(db, 'slugs', slug))
  if (slugSnap.exists()) {
    const { uid } = slugSnap.data()
    return getEstablishment(uid)
  }

  // Fallback: query establishments directly (handles missing slug doc)
  const q = query(collection(db, 'establishments'), where('slug', '==', slug))
  const snap = await getDocs(q)
  if (!snap.empty) {
    const data = snap.docs[0].data()
    // Auto-repair the missing slug document
    await setDoc(doc(db, 'slugs', slug), {
      uid: data.uid,
      slug,
      businessName: data.businessName,
      createdAt: serverTimestamp(),
    }).catch(() => {}) // non-critical
    return data
  }

  return null
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
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function completeOnboarding(uid, data) {
  await updateEstablishment(uid, { ...data, onboardingCompleted: true })
}
